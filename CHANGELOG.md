# Changelog

All notable changes to Phoenix Tekton are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — the tracker (impact decides the bump, not count)

The queued phase-3 arcs accumulate here; a release pass stamps the section
with its version and date. Docs/tests/tooling-only moves = patch; every
user-visible arc = minor; breaking document/export contracts = minor-major
until 1.0.0 (document-format + PIN-integration stability).

### Fixed — desktop

- The packaged preview is interactive again (exe · appimage · rpm): the
  artifact's per-document interaction script was refused inside the preview
  frame because an srcdoc iframe inherits the production CSP, whose fixed
  hash list can never cover a per-document script — the exe shipped in
  0.1.0 rendered a dead-static preview (the owner caught it on the Focus
  layer dropdown). The preview now travels through a `blueprint-preview://`
  custom-protocol route in the desktop shell (`set_preview_html` IPC, no
  CSP on the response); the browser and web hosts keep the srcDoc path,
  the app CSP stays strict, and the platform seam
  (`src/platform/previewSource.ts`) keeps host knowledge in the platform
  layer only.

## [0.1.0] — 2026-10-12

First public release: the blueprint engine, the visual editor, the CLI, and
the desktop shell — one document format, one engine, three surfaces.

### Engine — `blueprint-core` (pure Rust, wasm32-clean)

- The document model: strict serde (YAML canonical, JSON round-trip) —
  `meta` / `stats` / `stages` / `lanes` (8 semantic kinds) / `note` / `theme`
- Structural validation with card-positioned issues
- The WCAG 2.2 contrast linter: every card-text and stage-tag pair against
  every lane tint, AA + AAA verdicts, spec-accurate relative luminance and
  large-text thresholds, engine-computed replacement suggestions
- Rendering (full standalone HTML, the self-contained artifact) with the
  refusal gate — an inaccessible or malformed document never ships as HTML
- Print fidelity: the artifact prints AS it reads — the shipped `@media
  print` rules force exact print colors, so the navy band, the line-of-
  interaction bands, and the lane tints land on paper (a golden render test
  guards the rule against regression)
- The CMS fragment export retired at the public cut — one render target
  remains, with the format axis kept as a positional API slot
- 34-token theme system with audited presets: light default, dark studio,
  and two AAA high-contrast themes
- 46 tests: unit, structural golden assertions, preset audits,
  starter-seed parity, CLI integration

### Editor (React 18 + Vite + TypeScript strict)

- The studio shell: collapsible StudioNav + pushed, resizable panels
  (280–760px) + the workspace column (header · toolbar · canvas · docked
  terminals · StatusFooter)
- The document lifecycle: starter/example picker, the guided setup wizard,
  Open with YAML/JSON auto-detect, Save / Save JSON named from `meta.title`,
  dirty tracking with confirm-on-New/Open, `beforeunload` guard, and
  localStorage autosave recall
- The Visual Architect panel: lane list, card inspector, per-lane tints with
  warn-and-fix (inline AA verdicts + *Apply suggested color*)
- The Theme panel: all 34 tokens grouped, live contrast verdicts, guarded
  preset apply
- The contrast-lint terminal: docked, boot-closed, footer light always
  visible; navigable findings
- The canvas: dot-grid toggle, pan/zoom with tabular-numeric readout, true
  fit-to-view (with fit-on-init), bottom-center controls
- Export as the pair: the self-contained standalone HTML + the data layer
  (.yaml/.json)
- Row-card delete controls carry the trashcan with matching hover tooltips
  (accessible names word-for-word); the toolbar's output-format group became
  a fixed announcement chip
- Contributor-ready story comments on the entry modules (the composition
  root's ownership map, the host-bootstrap rule, the push-layout primitive,
  the rail contract, the feedback floor)

### Desktop and distribution

- The Tauri 2 shell for Windows (x64 exe) and Linux (AppImage, rpm)
- The strict webview CSP with hash-allowlisted scripts and wasm-safe eval
- The `custom-protocol` build gate — a plain-cargo cross-compile cannot
  silently ship a dev-mode exe (`scripts/verify-windows-exe.sh` refuses it:
  every built asset must be present in the binary)
- The container image (Podman/Docker): the studio + CLI, wasm built fresh
- The container builds again end-to-end: the Tauri shell crate joining the
  workspace had broken the toolchain stage's manifest load; the stage ships
  the manifest and never builds the GUI (the browser boundary stands)

### Release tooling

- `scripts/publish-public.sh` — the QA-gated only door to the public mirror:
  content gates (the retired export and the build-host internals refuse),
  the full battery, fast-forward-only pushes (public history is append-only)
- `scripts/release.sh` — the gated release pass: preflight (branch, clean
  tree, four-surface version coherence) → QA → the verify-gated exe (staged
  + re-gated) → version-tagged containers + smokes → the staging manifest
  (SHA256SUMS + the RELEASES.txt running narrative) → the v-tag on both
  remotes → the owner-step report

### Documentation

- The public docs set: AUTHORING, EDITOR, CLI, ARCHITECTURE,
  DESKTOP_RELEASES, CONTRIBUTING, SECURITY, this changelog
- docs/PUBLICATION_LOG.md — the running record of everything that moves to
  either remote (the split mirror: internal Gitea origin = the source of
  truth; the public GitHub mirror = main only)