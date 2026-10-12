# Desktop releases — the Windows exe runbook

**Why this exists:** the first 0.1.0 exe was cross-compiled with plain
`cargo-xwin` without the `custom-protocol` feature. Tauri then compiles a
**dev-mode shell**: no frontend embedded, the webview hard-loads
`http://localhost:6041` (the `devUrl` from `tauri.conf.json`) — so every
machine without the Vite dev server booted straight to *"Hmmm… can't reach
this page / ERR_CONNECTION_REFUSED"*. The commit `fix(desktop): define the
custom-protocol feature` added the feature, but nothing forced the flag into
the build command, and the rebuilt exe shipped broken anyway. This runbook +
the verify gate make that impossible to repeat.

## The rule

**The frontend must be embedded at compile time — that is what the
`custom-protocol` feature does.**

| Build path | Embeds the frontend? |
|---|---|
| `npm run tauri build` (tauri CLI) | ✅ automatically (passes `--features custom-protocol`) |
| Plain cargo / cargo-xwin cross-compile | ❌ **unless** you pass `--features custom-protocol` explicitly |

A dev-mode exe is silent at build time — no error, no warning. It only fails
on the user's machine, in the webview, as a connection-refused page. The
verify gate (below) is the loud failure.

> Do **not** grep for `localhost:6041` to detect dev mode: the devUrl string
> lives in the embedded config of **both** build modes. Asset *basenames* are
> the prod-only signature (dev-mode binaries have no asset table).

## Prerequisites (one-time, Minerva)

- `~/.cargo/bin` on PATH (`source ~/.cargo/env`)
- Rust target: `rustup target add x86_64-pc-windows-msvc`
- `cargo-xwin` (installed) — Windows SDK cache lives in `~/.cache/cargo-xwin/xwin`
- Node + npm (repo root)
- The cargo target dir is off-NFS by design (`.cargo/config.toml` →
  `~/.cache/cargo-target/phoenix-Tekton`) — do not move it back.

## Build (the one command)

```sh
npm run desktop:win
```

which runs, in order (wired in `package.json`):

1. `npm run build` — via the tauri CLI's `beforeBuildCommand` (tsc + vite → `dist/`)
2. the cross-compile:
   `tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --config '{"bundle":{"active":false}}'`
   (the CLI passes `--features custom-protocol`; `--bundles none` is NOT
   accepted by this CLI version — the `--config` override disables bundling instead;
   raw portable exe only, Windows installers need a Windows host)
3. `scripts/verify-windows-exe.sh` — the gate (below). Build fails loudly if
   the frontend didn't embed.

Fallback (equivalent, if you must drive cargo directly):
`cargo-xwin build -p phoenix-tekton --release --target x86_64-pc-windows-msvc --features custom-protocol`

~1 min either way (incremental; `lld-link LNK4099` PDB warnings are noise).

## Verify (the gate)

```sh
npm run verify:win-exe                                  # the target-dir exe
npm run verify:win-exe releases/phoenix-tekton_0.1.0_x64.exe   # the staged copy
```

Every asset basename in `dist/assets` must be found inside the exe binary.
**All PASS ⇒ prod build. Any FAIL ⇒ dev-mode shell — rebuild, never ship.**

(Linux sanity: the same grep logic confirmed the AppImage/rpm of 2026-10-12
embed the frontend already — built via the tauri CLI, unaffected.)

## Stage

```sh
cp -f ~/.cache/cargo-target/phoenix-Tekton/x86_64-pc-windows-msvc/release/phoenix-tekton.exe \
      releases/phoenix-tekton_0.1.0_x64.exe
(cd releases && sha256sum phoenix-tekton_0.1.0_x64.exe phoenix-tekton_0.1.0_amd64.AppImage phoenix-tekton-0.1.0-1.x86_64.rpm > SHA256SUMS)
# then refresh RELEASES.txt: build date, source commit, what changed
```

`releases/` is staging on Minerva (gitignored — artifacts never land in git).

## Windows acceptance test (owner)

Double-click the exe on a Windows machine **with the dev server not running**:

- ✅ boots straight into the Tekton editor (assets serve from the embedded
  build over the internal `tauri.localhost` origin — Windows uses the inbox
  WebView2 runtime)
- ❌ *"localhost refused to connect"* → you shipped a dev-mode exe again;
  re-run `npm run verify:win-exe` on the exact copy that was handed over.