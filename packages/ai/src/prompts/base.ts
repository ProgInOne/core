import { language } from './language.ts';
import { persona } from './persona.ts';
import type { TutorProfile } from './profile.ts';
import { SAFETY } from './safety.ts';

/**
 * Version of the common instructions (persona, language, safety). Persistent tutor threads are
 * rebuilt on their next turn when it or the TutorProfile version changes, because instructions are
 * fixed at thread start (docs/design/ai-system.md#프롬프트-버전-관리).
 */
export const BASE_INSTRUCTIONS_VERSION = 2;

/** `baseInstructions` of every ProgInOne thread: replaces Codex's coding-agent instructions. */
export function baseInstructions(profile: TutorProfile): string {
  return [persona(profile), language(profile), SAFETY].join('\n\n');
}
