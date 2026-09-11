import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Atom, ChevronDown, ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react';
import { GuideLink } from './GuideLink';

const domains = {PHYSICAL:'물리',CHEMICAL:'화학',GEOMETRIC:'기하',BIOLOGICAL:'생물',INFORMATIONAL:'정보·제어'};

export function EffectsExplorer({ entries, allEntries, selectedId, go, chapter, searchActive }) {
  const [open,setOpen] = useState({});
  const [mobileDetail,setMobileDetail] = useState(Boolean(selectedId));
  const reading = useRef();
  const tree = useRef();
  const selected = entries.find(entry => entry.key === selectedId);
  const branches = useMemo(() => {
    const groups = new Map();
    for(const entry of entries) {
      if(!groups.has(entry.subtitle)) groups.set(entry.subtitle,[]);
      groups.get(entry.subtitle).push(entry);
    }
    return [...groups].map(([name,items]) => ({name,items,code:items[0].key.split('.')[0]}));
  },[entries]);
  useEffect(() => {
    setMobileDetail(Boolean(selected));
    if(!selected) return;
    setOpen(previous => ({...previous,[selected.subtitle]:true}));
    const frame = requestAnimationFrame(() => {
      reading.current?.focus({preventScroll:true});
      if(window.matchMedia('(max-width: 720px)').matches) reading.current?.scrollIntoView({block:'start',behavior:'instant'});
    });
    return () => cancelAnimationFrame(frame);
  },[selectedId,Boolean(selected)]);
  const to = effect => ({material:'effects',...(chapter ? {chapter:chapter.id} : {}),effect});
  const expand = name => setOpen(previous => ({...previous,[name]:!previous[name]}));
  const back = () => {
    setMobileDetail(false);
    requestAnimationFrame(() => {tree.current?.focus({preventScroll:true});tree.current?.scrollIntoView({block:'start',behavior:'instant'});});
  };
  const choose = values => {
    setMobileDetail(true);
    go(values);
    // Reopening the selected leaf does not change the route.
    requestAnimationFrame(() => {reading.current?.focus({preventScroll:true});if(window.matchMedia('(max-width: 720px)').matches) reading.current?.scrollIntoView({block:'start',behavior:'instant'});});
  };
  const index = selected ? entries.indexOf(selected) : -1;
  return <div className={`standards-explorer effects-explorer ${mobileDetail && selected ? 'show-standard-detail' : ''}`}>
    <nav className="standards-tree effects-tree" aria-label="과학효과 탐색기" tabIndex="-1" ref={tree}>
      <div className="standards-tree-heading"><FolderOpen size={18}/><div><strong>과학효과 탐색기</strong><small>요구 기능 → 과학효과</small></div><span>{allEntries.length}</span></div>
      {branches.map(branch => {
        const expanded = searchActive || Boolean(open[branch.name]);
        return <div className="effect-function" key={branch.name}>
          <button className="standard-class-toggle effect-function-toggle" aria-expanded={expanded} aria-controls={`effect-function-${branch.code}`} onClick={() => expand(branch.name)}>
            {expanded ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}<Folder size={16}/><span><small>FUNCTION {branch.code.padStart(2,'0')}</small>{branch.name}</span><b>{branch.items.length}</b>
          </button>
          {expanded && <div id={`effect-function-${branch.code}`} className="standard-leaves effect-leaves">{branch.items.map(entry => <GuideLink key={entry.key} className={`standard-leaf effect-leaf ${selected?.key === entry.key ? 'selected' : ''}`} go={choose} to={to(entry.key)} aria-current={selected?.key === entry.key ? 'page' : undefined}><FileText size={13}/><span><small>{entry.key}</small>{entry.title}</span></GuideLink>)}</div>}
        </div>;
      })}
      {!branches.length && <p className="effect-tree-empty">검색 결과가 없습니다.</p>}
    </nav>
    <section className="standard-reading effect-reading" aria-label="선택한 과학효과 상세" ref={reading} tabIndex="-1">
      {selected ? <article key={selected.key} className="effect-reading-content">
        <button className="standard-mobile-back" onClick={back}><ArrowLeft size={16}/> 탐색기로 돌아가기</button>
        <div className="standard-breadcrumb"><span>과학효과</span><ChevronRight size={12}/><span>{selected.subtitle}</span><ChevronRight size={12}/><b>{selected.key}</b></div>
        <div className="effect-reading-heading"><p className="eyebrow">SCIENCE INTO SOLUTIONS</p><span>{domains[selected.category] || selected.category}</span></div>
        <div className="standard-title"><span>{selected.key}</span><h2>{selected.title}</h2></div>
        <div className="guide-table-scroll" tabIndex="0" role="region" aria-label="과학효과 상세"><table className="entry-table"><caption>{selected.title}</caption><tbody>{[['자료 식별자',selected.key],['요구 기능',selected.subtitle],['작동 원리',selected.original.principle],['필요 조건',selected.original.conditions]].map(([label,value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table></div>
        <div className="standard-paging effect-paging">{index > 0 ? <GuideLink go={choose} to={to(entries[index-1].key)}><ArrowLeft size={14}/><span><small>이전 효과 · {entries[index-1].key}</small>{entries[index-1].title}</span></GuideLink> : <span/>}{index < entries.length-1 ? <GuideLink go={choose} to={to(entries[index+1].key)}><span><small>다음 효과 · {entries[index+1].key}</small>{entries[index+1].title}</span><ArrowRight size={14}/></GuideLink> : <span/>}</div>
      </article> : <div className="standard-welcome effect-welcome"><Atom size={36}/><p className="eyebrow">START WITH THE FUNCTION</p><h2>원하는 기능에서,<br/>작동하는 원리로.</h2><p>요구 기능을 펼치고 과학효과를 선택하세요.<br/>작동 원리와 필요한 조건을 함께 살펴볼 수 있습니다.</p>{selectedId && !allEntries.some(entry => entry.key === selectedId) && <p role="status">해당 식별자의 과학효과를 찾을 수 없습니다.</p>}<div className="effect-explorer-guide"><span>01 <b>기능 선택</b></span><ChevronRight size={14}/><span>02 <b>효과 탐색</b></span><ChevronRight size={14}/><span>03 <b>조건 확인</b></span></div><p className="effect-coverage">{new Set(allEntries.map(entry => entry.subtitle)).size}개 요구 기능 · {allEntries.length}개 과학효과</p></div>}
    </section>
  </div>;
}
