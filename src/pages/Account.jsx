import React from "react";
import { samples } from "../data/examples";

export function Login({ auth, seed }) {
  function remember() { sessionStorage.setItem("triz-draft", seed || ""); }
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
      <p className="hint">로그인에는 이름과 이메일을 사용합니다. 소개와 입력 예시는 로그인 없이 둘러볼 수 있습니다.</p>
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
