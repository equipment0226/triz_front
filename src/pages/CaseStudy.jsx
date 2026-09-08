import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Figure, ReportSections, Empty } from "../components/Shared";
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
      <div className="panel"><h2>문제 상황</h2><p>{view.query}</p><p>{view.summary || view.problem}</p></div>
      <div className="workspace-nav" role="tablist" aria-label="공개 분석 자료">{["보고서", "분석 도식", "해결안"].map(t =>
        <button key={t} role="tab" aria-selected={tab === t} className="button subtle" onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === "보고서" && (view.report_ready ? <>
        <div className="actions"><a className="button dark" href={`/api/public/runs/${encodeURIComponent(runId)}/report`}>보고서 다운로드</a></div>
        <ReportSections sections={view.report_sections} />
        <Solutions view={view} />
      </> : <Empty text="분석이 아직 완료되지 않았습니다. 현재까지의 도식과 해결안은 각 탭에서 확인할 수 있습니다." />)}
      {tab === "분석 도식" && view.figures.map(f => <Figure key={f.key} figure={f} />)}
      {tab === "해결안" && <Solutions view={view} />}
      <div className="actions"><button className="button dark" onClick={() => solve(view.query)}>내 프로젝트로 새로 분석하기</button></div>
    </>}
  </section>;
}
