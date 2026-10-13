# Publication log — the running record of what moved where

Owner direction (2026-10-13): every change belonging to a release is documented,
and this log tracks everything that moves to either remote. The split mirror:

- **The internal Gitea origin** — the source of truth. Every commit, every
  branch, WIP included, lives there.
- **The public GitHub mirror** (`PIMOSLLC/Tekton`) — carries `main` only:
  always the current, scrubbed, QA'd state, pushed exclusively through
  `scripts/publish-public.sh` (content gates + the full battery +
  fast-forward-only pushes — public history is append-only).

Entries are listed newest first and appended over time — never rewritten.
This log publishes with the repository, so entries stay host-neutral.

## 2026-10-13 — the v0.1.0 release pass

- `scripts/release.sh 0.1.0` completed green end-to-end (exit 0): preflight
  (coherent versions across the four surfaces) → the full QA battery (engine
  47 tests, editor 141) → the Windows exe rebuilt from the current tree,
  staged, and re-gated (`releases/phoenix-tekton_0.1.0_x64.exe`) → the
  runtime container tagged `0.1.0` + `latest` with CLI and editor smokes ok →
  the devtool door image rebuilt → `SHA256SUMS` regenerated → the tag
  `v0.1.0` anchored on both remotes.
- Fixes the release carries: the engine's print background rule (the artifact
  prints as it reads — a golden test guards it), the container build repair
  (the Tauri shell crate joining the workspace broke the toolchain stage's
  manifest load), the publish gate's self-match proof, and the
  builder-path remap that keeps internal home paths out of shipped binaries.
- The staged manifest narrative (`releases/RELEASES.txt`) gained its dated
  row; `scripts/release.sh` now regenerates both manifest files every pass.

## 2026-10-12 — the public cut and the split mirror

- The GitHub repository was cut to public; honoring the standing rule, the
  CMS fragment export was retired end-to-end (engine, CLI, editor toolbar,
  tests, docs, regenerated mockups) on the `public-cut` scope branch.
- The agent guide (`AGENTS.md`) went public-safe: the protected attribution
  stays verbatim; internal infrastructure moved to the PIMOS umbrella doc.
  The `dev-server.sh` host checks went host-agnostic.
- `scripts/publish-public.sh` landed — the full battery + content gates +
  fast-forward-only push — and proved itself twice the same morning: it
  refused a retired-export string nested inside the shipped assets, then the
  builder-home paths inside the rebuilt wasm.
- The split-mirror policy locked (owner direction): Gitea stays `origin` and
  private; GitHub publishes `main` only. `main` advanced through the phased
  stack as the phase-2 public milestone; WIP scope branches stayed internal.
- The SSH identity was repaired: the singularity key is now the default
  outbound key and the Gitea key (its pinned binding untouched); the prior
  key pair preserved as backups. GitHub + Gitea verified in both directions.

## 2026-10-12 — brand + editor polish (pre-public)

- The application name standardized to "Phoenix Tekton" everywhere: the tab
  title, the Tauri window title + productName, the header wordmark, the
  welcome heading, the CLI about text, and the crate/npm descriptions.
- Latent repo defect fixed: `index.html` (the Vite entry point) had never
  been tracked — the `/*.html` artifact-zone rule was silently excluding it;
  it now ships with an explicit un-ignore.
- The row-card delete controls: the × became the trashcan (with matching
  hover tooltips); the output-format toggle became a fixed announcement chip.
- The selected card now follows its lane through row moves (the drag-reorder
  wiring the committed v1 required to compile).
- Contributor-ready story comments landed on the entry modules.