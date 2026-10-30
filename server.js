const http = require("http");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const CRON_FILE = "/workspace/codex-crontab";
const PUBLIC_DIR = path.join(__dirname, "public");

function send(res, status, type, body) {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function getSchedule(callback) {
  execFile("crontab", ["-l"], (error, stdout) => {
    if (error) return callback(error);
    const match = stdout.match(
      /^(\d+)\s+([\d,]+)\s+\*\s+\*\s+1-5\s+\/workspace\/start-window\.sh/m
    );
    callback(null, {
      windowMinutes: match?.[1] ?? null,
      windowHours: match?.[2]?.split(",").map(Number) ?? []
    });
  });
}

function updateSchedule(hours, callback) {
  if (!Array.isArray(hours) || hours.length === 0 ||
      hours.some(h => !Number.isInteger(h) || h < 0 || h > 23)) {
    return callback(new Error("Invalid hours"));
  }

  const unique = [...new Set(hours)].sort((a, b) => a - b);
  if (unique.length !== hours.length) return callback(new Error("Duplicate hours"));

  let cron;
  try { cron = fs.readFileSync(CRON_FILE, "utf8"); }
  catch (e) { return callback(e); }

  const re = /^\d+\s+[\d,]+\s+\*\s+\*\s+1-5\s+\/workspace\/start-window\.sh.*$/m;
  if (!re.test(cron)) return callback(new Error("Window cron line not found"));

  const newLine = `0 ${unique.join(",")} * * 1-5 /workspace/start-window.sh >> /workspace/codex-5am.log 2>&1`;
  cron = cron.replace(re, newLine);

  try { fs.writeFileSync(CRON_FILE, cron); }
  catch (e) { return callback(e); }

  execFile("crontab", [CRON_FILE], error => callback(error, unique));
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/schedule") {
    return getSchedule((error, data) => {
      if (error) return send(res, 500, "application/json", JSON.stringify({ error: error.message }));
      send(res, 200, "application/json", JSON.stringify(data));
    });
  }

  if (req.method === "POST" && req.url === "/api/schedule") {
    let body = "";
    req.on("data", c => {
      body += c;
      if (body.length > 10000) req.destroy();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        updateSchedule(data.hours, (error, hours) => {
          if (error) return send(res, 400, "application/json", JSON.stringify({ error: error.message }));
          send(res, 200, "application/json", JSON.stringify({ success: true, hours }));
        });
      } catch {
        send(res, 400, "application/json", JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  const file = req.url === "/" ? "index.html" : req.url.slice(1);
  const safe = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(PUBLIC_DIR, safe);
  if (!full.startsWith(PUBLIC_DIR)) return send(res, 403, "text/plain", "Forbidden");

  fs.readFile(full, (err, data) => {
    if (err) return send(res, 404, "text/plain", "Not found");
    const ext = path.extname(full);
    const type = ext === ".html" ? "text/html; charset=utf-8" : "text/plain";
    send(res, 200, type, data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Codex Scheduler: http://0.0.0.0:${PORT}`);
});
