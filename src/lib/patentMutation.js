import {patentApi,patentPost,versionBody} from './patentApi';

const equal=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
const questions=material=>Object.fromEntries(['application_questions','synthesis_questions','questions','review_questions']
  .flatMap(kind=>material?.[kind]?.questions||[]).map(question=>[question.id,question]));

export function currentQuestionAnswers(material,answers) {
  const active=questions(material),stored=material?.answers||{};
  if(Object.entries(answers).some(([id,value])=>!active[id]&&value.trim()!==(stored[id]||'').trim()))
    throw new Error('질문이 갱신되었습니다. 입력한 내용은 유지했습니다. 현재 질문을 확인한 뒤 답변해 주세요.');
  return Object.fromEntries(Object.entries(answers).filter(([id])=>active[id]));
}

// Rebase only changes whose user-editable inputs have not changed on the server.
// Worker progress may change revision/snapshot without changing those inputs.
export function canRebasePatentMutation(operation,payload,before,after) {
  const a=before.case,b=after.case;
  if(a.case_id!==b.case_id||a.epoch!==b.epoch||['CANCELLED','COMPLETED'].includes(b.execution_status))return false;
  if(operation==='answers')return Object.keys(payload.answers||{}).every(id=>
    equal(questions(before.material)[id],questions(after.material)[id]))&&['answers','facts'].every(kind=>
      Object.keys(payload[kind]||{}).every(key=>equal(before.material?.[kind]?.[key],after.material?.[kind]?.[key])));
  if(operation==='budget-authorizations')return a.budget.cap_micro_usd===b.budget.cap_micro_usd&&
    equal(a.model_config,b.model_config)&&equal(a.provider_authorization,b.provider_authorization);
  if(operation==='evidence-resolutions')return a.artifacts?.evidence_clarification===b.artifacts?.evidence_clarification&&
    a.artifacts?.evidence_clarification===payload.clarification_version_id;
  return a.snapshot_id===b.snapshot_id&&a.execution_status===b.execution_status&&a.waiting_for===b.waiting_for;
}

export async function mutatePatentCase(caseId,operation,before,payload={},onLatest=()=>{}) {
  const path='/cases/'+encodeURIComponent(caseId);
  const key=crypto.randomUUID();
  let current=before;
  for(let attempt=0;attempt<3;attempt++) {
    try {return await patentPost(path+'/'+operation,versionBody(current.case,payload),key);}
    catch(error) {
      if(error.code!=='VERSION_CONFLICT')throw error;
      const latest=await patentApi(path);onLatest(latest);
      if(attempt===2||!canRebasePatentMutation(operation,payload,before,latest)) {
        error.message='최신 진행 상태를 불러왔습니다. 입력한 내용은 유지했습니다. 변경된 내용을 확인한 뒤 다시 저장해 주세요.';
        throw error;
      }
      current=latest;
    }
  }
}
