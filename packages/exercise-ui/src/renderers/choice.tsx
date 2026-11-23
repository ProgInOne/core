import {
  mcqMultiPublicSpecSchema,
  mcqSinglePublicSpecSchema,
  trueFalsePublicSpecSchema,
  type McqMultiAnswer,
  type McqMultiPublicSpec,
  type McqSingleAnswer,
  type McqSinglePublicSpec,
  type TrueFalsePublicSpec,
} from '@proginone/exercise-core';
import type { z } from 'zod';
import { McqMulti } from './McqMulti.tsx';
import { McqSingle } from './McqSingle.tsx';
import { TrueFalse, type TrueFalseDraft } from './TrueFalse.tsx';

// The answer model and renderers of the language-neutral choice types. A language repository's
// own exercise model and renderer switch delegate these three types here (D-096).

/** Choice types with a renderer here (the common types of @proginone/exercise-core). */
export const CHOICE_TYPE_IDS = ['mcq_single', 'mcq_multi', 'true_false'] as const;
export type ChoiceTypeId = (typeof CHOICE_TYPE_IDS)[number];

export interface ChoicePublicSpecByType {
  mcq_single: McqSinglePublicSpec;
  mcq_multi: McqMultiPublicSpec;
  true_false: TrueFalsePublicSpec;
}

/** Answer a choice renderer holds; `null` means "nothing chosen yet". */
export interface ChoiceAnswerByType {
  mcq_single: McqSingleAnswer | null;
  mcq_multi: McqMultiAnswer;
  /** Submittable once `value` is set (and `reasonId` when reasons are asked for). */
  true_false: TrueFalseDraft;
}

/** A choice exercise: type ID plus its public spec (discriminated by `typeId`). */
export type ChoiceExercise = {
  [T in ChoiceTypeId]: { typeId: T; spec: ChoicePublicSpecByType[T] };
}[ChoiceTypeId];

const SCHEMAS: { [T in ChoiceTypeId]: z.ZodType<ChoicePublicSpecByType[T]> } = {
  mcq_single: mcqSinglePublicSpecSchema,
  mcq_multi: mcqMultiPublicSpecSchema,
  true_false: trueFalsePublicSpecSchema,
};

export function isChoiceType(typeId: string): typeId is ChoiceTypeId {
  return (CHOICE_TYPE_IDS as readonly string[]).includes(typeId);
}

/** Validates a public spec from the API. `null` for another type or an invalid spec. */
export function parseChoicePublicSpec(typeId: string, raw: unknown): ChoiceExercise | null {
  if (!isChoiceType(typeId)) return null;
  const parsed = SCHEMAS[typeId].safeParse(raw);
  if (!parsed.success) return null;
  return { typeId, spec: parsed.data } as ChoiceExercise;
}

/** Initial (empty) answer: nothing chosen. */
export function choiceInitialAnswer<E extends ChoiceExercise>(
  exercise: E,
): ChoiceAnswerByType[E['typeId']] {
  const initial: ChoiceAnswerByType = {
    mcq_single: null,
    mcq_multi: { optionIds: [] },
    true_false: {},
  };
  return initial[exercise.typeId] as ChoiceAnswerByType[E['typeId']];
}

/** Whether the answer can be submitted: an option (and a reason, when asked for) is chosen. */
export function isChoiceAnswerReady(
  exercise: ChoiceExercise,
  answer: ChoiceAnswerByType[ChoiceTypeId],
): boolean {
  if (answer === null) return false;
  switch (exercise.typeId) {
    case 'mcq_single':
      return 'optionId' in answer && answer.optionId !== '';
    case 'mcq_multi':
      return 'optionIds' in answer && answer.optionIds.length >= exercise.spec.minSelect;
    case 'true_false':
      return (
        'value' in answer &&
        typeof answer.value === 'boolean' &&
        (exercise.spec.reasons === undefined ||
          ('reasonId' in answer && typeof answer.reasonId === 'string'))
      );
  }
}

/** Reason shown by the confidence picker while the answer is not ready. */
export function choiceNotReadyReason(exercise: ChoiceExercise): string {
  switch (exercise.typeId) {
    case 'mcq_single':
      return '답을 먼저 골라 주세요.';
    case 'mcq_multi':
      return exercise.spec.minSelect > 1
        ? `답을 ${exercise.spec.minSelect}개 이상 골라 주세요.`
        : '답을 먼저 골라 주세요.';
    case 'true_false':
      return exercise.spec.reasons ? '참/거짓과 이유를 골라 주세요.' : '참/거짓을 골라 주세요.';
  }
}

export interface ChoiceRendererProps {
  exercise: ChoiceExercise;
  value: ChoiceAnswerByType[ChoiceTypeId];
  onChange: (answer: NonNullable<ChoiceAnswerByType[ChoiceTypeId]>) => void;
  disabled?: boolean;
  labelledBy?: string;
  /** mcq_single: correct option revealed after grading. */
  correctOptionId?: string | null;
}

/** Picks the renderer for a choice exercise. */
export function ChoiceRenderer(props: ChoiceRendererProps) {
  const { exercise, value, onChange, correctOptionId } = props;
  const base = {
    disabled: props.disabled ?? false,
    ...(props.labelledBy === undefined ? {} : { labelledBy: props.labelledBy }),
  };
  switch (exercise.typeId) {
    case 'mcq_single':
      return (
        <McqSingle
          {...base}
          spec={exercise.spec}
          value={value as McqSingleAnswer | null}
          onChange={onChange}
          correctOptionId={correctOptionId ?? null}
        />
      );
    case 'mcq_multi':
      return (
        <McqMulti
          {...base}
          spec={exercise.spec}
          value={value as McqMultiAnswer}
          onChange={onChange}
        />
      );
    case 'true_false':
      return (
        <TrueFalse
          {...base}
          spec={exercise.spec}
          value={value as TrueFalseDraft}
          onChange={onChange}
        />
      );
  }
}
