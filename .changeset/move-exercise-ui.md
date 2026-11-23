---
'@proginone/exercise-ui': minor
---

`@proginone/exercise-ui`를 `ProgInOne/javascript`의 `exercise-ui`에서 떼어 왔습니다.
확신도·힌트·피드백 위젯, 선택형 3종 렌더러와 답안 모델(`ChoiceRenderer`, `choiceInitialAnswer` 등), 코드 에디터를 제공합니다.
에디터는 언어를 모르고 `EditorLanguageSupport`(CodeMirror 확장, 경로 판정, 들여쓰기, 포맷 함수)를 주입받습니다.
`FeedbackBanner`는 체크 종류·실패 이유 문구를 `checkLabels`로 받습니다.
