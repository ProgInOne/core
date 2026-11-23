import { registerExerciseType, type RegisteredExerciseType } from '../core/registry.ts';
import { mcqMulti } from './mcq-multi.ts';
import { mcqSingle } from './mcq-single.ts';
import { trueFalse } from './true-false.ts';

/**
 * The language-neutral types, ready for `createExerciseRegistry({ types: [...COMMON_EXERCISE_TYPES,
 * ...languageTypes] })`. They never execute code.
 */
export const COMMON_EXERCISE_TYPES: readonly RegisteredExerciseType[] = [
  registerExerciseType(mcqSingle),
  registerExerciseType(mcqMulti),
  registerExerciseType(trueFalse),
];
