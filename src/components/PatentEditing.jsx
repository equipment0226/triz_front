import React,{useEffect,useState,useRef} from 'react';
import {contentHash} from '../lib/patentApi';

const names={invention:'발명정보',claims:'청구범위',specification:'명세서',drawings:'도면',facts:'확인 사실',
  title:'명칭',problem:'해결하려는 문제',features:'구성요소',name:'명칭',description:'설명',effects:'효과',
  text:'내용',sections:'명세서 항목',abstract:'요약서',nodes:'도면 구성',label:'구성명',caption:'도면 설명',
  feature_ids:'연결 구성',depends_on:'인용 청구항',support_sections:'뒷받침 항목',number:'번호',id:'부호'};
const clone=value=>JSON.parse(JSON.stringify(value));

function editable(target,value){
  if(target==='invention')return [{path:['title'],label:'발명의 명칭'},{path:['problem'],label:'해결하려는 문제'},
    ...(value.features||[]).flatMap((f,i)=>[{path:['features',i,'name'],label:`구성요소 ${i+1} 명칭`},{path:['features',i,'description'],label:`구성요소 ${i+1} 설명`}]),
    ...(value.effects||[]).map((f,i)=>({path:['effects',i,'description'],label:`기대 효과 ${i+1}`}))];
  if(target==='claims')return (value.claims||[]).map((c,i)=>({path:['claims',i,'text'],label:`청구항 ${c.number} 내용`}));
  if(target==='specification')return [{path:['title'],label:'발명의 명칭'},...(value.sections||[]).map((s,i)=>({path:['sections',i,'text'],label:s.heading})),{path:['abstract'],label:'요약서'}];
  return [];
}
const at=(value,path)=>path.reduce((v,k)=>v?.[k],value);

export function PatentEditor({target,value,busy,onSave}){
  const [base,setBase]=useState(value),[draft,setDraft]=useState(()=>clone(value)),[reason,setReason]=useState('');
  const dirty=useRef(false);
  useEffect(()=>{if(!dirty.current){setBase(value);setDraft(clone(value));}},[value]);
  return <details className="patent-source"><summary>{names[target]} 수정 제안</summary>
    <p>수정 내용을 먼저 비교한 뒤 적용합니다. 관련 검토와 확인은 다시 진행합니다.</p>
    {editable(target,draft).map(({path,label})=><label key={path.join('.')}>
      {label}<textarea aria-label={label} value={at(draft,path)||''} onChange={e=>{dirty.current=true;setDraft(previous=>{const next=clone(previous);let node=next;for(const key of path.slice(0,-1))node=node[key];node[path.at(-1)]=e.target.value;return next;});}}/>
    </label>)}
    <label>수정 이유<textarea aria-label="수정 이유" value={reason} onChange={e=>{dirty.current=true;setReason(e.target.value);}}/></label>
    <button className="button subtle" disabled={busy||!reason.trim()||JSON.stringify(base)===JSON.stringify(draft)} onClick={async()=>{
      const result=await onSave({target_type:target,before_hash:await contentHash(base),replacement:draft,
        change_kind:target==='claims'?'CLAIM_SCOPE':'TECHNICAL',change_reason:reason,issue_ids:[]});
      if(result){dirty.current=false;setReason('');}
    }}>수정안 저장하고 비교</button>
  </details>;
}

function differences(before,after,path=[]){
  if(JSON.stringify(before)===JSON.stringify(after))return [];
  if(after&&typeof after==='object'&&before&&typeof before==='object')return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(k=>differences(before[k],after[k],[...path,k]));
  const show=v=>v===undefined?'없음':v===null?'미확인':typeof v==='object'?'구성 변경':String(v);
  return [{label:path.map(k=>names[k]||(/^\d+$/.test(k)?Number(k)+1:'세부 항목')).join(' · '),before:show(before),after:show(after)}];
}
export function PatentPatchPreview({patch,current}){
  return <div aria-label="수정 전후 비교">{differences(current,patch.replacement).map((d,i)=><article key={i}><strong>{d.label}</strong><p>수정 전: {d.before}</p><p>수정 후: {d.after}</p></article>)}</div>;
}

const factsLabels={drawings_required:'발명 설명에 필요한 도면',agent:'대리인 선임 여부',priority:'우선권 주장 여부',
  disclosure_exception:'공지예외 검토 필요 여부',sequence:'서열목록 필요 여부',deposit:'기탁 관련 자료 필요 여부',
  assignment:'권리승계 관련 자료 필요 여부',software_or_ai:'소프트웨어·AI 발명 여부',materials_or_special_domain:'재료·공정 등 특수 분야 여부'};
const emptyFacts=Object.freeze({});
export function PatentAttachments({documents,busy,onWithdraw}){
  const [reasons,setReasons]=useState({});
  if(!documents.length)return null;
  const statuses={TEXT_EXTRACTED:'본문 텍스트 추출 완료',PARTIAL:'일부만 읽음',TEXT_UNAVAILABLE:'본문 텍스트 확인 필요',VISUAL_REVIEW_REQUIRED:'이미지 내용 확인 필요'};
  return <section className="panel"><h2>검토에 포함된 첨부자료</h2>
    {documents.map(d=><article className="patent-source" key={d.asset_id}><h3>{d.name}</h3>
      <p>{statuses[d.parse_status]||'내용 확인 필요'}{d.total_pages?` · ${d.processed_pages}/${d.total_pages}쪽`:''}</p>
      <p>{d.limitation}</p><small>첨부자료를 변경하면 관련 초안과 검토를 다시 진행합니다. 제외한 자료의 원본과 변경 이력은 보존합니다.</small>
      <label>검토에서 제외할 사유<input aria-label={`${d.name} 제외 사유`} value={reasons[d.asset_id]||''} onChange={e=>setReasons(p=>({...p,[d.asset_id]:e.target.value}))}/></label>
      <button className="button subtle" disabled={busy||!reasons[d.asset_id]?.trim()} onClick={()=>onWithdraw({asset_id:d.asset_id,reason:reasons[d.asset_id]})}>이 자료를 검토에서 제외</button>
    </article>)}
  </section>;
}
export function PatentFacts({value=emptyFacts,busy,onSave}){
  const [facts,setFacts]=useState(value),dirty=useRef(false);
  useEffect(()=>{if(!dirty.current)setFacts(value);},[value]);
  const change=(key,v)=>{dirty.current=true;setFacts(p=>({...p,[key]:v}));};
  return <section className="patent-source"><h3>출원인·발명자 및 첨부서류 확인</h3>
    {[['applicant_name','출원인 성명 또는 명칭'],['inventor_names','발명자 성명'],['contribution_and_rights','실질적인 기술 기여와 권리 보유·승계 근거']].map(([key,label])=><label key={key}>{label}<textarea aria-label={label} value={facts[key]||''} onChange={e=>change(key,e.target.value)}/></label>)}
    {Object.entries(factsLabels).map(([key,label])=><label key={key}>{label}<select aria-label={label} value={facts[key]===true?'yes':facts[key]===false?'no':'unknown'} onChange={e=>change(key,e.target.value==='unknown'?null:e.target.value==='yes')}><option value="unknown">아직 확인하지 못함</option><option value="yes">해당함</option><option value="no">해당 없음</option></select></label>)}
    <button className="button subtle" disabled={busy||!dirty.current} onClick={async()=>{if(await onSave({facts})){dirty.current=false;setFacts({...facts});}}}>확인 사실 저장</button>
  </section>;
}
