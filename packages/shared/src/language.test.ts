import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  codeDraftFileSchema,
  conceptDetailSchema,
  courseLanguageSchema,
  courseSummarySchema,
} from './index.ts';

// Language extension points of the API contracts (ProgInOne/javascript D-092).
describe('course language', () => {
  const course = {
    id: 'go-basics',
    title: 'Go 기초',
    summary: 's',
    language: 'go',
    level: 'intro',
    estimatedMinutes: 60,
    lessonCount: 3,
  };

  it('accepts any language slug and rejects other strings', () => {
    expect(courseLanguageSchema.safeParse('javascript').success).toBe(true);
    expect(courseSummarySchema.safeParse(course).success).toBe(true);
    expect(courseSummarySchema.safeParse({ ...course, language: 'Go!' }).success).toBe(false);
  });

  it('lets a language repository narrow the languages it serves', () => {
    const jsCourse = courseSummarySchema.extend({
      language: z.enum(['html', 'css', 'javascript']),
    });
    expect(jsCourse.safeParse(course).success).toBe(false);
    expect(jsCourse.safeParse({ ...course, language: 'css' }).success).toBe(true);
  });
});

describe('concept reference document', () => {
  it('uses the language-neutral docUrl', () => {
    const shape = conceptDetailSchema.shape.concept.shape;
    expect(shape.docUrl.safeParse(null).success).toBe(true);
    expect('mdnUrl' in shape).toBe(false);
  });
});

describe('code draft paths', () => {
  it('keeps the runner file-path rule', () => {
    expect(codeDraftFileSchema.safeParse({ path: 'main.go', content: '' }).success).toBe(true);
    expect(codeDraftFileSchema.safeParse({ path: '../etc/passwd', content: '' }).success).toBe(
      false,
    );
  });
});
