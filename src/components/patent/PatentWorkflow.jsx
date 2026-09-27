import React, {useState} from 'react';
import {Check, ChevronRight, GitBranch} from 'lucide-react';
import './PatentWorkflow.css';

const labels={COMPLETED:'완료',PENDING:'대기',WAITING:'확인 필요',RUNNING:'실행 중',QUEUED:'실행 대기',FAILED:'실패',UNCERTAIN:'결과 확인 필요'};

export default function PatentWorkflow({workflow,material}) {
  const [selected,setSelected]=useState(null);
  if(!workflow?.nodes?.length)return null;
  const nodes=workflow.nodes;
  const current=nodes.find(n=>n.id===selected);
  return <section className="panel patent-workflow" aria-label="특허 작성 프로세스">
    <div className="patent-workflow-heading"><div><h2><GitBranch size={20}/> 특허 작성 프로세스</h2>
      <p>문제·해결안의 기존 정보를 활용해 문서를 작성합니다. 노드를 선택하면 입력, 프롬프트, 산출물과 Gate 조건을 확인할 수 있습니다.</p></div>
      <small>{workflow.version}</small></div>
    <div className="patent-node-graph">
      {workflow.stages.map(stage=><div className="patent-node-stage" key={stage.id}>
        <h3>{stage.id} · {stage.label}</h3>
        {nodes.filter(n=>n.stage===stage.id).map(node=><React.Fragment key={node.id}>
          <button type="button" aria-pressed={selected===node.id} className={`patent-process-node ${node.type} ${node.status.toLowerCase()}`}
            onClick={()=>setSelected(node.id)}>
            <small>{node.id} · {node.type==='gate'?'Gate':'Subprocess'}</small>
            <strong>{node.label}</strong><span>{node.status==='COMPLETED'&&<Check size={13}/>} {labels[node.status]||node.status}</span>
          </button><span className="patent-node-connector" aria-hidden="true">↓</span>
        </React.Fragment>)}
      </div>)}
    </div>
    {current&&<div className="patent-node-detail" aria-label="선택한 노드 상세">
      <h3>{current.id} · {current.label}</h3>
      <dl><dt>입력</dt><dd>{current.inputs.join(', ')||'선택한 TRIZ 해결안'}</dd>
        <dt>산출물</dt><dd>{current.outputs.join(', ')||'Gate 통과 / 사용자 확인 대기'}</dd>
        {current.tool&&<><dt>MCP 도구</dt><dd><code>{current.tool}</code></dd></>}
        {current.condition&&<><dt>Gate 조건</dt><dd>{current.condition}</dd></>}
        <dt>다음 노드</dt><dd>{workflow.edges.filter(e=>e.from===current.id).map(e=><div key={e.to}><ChevronRight size={12}/> {e.to} · {e.when}</div>)}</dd></dl>
      {current.prompt_text?<details open><summary>단계별 프롬프트 · {current.prompt_file}</summary>
        <pre>{material.workflow_contract?.common_prompt}</pre><pre>{current.prompt_text}</pre></details>
        :<p>정해진 코드와 조건으로 실행하는 노드입니다.</p>}
      <details><summary>저장된 구조화 입력</summary><pre>{JSON.stringify(Object.fromEntries(current.inputs.filter(k=>material[k]).map(k=>[k,material[k]])),null,2)}</pre></details>
      <details><summary>저장된 구조화 출력</summary><pre>{JSON.stringify(Object.fromEntries(current.outputs.filter(k=>material[k]).map(k=>[k,material[k]])),null,2)}</pre></details>
    </div>}
    <details><summary>서식별 기존 정보 연결</summary>
      <p>{material.workflow_contract?.template_id} · 기존 자료는 초안의 근거이며, 검증된 측정 결과로 자동 간주하지 않습니다.</p>
      <div className="patent-mapping-grid">{material.section_mapping?.sections?.map(section=><article key={section.id}>
        <h4>{section.heading}</h4><small>{section.inputs.length?section.inputs.map(i=>i.source_path).join(' · '):'작성 과정에서 근거 확인 필요'}</small>
      </article>)}</div>
    </details>
  </section>;
}
