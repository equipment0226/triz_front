import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ReportSections, Empty, SearchStatus } from "../components/Shared";
import { Solutions } from "./Workspace";

export function CaseStudy({ runId, back, solve }) {
  const [view, setView] = useState(null), [error, setError] = useState(""), [tab, setTab] = useState("보고서");
  useEffect(() => {
    let cancelled = false;
    api(`/public/runs/${encodeURIComponent(runId)}/view`).then(data => { if (!cancelled) setView(data); })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [runId]);
  return <section className="section public-case">
    <button className="button subtle" onClick={back}>← 전체 분석 사례</button>
    {error ? <p role="alert">{error}</p> : !view ? <Empty text="공개 분석 사례를 불러오고 있습니다." /> : <>
      <p className="eyebrow">SAMPLE CASE · OPEN BETA</p><h1>{view.title}</h1>
      <p className="lead">{view.industry} · {view.system}</p>

      <div className="workspace-nav" role="tablist" aria-label="공개 분석 자료">{["분석 현황", "해결안", "보고서"].map(t =>
        <button key={t} role="tab" aria-selected={tab === t} className="button subtle" onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === "보고서" && (view.report_ready ? <>
        <ReportSections sections={view.report_sections} />
      </> : <Empty text="분석이 아직 완료되지 않았습니다. 현재까지의 해결안은 해결안 탭에서 확인할 수 있습니다." />)}
      {tab === "분석 현황" && <><SearchStatus status={view.search_status} /><div className="panel"><h2>문제 상황</h2><p>{view.query}</p><p>{view.summary || view.problem}</p><p>{view.guide}</p></div></>}
      {tab === "해결안" && <Solutions view={view} />}
      <div className="actions"><button className="button dark" onClick={() => solve(view.query)}>내 프로젝트로 새로 분석하기</button></div>
    </>}
  </section>;
}
