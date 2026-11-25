# @proginone/shared

## 0.3.0

### Minor Changes

- 2b3a63c: 연습 세트를 마친 뒤 푼 문제를 돌아보는 `GET /practice-sets/:id/review`의 응답 형식 `practiceSetReviewSchema`(`PracticeReviewItem`, `PracticeReviewAttempt`)를 추가했습니다.
  문제마다 마지막 시도의 내 답, 피드백, 오개념과 함께, 학습자가 이미 본 것만 담습니다(해설은 채점된 시도가 있을 때, 정답은 "정답 보기"로 연 적이 있을 때).

## 0.2.0

No changes in this release.

## 0.1.0

### Minor Changes

- 7e8bfec: `ProgInOne/javascript`의 `packages/shared`(develop `2aa2ad80`)를 공통 패키지로 옮겨 처음 배포합니다. 언어별 부분을 덜어 냈습니다(D-092).
  
  - JavaScript 러너 계약(`run-protocol`, `console-format`)은 옮기지 않았습니다. JavaScript 저장소에 남습니다.
  - 과정 언어(`language`, `codeLanguage`)는 어떤 slug든 받습니다(`courseLanguageSchema`).
  - 개념 상세의 `mdnUrl`을 `docUrl`로 바꿨습니다.
  - 코드 초안 파일 경로 규칙은 `codeDraftPathSchema`로 내보냅니다(규칙은 그대로).
