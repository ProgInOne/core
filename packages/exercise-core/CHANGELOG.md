# @proginone/exercise-core

## 0.2.0

### Minor Changes

- f40bc11: `@proginone/exercise-core`를 `ProgInOne/javascript`의 `exercise-kit`에서 떼어 왔습니다.
  유형 ID는 열린 문자열이고, 언어 저장소가 `createExerciseRegistry({ types, parseRun })`로 자기 레지스트리를 만듭니다.
  실행 결과와 실행 계획은 제네릭 매개변수이고, 채점 결과의 실행 상태는 `RunOutcome`(`ok`, `learner_failure`, `sandbox_failure`)으로 받습니다.
  템플릿 함수는 레지스트리를 첫 인자로 받습니다. 선택형 3종(`mcq_single`, `mcq_multi`, `true_false`)은 `COMMON_EXERCISE_TYPES`로 제공합니다.
