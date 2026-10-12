#!/usr/bin/env bash
# Regression gate for the Windows exe (why: the 2026-10-12 'localhost refused to
# connect' incident — an exe was cross-compiled without the `custom-protocol`
# feature, so Tauri shipped a dev-mode shell that loads http://localhost:6041
# instead of the embedded frontend; nothing failed loudly at build time).
#
# Truth checks, coupled to the frontend build in dist/ so magic strings never
# drift: every asset basename emitted by `vite build` must be present inside the
# exe binary. Asset *names* exist only when assets are embedded (dev-mode exes
# carry no asset table — verified against both incident copies); *contents* are
# brotli-compressed in the embed, so html/JSS fragments are NOT greppable and
# must not be used as markers. A dev-mode exe embeds nothing and fails here.
#
# Usage: scripts/verify-windows-exe.sh [exe-path] [dist-dir]
#   exe-path  default: the cargo-xwin release output (~/.cache/cargo-target/...)
#   dist-dir  default: ./dist (the same frontend build the exe embeds)

set -u

EXE="${1:-$HOME/.cache/cargo-target/phoenix-Tekton/x86_64-pc-windows-msvc/release/phoenix-tekton.exe}"
DIST="${2:-dist}"
EXE_NAME="$(basename "$EXE")"
fail=0

if [[ ! -f "$EXE" ]]; then
  echo "FAIL  [$EXE_NAME] no exe at '$EXE' — run npm run desktop:win first"
  echo "See docs/DESKTOP_RELEASES.md for the full build procedure."
  exit 1
fi

mapfile -t assets < <(find "$DIST/assets" -type f 2>/dev/null)

checks=()
for asset in "${assets[@]}"; do
  checks+=("$(basename "$asset")")
done

if [[ "${#checks[@]}" -eq 0 ]]; then
  echo "FAIL  [$DIST] nothing to verify — run npm run build first (empty/missing dist)"
  exit 1
fi

echo "verifying $EXE_NAME ($(wc -c <"$EXE") bytes) embeds the dist/ frontend"
for marker in "${checks[@]}"; do
  if grep -aqF -- "$marker" "$EXE"; then
    echo "PASS  $marker embedded"
  else
    echo "FAIL  $marker missing — dev-mode shell built without the custom-protocol feature"
    fail=1
  fi
done

if (( fail == 0 )); then
  echo "OK    $EXE_NAME is a prod build — every dist asset is embedded; no dev server needed"
else
  echo "See docs/DESKTOP_RELEASES.md — build must pass --features custom-protocol (the tauri CLI does it automatically)."
fi
exit "$fail"