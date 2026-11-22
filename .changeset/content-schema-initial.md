---
'@proginone/content-schema': minor
---

`ProgInOne/javascript`의 `packages/content-schema`(develop `2aa2ad80`)를 공통 패키지로 옮겨 처음 배포합니다. 언어별 값을 열어 두었습니다(D-092).

- `course.language`는 어떤 slug든 받습니다(`languageId`). 언어 저장소가 `courseSchema.extend()`로 다루는 언어만 허용합니다.
- `conceptSchema`에서 `mdn` 필드를 뺐습니다. JavaScript 저장소는 `conceptSchema.extend({ mdn })`로 더합니다.
- content.db 스키마 버전 6: `courses.language`의 `CHECK`를 없애고 `concepts.mdn_url`을 `concepts.doc_url`(Drizzle `docUrl`)로 바꿨습니다.
