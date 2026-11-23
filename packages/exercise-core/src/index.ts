// Registry factory and boundary functions (validate untrusted input, then call pure graders).
export {
  createExerciseRegistry,
  registerExerciseType,
  type ExerciseRegistry,
  type ExerciseRegistryOptions,
  type RegisteredExerciseType,
  type SpecParser,
} from './core/registry.ts';
export * from './core/types.ts';
export * from './core/errors.ts';
export * from './core/ids.ts';
export { buildResult, type ResultParts, type RunOutcome } from './core/result.ts';

// Language-neutral exercise types.
export { COMMON_EXERCISE_TYPES } from './types/common.ts';
export * from './types/mcq-single.ts';
export * from './types/mcq-multi.ts';
export * from './types/true-false.ts';

// Parametric template engine.
export {
  instantiateTemplate,
  instantiateVariant,
  parseTemplate,
  renderString,
  renderValue,
  resolveParams,
  sampleSeeds,
  templateSchema,
  MAX_CONSTRAINT_ATTEMPTS,
  type ExerciseTemplate,
  type TemplateInstance,
} from './template/engine.ts';
export {
  evaluate as evaluateTemplateExpression,
  toLiteral,
  TEMPLATE_FUNCTIONS,
  type TemplateValue,
} from './template/expr.ts';
export {
  paramSchema,
  paramsSchema,
  paramSpaceSize,
  RESERVED_IDENTIFIERS,
  type ParamDef,
} from './template/params.ts';

// Reusable helpers for language types.
export {
  codeTextSchema,
  displayTextSchema,
  jsonValueSchema,
  localIdSchema,
  uniqueIds,
  type JsonValue,
} from './common/schemas.ts';
export { hasProtoKey, withinDepth, MAX_INPUT_DEPTH } from './common/guards.ts';
export {
  collapseWhitespace,
  leakSet,
  normalizeBlankText,
  normalizeLeakText,
  normalizeOutputLines,
  toHalfWidth,
  unifySmartQuotes,
  unquoteLiteral,
} from './common/normalize.ts';
export {
  createRng,
  deriveSeed,
  seedFromString,
  splitmix64,
  xoshiro128ss,
  type Rng,
} from './common/prng.ts';
