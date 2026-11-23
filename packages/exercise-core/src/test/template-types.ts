import { z } from 'zod';

import {
  createExerciseRegistry,
  registerExerciseType,
  type ExerciseRegistry,
} from '../core/registry.ts';
import type { ExerciseTypeDef } from '../core/types.ts';

// Minimal stand-ins for language types, so template tests exercise spec rendering and spec
// validation through a registry without depending on any language's real exercise types.

function testType<S>(id: string, specSchema: z.ZodType<S>): ExerciseTypeDef<S, S, unknown> {
  return {
    id,
    version: 1,
    category: 'recall',
    specSchema,
    publicSpecSchema: specSchema,
    answerSchema: z.unknown(),
    requiresRun: () => false,
    redact: (spec) => spec,
    grade: () => {
      throw new Error('not gradable');
    },
    verify: () => [],
    leakFingerprints: () => [],
  };
}

/** Shaped like a predict-output spec: code to run and how the answer is read. */
const codeOutputSpec = z.strictObject({
  code: z.string().min(1).max(10_000),
  answerKind: z.enum(['console', 'value']),
  lang: z.string().default('js'),
  misconceptionByAnswer: z.record(z.string(), z.string()).optional(),
});

/** Shaped like a fill-in-the-blank spec: a template with `{{blank:id}}` placeholders. */
const blankSpec = z.strictObject({
  template: z.string().min(1),
  blanks: z.array(
    z.strictObject({
      id: z.string(),
      accept: z.array(z.string()).min(1),
      misconceptionMap: z.record(z.string(), z.string()).optional(),
    }),
  ),
});

export const TEMPLATE_TEST_REGISTRY: ExerciseRegistry = createExerciseRegistry({
  types: [
    registerExerciseType(testType('predict_output', codeOutputSpec)),
    registerExerciseType(testType('fill_blank', blankSpec)),
  ],
});
