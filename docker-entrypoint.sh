#!/bin/bash
set -euo pipefail
umask 077

# Keep credentials in the mounted volume, never in the image.
mkdir -p /root/.codex
if [ ! -e /root/.codex/config.toml ]; then
  printf '%s\n' 'cli_auth_credentials_store = "file"' > /root/.codex/config.toml
fi

# One-off commands (such as login) must not start another scheduler.
if [ "$#" -gt 0 ]; then
  exec "$@"
fi

mkdir -p /var/lib/scheduler
if [ ! -e /var/lib/scheduler/codex-crontab ]; then
  cp /usr/local/share/scheduler/codex-crontab /var/lib/scheduler/codex-crontab
fi
touch /var/lib/scheduler/window.log
crontab /workspace/codex-crontab

cron -f &
cron_pid=$!
node /workspace/server.js &
server_pid=$!

cleanup() {
  kill "$cron_pid" "$server_pid" 2>/dev/null || true
  wait "$cron_pid" "$server_pid" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 0' TERM INT

# If either service stops, stop the other so Compose can restart both.
wait -n "$cron_pid" "$server_pid"
exit 1
