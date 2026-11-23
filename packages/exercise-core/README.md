# @proginone/exercise-core

문제 유형 플러그인의 틀과 레지스트리 팩토리, 파라메트릭 템플릿 엔진, 언어와 무관한 선택형 문제 유형을 제공합니다.
I/O가 없는 순수 패키지이며 다른 공통 패키지에 의존하지 않습니다.
규격의 원천은 `ProgInOne/javascript`의 [콘텐츠·문제 시스템 설계][content]이고, 2차 분리의 경계는 [D-096][decisions]입니다.
설치 방법은 [언어 저장소에서 쓰기](/docs/guides/consuming.md)에 있습니다.

[content]: https://github.com/ProgInOne/javascript/blob/develop/docs/design/content-and-exercises.md
[decisions]: https://github.com/ProgInOne/javascript/blob/develop/docs/decisions.md

## 언어 저장소에서 레지스트리 만들기

유형 ID는 열린 문자열이고, 각 언어 저장소가 자기 유형 목록으로 레지스트리를 만듭니다.
코드를 실행하는 유형의 실행 결과(`Run`)와 실행 계획(`Plan`)은 언어의 러너 계약이므로 제네릭 매개변수로 받습니다.

```ts
import {
  COMMON_EXERCISE_TYPES,
  createExerciseRegistry,
  registerExerciseType,
} from '@proginone/exercise-core';

export const registry = createExerciseRegistry<RunResult, RunPlan>({
  types: [...COMMON_EXERCISE_TYPES, registerExerciseType(implementFunction)],
  parseRun: parseRunResult, // 신뢰할 수 없는 실행 결과를 검증: { success, data | error }
});

registry.gradeSubmission({ typeId, spec, answer, run });
```

- 같은 ID를 두 번 등록하면 레지스트리를 만들 때 오류를 던집니다.
- `parseRun`이 없는 레지스트리는 실행 결과가 붙은 제출을 `INVALID_RUN_RESULT`로 거부합니다.
- 유형 정의(`ExerciseTypeDef<Spec, PublicSpec, Answer, Run, Plan>`)는 순수 함수입니다. 레지스트리가 스펙·답안·실행 결과를 스키마로 검증한 뒤에만 정의를 부릅니다.

## 레지스트리의 경계 함수

경계 함수는 신뢰할 수 없는 입력(콘텐츠 원본, AI 출력, 학습자 답안, 샌드박스 결과)을 깊이·`__proto__` 검사와 스키마로 검증한 뒤 순수 구현을 호출합니다.

| 함수 | 용도 |
|---|---|
| `parseSpec(typeId, raw)` | 스펙 검증과 기본값 적용 |
| `parseAnswer(typeId, raw)` | 학습자 답안 검증 |
| `redactSpec(typeId, raw, { shuffleSeed? })` | 정답 키를 제거한 공개 스펙 |
| `buildRunPlan({ typeId, spec, answer, purpose })` | 샌드박스 실행 계획(`Plan`) |
| `gradeSubmission({ typeId, spec, answer, run?, serverFindings? })` | 채점(`GradeResult`) |
| `verifySpec(typeId, raw)` | 정적 콘텐츠 검증(`VerifyIssue[]`) |
| `checkSpec(typeId, raw)` | 스키마 + 정적 검증을 `{ ok, errors \| warnings }` 문자열로 |
| `specMisconceptions(typeId, raw)` | 스펙이 가리키는 오개념 ID(이름에 `misconception`이 든 필드) |
| `leakFingerprints(typeId, raw)` | 정답 누설 지문(AI 힌트 검사용) |
| `getExerciseType(typeId)` | 범주, 스키마, 버전 조회 |
| `isWritingExercise(typeId, raw)` | 작성형 여부(D-084) |

잘못된 입력은 `ExerciseKitError`(`code`: `UNKNOWN_TYPE`, `INVALID_SPEC`, `INVALID_ANSWER`, `INVALID_RUN_RESULT`, `RUN_REQUIRED` 등)를 던집니다.
오답은 오류가 아니라 정상적인 `GradeResult`입니다.

## 채점 결과 만들기

`buildResult(parts)`는 점수를 0~1로 자르고 `outcome`을 정하며 오개념을 중복 없이 모읍니다.
코드를 실행한 유형은 실행 상태를 언어와 무관한 `RunOutcome`으로 바꿔 넘깁니다.

| `RunOutcome` | 뜻 | 결과 |
|---|---|---|
| `ok` | 실행이 끝남 | 정답 판정 그대로 |
| `learner_failure` | 학습자 코드가 예외, 시간 초과, 반복 한도에 걸림 | `outcome: 'error'`, 오답, 학습 엔진에 반영 |
| `sandbox_failure` | 샌드박스 자체가 죽거나 중단됨 | `outcome: 'error'`, `engineApplicable: false` |

## 공통 유형

| 유형 | 범주 | 채점 입력 |
|---|---|---|
| `mcq_single` | recognition | 답안만 |
| `mcq_multi` | recognition | 답안만 |
| `true_false` | recognition(가중치 0.5) | 답안만 |

빈칸 채우기, 순서 맞추기, 출력 예측처럼 코드 실행이나 언어별 비교에 기대는 유형은 언어 저장소에 있습니다.
여러 언어에서 같은 부분이 확인되면 이 패키지로 옮깁니다(D-096).

## 파라메트릭 템플릿

템플릿 함수는 언어의 레지스트리를 첫 인자로 받습니다. 렌더링한 스펙을 그 유형의 스키마로 검증하기 위해서입니다.

| 함수 | 용도 |
|---|---|
| `instantiateTemplate(registry, rawTemplate, seed)` | 시드 하나로 변형 생성. 같은 템플릿·시드 → 항상 같은 결과 |
| `instantiateVariant(registry, rawTemplate, variantId)` | `<템플릿 ID>@<seed>`로 변형 재현 |
| `sampleSeeds(templateId, n)` | 빌드 검증용 결정론적 표본 시드 |
| `paramSpaceSize(params)` | 매개변수 공간 크기 상한 |
| `parseTemplate(raw)` | 템플릿 검증(`INVALID_TEMPLATE`) |

## 언어 유형을 만들 때 쓰는 도구

- 스키마: `localIdSchema`, `displayTextSchema`, `codeTextSchema`, `jsonValueSchema`, `uniqueIds`
- 정규화: `normalizeLeakText`, `leakSet`, `normalizeBlankText`, `normalizeOutputLines`, `unquoteLiteral`
- 결정론적 난수: `createRng`, `seedFromString`, `deriveSeed`
- 입력 검사: `withinDepth`, `hasProtoKey`
- 식별자: `formatVariantId`, `parseVariantId`, `parseSeed`, `exerciseOriginOf`, `variantGroupKey`

## 테스트

```shell
pnpm vitest run packages/exercise-core
```
