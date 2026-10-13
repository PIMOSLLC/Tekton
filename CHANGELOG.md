# Changelog

All notable changes to Phoenix Tekton are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[SemVer](https://semver.org/spec/v2.0.0.html).

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

### Desktop and distribution

- The Tauri 2 shell for Windows (x64 exe) and Linux (AppImage, rpm)
- The strict webview CSP with hash-allowlisted scripts and wasm-safe eval
- The `custom-protocol` build gate — a plain-cargo cross-compile cannot
  silently ship a dev-mode exe (`scripts/verify-windows-exe.sh` refuses it:
  every built asset must be present in the binary)
- The container image (Podman/Docker): the studio + CLI, wasm built fresh

### Documentation

- The public docs set: AUTHORING, EDITOR, CLI, ARCHITECTURE,
  DESKTOP_RELEASES, CONTRIBUTING, SECURITY, this changelog