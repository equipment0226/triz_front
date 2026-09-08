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
import DOMPurify from "dompurify";
export function SafeLink({ href, children, ...props }) {
  return /^https?:\/\//i.test(href || "") ? (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ) : (
    <span>{children}</span>
  );
}

export function Bot({ small = false }) {
  return (
    <div className={"bot " + (small ? "small" : "")} aria-hidden="true">
      <span />
      <span />
      <i />
    </div>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Layers3 size={21} />
      </span>
      triz<span className="brand-thin">studio</span>
      <sup>β</sup>
    </span>
  );
}

export function Figure({ figure }) {
  const [zoom, setZoom] = useState(1);
  return (
    <figure className="figure">
      <div className="figure-controls"><button onClick={() => setZoom(z => Math.max(1, z - .25))} disabled={zoom <= 1} aria-label="도식 축소">−</button>
        <button onClick={() => setZoom(1)} aria-label="도식 크기 초기화">{Math.round(zoom * 100)}%</button>
        <button onClick={() => setZoom(z => Math.min(3, z + .25))} disabled={zoom >= 3} aria-label="도식 확대">+</button></div>
      <div className="figure-scroll" tabIndex={0} aria-label={figure.title + " 확대 및 스크롤"}>
      <div
        style={{ width: `${zoom * 100}%`, minWidth: 600 }}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(figure.svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
          }),
        }}
      />
      </div>
      <figcaption>{figure.title}</figcaption>
    </figure>
  );
}

export function ReportSections({ sections = [] }) {
  return <div className="report-process">{sections.map(section => <section className="panel report-section" key={section.key}>
    <h2>{section.title}</h2>
    {(section.blocks || [{ type: "html", html: section.html || "" }, ...(section.figures || []).map(figure => ({ type: "figure", figure }))]).map((block, i) =>
      block.type === "figure" ? <Figure key={block.figure.key} figure={block.figure} /> :
        <div className="report-prose" key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.html) }} />)}
  </section>)}</div>;
}

export function ReferenceCard({ reference: r }) {
  return <article className="reference-card">
    {r.status && <p className="reference-status">{r.status}</p>}
    <SafeLink className="reference-title" href={r.url}><span className="reference-kind">{r.kind}</span> {r.title} ↗</SafeLink>
    {r.description && <p className="reference-description">{r.description}</p>}
    {(r.identifier || r.scope) && <p className="reference-meta">{[r.identifier, r.scope].filter(Boolean).join(" · ")}</p>}
  </article>;
}

export function SearchStatus({ status = {} }) {
  const messages = {
    UNAVAILABLE: "검색 서비스의 응답 오류로 특허 검색을 완료하지 못했습니다. 서비스 연결이 복구된 뒤 다시 조회해야 합니다.",
    PARTIAL: "일부 특허 자료를 확보했지만, 완료하지 못했거나 상태 확인이 필요한 검색이 남아 있습니다.",
    UNKNOWN: "이전 검색 기록에서 서비스 오류와 정상적인 결과 0건을 구분할 수 없습니다. 재조회가 필요합니다.",
    EMPTY: "이번 검색어에 대한 조회는 완료됐으며 수집된 특허 후보는 0건입니다.",
    OK: "특허 후보 수집을 완료했습니다. 해결안과의 적용성 검토 결과는 해결안과 보고서에서 확인할 수 있습니다.",
  };
  if (!messages[status.patent_status]) return null;
  return <div className="panel search-status"><h3>특허 검색 상태</h3><p>{messages[status.patent_status]}</p>
    <p>검색어 {status.patent_queries || 0}개 · 확보한 후보 {status.patent_records || 0}건</p></div>;
}

export function HeroArt() {
  return (
    <div
      className="hero-art"
      aria-label="모순을 새로운 해결안으로 연결하는 TRIZ 개념도"
      role="img"
    >
      <div className="art-grid" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="art-label top">
        <span className="dot" /> A NEW WAY TO THINK
      </div>
      <div className="glass-card conflict">
        <CircleDot size={17} />
        <span>
          기술/물리 모순 정의<span className="muted">TRIZ 해결기법 적용</span>
        </span>
        <span className="small-line" />
      </div>
      <div className="core-shape">
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
      <div className="art-label bottom">
        CONTRADICTION <ArrowRight size={16} /> POSSIBILITY
      </div>
      <div className="glass-card solution">
        <span className="green-square">
          <Sparkles size={19} />
        </span>
        <div>
          새로운 해결의 방향<small>다른 산업의 원리에서 발견하다</small>
        </div>
        <ArrowUpRight size={20} />
      </div>
      <span className="orbit-dot d1" />
      <span className="orbit-dot d2" />
    </div>
  );
}

export function Empty({ text }) {
  return (
    <div className="empty">
      <BookOpen size={32} strokeWidth={1} />
      <p>{text}</p>
    </div>
  );
}
