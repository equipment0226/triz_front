import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Search, ChevronDown, BookOpen } from 'lucide-react';
import { GuideLink } from '../components/GuideLink';
import { GuideVisual } from '../components/GuideVisual';
import { StandardsExplorer } from '../components/StandardsExplorer';
import { EffectsExplorer } from '../components/EffectsExplorer';
import { ArizPartDiagram } from '../components/ArizPartDiagram';
import { SafeLink } from '../components/Shared';
import data from '../data/knowledge.json';
import { materialMeta } from '../data/introduction';

const domainNames = {PHYSICAL:'물리',CHEMICAL:'화학',GEOMETRIC:'기하',BIOLOGICAL:'생물',INFORMATIONAL:'정보·제어'};
const tags = {MISSING_S2:'도구 누락',MISSING_F:'장 누락',INCOMPLETE:'불완전',USEFUL_INSUFFICIENT:'유익 작용 부족',EXCESSIVE:'과잉 작용',HARMFUL:'유해 작용',SYSTEM_LIMIT:'시스템 한계',PHYSICAL_CONTRADICTION:'물리적 모순',MEASUREMENT:'검출·측정',RESOURCE_LIMIT:'자원 제약'};
const text = value => Array.isArray(value) ? value.join(' · ') : typeof value === 'object' && value ? Object.values(value).join(' · ') : value;
const searchable = value => value && typeof value === 'object' ? Object.values(value).map(searchable).join(' ') : String(value ?? '');

function Sources({ sources }) {
  if(!sources?.length) return null;
  return <div className="entry-sources"><span>출처</span>{sources.map((s,i) => <SafeLink key={i} href={typeof s === 'string' ? s : s.url}>{typeof s === 'string' ? '참고 문헌' : s.title || s.identifier || '참고 문헌'} <ArrowUpRight size={12}/></SafeLink>)}</div>;
}

function EntryTable({ rows, label }) {
  return <div className="guide-table-scroll" tabIndex="0" role="region" aria-label={label}><table className="entry-table"><caption>{label}</caption><tbody>{rows.filter(([,v]) => v && (!Array.isArray(v) || v.length)).map(([k,v]) => <tr key={k}><th scope="row">{k}</th><td>{text(v)}</td></tr>)}</tbody></table></div>;
}

function PrincipleLinks({ ids, go, chapter }) {
  return <div className="principle-links">{ids.map(id => <GuideLink key={id} go={go} to={{material:'principles',principle:String(id),...(chapter ? {chapter:chapter.id} : {})}}>#{id} {data.principles_40[id]?.name_ko} <ArrowUpRight size={12}/></GuideLink>)}</div>;
}

function MatrixExplorer({ go, chapter }) {
  const [improving,setImproving] = useState('1');
  const [worsening,setWorsening] = useState('3');
  const values = data.matrix_39x39.cells?.[improving]?.[worsening] || [];
  return <section className="matrix-explorer"><div className="matrix-explorer-title"><div><p className="eyebrow">FIND THE INTERSECTION</p><h2>좋아져야 할 것과, 나빠지는 것.</h2><p>두 파라미터를 선택하면 저장된 행렬의 추천 원리를 보여드립니다.</p></div><GuideVisual kind="matrix" title="개선 행과 악화 열의 교차점에서 발명원리를 찾는 모순행렬"/></div><div className="matrix-selects">{[['개선 파라미터',improving,setImproving],['악화 파라미터',worsening,setWorsening]].map(([label,value,set]) => <label key={label}>{label}<select aria-label={label} value={value} onChange={e => set(e.target.value)}>{Object.entries(data.params_39).map(([id,p]) => <option value={id} key={id}>#{id} {p.name_ko}</option>)}</select><small>{data.params_39[value].definition}</small></label>)}</div><div className="matrix-result" aria-live="polite"><span>저장된 추천 원리</span>{values.length ? <div className="matrix-principles">{values.map(id => <article key={id}><strong>{String(id).padStart(2,'0')}</strong><div><h3>{data.principles_40[id]?.name_ko}</h3><p>{data.principles_40[id]?.definition}</p></div></article>)}<PrincipleLinks ids={values} go={go} chapter={chapter}/></div> : <p>{improving === worsening ? '같은 파라미터의 교차 셀에는 추천 원리가 없습니다. 동일 속성의 상반 요구라면 물리적 모순과 분리원리를 검토하세요.' : '이 교차 셀에는 저장된 추천 원리가 없습니다. 40가지 원리를 직접 검토하거나 분석 과정에서 별도 선별할 수 있습니다.'}</p>}</div></section>;
}

export function MaterialLibrary({ id, go, chapter, standard, principle, effect }) {
  const meta = materialMeta.find(m => m.id === id);
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('all');
  const entries = useMemo(() => {
    if(id === 'principles') return Object.entries(data.principles_40).map(([key,e]) => ({key,title:e.name_ko,subtitle:e.name_en,description:e.definition,category:'all',original:e}));
    if(id === 'standards') return data.standards_76.standards.map(e => ({key:e.code,title:e.title_ko,description:e.description,category:e.code.split('.')[0],original:e}));
    if(id === 'matrix' || id === 'business') return Object.entries(id === 'business' ? data.params_biz_31 : data.params_39).map(([key,e]) => ({key,title:e.name_ko,subtitle:e.name_en,description:e.definition || '저장된 비즈니스 문제 표현 파라미터입니다.',category:'all',original:e}));
    if(id === 'separation') return Object.entries(data.separation).map(([key,e]) => ({key,title:e.name_ko,description:e.question,category:'all',original:e}));
    if(id === 'trends') return data.trends.map(e => ({key:e.id,title:e.name_ko,subtitle:e.name_en,description:e.stages.join(' → '),category:'all',original:e}));
    if(id === 'effects') return data.effects.flatMap((group,gi) => group.effects.map((e,i) => ({key:e.id || `${gi+1}.${i+1}`,title:e.name,subtitle:group.function_ko,description:e.principle,category:e.domain,original:e})));
    if(id === 'ariz') return data.ariz_85c.parts.map(e => ({key:String(e.id),title:e.title,description:`${e.steps.length}개 단계 · 필수 ${e.steps.filter(s => s.required).length}개`,category:'all',original:e}));
    return [];
  }, [id]);
  const indexed = useMemo(() => entries.map((e,i) => ({...e,number:String(i+1).padStart(3,'0'),searchText:searchable(e).toLocaleLowerCase()})),[entries]);
  useEffect(() => {
    if(id !== 'principles' || !principle) return;
    const frame=requestAnimationFrame(() => {
      const target=document.getElementById(`material-principles-${principle}`);
      if(target) {target.open=true;target.scrollIntoView({block:'start',behavior:'instant'});target.querySelector('summary')?.focus({preventScroll:true});}
    });
    return () => cancelAnimationFrame(frame);
  },[id,principle]);
  if(!meta) return <div className="guide-empty"><h1>자료를 찾을 수 없습니다.</h1><GuideLink go={go}>Tool 소개로 돌아가기</GuideLink></div>;
  const filtered = indexed.filter(e => (category === 'all' || category === e.category) && e.searchText.includes(query.trim().toLocaleLowerCase()));
  const shown = filtered;
  const categories = id === 'standards' ? Object.entries(data.standards_76.classes) : id === 'effects' ? Object.entries(domainNames).filter(([k]) => entries.some(e => e.category === k)) : [];
  const totalLabel = id === 'effects' ? `${data.effects.length}개 기능군 · ${entries.length}개 효과` : `${entries.length}개 ${id === 'ariz' ? '파트' : '항목'}`;
  return <><GuideLink className="guide-back" go={go} to={chapter ? {chapter:chapter.id} : {}}><ArrowLeft size={16}/>{chapter ? `${chapter.id} ${chapter.title}` : 'Tool 소개로'}</GuideLink><section className="library-hero"><div><p className="eyebrow">THE REFERENCE SHELF / {meta.en}</p><h1>{meta.title}</h1><p className="guide-lead">{meta.description}</p><span className="library-total"><BookOpen size={15}/>{totalLabel}</span></div><GuideVisual kind={id === 'business' ? 'business' : meta.visual} title={id === 'business' ? '서류가방과 문서로 표현한 비즈니스 문제 분석' : `${meta.title} 개념도`}/></section>
    {id === 'standards' && <div className="library-context"><b>76개 표준해의 5개 클래스</b><p>각 항목은 저장된 정의와 모델 변환을 보여줍니다. 원문 대조 상태는 기술의 실증 여부와 구분됩니다.</p></div>}
    {id === 'ariz' && <p className="library-context">저장 자료는 9개 파트 전체입니다. 실제 분석은 문제와 실행 모드에 따라 단계를 선택하며, 레포트에 실행·생략·보류 상태를 남깁니다.</p>}
    {id === 'business' && <p className="library-context">비즈니스 Triz 전용 파라미터입니다. 공학용 모순행렬과 별도 체계의 분석을 적용합니다.</p>}
    {id === 'matrix' && <MatrixExplorer go={go} chapter={chapter}/>}
    <div className="library-toolbar"><label className="library-search"><Search size={18}/><input type="search" aria-label="자료 검색" placeholder="번호, 이름, 원리 또는 조건으로 검색" value={query} onChange={e => setQuery(e.target.value)}/></label>{categories.length > 0 && <label className="library-filter"><span className="sr-only">자료 분류</span><select aria-label="자료 분류" value={category} onChange={e => setCategory(e.target.value)}><option value="all">모든 분류</option>{categories.map(([k,v]) => <option key={k} value={k}>{id === 'standards' ? `${k}. ` : ''}{v}</option>)}</select></label>}<span className="library-count" aria-live="polite">{filtered.length} / {entries.length}</span></div>
    {!filtered.length && <div className="guide-empty"><Search size={28}/><h2>일치하는 자료가 없습니다.</h2><p>검색어 또는 분류를 바꿔보세요.</p><button className="button subtle" onClick={() => {setQuery('');setCategory('all');}}>검색 초기화</button></div>}
    {id === 'standards' ? <StandardsExplorer collection={data.standards_76} entries={filtered} selectedCode={standard} go={go} chapter={chapter} searchActive={Boolean(query.trim()) || category !== 'all'}/> : id === 'effects' ? <EffectsExplorer entries={filtered} allEntries={indexed} selectedId={effect} go={go} chapter={chapter} searchActive={Boolean(query.trim()) || category !== 'all'}/> : <div className={`library-entries library-${id}`}>{shown.map(entry => {const e=entry.original; return <details className="library-entry" id={`material-${id}-${entry.key}`} key={entry.key}><summary><span className="entry-number">{entry.key.padStart(2,'0')}</span><div>{entry.subtitle && <small>{entry.subtitle}</small>}<h2>{entry.title}</h2><p>{entry.description}</p></div><ChevronDown size={18} className="entry-chevron"/></summary><div className="entry-body">
      {id === 'principles' && <><ol className="entry-directions">{e.sub.map((s,i) => <li key={i}><span>{String(i+1).padStart(2,'0')}</span>{s}</li>)}</ol><EntryTable label="발명원리 적용 템플릿" rows={[["해석",'이 원리가 바꾸라고 제안하는 요소를 정합니다.'],['적용안','현재 시스템에서 바꿀 구조 · 공정 · 변수'],['검증','개선할 성능과 유지할 성능을 함께 확인합니다.']]}/></>}
      {id === 'standards' && <><div className="entry-tags">{e.applicability.map(tag => <span key={tag}>{tags[tag] || tag}</span>)}<span>{e.verified ? '원문 대조됨' : '원문 대조 필요'}</span></div><EntryTable label="표준해 상세" rows={[["모델 변환",e.transformation],['적용 조건',e.conditions],['한계 · 검토사항',e.limitations],['해석 메모',e.notes]]}/><div className="entry-transformation"><span>MODEL TRANSFORMATION</span><p>{e.transformation}</p><GuideVisual kind="sufield" title="표준해에서 사용하는 물질–장 구성요소"/></div><Sources sources={e.sources || data.standards_76.sources}/></>}
      {id === 'separation' && <><GuideVisual kind="separation" selected={entry.key} title={`${entry.title}을 강조한 네 가지 분리 축`}/><EntryTable label="분리원리 적용 템플릿" rows={[["핵심 질문",e.question],['적용 검토','양쪽 요구가 각각 성립할 구간과 경계를 정의합니다.'],['연계 원리',e.principles.map(p => `#${p} ${data.principles_40[p]?.name_ko}`)]]}/><PrincipleLinks ids={e.principles} go={go} chapter={chapter}/></>}
      {id === 'trends' && <>{e.id === 'TR-12' && <GuideVisual kind="curve" title="시스템의 발전 단계와 다음 변화 방향"/>}<ol className="entry-directions">{e.stages.map((s,i) => <li key={s}><span>{i+1}</span>{s}</li>)}</ol><EntryTable label="진화 트렌드 검토 템플릿" rows={[["현재 단계",'관측한 구조와 작동 방식'],['다음 단계','변화시킬 요소와 예상 병목'],['아이디어','변화 가설을 검증할 실험']]}/></>}
      {id === 'ariz' && <><ArizPartDiagram part={e}/><div className="guide-table-scroll" tabIndex="0" role="region" aria-label={`${entry.title} 단계표`}><table><caption>Part {entry.key} · {entry.title}</caption><thead><tr><th scope="col">단계</th><th scope="col">분석 내용</th><th scope="col">구분</th></tr></thead><tbody>{e.steps.map(step => <tr key={step.code} id={`ariz-step-${step.code}`}><td>{step.code}</td><td>{step.title}</td><td><span className={`stage-pill ariz-status ${step.required?'ariz-required':'ariz-optional'}`}>{step.required?'필수':'선택'}</span></td></tr>)}</tbody></table></div></>}
      {(id === 'matrix' || id === 'business') && <EntryTable label="파라미터 정의" rows={[["파라미터",e.name_ko],['영문 명칭',e.name_en],['정의',e.definition || '원본에 별도 정의문이 없습니다.'],['적용 메모',id === 'business' ? '비즈니스 문제의 개선·악화 요구를 표현할 때 사용합니다.' : null]]}/>}
    </div></details>;})}</div>}<div className="library-footer"><BookOpen size={16}/><span>TRIZ Studio 지식 자료 · 설명을 내 문제의 구체적인 요소와 조건에 연결해보세요.</span></div></>;
}
