import React, { memo, useState, useEffect, useRef, useMemo, useId } from "react";
import { reportPages, reportNavigationTitle, sectionBlocks } from "../lib/reportPages";
import { ReportDetails } from "./ReportDetails";
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
  const svg = useMemo(() => DOMPurify.sanitize(figure.svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
  }), [figure.svg]);
  return (
    <figure className={`figure${figure.compact ? ' figure-compact' : ''}`}>
      <div className="figure-controls"><button onClick={() => setZoom(z => Math.max(1, z - .25))} disabled={zoom <= 1} aria-label="도식 축소">−</button>
        <button onClick={() => setZoom(1)} aria-label="도식 크기 초기화">{Math.round(zoom * 100)}%</button>
        <button onClick={() => setZoom(z => Math.min(3, z + .25))} disabled={zoom >= 3} aria-label="도식 확대">+</button></div>
      <div className="figure-scroll" tabIndex={0} aria-label={figure.title + " 확대 및 스크롤"}>
      <div
        className="figure-canvas" style={{ width: `${zoom * 100}%` }}
        dangerouslySetInnerHTML={{
          __html: svg,
        }}
      />
      </div>
      <figcaption>{figure.title}</figcaption>
      {figure.note && <p className="figure-note">{figure.note}</p>}
    </figure>
  );
}

const ReportHtml = memo(function ReportHtml({ html }) {
  const clean = useMemo(() => DOMPurify.sanitize(html || ''), [html]);
  return <div className="report-prose" dangerouslySetInnerHTML={{__html: clean}} />;
});

export function ReportSections({ sections = [] }) {
  const query = '(max-width: 900px), (pointer: coarse)';
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  const [page, setPage] = useState(0);
  const root = useRef(null), selectId = useId();
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const paged = mobile && sections.length > 1;
  const pages = useMemo(() => paged ? reportPages(sections) : [], [sections, paged]);
  const current = Math.min(page, Math.max(0, pages.length - 1));
  const displayed = paged ? [pages[current]] : sections;
  const changePage = value => {
    setPage(value);
    root.current?.scrollIntoView({block: 'start', behavior: 'instant'});
    root.current?.focus({preventScroll: true});
  };
  const buttons = <div className="report-page-buttons">
    <button className="button subtle" disabled={current === 0} onClick={() => changePage(current - 1)}>이전 페이지</button>
    <span aria-live="polite">{current + 1} / {pages.length}</span>
    <button className="button subtle" disabled={current === pages.length - 1} onClick={() => changePage(current + 1)}>다음 페이지</button>
  </div>;
  return <div className="report-process" ref={root} tabIndex={-1}>
    {paged && <nav className="report-page-nav" aria-label="보고서 페이지 탐색">
      <p>한 페이지에 한 장씩 표시합니다.</p>
      <div className="report-chapter-buttons" aria-label="장 바로가기">
        {pages.map((part, i) => <button key={part.key || i} type="button"
          aria-label={`${i + 1}장으로 이동`} aria-current={current === i ? 'page' : undefined}
          onClick={() => changePage(i)}>{i + 1}</button>)}
      </div>
      <label htmlFor={selectId}>보고서 목차</label>
      <select id={selectId} aria-label="보고서 페이지" value={current} onChange={e => changePage(Number(e.target.value))}>
        {pages.map((part, i) => <option key={i} value={i}>{i + 1}. {reportNavigationTitle(part.title)}{part.parts > 1 ? ` (${part.part}/${part.parts})` : ''}</option>)}
      </select>
      {buttons}
    </nav>}
    {displayed.map((section, index) => <section className="panel report-section" key={`${section.key}-${paged ? current : index}`}>
      <h2>{section.title}{paged && section.parts > 1 && <small> ({section.part}/{section.parts})</small>}</h2>
      {sectionBlocks(section).map((block, i) => block.type === 'figure'
        ? <Figure key={i} figure={block.figure} /> : block.type === 'details'
          ? <ReportDetails key={i} title={block.title}><ReportHtml html={block.html} /></ReportDetails>
          : <ReportHtml key={i} html={block.html} />)}
    </section>)}
    {paged && <nav className="report-page-nav" aria-label="보고서 다음 페이지">{buttons}</nav>}
  </div>;
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
    <figure className="hero-art hero-photo">
      <img className="hero-research-photo" src="/images/technology-research.jpg" alt="연구자들이 로봇 장치를 함께 검토하며 기술 문제를 해결하는 모습" width="1400" height="935" fetchPriority="high"/>
      <div className="art-label top">
        <span className="dot" /> A NEW WAY TO THINK
      </div>
      <div className="glass-card conflict">
        <CircleDot size={17} />
        <span>
          다양한 산업/직군의 문제점<span className="muted">TRIZ 해결기법 적용</span>
        </span>
        <span className="small-line" />
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
      <figcaption className="hero-photo-credit">사진: <SafeLink href="https://www.pexels.com/photo/scientists-testing-a-device-8439005/">Pavel Danilyuk / Pexels</SafeLink></figcaption>
    </figure>
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
