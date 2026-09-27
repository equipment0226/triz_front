import React,{useState} from 'react';

export default function PatentEvidenceClarification({value,version,busy,onSubmit}) {
  const [choices,setChoices]=useState({});
  const set=(id,patch)=>setChoices(previous=>({...previous,[id]:{...previous[id],...patch}}));
  const ready=value.issues.every(issue=>choices[issue.id]?.action&&
    (choices[issue.id].action!=='CORRECT'||choices[issue.id].text?.trim()));
  return <section className="panel patent-evidence-clarification" aria-label="근거 불일치 확인">
    <h2>분석 내용과 인용 근거를 확인해 주세요</h2>
    <p>아래 항목의 인용을 원문에서 확인하지 못했습니다. 각 항목의 반영 방법을 선택하면 기존 분석에 보완 내용을 적용하고 다음 단계로 진행합니다.</p>
    <p>사용자가 확인한 내용은 사용자 제공 정보로 기록합니다. 원문 검증이나 측정 결과로 간주하지 않으며, 이후 독립 검토를 거칩니다.</p>
    {value.issues.map((issue,index)=><article className="patent-source" key={issue.id}>
      <h3>확인할 내용 {index+1}</h3><p className="patent-prose">{issue.statement}</p>
      {issue.references.map((ref,i)=><div key={i}><p>{ref.reason}</p>
        <strong>분석이 인용한 내용</strong><blockquote>{ref.excerpt}</blockquote>
        <strong>해당 위치의 실제 원문</strong><blockquote className="patent-prose">{ref.source_text||'지정한 위치에 원문 문장이 없습니다.'}</blockquote>
        <details><summary>인용 위치</summary><code>{ref.artifact}{ref.pointer}</code></details></div>)}
      <label>반영 방법 {index+1}<select aria-label={'반영 방법 '+(index+1)} value={choices[issue.id]?.action||''} disabled={busy}
        onChange={e=>set(issue.id,{action:e.target.value})}>
        <option value="">선택해 주세요</option><option value="CORRECT">확인한 내용으로 보완</option>
        <option value="UNVERIFIED">미확인으로 남기고 진행</option>
        {issue.collection!=='checks'&&<option value="EXCLUDE">이 분석 내용을 제외</option>}
      </select></label>
      <label>{choices[issue.id]?.action==='CORRECT'?'확인한 기술 내용·수정 내용':'보충 설명 (선택)'}
        <textarea aria-label={'근거 보완 '+(index+1)} maxLength={3000} disabled={busy} value={choices[issue.id]?.text||''}
          onChange={e=>set(issue.id,{text:e.target.value})}/></label>
    </article>)}
    <button className="button dark" disabled={busy||!ready} onClick={()=>onSubmit({clarification_version_id:version,
      resolutions:value.issues.map(issue=>({issue_id:issue.id,action:choices[issue.id].action,text:choices[issue.id].text||''}))})}>보완 내용 적용하고 다음 단계</button>
  </section>;
}
