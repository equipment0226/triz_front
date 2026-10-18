import React, { useRef, useState } from "react";
import { samples } from "../data/examples";
import { withdrawAccount } from "../lib/api";

export function Account({ user, completed, onWithdrawn, onHome, onLogin }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const opener = useRef(null);

  function cancel() {
    setConfirming(false); setConfirmation(""); setAcknowledged(false); setError("");
    requestAnimationFrame(() => opener.current?.focus());
  }
  async function withdraw(event) {
    event.preventDefault();
    if (submitting.current || confirmation !== "회원탈퇴" || !acknowledged) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      await withdrawAccount(confirmation);
      onWithdrawn();
    } catch (e) {
      setError(e.message || "회원탈퇴를 완료하지 못했습니다. 다시 시도해 주세요.");
    } finally { submitting.current = false; setBusy(false); }
  }

  return <section className="section account-section" aria-labelledby="account-title">
    <p className="eyebrow">ACCOUNT</p>
    <h1 id="account-title">계정 관리</h1>
    {completed ? <div className="panel account-panel" role="status">
      <h2>회원탈퇴가 완료되었습니다</h2>
      <p>계정과 연결된 데이터가 삭제되었으며 모든 기기에서 로그아웃되었습니다.</p>
      <button className="button dark" onClick={onHome}>홈으로 이동</button>
    </div> : !user ? <div className="panel account-panel">
      <p>계정을 관리하려면 로그인해 주세요.</p>
      <button className="button dark" onClick={onLogin}>로그인하기</button>
    </div> : <>
      <div className="panel account-panel">
        <h2>내 계정</h2>
        <dl className="account-details"><dt>이름</dt><dd>{user.name}</dd>{user.email && <><dt>이메일</dt><dd>{user.email}</dd></>}</dl>
      </div>
      <div className="panel account-panel withdrawal-panel">
        <h2>회원탈퇴</h2>
        <p>탈퇴하면 내 계정과 연결된 데이터가 영구 삭제되며 복구할 수 없습니다. 필요한 자료는 먼저 내려받아 주세요.</p>
        <ul className="withdrawal-scope">
          <li>이름·이메일 등 회원 정보·보유 Ticket·모든 로그인 세션</li>
          <li>내 TRIZ 분석 이력·보고서·첨부파일 및 공개한 분석 사례</li>
          <li>내 특허 초안과 관련 자료·검토 기록</li>
        </ul>
        <p className="hint">TRIZ 회원 계정을 삭제합니다. Google 계정은 삭제되지 않습니다.</p>
        {!confirming ? <button ref={opener} className="button withdrawal-outline" onClick={() => setConfirming(true)}>회원탈퇴 진행</button> :
          <form className="withdrawal-form" onSubmit={withdraw} aria-labelledby="withdrawal-confirm-title" aria-busy={busy}>
            <h3 id="withdrawal-confirm-title">탈퇴 전 확인해 주세요</h3>
            <fieldset disabled={busy}>
              <label className="withdrawal-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} required />삭제되는 항목과 복구할 수 없음을 확인했습니다.</label>
              <label htmlFor="withdrawal-confirmation">확인 문구</label>
              <p id="withdrawal-confirm-help" className="hint">아래에 <strong>회원탈퇴</strong>를 입력해 주세요.</p>
              <input id="withdrawal-confirmation" value={confirmation} onChange={e => setConfirmation(e.target.value)} aria-describedby="withdrawal-confirm-help" autoComplete="off" autoFocus required />
              <div className="withdrawal-actions"><button className="button subtle" type="button" onClick={cancel}>취소</button><button className="button withdrawal-submit" type="submit" disabled={!acknowledged || confirmation !== "회원탈퇴"}>{busy ? "탈퇴 처리 중…" : "영구 탈퇴"}</button></div>
            </fieldset>
            {busy && <p role="status">계정과 데이터를 삭제하고 있습니다. 잠시 기다려 주세요.</p>}
            {error && <p className="withdrawal-error" role="alert">{error}</p>}
          </form>}
      </div>
    </>}
  </section>;
}

export function Login({ auth, seed, onLogin }) {
  function remember() { sessionStorage.setItem("triz-draft", seed || ""); onLogin?.(); }
  return <section className="section login-section">
    <div className="panel login-card">
      <p className="eyebrow">PROBLEM SOLVING</p>
      <h1>Google 계정으로 시작하세요</h1>
      <p className="lead">문제를 분석하고, 나만의 프로젝트와 보고서를 이어서 관리하세요.</p>
      <p>처음 로그인하면 회원 계정이 자동으로 만들어집니다.</p>
      {auth.loading ? <p role="status">로그인 상태를 확인하고 있습니다.</p> : auth.configured ?
        <a className="button google-login" href="/auth/google" onClick={remember}><b aria-hidden="true">G</b> Google로 계속하기</a> :
        <p role="status">Google 로그인 연결을 준비하고 있습니다. 잠시 후 다시 방문해 주세요.</p>}
      {new URLSearchParams(location.search).has("login_error") && <p role="alert">로그인을 완료하지 못했습니다. 다시 시도해 주세요.</p>}
      <p className="hint">로그인에는 이름과 이메일을 사용합니다. 무료 베타의 모든 분석 사례와 보고서는 로그인 없이 볼 수 있습니다.</p>
    </div>
  </section>;
}

export function Samples({ solve }) {
  return <section className="section">
    <p className="eyebrow">SAMPLE CASE</p><h1>이런 문제에서 시작해 보세요</h1>
    <p className="lead">설명용 입력 예시입니다. 로그인 후 내 프로젝트에서 분석할 수 있습니다.</p>
    <div className="sample-grid">{samples.map(([tag, title, query]) =>
      <article className="panel" key={tag}><p className="eyebrow">{tag}</p><h2>{title}</h2><p>{query}</p>
        <button className="button subtle" onClick={() => solve(query)}>이 문제로 시작</button></article>)}</div>
  </section>;
}
