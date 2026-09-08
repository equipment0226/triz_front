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
    <div className="report-prose" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.html) }} />
    {section.figures.map(f => <Figure key={f.key} figure={f} />)}
  </section>)}</div>;
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
