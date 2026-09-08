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
import { SafeLink, Bot, HeroArt } from "../components/Shared";
import { samples } from "../data/examples";
export function Home({ solve, learn }) {
  return (
    <>
      <section className="hero section">
        <div className="hero-copy">
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
      <section className="adopters section">
        <div>
          <p className="eyebrow">PROVEN THINKING, NEW POSSIBILITIES</p>
          <p>
            산업 현장에서 활용해 온<br />
            <b>체계적인 문제 해결 방법, TRIZ</b>
          </p>
        </div>
        <div className="company">
          <strong>SAMSUNG</strong>
          <SafeLink href="https://news.samsung.com/kr/혁신-dna는-이렇게-전파된다···-삼성-협력회사-혁신">
            S사 · 공개 자료 <ArrowUpRight size={13} />
          </SafeLink>
        </div>
        <div className="company">
          <strong>POSCO</strong>
          <SafeLink href="https://www.posco.co.kr/homepage/docs/kr/news/pbn/s91fpbnn003c.jsp?idx=201993&pidx=202002">
            P사 · 공개 자료 <ArrowUpRight size={13} />
          </SafeLink>
        </div>
        <div className="company">
          <strong>LG CABLE</strong>
          <SafeLink href="https://www.aitriz.org/articles/InsideTRIZ/3230313030342D4B616E67.pdf">
            L사 · 공개 자료 <ArrowUpRight size={13} />
          </SafeLink>
        </div>
        <small className="adoption-note">
          TRIZ 방법론의 공개 활용 사례입니다. 본 서비스와의 제휴를 의미하지
          않습니다.
        </small>
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
            <article className="feature" key={title}>
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
            <button key={tag} className="sample" onClick={() => solve(query)}>
              <span className={"sample-art a" + i}>
                {i === 0 ? (
                  <Layers3 size={80} strokeWidth={0.7} />
                ) : i === 1 ? (
                  <Network size={80} strokeWidth={0.7} />
                ) : (
                  <CircleDot size={80} strokeWidth={0.7} />
                )}
              </span>
              <small>{tag}</small>
              <h3>{title}</h3>
              <span>
                이 문제로 시작 <ArrowUpRight size={16} />
              </span>
            </button>
          ))}
        </div>
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
    </>
  );
}

export function Introduction({ solve }) {
  return (
    <div className="section intro">
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
        ].map(([n, t, d]) => (
          <article key={n}>
            <span>{n}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </article>
        ))}
      </div>
      <div className="intro-callout">
        <Bot />
        <div>
          <h3>중요한 판단에는 당신의 의견을.</h3>
          <p>
            추가 질문에 답하고, 대상 시스템을 확정하고, 중간 분석에 의견을
            남기세요.
            <br />
            필요한 전문가의 관점을 추가해 해당 단계부터 다시 검토할 수 있습니다.
          </p>
        </div>
      </div>
      <button className="button dark" onClick={() => solve()}>
        첫 프로젝트 시작 <ArrowUpRight size={18} />
      </button>
    </div>
  );
}
