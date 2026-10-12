# Contributing to phoenix-Tekton

Thanks for wanting to contribute. Tekton is opinionated by design — the
accessible artifact is the artifact, and the engine is the only truth — so
these gates exist to keep both intact.

## Dev setup

Prerequisites:

- **Rust** (stable, via [rustup](https://rustup.rs))
- **Node** + npm (the repo carries `package-lock.json` — stay with npm)

```sh
git clone <repository-url>
cd phoenix-Tekton
npm install
cargo build --workspace          # engine + CLI
npm run dev                      # the editor → http://localhost:6041
```

The repo ships the pre-built wasm engine (`src/engine/blueprint_wasm*`), so
the editor runs immediately. After engine changes, rebuild it:

```sh
npm run wasm                     # needs wasm-bindgen-cli matching the lockfile
```

If the wasm build tooling friction is real, the CLI path works without it
(`cargo run -p tekton-cli -- render fixtures/agentic-ai-ecommerce.yaml`).

## QA gates

Editor side (run before pushing — in this order):

```sh
npm run typecheck                # tsc --noEmit
npm run test                     # Vitest + RTL, headless
```

Engine side:

```sh
cargo test --workspace           # model/validate/lint/render + golden + preset audits + CLI integration
cargo fmt --check
```

Purity is a test target too — the wasm build must keep compiling:

```sh
cargo check -p blueprint-wasm --target wasm32-unknown-unknown
```

New features need tests. Test names read as specs, not `test_1`. Tests are
co-located with the code they pin.

## Conventions

- **TypeScript strict** — `interface` for objects, `type` for unions.
- **Named exports only** — no default exports.
- **Comments explain "why," not "what"** — Human-First documentation. The
  codebase's comments carry the hard-won reasoning (every pass in the git
  history had one); keep that property when you add files.
- **Commit prefixes** — `feat:` / `fix:` / `docs:` / `test:` / `chore:` /
  `refactor:`, followed by a lowercase imperative subject.
- **Engine purity is non-negotiable** — `crates/blueprint-core` may not gain
  Tauri, filesystem, or async-runtime dependencies. Anything I/O-shaped lives
  in the bindings or the shell.

## What to contribute

- **Documentation**: the docs live at the repo root (`docs/`) and read for a
  public audience — factual, no assumed deployment.
- **Engine work**: validation/lint rules, theme tokens, rendering — with the
  WCAG audit consequences they carry (a new token is a new pair to lint).
- **Editor work**: the panel/canvas surfaces; each has a test-double-free
  contract (components out, callbacks in; see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).

## Style of the artifact

Generated blueprints must remain: self-contained (zero external requests),
keyboard-complete, `prefers-reduced-motion` aware, print-correct, and
contrast-audited before they can render. If a change makes any of those
weaker — for style, brevity, or convenience — that's not a change we can
make. [docs/AUTHORING.md](docs/AUTHORING.md) explains the philosophy.