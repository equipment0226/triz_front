import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowUp,
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

export function Bot({ small = false, mood = 'thinking' }) {
  return (
    <div className={"bot bot-" + mood + ' ' + (small ? "small" : "")} aria-hidden="true">
      <span />
      <span />
      <i />
    </div>
  );
}

export function TreeSpeech({messages, stateKey='', active=true}) {
  const [index,setIndex]=useState(0);
  const signature=messages.join('|');
  useEffect(()=>{
    setIndex(0);
    if(!active||messages.length<2||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=setInterval(()=>setIndex(i=>(i+1)%messages.length),6500);
    return ()=>clearInterval(timer);
  },[signature,stateKey,active]);
  return <div className="tree-speech"><p key={stateKey+index} className="speech-message">{messages[index%messages.length]}</p>
    {active&&<span className="speaking-dots" aria-hidden="true"><i/><i/><i/></span>}</div>;
}

export function Loading({text='프로젝트를 불러오고 있어요.'}) {
  return <div className="tree-loading" role="status"><div className="loading-orbit"><Bot/></div><p>{text}</p><span className="speaking-dots" aria-hidden="true"><i/><i/><i/></span></div>;
}

export function ModeBadge({mode}) {
  const data={LITE:['빠른','빠른 탐색'],FULL:['표준','표준 분석'],DEEP:['심층','심층 분석']}[mode];
  return data?<span className={'mode-badge mode-'+mode} role="img" aria-label={data[1]}>{data[0]}</span>:null;
}

export function ScrollToTop() {
  const [visible,setVisible] = useState(window.scrollY > 320);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 320);
    window.addEventListener('scroll',update,{passive:true});
    return () => window.removeEventListener('scroll',update);
  },[]);
  return visible ? <button className="scroll-to-top" aria-label="맨 위로 이동" title="맨 위로 이동"
    onClick={() => window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'})}>
    <ArrowUp size={21}/><span>맨 위로</span>
  </button> : null;
}

export function useReveal() {
  const root=useRef();
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const nodes=root.current?.querySelectorAll('[data-reveal]')||[];
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}
    }),{threshold:.12});
    nodes.forEach(node=>{node.classList.add('reveal-ready');observer.observe(node);});
    return ()=>observer.disconnect();
  },[]);
  return root;
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
    <figure className={`figure${figure.compact ? ' figure-compact' : ''}`}>
      <div className="figure-controls"><button onClick={() => setZoom(z => Math.max(1, z - .25))} disabled={zoom <= 1} aria-label="도식 축소">−</button>
        <button onClick={() => setZoom(1)} aria-label="도식 크기 초기화">{Math.round(zoom * 100)}%</button>
        <button onClick={() => setZoom(z => Math.min(3, z + .25))} disabled={zoom >= 3} aria-label="도식 확대">+</button></div>
      <div className="figure-scroll" tabIndex={0} aria-label={figure.title + " 확대 및 스크롤"}>
      <div
        className="figure-canvas" style={{ width: `${zoom * 100}%` }}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(figure.svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
          }),
        }}
      />
      </div>
      <figcaption>{figure.title}</figcaption>
      {figure.note && <p className="figure-note">{figure.note}</p>}
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
  const reasons = status.patent_error_reasons || [];
  const detail = reasons.some(r => ["QUERY_BUDGET_EXCEEDED", "MONTHLY_BUDGET_EXCEEDED"].includes(r))
    ? "BigQuery 조회량 상한에 도달해 검색을 중단했습니다. 검색 결과가 0건이라는 의미는 아닙니다."
    : reasons.some(r => ["NOT_CONFIGURED", "INVALID_CREDENTIALS", "AUTHENTICATION_FAILED", "ACCESS_DENIED_OR_QUOTA"].includes(r))
      ? "BigQuery 인증·권한 또는 사용 할당량을 확인해야 합니다. 특허 조회를 완료하지 못했습니다."
      : messages[status.patent_status];
  return <div className="panel search-status"><h3>특허 검색 상태</h3><p>{detail}</p>
    {status.patent_search && <p>{status.patent_search}</p>}
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
