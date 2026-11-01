# Workspace Scheduler

A small, dependency-free Node.js interface for managing three weekday usage windows. Choose start times from the mobile-friendly controls, or drag windows along the desktop timeline.

- Three five-hour windows, Monday through Friday
- Touch-friendly time selectors and keyboard-accessible timeline controls
- Save/reset controls, loading feedback, and retry support
- Kuala Lumpur time (UTC+8) displayed in the interface

## Run with Docker Compose

Requirements: Docker Engine (or Docker Desktop), Docker Compose v2, internet access for the build and scheduled requests, and an account that can use the model configured in `start-window.sh` (`gpt-6-luna`). Keep the container and its host running for scheduled jobs to execute.

```sh
git clone https://github.com/jasonlow2307/codex-scheduler.git
cd codex-scheduler
docker compose build
docker compose run --rm scheduler codex login --device-auth
docker compose up -d
```

Follow the device-login URL and code printed by the CLI. Enable device code login in your account or workspace settings if required. See the [official authentication guide](https://learn.chatgpt.com/docs/auth#login-on-headless-devices).

Open `http://localhost:3000`. The initial schedule is 06:00, 11:00, and 16:00, Monday through Friday, in Kuala Lumpur time (UTC+8). Adjust it in the UI and save.

The image installs Node.js, cron, time zone data, and Codex CLI (pinned to `0.166.0`). Startup installs the saved crontab and supervises cron and the web server together. If either process exits, the container exits so the restart policy can restart both.

Two named Docker volumes keep runtime data outside the repository and image:

- `scheduler-data`: saved crontab and window execution log. The example crontab is copied here only on first startup, so rebuilding does not overwrite saved times.
- `codex-auth`: CLI configuration and credentials. Login commands and scheduled requests use the same volume. Treat this volume and its backups as sensitive.

No credentials are needed during the image build. The Docker build context uses an allowlist, and the image copies only application files. Do not commit or share authentication files or runtime logs.

Useful commands:

```sh
# Check container health and login status
docker compose ps
docker compose exec scheduler codex login status

# Web server output and window execution output
docker compose logs -f scheduler
docker compose exec scheduler tail -n 50 -f /var/lib/scheduler/window.log

# Stop the service, preserving schedules and credentials
docker compose down
```

`docker compose down -v` deletes both volumes, including credentials and saved schedules. Editing the repository's example `codex-crontab` after first startup does not change the saved schedule; use the UI instead.

The UI is published on `127.0.0.1:3000` because it has no authentication. For access from another device, use an authenticated proxy or a secure tunnel.

## Run without Docker

```sh
node server.js
```

Open `http://localhost:3000`. The host must meet the following environment requirements and run its own cron daemon.

## Environment requirements

This project includes a window-start script and a scheduler-only example crontab. It targets a Linux container with `/workspace` as the installation directory and `/root` as the runtime home. Review these paths before installing elsewhere.

The server expects:

- A Unix environment with the `crontab` command and permission to install the current user's crontab.
- `/workspace/codex-crontab`, containing the managed weekday cron entry.
- `/workspace/start-window.sh`, the included script started by that entry.
- An authenticated Codex CLI installed at `/usr/local/bin/codex`. Authentication must be configured separately in the runtime environment; credentials are never included in this repository.
- Three distinct, whole-hour start times in the existing crontab.
- The cron environment configured to use `Asia/Kuala_Lumpur`, matching the UI. This application does not convert time zones.

Saving updates the matching entry in `/workspace/codex-crontab` and installs that file as the current user's crontab. Keep any other required cron entries in that file.

## Install the scheduler files

Copy this repository's files into `/workspace`, then make the script executable:

```sh
chmod +x /workspace/start-window.sh
```

The supplied `codex-crontab` starts the script at 06:00, 11:00, and 16:00 on weekdays in Kuala Lumpur time. Ensure your cron implementation supports `CRON_TZ`, or configure the cron daemon's time zone accordingly.

Review and merge the example with any existing jobs before running:

```sh
crontab /workspace/codex-crontab
```

This replaces the current user's installed crontab. The example contains only scheduler jobs; the separate usage logger, monitoring logs, usage history, and authentication files are not included.

`start-window.sh` makes one short Codex CLI request and exits with its status. It does not keep a process running for five hours or enforce a five-hour window. The five-hour blocks in the UI are a planning visualization.

## Access

The server listens on port 3000 on all interfaces and has no authentication. Run it on a trusted network, or put it behind an authenticated proxy before allowing remote access.

## Project structure

```text
server.js          HTTP server and cron schedule API
public/index.html  Responsive interface, styles, and browser logic
start-window.sh    One-shot CLI request triggered by cron
codex-crontab      Scheduler-only example crontab
Dockerfile         Node.js, cron, and CLI image
compose.yaml       Local service with persistent runtime volumes
docker-entrypoint.sh  Login command support and service supervision
```

The web server and frontend have no npm dependencies or build step. The Docker image separately installs the Codex CLI.
