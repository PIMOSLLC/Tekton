# phoenix-Tekton container — the browser-mode studio + the tekton CLI.
#
# Targets:
#   runtime (default) — production static build of the editor served on :6041,
#                       with the `tekton` CLI binary on PATH for headless
#                       render/lint/validate against mounted volumes.
#   devtool (compose profile "dev") — full toolchain (rustup + node) with the
#                       repo COPY'd at build, for developing/testing inside
#                       Podman/Docker Desktop; source via bind mount.
#
# The engine compiles fresh inside the image (pinned wasm-bindgen-cli) — the
# wasm module is never trusted from the repo: single source of truth = crates.
#
# Boundary (owner decision): this container carries the BROWSER editor — never
# the Tauri desktop GUI; desktop targets (AppImage/rpm/exe) stay native.
# Rootless-friendly: port >1024, no special capabilities needed.

# ── Stage: rust toolchain — CLI binary + wasm engine ─────────────────────────
FROM rust:1-slim AS toolchain-rust
ENV CARGO_TARGET_DIR=/work/target
RUN rustup target add wasm32-unknown-unknown
# Pinned to the crate's wasm-bindgen (Cargo.lock) — CLI must match exactly.
RUN cargo install wasm-bindgen-cli --version 0.2.129
WORKDIR /work
# Build cache layers first (manifests only), then the workspace.
COPY Cargo.toml Cargo.lock .cargo/ ./
COPY crates ./crates
RUN cargo build -p tekton-cli --release
RUN cargo build -p blueprint-wasm --target wasm32-unknown-unknown --release \
    && wasm-bindgen /work/target/wasm32-unknown-unknown/release/blueprint_wasm.wasm \
      --target web --out-dir /out/engine

# ── Stage: node builder — editor production build ────────────────────────────
FROM node:22-alpine AS builder-node
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
# The in-image generated engine replaces whatever ships in the repo tree.
COPY --from=toolchain-rust /out/engine ./src/engine
COPY . .
RUN npm run build

# ── Stage: runtime — static editor + CLI ─────────────────────────────────────
# Debian, not Alpine: the CLI binary builds against glibc — a musl runtime
# exec-fails it with a misleading "not found".
FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g serve@14
COPY --from=builder-node /app/dist /app/dist
COPY --from=toolchain-rust /work/target/release/tekton /usr/local/bin/tekton
WORKDIR /app
EXPOSE 6041
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:6041/ >/dev/null 2>&1 || exit 1
CMD ["serve", "-s", "-l", "6041", "/app/dist"]

# ── Stage: devtool — develop inside the container (compose profile dev) ─────
FROM node:22-bookworm-slim AS devtool
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential curl ca-certificates git \
    && rm -rf /var/lib/apt/lists/*
# rustup with the host toolchain + the wasm target; node ships with the base.
ENV RUSTUP_HOME=/usr/local/rustup CARGO_HOME=/usr/local/cargo \
    CARGO_TARGET_DIR=/work/target PATH=/usr/local/cargo/bin:/usr/local/cargo/bin:$PATH
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
      | sh -s -- -y --profile minimal --default-toolchain stable \
    && rustup target add wasm32-unknown-unknown \
    && cargo install wasm-bindgen-cli --version 0.2.129
WORKDIR /app
COPY . /opt/repo
RUN cd /opt/repo && npm ci
# Bind mounts hide image files: node_modules lives in-image, linked at boot.
COPY scripts/container-dev-entry.sh /usr/local/bin/container-dev-entry.sh
RUN chmod +x /usr/local/bin/container-dev-entry.sh
WORKDIR /work
EXPOSE 6041
ENTRYPOINT ["container-dev-entry.sh"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "6041"]