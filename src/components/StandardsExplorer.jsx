import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Layers3 } from 'lucide-react';
import { GuideLink } from './GuideLink';
import { GuideVisual } from './GuideVisual';
import { SafeLink } from './Shared';

const subdivisions={
 '1.1':'물질–장 모델 구성','1.2':'유해 상호작용 제거',
 '2.1':'복합 물질–장 모델','2.2':'물질–장 모델의 발전','2.3':'리듬의 조정','2.4':'강자성 물질의 활용',
 '3.1':'이중·다중 시스템으로 전이','3.2':'미시 수준으로 전이',
 '4.1':'검출·측정 문제의 전환','4.2':'측정 물질–장 모델 구성','4.3':'측정 모델의 개선','4.4':'강자성 측정 모델','4.5':'측정 시스템의 진화',
 '5.1':'물질 도입','5.2':'장 도입','5.3':'상변화 활용','5.4':'물리효과 활용','5.5':'물질 입자 활용',
};
const clean=name=>name.replace(/\s*\(\d+\)$/,'');

export function StandardsExplorer({ collection, entries, selectedCode, go, chapter, searchActive }) {
  const selected=collection.standards.find(s=>s.code===selectedCode);
  const [open,setOpen]=useState({});
  const [mobileDetail,setMobileDetail]=useState(Boolean(selected));
  const detail=useRef();
  const tree=useRef();
  const previous=useRef(selectedCode);
  useEffect(()=>{
    if(selectedCode && previous.current!==selectedCode) {
      setMobileDetail(true);
      requestAnimationFrame(()=>{
        detail.current?.focus({preventScroll:true});
        if(window.matchMedia('(max-width: 720px)').matches)detail.current?.scrollIntoView({block:'start'});
      });
    }
    previous.current=selectedCode;
  },[selectedCode]);
  const branches=useMemo(()=>Object.entries(collection.classes).map(([code,title])=>({code,title:clean(title),
    groups:Object.entries(subdivisions).filter(([key])=>key.startsWith(code+'.')).map(([key,name])=>({code:key,name,entries:entries.filter(e=>e.key.startsWith(key+'.'))})).filter(g=>g.entries.length),
  })).filter(c=>c.groups.length),[collection,entries]);
  const to=code=>({material:'standards',...(chapter?{chapter:chapter.id}:{}),...(code?{standard:code}:{})});
  const expand=(key,value)=>setOpen(v=>({...v,[key]:value}));
  const isOpen=code=>searchActive || (open[code] ?? Boolean(selectedCode?.startsWith(code+'.')));
  const index=selected?collection.standards.indexOf(selected):-1;
  const backToTree=()=>{setMobileDetail(false);requestAnimationFrame(()=>{tree.current?.focus({preventScroll:true});tree.current?.scrollIntoView({block:'start'});});};
  return <div className={`standards-explorer ${mobileDetail && selected?'show-standard-detail':''}`}>
    <nav className="standards-tree" aria-label="76 표준해 탐색기" tabIndex="-1" ref={tree}>
      <div className="standards-tree-heading"><FolderOpen size={18}/><div><strong>표준해 탐색기</strong><small>클래스 → 세부 분류 → 표준해</small></div><span>76</span></div>
      {branches.map(branch=><div className="standard-class" key={branch.code}>
        <button className="standard-class-toggle" aria-expanded={isOpen(branch.code)} onClick={()=>expand(branch.code,!isOpen(branch.code))}>
          {isOpen(branch.code)?<ChevronDown size={15}/>:<ChevronRight size={15}/>}<Folder size={16}/><span><small>CLASS {branch.code}</small>{branch.title}</span><b>{branch.groups.reduce((sum,g)=>sum+g.entries.length,0)}</b>
        </button>
        {isOpen(branch.code) && <div className="standard-subgroups">{branch.groups.map(group=><div key={group.code}>
          <button className="standard-group-toggle" aria-expanded={isOpen(group.code)} onClick={()=>expand(group.code,!isOpen(group.code))}>{isOpen(group.code)?<ChevronDown size={13}/>:<ChevronRight size={13}/>}<span>{group.code} {group.name}</span><small>{group.entries.length}</small></button>
          {isOpen(group.code) && <div className="standard-leaves">{group.entries.map(entry=><GuideLink key={entry.key} className={`standard-leaf ${selectedCode===entry.key?'selected':''}`} go={values=>{setMobileDetail(true);go(values);}} to={to(entry.key)} aria-current={selectedCode===entry.key?'page':undefined}><FileText size={13}/><span><small>{entry.key}</small>{entry.title}</span></GuideLink>)}</div>}
        </div>)}</div>}
      </div>)}
    </nav>
    <section className="standard-reading" ref={detail} tabIndex="-1" aria-label="선택한 표준해 상세">
      {selected?<>
        <button className="standard-mobile-back" onClick={backToTree}><ArrowLeft size={16}/> 탐색기로 돌아가기</button>
        <div className="standard-breadcrumb"><span>CLASS {selected.code[0]}</span><ChevronRight size={12}/><span>{subdivisions[selected.code.split('.').slice(0,2).join('.')]}</span><ChevronRight size={12}/><b>{selected.code}</b></div>
        <p className="eyebrow">STANDARD INVENTIVE SOLUTION</p><div className="standard-title"><span>{selected.code}</span><h2>{selected.title_ko}</h2></div><p className="standard-description">{selected.description}</p>
        <div className="standard-transformation"><span>모델 변환</span><p>{selected.transformation}</p><GuideVisual kind="sufield" title={`${selected.code} 표준해의 물질–장 구성요소`}/></div>
        <div className="guide-table-scroll" tabIndex="0" role="region" aria-label="표준해 적용 조건"><table className="entry-table"><caption>적용 조건과 검토할 한계</caption><tbody><tr><th scope="row">적용 조건</th><td>{selected.conditions}</td></tr><tr><th scope="row">한계 · 검토사항</th><td>{selected.limitations}</td></tr></tbody></table></div>
        <div className="standard-reference"><span>원문 참고</span>{(selected.sources || collection.sources).map((s,i)=><SafeLink key={i} href={s.url}>{s.title} ↗</SafeLink>)}</div>
        <div className="standard-paging">{index>0?<GuideLink go={go} to={to(collection.standards[index-1].code)}><ArrowLeft size={14}/><span><small>이전 표준해</small>{collection.standards[index-1].code}</span></GuideLink>:<span/>}{index<collection.standards.length-1?<GuideLink go={go} to={to(collection.standards[index+1].code)}><span><small>다음 표준해</small>{collection.standards[index+1].code}</span><ArrowRight size={14}/></GuideLink>:<span/>}</div>
      </>:<div className="standard-welcome"><Layers3 size={34}/><p className="eyebrow">FIVE CLASSES. SEVENTY-SIX DIRECTIONS.</p><h2>문제의 유형에서<br/>해결 방향으로.</h2><p>분류를 펼쳐 필요한 표준해를 찾아보세요.<br/>하나를 선택하면 원리와 적용 조건이 여기에 열립니다.</p><div className="standard-class-index">{branches.map(b=><button key={b.code} onClick={()=>{expand(b.code,true);tree.current?.focus({preventScroll:true});}}><b>{b.code}</b><span>{b.title}</span><ArrowRight size={15}/></button>)}</div></div>}
    </section>
  </div>;
}
