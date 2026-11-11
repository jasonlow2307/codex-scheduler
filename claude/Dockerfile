FROM node:22-bookworm-slim

ENV TZ=Asia/Kuala_Lumpur \
    CLAUDE_CONFIG_DIR=/root/.claude \
    DISABLE_AUTOUPDATER=1

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
       ca-certificates cron tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && ln -snf /usr/share/zoneinfo/Asia/Kuala_Lumpur /etc/localtime \
    && echo Asia/Kuala_Lumpur > /etc/timezone \
    && npm install -g @anthropic-ai/claude-code \
    && npm cache clean --force

WORKDIR /workspace
COPY server.js start-claude-window.sh ./
COPY public/index.html ./public/index.html
COPY claude-crontab /usr/local/share/scheduler/claude-crontab
COPY docker-entrypoint.sh /usr/local/bin/scheduler-entrypoint

RUN chmod 755 /usr/local/bin/scheduler-entrypoint

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/schedule').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
ENTRYPOINT ["/usr/local/bin/scheduler-entrypoint"]
