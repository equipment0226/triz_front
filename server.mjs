import http from "node:http";
import https from "node:https";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { handleAuth, cookie, sessionCookie } from "./auth.mjs";

const root = fileURLToPath(new URL("./dist/", import.meta.url));
const backend = new URL(process.env.BACKEND_URL || "http://127.0.0.1:8000");
if (!["http:", "https:"].includes(backend.protocol) || backend.username || backend.password)
  throw new Error("BACKEND_URL must be an HTTP(S) origin without credentials");
const appToken = process.env.TRIZ_APP_TOKEN || "";
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon" };
const hop = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade", "authorization", "cookie", "host", "x-triz-app-token", "x-triz-session", "x-triz-user-id"]);

const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname === "/healthz") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end('{"ok":true}');
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.origin;
      if (req.headers["sec-fetch-site"] === "cross-site" || (origin && new URL(origin).host !== req.headers.host)) {
        res.writeHead(403); return res.end("Cross-origin request rejected");
      }
    }
    if (await handleAuth(req, res, backend, appToken)) return;
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      const session = cookie(req, sessionCookie);
      if (!session) {
        res.writeHead(401, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        return res.end(JSON.stringify({ detail: "Google 로그인 후 사용할 수 있습니다." }));
      }
      const headers = Object.fromEntries(Object.entries(req.headers).filter(([name]) => !hop.has(name) && !name.startsWith("x-forwarded-")));
      if (appToken) headers["x-triz-app-token"] = appToken;
      headers["x-triz-session"] = session;
      const transport = backend.protocol === "https:" ? https : http;
      // The destination is fixed; an incoming absolute URL cannot change the upstream host.
      const upstream = transport.request({ hostname: backend.hostname, port: backend.port || undefined,
        protocol: backend.protocol, method: req.method, path: pathname + new URL(req.url, "http://localhost").search,
        headers, timeout: 3600000 }, (response) => {
        res.writeHead(response.statusCode || 502, { ...Object.fromEntries(Object.entries(response.headers).filter(([name]) => !hop.has(name))), "Cache-Control": "no-store" });
        response.pipe(res);
      });
      upstream.on("timeout", () => upstream.destroy());
      upstream.on("error", () => {
        if (!res.headersSent) res.writeHead(502, { "Content-Type": "application/json" });
        res.end('{"detail":"분석 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요."}');
      });
      req.on("aborted", () => upstream.destroy());
      res.on("close", () => { if (!res.writableFinished) upstream.destroy(); });
      req.pipe(upstream);
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405); return res.end(); }
    let file = resolve(root, "." + decodeURIComponent(pathname));
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep) && file !== resolve(root)) {
      res.writeHead(404); return res.end();
    }
    let info;
    try { info = await stat(file); } catch {}
    if (!info?.isFile()) {
      if (extname(pathname)) { res.writeHead(404); return res.end(); }
      file = resolve(root, "index.html"); info = await stat(file);
    }
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Content-Length": info.size, "Cache-Control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache" });
    if (req.method === "HEAD") return res.end();
    createReadStream(file).on("error", () => res.destroy()).pipe(res);
  } catch {
    if (!res.headersSent) res.writeHead(400);
    res.end("Invalid request");
  }
});
server.listen(Number(process.env.PORT || 8080), "::", () => console.log("TRIZ frontend server ready"));
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => server.close(() => process.exit(0)));
