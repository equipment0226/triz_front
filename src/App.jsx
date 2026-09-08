import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers3,
  CircleDot,
  Network,
  MoveUpRight,
  Plus,
  Paperclip,
  X,
  Check,
  ChevronRight,
  Download,
  Search,
  BookOpen,
  FlaskConical,
  ShieldCheck,
  Lightbulb,
  UserRound,
  ChartNoAxesCombined,
  RefreshCw,
  Send,
} from "lucide-react";
import { Brand } from "./components/Shared";
import { Home, Introduction } from "./pages/Marketing";
import { Workspace } from "./pages/Workspace";
import { History } from "./pages/History";
import { Login, Samples } from "./pages/Account";
const nav = [
  "Main",
  "Tool 소개",
  "Problem Solving",
  "Sample Case",
  "About us",
];
export default function App() {
  const [page, setPage] = useState(new URLSearchParams(location.search).get("page") === "solve" ? "Problem Solving" : "Main");
  const [auth, setAuth] = useState({ loading: true, user: null, configured: false });
  const [library, setLibrary] = useState(false);
  const [selected, setSelected] = useState(null);
  const [seed, setSeed] = useState(() => sessionStorage.getItem("triz-draft") || "");
  const [error, setError] = useState("");
  useEffect(() => {
    const refresh = () => fetch("/auth/session").then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setAuth({ ...data, loading: false }))
      .catch(() => setAuth({ loading: false, user: null, configured: false }));
    refresh();
    window.addEventListener("triz-session-expired", refresh);
    return () => window.removeEventListener("triz-session-expired", refresh);
  }, []);
  async function logout() {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("로그아웃하지 못했습니다. 다시 시도해 주세요.");
      setAuth(a => ({ ...a, user: null })); setSelected(null); setSeed(""); setLibrary(false);
      sessionStorage.removeItem("triz-draft"); setPage("Main");
    } catch (e) { setError(e.message); }
  }
  function solve(query = "") {
    setSeed(query);
    setSelected(null);
    setLibrary(false);
    setPage("Problem Solving");
  }
  function openRun(id) {
    setSelected(id);
    setLibrary(false);
    setPage("Problem Solving");
  }
  return (
    <>
      <header className="header">
        <button
          className="brand-button"
          onClick={() => setPage("Main")}
          aria-label="홈으로"
        >
          <Brand />
        </button>
        <nav aria-label="주 메뉴">
          {nav.map((item) => (
            <button
              key={item}
              onClick={() => {
                setPage(item);
                setError("");
              }}
              className={page === item ? "active" : ""}
            >
              {item}
            </button>
          ))}
        </nav>
        {auth.user ? <div className="account-menu"><span>{auth.user.name}</span><button className="button subtle" onClick={logout}>로그아웃</button></div> :
          <button className="button dark nav-cta" onClick={() => solve()}>로그인 / 시작하기 <ArrowUpRight size={16} /></button>}
      </header>
      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="알림 닫기">
            <X size={16} />
          </button>
        </div>
      )}
      <main>
        {page === "Main" ? (
          <Home solve={solve} learn={() => setPage("Tool 소개")} />
        ) : page === "Tool 소개" ? (
          <Introduction solve={solve} />
        ) : page === "Problem Solving" ? (
          !auth.user ? <Login auth={auth} seed={seed} /> : <>
          <div className="workspace-nav"><button className="button subtle" onClick={() => solve()}>새 문제 분석</button>
            <button className="button subtle" onClick={() => setLibrary(true)}>내 분석 이력</button></div>
          {library ? <History openRun={openRun} onError={setError} /> :
          <Workspace
            key={selected || "new"}
            selected={selected}
            seed={seed}
            onCreated={openRun}
            onError={setError}
          />
          }</>
        ) : page === "Sample Case" ? (
          <Samples solve={solve} />
        ) : (
          <div className="about">
            <p className="eyebrow">ABOUT US</p>
            <h1>About us</h1>
            <div className="profile-card">
              <img src="/profile.jpg" alt="Dae-Seong Ray Yang 프로필 사진" width="230" height="300" />
              <div><p>Ideation : Dae-Seong Ray Yang</p><p>E-mail : <a href="mailto:equipment0226@gmail.com">equipment0226@gmail.com</a></p></div>
            </div>
          </div>
        )}
      </main>
      <footer>
        <Brand />
        <span>모순에서 시작해, 가능성으로.</span>
        <span>TRIZ × AGENTIC AI</span>
      </footer>
    </>
  );
}
