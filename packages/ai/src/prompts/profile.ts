import { z } from 'zod';

// Language-specific wording of the common tutor instructions. Each language repository passes its
// profile to `TaskRunner`; the rest of the instructions are shared (persona, Korean rules, safety).

const line = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[^\n\r<>]+$/, '한 줄로 쓰고 꺾쇠 괄호를 쓰지 않습니다.');

export const tutorProfileSchema = z.strictObject({
  /** Language repository slug (`javascript`, `go`). Part of the instructions version. */
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  /** Bump when any wording below changes: persistent tutor threads are rebuilt on their next turn. */
  version: z.number().int().positive(),
  /** Who the tutor is: `웹 개발 튜터`. Rendered as "너는 ProgInOne의 {tutorRole}다." */
  tutorRole: line,
  /** What the learner studies: `HTML, CSS, JavaScript`. Rendered as "학습자는 {subjects}를 배우는". */
  subjects: line,
  /** Experience the learner may lack: `웹 개발`. Rendered as "{experience} 경험이 거의 없을 수 있다." */
  experience: line,
  /** Scope of tutor answers: `HTML/CSS/JavaScript, 웹 기초`. */
  scope: line,
  /** A term written in Korean and English on first use: `호이스팅(hoisting)`. */
  termExample: line,
  /** Preferred Korean spellings of common terms, in display order. */
  terms: z.array(line).min(1).max(30),
});

export type TutorProfile = z.infer<typeof tutorProfileSchema>;

/** Validates a profile; throws on invalid wording (it is code, so failing fast is right). */
export function defineTutorProfile(profile: TutorProfile): TutorProfile {
  return tutorProfileSchema.parse(profile);
}
