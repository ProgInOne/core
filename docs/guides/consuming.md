# 언어 저장소에서 쓰기

언어 저장소(`ProgInOne/javascript`, `ProgInOne/go`)가 공통 패키지를 설치하고, 버전을 고르고, 공통 패키지와 함께 고치는 방법입니다.

- 대상: 언어 저장소 개발자, 기여자
- 최종 수정: 2026-11-23 (pnpm 12의 인증·공급망 설정)

## 레지스트리 설정

`@proginone/*`는 GitHub Packages의 npm 레지스트리에 있습니다.
언어 저장소의 `.npmrc`에 범위만 지정하고, 토큰은 저장소에 넣지 않습니다.

```ini
# 언어 저장소의 .npmrc
@proginone:registry=https://npm.pkg.github.com
```

GitHub Packages는 공개 패키지도 인증해야 내려받을 수 있습니다.
그래서 개발자와 기여자는 `read:packages` 권한이 있는 토큰이 필요합니다.
학습자는 토큰이 필요 없습니다. 언어 저장소의 릴리스 묶음에 공통 패키지가 미리 들어 있기 때문입니다([D-090][decisions]).

[decisions]: https://github.com/ProgInOne/javascript/blob/develop/docs/decisions.md

### 개발 컴퓨터의 토큰

GitHub CLI를 쓰면 그 토큰에 `read:packages`를 더해 사용자 설정(`~/.npmrc`)에 넣습니다.

```shell
gh auth refresh -h github.com -s read:packages
npm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"
```

- GitHub CLI 토큰을 쓰지 않으려면 `read:packages` 권한만 준 [classic 개인 토큰][pat]을 만들어 같은 자리에 넣습니다.
- 토큰은 사용자 설정에만 둡니다. 저장소의 `.npmrc`에 쓰거나 커밋하지 않습니다. pnpm 12는 저장소가 관리하는 `.npmrc`의 인증 설정을 무시합니다("repository-controlled registry credentials" 경고). `${NODE_AUTH_TOKEN}` 같은 환경 변수도 펼치지 않습니다.
- `pnpm install`이 `401`이나 `403`으로 실패하면 토큰이 없거나 `read:packages` 권한이 없는 것입니다.

[pat]: https://docs.github.com/ko/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token

### CI

GitHub Actions에서는 워크플로의 `GITHUB_TOKEN`으로 받습니다.

```yaml
permissions:
  contents: read
  packages: read

steps:
  - uses: actions/setup-node@v7
    with:
      node-version-file: .nvmrc
      cache: pnpm
      registry-url: https://npm.pkg.github.com
      scope: '@proginone'
  - run: pnpm install --frozen-lockfile
    env:
      NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 공급망 지연 규칙

pnpm 12는 기본으로 배포된 지 하루가 안 된 버전을 받지 않습니다(`minimumReleaseAge`).
`next` 사전 배포판은 배포 몇 분 뒤에 쓰므로, 언어 저장소의 `pnpm-workspace.yaml`에서 `@proginone/*`를 이 규칙에서 뺍니다.

```yaml
minimumReleaseAgeExclude:
  - '@proginone/*'
```

### 학습자에게 배포하기

GitHub Packages는 공개 패키지도 토큰이 필요하므로, 언어 저장소의 릴리스 묶음에 `@proginone/*`를 동봉합니다.
JavaScript 저장소는 `tools/vendor-proginone.mjs`가 `npm pack`으로 받아 묶음의 `vendor/`에 넣고 `overrides`(`file:vendor/…tgz`)와 잠금 파일을 다시 만듭니다([D-093][js-d093], [릴리스 절차 > 공통 패키지 동봉][js-vendor]).

[js-d093]: https://github.com/ProgInOne/javascript/blob/develop/docs/decisions.md
[js-vendor]: https://github.com/ProgInOne/javascript/blob/develop/docs/guides/release.md#공통-패키지-동봉

## 버전 고르기

| 언어 저장소 브랜치 | 쓸 수 있는 버전 | 예 |
|---|---|---|
| `develop` | 정식 버전 또는 `next` 사전 배포판 | `"@proginone/shared": "0.2.0-next.20261123041500"` |
| `main`(릴리스) | 정식 버전만 | `"@proginone/shared": "^0.2.0"` |

- 공통 패키지는 모두 같은 버전으로 움직이므로, 언어 저장소도 모든 `@proginone/*`를 같은 버전으로 맞춥니다.
- 사전 배포판은 범위(`^`) 없이 정확한 버전으로 적습니다. 범위로 적으면 다른 사전 배포판으로 바뀔 수 있습니다.
- 언어 저장소가 `main`으로 릴리스하기 전에, 사전 배포판을 쓰던 의존성을 정식 버전으로 바꿉니다. 그 정식 버전이 아직 없으면 먼저 이 저장소를 [릴리스](release.md#정식-릴리스)합니다.
- 버전 목록 확인: `gh api /orgs/ProgInOne/packages/npm/<패키지 이름>/versions --jq '.[].name'`.

## 로컬에서 함께 고치기

공통 패키지와 언어 저장소를 동시에 고칠 때는 배포를 기다리지 않고 로컬 폴더를 연결합니다.
아래 예는 이 저장소를 `~/study/core/platform`, 언어 저장소를 `~/study/<언어>/platform`에 둔 경우입니다.

1.  이 저장소에서 연결할 패키지를 빌드합니다. 언어 저장소는 `dist/`를 읽습니다.

    ```shell
    cd ~/study/core/platform
    pnpm --filter @proginone/shared build
    ```

1.  언어 저장소의 `pnpm-workspace.yaml`에 `overrides`를 **임시로** 더하고 설치합니다.

    ```yaml
    overrides:
      '@proginone/shared': link:../../core/platform/packages/shared
    ```

    ```shell
    cd ~/study/<언어>/platform && pnpm install
    ```

1.  공통 패키지를 고칠 때마다 1번의 빌드를 다시 실행합니다.
1.  끝나면 `overrides`를 지우고 `pnpm install`로 잠금 파일을 되돌립니다. 커밋에는 배포된 버전만 남깁니다.

공통 패키지 쪽 변경을 이 저장소에 먼저 병합해 `next` 버전이 배포되면, 언어 저장소의 PR이 그 버전을 씁니다([기여 가이드](/CONTRIBUTING.md#언어-저장소와-함께-고치기)).

## 관련 문서

- [릴리스와 배포](release.md)
- [GitHub Packages npm 레지스트리 공식 문서][gh-npm]

[gh-npm]: https://docs.github.com/ko/packages/working-with-a-github-packages-registry/working-with-the-npm-registry
