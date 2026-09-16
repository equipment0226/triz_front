import {test,expect} from '@playwright/test';

// Browser fixtures are deliberately local; these never invoke paid models.
const questions=[
  {id:'APPLICATION_CHANGES',question:'적용하면서 달라지는 부분은 무엇인가요?',reason:'실제 구현 변경을 확인합니다.',blocking:true},
  {id:'APPLICATION_CONSTRAINTS',question:'반드시 지켜야 할 제약조건은 무엇인가요?',reason:'조건을 확인합니다.',blocking:true},
  {id:'APPLICATION_RISKS',question:'예상 위험과 미검증 사항은 무엇인가요?',reason:'위험을 확인합니다.',blocking:true},
];

async function fixture(page) {
  const record={case_id:'pat-fixture',title:'DLC 특허 초안',revision:0,epoch:1,snapshot_id:'snap-0',execution_status:'CREATED',
    provider_authorization:null,budget:{spent_micro_usd:0,cap_micro_usd:0},document_status:'INCOMPLETE'};
  const material={application_questions:{questions},answers:{},source:{concept:{title:'DLC 선택 아이디어'},scope_note:'비공개 검토'}};
  const sent=[],patches=[],reviews=[];
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:{id:'owner',name:'Owner',email:'equipment0226@gmail.com'}}}));
  await page.route('**/api/notifications',r=>r.fulfill({json:[]}));
  await page.route('**/api/public/runs**',r=>r.fulfill({json:{items:[],total:0,page:1,page_size:20}}));
  await page.route('**/api/patent/**',r=>{
    const pathname=new URL(r.request().url()).pathname;
    if(pathname.endsWith('/capabilities'))return r.fulfill({json:{t3_reasoning_configured:false}});
    if(pathname.endsWith('/patches')&&r.request().method()==='GET')return r.fulfill({json:patches});
    if(pathname.endsWith('/sample-image')&&r.request().method()==='GET')return r.fulfill({json:{status:'NOT_RUN'}});
    if(pathname.endsWith('/source-solutions'))return r.fulfill({json:{items:[],next_offset:null}});
    if(pathname.endsWith('/cases'))return r.fulfill({json:{items:[record],next_offset:null}});
    if(r.request().method()==='POST'){
      const body=r.request().postDataJSON();sent.push({path:pathname,body});
      if(body.expected_revision!==record.revision)return r.fulfill({status:409,json:{detail:'사건 버전이 변경됐습니다.'}});
      if(pathname.endsWith('/answers')){material.answers={...material.answers,...body.payload.answers};material.facts={...material.facts,...body.payload.facts};}
      if(pathname.endsWith('/patches'))patches.push({id:'patch-1',...body.payload});
      if(pathname.endsWith('/start')||pathname.endsWith('/resume')){
        record.execution_status='WAITING_HUMAN';record.waiting_for='APPLICATION_CONTEXT';
      }
      record.revision++;
      return r.fulfill({json:{case:record,result:{ok:true}}});
    }
    const pending=questions.filter(q=>!material.answers[q.id]?.trim()).map(q=>q.id);
    return r.fulfill({json:{case:record,material,approvals:{},reviews,attachment_requirements:[],
      intake:{complete:!pending.length,pending_question_ids:pending}}});
  });
  return {record,material,sent,patches,reviews};
}

test('mandatory conditions restore from server after refresh and login',async({page})=>{
  const f=await fixture(page);
  await page.goto('/?page=patent&case=pat-fixture&section='+encodeURIComponent('질문'));
  await expect(page.getByRole('heading',{name:'실제 적용 조건과 확인할 사항'})).toBeVisible();
  await expect(page.getByRole('button',{name:'답변 저장',exact:true})).toBeDisabled();
  const values=['냉각판 재질 변경','시설수 35°C, 기존 배관 유지','유량 불균형 가능성, 실측 미확인'];
  for(let i=0;i<questions.length;i++)await page.getByRole('textbox',{name:questions[i].question,exact:true}).fill(values[i]);
  await page.getByRole('button',{name:'답변 저장',exact:true}).click();
  await expect.poll(()=>f.sent.length).toBe(1);
  expect(f.sent[0].body.payload.answers.APPLICATION_RISKS).toBe(values[2]);
  expect(f.sent[0].body.expected_revision).toBe(0);
  await page.reload();
  for(let i=0;i<questions.length;i++)await expect(page.getByRole('textbox',{name:questions[i].question,exact:true})).toHaveValue(values[i]);
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:null}}));
  await page.reload();
  await expect(page.getByRole('textbox',{name:questions[0].question,exact:true})).toHaveCount(0);
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:{id:'owner',name:'Owner',email:'equipment0226@gmail.com'}}}));
  await page.reload();
  await expect(page.getByRole('textbox',{name:questions[2].question,exact:true})).toHaveValue(values[2]);
});

test('continue directs unanswered case to questions and keeps edits during polling',async({page})=>{
  const f=await fixture(page);
  await page.goto('/?page=patent&case=pat-fixture');
  await expect(page.getByRole('button',{name:'필수 질문에 답변하기'})).toBeVisible();
  await page.getByRole('button',{name:'작성 계속',exact:true}).click();
  await expect(page.getByRole('heading',{name:'실제 적용 조건과 확인할 사항'})).toBeVisible();
  await page.getByRole('textbox',{name:questions[0].question,exact:true}).fill('아직 저장하지 않은 수정 내용');
  await page.getByRole('button',{name:'새로고침',exact:true}).click();
  await expect(page.getByRole('textbox',{name:questions[0].question,exact:true})).toHaveValue('아직 저장하지 않은 수정 내용');
  expect(f.sent).toHaveLength(1);
  expect(f.sent[0].path).toMatch(/\/start$/);
  expect(f.record.budget.spent_micro_usd).toBe(0);
});

test('new risks can be edited after review without automatic dispatch',async({page})=>{
  const f=await fixture(page);
  f.record.execution_status='COMPLETED';
  f.record.document_status='DRAFT_READY';
  f.material.answers=Object.fromEntries(questions.map(q=>[q.id,'확인 당시 조건']));
  await page.goto('/?page=patent&case=pat-fixture&section='+encodeURIComponent('질문'));
  await page.getByRole('textbox',{name:questions[2].question,exact:true}).fill('추가로 확인된 결로 위험');
  await page.getByRole('button',{name:'답변 저장',exact:true}).click();
  await expect.poll(()=>f.sent.length).toBe(1);
  expect(f.sent[0].path).toMatch(/\/answers$/);
  await page.reload();
  await expect(page.getByRole('textbox',{name:questions[2].question,exact:true})).toHaveValue('추가로 확인된 결로 위험');
});

test('existing login callback restores the private question route',async({page})=>{
  const f=await fixture(page);
  f.material.answers=Object.fromEntries(questions.map(q=>[q.id,'서버에 저장된 답변']));
  let loggedIn=false;
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:loggedIn?{id:'owner',name:'Owner',email:'equipment0226@gmail.com'}:null}}));
  await page.route('**/auth/google',r=>{loggedIn=true;return r.fulfill({status:303,headers:{location:'/?page=solve'}});});
  await page.route('**/api/runs**',r=>r.fulfill({json:[]}));
  await page.goto('/?page=patent&case=pat-fixture&section='+encodeURIComponent('질문'));
  await expect(page.locator('main')).toHaveText('준비 중 입니다.');
  await page.getByRole('button',{name:/로그인 \/ 시작하기/}).click();
  await page.getByRole('link',{name:/Google로 계속하기/}).click();
  await expect(page.getByRole('textbox',{name:questions[2].question,exact:true})).toHaveValue('서버에 저장된 답변');
  expect(new URL(page.url()).searchParams.get('case')).toBe('pat-fixture');
  expect(new URL(page.url()).searchParams.get('section')).toBe('질문');
  expect(await page.evaluate(()=>sessionStorage.getItem('triz-patent-login-return'))).toBeNull();
});

for(const user of [null,{id:'other',name:'Other',email:'other@example.com'},{id:'fake',name:'equipment0226@gmail.com'}]){
  test(`closed patent test hides every section and makes no patent request: ${user?.id||'anonymous'}`,async({page})=>{
    await fixture(page);
    await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user}}));
    const requests=[];
    page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/patent/'))requests.push(r.url());});
    await page.goto('/?page=patent&case=pat-fixture&section='+encodeURIComponent('청구범위'));
    await expect(page.locator('main')).toHaveText('준비 중 입니다.');
    await expect(page.getByRole('navigation',{name:'특허 초안 단계'})).toHaveCount(0);
    await page.reload();
    await expect(page.locator('main')).toHaveText('준비 중 입니다.');
    expect(requests).toEqual([]);
  });
}

test('structured claim editing shows changes and all opposing review findings',async({page})=>{
  const f=await fixture(page);
  f.material.claims={claims:[{number:1,text:'기존 냉각판을 포함하는 장치.',feature_ids:['F1'],depends_on:[],support_sections:['embodiments']}]};
  f.reviews.push({id:'r1',role:'TECHNICAL_CONTENT',summary:'기술 검토 첫 의견',findings:[]},
    {id:'r2',role:'TECHNICAL_CONTENT',summary:'기술 검토 반대 의견',findings:[{outcome:'FAIL',explanation:'두 번째 의견의 미해결 열저항 조건'}]});
  await page.goto('/?page=patent&case=pat-fixture&section='+encodeURIComponent('청구범위'));
  await page.getByText('청구범위 수정 제안',{exact:true}).click();
  await page.getByLabel('청구항 1 내용',{exact:true}).fill('별도의 냉각 루프를 포함하는 장치.');
  await page.getByLabel('수정 이유',{exact:true}).fill('실제 적용 구조 반영');
  await page.getByRole('button',{name:'새로고침',exact:true}).click();
  await expect(page.getByLabel('청구항 1 내용',{exact:true})).toHaveValue('별도의 냉각 루프를 포함하는 장치.');
  await page.getByRole('button',{name:'수정안 저장하고 비교',exact:true}).click();
  await expect(page.getByLabel('수정 전후 비교')).toContainText('기존 냉각판을 포함하는 장치.');
  await expect(page.getByLabel('수정 전후 비교')).toContainText('별도의 냉각 루프를 포함하는 장치.');
  await expect(page.getByText('두 번째 의견의 미해결 열저항 조건')).toBeVisible();
  expect(f.sent).toHaveLength(1);
  expect(f.sent[0].body.payload.before_hash).toMatch(/^[a-f0-9]{64}$/);
  expect(f.material.claims.claims[0].text).toBe('기존 냉각판을 포함하는 장치.');
});

test('unknown attachment facts stay unknown and saved owner facts restore',async({page})=>{
  const f=await fixture(page);
  await page.goto('/?page=patent&case=pat-fixture');
  await expect(page.getByLabel('우선권 주장 여부',{exact:true})).toHaveValue('unknown');
  await page.getByLabel('우선권 주장 여부',{exact:true}).selectOption('no');
  await page.getByLabel('출원인 성명 또는 명칭',{exact:true}).fill('출원인 직접 입력');
  await page.getByRole('button',{name:'확인 사실 저장',exact:true}).click();
  await expect.poll(()=>f.sent.length).toBe(1);
  expect(f.material.facts.priority).toBe(false);
  expect(f.material.facts.sequence).toBeUndefined();
  await page.reload();
  await expect(page.getByLabel('출원인 성명 또는 명칭',{exact:true})).toHaveValue('출원인 직접 입력');
  await expect(page.getByLabel('우선권 주장 여부',{exact:true})).toHaveValue('no');
  await expect(page.getByLabel('서열목록 필요 여부',{exact:true})).toHaveValue('unknown');
});
