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
  return (
    <figure className="figure">
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(figure.svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
          }),
        }}
      />
      <figcaption>{figure.title}</figcaption>
    </figure>
  );
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
          속도는 높게<span className="muted">손상은 낮게</span>
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
