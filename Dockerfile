FROM node:22-bookworm-slim

ARG CODEX_VERSION=0.166.0
ENV TZ=Asia/Kuala_Lumpur

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
       ca-certificates cron git tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && ln -snf /usr/share/zoneinfo/Asia/Kuala_Lumpur /etc/localtime \
    && echo Asia/Kuala_Lumpur > /etc/timezone \
    && npm install -g "@openai/codex@${CODEX_VERSION}" \
    && npm cache clean --force

WORKDIR /workspace
COPY server.js start-window.sh ./
COPY public/index.html ./public/index.html
COPY codex-crontab /usr/local/share/scheduler/codex-crontab
COPY docker-entrypoint.sh /usr/local/bin/scheduler-entrypoint

RUN chmod 755 /workspace/start-window.sh /usr/local/bin/scheduler-entrypoint \
    && mkdir -p /var/lib/scheduler \
    && ln -s /var/lib/scheduler/codex-crontab /workspace/codex-crontab \
    && ln -s /var/lib/scheduler/window.log /workspace/codex-5am.log

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/schedule').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
ENTRYPOINT ["/usr/local/bin/scheduler-entrypoint"]
