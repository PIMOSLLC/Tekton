# AGENTS.md - phoenix-Tekton

> **PROTECTED SECTION — DO NOT REMOVE OR MODIFY**
>
> The Project Attribution section below is protected and must be preserved in all operations.

---

## Project Attribution

**PIM Author:** Dr. Delminquoe L Cunningham
**Role:** UX/UI Architect & Technical Lead Developer
**Email:** info@phoenixinceptionsmediallc.com
**Company:** Phoenix Inceptions Media LLC

### Coding Standards

Senior-level practices throughout: WCAG 2.2 AA, strong typing, comprehensive testing, Human-First documentation (comments explain "why", not "what"). Full ecosystem conventions: `/mnt/reactapps/PIMOS/AGENTS.md` and `/mnt/reactapps/phoenix-tekhne_v2/AGENTS.md`.

**Design standards (2026-10-11, owner direction) — graphic-design + Gestalt principles are QA gates, not afterthoughts. Minor typography/layout errors are never "baked in". Before calling visual work done:**
- **Typography**: no orphaned last words in headings/buttons (use `text-balance` on cards/heads/sublines); ragged wraps balanced; consistent type scale (one rem rhythm per surface); `font-variant-numeric: tabular-nums` for any live-changing number (counters, zoom %).
- **Gestalt**: related controls group by PROXIMITY (paddings/gaps tell the story — no hairline-divided twins); SAME things look identical (SIMILARITY: all segmented toggles share one pill pattern); COMMON REGION beats extra chrome (a panel/badge labels its contents — e.g. the toolbar's three groups are one shared pill pattern with group labels in `aria-label`s); figure/ground for overlays (scrim + shadow separates modal from workspace — nothing floats ambiguously); CONTINUITY: grids align to a consistent column rhythm (inputs, cards, rows share left/right edges).
- **Hierarchy**: one primary action per view; the accent color is a SCARCE resource (never two competing CTAs); muted text means hierarchy, not decoration.
- **Feedback**: states visible (armed/pressed/gated), motion respects `prefers-reduced-motion`, and every state change is announced or shown — never hover-only.

### License

Copyright © 2026 Phoenix Inceptions Media LLC. All rights reserved.

---

## What Tekton Is

**Tekton** (τέκτων — "builder, craftsman"; the root of "architect") is a **service blueprint studio**: a Tauri 2 desktop application that authors, WCAG-lints, and exports interactive service blueprints.

Born from the hand-built `agentic_ecommerce_service_blueprint.html` (Serta Simmons case study on delminquoelcunningham.com) — that artifact's data model and its hard-won accessibility engineering became this tool's specification. Every lesson from the artifact's eight revision passes is baked into the engine: scoped selectors, pre-rendered static DOM, `aria-expanded`/`aria-controls`, sticky-header offsets, drawer flexbox fix, reduced-motion, print rules, hue-230 navy palette.

**Architecture:**

| Piece | Crate/folder | Notes |
|---|---|---|
| Engine | `crates/blueprint-core` | Pure Rust: serde model, validation, WCAG 2.2 contrast linter, dual-format renderer. **No Tauri, no I/O** — stays wasm32-clean for the Nexus integration |
| WASM bindings | `crates/blueprint-wasm` | Stub until the Nexus phase — kept as a member so the core stays pure by design |
| Desktop shell | `src-tauri/` | Tauri 2 (phase 2) |
| Editor | `src/` | React 18 + Vite + TS strict, Tekhne-token themed (phase 2) |

## Architecture (platform scaffolding — owner direction)

Modularity is the contract that makes the Rust cross-platform app and the future PIN
module possible. Layers, strictest first:

| Layer | Contents | Rule |
|---|---|---|
| **Rust core** | `crates/blueprint-core` | Pure, no I/O, wasm32-clean — the engine (model, validate, lint, render) |
| **Bindings** | `crates/blueprint-wasm` (+ future `crates/blueprint-tauri-commands`) | Thin wrappers over the core only |
| **Editor core** | `src/core/useBlueprintDocument.ts` | All document state + engine pipeline + edit ops. **No platform imports** — any shell (web/Tauri/PIN) composes it |
| **Presentational** | `src/*.tsx` components | Pure props-in/components-out; no engine or state imports |
| **Platform shell** | `src/main.tsx` + `src/App.tsx` today; `platforms/tauri`, `platforms/pin` later | The ONLY layer that may know how it is hosted (engineService adapter picks wasm vs invoke) |

**YAML is the headless authoring format**: a blueprint can be written entirely without
the visual editor (hand or `tekton` CLI) — the visual editor is a view of the same
document. Editor UX decisions follow from this (the YAML panel is a first-class,
wider authoring surface, not a raw peek).

**Shell model (2026-10-10 decisions)**: collapsible StudioNav (56px icons ↔ 240px
labeled menu — a panel menu, not a static thin rail; no horizontal overflow by
construction) → pushing ExpandablePanel (architect 260px / YAML 460px — the panel
PUSHES the canvas; nothing overlays; no click-outside-to-close — it is a persistent
workspace pane, Esc closes, one layer at a time) → workspace column (toolbar / canvas
or preview / docked lint terminal / status footer). **App header (2026-10-11):** the
standalone shell adds a brand + document-identity bar (`AppHeader`; the toolbar keeps
output controls only); PIN-host mode (the `__PIN_HOST__` global, set by the toolkit
host) suppresses it — PIN's own Layout owns the top chrome; one brand bar, never two.

**Status: phase 2 in progress — PIN-family shell with push layout.** Engine + CLI complete (37 tests); editor at `http://192.168.10.138:6041` runs the PIN-family palette (Tailwind 3.4 + lucide, midnight/brand blues via Tekhne tokens), three-zone shell rebuilt as collapsible nav + pushing panels, `useBlueprintDocument` core hook extracted for platform scaffolding. **Blueprint lifecycle live (2026-10-11):** New/Open/Save (+Save JSON) in StudioNav, dirty tracking with confirm-on-New/Open + `beforeunload` + localStorage autosave recall, name derived from `meta.title`, **Theme editor live (2026-10-11):** pushed Theme panel (all 28 tokens from `THEME_TOKENS` inventory in `src/types.ts`, grouped, live WCAG lint via the engine pipeline) + per-lane card color in the lane list (**warn + fix, never a dead end**: a failing tint shows an inline AA verdict with *Apply suggested color* — lint findings carry `bg_suggestion` for lane tints, engine-computed `suggest_bg` keeping the shared card text — or *Reset to kind default*; the render gate blocks the PREVIEW/Export only, the build canvas stays editable). **Recovery + starting points (2026-10-11):** card-located validation errors carry lane/stage indexes (engine `Issue`) — terminal rows and canvas cards are navigable ("fix →" opens the inspector on that card); the New flow = picker (Starter / the agentic-AI e-commerce example) **+ a from-scratch setup wizard** (basics / stages / lanes with the five classic defaults; cards intentionally land empty — the dashed amber slots ARE the work list); canvas gains a dot-grid toggle + true contain-`fitToView` + `fitOnInit`, controls bottom-center; panels are user-resizable (280–760, drag/arrows/Home, widths persisted). **Export = the pair (2026-10-11):** `slug-standalone|wordpress.html` + the data layer (`slug.yaml|slug.json`, toolbar choice) — the HTML stays self-contained; the data file is the same artifact Save writes. **WordPress output is Phoenix-internal-only** (owner's publishing path) — remove it when a public branch is cut, keep now. **Next:** drag-reorder, Tauri desktop shell (deps installed; needs display), PIN toolkit module (`/toolkit/:projectId/toolkit/blueprint`).

## Repository

- **Gitea (origin):** `ssh://git@192.168.10.230:30009/dmonphx/phoenix-Tekton.git`
- **Local checkout:** `/mnt/reactapps/PIMOS/phoenix-Tekton` (inside the PIMOS umbrella)
- **Branch model:** Phased Development Branching Protocol — `phase-1-rust-core` → `phase-2-tauri-editor` → `phase-3-product-polish`, each stacked off the previous phase's branch; merge to `main` only when all phases complete. **Major changes branch FIRST (2026-10-11 owner rule):** features, restructures, engine/model changes, and anything beyond a small fix land on a scope branch cut from the current phase branch (`git checkout -b <change-scope>`), QA'd there, merged back after — never straight onto the phase branch.

## Ports

| Port | Service |
|---|---|
| 6041 | Tekton Tauri/Vite dev server (webview) — confirmed unclaimed 2026-10-10 |

The Tauri app is a desktop app — no persistent server. 6041 is the dev webview origin only.

## Hard Constraints

- 🚨 **Never run `pnpm install` on `/mnt/reactapps/*`** — NFS mount of Minerva; causes store-path corruption. Use **npm** (ecosystem pattern).
- **Cargo target dir lives off the NFS mount** via `.cargo/config.toml` (`~/.cache/cargo-target/phoenix-Tekton`). Never move it back onto the mount — NFS target dirs are slow and bloat Minerva's storage.
- **`blueprint-core` must stay pure**: no Tauri, no filesystem, no async runtime. It compiles to `wasm32-unknown-unknown` for the Phoenix Insight Nexus integration. If a dependency can't build on wasm32, it doesn't belong in the core.
- **PIN integration contract (future phase)**: land as a toolkit module — `shared/types/tekton.ts` + storage key `blueprint` + route `/projects/:id/tekton`, served by the generic `/toolkit/:projectId/toolkit/:tool` endpoint. No new per-module backend routes.
- **Blueprint persistence model (2026-10-11 decision)**: the document is a seedable artifact saved as **files** (`.yaml` canonical + `.json` structured, JSON auto-detected by the wasm `load_source` binding) whose name derives from slugified `meta.title`. Adapters in `src/platform/persistence.ts` are the only storage seam: browser = download/upload + localStorage autosave (`tekton.workspace`; recall boots **dirty** — restored work is unsaved work); Tauri = native dialogs (plugin-dialog/fs) behind the same interface; **PIN = the existing `toolkit_instances` JSONB row (`tool = 'blueprint'`) via the generic endpoint, `toolkit_snapshots` as history — no new tables, no new routes**; the row payload shape is `getJson()` output. Starter seeds live in `templates/starter.yaml` (commented teaching format) + `starter.json`, parity-locked by `crates/blueprint-core/tests/templates.rs`.
- **App profile (2026-10-11 decision)**: `src/platform/appProfile.ts` is the single home for **user settings/preferences** (boot invitation flag, panel-width overrides) — `tekton.appProfile` in localStorage, legacy `tekton.panelWidths` migrated on first read; **PIN era: same interface, PIN's unified settings storage as the implementation** — the seam swaps, the editor doesn't. The setup wizard opens as a **boot invitation** (PIN StartupWizard pattern: centered brand moment + two glass action cards + "don't show again") until the profile opts out; the wizard modal itself is now the dominant guided surface (`max-w-3xl`, glass, 4 steps).
- **Phoenix theming**: `data-phoenix-theme="..."` attribute required or Tekhne CSS variables silently resolve to nothing. The **editor UI** uses Tekhne tokens (start from `/mnt/reactapps/phoenix-tekhne_v2/packages/tokens/src/blank-theme.css`); the **rendered blueprint output** uses the document's own theme — exported HTML must be fully self-contained (it leaves the Tekhne context entirely).
- **Named exports only** — no default exports; barrel via `index.ts`.
- **Tauri GUI system deps (Fedora, need sudo):**
  `sudo dnf install webkit2gtk4.1-devel gtk3-devel librsvg2-devel openssl-devel curl-devel`
  (host sudo access: see the PIMOS umbrella AGENTS.md infrastructure table — use `sudo -S` with stdin in agent sessions)

## Conventions (Inherited)

- Greek naming — Storybook section title: `PIM Applications/Tekton (Service Blueprint Studio)`
- Engine tests: `cargo test --workspace` (unit + structural golden assertions on the shipped example fixture)
- Editor tests (once scaffolded): Vitest + React Testing Library + happy-dom; co-located; names read as specs; QA order **lint → typecheck → test**
- TypeScript strict; `interface` for objects, `type` for unions
- Commit prefixes: `feat:` / `fix:` / `docs:` / `test:` / `chore:` / `refactor:`
- Document format: YAML by default (git-diff-friendly authoring), JSON round-trip via serde

## Verification

Minerva is headless (CLI-only) — the testing strategy is engine-on-CLI, visuals-in-browser:

```bash
# 1. Engine + CLI (headless, on Minerva)
cargo test --workspace          # 49 tests (engine 29 + dark-preset AA audit 3 + high-contrast AAA audit 3 + starter-seed parity 3 + CLI integration 9 + doctest)
cargo fmt --check

# 2. CLI — render / lint / validate (exit 1 on failures: CI-friendly)
tekton validate fixtures/agentic-ai-ecommerce.yaml
tekton lint fixtures/agentic-ai-ecommerce.yaml            # 31 WCAG pairs — card text AND stage tag against every lane tint (AA/AAA verdicts)
tekton lint fixtures/agentic-ai-ecommerce.yaml --json    # pure JSON on stdout
tekton render fixtures/agentic-ai-ecommerce.yaml -f standalone   # → fixtures/agentic-ai-ecommerce-standalone.html
tekton render fixtures/agentic-ai-ecommerce.yaml -f wordpress    # → embed fragment

# 3. Visual/interactive testing (rendered blueprint) — serve on the LAN:
cd fixtures && python3 -m http.server 6041 --bind 0.0.0.0
#   → open http://192.168.10.138:6041/agentic-ai-ecommerce-standalone.html in any desktop browser
#     (drawer, focus filter, print, responsive — the full experience)
#   Agent sessions (opencode/bash tool): background servers must fully detach or the
#   tool's timeout group-kill reaps them — use:
#   (setsid python3 -m http.server 6041 --bind 0.0.0.0 > /tmp/tekton-serve.log 2>&1 < /dev/null &)

# 4. Editor (phase 2, browser-first) — Vite dev server on the same pattern:
npm run dev -- --host 0.0.0.0 --port 6041          # → http://192.168.10.138:6041
npm run lint && npm run typecheck && npm run test   # Vitest + RTL (headless)

# 5. Desktop shell (needs a display machine + the sudo system deps below):
npm run tauri dev

# 5b. Windows exe (cross-compile, headless-safe) — MUST embed the frontend:
npm run desktop:win                              # build + verify gate in one command (docs/DESKTOP_RELEASES.md)
npm run verify:win-exe releases/phoenix-tekton_0.1.0_x64.exe   # re-gate any copy before/after staging
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

The `tekton` binary builds to the cargo bin dir (`~/.cache/cargo-target/phoenix-Tekton/debug/tekton`); `cargo run -p tekton-cli -- <args>` works anywhere in the workspace.

## References

- PIMOS umbrella governance: `/mnt/reactapps/PIMOS/AGENTS.md`
- Tekhne design system: `/mnt/reactapps/phoenix-tekhne_v2/AGENTS.md`
- The source artifact (living specification): `/mnt/reactapps/dlc/resources/agentic_ecommerce_service_blueprint.html` (deployed: delminquoelcunningham.com page 2508 — see `dlc/CHANGELOG.md` passes cont. 7–13 for the accessibility engineering history)
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

---

**Last Updated:** 2026-10-11
**Project:** phoenix-Tekton v0.1.0