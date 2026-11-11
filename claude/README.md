# Claude Haiku 5.5 Scheduler

Schedule three five-hour windows on weekdays in Kuala Lumpur time (UTC+8). The initial start times are 06:00, 11:00, and 16:00. At each start time, cron sends Claude Code a single short prompt using Haiku 5.5 at low effort. The request consumes Claude usage. It cannot reset an active window or increase your quota.

## Run with Docker Compose

From the repository root:

```sh
docker compose -f claude/compose.yaml build
docker compose -f claude/compose.yaml run --rm scheduler claude auth login
docker compose -f claude/compose.yaml run --rm scheduler claude auth status
docker compose -f claude/compose.yaml up -d
```

Follow the browser login instructions printed by Claude Code. Open `http://localhost:3001` to view or change the schedule. On a NAS, use an authenticated proxy or an SSH tunnel to reach the UI. The Compose port is bound to loopback because the UI has no authentication.

The Claude Compose project runs independently of the repository's root service. Docker volumes keep Claude credentials, saved start times, and the run log across container rebuilds. `docker compose -f claude/compose.yaml down -v` deletes those volumes.

```sh
# Follow scheduled runs
docker compose -f claude/compose.yaml exec scheduler tail -n 50 -f /var/lib/scheduler/claude-window.log

# Stop the scheduler while keeping its data
docker compose -f claude/compose.yaml down
```

## Develop locally

From the repository root, run `DEV_MODE=1 node claude/server.js` and open `http://localhost:3001`. Local development starts with the example crontab's hours and saves changes to an ignored `claude/dev-schedule.json` file. The development server binds to loopback and leaves your installed crontab alone.
