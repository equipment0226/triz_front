import React, { useState, useEffect } from 'react';
import { api, post } from '../lib/api';

const labels = { PASS: '완료', CONDITIONAL: '조건부', RUNNING: '진행 중', NOT_RUN: '예정', WAITING: '확인 중', INTERRUPTED: '중단' };
export function AxProgress({ ax }) {
  if (!ax) return null;
  return <section className="panel" aria-label="4개 게이트 진행 상황">
    <div className="actions">{Object.entries(ax.gates).map(([key, gate]) => <span className="pill" key={key}>{key} {gate.label} · {labels[gate.status] || gate.status}</span>)}</div>
    {ax.selection.conditional?.length > 0 && <p>조건부 후보 {ax.selection.conditional.length}개 · 필요한 시험 결과를 확인한 뒤 적용을 판단해 주세요.</p>}
  </section>;
}

// Optional review after execution. This never pauses the coordinator.
export function AxReview({ runId, ax, onError }) {
  const [snapshot, setSnapshot] = useState(null), [target, setTarget] = useState(''),
    [kind, setKind] = useState('APPROVE_EXPLORATION'), [reason, setReason] = useState(''),
    [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false);
  useEffect(() => {
    let active=true;
    api(`/runs/${runId}/ax/snapshots/${ax.snapshot_id}`).then(s => {
      if(active) { setSnapshot(s); setTarget(s.members.concepts || s.members.definition || s.members.input); }
    }).catch(e => onError(e.message));
    return () => { active=false; };
  }, [runId, ax.snapshot_id]);
  if (!snapshot) return null;
  return <form className="panel" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setSaved(false);
    try {
      await post(`/runs/${runId}/ax/reviews`, {event_id: crypto.randomUUID(), expected_epoch: ax.epoch,
        snapshot_id: snapshot.snapshot_id, target_version_id: target, decision_type: kind, reason,
        consent: consent ? 'PROJECT_ONLY' : 'NO_TRAINING'});
      setSaved(true);
    } catch(e) { onError(e.message); } finally { setBusy(false); }
  }}>
    <h3>분석 버전에 대한 검토 의견</h3>
    <p>추가 탐색에 대한 의견을 기록합니다. 탐색 승인은 성능 시험 통과와 구분됩니다.</p>
    <label>검토 대상<select value={target} onChange={e=>setTarget(e.target.value)}>{Object.entries(snapshot.members).map(([key,id])=><option key={id} value={id}>{({input:'입력',problem:'문제 범위',analysis:'분석',definition:'모순 정의',solve:'해결 방향',concepts:'해결안',constraints:'제약',evidence:'근거',evaluation:'평가',selection:'선택',report:'보고서',feedback:'피드백'})[key] || key}</option>)}</select></label>
    <label>의견<select value={kind} onChange={e=>setKind(e.target.value)}><option value="APPROVE_EXPLORATION">추가 탐색에 동의</option><option value="REJECT_EXPLORATION">추가 탐색에 반대</option></select></label>
    <label>이유<textarea required value={reason} onChange={e=>setReason(e.target.value)} /></label>
    <label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />이 의견을 내 프로젝트의 조율 정책 학습에 사용</label>
    <button className="button dark" disabled={busy || !reason.trim()}>검토 의견 저장</button>
    {saved && <p role="status">검토 당시 분석 버전에 의견을 저장했습니다.</p>}
  </form>;
}
