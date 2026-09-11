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
import { Brand, Loading, ScrollToTop } from "./components/Shared";
import { Home, Introduction } from "./pages/Marketing";
import { Workspace } from "./pages/Workspace";
import { History } from "./pages/History";
import { Login } from "./pages/Account";
import { CaseStudy } from "./pages/CaseStudy";
import { Notifications } from './components/Notifications';
import { useNavigation } from './lib/navigation';
const nav = [
  "Main",
  "Tool 소개",
  "Problem Solving",
  "Sample Case",
  "About us",
];
export default function App() {
  const [route, navigate] = useNavigation();
  const {page,library,run,tab,listPage,search} = route;
  const selected = page === 'Problem Solving' ? run : null;
  const publicRun = page === 'Sample Case' ? run : null;
  const [auth, setAuth] = useState({ loading: true, user: null, configured: false });
  const goPage = page => {setError(''); navigate({page}, {scrollTop:true});};
  const changeTab = tab => navigate(r => ({...r,tab}));
  const listChange = (values, options) => navigate(r => ({...r,...values}), options);
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
      setAuth(a => ({ ...a, user: null })); setSeed("");
      sessionStorage.removeItem("triz-draft"); goPage("Main");
    } catch (e) { setError(e.message); }
  }
  function solve(query = "") {
    setSeed(query);
    navigate({page:'Problem Solving'}, {scrollTop:true});
  }
  function openRun(id) {
    navigate(r => ({...r,page:'Problem Solving',run:id,library:false,tab:'분석 현황'}), {scrollTop:true});
  }
  return (
    <>
      <header className="header">
        <button
          className="brand-button"
          onClick={() => goPage("Main")}
          aria-label="홈으로"
        >
          <Brand />
        </button>
        <nav aria-label="주 메뉴">
          {nav.map((item) => (
            <button
              key={item}
              onClick={() => {
                goPage(item);
              }}
              className={page === item ? "active" : ""}
            >
              {item}
            </button>
          ))}
        </nav>
        {auth.user ? <div className="account-menu"><Notifications key={auth.user.id || auth.user.email || auth.user.name} user={auth.user} openRun={openRun}/><span>{auth.user.name}</span><button className="button subtle" onClick={logout}>로그아웃</button></div> :
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
          <Home solve={solve} learn={() => goPage("Tool 소개")} />
        ) : page === "Tool 소개" ? (
          <Introduction solve={solve} />
        ) : page === "Problem Solving" ? (
          auth.loading ? <Loading text="로그인 상태를 확인하고 있어요." /> : !auth.user ? <Login auth={auth} seed={seed} /> : <>
          <div className="workspace-nav"><button className="button subtle" onClick={() => solve()}>새 문제 분석</button>
            <button className="button subtle" onClick={() => navigate({page:'Problem Solving',library:true}, {scrollTop:true})}>내 분석 이력</button></div>
          {library ? <History openRun={openRun} onError={setError} page={listPage} term={search} onNavigate={listChange} /> :
          <Workspace
            key={selected || "new"}
            tab={tab}
            onTabChange={changeTab}
            selected={selected}
            seed={seed}
            onCreated={openRun}
            onError={setError}
          />
          }</>
        ) : page === "Sample Case" ? (
          publicRun ? <CaseStudy key={publicRun} runId={publicRun} tab={tab} onTabChange={changeTab} back={() => navigate(r => ({...r,run:null}), {scrollTop:true})} solve={solve} /> :
            <History publicView page={listPage} term={search} onNavigate={listChange} openRun={id => navigate(r => ({...r,run:id,tab:'문제 정의'}), {scrollTop:true})} onError={setError} />
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
      {((page === 'Problem Solving' && auth.user) || publicRun) && <ScrollToTop />}
      <footer>
        <Brand />
        <span>모순에서 시작해, 가능성으로.</span>
        <span>TRIZ × AGENTIC AI</span>
      </footer>
    </>
  );
}
