# Releases — the staged distribution

Every file in this folder belongs to a gated release pass
(`scripts/release.sh <version>`): the QA battery runs first, every artifact is
verify-gated, and `SHA256SUMS` + `RELEASES.txt` regenerate mechanically with
each pass — nothing here is hand-edited. The narrative of everything that has
shipped lives in [`docs/PUBLICATION_LOG.md`](../docs/PUBLICATION_LOG.md).

## The v0.2.0 distribution

| File | What it is |
|---|---|
| `phoenix-tekton_0.2.0_x64.exe` | **The Windows desktop app** (x64, ~8.5 MB) — the verify-gated cross-compile with the frontend embedded; the preview's interactions ride the `blueprint-preview://` route (the v0.1.0 preview was CSP-dead static). Uses Windows 11's inbox WebView2 runtime; double-click to run. |
| `phoenix-tekton-0.2.0-1.x86_64.rpm` | **The Fedora Linux desktop app** — `sudo dnf install ./phoenix-tekton-0.2.0-1.x86_64.rpm` |
| `SHA256SUMS` | The checksum manifest — `sha256sum -c SHA256SUMS` from this folder |
| `RELEASES.txt` | The running narrative of every build pass (newest row first) |

**The two big binary releases live on the [GitHub Release page](https://github.com/PIMOSLLC/Tekton/releases)** for this tag (GitHub's git-blob limit is 100 MB; both exceed or crowd it):

- **`phoenix-tekton_0.2.0_amd64.AppImage`** — the portable Linux desktop app (~110 MB): `chmod +x` and run (FUSE2, or unpack with `--appimage-extract`) — same preview fix as the exe and the rpm
- **`phoenix-tekton_0.2.0_oci.tar`** — **the container archive** (OCI format): the service blueprint studio + the `tekton` CLI in one image, loadable everywhere:

```sh
sha256sum -c SHA256SUMS          # verify any download first
podman load -i phoenix-tekton_0.2.0_oci.tar    # (docker load works too)
podman run -d -p 6041:6041 phoenix-tekton:0.2.0
#   → the studio: http://localhost:6041
podman run --rm -v ./out:/out -v .:/fixtures:Z phoenix-tekton:0.2.0 \
  tekton render /fixtures/my-blueprint.yaml -f standalone
#   → a self-contained interactive blueprint HTML in ./out
```

- **The archive** — `releases/archive/` (local-only, gitignored for now): every
  release pass moves its superseded predecessor here — retired binaries stay as
  resources, they are never simply renamed or deleted (`scripts/release.sh`
  does the move, tracked exe/rpm leave the repository index with it). The
  archive folder does not ride the GitHub repository; the manifest excludes it
  by construction. Provenance for the current contents:

  | File | Origin |
  |---|---|
  | `phoenix-tekton_0.1.0_x64.exe` | recovered byte-exact from git history (`8a11e703…`, matches the shipped `SHA256SUMS`) |
  | `phoenix-tekton-0.1.0-1.x86_64.rpm` | recovered byte-exact from git history (`47250697…`, matches the shipped `SHA256SUMS`) |
  | `phoenix-tekton_0.1.0_oci.tar` | re-saved from the surviving `phoenix-tekton:0.1.0` image (same container; the tar bytes differ from the shipped archive) |
  | `phoenix-tekton_0.1.0_amd64.AppImage` | **not preserved** — the copy was deleted before this policy existed (the build dir is overwritten per pass); rebuild from the tree of `df8cbab` if a copy is ever needed |

  Any archived exe re-verifies with the same gate:
  `npm run verify:win-exe releases/archive/phoenix-tekton_0.1.0_x64.exe`.

## Building any of it yourself

- The studio + CLI + wasm: `podman build -t phoenix-tekton .` (the repo's own `Dockerfile`)
- The CLI alone: `cargo run -p tekton-cli -- render my-blueprint.yaml -f standalone`
- The desktop artifacts: [`docs/DESKTOP_RELEASES.md`](../docs/DESKTOP_RELEASES.md) — the Windows exe is cross-compiled with its embedded-frontend verify gate; the Linux bundles build natively via the Tauri CLI.

Every shipped binary carries the engine's WCAG 2.2 contrast gate and the
print-exact rule — the artifact prints and exports as it reads in the app.