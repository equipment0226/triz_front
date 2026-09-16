import React, {useEffect,useState,useCallback,useRef} from 'react';
import {ArrowLeft,FileText,LockKeyhole,Plus,RefreshCw,Download} from 'lucide-react';
import {Loading,Empty} from '../components/Shared';
import {patentApi,patentPost,versionBody,contentHash} from '../lib/patentApi';
import './Patent.css';
import {PatentEditor,PatentPatchPreview,PatentFacts,PatentAttachments} from '../components/PatentEditing';

const tabs=['발명정보','질문','선행기술','청구범위','명세서·도면','검토·수정','내보내기'];
const status={CREATED:'초안 준비',QUEUED:'작업 대기',RUNNING:'작성 중',WAITING_HUMAN:'확인 필요',PAUSED_BUDGET:'예산 확인 필요',PAUSED_DEPENDENCY:'연결 확인 필요',PAUSED_USER:'일시 중지',COMPLETED:'작성 완료',FAILED:'작업 확인 필요',CANCELLED:'취소됨'};
const roles={TECHNICAL_CONTENT:'기술내용 검토',PATENT_CONTENT:'특허내용 검토',GLOBAL_FINAL:'최종 일관성 검토'};
const notice='해당 이미지는 생성형 AI를 활용한 샘플 이미지입니다.';
const failures={REQUIRED_T3_RESERVATION:'필수 검토 비용을 먼저 확보할 수 있도록 실행 예산을 확인해 주세요.',
  BUDGET_EXHAUSTED:'남은 초안 생성 예산이 부족합니다. 실행 한도를 확인해 주세요.',
  REVIEW_BUDGET_EXHAUSTED:'추가 검토에 필요한 예약 예산을 확인해야 합니다.',
  REVIEW_COVERAGE_LIMIT:'검토 자료가 모델 입력 한도를 넘었습니다. 자료를 생략하지 않고 작성을 중지했습니다.',
  REVIEW_MODEL_IDENTITY_MISMATCH:'설정한 고급 검토 모델과 응답 모델이 달라 검토를 중지했습니다.',
  USAGE_UNKNOWN:'모델 사용량을 확인하는 동안 해당 금액을 미확정 비용으로 보존합니다.',
  UNCERTAIN_CALL_AFTER_RESTART:'중단된 호출의 결과와 비용을 확인해야 합니다. 같은 호출을 자동 반복하지 않습니다.'};

export default function Patent({route,navigate}) {
  const [data,setData]=useState(null),[items,setItems]=useState([]),[sources,setSources]=useState([]),[error,setError]=useState('');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[preview,setPreview]=useState(null),[purpose,setPurpose]=useState('기존 해결안을 바탕으로 한국 특허 초안과 검토자료 작성');
  const [budget,setBudget]=useState('2'),[consent,setConsent]=useState(false),[answers,setAnswers]=useState({}),[manifest,setManifest]=useState(null);
  const [patches,setPatches]=useState([]),[applicationNumber,setApplicationNumber]=useState(''),[issue,setIssue]=useState(''),[capability,setCapability]=useState(null);
  const [sourceOffset,setSourceOffset]=useState(null),[caseOffset,setCaseOffset]=useState(null);
  const [imageJob,setImageJob]=useState(null);
  const answersDirty=useRef(false);
  const caseId=route.patentCase, tab=tabs.includes(route.patentTab)?route.patentTab:tabs[0];
  const activeCase=useRef(caseId);
  activeCase.current=caseId;
  const refresh=useCallback(async()=>{
    if(caseId){const value=await patentApi('/cases/'+encodeURIComponent(caseId));if(activeCase.current!==caseId)return;setData(value);if(!answersDirty.current)setAnswers(value.material.answers||{});
      const p=await patentApi('/cases/'+encodeURIComponent(caseId)+'/patches');if(activeCase.current===caseId)setPatches(p);
      const image=await patentApi('/cases/'+encodeURIComponent(caseId)+'/sample-image');if(activeCase.current===caseId)setImageJob(image);}
    else {const [list,available]=await Promise.all([patentApi('/cases'),patentApi('/source-solutions')]);setItems(list.items);setSources(available.items);setCaseOffset(list.next_offset);setSourceOffset(available.next_offset);}
  },[caseId]);
  useEffect(()=>{let live=true;setLoading(true);setError('');setManifest(null);setData(null);setAnswers({});answersDirty.current=false;
    Promise.all([refresh(),patentApi('/capabilities').then(v=>{if(live)setCapability(v);})]).catch(e=>live&&setError(e.message)).finally(()=>live&&setLoading(false));
    return()=>{live=false;};},[refresh]);
  useEffect(()=>{if(!caseId)return;let active=true;const timer=setInterval(()=>{if(active)refresh().catch(e=>setError(e.message));},7000);return()=>{active=false;clearInterval(timer);};},[caseId,refresh]);
  useEffect(()=>{if(route.patentSourceRun&&route.patentConcept&&!caseId){patentApi(`/source-runs/${encodeURIComponent(route.patentSourceRun)}/concepts/${encodeURIComponent(route.patentConcept)}/preview`).then(setPreview).catch(e=>setError(e.message));}},[route.patentSourceRun,route.patentConcept,caseId]);
  async function action(operation,payload={}) {setBusy(true);setError('');try{const result=await patentPost(`/cases/${caseId}/${operation}`,versionBody(data.case,payload));if(operation==='answers')answersDirty.current=false;await refresh();if(['start','resume'].includes(operation)&&['APPLICATION_CONTEXT','QUESTIONS'].includes(result.case?.waiting_for))navigate({...route,patentTab:'질문'});return result;}catch(e){setError(e.message);if(e.status===409)await refresh();return null;}finally{setBusy(false);}}
  async function openSource(run,concept){setBusy(true);setError('');try{setPreview(await patentApi(`/source-runs/${encodeURIComponent(run)}/concepts/${encodeURIComponent(concept)}/preview`));}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function create(){setBusy(true);setError('');try{const record=await patentPost('/cases',{source_run_id:preview.source_run_id,concept_id:preview.concept_id,expected_source_hash:preview.source_hash,purpose,jurisdiction:'KR',profile:'KR_GENERAL'});setPreview(null);navigate({page:'Patent (Test)',patentCase:record.case_id,patentTab:'질문'});}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function approve(type,target){await action('approvals',{approval_type:type,content_hash:await contentHash(target)});}
  const c=data?.case,m=data?.material||{};
  useEffect(()=>{if(c)setBudget(String(Math.max(2,c.budget.cap_micro_usd/1e6,
    c.provider_authorization?0:Math.ceil((capability?.required_review_micro_usd||0)/1e6+1))));setConsent(false);},[c?.case_id,capability?.required_review_micro_usd]);
  const allQuestions=[...(m.application_questions?.questions||[]),...(m.questions?.questions||[]),...(m.review_questions?.questions||[])];
  const pendingQuestions=data?.intake?.pending_question_ids||[];
  async function more(kind){const offset=kind==='cases'?caseOffset:sourceOffset;if(offset===null)return;try{const v=await patentApi(`/${kind}?offset=${offset}`);if(kind==='cases'){setItems(x=>[...x,...v.items]);setCaseOffset(v.next_offset);}else{setSources(x=>[...x,...v.items]);setSourceOffset(v.next_offset);}}catch(e){setError(e.message);}}
  return <div className="patent-page">
    <header className="patent-heading"><div><p className="eyebrow">PATENT · TEST</p><h1>{c?.title||'내 특허 초안'}</h1><p><LockKeyhole size={14}/> 비공개로 작성하고, 발명정보부터 첨부문서까지 함께 검토합니다.</p></div>
      {caseId&&<button className="button subtle" onClick={()=>navigate({page:'Patent (Test)'})}><ArrowLeft size={16}/> 내 초안 목록</button>}</header>
    {error&&<div className="error" role="alert">{error}</div>}
    {loading?<Loading text="특허 초안을 불러오고 있어요."/>:!caseId?<>
      <section className="panel"><h2>내 특허 초안</h2>{items.length?items.map(item=><button className="patent-list-item" key={item.case_id} onClick={()=>navigate({page:'Patent (Test)',patentCase:item.case_id})}><FileText size={20}/><span><strong>{item.title}</strong><small>{status[item.execution_status]||'확인 필요'}</small></span></button>):<Empty text="내 해결안을 선택해 첫 특허 초안을 만들어 보세요."/>}{caseOffset!==null&&<button className="button subtle" onClick={()=>more('cases')}>더 보기</button>}</section>
      <section className="panel"><h2>내 해결안에서 시작하기</h2><p>선택한 해결안은 현재 버전으로 보관합니다. 새 특허 초안은 나에게만 보입니다.</p>{sources.map(run=><div className="patent-source" key={run.run_id}><h3>{run.title}</h3>{run.concepts.map(concept=><button className="button subtle" disabled={busy} key={concept.id} onClick={()=>openSource(run.run_id,concept.id)}><Plus size={16}/>{concept.title||'해결안'}</button>)}</div>)}{sourceOffset!==null&&<button className="button subtle" onClick={()=>more('source-solutions')}>해결안 더 보기</button>}</section>
      {preview&&<section className="panel" aria-label="새 특허 초안"><h2>{preview.concept.title}</h2><p>{preview.concept.description||preview.concept.one_liner}</p><p>{preview.scope_note}</p><label>작성 목적<textarea value={purpose} onChange={e=>setPurpose(e.target.value)}/></label><button className="button dark" disabled={busy||!purpose.trim()} onClick={create}>비공개 초안 만들기</button><small>초안 생성 시점에는 모델 사용 비용이 발생하지 않습니다.</small></section>}
    </>:c&&<>
      {c.last_error&&<p className="panel" role="status">{failures[c.last_error]||'작성 또는 검토가 완료되지 않았습니다. 연결 및 검토 결과를 확인한 뒤 다시 진행해 주세요.'}</p>}
      <section className="panel patent-status"><span className="pill">{status[c.execution_status]||'확인 필요'}</span><span>사용 ${(c.budget.spent_micro_usd/1e6).toFixed(3)} / 한도 ${(c.budget.cap_micro_usd/1e6).toFixed(2)}</span><div className="actions"><button className="button subtle" disabled={busy} onClick={()=>refresh().catch(e=>setError(e.message))}><RefreshCw size={14}/>새로고침</button><button className="button subtle" disabled={busy||['CANCELLED','COMPLETED'].includes(c.execution_status)} onClick={()=>action('pause')}>일시 중지</button><button className="button dark" disabled={busy||['CANCELLED','COMPLETED'].includes(c.execution_status)} onClick={()=>action(c.execution_status==='CREATED'?'start':'resume')}>작성 계속</button></div></section>
      <details className="panel" open={!c.provider_authorization||c.execution_status==='PAUSED_BUDGET'}>
        <summary>{c.provider_authorization?'초안 작성 예산 변경':'초안 작성 예산'}</summary>
        <p>기술내용·특허내용·최종 일관성 검토에 필요한 비용을 먼저 확보합니다.</p>
        {capability?.required_review_micro_usd!=null&&<p>필수 검토 예약 상한: US${(capability.required_review_micro_usd/1e6).toFixed(3)}. 초안 생성 비용은 별도로 남겨두어야 합니다.</p>}
        {capability?.providers?.length>0&&<p>자료를 전송할 모델 공급자: {capability.providers.join(', ')}</p>}
        {!capability?.t3_reasoning_configured&&<p>필수 검토 모델 설정을 기다리고 있습니다. 자료는 계속 확인할 수 있습니다.</p>}
        <label>총 실행 한도 (USD)<input type="number" min={Math.max(0.01,c.budget.cap_micro_usd/1e6)} max="100" step="0.01" value={budget} onChange={e=>setBudget(e.target.value)}/></label>
        <label className="patent-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>초안 작성·검토 목적으로 표시된 모델 공급자에게 발명정보를 전송하는 것과 공급자의 보관정책을 확인했습니다.</label>
        <button className="button dark" disabled={busy||!consent||!capability?.t3_reasoning_configured||!Number.isFinite(Number(budget))||Number(budget)<=0||Number(budget)>100||Number(budget)*1e6<c.budget.cap_micro_usd} onClick={()=>action('budget-authorizations',{cap_micro_usd:Math.round(Number(budget)*1e6),allow_provider_transfer:true,purpose,retention_acknowledged:true})}>예산 승인</button>
      </details>
      <nav className="patent-tabs" aria-label="특허 초안 단계">{tabs.map(name=><button key={name} className={tab===name?'active':''} onClick={()=>navigate({...route,patentTab:name})}>{name}</button>)}</nav>
      {tab==='발명정보'&&<PatentFacts key={caseId} value={m.facts} busy={busy} onSave={payload=>action('answers',payload)}/>}
      {tab==='질문'&&<PatentAttachments key={caseId} documents={m.attachments?.documents||[]} busy={busy} onWithdraw={payload=>action('withdraw-attachment',payload)}/>}
      {({'발명정보':'invention','청구범위':'claims','명세서·도면':'specification'})[tab]&&m[({'발명정보':'invention','청구범위':'claims','명세서·도면':'specification'})[tab]]&&<PatentEditor key={caseId+tab} target={({'발명정보':'invention','청구범위':'claims','명세서·도면':'specification'})[tab]} value={m[({'발명정보':'invention','청구범위':'claims','명세서·도면':'specification'})[tab]]} busy={busy} onSave={async payload=>{const result=await action('patches',payload);if(result)navigate({...route,patentTab:'검토·수정'});return result;}}/>}
      {tab==='명세서·도면'&&<section className="panel"><h3>참고용 샘플 이미지</h3><p>{notice}</p>
        {m.sample_image?<a className="button subtle" href={`/api/patent/cases/${caseId}/assets/${m.sample_image.asset_id}`}>샘플 이미지 내려받기</a>:<button className="button subtle" disabled={busy||!capability?.drawing_configured||!m.drawings?.sample_prompt_en||(imageJob?.status&&imageJob.status!=='NOT_RUN')} onClick={()=>action('sample-image')}>이 특허의 샘플 이미지 1개 생성</button>}
        {imageJob?.status&&imageJob.status!=='NOT_RUN'&&<p>{({QUEUED:'생성 대기',SUBMITTING:'생성 요청 중',SUBMITTED:'이미지 생성 중',COMPLETED:'이미지 생성 완료',FAILED:'이미지 생성 실패',UNCERTAIN:'생성 결과 확인 필요'})[imageJob.status]||'상태 확인 중'}</p>}
      </section>}
      {pendingQuestions.length>0&&tab!=='질문'&&<section className="panel" role="status"><h2>실제 적용 조건을 확인해 주세요</h2><p>선택한 아이디어를 적용하면서 달라지는 부분과 제약조건, 위험요소를 확인한 뒤 초안을 작성합니다.</p><button className="button dark" onClick={()=>navigate({...route,patentTab:'질문'})}>필수 질문에 답변하기</button></section>}
      {tab==='발명정보'&&<section className="panel"><h2>발명정보</h2><h3>{m.invention?.title||m.source?.concept?.title}</h3><p>{m.invention?.problem||m.source?.concept?.description}</p>{m.invention?.features.map(f=><article key={f.id}><h3>{f.name}</h3><p>{f.description}</p><small>{f.provenance==='USER_CONFIRMED'?'확인된 정보':'확인이 필요한 기술 제안'}</small></article>)}{m.invention?.effects?.map(e=><p key={e.id}><strong>기대 효과</strong> {e.description} · {e.evidence_status==='MEASURED'?'측정 근거 있음':'검증 필요'}</p>)}{m.invention&&<button className="button dark" disabled={busy} onClick={()=>approve('G1',m.invention)}>발명정보 확인</button>}<p>{m.source?.scope_note}</p></section>}
      {tab==='질문'&&<section className="panel"><h2>실제 적용 조건과 확인할 사항</h2><p>아이디어를 선택했더라도 적용 시 변경사항·제약조건·위험요소를 직접 입력해야 합니다. 해당 사항이 없거나 아직 모르는 경우에도 그렇게 적어 주세요.</p><p>저장된 답변을 변경하면 관련 초안과 검토를 다시 확인합니다. 입력 내용은 측정으로 검증된 사실로 처리하지 않습니다.</p>{allQuestions.length?allQuestions.map(q=><label key={q.id}>{q.question}{q.blocking&&<span className="pill">필수</span>}<small>{q.reason}</small><textarea aria-label={q.question} required={q.blocking} value={answers[q.id]||''} onChange={e=>{answersDirty.current=true;setAnswers({...answers,[q.id]:e.target.value});}}/></label>):<Empty text="발명정보를 정리한 뒤 필요한 질문이 표시됩니다."/>}<button className="button dark" disabled={busy||!allQuestions.length||!Object.values(answers).some(v=>v.trim())} onClick={()=>action('answers',{answers})}>답변 저장</button><label>근거 자료 첨부 (PDF·PNG·JPEG)<input type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);try{const form=new FormData();form.set('file',file);for(const [key,value] of Object.entries(versionBody(c)))if(key!=='payload')form.set(key,value);await patentApi(`/cases/${caseId}/attachments`,{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:form});await refresh();}catch(error){setError(error.message);}finally{setBusy(false);}}}/></label></section>}
      {tab==='선행기술'&&<section className="panel"><h2>선행기술과 근거</h2><p>{m.sources?.status==='UNAVAILABLE'?'검색 연결을 확인해야 합니다. 선행기술이 없다는 의미는 아닙니다.':m.sources?'관련 문헌을 검토하고 있습니다.':'연결된 문헌을 먼저 확인합니다.'}</p>{[...(m.sources?.references||[]),...(m.sources?.hits||[])].map((s,i)=><article className="patent-source" key={i}><h3>{s.title||s.publication_number||'연결 문헌'}</h3><p>{s.snippet||s.abstract||s.summary}</p><small>{s.publication_number} {s.publication_date}</small></article>)}<h3>필요한 KR 문헌 상세 보강</h3><label>출원번호<input value={applicationNumber} onChange={e=>setApplicationNumber(e.target.value)} placeholder="13자리 출원번호"/></label><label>확인할 쟁점<input value={issue} onChange={e=>setIssue(e.target.value)}/></label><button className="button subtle" disabled={busy||!/^\d{13}$/.test(applicationNumber)||!issue} onClick={()=>action('enrichment-requests',{application_number:applicationNumber,issue_id:issue,missing_fields:['claims'],authorized_api_calls:1})}>누락 상세정보 1건 조회</button></section>}
      {tab==='청구범위'&&<section className="panel"><h2>청구범위</h2>{m.claims?.claims?.map(claim=><article key={claim.number}><h3>청구항 {claim.number}</h3><p className="patent-prose">{claim.text}</p></article>)}{!m.claims?<Empty text="발명정보 확인 후 청구범위 초안을 작성합니다."/>:<button className="button dark" disabled={busy} onClick={()=>approve('G2',m.claims)}>현재 청구범위 확인</button>}</section>}
      {tab==='명세서·도면'&&<section className="panel"><h2>명세서·첨부문서</h2>{m.specification?.sections?.map(section=><article key={section.id}><h3>{section.heading}</h3><p className="patent-prose">{section.text||section.omission_reason}</p></article>)}{m.specification&&<article><h3>요약서</h3><p>{m.specification.abstract}</p></article>}<h3>도면 후보</h3>{m.drawings?.drawings?.map(d=><article key={d.number}><h4>도 {d.number} · {d.caption}</h4><div className="patent-diagram">{d.nodes.map(n=><span key={n.id}>{n.id} {n.label}</span>)}</div></article>)}<p>{notice}</p><small>생성 이미지는 특허 건당 1개를 재사용합니다. 도면 부호와 기술내용은 별도로 검토합니다.</small><h3>첨부문서 확인</h3><ul>{data.attachment_requirements.map(r=><li key={r.id}>{r.name} · {r.required===true?'필요':r.required===false?'해당 없음':'해당 여부 확인 필요'}</li>)}</ul></section>}
      {tab==='검토·수정'&&<section className="panel"><h2>독립 검토와 수정</h2>
        {Object.entries(roles).map(([role,label])=>{const reviews=data.reviews.filter(r=>r.role===role);return <article key={role}>
          <h3>{label} · {reviews.length?'검토 기록 있음':'검토 대기'}</h3>
          {reviews.map((review,index)=><div key={review.id||index}><p>{review.summary}</p>
            {[...review.findings,...(review.target_checks||[])].filter(f=>f.outcome!=='PASS'&&f.outcome!=='NOT_APPLICABLE').map((f,i)=><p key={i}>{f.explanation}</p>)}
          </div>)}</article>;})}
        {patches.map(p=><article className="patent-source" key={p.id}><h3>수정 제안</h3><p>{p.change_reason}</p>
          <PatentPatchPreview patch={p} current={m[p.target_type]}/>
          <button className="button subtle" disabled={busy} onClick={()=>action(`patches/${p.id}/apply`)}>이 수정안 적용</button>
        </article>)}
      </section>}
      {tab==='내보내기'&&<section className="panel"><h2>검토용 문서 패키지</h2><p>출원서·명세서와 청구범위·요약서·도면·조건부 첨부서류 목록을 함께 받습니다.</p><p>공식 작성기 형식 검증: 아직 실행하지 않음</p><p>{notice}</p><button className="button dark" disabled={busy} onClick={async()=>{const r=await action('exports',{snapshot_id:c.snapshot_id,mode:c.document_status==='DRAFT_READY'?'REVIEWED':'ANNOTATED'});if(r?.result?.manifest)setManifest(r.result.manifest);}}>내보내기 준비</button>{manifest&&<div className="patent-source"><p>현재 내용과 검토 상태를 고정한 문서입니다. 편집 가능한 DOCX와 미리보기·검토자료가 포함됩니다.</p><button className="button dark" disabled={busy} onClick={async()=>{const r=await action('exports',{snapshot_id:c.snapshot_id,mode:manifest.mode,manifest_hash:manifest.manifest_hash});if(r?.result?.export_id)window.location.assign(`/api/patent/cases/${caseId}/exports/${r.result.export_id}/download`);}}><Download size={16}/> 이 버전의 ZIP 내려받기</button></div>}</section>}
    </>}
  </div>;
}
