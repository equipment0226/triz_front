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
import { api } from "../lib/api";
import { Empty } from "../components/Shared";
const statusLabel = {
  CREATED: "분석 준비",
  QUEUED: "분석 대기",
  RUNNING: "분석 중",
  WAITING_HUMAN: "의견 확인",
  COMPLETED: "완료",
  FAILED: "재시도 필요",
  INTERRUPTED: "일시 중단",
};
export function History({ openRun, onError }) {
  const [runs, setRuns] = useState([]),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api("/runs")
      .then(setRuns)
      .catch((e) => onError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const filtered = runs.filter((r) =>
    (r.title + " " + r.industry + " " + r.target_system)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="section history">
      <div className="section-top">
        <div>
          <p className="eyebrow">MY PROJECTS</p>
          <h1>내 분석 이력</h1>
          <p className="lead">
            분석 과정과 보고서를 다시 살펴보고, 다음 가능성을 발견하세요.
          </p>
        </div>
        <span className="library-count">
          {runs.length}
          <small>PROJECTS</small>
        </span>
      </div>
      <label className="search-box">
        <Search size={19} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="문제명, 산업, 시스템으로 검색"
          aria-label="프로젝트 검색"
        />
      </label>
      <div className="history-list">
        <div className="history-head">
          <span>프로젝트</span>
          <span>진행 상태</span>
          <span>시작일</span>
        </div>
        {filtered.map((r) => (
          <button
            className="history-row"
            key={r.run_id}
            onClick={() => openRun(r.run_id)}
          >
            <div>
              <small>
                {r.industry || "업종 확인 중"}
                {r.target_system ? " / " + r.target_system : ""}
              </small>
              <h3>{r.title}</h3>
            </div>
            <span className="pill">{statusLabel[r.status] || "진행 확인"}</span>
            <span className="date">
              {r.started_at?.slice(0, 10)}
              <ArrowUpRight size={18} />
            </span>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <Empty
          text={
            loading
              ? "프로젝트를 불러오고 있어요."
              : search
                ? "검색 조건에 맞는 프로젝트가 없습니다."
                : "아직 분석 기록이 없습니다. 첫 문제를 입력해 프로젝트를 시작해 보세요."
          }
        />
      )}
    </div>
  );
}
