#!/usr/bin/env bash
# publish-public.sh — the ONLY door from the internal Gitea stack to the public
# GitHub mirror (github.com/PIMOSLLC/Tekton).
#
# Split-mirror policy (2026-10-12, owner direction):
#   origin = Gitea (private): every commit, every branch, WIP included.
#   public = GitHub: carries `main` only — always the scrubbed, QA'd state.
#            WIP scope branches never publish.
# The published tree must never carry the retired CMS-fragment export or the
# build-host internals; the gates below enforce both, then the full QA battery
# runs, then the push (fast-forward only — public history is append-only).
#
# Usage: scripts/publish-public.sh [remote] [branch]   (defaults: public main)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# The toolchain installs to the home cache on this family of hosts (rustup default).
PATH="$HOME/.cargo/bin:$PATH"
command -v cargo >/dev/null || { echo "cargo not found — is rustup installed?" >&2; exit 1; }

REMOTE="${1:-public}"
BRANCH="${2:-main}"

echo "== Phoenix Tekton public publish: HEAD -> $REMOTE/$BRANCH =="

# 0. Land-what-you-publish: committed history only (untracked scratch is fine).
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "refusing: uncommitted changes — land them on the internal stack first" >&2
  exit 1
fi

# 1. Public-content gates. The retired export must be gone; internal host
# specifics must never reappear. (CHANGELOG is excluded: release history may
# narrate the removal itself.)
if git grep -qi 'word''press' -- crates/ src/ docs/ templates/ README.md AGENTS.md; then
  echo "refusing: retired CMS-fragment export still referenced in the tracked tree" >&2
  exit 1
fi
# (the pattern is split in source so this gate cannot match itself — its own
# regex literals live under scripts/, which it must still be able to search)
SCRUB_PAT='192\.168\.|Min''erva|[Mm]in''erva|admin''phx'
if git grep -qE "$SCRUB_PAT" -- crates/ src/ scripts/ docs/ index.html vite.config.ts; then
  echo "refusing: build-host internals still referenced" >&2
  exit 1
fi

# 2. The full QA battery — a failing gate aborts the push.
echo '== engine QA =='
cargo fmt --check
cargo test --workspace
echo '== editor QA =='
npm run typecheck
npm run test

# 3. Push: default git push = fast-forward; a diverged public target fails
# loudly instead of rewriting public history.
echo '== gates passed — pushing =='
git push "$REMOTE" "HEAD:refs/heads/$BRANCH"

echo "published: $(git rev-parse --short HEAD) -> $REMOTE/$BRANCH"
echo '(GitHub one-offs — default branch, About text, topics — are owner-set in the repo UI.)'