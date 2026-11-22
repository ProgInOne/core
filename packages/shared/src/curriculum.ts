import { z } from 'zod';

// Curriculum API responses (GET /courses, /courses/:id, /lessons/:id).

/**
 * A course's language, e.g. `javascript`, `go`. Any slug here; each language repository narrows
 * it to the languages it serves (ProgInOne/javascript D-092), e.g.
 * `courseSummarySchema.extend({ language: z.enum([...]) })`.
 */
export const courseLanguageSchema = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export type CourseLanguage = z.infer<typeof courseLanguageSchema>;

export const IMPORTANCES = ['core', 'standard', 'minor'] as const;
export const importanceSchema = z.enum(IMPORTANCES);

export const courseSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  language: courseLanguageSchema,
  level: z.enum(['intro', 'basic', 'advanced']),
  estimatedMinutes: z.number().int(),
  lessonCount: z.number().int(),
});
export type CourseSummary = z.infer<typeof courseSummarySchema>;

export const courseListSchema = z.object({
  packVersion: z.string(),
  tracks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      courses: z.array(courseSummarySchema),
    }),
  ),
});
export type CourseList = z.infer<typeof courseListSchema>;

export const lessonSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  kind: z.enum(['lesson', 'assessment', 'project']),
  importance: importanceSchema,
  estimatedMinutes: z.number().int(),
  exerciseCount: z.number().int(),
});
export type LessonSummary = z.infer<typeof lessonSummarySchema>;

export const courseDetailSchema = courseSummarySchema.extend({
  objectives: z.array(z.string()),
  modules: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      lessons: z.array(lessonSummarySchema),
    }),
  ),
});
export type CourseDetail = z.infer<typeof courseDetailSchema>;

export const lessonConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  importance: importanceSchema,
  role: z.enum(['introduces', 'practices', 'reviews', 'linked']),
});
export type LessonConcept = z.infer<typeof lessonConceptSchema>;

const lessonRefSchema = z.object({ id: z.string(), title: z.string() }).nullable();

export const lessonDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  kind: z.enum(['lesson', 'assessment', 'project']),
  importance: importanceSchema,
  course: z.object({
    id: z.string(),
    title: z.string(),
    language: courseLanguageSchema,
  }),
  module: z.object({ id: z.string(), title: z.string() }),
  objectives: z.array(z.string()),
  estimatedMinutes: z.number().int(),
  readMinutes: z.number().int(),
  /** Practice exercises of the lesson (the hero's "연습 n문제", D-077). Older servers omit it. */
  practiceCount: z.number().int().min(0).optional(),
  sections: z.array(z.object({ id: z.string(), kind: z.string(), title: z.string().nullable() })),
  /** Validated MDX tree; rendered by the web app's lesson renderer. Untrusted shape: renderer re-checks. */
  body: z.array(z.unknown()),
  /** Concepts of this lesson plus any linked from the body (titles for ConceptLink). */
  concepts: z.array(lessonConceptSchema),
  previous: lessonRefSchema,
  next: lessonRefSchema,
  contentHash: z.string(),
  /**
   * `kind: assessment` only: what the start screen announces (learning-engine.md#단원-평가-세트).
   * `itemCount` is the number of items a new attempt asks.
   */
  assessment: z
    .object({
      itemCount: z.number().int().min(0),
      passRatio: z.number().min(0).max(1),
      conceptCount: z.number().int().min(0),
      estimatedMinutes: z.number().int().min(0),
    })
    .nullable()
    .optional(),
  /**
   * `kind: project` only: the milestone `web_task` and what the project card announces
   * (content-and-exercises.md#프로젝트-단원-kind-project). Progress: `GET /lessons/:id/project`.
   */
  project: z
    .object({
      exerciseId: z.string(),
      milestoneCount: z.number().int().min(0),
      /** Preparation practice items: `POST /practice-sets {kind:'lesson'}` builds their set. */
      practiceCount: z.number().int().min(0),
      estimatedMinutes: z.number().int().min(0),
    })
    .nullable()
    .optional(),
});
export type LessonDetail = z.infer<typeof lessonDetailSchema>;
