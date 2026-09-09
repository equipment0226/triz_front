import React, {useState,useEffect} from 'react';
import {ArrowUpRight,Search,ChevronLeft,ChevronRight} from 'lucide-react';
import {api} from '../lib/api';
import {Empty,Loading,ModeBadge} from '../components/Shared';
const statusLabel={CREATED:'분석 준비',QUEUED:'분석 대기',RUNNING:'분석 중',WAITING_HUMAN:'의견 확인',COMPLETED:'완료',FAILED:'재시도 필요',INTERRUPTED:'일시 중단'};
export function History({openRun,onError,publicView=false,page=1,term="",onNavigate}) {
  const [data,setData]=useState({items:[],total:0,page:1}),[search,setSearch]=useState(term),[loading,setLoading]=useState(true);
  useEffect(()=>{setSearch(term);},[term]);
  useEffect(()=>{if(search===term)return; const timer=setTimeout(()=>onNavigate({search,listPage:1},{replace:true}),300);return()=>clearTimeout(timer);},[search,term]);
  useEffect(()=>{
    let active=true;
    setLoading(true);
    api(`${publicView?'/public/runs':'/runs'}?page=${page}&search=${encodeURIComponent(term)}`)
      .then(result=>{if(active)setData(result);}).catch(e=>{if(active)onError(e.message);})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[publicView,page,term]);
  const pages=Math.max(1,Math.ceil(data.total/20));
  return <div className="section history">
    <div className="section-top"><div><p className="eyebrow">{publicView?'SAMPLE CASE · OPEN BETA':'MY PROJECTS'}</p>
      <h1>{publicView?'모두의 분석 사례':'내 분석 이력'}</h1><p className="lead">{publicView?'다양한 산업의 문제와 해결 과정을 살펴보세요.':'함께 정리한 문제와 다음 가능성을 이어서 살펴보세요.'}</p></div>
      <span className="library-count">{data.total}<small>PROJECTS</small></span></div>
    <div className="library-toolbar"><label className="search-box"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} maxLength={200} placeholder="문제명, 산업, 시스템으로 검색" aria-label="프로젝트 검색"/></label>
      <div className="mode-legend"><ModeBadge mode="LITE"/><ModeBadge mode="FULL"/><ModeBadge mode="DEEP"/></div></div>
    {loading?<Loading/>:<><div className="history-list"><div className="history-head"><span>프로젝트</span><span>진행 상태</span><span>시작일</span></div>
      {data.items.map(r=><button className="history-row" key={r.run_id} onClick={()=>openRun(r.run_id)}><div><small>{r.industry||'업종 확인 중'}{r.target_system?' / '+r.target_system:''}</small><h3><ModeBadge mode={r.mode}/><span>{r.title}</span></h3></div><span className={'pill status-'+r.status}>{statusLabel[r.status]||'진행 확인'}</span><span className="date">{r.started_at?.slice(0,10)}<ArrowUpRight size={18}/></span></button>)}
    </div>{!data.items.length&&<Empty text={search?'검색 조건에 맞는 프로젝트가 없습니다.':'아직 분석 기록이 없습니다. 첫 문제를 입력해 보세요.'}/>}</>}
    {data.total>20&&<nav className="pagination" aria-label="프로젝트 목록 페이지"><button className="button subtle" disabled={loading||data.page<=1} onClick={()=>onNavigate({listPage:data.page-1})}><ChevronLeft size={16}/> 이전</button>
      <span aria-live="polite">{data.page} / {pages} 페이지 <small>· 20건씩 보기</small></span>
      <button className="button subtle" disabled={loading||data.page>=pages} onClick={()=>onNavigate({listPage:data.page+1})}>다음 <ChevronRight size={16}/></button></nav>}
  </div>;
}
