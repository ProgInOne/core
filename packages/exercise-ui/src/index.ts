// Shared types.
export {
  CONFIDENCE_LABELS,
  CONFIDENCE_LEVELS,
  type Confidence,
  type RendererBaseProps,
} from './types.ts';

// Practice widgets.
export { ConfidencePicker, type ConfidencePickerProps } from './widgets/ConfidencePicker.tsx';
export { HintLadder, HINT_STEP_LABELS, type HintLadderProps } from './widgets/HintLadder.tsx';
export {
  FeedbackBanner,
  MisconceptionNote,
  type CheckLabels,
  type FeedbackBannerProps,
  type FeedbackResult,
  type MisconceptionInfo,
  type MisconceptionNoteProps,
} from './widgets/FeedbackBanner.tsx';
export { CodeBlock, LANGUAGE_LABELS, type CodeBlockProps } from './widgets/CodeBlock.tsx';
export { Kbd } from './widgets/Kbd.tsx';
export {
  ariaShortcut,
  isApplePlatform,
  matchExerciseShortcut,
  modKeyLabel,
  useExerciseShortcuts,
  type ExerciseShortcut,
  type ExerciseShortcutHandlers,
} from './widgets/shortcuts.ts';
export { InlineText } from './text/InlineText.tsx';

// Choice type renderers and their answer model.
export { McqSingle, type McqSingleProps } from './renderers/McqSingle.tsx';
export { McqMulti, mcqMultiInstruction, type McqMultiProps } from './renderers/McqMulti.tsx';
export { TrueFalse, type TrueFalseDraft, type TrueFalseProps } from './renderers/TrueFalse.tsx';
export {
  CHOICE_TYPE_IDS,
  ChoiceRenderer,
  choiceInitialAnswer,
  choiceNotReadyReason,
  isChoiceAnswerReady,
  isChoiceType,
  parseChoicePublicSpec,
  type ChoiceAnswerByType,
  type ChoiceExercise,
  type ChoicePublicSpecByType,
  type ChoiceRendererProps,
  type ChoiceTypeId,
} from './renderers/choice.tsx';

// Code editor (the language comes from the language repository).
export {
  CodeEditor,
  isFormatShortcut,
  type CodeEditorHandle,
  type CodeEditorProps,
} from './editor/CodeEditor.tsx';
export {
  EditorPane,
  type CodeFile,
  type EditorPaneHandle,
  type EditorPaneProps,
} from './editor/EditorPane.tsx';
export {
  FormatError,
  languageForPath,
  PLAIN_TEXT,
  type EditorLanguageSupport,
} from './editor/language.ts';
