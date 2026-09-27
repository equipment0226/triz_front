import {test,expect} from '@playwright/test';

test('automatic workflow exposes node prompts, gates and a single change confirmation',async({page})=>{
  const posts=[];
  const record={case_id:'auto',title:'자동 작성 사례',workflow_mode:'AUTOMATIC',revision:0,epoch:1,
    snapshot_id:'s0',execution_status:'CREATED',provider_authorization:null,budget:{spent_micro_usd:0,cap_micro_usd:0}};
  const material={answers:{},source:{concept:{title:'냉각판'}},
    application_questions:{questions:[{id:'APPLICATION_CHANGES',question:'선택 이후 변경사항이 있나요?',blocking:true,reason:'변경분만 확인'}]},
    workflow_contract:{common_prompt:'근거를 재사용하고 미확인 사실을 구분합니다.',template_id:'KR_GENERAL_REVIEW_DRAFT_V1'},
    section_mapping:{sections:[{id:'solution',heading:'과제의 해결 수단',inputs:[{source_path:'concept'}]}]}};
  const workflow={version:'patent-authoring-v1',stages:[{id:'P1',label:'발명 정리'},{id:'P3',label:'문서 자동 작성'}],
    nodes:[{id:'G1',stage:'P1',label:'필수 정보 충족',type:'gate',status:'WAITING',inputs:['questions'],outputs:[],condition:'미답변 필수 질문이 없으면 통과'},
      {id:'P3.2',stage:'P3',label:'명세서 작성',type:'subprocess',status:'PENDING',inputs:['invention','claims'],outputs:['specification'],
        tool:'patent_draft_specification',prompt_file:'prompts/specification.md',prompt_text:'Use the pinned section mapping to draft complete Korean paragraphs.'}],
    edges:[{from:'G1',to:'P3.2',when:'필수 정보 충족'}]};
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:{id:'owner',name:'Owner',email:'equipment0226@gmail.com'}}}));
  await page.route('**/api/notifications',r=>r.fulfill({json:[]}));
  await page.route('**/api/patent/**',r=>{
    const path=new URL(r.request().url()).pathname;
    if(r.request().method()==='POST'){
      const body=r.request().postDataJSON();posts.push(body);
      material.answers={...material.answers,...body.payload.answers};record.revision++;
      return r.fulfill({json:{case:record,result:{ok:true}}});
    }
    if(path.endsWith('/capabilities'))return r.fulfill({json:{t3_reasoning_configured:false}});
    if(path.endsWith('/patches'))return r.fulfill({json:[]});
    if(path.endsWith('/sample-image'))return r.fulfill({json:{status:'NOT_RUN'}});
    return r.fulfill({json:{case:record,material,workflow,reviews:[],attachment_requirements:[],
      intake:{complete:false,pending_question_ids:['APPLICATION_CHANGES']}}});
  });
  await page.goto('/?page=patent&case=auto&section='+encodeURIComponent('질문'));
  await page.getByRole('button',{name:'프로세스',exact:true}).click();
  await expect(page.getByRole('region',{name:'특허 작성 프로세스'})).toBeVisible();
  await page.getByRole('button',{name:/P3.2 · Subprocess/}).click();
  await expect(page.getByText('Use the pinned section mapping to draft complete Korean paragraphs.')).toBeVisible();
  await expect(page.getByText('patent_draft_specification',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:/G1 · Gate/}).click();
  await expect(page.getByText('미답변 필수 질문이 없으면 통과')).toBeVisible();
  await page.getByRole('button',{name:'질문',exact:true}).click();
  await page.getByRole('button',{name:'변경사항 없음',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'선택 이후 변경사항이 있나요?'})).toHaveValue(/변경사항 없음/);
  await page.getByRole('button',{name:'답변 저장하고 자동 작성'}).click();
  await expect.poll(()=>posts.length).toBe(1);
  expect(Object.keys(posts[0].payload.answers)).toEqual(['APPLICATION_CHANGES']);
});
