import React,{useState,useEffect} from 'react';
import {patentApi} from '../../lib/patentApi';

export default function PatentReasoning({record,material}) {
  const [history,setHistory]=useState(null),[error,setError]=useState('');
  useEffect(()=>{let live=true;setError('');patentApi(`/cases/${encodeURIComponent(record.case_id)}/keywords`).then(v=>{if(live)setHistory(v);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[record.case_id,record.artifacts?.drafting_keywords]);
  const solution=material.synthesized_solution;
  return <section className="panel patent-trace" aria-label="단계별 분석과 키워드">
    <h2>수정 해결안과 작성 근거</h2>
    {!solution?<p>원본 해결안과 사용자 보완 정보를 종합하고 있습니다.</p>:<>
      <h3>{solution.title}</h3><p className="patent-prose">{solution.revised_solution}</p><h4>작동 원리</h4><p>{solution.working_principle}</p>
      {solution.changes.map((change,i)=><article key={i}><h4>{change.subject}</h4><p>변경 전: {change.before}</p><p>변경 후: {change.after}</p><small>{change.reason}</small></article>)}
      <details><summary>기술 사실·판단 근거 {solution.facts.length}건</summary>{solution.facts.map(f=><article key={f.id}>
        <strong>{f.id} · {f.statement}</strong><small>{f.category} · {f.status}</small><p>{f.rationale}</p>
        {f.basis.map((b,i)=><blockquote key={i}>{b.excerpt}<small>{b.artifact}{b.pointer}</small></blockquote>)}</article>)}</details>
      {solution.issues.map(i=><p key={i.id}>{i.status==='OPEN'?'미해결':'해소'} · {i.description} {i.resolution}</p>)}</>}
    <h3>문서 작성 키워드</h3><p>각 키워드는 수정 해결안의 근거와 사용 문서 항목에 연결되어 별도 이력으로 저장됩니다.</p>
    <div className="patent-keyword-table"><table className="patent-keywords"><thead><tr><th>키워드</th><th>의미·동의어</th><th>추출 근거</th><th>사용 항목</th></tr></thead>
      <tbody>{material.drafting_keywords?.keywords?.map(k=><tr key={k.id}><td><strong>{k.term}</strong><small>{k.id} · {k.category}</small></td>
        <td>{k.definition}<small>{k.synonyms.join(', ')}</small></td><td>{k.rationale}<small>{k.fact_ids.join(', ')}</small></td><td>{k.target_sections.join(', ')}</td></tr>)}</tbody></table></div>
    {error&&<p role="alert">{error}</p>}
    <details><summary>키워드 변경 이력 ({history?.items?.length||0}건)</summary>{history?.items?.map((k,i)=><article key={i}>
      <strong>{k.term} · {k.current?'현재 버전':'이전 버전'}</strong><p>{k.definition}</p><small>키워드 버전 {k.version_id}<br/>종합 해결안 버전 {k.source_version_id}</small></article>)}</details>
    <h3>문서 기술·문맥 검토</h3>{material.document_coherence?<><p>{material.document_coherence.summary}</p>
      {material.document_coherence.checks.map(c=><article key={c.id}><strong>{c.dimension} · {c.outcome}</strong><p>{c.explanation}</p>{c.repair_instruction&&<p>보완 방향: {c.repair_instruction}</p>}</article>)}</>:<p>문서 작성 후 기술적 연결과 문맥을 검토합니다.</p>}
  </section>;
}
