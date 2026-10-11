#!/bin/sh
# container-dev-entry — for the devtool container: the repo arrives via a bind
# mount (so host edits are live), which hides the image's node_modules. Link
# the in-image tree in if the mount brought none, then hand off to the command.
set -e

if ! ls /work/node_modules >/dev/null 2>&1; then
  ln -s /opt/repo/node_modules /work/node_modules
fi
# Cargo artifacts stay in-image too (a Windows NTFS mount is no place for them).
if ! ls /work/target >/dev/null 2>&1; then
  ln -s /work/.container-target /work/target || mkdir -p /work/.container-target
fi

exec "$@"