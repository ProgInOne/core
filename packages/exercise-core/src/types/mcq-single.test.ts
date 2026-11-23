import { describe, expect, it } from 'vitest';

import { mcqSingle, mcqSingleSpecSchema } from './mcq-single.ts';

describe('mcq_single', () => {
  const spec = mcqSingleSpecSchema.parse({
    options: [
      {
        id: 'a',
        text: '`8`',
        misconception: 'js.mc.log-is-return',
        rationale: '출력과 반환을 혼동',
      },
      { id: 'b', text: '`undefined`' },
      { id: 'c', text: '`null`', misconception: 'js.mc.no-return-is-null' },
      { id: 'd', text: '오류가 발생한다' },
    ],
    correct: 'b',
  });

  it('grades the correct option', () => {
    const result = mcqSingle.grade({ spec, answer: { optionId: 'b' } });
    expect(result).toMatchObject({
      correct: true,
      outcome: 'correct',
      score: 1,
      misconceptionIds: [],
    });
    expect(result.graderVersion).toBe('mcq_single@1');
  });

  it('reports the misconception and rationale of a wrong option', () => {
    const result = mcqSingle.grade({ spec, answer: { optionId: 'a' } });
    expect(result).toMatchObject({
      correct: false,
      outcome: 'incorrect',
      score: 0,
      misconceptionIds: ['js.mc.log-is-return'],
    });
    expect(result.feedback[0]).toMatchObject({
      code: 'MCQ_WRONG_OPTION',
      message: '출력과 반환을 혼동',
    });
  });

  it.each(['zzz', '', '__proto__', 'constructor'])(
    'treats unknown option %j as wrong',
    (optionId) => {
      const result = mcqSingle.grade({ spec, answer: { optionId } });
      expect(result).toMatchObject({ correct: false, misconceptionIds: [] });
      expect(result.feedback[0]?.code).toBe('MCQ_UNKNOWN_OPTION');
    },
  );

  it('shuffles public options deterministically by seed only when shuffle is on', () => {
    const a = mcqSingle.redact(spec, { shuffleSeed: 'attempt-1' });
    expect(mcqSingle.redact(spec, { shuffleSeed: 'attempt-1' })).toEqual(a);
    expect(a.options.map((o) => o.id).sort()).toEqual(['a', 'b', 'c', 'd']);
    const seeds = Array.from({ length: 20 }, (_, i) =>
      mcqSingle
        .redact(spec, { shuffleSeed: `s${i}` })
        .options.map((o) => o.id)
        .join(''),
    );
    expect(new Set(seeds).size).toBeGreaterThan(1);
    expect(
      mcqSingle.redact({ ...spec, shuffle: false }, { shuffleSeed: 'x' }).options.map((o) => o.id),
    ).toEqual(['a', 'b', 'c', 'd']);
  });

  it('rejects invalid specs and flags undiagnostic options', () => {
    expect(mcqSingleSpecSchema.safeParse({ ...spec, correct: 'x' }).success).toBe(false);
    expect(
      mcqSingleSpecSchema.safeParse({ ...spec, options: spec.options.slice(0, 2) }).success,
    ).toBe(false);
    expect(
      mcqSingleSpecSchema.safeParse({ ...spec, options: [...spec.options, spec.options[0]] })
        .success,
    ).toBe(false);
    const bad = { ...spec, options: [...spec.options.slice(0, 3), { id: 'd', text: '모두 정답' }] };
    expect(mcqSingle.verify(bad).map((i) => i.code)).toContain('MCQ_BANNED_OPTION');
    expect(mcqSingle.verify(spec)).toEqual([]);
  });
});
