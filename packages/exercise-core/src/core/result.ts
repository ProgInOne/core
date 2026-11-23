import type {
  CheckResult,
  ExerciseTypeId,
  FeedbackItem,
  GradeOutcome,
  GradeResult,
  MilestoneResult,
} from './types.ts';

export interface ResultParts {
  typeId: ExerciseTypeId;
  version: number;
  correct: boolean;
  score: number;
  feedback?: FeedbackItem[];
  misconceptionIds?: readonly (string | null | undefined)[];
  checkResults?: CheckResult[];
  failedRequirements?: string[];
  milestones?: MilestoneResult[];
  /** How the sandbox run went, when the type executed code. */
  run?: RunOutcome;
}

/**
 * The language-neutral reading of a sandbox status. `learner_failure`: the learner's code threw,
 * timed out or hit a loop limit (an answer, but not correct). `sandbox_failure`: the sandbox itself
 * crashed or was aborted (not evidence about the learner). Each language maps its runner's
 * statuses to these.
 */
export type RunOutcome = 'ok' | 'learner_failure' | 'sandbox_failure';

/**
 * Assembles a {@link GradeResult}: clamps the score, derives `outcome`, deduplicates
 * misconceptions and marks sandbox failures as not engine-applicable (learning-engine.md#관측값).
 */
export function buildResult(parts: ResultParts): GradeResult {
  const score = clamp01(parts.score);
  const runFailed = parts.run !== undefined && parts.run !== 'ok';
  const correct = parts.correct && !runFailed;
  let outcome: GradeOutcome;
  if (runFailed) outcome = 'error';
  else if (correct) outcome = 'correct';
  else outcome = score > 0 ? 'partial' : 'incorrect';

  const result: GradeResult = {
    correct,
    outcome,
    score,
    feedback: parts.feedback ?? [],
    misconceptionIds: dedupe(parts.misconceptionIds ?? []),
    engineApplicable: parts.run !== 'sandbox_failure',
    graderVersion: `${parts.typeId}@${parts.version}`,
  };
  if (parts.checkResults) result.checkResults = parts.checkResults;
  if (parts.failedRequirements) result.failedRequirements = parts.failedRequirements;
  if (parts.milestones) result.milestones = parts.milestones;
  return result;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function dedupe(values: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const value of values) if (value) seen.add(value);
  return [...seen];
}
