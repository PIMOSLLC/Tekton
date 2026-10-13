#!/usr/bin/env bash
# release.sh — the release pass: everything gated, nothing stages on failure.
#
# Surfaces built (container-as-release policy, 2026-10-13):
#   - the Windows exe → releases/phoenix-tekton_<ver>_x64.exe (cross-compile,
#     verify-gated before AND after staging)
#   - the containers  → phoenix-tekton:<ver> + :latest (runtime), plus the
#     devtool dev-door image — smokes gate both (CLI through mounts, editor
#     page/assets on a temp :3060 run)
# The git tag v<ver> anchors the release on both remotes; the GitHub Release
# page remains the owner's manual step (no gh on the build host).
#
# Usage: scripts/release.sh <version>       (e.g. 0.1.0)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VER="${1:?usage: scripts/release.sh <version>}"
TAG="v${VER}"

PATH="$HOME/.cargo/bin:$PATH"
command -v cargo >/dev/null || { echo "cargo not found — is rustup installed?" >&2; exit 1; }
command -v podman >/dev/null || { echo "podman not found" >&2; exit 1; }

say() { printf '\n== %s ==\n' "$1"; }

# ── 0. Preflight — the release tip must be clean and coherent ────────────────
say "preflight"
BRANCH="$(git branch --show-current)"
case "$BRANCH" in main|public-ready) ;; *) echo "refusing: release runs from main/public-ready, not $BRANCH" >&2; exit 1 ;; esac
[[ -z "$(git status --porcelain --untracked-files=no)" ]] || { echo "refusing: uncommitted changes — land first" >&2; exit 1; }

check_version() { # file pattern — the four surfaces must agree on ${VER}
  local file="$1" pat="$2" found
  found=$(grep -m1 -E "$pat" "$file" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+') || found="(none)"
  [[ "$found" == "$VER" ]] || { echo "refusing: $file = $found, expected $VER" >&2; exit 1; }
  echo "  $file: $found"
}
check_version Cargo.toml 'version = '
check_version src-tauri/Cargo.toml 'version = '
check_version src-tauri/tauri.conf.json '"version"'
check_version package.json '"version"'

# ── 1. The QA battery — a failing gate aborts everything ─────────────────────
say "engine QA"
cargo fmt --check
cargo test --workspace

say "editor QA"
npm run typecheck
npm run test

# ── 2. The Windows exe — build, verify, stage, re-verify ─────────────────────
say "windows exe (cross-compile + verify gate)"
npm run desktop:win
TARGET_DIR=$(grep -m1 'target-dir' .cargo/config.toml | sed 's/.*"\(.*\)".*/\1/')
XWIN="$TARGET_DIR/x86_64-pc-windows-msvc/release/phoenix-tekton.exe"
[[ -f "$XWIN" ]] || { echo "exe build output missing at $XWIN" >&2; exit 1; }
EXE="releases/phoenix-tekton_${VER}_x64.exe"
mkdir -p releases
cp -f "$XWIN" "$EXE"
npm run verify:win-exe "$EXE"      # re-gate the staged copy (docs/DESKTOP_RELEASES.md)
SIZE=$(du -h "$EXE" | cut -f1)

# ── 3. The containers — build, tag, smoke ────────────────────────────────────
say "containers"
podman build --target runtime -t "phoenix-tekton:${VER}" -t phoenix-tekton:latest .
podman build --target devtool -t phoenix-tekton-dev:latest .

say "container smokes"
podman run --rm -v "$ROOT/fixtures:/fixtures:Z" -v "$ROOT/out:/out:Z" "phoenix-tekton:${VER}" \
  tekton render /fixtures/agentic-ai-ecommerce.yaml -f standalone -o "/out/release-${VER}.html"
podman run --rm -v "$ROOT/fixtures:/fixtures:Z" "phoenix-tekton:${VER}" tekton validate /fixtures/agentic-ai-ecommerce.yaml
podman run --rm -v "$ROOT/fixtures:/fixtures:Z" "phoenix-tekton:${VER}" tekton lint /fixtures/agentic-ai-ecommerce.yaml >/dev/null
podman rm -f tekton-release-smoke >/dev/null 2>&1 || true
podman run -d --name tekton-release-smoke -p 3060:6041 "phoenix-tekton:${VER}" >/dev/null
sleep 3
CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3060/)
TITLE=$(curl -s http://localhost:3060/ | grep -o '<title>[^<]*</title>' || true)
podman rm -f tekton-release-smoke >/dev/null
[[ "$CODE" == "200" ]] || { echo "editor smoke FAILED: $CODE $TITLE" >&2; exit 1; }
echo "  CLI + editor smokes: ok ($CODE $TITLE)"

# ── 4. The anchor — tag both remotes ─────────────────────────────────────────
say "tag ${TAG} + push"
git tag -f "$TAG"
git push origin "$TAG"
git push public "$TAG"

# ── 5. The report ────────────────────────────────────────────────────────────
say "release ${VER} complete"
echo "  exe:      $EXE ($SIZE)"
echo "  images:   phoenix-tekton:${VER} + :latest  ·  phoenix-tekton-dev:latest"
echo "  tag:      ${TAG} pushed to origin (Gitea) + public (GitHub)"
echo "  owner steps (no gh on this host):"
echo "    1. github.com/PIMOSLLC/Tekton → Releases → Draft a new release → tag ${TAG}"
echo "    2. attach $EXE · notes = CHANGELOG.md [${VER}]"
echo "    3. relaunch the box stack when wanted:"
echo "       podman run -d --name phoenix-tekton -p 3060:6041 --restart unless-stopped phoenix-tekton:${VER}"