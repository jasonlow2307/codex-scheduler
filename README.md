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

This project is a UI for an existing cron-based workspace setup. It does not include the workspace scripts or provision cron jobs.

The server expects:

- A Unix environment with the `crontab` command and permission to install the current user's crontab.
- `/workspace/codex-crontab`, containing the managed weekday cron entry.
- `/workspace/start-window.sh`, the script started by that entry. The script is responsible for the usage-window behavior.
- Three distinct, whole-hour start times in the existing crontab.
- The cron environment configured to use `Asia/Kuala_Lumpur`, matching the UI. This application does not convert time zones.

Saving updates the matching entry in `/workspace/codex-crontab` and installs that file as the current user's crontab. Keep any other required cron entries in that file.

## Access

The server listens on port 3000 on all interfaces and has no authentication. Run it on a trusted network, or put it behind an authenticated proxy before allowing remote access.

## Project structure

```text
server.js          HTTP server and cron schedule API
public/index.html  Responsive interface, styles, and browser logic
```

No npm dependencies or frontend build step are required.
