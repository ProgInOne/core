import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { COMMON_EXERCISE_TYPES } from '../types/common.ts';
import { ExerciseKitError } from './errors.ts';
import { buildResult } from './result.ts';
import { createExerciseRegistry, registerExerciseType } from './registry.ts';
import { COMMON_EXERCISE_TYPE_IDS, type ExerciseTypeDef } from './types.ts';

const SENTINEL = 'secret';
const ANSWER_KEY_FIELDS = [
  'correct',
  'rationale',
  'misconception',
  'missedMisconception',
  'misconceptionIfWrong',
  'answer',
];

const RAW_SPECS: Record<string, unknown> = {
  mcq_single: {
    options: [
      { id: 'a', text: '`8`', misconception: 'js.mc.secret-a', rationale: 'secret rationale' },
      { id: 'b', text: '`undefined`' },
      { id: 'c', text: '`null`', misconception: 'js.mc.secret-c' },
    ],
    correct: 'b',
  },
  mcq_multi: {
    options: [
      { id: 'a', text: '`let`', missedMisconception: 'js.mc.secret-missed' },
      { id: 'b', text: '`var`', misconception: 'js.mc.secret-b', rationale: 'secret rationale' },
      { id: 'c', text: '`const`' },
      { id: 'd', text: '`int`', misconception: 'js.mc.secret-d' },
    ],
    correct: ['a', 'c'],
    minSelect: 2,
  },
  true_false: {
    statement: '`const`로 선언한 배열에는 `push`를 할 수 없다.',
    answer: false,
    misconceptionIfWrong: 'js.mc.secret-wrong',
    requireReason: true,
    reasons: [
      { id: 'r1', text: 'const는 재할당만 막는다', correct: true },
      { id: 'r2', text: 'const는 값 내부 변경도 막는다', misconception: 'js.mc.secret-r2' },
    ],
  },
};

function collectKeys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) collectKeys(item, out);
  else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      out.add(key);
      collectKeys(child, out);
    }
  }
  return out;
}

function expectKitError(fn: () => unknown, code: string): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ExerciseKitError);
    expect((error as ExerciseKitError).code).toBe(code);
    return;
  }
  throw new Error(`expected ExerciseKitError ${code}`);
}

// A code-running type, standing in for a language's type: the run result says what the program printed.
interface EchoRun {
  status: 'ok' | 'error' | 'crashed';
  output: string;
}
const echoSpec = z.strictObject({
  expected: z.string(),
  misconceptionIfFail: z.string().optional(),
});
const echoAnswer = z.strictObject({ code: z.string().max(1_000) });
const echo: ExerciseTypeDef<
  z.infer<typeof echoSpec>,
  Record<string, never>,
  z.infer<typeof echoAnswer>,
  EchoRun,
  { files: string[] }
> = {
  id: 'echo_task',
  version: 3,
  category: 'production',
  specSchema: echoSpec,
  publicSpecSchema: z.strictObject({}),
  answerSchema: echoAnswer,
  requiresRun: () => true,
  writing: () => true,
  redact: () => ({}),
  buildRunPlan: (_spec, answer) => ({ files: [answer.code] }),
  grade: ({ spec, run }) => {
    const statusMap = { ok: 'ok', error: 'learner_failure', crashed: 'sandbox_failure' } as const;
    const correct = run?.output === spec.expected;
    return buildResult({
      typeId: 'echo_task',
      version: 3,
      correct,
      score: correct ? 1 : 0,
      misconceptionIds: correct ? [] : [spec.misconceptionIfFail],
      ...(run ? { run: statusMap[run.status] } : {}),
    });
  },
  verify: () => [],
  leakFingerprints: (spec) => [spec.expected],
};
const echoRunSchema = z.strictObject({
  status: z.enum(['ok', 'error', 'crashed']),
  output: z.string(),
});

const registry = createExerciseRegistry<EchoRun, { files: string[] }>({
  types: [...COMMON_EXERCISE_TYPES, registerExerciseType(echo)],
  parseRun: (raw) => {
    const parsed = echoRunSchema.safeParse(raw);
    return parsed.success
      ? { success: true, data: parsed.data }
      : { success: false, error: 'bad run' };
  },
});
const commonOnly = createExerciseRegistry({ types: COMMON_EXERCISE_TYPES });

describe('createExerciseRegistry', () => {
  it('registers the common types and the language types', () => {
    expect(commonOnly.implementedExerciseTypes()).toEqual([...COMMON_EXERCISE_TYPE_IDS]);
    expect(registry.implementedExerciseTypes()).toEqual([...COMMON_EXERCISE_TYPE_IDS, 'echo_task']);
    expect(registry.getExerciseType('mcq_single')?.category).toBe('recognition');
    expect(registry.getExerciseType('true_false')).toMatchObject({ weightOverride: 0.5 });
    expect(registry.getExerciseType('echo_task')).toMatchObject({
      category: 'production',
      supportsRunPlan: true,
    });
    expect(registry.getExerciseType('nope')).toBeUndefined();
  });

  it('rejects duplicate type IDs', () => {
    expect(() =>
      createExerciseRegistry({
        types: [...COMMON_EXERCISE_TYPES, ...COMMON_EXERCISE_TYPES.slice(0, 1)],
      }),
    ).toThrow(/registered twice/);
  });

  it('throws UNKNOWN_TYPE for unregistered types', () => {
    expectKitError(() => commonOnly.parseSpec('echo_task', {}), 'UNKNOWN_TYPE');
    expectKitError(
      () => registry.gradeSubmission({ typeId: 'x', spec: {}, answer: {} }),
      'UNKNOWN_TYPE',
    );
  });

  it('validates spec and answer at the boundary, including depth and __proto__ guards', () => {
    expectKitError(() => registry.parseSpec('mcq_single', { options: [] }), 'INVALID_SPEC');
    expectKitError(
      () =>
        registry.gradeSubmission({
          typeId: 'mcq_single',
          spec: RAW_SPECS['mcq_single'],
          answer: { optionId: 7 },
        }),
      'INVALID_ANSWER',
    );
    const proto = JSON.parse('{"optionId": "a", "__proto__": {"x": 1}}') as unknown;
    expectKitError(() => registry.parseAnswer('mcq_single', proto), 'INVALID_ANSWER');
    let deep: unknown = 'leaf';
    for (let i = 0; i < 100; i++) deep = [deep];
    expectKitError(() => registry.parseSpec('mcq_single', deep), 'INVALID_SPEC');
  });

  it('grades common types without a run', () => {
    expect(
      registry.gradeSubmission({
        typeId: 'mcq_single',
        spec: RAW_SPECS['mcq_single'],
        answer: { optionId: 'b' },
      }),
    ).toMatchObject({ correct: true, outcome: 'correct', graderVersion: 'mcq_single@1' });
    expect(
      registry.gradeSubmission({
        typeId: 'mcq_single',
        spec: RAW_SPECS['mcq_single'],
        answer: { optionId: 'a' },
      }),
    ).toMatchObject({ correct: false, misconceptionIds: ['js.mc.secret-a'] });
  });

  it('validates runs with the language contract and maps run outcomes', () => {
    const spec = { expected: 'hi', misconceptionIfFail: 'x.mc.echo' };
    const answer = { code: 'print("hi")' };
    expect(
      registry.buildRunPlan({ typeId: 'echo_task', spec, answer, purpose: 'grading' }),
    ).toEqual({ files: ['print("hi")'] });
    expectKitError(
      () => registry.gradeSubmission({ typeId: 'echo_task', spec, answer }),
      'RUN_REQUIRED',
    );
    expectKitError(
      () =>
        registry.gradeSubmission({ typeId: 'echo_task', spec, answer, run: { status: 'weird' } }),
      'INVALID_RUN_RESULT',
    );
    expect(
      registry.gradeSubmission({
        typeId: 'echo_task',
        spec,
        answer,
        run: { status: 'ok', output: 'hi' },
      }),
    ).toMatchObject({ correct: true, outcome: 'correct', engineApplicable: true });
    expect(
      registry.gradeSubmission({
        typeId: 'echo_task',
        spec,
        answer,
        run: { status: 'error', output: 'hi' },
      }),
    ).toMatchObject({ correct: false, outcome: 'error', engineApplicable: true });
    expect(
      registry.gradeSubmission({
        typeId: 'echo_task',
        spec,
        answer,
        run: { status: 'crashed', output: '' },
      }),
    ).toMatchObject({ outcome: 'error', engineApplicable: false });
    expect(registry.isWritingExercise('echo_task', spec)).toBe(true);
    expect(registry.isWritingExercise('mcq_single', RAW_SPECS['mcq_single'])).toBe(false);
  });

  it('rejects run results when the registry has no runner contract', () => {
    expectKitError(
      () =>
        commonOnly.gradeSubmission({
          typeId: 'mcq_single',
          spec: RAW_SPECS['mcq_single'],
          answer: { optionId: 'b' },
          run: { status: 'ok' },
        }),
      'INVALID_RUN_RESULT',
    );
    expectKitError(
      () =>
        commonOnly.buildRunPlan({
          typeId: 'mcq_single',
          spec: RAW_SPECS['mcq_single'],
          answer: { optionId: 'b' },
          purpose: 'grading',
        }),
      'RUN_REQUIRED',
    );
  });

  it('checkSpec reports schema errors and returns referenced misconceptions', () => {
    expect(registry.checkSpec('mcq_single', { options: [] })).toMatchObject({ ok: false });
    expect(registry.checkSpec('mcq_multi', RAW_SPECS['mcq_multi'])).toMatchObject({
      ok: true,
      misconceptions: ['js.mc.secret-missed', 'js.mc.secret-b', 'js.mc.secret-d'],
    });
    expect(registry.specMisconceptions('true_false', RAW_SPECS['true_false'])).toEqual([
      'js.mc.secret-wrong',
      'js.mc.secret-r2',
    ]);
  });

  it('extracts normalized answer-leak fingerprints', () => {
    expect(registry.leakFingerprints('mcq_single', RAW_SPECS['mcq_single'])).toEqual([
      '`undefined`',
      'undefined',
    ]);
    expect(registry.leakFingerprints('echo_task', { expected: 'hi' })).toEqual(['hi']);
  });
});

describe('answer-key stripping (common types)', () => {
  it.each(COMMON_EXERCISE_TYPE_IDS.map((id) => [id] as const))(
    '%s: no answer key or sentinel survives redaction, and the public spec fits its schema',
    (typeId) => {
      const raw = RAW_SPECS[typeId];
      expect(JSON.stringify(raw).toLowerCase()).toContain(SENTINEL);
      for (const option of [undefined, { shuffleSeed: 'a1' }]) {
        const publicSpec = registry.redactSpec(typeId, raw, option);
        const keys = collectKeys(publicSpec);
        for (const field of ANSWER_KEY_FIELDS)
          expect(keys.has(field), `${typeId}.${field}`).toBe(false);
        expect(JSON.stringify(publicSpec).toLowerCase()).not.toContain(SENTINEL);
        expect(
          registry.getExerciseType(typeId)?.publicSpecSchema.safeParse(publicSpec).success,
        ).toBe(true);
      }
    },
  );
});
