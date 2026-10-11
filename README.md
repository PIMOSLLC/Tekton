# phoenix-Tekton

**Service blueprint studio** — a Tauri 2 desktop application that authors, WCAG-lints,
and exports interactive service blueprints. Engine in pure Rust; editor in React 18 +
Vite + TypeScript strict.

τέκτων — "builder, craftsman" — the root of "architect."

## Run in a container (Podman / Docker)

The studio is a self-contained web app (engine runs as wasm in the browser) —
the container carries the production build + the `tekton` CLI:

```sh
# from a clone of this repo — builds in Podman Desktop / Docker Desktop alike
podman build -t phoenix-tekton .          # or: docker build -t phoenix-tekton .
podman compose up -d                      # or docker compose up -d
# → open http://localhost:6041
```

Headless CLI inside the same image (no native toolchain needed). On Fedora hosts
(rootless Podman + SELinux), mounts need `:Z` for relabeling:

```sh
podman run --rm -v ./fixtures:/fixtures:ro -v ./out:/out:Z phoenix-tekton \
  tekton render /fixtures/my-blueprint.yaml -f standalone -o /out/my-blueprint-standalone.html
podman run --rm -v .:/w:ro phoenix-tekton tekton lint /w/fixtures/agentic-ai-ecommerce.yaml
```

`-o` matters: without it the CLI writes beside the input (read-only mounts fail).

Developing inside the container (rust + node toolchain, repo bind-mounted):

```sh
podman compose --profile dev up dev       # live edits on :6041
```

Note: container sessions run the browser-mode persistence model — Save/Open are
file downloads/uploads, and app preferences live in that browser's storage.
The desktop installers (AppImage/rpm/exe) remain the native track; this
container never runs the Tauri GUI.

Copyright © 2026 Phoenix Inceptions Media LLC. All rights reserved.
