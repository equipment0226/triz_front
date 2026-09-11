import React, { lazy, Suspense, useRef } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, BookOpen, Layers3, BrainCircuit, Cpu } from 'lucide-react';
import { SafeLink } from '../components/Shared';
import { GuideVisual } from '../components/GuideVisual';
import { chapters, techniques, materialMeta, trizParagraphs } from '../data/introduction';
import { GuideLink } from '../components/GuideLink';
import { useGuideMotion } from '../components/GuideMotion';
const MaterialLibrary = lazy(() => import('./MaterialLibrary').then(module => ({default:module.MaterialLibrary})));
import '../introduction.css';

export function MaterialCards({ go }) {
  return <div className="material-grid">{materialMeta.map(item => <GuideLink go={go} to={{material: item.id}} className="material-cover" key={item.id}>
    <div className="material-cover-top"><span>{item.en}</span><ArrowUpRight size={19}/></div>
    {item.id === 'business' ? <img className="material-cover-photo" src="/images/business-collaboration.jpg" alt="데이터를 함께 검토하며 사업 문제를 논의하는 팀" loading="lazy"/> : <GuideVisual kind={item.visual} compact title={`${item.title} 개념도`}/>}
    <div className="material-cover-name"><h3>{item.title}</h3><span>{item.count}</span></div>
    <p>{item.description}</p><span className="material-open">자료 펼쳐보기 <ArrowRight size={15}/></span>
  </GuideLink>)}</div>;
}

function ToolOverview({ go, solve }) {
  return <>
    <section className="guide-hero">
      <div><p className="eyebrow">A CLEAR PATH TO YOUR NEXT IDEA</p><h1>TRIZ를 몰라도,<br/>문제의 <em>본질에</em><br className="desktop-break"/> 가까워지도록.</h1><p className="guide-lead">당신은 문제점을 설명하고, AI는 질문하고 분석합니다.<br/>열 개의 단계가 생각을 연결하고, 한 편의 보고서가 다음 행동을 만듭니다.</p><button className="button dark" onClick={() => solve()}>내 문제로 시작하기 <ArrowUpRight size={17}/></button></div>
      <figure className="human-ai-card">
        <div className="human-ai-image"><img src="/images/human-ai-collaboration.jpg" alt="사람의 손과 로봇의 손이 연결되는 모습, 인간의 사고와 AI Agent의 협업" width="1200" height="800"/><div className="human-ai-orbit" aria-hidden="true"/><div className="human-ai-label human-label"><BrainCircuit size={19}/><span>Human brain<small>질문, 검토</small></span></div><div className="human-ai-label ai-label"><Cpu size={19}/><span>AI Agent<small>구조화, 분석, 아이디어 도출</small></span></div></div>
        <figcaption><span className="eyebrow">HUMAN INTELLIGENCE × AI</span><h2>당신의 생각에,<br/>새로운 가능성을 연결합니다.</h2><p>사람의 통찰과 AI의 탐색이 함께 만드는 해법.</p><small>사진: <SafeLink href="https://www.pexels.com/photo/black-and-white-photo-of-human-hand-and-robot-hand-8386422/">Tara Winstead / Pexels</SafeLink></small></figcaption>
      </figure>
    </section>
    <section className="guide-section"><div className="guide-section-heading"><div><p className="eyebrow">THE WORKFLOW</p><h2>네 번의 단계, 열 번의 스텝.</h2></div><p>각 단계의 기법과<br/>실제로 제공되는 템플릿을 확인하세요.</p></div>
      <div className="guide-journey">{chapters.map(c => <article key={c.id}><div className="chapter-top"><span className="chapter-number">{c.id}</span><span className="stage-pill">{c.stages}</span></div><GuideVisual kind={c.visual} compact title={`${c.title} 구조도`}/><p className="chapter-en">{c.english}</p><h3>{c.title}</h3><p>{c.description}</p><small>{c.output}</small><GuideLink className="chapter-detail" go={go} to={{chapter:c.id}} aria-label={`${c.id} ${c.title} 상세 보기`}>상세 보기 <ArrowUpRight size={17}/></GuideLink></article>)}</div>
      <p className="guide-note">실행 모드와 문제 특성에 따라 기법이 선택됩니다. 각 상세 화면은 전체 분석 흐름을 기준으로 소개합니다.</p>
    </section>
    <section className="guide-section" id="materials"><div className="guide-section-heading"><div><p className="eyebrow">THE REFERENCE SHELF</p><h2>생각을 넓히는 지식 서가.</h2></div><p>원리를 읽고, 구조를 살피고,<br/>내 문제에 적용할 단서를 발견하세요.</p></div><MaterialCards go={go}/></section>
    <section className="guide-endnote"><BookOpen size={25}/><div><h3>분석의 이유가 보이는 보고서</h3><p>기법마다 설명, 구조도와 템플릿을 함께 제공합니다. 판단의 근거를 따라가며 당신의 경험을 더해보세요.</p></div><button className="button dark" onClick={() => solve()}>첫 프로젝트 시작 <ArrowUpRight size={16}/></button></section>
  </>;
}

function TrizOverview({ go }) {
  return <><section className="triz-story"><div className="triz-story-copy"><p className="eyebrow">THE ART OF SYSTEMATIC INVENTION</p><h1>발명에도,<br/><em>생각의 원리</em>가 있습니다.</h1><p className="triz-subtitle">TRIZ · Theory of Inventive Problem Solving</p><div className="triz-prose">{trizParagraphs.map((p, i) => <p key={i}>{p}</p>)}</div></div><aside className="triz-founder"><figure><img src="/images/genrich-altshuller.png" alt="TRIZ 창시자 겐리흐 알츠슐러의 초상 사진" width="214" height="279"/><figcaption><span>THE FOUNDER OF TRIZ</span><h2>겐리흐 알츠슐러</h2><p>Genrich Altshuller · 1926—1998</p></figcaption></figure><small className="guide-credit">사진: <SafeLink href="https://www.aitriz.org/altshuller/116-altshuller/775-genrich-altshuller">Altshuller Institute for TRIZ Studies</SafeLink></small><div className="founder-note"><span>1946</span><p>특허에 반복되는 발명 패턴에서<br/>체계적인 문제 해결의 출발점을 찾다.</p></div></aside></section>
    <div className="triz-pillars">{[['01', '모순을 발견하다', '함께 만족시켜야 할 두 요구를 명확히 합니다.', 'contradiction'], ['02', '자원을 다시 보다', '이미 가진 것의 새로운 쓰임을 찾습니다.', 'resources'], ['03', '해법을 구체화하다', '일반 원리를 현재 문제의 구조로 바꿉니다.', 'principles']].map(([n,t,d,v]) => <article key={n}><span className="chapter-en">{n} / CORE IDEA</span><GuideVisual kind={v} title={`${t} 개념도`}/><h3>{t}</h3><p>{d}</p></article>)}</div>
    <div className="triz-sources"><span>참고 문헌</span><SafeLink href="https://wiki.matriz.org/docs/triz/glossary-6146/">MATRIZ · TRIZ 용어와 개념 <ArrowUpRight size={13}/></SafeLink><SafeLink href="https://www.aitriz.org/triz">Altshuller Institute · What is TRIZ? <ArrowUpRight size={13}/></SafeLink></div>
    <div className="guide-next"><div><p className="eyebrow">FROM THEORY TO PRACTICE</p><h2>이 생각의 과정을 직접 경험해보세요.</h2></div><GuideLink go={go} className="button dark">Tool 소개 살펴보기 <ArrowRight size={16}/></GuideLink></div>
  </>;
}

function ChapterDetail({ chapter, go }) {
  const items = techniques.filter(t => t.chapter === chapter.id);
  const next = chapters[Number(chapter.id)];
  return <><GuideLink go={go} className="guide-back"><ArrowLeft size={16}/> Tool 소개로</GuideLink><section className="chapter-hero"><div><p className="eyebrow">CHAPTER {chapter.id} / {chapter.english}</p><h1>{chapter.title}</h1><p className="guide-lead">{chapter.description}</p><div className="chapter-meta"><span className="stage-pill">{chapter.stages}</span><span>{items.length}개 기법</span><span>설명 · 구조도 · 템플릿</span></div></div><GuideVisual kind={chapter.visual} title={`${chapter.title} 개요`}/></section>
    <nav className="chapter-jump" aria-label="기법 바로가기">{items.map(t => <a href={`#technique-${t.id}`} key={t.id}>{t.title}</a>)}</nav>
    <div className="technique-list">{items.map((t, index) => <article className="technique-card" key={t.id} id={`technique-${t.id}`}><div className="technique-heading"><span className="technique-index">{String(index + 1).padStart(2,'0')}</span><div><span className="stage-pill">{t.stage}</span><h2>{t.title}</h2></div></div><div className="technique-explainer"><div><p>{t.description}</p><ol className="technique-flow">{t.flow.map((f, i) => <li key={f}><span>{i + 1}</span>{f}</li>)}</ol>{t.material && <GuideLink className="guide-resource-link" go={go} to={{material:t.material,chapter:chapter.id}}><BookOpen size={16}/>{materialMeta.find(m => m.id === t.material)?.title} 자료 보기 <ArrowUpRight size={15}/></GuideLink>}</div><figure><GuideVisual kind={t.visual} title={`${t.title} 구조도`}/><figcaption>분석 흐름을 설명하는 개념도</figcaption></figure></div><div className="template-heading"><div><span>제공 템플릿</span><h3>{t.template}</h3></div></div><div className="guide-table-scroll" tabIndex="0" role="region" aria-label={`${t.title} 템플릿`}><table><caption>{t.template} · 대괄호는 작성할 내용입니다.</caption><thead><tr>{t.columns.map(c => <th scope="col" key={c}>{c}</th>)}</tr></thead><tbody>{(t.visual === 'windows' ? ['상위 시스템','대상 시스템','하위 요소'].map(level => [level, ...t.row.slice(1)]) : [t.row]).map((row, i) => <tr key={i}>{row.map((cell,j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></article>)}</div>
    {next && <div className="guide-next"><div><p className="eyebrow">CONTINUE EXPLORING</p><h2>{next.title}</h2></div><GuideLink go={go} to={{chapter:next.id}} className="button dark">{next.id} 상세 보기 <ArrowRight size={16}/></GuideLink></div>}
  </>;
}

export default function Introduction({ solve, route, onNavigate }) {
  const selected = route.introTab === 'triz' ? 'triz' : 'tool';
  const motionRoot = useGuideMotion(`${selected}-${route.chapter || ''}-${route.material || ''}`);
  const tabRefs = useRef([]);
  const go = (values = {}) => onNavigate({page:'Introduction',introTab:values.topic || 'tool',chapter:values.chapter,material:values.material,standard:values.standard,principle:values.principle}, {scrollTop:!values.standard && !values.principle});
  const chapter = chapters.find(c => c.id === route.chapter);
  return <div className="guide-page" ref={motionRoot}><div className="guide-masthead"><span><Layers3 size={17}/> Introduction</span><span>THE THINKING GUIDE</span></div><div className="guide-tabs" role="tablist" aria-label="TRIZ와 Tool 소개">{[['triz','TRIZ란?'],['tool','Tool 소개']].map(([id,label], i) => <button key={id} id={`intro-tab-${id}`} role="tab" aria-selected={selected===id} aria-controls={`intro-panel-${id}`} tabIndex={selected===id ? 0 : -1} ref={el => tabRefs.current[i]=el} onClick={() => go({topic:id})} onKeyDown={event => {
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); const index = event.key==='Home' ? 0 : event.key==='End' ? 1 : 1-i;
    go({topic:index===0?'triz':'tool'}); tabRefs.current[index]?.focus();
  }}>{label}</button>)}</div><div key={`${selected}-${route.chapter || ''}-${route.material || ''}`} role="tabpanel" id={`intro-panel-${selected}`} aria-labelledby={`intro-tab-${selected}`} tabIndex="0">{selected === 'triz' ? <TrizOverview go={go}/> : route.material ? <Suspense fallback={<p className="library-context" role="status">자료를 펼치고 있습니다…</p>}><MaterialLibrary id={route.material} go={go} chapter={chapter} standard={route.standard} principle={route.principle}/></Suspense> : chapter ? <ChapterDetail chapter={chapter} go={go}/> : <ToolOverview go={go} solve={solve}/>}</div></div>;
}
