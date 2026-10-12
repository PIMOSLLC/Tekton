# Architecture

phoenix-Tekton is built on one premise: **the engine is pure, and everything
else is a shell for it.** The same Rust engine renders the blueprint to HTML
on the CLI natively *and* in the browser editor as wasm — one pipeline, tested
in Rust, consumed everywhere.

```
┌──────────────────────────────────────────────────────────────┐
│  platform shell      src/main.tsx + App.tsx                  │
│                      (desktop installers ride the same tree) │
├──────────────────────────────────────────────────────────────┤
│  presentational      src/*.tsx — pure props-in, components-  │
│                      out; no engine or state imports         │
├──────────────────────────────────────────────────────────────┤
│  editor core         src/core/useBlueprintDocument.ts        │
│                      all document state + engine pipeline    │
│                      + edit ops — no platform imports        │
├──────────────────────────────────────────────────────────────┤
│  bindings            crates/blueprint-wasm (browser)         │
│                      crates/tekton-cli (headless)            │
├──────────────────────────────────────────────────────────────┤
│  engine              crates/blueprint-core                   │
│                      model · validate · lint · render        │
└──────────────────────────────────────────────────────────────┘
      strictest rule at the bottom: the core may import nothing.
```

Layers may only depend downward, and each layer owns a contract. They meet in
the strictest-first order: the deeper the layer, the fewer the allowed
assumptions.

## 1. The engine — `crates/blueprint-core`

The whole engine in one pure crate:

- **model** — the serde document model (see [AUTHORING.md](AUTHORING.md)):
  `Document { meta, stats, stages, lanes, note, theme }`, strict via
  `deny_unknown_fields` everywhere — typos fail loudly, never silently.
- **validate** — structural validation; issues carry lane/stage positioning so
  both the CLI and the editor can point you at the exact card.
- **lint** — the WCAG 2.2 contrast linter (relative luminance per the spec,
  large-text thresholds per SC 1.4.3); findings carry AA/AAA verdicts and
  engine-computed replacement suggestions.
- **render** — the HTML renderer, and the ship gate: `render` runs validate +
  lint first and **refuses** an invalid structure or an AA-failing theme.

**The purity contract:** no Tauri, no filesystem, no async runtime — nothing
that can't build for `wasm32-unknown-unknown`. The wasm/browser editor embeds
this crate unchanged, and so will any future embedding consumer. The engine
never learned about disks; the shells read the files.

YAML is the canonical authoring format (git-diff-friendly); JSON round-trips
through the same structs, and `load_source` auto-detects either on any
engine boundary.

## 2. Bindings — thin wrappers over the core

- **`crates/blueprint-wasm`** — the browser boundary. Exposes exactly the
  engine operations: `render_blueprint`, `lint_blueprint`,
  `validate_blueprint`, `parse_blueprint`, `serialize_blueprint`,
  `load_source` (YAML/JSON auto-detect), and `contrast_ratio` (the editor's
  live tint-math helper). No logic lives here — a wrapper that would need
  "just a little" state machine is a bug.
- **`crates/tekton-cli`** — the headless boundary: the same three operations
  (render/lint/validate) over clap, with CI-friendly exit codes and the
  refusal gates intact. See [CLI.md](CLI.md).

## 3. Editor core — `src/core/useBlueprintDocument`

All document state and mutation in one hook: the engine pipeline (validate →
lint → render), edit operations on the document, dirty tracking, and the
document lifecycle (New/Open/Save semantics). **No platform imports** — it
doesn't know it's running in a browser tab, a desktop webview, or any future
host. Any shell composes it.

## 4. Presentational components — `src/*.tsx`

Pure props-in/components-out: `StudioNav`, `AppHeader`, `ExpandablePanel`,
`VisualArchitect`, `YamlPanel`, `ThemeEditor`, `LintTerminal`, `BuildCanvas`,
`CanvasViewport`, `CardInspector`, `SetupWizardModal`, `StatusFooter`, …
No engine calls, no storage — they render state and emit callbacks.

## 5. Platform shell — `src/main.tsx` + `App.tsx`

The only layer that may know how it is hosted: wires the editor core to the
wasm binding, composes the shell chrome, and owns the two persistence seams.

### Persistence seams

- **`src/platform/persistence.ts`** — the only storage seam. A browser shell
  uses file download/upload + localStorage autosave; a native shell swaps the
  adapter for real dialogs/files. The editor doesn't change.
- **`src/platform/appProfile.ts`** — the single home for user preferences
  (boot invitation opt-out, panel-width overrides), migrated across key
  renames; the seam swaps, the editor doesn't.

## The tests are contracts

48 Rust tests + the editor suite (Vitest + RTL, co-located, names read as
specs) pin the architecture:

- `blueprint-core` unit tests cover model, validate, lint, render; the
  structural golden tests assert the rendered artifact's accessibility
  engineering on the shipped example; preset tests audit the dark and
  high-contrast palettes; starter-seed parity locks the teaching template to
  the engine contract; the CLI integration tests run the binary the way a CI
  pipeline would.
- The editor suite tests lifecycle and interactions against the real wasm
  pipeline.

The editor suite runs as every push's gate — **typecheck → test** — then
`cargo test --workspace` + `cargo fmt --check` for the Rust side. See
[CONTRIBUTING.md](../CONTRIBUTING.md).