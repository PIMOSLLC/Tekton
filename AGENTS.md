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

**Status: phase 1 (Rust core) COMPLETE** — `blueprint-core` on branch `phase-1-rust-core` (pushed): document model, validation, WCAG 2.2 linter (suggested fixes), dual-format renderer, Serta fixture, 21 tests green (`cargo test --workspace`, clippy clean). Verify with: `cargo run -p blueprint-core --example render-fixture` (renders the fixture to `serta-*.html`). **Next: phase 2 (Tauri editor)** — branch `phase-2-tauri-editor` off `phase-1-rust-core`. Blocking prerequisite: the sudo system-deps command below (agent sessions cannot sudo).

## Repository

- **Gitea (origin):** `ssh://git@192.168.10.230:30009/dmonphx/phoenix-Tekton.git`
- **Local checkout:** `/mnt/reactapps/PIMOS/phoenix-Tekton` (inside the PIMOS umbrella)
- **Branch model:** Phased Development Branching Protocol — `phase-1-rust-core` → `phase-2-tauri-editor` → `phase-3-product-polish`, each stacked off the previous phase's branch; merge to `main` only when all phases complete

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
- **Phoenix theming**: `data-phoenix-theme="..."` attribute required or Tekhne CSS variables silently resolve to nothing. The **editor UI** uses Tekhne tokens (start from `/mnt/reactapps/phoenix-tekhne_v2/packages/tokens/src/blank-theme.css`); the **rendered blueprint output** uses the document's own theme — exported HTML must be fully self-contained (it leaves the Tekhne context entirely).
- **Named exports only** — no default exports; barrel via `index.ts`.
- **Tauri GUI system deps (Fedora, need sudo — not yet installed on this workstation):**
  `sudo dnf install webkit2gtk4.1-devel gtk3-devel librsvg2-devel openssl-devel curl-devel`

## Conventions (Inherited)

- Greek naming — Storybook section title: `PIM Applications/Tekton (Service Blueprint Studio)`
- Engine tests: `cargo test --workspace` (unit + structural golden assertions on the Serta fixture)
- Editor tests (once scaffolded): Vitest + React Testing Library + happy-dom; co-located; names read as specs; QA order **lint → typecheck → test**
- TypeScript strict; `interface` for objects, `type` for unions
- Commit prefixes: `feat:` / `fix:` / `docs:` / `test:` / `chore:` / `refactor:`
- Document format: YAML by default (git-diff-friendly authoring), JSON round-trip via serde

## Verification

```bash
# Engine (phase 1+)
cargo test --workspace
cargo fmt --check

# Editor (phase 2+, once scaffolded)
npm run lint && npm run typecheck && npm run test

# Desktop app (phase 2+; requires system deps above + a display)
npm run tauri dev
```

## References

- PIMOS umbrella governance: `/mnt/reactapps/PIMOS/AGENTS.md`
- Tekhne design system: `/mnt/reactapps/phoenix-tekhne_v2/AGENTS.md`
- The source artifact (living specification): `/mnt/reactapps/dlc/resources/agentic_ecommerce_service_blueprint.html` (deployed: delminquoelcunningham.com page 2508 — see `dlc/CHANGELOG.md` passes cont. 7–13 for the accessibility engineering history)
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

---

**Last Updated:** 2026-10-10
**Project:** phoenix-Tekton v0.1.0