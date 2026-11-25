---
'@proginone/shared': minor
---

연습 세트를 마친 뒤 푼 문제를 돌아보는 `GET /practice-sets/:id/review`의 응답 형식 `practiceSetReviewSchema`(`PracticeReviewItem`, `PracticeReviewAttempt`)를 추가했습니다.
문제마다 마지막 시도의 내 답, 피드백, 오개념과 함께, 학습자가 이미 본 것만 담습니다(해설은 채점된 시도가 있을 때, 정답은 "정답 보기"로 연 적이 있을 때).
