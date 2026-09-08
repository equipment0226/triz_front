import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";

test("production gateway authenticates, streams API requests, and isolates internal routes", async () => {
  let received;
  const upstream = http.createServer(async (req, res) => {
    let body = ""; for await (const chunk of req) body += chunk;
    received = { url: req.url, headers: req.headers, body };
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  }).listen(0, "127.0.0.1");
  await once(upstream, "listening");
  const reservation = http.createServer().listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const child = spawn(process.execPath, ["server.mjs"], { cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: String(port), BACKEND_URL: `http://127.0.0.1:${upstream.address().port}`,
      DEMO_USERNAME: "reviewer", DEMO_PASSWORD: "fixture-password", TRIZ_APP_TOKEN: "fixture-app-token" }, stdio: ["ignore", "pipe", "pipe"] });
  const timeout = setTimeout(() => child.kill(), 10000);
  try {
    await once(child.stdout, "data");
    const base = `http://127.0.0.1:${port}`;
    const headers = { Authorization: "Basic " + Buffer.from("reviewer:fixture-password").toString("base64") };
    assert.equal((await fetch(base + "/healthz")).status, 200);
    assert.equal((await fetch(base + "/api/runs")).status, 401);
    assert.equal((await fetch(base + "/", { headers })).status, 200);
    const response = await fetch(base + "/api/runs?mode=FULL", { method: "POST", headers: { ...headers, "X-TRIZ-APP-TOKEN": "spoofed" }, body: "payload" });
    assert.equal(response.status, 201);
    assert.equal(received.url, "/api/runs?mode=FULL");
    assert.equal(received.body, "payload");
    assert.equal(received.headers["x-triz-app-token"], "fixture-app-token");
    assert.equal(received.headers.authorization, undefined);
    assert.equal((await fetch(base + "/api/runs", { method: "POST", headers: { ...headers, Origin: "https://untrusted.example" } })).status, 403);
    assert.equal((await fetch(base + "/internal/execute", { method: "POST", headers })).status, 405);
    assert.equal((await fetch(base + "/assets/missing.js", { headers })).status, 404);
  } finally {
    clearTimeout(timeout); child.kill();
    await new Promise((resolve) => upstream.close(resolve));
  }
});
