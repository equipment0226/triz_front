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
import { SafeLink, Bot, HeroArt, TreeSpeech, useReveal } from "../components/Shared";
import { samples } from "../data/examples";
export function Home({ solve, learn }) {
  const reveal=useReveal();
  return (
    <div ref={reveal} className="marketing-page">
      <section className="hero section">
        <div className="hero-copy" data-reveal>
          <p className="eyebrow">
            <span className="dot" /> ENGINEER YOUR NEXT POSSIBILITY
          </p>
          <h1>
            풀리지 않던 문제,
            <br />
            새로운 <span className="accent">관점</span>을 만나다
            <span className="period">.</span>
          </h1>
          <p className="hero-description">
            익숙한 타협을 넘어 더 나은 해결책으로.
            <br />
            TRIZ의 체계적인 사고와 Agentic AI가
            <br />
            당신의 문제 해결 여정을 함께합니다.
          </p>
          <div className="actions">
            <button className="button dark" onClick={() => solve()}>
              내 문제 해결하기 <ArrowUpRight size={18} />
            </button>
            <button className="button text" onClick={learn}>
              어떻게 작동하나요? <ArrowRight size={17} />
            </button>
          </div>
          <div className="hero-note">
            <span className="mini-people">
              <i />
              <i />
              <i />
            </span>
            <span>문제 정의부터 전문가 검토까지, 하나의 워크스페이스</span>
          </div>
        </div>
        <HeroArt />
      </section>
      <section className="section why">
        <div className="section-top">
          <div>
            <p className="eyebrow">THINK BEYOND TRADE-OFFS</p>
            <h2>
              하나를 얻기 위해,
              <br />
              다른 하나를 포기해야 할까요?
            </h2>
          </div>
          <p>
            TRIZ는 문제 안의 모순을 찾고, 다른 분야에서 검증된
            <br />
            발명의 원리로 새로운 해결 방향을 탐색합니다.
          </p>
        </div>
        <div className="feature-grid">
          {[
            [
              Network,
              "문제를 구조로 이해하다",
              "현상에서 원인으로. 기능과 자원의 관계를 분석해 해결해야 할 핵심 모순을 찾습니다.",
            ],
            [
              Lightbulb,
              "산업의 경계를 넘어 찾다",
              "40가지 발명원리와 타산업 특허의 메커니즘에서 지금 문제에 적용할 아이디어를 발견합니다.",
            ],
            [
              ShieldCheck,
              "검증하며 구체화하다",
              "제약과 여러 전문가의 관점을 함께 검토하고, 실행을 위한 실험 계획을 세웁니다.",
            ],
          ].map(([Icon, title, desc], i) => (
            <article className="feature" key={title} data-reveal style={{'--reveal-delay':`${i*110}ms`}}>
              <span className="number">0{i + 1}</span>
              <Icon size={29} strokeWidth={1.3} />
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section explore">
        <div className="section-top">
          <div>
            <p className="eyebrow">START WITH A QUESTION</p>
            <h2>어떤 문제를 풀고 있나요?</h2>
          </div>
          <span className="muted">
            입력 예시 · 분석 결과는 실행 후 생성됩니다
          </span>
        </div>
        <div className="sample-grid">
          {samples.map(([tag, title, query], i) => (
            <button key={tag} className="sample" onClick={() => solve(query)} data-reveal style={{'--reveal-delay':`${i*110}ms`}}>
              <span className={"sample-art a" + i}>
                <img src={['/images/semiconductor-cleanroom.jpg','/images/deposition.jpg','/images/datacenter.jpg'][i]} alt={['반도체 제조 클린룸의 공정 장비','플라즈마 화학기상증착 장비','데이터센터의 서버 랙'][i]} loading="lazy" width="960" height="640"/>
                <span className="photo-label">{['SEMICONDUCTOR','PRECISION PROCESS','DATA INFRASTRUCTURE'][i]}</span>
              </span>
              <small>{tag}</small>
              <h3>{title}</h3>
              <span>
                이 문제로 시작 <ArrowUpRight size={16} />
              </span>
            </button>
          ))}
        </div>
        <details className="photo-credits"><summary>사진 출처</summary><p>반도체 클린룸: <SafeLink href="https://commons.wikimedia.org/wiki/File:Clean_room.jpg">NASA Glenn Research Center</SafeLink> · Public domain.<br/>증착 장비: <SafeLink href="https://commons.wikimedia.org/wiki/File:Chemical_vapour_deposition_machine_in_the_LCN.jpg">O. Usher (UCL MAPS)</SafeLink> · <SafeLink href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</SafeLink>.<br/>서버: <SafeLink href="https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_35.jpg">Victor Grigas / Wikimedia Foundation</SafeLink> · <SafeLink href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</SafeLink>.<br/>카드 비율에 맞춰 화면에서 일부 영역을 표시합니다.</p></details>
      </section>
      <section className="section start-banner">
        <div>
          <p className="eyebrow">YOUR NEXT BREAKTHROUGH</p>
          <h2>좋은 질문이 새로운 가능성의 시작입니다.</h2>
        </div>
        <button className="button light" onClick={() => solve()}>
          문제 해결 시작 <ArrowUpRight size={18} />
        </button>
      </section>
    </div>
  );
}

export function Introduction({ solve }) {
  const reveal=useReveal();
  return (
    <div className="section intro" ref={reveal}>
      <p className="eyebrow">MEET YOUR THINKING PARTNER</p>
      <h1>
        TRIZ를 몰라도,
        <br />
        문제의 본질에 가까워지도록.
      </h1>
      <p className="lead">
        당신은 현장을 설명하고, AI는 질문하고 분석합니다.
        <br />
        단계별 템플릿과 산업 전문가의 관점이 해결 과정을 안내합니다.
      </p>
      <div className="journey">
        {[
          [
            "01",
            "질문하고 이해합니다",
            "업종과 난이도, 시스템의 경계를 확인하고 필요한 기술 조건을 함께 정리합니다.",
          ],
          [
            "02",
            "구조로 시각화합니다",
            "기능 모델, 9 Windows, 물질–장, 인과사슬로 문제의 관계를 드러냅니다.",
          ],
          [
            "03",
            "모순에서 발명합니다",
            "발명원리·분리원리·표준해·ARIZ 등 문제에 맞는 기법을 조합합니다.",
          ],
          [
            "04",
            "검토하고 실행합니다",
            "특허·논문, 제약 검토, 다직군 평가를 거쳐 가정과 검증 실험을 보고서에 담습니다.",
          ],
        ].map(([n, t, d],i) => (
          <article key={n} data-reveal style={{'--reveal-delay':`${i*220}ms`}}>
            <span>{n}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </article>
        ))}
      </div>
      <div className="intro-callout" data-reveal>
        <Bot mood="welcome" />
        <div>
          <h3>중요한 판단에는 당신의 의견을.</h3>
          <TreeSpeech messages={['문제를 편하게 설명해 주세요. 필요한 정보는 제가 하나씩 물어볼게요.','중요한 판단 앞에서는 잠깐 멈추고 의견을 기다려요. 우리는 함께 문제를 풀고 있어요.','다른 관점이 필요하다면 전문가를 추가하고, 원하는 단계부터 다시 검토할 수 있어요.']}/>
        </div>
      </div>
      <button className="button dark" onClick={() => solve()}>
        첫 프로젝트 시작 <ArrowUpRight size={18} />
      </button>
    </div>
  );
}
