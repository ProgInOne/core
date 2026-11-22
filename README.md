# ProgInOne core

ProgInOne의 학습 언어 저장소들이 함께 쓰는 공통 패키지(`@proginone/*`)를 모아 둔 저장소입니다.
언어와 무관한 학습 엔진, API 계약, 디자인 시스템, 콘텐츠 스키마를 여기서 만들고 GitHub Packages로 배포합니다.

- 언어 저장소: [`ProgInOne/javascript`][js-repo] (HTML·CSS·JavaScript), [`ProgInOne/go`][go-repo] (Go)
- 이 저장소를 만든 결정: `ProgInOne/javascript`의 [D-087, D-090][decisions]

[js-repo]: https://github.com/ProgInOne/javascript
[go-repo]: https://github.com/ProgInOne/go
[decisions]: https://github.com/ProgInOne/javascript/blob/develop/docs/decisions.md

## 패키지

공통 패키지는 세 번에 나눠 언어 저장소에서 옮겨 옵니다([D-090][decisions]).
아직 옮기지 않은 패키지는 "예정"으로 표시합니다.

| 패키지 | 내용 | 상태 |
|---|---|---|
| `@proginone/learning-engine` | 숙련도·FSRS·연습 세트 구성을 계산하는 순수 함수 | 예정(1차) |
| `@proginone/ui` | 디자인 토큰과 기본 React 컴포넌트 | 예정(1차) |
| `@proginone/content-schema` | 콘텐츠 원본의 zod 스키마와 content.db 스키마 | 예정(1차) |
| `@proginone/shared` | 서버와 웹이 공유하는 타입, zod 스키마, API 계약 | 예정(1차) |
| `@proginone/exercise-core` | 문제 유형 등록, 템플릿, 선택형 문제 채점 | 예정(2차) |
| `@proginone/exercise-ui` | 문제 렌더러와 에디터(언어 모드는 주입) | 예정(2차) |
| `@proginone/ai` | AI 작업 실행과 안전 장치(언어별 프롬프트 조각은 주입) | 예정(2차) |

언어마다 다른 부분(콘텐츠, 코드 실행 샌드박스, 채점 검사, 에디터 언어 설정)은 언어 저장소에 둡니다.

## 빠른 시작

Node.js 24와 Corepack이 필요합니다.

```shell
corepack enable
pnpm install
pnpm check   # lint, 포맷, 타입, 테스트, 문서 링크, 빌드, 패키지 설치 점검
```

## 문서

- [문서 지도](/docs/README.md)
- [기여 가이드](/CONTRIBUTING.md): 브랜치, 커밋, 변경 파일(changeset), 언어 저장소와 함께 고치기
- [릴리스와 배포](/docs/guides/release.md)
- [언어 저장소에서 쓰기](/docs/guides/consuming.md)
