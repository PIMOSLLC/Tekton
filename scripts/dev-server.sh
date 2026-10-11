#!/usr/bin/env bash
# phoenix-Tekton dev server — Vite editor on the LAN (PIMOS port 6041).
#
# Why the odd launch shape: agent/tool shell sessions group-kill background
# children on call exit unless the process fully detaches (setsid) AND has all
# fds redirected off the session pipes. Both lessons cost us a dead server
# twice — hence this script.
#
# Usage: scripts/dev-server.sh [stop|status]

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="/tmp/opencode/tekton-vite.log"
PIDFILE=/tmp/opencode/tekton-vite.pid

stop() {
  if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    kill "$(cat "$PIDFILE")" && echo "stopped $(cat "$PIDFILE")"
  else
    pkill -f "vite --host 0.0.0.0 --port 6041" 2>/dev/null || true
    echo "no running server found"
  fi
  rm -f "$PIDFILE"
}

status() {
  if curl -s -o /dev/null --max-time 3 "http://192.168.10.138:6041/"; then
    echo "editor: UP at http://192.168.10.138:6041/"
  else
    echo "editor: DOWN"
  fi
}

case "${1:-start}" in
  stop)   stop ;;
  status) status ;;
  start)
    stop >/dev/null 2>&1 || true
    cd "$ROOT"
    (setsid node_modules/.bin/vite --host 0.0.0.0 --port 6041 > "$LOG" 2>&1 < /dev/null &)
    # Record the pid (pgrep matches the detached node process)
    for _ in $(seq 1 20); do
      PID=$(pgrep -f "vite --host 0.0.0.0 --port 6041" | head -1 || true)
      [[ -n "$PID" ]] && break
      sleep 0.25
    done
    [[ -n "${PID:-}" ]] && echo "$PID" > "$PIDFILE"
    sleep 1
    status
    echo "log: $LOG"
    ;;
esac