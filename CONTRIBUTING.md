# ProgInOne core 기여 가이드

공통 패키지 저장소에서 작업할 때의 브랜치, 커밋, 변경 파일(changeset), 완료 기준을 정의합니다.
사람과 AI 에이전트 모두 이 가이드를 따릅니다.
언어 저장소와 같은 규칙은 `ProgInOne/javascript`의 [기여 가이드][js-contributing]를 따르고, 이 문서에는 이 저장소에서 다른 점만 씁니다.

[js-contributing]: https://github.com/ProgInOne/javascript/blob/develop/CONTRIBUTING.md

## 작업 흐름

1.  `develop`에서 작업 브랜치를 만듭니다. 접두사와 커밋 메시지 형식은 [언어 저장소와 같습니다][js-contributing].
1.  패키지의 동작이나 공개 API를 바꾸면 `pnpm changeset`으로 [변경 파일](#변경-파일)을 추가합니다.
1.  코드, 테스트, 문서를 같은 PR에서 함께 바꿉니다. PR 하나에는 기능 하나만 담습니다.
1.  CI의 두 검사(`lint · typecheck · test · build`, `pack · consumer smoke`)가 통과하면 `develop`에 스쿼시 병합합니다.
1.  릴리스할 때 `develop`을 `main`으로 merge commit 병합합니다. 절차는 [릴리스와 배포](/docs/guides/release.md)에 있습니다.

### develop과 main

언어 저장소와 같은 두 브랜치 운영입니다([D-090][decisions]).

| 브랜치 | 역할 | 들어오는 PR | 병합 방식 | 배포 |
|---|---|---|---|---|
| `develop` | 기본 브랜치. 다음 릴리스에 들어갈 변경을 모음 | 작업 브랜치 | 스쿼시만, 선형 기록 | 변경 파일이 있으면 `next` 사전 배포판 |
| `main` | 릴리스된 상태 | `develop`만 | merge commit만 | 정식 버전(`latest`)과 태그 `v<버전>` |

- `main`으로 가는 PR은 이 저장소의 `develop`에서만 엽니다. CI 첫 단계가 다른 브랜치에서 온 PR을 실패시킵니다.
- 핫픽스도 `develop`에 병합한 뒤 다시 릴리스합니다. `main` → `develop` 역병합을 만들지 않기 위해서입니다.
- `develop` → `main`을 스쿼시하지 않습니다. 두 브랜치의 기록이 갈라져 다음 릴리스에서 충돌합니다.

[decisions]: https://github.com/ProgInOne/javascript/blob/develop/docs/decisions.md

## 변경 파일

언어 저장소가 받아 쓰는 패키지이므로, 바뀐 점을 [Changesets][changesets] 변경 파일로 남깁니다.
릴리스 때 이 파일들이 버전과 패키지별 `CHANGELOG.md`가 됩니다.

```shell
pnpm changeset
```

- 바뀐 패키지와 올릴 단계(major, minor, patch)를 고르고 요약을 한국어로 씁니다. 요약은 그 패키지를 쓰는 사람이 읽는 문장입니다.
- 모든 패키지는 같은 버전으로 함께 움직입니다(`fixed`). 한 패키지만 바꿔도 릴리스하면 전체 버전이 올라갑니다.
- 1.0 이전(`0.x`)에는 호환성을 깨는 변경을 minor로 올립니다. 요약에 언어 저장소가 고쳐야 할 점을 씁니다.
- 테스트, 문서, CI만 바꾼 PR에는 변경 파일이 필요 없습니다.

[changesets]: https://github.com/changesets/changesets

## 패키지 규칙

- 각 패키지는 `packages/<이름>/`에 두고 `@proginone/<이름>`으로 배포합니다.
- 배포 형식은 `tsc`로 빌드한 `dist/`(JS, `.d.ts`, 소스맵)입니다. TS 원본도 소스맵과 정의 이동을 위해 함께 넣되, 테스트 파일은 빼야 합니다.
- `exports`의 각 항목은 `source`(TS 원본), `types`, `default` 조건을 둡니다. 이 저장소 안의 타입 검사, 린트, 테스트는 `source` 조건으로 원본을 읽고(`tsconfig.base.json`의 `customConditions`, `vitest.config.ts`의 `resolve.conditions`), 빌드(`tsconfig.build.json`)와 언어 저장소는 `dist/`를 읽습니다. 그래서 다른 공통 패키지에 의존하는 패키지도 먼저 빌드하지 않고 검사할 수 있습니다.
- 공통 패키지는 언어별 코드(코드 실행 샌드박스, 언어별 채점 검사, 에디터 언어 모드)에 의존하지 않습니다. 언어마다 달라지는 부분은 주입받는 확장 지점으로 둡니다.
- `pack · consumer smoke` 검사는 묶은 패키지를 빈 프로젝트에 설치해 모든 `exports` 항목이 Node에서 열리고 타입이 잡히는지 확인합니다. 로컬에서는 `pnpm build && pnpm check:packages`입니다.

## 언어 저장소와 함께 고치기

공통 패키지와 언어 저장소를 함께 바꿔야 할 때는 [언어 저장소에서 쓰기 > 로컬에서 함께 고치기](/docs/guides/consuming.md#로컬에서-함께-고치기)를 따릅니다.
순서는 이 저장소의 PR을 먼저 `develop`에 병합해 `next` 버전을 배포하고, 언어 저장소의 PR이 그 버전을 쓰는 것입니다.

## 완료 정의

1.  `develop`에 병합되었고 CI의 두 검사가 통과했습니다.
1.  공개 API를 바꿨다면 변경 파일과 패키지 README가 함께 바뀌었습니다.
1.  이 변경을 쓰는 언어 저장소가 있다면, 그 저장소에서 `next` 버전으로 확인했습니다.
