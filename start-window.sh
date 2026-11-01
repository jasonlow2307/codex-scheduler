#!/bin/bash

export HOME=/root
export CODEX_HOME=/root/.codex
export TZ=Asia/Kuala_Lumpur
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] Starting Codex window (gpt-6-luna)"

/usr/local/bin/codex exec \
  --skip-git-repo-check \
  --sandbox read-only \
  --ephemeral \
  --model gpt-6-luna \
  -c model_reasoning_effort='"low"' \
  "Reply only OK."

STATUS=$?

echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] Finished Codex window (exit code: $STATUS)"

exit "$STATUS"
