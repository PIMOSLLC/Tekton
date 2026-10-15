# AGENTS.md - Phoenix Tekton

> **PROTECTED SECTION — DO NOT REMOVE OR MODIFY**
>
> The Project Attribution section below is protected and must be preserved in all operations.

---

## Project Attribution

**PIM Author:** Dr. Delminquoe L Cunningham
**Role:** UX/UI Architect & Technical Lead Developer
**Email:** info@phoenixinceptionsmediallc.com
**Company:** Phoenix Inceptions Media LLC
**AI Assistant:** Sophia™ — Phoenix Inceptions Media LLC's trademarked internal LLM assistant, co-creation assistance

### Coding Standards

Senior-level practices throughout: WCAG 2.2 AA, strong typing, comprehensive testing, Human-First documentation (comments explain "why", not "what"). Full ecosystem conventions live in Phoenix Inceptions Media's private design-system documentation.

**Design standards (2026-10-11, owner direction) — graphic-design + Gestalt principles are QA gates, not afterthoughts. Minor typography/layout errors are never "baked in". Before calling visual work done:**
- **Typography**: no orphaned last words in headings/buttons (use `text-balance` on cards/heads/sublines); ragged wraps balanced; consistent type scale (one rem rhythm per surface); `font-variant-numeric: tabular-nums` for any live-changing number (counters, zoom %).
- **Gestalt**: related controls group by PROXIMITY (paddings/gaps tell the story — no hairline-divided twins); SAME things look identical (SIMILARITY: all segmented toggles share one pill pattern); COMMON REGION beats extra chrome (a panel/badge labels its contents — e.g. the toolbar's groups are one shared pill pattern with group labels in `aria-label`s); figure/ground for overlays (scrim + shadow separates modal from workspace — nothing floats ambiguously); CONTINUITY: grids align to a consistent column rhythm (inputs, cards, rows share left/right edges).
- **Hierarchy**: one primary action per view; the accent color is a SCARCE resource (never two competing CTAs); muted text means hierarchy, not decoration.
- **Feedback**: states visible (armed/pressed/gated), motion respects `prefers-reduced-motion`, and every state change is announced or shown — never hover-only.

### License

Copyright © 2026 Phoenix Inceptions Media LLC. All rights reserved.

---

## What Tekton Is

**Tekton** (τέκτων — "builder, craftsman"; the root of "architect") is a **service blueprint studio**: a Tauri 2 desktop application that authors, WCAG-lints, and exports interactive service blueprints.

Born from the hand-built `agentic_ecommerce_service_blueprint.html` (the Serta Simmons case study on delminquoelcunningham.com) — that artifact's data model and its hard-won accessibility engineering became this tool's specification. Every lesson from the artifact's eight revision passes is baked into the engine: scoped selectors, pre-rendered static DOM, `aria-expanded`/`aria-controls`, sticky-header offsets, drawer flexbox fix, reduced-motion, print rules, hue-230 navy palette.

**Architecture:**

| Piece | Crate/folder | Notes |
|---|---|---|
| Engine | `crates/blueprint-core` | Pure Rust: serde model, validation, WCAG 2.2 contrast linter, renderer. **No Tauri, no I/O** — stays wasm32-clean for the Nexus integration |
| WASM bindings | `crates/blueprint-wasm` | Thin wrappers over the engine for browser/PIN hosts |
| Desktop shell | `src-tauri/` | Tauri 2 (phase 2) |
| Editor | `src/` | React 18 + Vite + TS strict, Tekhne-token themed |

## Architecture (platform scaffolding)

Modularity is the contract that makes the Rust cross-platform app and the future PIN module possible. Layers, strictest first:

| Layer | Contents | Rule |
|---|---|---|
| **Rust core** | `crates/blueprint-core` | Pure, no I/O, wasm32-clean — the engine (model, validate, lint, render) |
| **Bindings** | `crates/blueprint-wasm` (+ future `crates/blueprint-tauri-commands`) | Thin wrappers over the core only |
| **Editor core** | `src/core/useBlueprintDocument.ts` | All document state + engine pipeline + edit ops. **No platform imports** — any shell (web/Tauri/PIN) composes it |
| **Presentational** | `src/*.tsx` components | Pure props-in/components-out; no engine or state imports |
| **Platform shell** | `src/main.tsx` + `src/App.tsx` | The ONLY layer that may know how it is hosted (engineService adapter picks wasm vs invoke) |

**YAML is the headless authoring format**: a blueprint can be written entirely without
the visual editor (hand or `tekton` CLI) — the visual editor is a view of the same
document. Editor UX decisions follow from this (the YAML panel is a first-class,
wider authoring surface, not a raw peek).

**Shell model**: collapsible StudioNav (56px icons ↔ 240px labeled menu — a panel menu,
not a static thin rail; no horizontal overflow by construction) → pushing
ExpandablePanel (architect 260px / YAML 460px — the panel PUSHES the canvas; nothing
overlays; no click-outside-to-close — it is a persistent workspace pane, Esc closes,
one layer at a time) → workspace column (toolbar / canvas or preview / docked lint
terminal / status footer). The standalone shell adds a brand + document-identity bar
(`AppHeader`; the toolbar keeps output controls only); PIN-host mode (the
`__PIN_HOST__` global, set by the toolkit host) suppresses it — PIN's own Layout owns
the top chrome; one brand bar, never two.

## Repository

- **Public home (this repository):** `github.com/PIMOSLLC/Tekton` — the public mirror carries `main` only: always the current, QA'd, scrubbed state.
- **Development model:** Phased Development Branching Protocol — phase branches (`phase-1-rust-core` → `phase-2-tauri-editor` → `phase-3-product-polish`), each stacked off the previous phase's branch; merge to `main` at milestones. **Major changes branch FIRST:** features, restructures, engine/model changes, and anything beyond a small fix land on a scope branch cut from the current phase branch (`git checkout -b <change-scope>`), QA'd there, merged back after — never straight onto the phase branch.

## Hard Constraints

- **npm only** — the workspace installs and runs with npm; other package managers are not supported here.
- **Engine build output lives off the working tree** via `.cargo/config.toml` (`target-dir` in the operator's cache). Never move engine build output back onto an NFS-mounted workspace.
- **`blueprint-core` must stay pure**: no Tauri, no filesystem, no async runtime. It compiles to `wasm32-unknown-unknown` for the Phoenix Insight Nexus integration. If a dependency can't build on wasm32, it doesn't belong in the core.
- **PIN integration contract (future phase)**: Tekton lands as a Phoenix Insight Nexus toolkit module — `shared/types/tekton.ts` + storage key `blueprint` + route `/projects/:id/tekton`, served by the generic `/toolkit/:projectId/toolkit/:tool` endpoint. No new per-module backend routes.
- **Blueprint persistence model**: the document is a seedable artifact saved as **files** (`.yaml` canonical + `.json` structured, JSON auto-detected by the wasm `load_source` binding) whose name derives from slugified `meta.title`. Adapters in `src/platform/persistence.ts` are the only storage seam: browser = download/upload + localStorage autosave (`tekton.workspace`; recall boots **dirty** — restored work is unsaved work); Tauri = native dialogs (plugin-dialog/fs) behind the same interface; **PIN = the existing `toolkit_instances` JSONB row (`tool = 'blueprint'`) via the generic endpoint, `toolkit_snapshots` as history — no new tables, no new routes**; the row payload shape is `getJson()` output. Starter seeds live in `templates/starter.yaml` (commented teaching format) + `starter.json`, parity-locked by `crates/blueprint-core/tests/templates.rs`.
- **App profile**: `src/platform/appProfile.ts` is the single home for **user settings/preferences** (boot invitation flag, panel-width overrides) — `tekton.appProfile` in localStorage, legacy `tekton.panelWidths` migrated on first read; **PIN era: same interface, PIN's unified settings storage as the implementation** — the seam swaps, the editor doesn't. The setup wizard opens as a **boot invitation** (centered brand moment + two glass action cards + "don't show again") until the profile opts out; the wizard modal itself is the dominant guided surface (`max-w-3xl`, glass, 4 steps).
- **Phoenix theming**: `data-phoenix-theme="..."` attribute required or Tekhne CSS variables silently resolve to nothing. The **editor UI** uses Tekhne tokens (start from the Tekhne design system's blank theme template); the **rendered blueprint output** uses the document's own theme — exported HTML must be fully self-contained (it leaves the Tekhne context entirely).
- **Named exports only** — no default exports; barrel via `index.ts`.
- **Document-before-move** — no tag lands without its CHANGELOG entry and a
  publication-log row (`docs/PUBLICATION_LOG.md`); the log ships, entries
  stay host-neutral.
- **Tauri GUI system deps (Fedora):** `sudo dnf install webkit2gtk4.1-devel gtk3-devel librsvg2-devel openssl-devel curl-devel`

## Release discipline (2026-10-13, owner direction)

- **Document before it moves.** Every release pass documents its changes — the
  CHANGELOG gains its per-surface bullets BEFORE the tag is cut, and the staged
  manifest (`releases/RELEASES.txt` = the running narrative, newest row prepended
  per pass; `releases/SHA256SUMS` = mechanical hashes of the staged set) is
  regenerated by `scripts/release.sh`, never hand-edited.
- **Retired binaries archive, never die** (owner direction, 2026-10-15): a new
  pass MOVES the superseded staged set into `releases/archive/` (local-only,
  gitignored for now — resources are kept, not pushed). `release.sh` steps 0b
  does the archive; the manifest globs never see it.
- **The running log ships.** `docs/PUBLICATION_LOG.md` records EVERYTHING that
  moves to either remote (release passes, tags, branch pushes, mirror syncs) —
  newest first, appended forever, never rewritten. It publishes with the
  repository: entries stay host-neutral.
- **The release surfaces.** The verify-gated Windows exe, the version-tagged
  runtime container (+ `latest`) and its **release-page OCI archive** (the
  durable artifact — `podman image prune -a` retires box-local tags no
  container references; the archive loads with `podman load` / `docker load`
  anywhere and is what the GitHub Release page distributes), the devtool door
  image, and the git tag — one command: `scripts/release.sh <version>`. Nothing
  stages unless every gate passes; the containers' smoke tests (CLI through
  mounts, the editor page/assets) are their verify gate, the same role
  `verify:win-exe` plays for the exe. **Tags are immutable once pushed** — a
  pass whose tip moved past an existing tag reports it and ships the delta in
  the next version; it never re-anchors a published tag.
- **Split-mirror rule.** The internal Gitea origin = the source of truth (every
  commit/branch); the public GitHub mirror = `main` only via
  `scripts/publish-public.sh`. Retired exports and build-host internals are
  gate-enforced content, never a manual memory exercise.
- **Impact decides the bump, not count.** `[Unreleased]` in the CHANGELOG is the
  tracker — every change lands its bullet the moment it merges; the version is
  the seal stamped at the release pass. Docs/tests/tooling-only passes = patch
  (0.1.z, batched freely); any user-visible arc = minor (0.x.z → 0.(x+1).0);
  breaking saved-document/export/CLI contracts = minor-major (0.x.0) until
  1.0.0 (document-format + PIN-integration stability).

## Conventions (Phoenix Inceptions Media ecosystem)

- Greek naming for named entities — Storybook section title: `PIM Applications/Tekton (Service Blueprint Studio)`
- Engine tests: `cargo test --workspace` (unit + structural golden assertions on the shipped example fixture)
- Editor tests: Vitest + React Testing Library + happy-dom; co-located (`src/X.test.tsx`); names read as specs; QA order **typecheck → test** (engine side: `cargo fmt --check` → test)
- TypeScript strict; `interface` for objects, `type` for unions
- Commit prefixes: `feat:` / `fix:` / `docs:` / `test:` / `chore:` / `refactor:`
- Document format: YAML by default (git-diff-friendly authoring), JSON round-trip via serde

## Verification

The engine tests headless; visuals verify in any desktop browser:

```bash
# 1. Engine + CLI (headless)
cargo test --workspace
cargo fmt --check

# 2. CLI — render / lint / validate (exit 1 on failures: CI-friendly)
tekton validate fixtures/agentic-ai-ecommerce.yaml
tekton lint fixtures/agentic-ai-ecommerce.yaml            # WCAG pairs — card text AND stage tag against every lane tint (AA/AAA verdicts)
tekton lint fixtures/agentic-ai-ecommerce.yaml --json    # pure JSON on stdout
tekton render fixtures/agentic-ai-ecommerce.yaml -f standalone   # → fixtures/agentic-ai-ecommerce-standalone.html

# 3. Visual/interactive testing (rendered blueprint):
cd fixtures && python3 -m http.server 6041 --bind 0.0.0.0
#   → open http://<this-host>:6041/agentic-ai-ecommerce-standalone.html in any desktop browser
#     (drawer, focus filter, print, responsive — the full experience)
#   Agent sessions (opencode/bash tool): background servers must fully detach or the
#   tool's timeout group-kill reaps them — use:
#   (setsid python3 -m http.server 6041 --bind 0.0.0.0 > /tmp/tekton-serve.log 2>&1 < /dev/null &)

# 4. Editor — Vite dev server (the editor's fixed dev port is 6041):
npm run dev -- --host 0.0.0.0 --port 6041          # → open http://<this-host>:6041
npm run typecheck && npm run test                   # Vitest + RTL (headless)

# 5. Desktop shell (needs a display machine + the system deps above):
npm run tauri dev

# 5b. Windows exe (cross-compile, headless-safe) — MUST embed the frontend:
npm run desktop:win                              # build + verify gate in one command (docs/DESKTOP_RELEASES.md)
npm run verify:win-exe releases/phoenix-tekton_0.1.1_x64.exe   # re-gate any copy before/after staging
# Never ship an exe without the verify gate: without the custom-protocol feature
# Tauri compiles a dev-mode shell that loads localhost:6041 → ERR_CONNECTION_REFUSED.

# 6. Container (Podman/Docker Desktop — the studio + CLI, no desktop GUI):
podman build -t phoenix-tekton .          # default target = runtime (editor on :6041)
podman compose up -d                      # → http://localhost:6041
podman run --rm -v ./out:/out phoenix-tekton tekton render my-blueprint.yaml -f standalone
podman compose --profile dev up dev       # devtool target: rust+node toolchain, repo bind-mounted
# The image compiles the engine fresh (wasm-bindgen-cli pinned to Cargo.lock);
# the Tauri GUI is deliberately NOT containerized — desktop targets stay native.
```

The `tekton` binary builds via `cargo run -p tekton-cli -- <args>` in the workspace.

## References

- The publication log: `docs/PUBLICATION_LOG.md` — what moved where, and when
- The source artifact (living specification): the agentic-AI e-commerce service blueprint deployed at delminquoelcunningham.com — its changelog documents the accessibility engineering history
- The Tekhne design system (the editor's token language — Phoenix Inceptions Media, private)
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

---

**Last Updated:** 2026-10-15
**Project:** Phoenix Tekton v0.2.0