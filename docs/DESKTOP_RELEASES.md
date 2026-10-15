# Desktop releases — building the Windows exe from Linux

**Why the extra rule:** the Windows exe is cross-compiled from Linux, and a
plain `cargo` build of a Tauri shell produces a **dev-mode binary** — no
frontend embedded, the webview hard-loading the dev server URL
(`http://localhost:6041`), which boots to *"localhost refused to connect"*
(`ERR_CONNECTION_REFUSED`) on any machine without the dev server running.
That actually happened to a shipped build. Once, was enough.

## The rule

**The exe must embed the frontend — that is what the `custom-protocol`
feature does.**

| Build path | Embeds the frontend? |
|---|---|
| `npm run tauri build` (tauri CLI) | ✅ automatically — passes `--features custom-protocol` |
| Plain cargo / cargo-xwin | ❌ **unless** you pass `--features custom-protocol` |

A dev-mode exe fails silently at build time and only fails on the user's
machine. The verify gate is the loud failure.

> **Do not** grep for `localhost:6041` to detect a dev-mode binary — the
> devUrl string lives in the embedded *config* of both build modes. Asset
> **basenames** from `dist/` are the prod-only signature (dev-mode binaries
> have no asset table). Contents are embedded compressed, so only the names
> are greppable.

## Prerequisites (any Linux host)

- Rust with the target: `rustup target add x86_64-pc-windows-msvc`
- [`cargo-xwin`](https://github.com/rust-cross/cargo-xwin) (`cargo install cargo-xwin`) — handles the Windows SDK/libc pieces; first fetches the SDK into `~/.cache/cargo-xwin/`
- Node + npm for the frontend toolchain

## Build (one command)

```sh
npm run desktop:win
```

which runs, in order (wired in `package.json`):

1. `npm run build` — via the tauri CLI's `beforeBuildCommand` (tsc + vite → `dist/`)
2. the cross-compile:
   `tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --config '{"bundle":{"active":false}}'`
   — the CLI passes the `custom-protocol` feature automatically; the
   `--config` override disables bundling (some CLI versions don't accept
   `--bundles none`; the override is equivalent). The result is a **raw,
   portable exe** — Windows installers (NSIS/MSI) are a Windows-host step.
3. `scripts/verify-windows-exe.sh` — the gate below. **The build fails
   loudly if the frontend didn't embed.**

Fallback (equivalent, driving cargo directly — run `npm run build` first):

```sh
cargo-xwin build -p phoenix-tekton --release --target x86_64-pc-windows-msvc \
  --features custom-protocol
```

~1 minute either way (incremental; `lld-link LNK4099` PDB warnings are
harmless noise from the msvcrt static libs).

## Verify (the gate)

```sh
npm run verify:win-exe                              # the target-dir exe
npm run verify:win-exe releases/phoenix-tekton_0.3.0_x64.exe   # any staged/downloaded copy
```

`scripts/verify-windows-exe.sh [exe-path] [dist-dir]` asserts that **every
asset basename emitted by `vite build` is present inside the binary**.
All PASS ⇒ prod build. Any FAIL ⇒ dev-mode shell — rebuild, never ship.

The Linux artifacts (AppImage / rpm) are built natively by the tauri CLI and
already embed the frontend; the gate exists for the cross-compiled exe.

## Stage and hand off

```sh
cp -f <target-dir>/x86_64-pc-windows-msvc/release/phoenix-tekton.exe \
      releases/phoenix-tekton_0.3.0_x64.exe
(cd releases && sha256sum *.exe *.AppImage *.rpm > SHA256SUMS)
```

- Keep binaries out of git — a staging folder (or the GitHub release page when
  publishing) carries them.
- Publish the SHA256SUMS alongside; verify a copy with the gate before *and*
  after any move.

## Windows acceptance test

Double-click the exe on a Windows machine **with the dev server not running**:

- ✅ boots straight into the editor — the frontend serves from the embedded
  build over the internal `tauri.localhost` origin. Windows 11 ships the
  WebView2 runtime inbox; Windows 10 machines need the
  [WebView2 Evergreen runtime](https://learn.microsoft.com/en-us/microsoft-edge/webview2/) installed.
- ❌ *"localhost refused to connect"* → a dev-mode exe shipped again.
  Re-run the gate on the exact copy that was handed over.