# @proginone/content-schema

콘텐츠 원본(YAML·MDX 앞부분)의 zod 스키마, slug 규칙, content.db의 DDL과 Drizzle 테이블 정의입니다.
언어 저장소의 콘텐츠 도구(`content-cli`)가 원본을 검증하고 content.db를 만들 때, 서버가 content.db를 읽을 때 함께 씁니다.
규격의 원천은 `ProgInOne/javascript`의 [콘텐츠·문제 시스템 설계][content-design]와 [데이터 모델 설계 > content.db][data-model]입니다.
설치 방법은 [언어 저장소에서 쓰기](/docs/guides/consuming.md)에 있습니다.

[content-design]: https://github.com/ProgInOne/javascript/blob/develop/docs/design/content-and-exercises.md
[data-model]: https://github.com/ProgInOne/javascript/blob/develop/docs/design/data-model.md#contentdb-설계

## 내보내는 것

| 경로 | 내용 |
|---|---|
| `@proginone/content-schema` | 원본 스키마(`packSchema`, `courseSchema`, `moduleSchema`, `conceptSchema`, `misconceptionSchema`, `exerciseSourceSchema` 등), slug 규칙(`courseId`, `conceptId`, `languageId` 등), 템플릿·별칭 스키마 |
| `@proginone/content-schema/db` | `CONTENT_DDL`, `CONTENT_DB_SCHEMA_VERSION`, Drizzle 테이블(`contentTables`) |

## 언어 확장 지점

언어마다 달라지는 값은 공통 스키마에서 열어 두고, 각 언어 저장소가 좁히거나 더합니다(`ProgInOne/javascript`의 [D-092][decisions]).

| 값 | 공통 스키마 | 언어 저장소가 하는 일 |
|---|---|---|
| 과정 언어 `course.language` | 어떤 slug든 받음(`languageId`). DDL에 `CHECK`가 없음 | `courseSchema.extend({ language: z.enum([...]) })`로 다루는 언어만 허용 |
| 개념 참고 문서 | 원본 필드가 없음. content.db에는 일반 이름 `concepts.doc_url` | 원본 필드를 `conceptSchema.extend()`로 더하고(예: JavaScript의 `mdn` 경로), 빌드할 때 `doc_url`로 바꿔 넣음 |
| 문제 유형 `exercise.type` | 소문자 식별자면 받음 | 언어 저장소의 문제 유형 등록부가 실제 유형을 검사 |

```ts
import { conceptSchema, courseSchema } from '@proginone/content-schema';
import { z } from 'zod';

export const goCourseSchema = courseSchema.extend({ language: z.literal('go') });
export const goConceptSchema = conceptSchema.extend({
  pkg: z.string().optional(), // 예: pkg.go.dev 경로 → doc_url
});
```

공통 스키마는 `strictObject`라 확장하지 않은 필드는 거부합니다.
언어 저장소의 스키마는 반드시 공통 스키마를 확장해서 만들고, 따로 정의하지 않습니다.

[decisions]: https://github.com/ProgInOne/javascript/blob/develop/docs/decisions.md

## content.db 스키마 버전

content.db는 `content-cli build`가 매번 새로 만들므로 마이그레이션이 없습니다.
DDL을 바꾸면 `CONTENT_DB_SCHEMA_VERSION`을 올리고, 서버는 버전이 다른 content.db를 열지 않습니다.
`./schema.ts`의 Drizzle 테이블은 DDL과 일치해야 합니다.

| 버전 | 변경 |
|---|---|
| 6 | `courses.language`의 `CHECK` 제거, `concepts.mdn_url` → `concepts.doc_url`(D-092) |
| 5 | `ProgInOne/javascript`에서 옮기기 전 마지막 버전(`exercises.usage`에 `check`, `try` 추가: D-091) |

## 테스트

```shell
pnpm vitest run packages/content-schema
```
