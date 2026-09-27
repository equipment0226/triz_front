import {test,expect} from '@playwright/test';

async function fixture(page,{authorized=true}={}) {
  const record={case_id:'concurrent',title:'출구 구역 독립 유량 제어 분할',revision:1,epoch:1,snapshot_id:'s1',
    workflow_mode:'AUTOMATIC',execution_status:'WAITING_HUMAN',waiting_for:'QUESTIONS',
    provider_authorization:authorized?{purpose:'test'}:null,model_config:authorized?{T3:{reasoning:true}}:{},
    budget:{spent_micro_usd:0,cap_micro_usd:authorized?6000000:0}};
  const material={answers:{APPLICATION_CHANGES:'기존 답변'},application_questions:{questions:[
    {id:'APPLICATION_CHANGES',question:'변경사항',blocking:true,reason:'변경 확인'}]}};
  const state={record,material,posts:[],onPost:null,onGet:null,reads:0};
  const snapshot=()=>structuredClone({case:record,material,reviews:[],attachment_requirements:[],intake:{complete:true,pending_question_ids:[]}});
  state.snapshot=snapshot;
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:{id:'owner',email:'equipment0226@gmail.com'}}}));
  await page.route('**/api/notifications',r=>r.fulfill({json:[]}));
  await page.route('**/api/patent/**',async r=>{
    const path=new URL(r.request().url()).pathname;
    if(path.endsWith('/capabilities'))return r.fulfill({json:{t3_reasoning_configured:true,required_review_micro_usd:4282128}});
    if(path.endsWith('/patches'))return r.fulfill({json:[]});
    if(path.endsWith('/sample-image'))return r.fulfill({json:{status:'NOT_RUN'}});
    if(r.request().method()==='POST') {
      const body=r.request().postDataJSON();state.posts.push({body,key:r.request().headers()['idempotency-key']});
      if(state.onPost&&await state.onPost(r,body))return;
      if(body.expected_revision!==record.revision)return r.fulfill({status:409,json:{code:'VERSION_CONFLICT',detail:'사건 버전이 변경됐습니다. 다시 불러와 주세요.'}});
      Object.assign(material.answers,body.payload.answers||{});record.revision++;
      return r.fulfill({json:{case:record,result:{}}});
    }
    state.reads++;
    if(state.onGet&&await state.onGet(r,state.reads))return;
    return r.fulfill({json:snapshot()});
  });
  await page.goto('/?page=patent&case=concurrent&section='+encodeURIComponent('질문'));
  await expect(page.getByRole('textbox',{name:'변경사항',exact:true})).toHaveValue('기존 답변');
  return state;
}

test('worker progress conflicts retry the same answer once against the current version',async({page})=>{
  const f=await fixture(page);
  f.onPost=async(r)=>{
    if(f.posts.length!==1)return false;
    f.record.revision++;f.record.snapshot_id='worker-output';
    await r.fulfill({status:409,json:{code:'VERSION_CONFLICT',detail:'사건 버전이 변경됐습니다.'}});return true;
  };
  await page.getByRole('textbox',{name:'변경사항',exact:true}).fill('새 유량 조건');
  await page.getByRole('button',{name:'답변 저장하고 자동 작성',exact:true}).click();
  await expect.poll(()=>f.material.answers.APPLICATION_CHANGES).toBe('새 유량 조건');
  expect(f.posts.map(p=>p.body.expected_revision)).toEqual([1,2]);
  expect(f.posts[0].key).toBe(f.posts[1].key);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('conflicting edits in another tab preserve local text and require review before saving',async({page})=>{
  const f=await fixture(page);
  f.onPost=async(r)=>{
    if(f.posts.length!==1)return false;
    f.record.revision++;f.material.answers.APPLICATION_CHANGES='다른 창에서 수정한 조건';
    await r.fulfill({status:409,json:{code:'VERSION_CONFLICT',detail:'사건 버전이 변경됐습니다.'}});return true;
  };
  await page.getByRole('textbox',{name:'변경사항',exact:true}).fill('현재 창의 수정 내용');
  await page.getByRole('button',{name:'답변 저장하고 자동 작성',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('입력한 내용은 유지했습니다');
  await expect(page.getByRole('textbox',{name:'변경사항',exact:true})).toHaveValue('현재 창의 수정 내용');
  expect(f.posts).toHaveLength(1);
  expect(f.material.answers.APPLICATION_CHANGES).toBe('다른 창에서 수정한 조건');
});

test('late polling response cannot replace a newer case revision',async({page})=>{
  await page.clock.install();
  const f=await fixture(page);
  let release;
  f.onGet=async(r,n)=>{
    if(n!==2)return false;
    const old=f.snapshot();await new Promise(resolve=>{release=resolve;});await r.fulfill({json:old});return true;
  };
  await page.clock.fastForward(7000);await expect.poll(()=>Boolean(release)).toBe(true);
  f.record.revision=3;
  await page.getByRole('button',{name:'새로고침',exact:true}).click();
  await expect.poll(()=>f.reads).toBe(3);
  // Wait for the newer GET to be consumed before releasing the old polling GET.
  await page.getByRole('textbox',{name:'변경사항',exact:true}).fill('최신 버전에 저장');
  release();await page.clock.fastForward(100);
  await page.getByRole('button',{name:'답변 저장하고 자동 작성',exact:true}).click();
  await expect.poll(()=>f.posts.length).toBe(1);
  expect(f.posts[0].body.expected_revision).toBe(3);
});

test('unapproved case opens budget controls instead of reporting missing T3',async({page})=>{
  const f=await fixture(page,{authorized:false});
  await page.getByRole('button',{name:'예산 승인하기',exact:true}).click();
  await expect(page.getByRole('spinbutton',{name:'총 실행 한도 (USD)'})).toBeFocused();
  expect(f.posts).toHaveLength(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('new followup sends only current question IDs while preserving older answers',async({page})=>{
  const f=await fixture(page);
  Object.assign(f.material.answers,{'Q-01':'첫 번째 답변','Q-02':'두 번째 답변'});
  f.material.synthesis_questions={questions:[{id:'Q-03',question:'새 보완 질문',reason:'보완 확인',blocking:true}]};
  await page.getByRole('button',{name:'새로고침',exact:true}).click();
  await page.getByRole('textbox',{name:'새 보완 질문',exact:true}).fill('추가로 입력한 답변');
  await page.getByRole('button',{name:'답변 저장하고 자동 작성',exact:true}).click();
  await expect.poll(()=>f.material.answers['Q-03']).toBe('추가로 입력한 답변');
  expect(Object.keys(f.posts[0].body.payload.answers).sort()).toEqual(['APPLICATION_CHANGES','Q-03']);
  expect(f.material.answers['Q-01']).toBe('첫 번째 답변');
  expect(f.material.answers['Q-02']).toBe('두 번째 답변');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a changed question is not automatically overwritten by a conflict retry',async({page})=>{
  const f=await fixture(page);
  f.onPost=async(r)=>{
    if(f.posts.length!==1)return false;
    f.record.revision++;
    f.material.application_questions.questions[0].question='갱신된 질문';
    await r.fulfill({status:409,json:{code:'VERSION_CONFLICT',detail:'사건 버전이 변경됐습니다.'}});return true;
  };
  await page.getByRole('textbox',{name:'변경사항',exact:true}).fill('아직 저장하지 않은 답변');
  await page.getByRole('button',{name:'답변 저장하고 자동 작성',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('입력한 내용은 유지했습니다');
  expect(f.posts).toHaveLength(1);
  expect(f.material.answers.APPLICATION_CHANGES).toBe('기존 답변');
});

test('citation mismatch shows source comparison and submits explicit corrections in one step',async({page})=>{
  const f=await fixture(page);
  f.record.artifacts={evidence_clarification:'evc-v1'};f.record.waiting_for='EVIDENCE_CLARIFICATION';
  f.material.evidence_clarification={artifact_type:'synthesized_solution',issues:[1,2,3].map(i=>({
    id:'EVC-'+i,collection:'facts',statement:'분석 내용 '+i,
    references:[{artifact:'source',pointer:'/concept/description',excerpt:'일치하지 않는 인용 '+i,
      source_text:'실제 원문 '+i,reason:'원문과 다름'}]}))};
  await page.getByRole('button',{name:'새로고침',exact:true}).click();
  const panel=page.getByRole('region',{name:'근거 불일치 확인'});
  await expect(panel).toContainText('실제 원문 1');await expect(panel).toContainText('일치하지 않는 인용 1');
  const submit=panel.getByRole('button',{name:'보완 내용 적용하고 다음 단계'});
  await expect(submit).toBeDisabled();
  await page.getByLabel('반영 방법 1',{exact:true}).selectOption('CORRECT');
  await page.getByLabel('근거 보완 1',{exact:true}).fill('사용자가 확인한 실제 기술 조건');
  await page.getByLabel('반영 방법 2',{exact:true}).selectOption('UNVERIFIED');
  await page.getByLabel('반영 방법 3',{exact:true}).selectOption('EXCLUDE');
  await page.getByRole('button',{name:'새로고침',exact:true}).click();
  await expect(page.getByLabel('근거 보완 1',{exact:true})).toHaveValue('사용자가 확인한 실제 기술 조건');
  f.onPost=async(r,body)=>{
    expect(new URL(r.request().url()).pathname).toMatch(/evidence-resolutions$/);
    expect(body.payload.clarification_version_id).toBe('evc-v1');
    delete f.material.evidence_clarification;delete f.record.artifacts.evidence_clarification;
    f.record.execution_status='QUEUED';f.record.waiting_for=null;return false;
  };
  await submit.click();await expect(panel).toHaveCount(0);
  expect(f.posts).toHaveLength(1);
  expect(f.posts[0].body.payload.resolutions.map(v=>v.action)).toEqual(['CORRECT','UNVERIFIED','EXCLUDE']);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
