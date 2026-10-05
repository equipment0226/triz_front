import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";

test("production gateway authenticates, streams API requests, and isolates internal routes", { timeout: 30000 }, async () => {
  let received;
  let upstreamRequests = 0;
  const publicFiles = new Map([
    ["/googledb97084bf62cb561.html", ["text/html; charset=utf-8", "google-site-verification: googledb97084bf62cb561.html"]],
    ["/robots.txt", ["text/plain; charset=utf-8", "User-agent: *\nAllow: /\nSitemap: https://trizstudio.online/sitemap.xml\n"]],
    ["/sitemap.xml", ["application/xml", '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://trizstudio.online/</loc></url></urlset>']],
  ]);
  const upstream = http.createServer(async (req, res) => {
    let body = ""; for await (const chunk of req) body += chunk;
    received = { url: req.url, headers: req.headers, body };
    upstreamRequests++;
    const publicFile = publicFiles.get(new URL(req.url, "http://localhost").pathname);
    if (publicFile) {
      res.writeHead(200, { "Content-Type": publicFile[0], "Content-Length": Buffer.byteLength(publicFile[1]) });
      return res.end(publicFile[1]);
    }
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
      PUBLIC_ORIGIN: "http://localhost:8080", GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "", TRIZ_APP_TOKEN: "fixture-app-token" }, stdio: ["ignore", "pipe", "pipe"] });
  const timeout = setTimeout(() => child.kill(), 10000);
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => done(new Error("Gateway startup timed out")), 10000);
      const ready = () => done();
      const exited = code => done(new Error(`Gateway exited before startup (code ${code})`));
      const done = error => {
        clearTimeout(timer);
        child.stdout.off("data", ready); child.off("exit", exited); child.off("error", done);
        error ? reject(error) : resolve();
      };
      child.stdout.once("data", ready); child.once("exit", exited); child.once("error", done);
    });
    const base = `http://127.0.0.1:${port}`;
    const headers = { Cookie: "triz_session=fixture-session" };
    assert.equal((await fetch(base + "/healthz")).status, 200);
    for (const [path, [contentType, body]] of publicFiles) {
      for (const method of ["GET", "HEAD"]) {
        const response = await fetch(base + path + "?check=google", { method });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type"), contentType);
        assert.equal(response.headers.get("content-length"), String(Buffer.byteLength(body)));
        assert.equal(await response.text(), method === "HEAD" ? "" : body);
        assert.equal(received.url, path + "?check=google");
        assert.equal(received.headers["x-triz-session"], undefined);
      }
      await fetch(base + path, { headers: { ...headers, Authorization: "Bearer spoofed", "X-TRIZ-SESSION": "spoofed-session" } });
      assert.equal(received.headers.cookie, undefined);
      assert.equal(received.headers.authorization, undefined);
      assert.equal(received.headers["x-triz-session"], undefined);
      const beforeWrite = upstreamRequests;
      assert.equal((await fetch(base + path, { method: "POST" })).status, 405);
      assert.equal(upstreamRequests, beforeWrite);
    }
    const beforeRejected = upstreamRequests;
    for (const path of ["/google-other.html", "/googledb97084bf62cb561.html/extra", "/nested/robots.txt", "/robots.txt.bak", "/sitemap.xml/extra"]) {
      for (const method of ["GET", "HEAD"]) {
        await fetch(base + path, { method });
        assert.equal(upstreamRequests, beforeRejected, `${method} ${path} must not reach the backend`);
      }
    }
    for (const method of ["GET", "HEAD", "POST"]) {
      assert.equal((await fetch(base + "/api/runs", { method })).status, 401);
      assert.equal(upstreamRequests, beforeRejected);
    }
    assert.equal((await fetch(base + "/api/public/runs")).status, 201);
    assert.equal((await fetch(base + "/api/public/runs", { method: "POST" })).status, 401);
    assert.equal((await fetch(base + "/")).status, 200);
    assert.equal((await fetch(base + "/auth/session")).status, 200);
    assert.equal((await fetch(base + "/auth/google")).status, 503);
    const callback = await fetch(base + "/auth/google/callback?state=forged&code=forged", { redirect: "manual" });
    assert.equal(callback.status, 303);
    assert.equal(callback.headers.get("location"), "/?page=solve&login_error=1");
    const response = await fetch(base + "/api/runs?mode=FULL", { method: "POST", headers: { ...headers, "Idempotency-Key": "submission-fixture", "X-TRIZ-APP-TOKEN": "spoofed", "X-TRIZ-SESSION": "spoofed-session", "X-TRIZ-USER-ID": "spoofed-user" }, body: "payload" });
    assert.equal(response.status, 201);
    assert.equal(received.url, "/api/runs?mode=FULL");
    assert.equal(received.body, "payload");
    assert.equal(received.headers["x-triz-app-token"], "fixture-app-token");
    assert.equal(received.headers.authorization, undefined);
    assert.equal(received.headers["x-triz-session"], "fixture-session");
    assert.equal(received.headers["x-triz-user-id"], undefined);
    assert.equal(received.headers['idempotency-key'], 'submission-fixture');
    assert.equal((await fetch(base + "/api/runs", { method: "POST", headers: { ...headers, Origin: "https://untrusted.example" } })).status, 403);
    assert.equal((await fetch(base + "/internal/execute", { method: "POST", headers })).status, 405);
    assert.equal((await fetch(base + "/assets/missing.js", { headers })).status, 404);
  } finally {
    clearTimeout(timeout); child.kill();
    upstream.closeAllConnections();
    await new Promise((resolve) => upstream.close(resolve));
  }
});
