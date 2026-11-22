# @proginone/shared

언어 저장소의 서버와 웹 앱이 함께 쓰는 API 계약입니다: 요청·응답 zod 스키마, 그 타입, 오류 코드.
서버는 응답을 이 스키마로 만들고, 웹 앱은 받은 응답을 이 스키마로 검증합니다.
규격의 원천은 `ProgInOne/javascript`의 [시스템 아키텍처 설계 > API 규약][api]입니다.
설치 방법은 [언어 저장소에서 쓰기](/docs/guides/consuming.md)에 있습니다.

[api]: https://github.com/ProgInOne/javascript/blob/develop/docs/design/system-architecture.md#api-규약

## 내용

| 파일 | 계약 |
|---|---|
| `errors.ts`, `client-errors.ts` | 오류 코드와 오류 응답 형식 |
| `curriculum.ts` | 과정·단원 목록과 상세, 과정 언어(`courseLanguageSchema`) |
| `practice.ts`, `review.ts`, `project.ts` | 연습 세트·시도·복습·오답 노트·프로젝트 |
| `learning.ts`, `activity.ts` | 대시보드, 숙련도, 개념 상세, 학습 시간 |
| `ai.ts`, `tutor.ts` | AI 연결 상태, 튜터 대화 |
| `settings.ts`, `data.ts`, `backups.ts`, `drafts.ts` | 설정, 데이터 내보내기·지우기, 백업, 코드 초안 |

이 패키지는 다른 내부 패키지에 의존하지 않습니다(의존 그래프의 잎).

## 언어 확장 지점

언어마다 달라지는 값은 열어 두고, 각 언어 저장소가 좁힙니다(`ProgInOne/javascript`의 [D-092][decisions]).

- 과정 언어(`course.language`, `codeLanguage` 등)는 어떤 slug든 받습니다(`courseLanguageSchema`). 언어 저장소가 다루는 언어로 좁혀야 할 때는 `courseSummarySchema.extend({ language: z.enum([...]) })`처럼 확장합니다.
- 개념의 참고 문서는 일반 이름 `docUrl`입니다(content.db `concepts.doc_url`). 무엇을 가리키는지(MDN, pkg.go.dev 등)는 언어 저장소가 정합니다.
- 코드 실행 샌드박스와 채점기 사이의 계약(JavaScript 저장소의 `run-protocol`, `console-format`)은 언어별이라 이 패키지에 없습니다. 시도 제출의 `runResult`는 `unknown`으로 받고, 언어 저장소의 채점기가 검증합니다.

[decisions]: https://github.com/ProgInOne/javascript/blob/develop/docs/decisions.md

## 테스트

```shell
pnpm vitest run packages/shared
```
