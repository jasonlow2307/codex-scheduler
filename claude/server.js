"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile, execFileSync } = require("child_process");

const DEV_MODE = process.env.DEV_MODE === "1";
const PORT = Number(process.env.PORT || (DEV_MODE ? 3001 : 3000));
const CRON_FILE = "/var/lib/scheduler/claude-crontab";
const DEV_FILE = path.join(__dirname, "dev-schedule.json");
const EXAMPLE_CRON_FILE = path.join(__dirname, "claude-crontab");
const PUBLIC_DIR = path.join(__dirname, "public");
const CRON_PATTERN = /^(\d+)\s+([\d,]+)\s+\*\s+\*\s+1-5\s+(?:\/bin\/bash\s+)?\/workspace\/start-claude-window\.sh[^\n]*$/m;
const MAX_BODY = 4096;

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}
function validate(hours) {
  if (!Array.isArray(hours) || hours.length !== 3 || !hours.every(h => Number.isInteger(h) && h >= 0 && h <= 19)) {
    throw new Error("Provide exactly three distinct start hours between 00:00 and 19:00.");
  }
  const sorted = [...hours].sort((a,b)=>a-b);
  if (sorted[1]-sorted[0] < 5 || sorted[2]-sorted[1] < 5) {
    throw new Error("Start times must be at least five hours apart.");
  }
  return sorted;
}
function parseSchedule(text) {
  const match = text.match(CRON_PATTERN);
  if (!match) throw new Error("Claude scheduler cron line not found");
  return { windowMinutes: match[1], windowHours: match[2].split(",").map(Number) };
}
function readSchedule(cb) {
  if (DEV_MODE) {
    try {
      const data = JSON.parse(fs.readFileSync(DEV_FILE, "utf8"));
      return cb(null, { windowMinutes: "0", windowHours: data.hours });
    } catch (err) {
      if (err.code !== "ENOENT") return cb(err);
      try {
        return cb(null, parseSchedule(fs.readFileSync(EXAMPLE_CRON_FILE, "utf8")));
      } catch (readError) { return cb(readError); }
    }
  }
  execFile("crontab", ["-l"], {timeout: 5000}, (err, stdout) => {
    if (err) return cb(err);
    let schedule;
    try { schedule = parseSchedule(stdout); } catch (parseError) { return cb(parseError); }
    cb(null, schedule);
  });
}
function updateSchedule(hours, cb) {
  let sorted;
  try { sorted = validate(hours); } catch (e) { return cb(e); }
  if (DEV_MODE) {
    try { fs.writeFileSync(DEV_FILE, JSON.stringify({hours: sorted}, null, 2) + "\n"); return cb(null, sorted); }
    catch (err) { return cb(err); }
  }
  let oldText;
  try { oldText = fs.readFileSync(CRON_FILE,"utf8"); }
  catch(err) { return cb(err); }
  if (!CRON_PATTERN.test(oldText)) return cb(new Error("Cron entry not found; refusing to overwrite"));
  const updated = oldText.replace(CRON_PATTERN,
    `0 ${sorted.join(",")} * * 1-5 /bin/bash /workspace/start-claude-window.sh >> /var/lib/scheduler/claude-window.log 2>&1`
  );
  try { fs.writeFileSync(CRON_FILE, updated); }
  catch(err) { return cb(err); }
  // Finish installing or rolling back before accepting another schedule change.
  try {
    execFileSync("crontab", [CRON_FILE], { timeout: 5000 });
  } catch (err) {
    try { fs.writeFileSync(CRON_FILE, oldText); }
    catch (rollbackError) { return cb(rollbackError); }
    return cb(err);
  }
  cb(null, sorted);
}

const server = http.createServer((req,res)=>{
  const url = new URL(req.url, "http://localhost");
  if(url.pathname==="/api/schedule" && req.method === "GET") {
    return readSchedule((err,data)=>err ? json(res,500,{error:err.message}) : json(res,200,data));
  }
  if(url.pathname==="/api/schedule" && req.method === "POST") {
    let body="";
    req.on("data",chunk=>{
      if (res.writableEnded) return;
      body+=chunk;
      if(Buffer.byteLength(body)>MAX_BODY) json(res,413,{error:"Request too large"});
    });
    req.on("end",()=>{
      if (res.writableEnded) return;
      try {
        const data = JSON.parse(body);
        updateSchedule(data.hours, (err,hours)=>err ? json(res,400,{error:err.message}) : json(res,200,{success:true,hours}));
      } catch(err){ json(res,400,{error:"Invalid JSON"}); }
    });
    return;
  }
  if(req.method!=="GET" || (url.pathname!=="/" && url.pathname!=="/index.html")) return json(res,404,{error:"Not found"});
  fs.readFile(path.join(PUBLIC_DIR,"index.html"),(err,contents)=>{
    if (err) return json(res,500,{error:"UI unavailable"});
    res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"});
    res.end(contents);
  });
});
const host = DEV_MODE ? "127.0.0.1" : "0.0.0.0";
server.listen(PORT, host, () => {
  console.log(`Claude Scheduler ready at http://${host}:${server.address().port}${DEV_MODE ? " (local dev mode)" : ""}`);
});
