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

## 2026-10-15 — the v0.1.1 release pass (the packaged preview fix)

- `scripts/release.sh 0.1.1` completed green end-to-end (exit 0): preflight
  (the four surfaces — Cargo.toml, src-tauri/Cargo.toml, tauri.conf.json,
  package.json — agree on 0.1.1) → the full QA battery (engine tests, editor
  typecheck + 144 editor specs) → the Windows exe rebuilt from the current
  tree, staged, and re-gated (`releases/phoenix-tekton_0.1.1_x64.exe`) →
  the runtime container tagged `0.1.1` + `latest` with CLI and editor smokes
  ok → the devtool door image rebuilt → the release-page container archive
  (`phoenix-tekton_0.1.1_oci.tar`) saved → `SHA256SUMS` + `RELEASES.txt`
  regenerated → the tag `v0.1.1` anchored on both remotes.
- The fix the release carries (scope branch `fix/exe-preview-csp-protocol`,
  merged to `public-ready`): the packaged preview is interactive again on
  exe · appimage · rpm — an srcdoc iframe inherited the production CSP and
  the artifact's per-document interaction script can never match a fixed
  hash list, so v0.1.0's packaged preview rendered dead-static (the owner
  caught it: the Focus layer dropdown did nothing; dev, being CSP-free,
  always worked). The preview now travels through the shell's
  `blueprint-preview://` custom-protocol route (`set_preview_html` IPC; no
  CSP on the response); `frame-src` alone loosened; browser + web hosts
  keep the srcDoc path; the platform seam (`src/platform/previewSource.ts`)
  keeps host knowledge in the platform layer (full account:
  CHANGELOG `0.1.1`).
- The 0.1.1 native Linux bundles staged: the rpm
  (`phoenix-tekton-0.1.1-1.x86_64.rpm`, ~2.4 MB) and the AppImage
  (`phoenix-tekton_0.1.1_amd64.AppImage`, ~108 MB — rides the GitHub
  Release page); the 0.1.0 staged set retired.
- Owner steps outstanding (no `gh` on this host): draft the GitHub Release
  for tag `v0.1.1` attaching the exe, AppImage, and OCI archive; the mirror
  (`main`) syncs via `scripts/publish-public.sh` when the owner chooses.

## 2026-10-13 — the release folder ships in-repo

- `releases/` now publishes its small set through the gate: the verify-gated
  exe, the rpm, `SHA256SUMS`, and the `RELEASES.txt` running narrative, with
  `releases/README.md` documenting the whole distribution (verification, the
  container load-and-run, the build paths). The two big binaries — the
  AppImage (113 MB) and the OCI container archive (93 MB) — ride the GitHub
  Release page per tag: GitHub's git-blob hard limit is 100 MB, and the
  release page is the versioned, checksum-pointed home for exactly that
  weight. The main README gained the Getting-it door.

## 2026-10-13 — the full distribution set: the Linux bundles + the container archive

- The staged distribution completed: the AppImage (113 MB) and the rpm rebuilt
  natively with the print fix (the Oct-12 pair retired), the container's
  release-page archive saved (`phoenix-tekton_0.1.0_oci.tar` — OCI archive,
  loads with podman/docker) and hashed beside the exe in `SHA256SUMS`; the
  `RELEASES.txt` running narrative carried the pass row via `release.sh`.
- Incidents worth remembering: a box-wide `podman image prune -a` retired the
  freshly-tagged release images (unreferenced = gone) — the release-page
  archive became the durable artifact so box-local tags are only a
  convenience; and `release.sh` learned tag immutability — a pass past an
  existing tag reports the gap instead of re-anchoring a published tag
  (v0.1.0 stays anchored where it was cut; this pass's tooling deltas ship in
  the next version).
- The owner's GitHub Release page distributes the whole set: the
  verify-gated exe, the fresh AppImage + rpm, the container archive, and the
  checksum manifest.

## 2026-10-13 — authorship documentation + the version policy

- The README gained the Authorship section (Dr. Delminquoe L Cunningham,
  UX/UI Architect & Technical Lead Developer, with Sophia™ — PIM's
  trademarked internal LLM assistant) and the H1 carries the standardized
  Phoenix Tekton brand; the agent guide's protected attribution block gained
  the AI-assistant author line.
- The version policy became standing doctrine: `[Unreleased]` = the tracker,
  impact decides the bump (patch/minor/minor-major until 1.0.0); the
  CHANGELOG now carries the `[Unreleased]` section from the v0.1.0 tag
  forward.

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