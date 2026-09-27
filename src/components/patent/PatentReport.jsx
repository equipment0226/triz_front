import React from 'react';
import {Download, FileText, Pencil} from 'lucide-react';
import './PatentReport.css';

export default function PatentReport({record,material,onEdit,onGenerate,busy}) {
  const saved=material.report;
  const draft=material.specification;
  if(!saved&&!draft)return <section className="panel patent-report-empty"><FileText size={30}/><h2>특허 초안을 자동 작성합니다</h2>
    <p>변경사항을 확인하면 수정 해결안과 기술 용어를 정리하고, 청구범위·명세서·요약·도면을 하나의 보고서로 작성합니다.</p>
    <p>완성된 보고서는 여기에서 읽고 Word 또는 PDF로 다운로드할 수 있습니다.</p></section>;
  const report=saved||{title:draft.title,subtitle:'특허출원 검토용 초안',applicant:material.facts?.applicant_name||'미확인',inventors:material.facts?.inventor_names||'미확인',
    sections:[...draft.sections.filter(s=>s.id!=='title').map(s=>({...s,text:s.text||s.omission_reason||'미확인'})),
      ...(material.claims?.claims||[]).map(c=>({id:'claim-'+c.number,heading:'청구항 '+c.number,text:c.text})),
      {id:'abstract',heading:'요약서',text:draft.abstract}],drawings:[]};
  const link=format=>`/api/patent/cases/${encodeURIComponent(record.case_id)}/report/${format}?version_id=${encodeURIComponent(record.artifacts?.report||'')}`;
  return <section className="patent-report" aria-label="특허 초안 보고서">
    <div className="patent-report-toolbar"><div><strong>{saved?'저장된 보고서':'작성 중인 초안'}</strong><small>{saved?'아래 내용과 동일한 문서를 다운로드합니다.':'문서 검토와 파일 생성이 끝나면 다운로드할 수 있습니다.'}</small></div>
      <div className="actions"><button className="button subtle" onClick={onEdit}><Pencil size={15}/>본문 수정</button>
        {saved?<><a className="button subtle" href={link('docx')}><Download size={15}/>Word 다운로드</a><a className="button dark" href={link('pdf')}><Download size={15}/>PDF 다운로드</a></>
          :<><button className="button subtle" disabled>Word 다운로드</button><button className="button dark" disabled>PDF 다운로드</button>{record.workflow_mode!=='AUTOMATIC'&&<button className="button dark" disabled={busy} onClick={onGenerate}>통합 보고서 저장</button>}</>}</div></div>
    <div className="patent-report-layout"><nav className="patent-report-toc" aria-label="보고서 목차"><strong>목차</strong>
      {report.sections.map(s=><a key={s.id} href={'#patent-report-'+s.id}>{s.heading}</a>)}
      {report.drawings.length>0&&<a href="#patent-report-drawings">도면</a>}</nav>
      <article className="patent-report-paper"><header><p>{report.subtitle}</p><h1>{report.title}</h1><dl><dt>출원인</dt><dd>{report.applicant}</dd><dt>발명자</dt><dd>{report.inventors}</dd></dl></header>
        {report.sections.map(s=><section id={'patent-report-'+s.id} key={s.id}><h2>{s.heading}</h2><p>{s.text}</p></section>)}
        {!!report.drawings.length&&<section id="patent-report-drawings"><h2>도면</h2>{report.drawings.map((d,i)=><figure key={d.number}>
          <figcaption>도 {d.number} · {d.caption} · {d.kind==='CONCEPT'?'참고용 개념도':'검토용 도면 후보'}</figcaption>
          <img src={link('figure-'+(i+1))} alt={'도 '+d.number+' '+d.caption}/>
          {d.edges.map((e,index)=><p key={index}>{e.from} → {e.to}: {e.label}</p>)}
        </figure>)}</section>}
        <footer>특허출원 검토용 초안{saved&&<> · 문서 버전 {saved.content_hash.slice(0,12)}</>}</footer>
      </article></div>
  </section>;
}
