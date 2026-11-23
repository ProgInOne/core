# @proginone/exercise-ui

언어와 무관한 문제 풀이 UI입니다: 확신도·힌트·피드백 위젯, 선택형 3종 렌더러와 답안 모델, 언어를 주입받는 코드 에디터.
React 19와 [`@proginone/ui`](/packages/ui/README.md)의 디자인 토큰을 씁니다.
규격의 원천은 `ProgInOne/javascript`의 [UI/UX 설계][ui-ux]이고, 2차 분리의 경계는 [D-096, D-097][decisions]입니다.
설치 방법은 [언어 저장소에서 쓰기](/docs/guides/consuming.md)에 있습니다.

[ui-ux]: https://github.com/ProgInOne/javascript/blob/develop/docs/design/ui-ux.md
[decisions]: https://github.com/ProgInOne/javascript/blob/develop/docs/decisions.md

## 언어 저장소가 하는 일

이 패키지는 언어를 모릅니다. 언어 저장소는 아래를 채웁니다.

- **유형별 렌더러 고르기**: 자기 유형의 렌더러와 답안 모델을 갖고, 선택형 3종은 `ChoiceRenderer`와 `choiceInitialAnswer`·`isChoiceAnswerReady`·`choiceNotReadyReason`·`parseChoicePublicSpec`에 맡깁니다.
- **체크 문구**: 체크 종류와 실패 이유는 언어의 체크 언어에 속하므로, `FeedbackBanner`에 `checkLabels`(`kind`, `reason` 함수)로 넘깁니다. 모르는 코드는 그대로 보입니다.
- **에디터 언어**: `CodeEditor`의 `language`, `EditorPane`의 `languages`에 `EditorLanguageSupport`를 넘깁니다.

## 에디터 언어: `EditorLanguageSupport`

| 필드 | 뜻 |
|---|---|
| `id` | 언어 키(`js`, `go`). 바뀌면 에디터가 언어 설정을 다시 적용 |
| `matchesPath(path)` | 학습자 파일이 이 언어인지(경로로 판정) |
| `extension()` | CodeMirror 확장: 구문 강조, 들여쓰기 규칙 |
| `indentUnit`, `tabSize` | 들여쓰기 단위(기본 공백 두 칸, Go는 `'\t'`)와 탭 너비(기본 2) |
| `format(code)` | 포맷 명령(`⇧⌥F`). 파싱하지 못하면 `FormatError`로 거부. 없으면 "포맷" 버튼이 사라짐 |

`EditorPane`은 파일 경로마다 `languageForPath(languages, path)`로 언어를 고르고, 맞는 언어가 없으면 `PLAIN_TEXT`(강조·포맷 없음)를 씁니다.
무거운 포맷터는 `format` 안에서 동적으로 불러와 첫 번들에서 빼는 것을 권합니다.

## 구성

| 경로 | 내용 |
|---|---|
| `widgets/` | `ConfidencePicker`, `HintLadder`, `FeedbackBanner`·`MisconceptionNote`, `CodeBlock`, `Kbd`, 단축키(`useExerciseShortcuts` 등) |
| `renderers/` | `McqSingle`, `McqMulti`, `TrueFalse`, 선택형 답안 모델과 `ChoiceRenderer`(`choice.tsx`) |
| `editor/` | `CodeEditor`, `EditorPane`, 에디터 테마, `EditorLanguageSupport`·`FormatError`(`language.ts`) |
| `text/` | `InlineText`(인라인 코드와 강조만 있는 짧은 문구) |
| `styles/exercise-ui.css` | 위 컴포넌트의 스타일(클래스 접두사 `pi-ex-`). 앱이 `@layer components`로 가져오고, 언어 저장소의 문제 스타일을 그 뒤에 둠 |

## 테스트

```shell
pnpm vitest run packages/exercise-ui
```

컴포넌트 테스트는 jsdom에서 돌고 axe-core로 WCAG 2.2 A/AA 위반을 확인합니다. 에디터 테스트는 대역 언어(`src/test/languages.ts`)를 씁니다.
