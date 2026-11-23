import type { z } from 'zod';

/**
 * Exercise type ID (`mcq_single`, `implement_function`, …). Open: each language repository
 * registers its own types (D-096). The IDs shipped here are {@link COMMON_EXERCISE_TYPE_IDS}.
 */
export type ExerciseTypeId = string;

/** Type IDs implemented in this package (language-neutral, no code execution). */
export const COMMON_EXERCISE_TYPE_IDS = ['mcq_single', 'mcq_multi', 'true_false'] as const;

/** Evidence category (glossary `ExerciseCategory`, learning-engine.md W_type). */
export const EXERCISE_CATEGORIES = ['recognition', 'recall', 'production'] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

/** Attempt outcome stored in `attempts.outcome` (data-model.md). */
export type GradeOutcome = 'correct' | 'partial' | 'incorrect' | 'error';

export interface FeedbackItem {
  level: 'success' | 'error' | 'warning' | 'info';
  /** Stable machine code (e.g. `MCQ_WRONG_OPTION`). UIs may branch on it. */
  code: string;
  /** Korean display text. Never contains hidden expected values. */
  message: string;
  /** What the item refers to: blank ID, output line (1-based), check ID, milestone ID. */
  target?: string;
  /** Requirement name when the item comes from a check with `requirement`. */
  requirement?: string;
}

export interface CheckResult {
  id: string;
  kind: string;
  passed: boolean;
  required: boolean;
  weight: number;
  visible: boolean;
  description?: string;
  requirement?: string;
  /**
   * Why the check failed: a stable code the language repository defines (`MISMATCH`, `THREW`, …).
   * UIs may branch on it.
   */
  reason?: string;
  /** Expected/actual summary. Present only for visible checks (hidden expectations stay server-side). */
  detail?: { path?: string; expected?: string; actual?: string };
  misconceptionId?: string;
}

export interface MilestoneResult {
  id: string;
  title: string;
  passed: boolean;
}

/**
 * Grader output. Extends the doc's `GradeResult` with the fields the server stores in
 * `attempts` (`outcome`, `engineApplicable`, grader version) and the learning engine reads.
 */
export interface GradeResult {
  /** Binary verdict that counts as "correct" for mastery. */
  correct: boolean;
  outcome: GradeOutcome;
  /** 0..1 partial score (feedback and statistics). */
  score: number;
  feedback: FeedbackItem[];
  /** Misconceptions suggested by this answer, deduplicated, in discovery order. */
  misconceptionIds: string[];
  checkResults?: CheckResult[];
  /** Requirement names with at least one failed check, in check order. */
  failedRequirements?: string[];
  milestones?: MilestoneResult[];
  /** False when the sandbox itself failed (`crashed`/`aborted`): record, but do not feed the engine. */
  engineApplicable: boolean;
  /** `<typeId>@<version>`, stored in `attempts.grading_json`. */
  graderVersion: string;
}

/** Findings the server computes outside the sandbox (static analysis, markup validation, …). */
export type ServerFindings = Readonly<
  Record<string, { passed: boolean; messages?: readonly string[] }>
>;

export interface GradeInput<Spec, Answer, Run = never> {
  spec: Spec;
  answer: Answer;
  /**
   * Sandbox result, already validated by the registry's `parseRun`. Required by run-based types.
   * Its shape belongs to the language repository's runner contract.
   */
  run?: Run;
  serverFindings?: ServerFindings;
}

export interface RedactOptions {
  /** Seed for deterministic option shuffling (the attempt or practice-set item ID). */
  shuffleSeed?: string;
}

export interface RunPlanOptions {
  /** `interactive` (실행 button) includes visible checks only. */
  purpose: 'interactive' | 'grading' | 'verification';
}

export interface VerifyIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
}

/**
 * One exercise type plugin (docs/design/content-and-exercises.md#문제-유형-레지스트리).
 * Pure: no I/O, deterministic. `Run` and `Plan` are the language's sandbox result and run plan;
 * types that never execute code leave them at `never`.
 */
export interface ExerciseTypeDef<Spec, PublicSpec, Answer, Run = never, Plan = never> {
  id: ExerciseTypeId;
  /** Spec schema version. */
  version: number;
  category: ExerciseCategory;
  weightOverride?: number;
  specSchema: z.ZodType<Spec>;
  publicSpecSchema: z.ZodType<PublicSpec>;
  answerSchema: z.ZodType<Answer>;
  /** Whether grading this spec needs a sandbox run result. */
  requiresRun(spec: Spec): boolean;
  /**
   * Whether the learner writes the code themselves (작성형, D-084), e.g. a function to implement
   * from an empty starter. Omitted = never.
   */
  writing?(spec: Spec): boolean;
  /** Removes answer keys. The result is safe to send to the web app. */
  redact(spec: Spec, options?: RedactOptions): PublicSpec;
  /** Run plan for the sandbox (types that execute learner code). */
  buildRunPlan?(spec: Spec, answer: Answer, options: RunPlanOptions): Plan;
  grade(input: GradeInput<Spec, Answer, Run>): GradeResult;
  /** Static content checks (build and AI-generation validation). Execution checks live in content-cli. */
  verify(spec: Spec): VerifyIssue[];
  /**
   * Answer-leak fingerprints (correct option text, accepted answers, expected output, key lines of
   * the reference solution), normalized with `normalizeLeakText`. Server only; stored in
   * `exercises.leak_fingerprints_json` for the AI hint post-check (ai-system.md).
   */
  leakFingerprints(spec: Spec): string[];
}
