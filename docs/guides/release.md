# 릴리스와 배포

공통 패키지(`@proginone/*`)의 버전을 정하고 GitHub Packages에 배포하는 방법입니다.

- 대상: 유지 관리자
- 최종 수정: 2026-11-22
- 받아 쓰는 쪽의 설정은 [언어 저장소에서 쓰기](consuming.md)에 있습니다.

## 배포 종류

| 종류 | 언제 | 버전 | dist-tag | 누가 쓰나 |
|---|---|---|---|---|
| 사전 배포판 | 변경 파일이 남은 채 `develop`에 병합될 때마다 | `<다음 버전>-next.<시각>` (예: `0.2.0-next.20261123041500`) | `next` | 언어 저장소의 `develop` |
| 정식 버전 | `develop` → `main` 병합 | `<버전>` (예: `0.2.0`) | `latest` | 언어 저장소의 `main` 릴리스 |

- 두 배포 모두 [배포 워크플로](#배포-워크플로)가 자동으로 합니다. 사람이 `pnpm publish`를 직접 실행하지 않습니다.
- 모든 패키지는 같은 버전으로 함께 배포합니다(Changesets `fixed`).
- 1.0 이전(`0.x`)에는 minor가 호환성 깨짐을 포함할 수 있습니다. 언어 저장소는 `^0.x.y` 범위로 받으므로 같은 minor 안에서만 자동으로 올라갑니다.

## 사전 배포판

따로 할 일은 없습니다.
변경 파일(`.changeset/*.md`)이 있는 PR을 `develop`에 병합하면 워크플로가 `changeset version --snapshot next`로 임시 버전을 매겨 배포합니다.
이 버전 변경은 커밋하지 않으므로 `develop`의 `package.json` 버전은 그대로입니다.

배포된 사전 배포판 확인:

```shell
gh api /orgs/ProgInOne/packages/npm/<패키지 이름>/versions --jq '.[].name' | head
# 예: gh api /orgs/ProgInOne/packages/npm/shared/versions
```

## 정식 릴리스

릴리스는 PR 두 개로 합니다. 먼저 버전을 올리는 PR을 `develop`에 병합하고, 그다음 `develop`을 `main`으로 병합합니다.

### 버전 PR

1.  최신 `develop`에서 브랜치 `chore/release-v<버전>`을 만듭니다.
1.  남은 변경 파일로 버전과 변경 이력을 만듭니다.

    ```shell
    pnpm changeset version
    ```

    패키지의 `version`이 올라가고, 패키지별 `CHANGELOG.md`에 요약이 추가되며, 쓴 변경 파일은 지워집니다.
1.  올라간 버전과 `CHANGELOG.md`를 확인합니다. 요약이 언어 저장소가 고쳐야 할 점을 충분히 설명하는지 봅니다.
1.  커밋 메시지는 `chore(release): v<버전>`입니다. CI가 통과하면 `develop`에 스쿼시 병합합니다.

### develop → main PR

```shell
gh pr create --base main --head develop --title "release: v<버전>" --body "<CHANGELOG 요약>"
```

- CI가 통과하면 **merge commit**으로 병합합니다(`gh pr merge --merge`).
- 병합되면 배포 워크플로가 레지스트리에 없는 버전을 `latest`로 배포하고, `main`의 merge commit에 태그 `v<버전>`을 붙입니다.

## 배포 워크플로

`.github/workflows/publish.yml`이 `develop`과 `main` 푸시마다 돕니다.

| 단계 | `develop` | `main` |
|---|---|---|
| 버전 | 변경 파일이 있으면 스냅샷 버전을 매김. 없으면 끝냄 | 커밋된 버전 그대로 |
| 빌드 | `pnpm build` | `pnpm build` |
| 배포 | `changeset publish --tag next --no-git-tag` | `changeset publish --no-git-tag`(레지스트리에 이미 있는 버전은 건너뜀) |
| 태그 | 없음 | `v<버전>`이 없으면 붙여 푸시 |

- 인증은 워크플로의 `GITHUB_TOKEN`(`packages: write`)입니다. 따로 비밀 값을 두지 않습니다.
- 배포와 태그 단계는 다시 실행해도 안전합니다. 실패하면 원인을 고친 뒤 `gh run rerun <id>`로 다시 돌립니다.
- 잘못 배포한 버전은 지우지 않고 다음 patch 버전으로 고칩니다. 언어 저장소의 잠금 파일이 이미 그 버전을 가리킬 수 있기 때문입니다.
- 실행 확인: `gh run list --workflow publish.yml`, `gh run watch <id> --exit-status`.

## 관련 문서

- [기여 가이드 > 변경 파일](/CONTRIBUTING.md#변경-파일)
- [언어 저장소에서 쓰기](consuming.md)
