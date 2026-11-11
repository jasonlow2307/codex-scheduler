#!/bin/bash
set -euo pipefail
umask 077

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

mkdir -p /var/lib/scheduler
if [ ! -e /var/lib/scheduler/claude-crontab ]; then
  cp /usr/local/share/scheduler/claude-crontab /var/lib/scheduler/claude-crontab
fi
touch /var/lib/scheduler/claude-window.log
crontab /var/lib/scheduler/claude-crontab

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

# Exit if either service stops so Compose can restart both.
wait -n "$cron_pid" "$server_pid"
exit 1
