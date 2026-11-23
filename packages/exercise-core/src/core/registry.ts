import type { z } from 'zod';

import { hasProtoKey, withinDepth } from '../common/guards.ts';
import { ExerciseKitError } from './errors.ts';
import type {
  ExerciseCategory,
  ExerciseTypeDef,
  ExerciseTypeId,
  GradeResult,
  RedactOptions,
  RunPlanOptions,
  ServerFindings,
  VerifyIssue,
} from './types.ts';

/**
 * Type-erased view of a registered type. Callers outside the type definitions (server, web,
 * content-cli) go through an {@link ExerciseRegistry}, which validates every untrusted input with
 * the type's schemas before calling the typed implementation.
 */
export interface RegisteredExerciseType {
  id: ExerciseTypeId;
  version: number;
  category: ExerciseCategory;
  weightOverride?: number;
  specSchema: z.ZodType;
  publicSpecSchema: z.ZodType;
  answerSchema: z.ZodType;
  supportsRunPlan: boolean;
  requiresRun(spec: unknown): boolean;
  writing(spec: unknown): boolean;
  redact(spec: unknown, options?: RedactOptions): unknown;
  buildRunPlan(spec: unknown, answer: unknown, options: RunPlanOptions): unknown;
  grade(input: {
    spec: unknown;
    answer: unknown;
    run?: unknown;
    serverFindings?: ServerFindings;
  }): GradeResult;
  verify(spec: unknown): VerifyIssue[];
  leakFingerprints(spec: unknown): string[];
}

/**
 * Erases a typed definition for {@link createExerciseRegistry}. The registry only passes a spec,
 * answer or run to the definition after validating it with the definition's own schemas (and the
 * registry's `parseRun`), which is what makes the casts below sound.
 */
export function registerExerciseType<S, P, A, R, Plan>(
  def: ExerciseTypeDef<S, P, A, R, Plan>,
): RegisteredExerciseType {
  const registered: RegisteredExerciseType = {
    id: def.id,
    version: def.version,
    category: def.category,
    specSchema: def.specSchema,
    publicSpecSchema: def.publicSpecSchema,
    answerSchema: def.answerSchema,
    supportsRunPlan: def.buildRunPlan !== undefined,
    requiresRun: (spec) => def.requiresRun(spec as S),
    writing: (spec) => def.writing?.(spec as S) ?? false,
    redact: (spec, options) => def.redact(spec as S, options),
    buildRunPlan: (spec, answer, options) => {
      if (!def.buildRunPlan)
        throw new ExerciseKitError('RUN_REQUIRED', `${def.id} does not execute code`);
      return def.buildRunPlan(spec as S, answer as A, options);
    },
    grade: ({ spec, answer, run, serverFindings }) => {
      const input: Parameters<typeof def.grade>[0] = { spec: spec as S, answer: answer as A };
      if (run !== undefined) input.run = run as R;
      if (serverFindings !== undefined) input.serverFindings = serverFindings;
      return def.grade(input);
    },
    verify: (spec) => def.verify(spec as S),
    leakFingerprints: (spec) => def.leakFingerprints(spec as S),
  };
  if (def.weightOverride !== undefined) registered.weightOverride = def.weightOverride;
  return registered;
}

/** The part of a registry the template engine needs. */
export interface SpecParser {
  parseSpec: (typeId: string, rawSpec: unknown) => unknown;
}

export interface ExerciseRegistryOptions<Run> {
  /** The language's exercise types, each wrapped with {@link registerExerciseType}. */
  types: readonly RegisteredExerciseType[];
  /**
   * Validates an untrusted sandbox result (the language's runner contract). Returns the parsed
   * result or an error message. Without it, submissions that carry a run result are rejected.
   */
  parseRun?: (raw: unknown) => { success: true; data: Run } | { success: false; error: string };
}

/**
 * Boundary functions over one language's exercise types. Every function validates untrusted input
 * (content source, AI output, learner answers, sandbox results) with the type's schemas, then
 * calls the pure implementation. Bad input throws {@link ExerciseKitError}; a wrong answer is a
 * normal {@link GradeResult}. The functions do not use `this`, so they can be destructured.
 */
export interface ExerciseRegistry<Plan = never> extends SpecParser {
  /** Type IDs registered in this registry, in registration order. */
  implementedExerciseTypes: () => ExerciseTypeId[];
  getExerciseType: (typeId: string) => RegisteredExerciseType | undefined;
  /** Validates a raw spec and applies defaults. Throws `INVALID_SPEC`. */
  parseSpec: (typeId: string, rawSpec: unknown) => unknown;
  /** Validates a learner answer. Throws `INVALID_ANSWER`. */
  parseAnswer: (typeId: string, rawAnswer: unknown) => unknown;
  /** Validates a raw spec and returns the client-safe public spec (answer keys removed). */
  redactSpec: (typeId: string, rawSpec: unknown, options?: RedactOptions) => unknown;
  /** Validates spec and answer, then builds the sandbox run plan. */
  buildRunPlan: (input: {
    typeId: string;
    spec: unknown;
    answer: unknown;
    purpose: RunPlanOptions['purpose'];
  }) => Plan;
  /**
   * Grades a submission. Validates the spec, the answer and (when present) the sandbox run result
   * before calling the pure grader.
   */
  gradeSubmission: (input: {
    typeId: string;
    spec: unknown;
    answer: unknown;
    run?: unknown;
    serverFindings?: ServerFindings;
  }) => GradeResult;
  /**
   * Whether the exercise is a writing (작성형) exercise: the learner writes the code from an empty
   * starter instead of editing given code (D-084). Validates the spec first.
   */
  isWritingExercise: (typeId: string, rawSpec: unknown) => boolean;
  /** Validates a raw spec and returns its answer-leak fingerprints (server only). */
  leakFingerprints: (typeId: string, rawSpec: unknown) => string[];
  /**
   * Schema validation plus static verification in one call, shaped for `content-cli check`:
   * errors are `path: message` strings; verification warnings are returned separately.
   */
  checkSpec: (
    typeId: string,
    rawSpec: unknown,
  ) => { ok: true; warnings: string[]; misconceptions: string[] } | { ok: false; errors: string[] };
  /** Validates a spec and runs the type's static content checks. */
  verifySpec: (typeId: string, rawSpec: unknown) => VerifyIssue[];
  /**
   * Misconception IDs a spec refers to, deduplicated in document order. Every spec field whose
   * name contains "misconception" holds misconception IDs by convention, so new types are covered
   * without registering anything. `content-cli check` verifies that they exist.
   */
  specMisconceptions: (typeId: string, rawSpec: unknown) => string[];
}

function parseWith(
  schema: z.ZodType,
  input: unknown,
  code: 'INVALID_SPEC' | 'INVALID_ANSWER',
  label: string,
): unknown {
  if (!withinDepth(input)) throw new ExerciseKitError(code, `${label} nests too deeply`);
  if (hasProtoKey(input)) throw new ExerciseKitError(code, `${label} contains a __proto__ key`);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ExerciseKitError(
      code,
      `invalid ${label}`,
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  }
  return parsed.data;
}

/**
 * Builds a language's registry from its exercise types (D-096). `Run` and `Plan` are the
 * language's sandbox result and run plan; a registry without code-running types leaves them at
 * `never`. Throws when two types share an ID.
 */
export function createExerciseRegistry<Run = never, Plan = never>(
  options: ExerciseRegistryOptions<Run>,
): ExerciseRegistry<Plan> {
  const types = new Map<ExerciseTypeId, RegisteredExerciseType>();
  for (const def of options.types) {
    if (types.has(def.id)) throw new Error(`exercise type ${def.id} is registered twice`);
    types.set(def.id, def);
  }

  const requireType = (typeId: string): RegisteredExerciseType => {
    const def = types.get(typeId);
    if (!def)
      throw new ExerciseKitError('UNKNOWN_TYPE', `exercise type ${typeId} is not implemented`);
    return def;
  };

  const parseSpec = (typeId: string, rawSpec: unknown): unknown =>
    parseWith(requireType(typeId).specSchema, rawSpec, 'INVALID_SPEC', `${typeId} spec`);

  const parseAnswer = (typeId: string, rawAnswer: unknown): unknown =>
    parseWith(requireType(typeId).answerSchema, rawAnswer, 'INVALID_ANSWER', `${typeId} answer`);

  const verifySpec = (typeId: string, rawSpec: unknown): VerifyIssue[] =>
    requireType(typeId).verify(parseSpec(typeId, rawSpec));

  const specMisconceptions = (typeId: string, rawSpec: unknown): string[] => {
    const found = new Set<string>();
    const collect = (value: unknown, underMisconceptionKey: boolean): void => {
      if (typeof value === 'string') {
        if (underMisconceptionKey) found.add(value);
      } else if (Array.isArray(value)) {
        for (const item of value) collect(item, underMisconceptionKey);
      } else if (value !== null && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
          collect(child, underMisconceptionKey || /misconception/i.test(key));
        }
      }
    };
    collect(parseSpec(typeId, rawSpec), false);
    return [...found];
  };

  return {
    implementedExerciseTypes: () => [...types.keys()],
    getExerciseType: (typeId) => types.get(typeId),
    parseSpec,
    parseAnswer,
    redactSpec: (typeId, rawSpec, redactOptions) =>
      requireType(typeId).redact(parseSpec(typeId, rawSpec), redactOptions),
    buildRunPlan: (input) =>
      requireType(input.typeId).buildRunPlan(
        parseSpec(input.typeId, input.spec),
        parseAnswer(input.typeId, input.answer),
        { purpose: input.purpose },
      ) as Plan,
    gradeSubmission: (input) => {
      const def = requireType(input.typeId);
      const spec = parseSpec(input.typeId, input.spec);
      const answer = parseAnswer(input.typeId, input.answer);
      let run: Run | undefined;
      if (input.run !== undefined) {
        if (!options.parseRun) {
          throw new ExerciseKitError(
            'INVALID_RUN_RESULT',
            'this registry has no runner contract; run results are not accepted',
          );
        }
        const parsed = options.parseRun(input.run);
        if (!parsed.success) throw new ExerciseKitError('INVALID_RUN_RESULT', parsed.error);
        run = parsed.data;
      }
      if (run === undefined && def.requiresRun(spec)) {
        throw new ExerciseKitError('RUN_REQUIRED', `${input.typeId} needs a sandbox run result`);
      }
      return def.grade({
        spec,
        answer,
        ...(run === undefined ? {} : { run }),
        ...(input.serverFindings === undefined ? {} : { serverFindings: input.serverFindings }),
      });
    },
    isWritingExercise: (typeId, rawSpec) => requireType(typeId).writing(parseSpec(typeId, rawSpec)),
    leakFingerprints: (typeId, rawSpec) =>
      requireType(typeId).leakFingerprints(parseSpec(typeId, rawSpec)),
    checkSpec: (typeId, rawSpec) => {
      try {
        const issues = verifySpec(typeId, rawSpec);
        const format = (i: VerifyIssue) => `${i.path ? `${i.path}: ` : ''}${i.message} (${i.code})`;
        const errors = issues.filter((i) => i.severity === 'error').map(format);
        if (errors.length > 0) return { ok: false, errors };
        return {
          ok: true,
          warnings: issues.filter((i) => i.severity === 'warning').map(format),
          misconceptions: specMisconceptions(typeId, rawSpec),
        };
      } catch (error) {
        if (error instanceof ExerciseKitError) {
          return {
            ok: false,
            errors: error.details.length > 0 ? [...error.details] : [error.message],
          };
        }
        throw error;
      }
    },
    verifySpec,
    specMisconceptions,
  };
}
