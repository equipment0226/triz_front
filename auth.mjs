import { OAuth2Client } from "google-auth-library";
import { randomBytes, createHmac, timingSafeEqual, createHash } from "node:crypto";

const clientId = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const origin = process.env.PUBLIC_ORIGIN || "http://localhost:8080";
const secure = new URL(origin).protocol === "https:";
const callback = new URL("/auth/google/callback", origin).href;
const signingKey = process.env.AUTH_COOKIE_SECRET || process.env.TRIZ_APP_TOKEN || randomBytes(32).toString("hex");
const oauth = new OAuth2Client(clientId, clientSecret, callback);
export const sessionCookie = secure ? "__Host-triz_session" : "triz_session";
const flowCookie = secure ? "__Host-triz_oauth" : "triz_oauth";
export const configured = Boolean(clientId && clientSecret);
const sign = (s) => createHmac("sha256", signingKey).update(s).digest("base64url");
const equal = (a, b) => typeof a === "string" && typeof b === "string" && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function cookie(req, name) {
  return (req.headers.cookie || "").split(";").map(s => s.trim()).find(s => s.startsWith(name + "="))?.slice(name.length + 1) || "";
}
function setCookie(res, name, value, age) {
  res.setHeader("Set-Cookie", `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? "; Secure" : ""}`);
}
function seal(data) { const s = Buffer.from(JSON.stringify(data)).toString("base64url"); return s + "." + sign(s); }
function unseal(value) {
  const [s, signature] = value.split(".");
  if (!s || !equal(sign(s), signature)) throw new Error("Invalid login state");
  const data = JSON.parse(Buffer.from(s, "base64url"));
  if (data.exp < Date.now()) throw new Error("Expired login state");
  return data;
}
export async function accountRequest(backend, appToken, path, method = "GET", body, session = "") {
  const response = await fetch(new URL("/internal/auth/" + path, backend), {
    method, headers: { "Content-Type": "application/json", "X-TRIZ-APP-TOKEN": appToken, "X-TRIZ-SESSION": session },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Account request failed");
  return response.json();
}
export async function handleAuth(req, res, backend, appToken) {
  const url = new URL(req.url, origin);
  if (!url.pathname.startsWith("/auth/")) return false;
  res.setHeader("Cache-Control", "no-store");
  const json = (status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
  if (url.pathname === "/auth/session" && req.method === "GET") {
    const session = cookie(req, sessionCookie);
    const data = session ? await accountRequest(backend, appToken, "session", "GET", undefined, session) : { user: null };
    json(200, { ...data, configured }); return true;
  }
  if (url.pathname === "/auth/logout" && req.method === "POST") {
    const session = cookie(req, sessionCookie);
    if (session) await accountRequest(backend, appToken, "session", "DELETE", undefined, session);
    setCookie(res, sessionCookie, "", 0); json(200, { ok: true }); return true;
  }
  if (req.method !== "GET") { json(405, { detail: "Method not allowed" }); return true; }
  if (url.pathname === "/auth/google") {
    if (!configured) { json(503, { detail: "Google 로그인 연결을 준비하고 있습니다." }); return true; }
    const state = randomBytes(32).toString("base64url"), nonce = randomBytes(32).toString("base64url");
    const verifier = randomBytes(32).toString("base64url");
    setCookie(res, flowCookie, seal({ state, nonce, verifier, exp: Date.now() + 600000 }), 600);
    res.writeHead(302, { Location: oauth.generateAuthUrl({ scope: ["openid", "email", "profile"], state, nonce,
      code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256", prompt: "select_account" }) });
    res.end(); return true;
  }
  if (url.pathname === "/auth/google/callback") {
    try {
      const flow = unseal(cookie(req, flowCookie));
      setCookie(res, flowCookie, "", 0);
      if (!configured || !equal(flow.state, url.searchParams.get("state")) || !url.searchParams.get("code")) throw new Error("Invalid callback");
      const { tokens } = await oauth.getToken({ code: url.searchParams.get("code"), codeVerifier: flow.verifier });
      const ticket = await oauth.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
      const p = ticket.getPayload();
      if (!p?.sub || !p.email_verified || !equal(p.nonce, flow.nonce)) throw new Error("Invalid identity");
      const data = await accountRequest(backend, appToken, "sessions", "POST", { subject: p.sub, email: p.email, name: p.name || p.email });
      res.setHeader("Set-Cookie", [res.getHeader("Set-Cookie"), `${sessionCookie}=${data.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure ? "; Secure" : ""}`]);
      res.writeHead(303, { Location: "/?page=solve" }); res.end();
    } catch {
      // Authorization codes, tokens and upstream errors must never appear in logs or the browser.
      res.writeHead(303, { Location: "/?page=solve&login_error=1" }); res.end();
    }
    return true;
  }
  json(404, { detail: "Not found" }); return true;
}
