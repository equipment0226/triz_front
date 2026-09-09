import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ReportSections, Empty, Loading } from "../components/Shared";
import { Solutions } from "./Workspace";
import { ProblemDefinition } from "../components/ProblemDefinition";

export function CaseStudy({ runId, back, solve, tab = "보고서", onTabChange: setTab }) {
  const [view, setView] = useState(null), [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    api(`/public/runs/${encodeURIComponent(runId)}/view`).then(data => { if (!cancelled) setView(data); })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [runId]);
  return <section className="section public-case">
    <button className="button subtle" onClick={back}>← 전체 분석 사례</button>
    {error ? <p role="alert">{error}</p> : !view ? <Loading text="공개 분석 사례를 불러오고 있어요." /> : <>
      <p className="eyebrow">SAMPLE CASE · OPEN BETA</p><h1>{view.title}</h1>
      <p className="lead">{view.industry} · {view.system}</p>

      <div className="workspace-nav" role="tablist" aria-label="공개 분석 자료">{["문제 정의", "해결안", "보고서"].map(t =>
        <button key={t} role="tab" aria-selected={tab === t} className="button subtle" onClick={() => setTab(t)}>{t}</button>)}</div>
      <div className="case-tab-content" key={tab}>
      {tab === "보고서" && (view.report_ready ? <>
        <ReportSections sections={view.report_sections} />
      </> : <Empty text="분석이 아직 완료되지 않았습니다. 현재까지의 해결안은 해결안 탭에서 확인할 수 있습니다." />)}
      {tab === "문제 정의" && <ProblemDefinition view={view} />}
      {tab === "해결안" && <Solutions view={view} />}
      </div>
      <div className="actions"><button className="button dark" onClick={() => solve(view.query)}>내 프로젝트로 새로 분석하기</button></div>
    </>}
  </section>;
}
