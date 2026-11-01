# Workspace Scheduler

A small, dependency-free Node.js interface for managing three weekday usage windows. Choose start times from the mobile-friendly controls, or drag windows along the desktop timeline.

- Three five-hour windows, Monday through Friday
- Touch-friendly time selectors and keyboard-accessible timeline controls
- Save/reset controls, loading feedback, and retry support
- Kuala Lumpur time (UTC+8) displayed in the interface

## Run

```sh
node server.js
```

Open `http://localhost:3000`.

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
```

No npm dependencies or frontend build step are required.
