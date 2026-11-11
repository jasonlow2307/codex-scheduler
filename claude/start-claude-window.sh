#!/bin/bash
set -u
export HOME=/root
export CLAUDE_CONFIG_DIR=/root/.claude
export TZ=Asia/Kuala_Lumpur
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

printf '[%s] Starting Claude window (claude-haiku-5-5, low)\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')"
/usr/bin/timeout 120 /usr/local/bin/claude -p "Reply only OK." \
  --model claude-haiku-5-5 \
  --effort low \
  --safe-mode \
  --tools "" \
  --disallowedTools "mcp__*" \
  --no-session-persistence
status=$?
printf '[%s] Finished Claude window (exit code: %s)\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$status"
exit "$status"
