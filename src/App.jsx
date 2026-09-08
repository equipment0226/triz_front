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
const nav = [
  "Main UI",
  "Tool 소개",
  "Problem Solving",
  "Sample Case",
  "About us",
];
export default function App() {
  const [page, setPage] = useState("Main UI");
  const [selected, setSelected] = useState(null);
  const [seed, setSeed] = useState("");
  const [error, setError] = useState("");
  function solve(query = "") {
    setSeed(query);
    setSelected(null);
    setPage("Problem Solving");
  }
  function openRun(id) {
    setSelected(id);
    setPage("Problem Solving");
  }
  return (
    <>
      <header className="header">
        <button
          className="brand-button"
          onClick={() => setPage("Main UI")}
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
        <button className="button dark nav-cta" onClick={() => solve()}>
          문제 해결 시작 <ArrowUpRight size={16} />
        </button>
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
        {page === "Main UI" ? (
          <Home solve={solve} learn={() => setPage("Tool 소개")} />
        ) : page === "Tool 소개" ? (
          <Introduction solve={solve} />
        ) : page === "Problem Solving" ? (
          <Workspace
            key={selected || "new"}
            selected={selected}
            seed={seed}
            onCreated={openRun}
            onError={setError}
          />
        ) : page === "Sample Case" ? (
          <History openRun={openRun} onError={setError} />
        ) : (
          <div className="about">
            <p className="eyebrow">ABOUT US</p>
            <h1>About us</h1>
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
