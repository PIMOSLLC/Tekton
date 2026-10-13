# Releases — the staged distribution

Every file in this folder belongs to a gated release pass
(`scripts/release.sh <version>`): the QA battery runs first, every artifact is
verify-gated, and `SHA256SUMS` + `RELEASES.txt` regenerate mechanically with
each pass — nothing here is hand-edited. The narrative of everything that has
shipped lives in [`docs/PUBLICATION_LOG.md`](../docs/PUBLICATION_LOG.md).

## The v0.1.0 distribution

| File | What it is |
|---|---|
| `phoenix-tekton_0.1.0_x64.exe` | **The Windows desktop app** (x64, 8.5 MB) — the verify-gated cross-compile with the frontend embedded. Uses Windows 11's inbox WebView2 runtime; double-click to run. |
| `phoenix-tekton-0.1.0-1.x86_64.rpm` | **The Fedora Linux desktop app** — `sudo dnf install ./phoenix-tekton-0.1.0-1.x86_64.rpm` |
| `SHA256SUMS` | The checksum manifest — `sha256sum -c SHA256SUMS` from this folder |
| `RELEASES.txt` | The running narrative of every build pass (newest row first) |

**The two big binary releases live on the [GitHub Release page](https://github.com/PIMOSLLC/Tekton/releases)** for this tag (GitHub's git-blob limit is 100 MB; both exceed or crowd it):

- **`phoenix-tekton_0.1.0_amd64.AppImage`** — the portable Linux desktop app (113 MB): `chmod +x` and run (FUSE2, or unpack with `--appimage-extract`)
- **`phoenix-tekton_0.1.0_oci.tar`** — **the container archive** (93 MB; OCI format): the service blueprint studio + the `tekton` CLI in one image, loadable everywhere:

```sh
sha256sum -c SHA256SUMS          # verify any download first
podman load -i phoenix-tekton_0.1.0_oci.tar    # (docker load works too)
podman run -d -p 6041:6041 phoenix-tekton:0.1.0
#   → the studio: http://localhost:6041
podman run --rm -v ./out:/out -v .:/fixtures:Z phoenix-tekton:0.1.0 \
  tekton render /fixtures/my-blueprint.yaml -f standalone
#   → a self-contained interactive blueprint HTML in ./out
```

## Building any of it yourself

- The studio + CLI + wasm: `podman build -t phoenix-tekton .` (the repo's own `Dockerfile`)
- The CLI alone: `cargo run -p tekton-cli -- render my-blueprint.yaml -f standalone`
- The desktop artifacts: [`docs/DESKTOP_RELEASES.md`](../docs/DESKTOP_RELEASES.md) — the Windows exe is cross-compiled with its embedded-frontend verify gate; the Linux bundles build natively via the Tauri CLI.

Every shipped binary carries the engine's WCAG 2.2 contrast gate and the
print-exact rule — the artifact prints and exports as it reads in the app.