import {test,expect} from '@playwright/test';

test('U01 U02 U11 U12 C12 keep, continue, final feedback and no learning status card in any tab',async({page})=>{
  const ax={snapshot_id:'s1',epoch:0,gates:{},run_contract:{version:'ax-run-v3',mode:'LITE'},
    mode_coverage:{eligible_tracks:['A_MATRIX','H_EFFECTS'],executed_tracks:['H_EFFECTS'],omitted_tracks:{A_MATRIX:'NOT_SELECTED_BY_POLICY'}},
    diagnostics:{policy_usage:{selection_mode:'RULE_BASED'},routing_readiness:'COLLECTING',actual_cost:15,unresolved_reserve:0,remaining_budget:100000}};
  let view={run_id:'unified',title:'전도 연결부',status:'WAITING_HUMAN',stage_index:7,
    stages:Array.from({length:12},(_,i)=>({key:`s${i}`,label:`단계 ${i}`,index:i})),
    constraints:[],reviewers:[],solutions:[],additions:[],report_sections:[],report_ready:false,ax,
    pending:{id:'p1',kind:'DECIDE',title:'조건부 후보 확인',payload:{conditional:[{concept_id:'C1',title:'전도 연결부',mitigation:'미확인 조건은 남아 있습니다.'}],
      effect_applications:[{application_id:'legacy-effect',conditions:[{condition_id:'old',text:'과거 조건 질문'}]}]}}};
  const writes=[];
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:{id:'owner',name:'Fixture'}}}));
  await page.route('**/api/notifications',r=>r.fulfill({json:[]}));
  await page.route('**/api/runs/**/view',r=>r.fulfill({json:view}));
  await page.route('**/api/runs/**/steps',r=>r.fulfill({json:[]}));
  await page.route('**/api/runs/**/events',r=>r.fulfill({body:'',contentType:'text/event-stream'}));
  await page.route('**/api/runs/**/ax/snapshots/*',r=>r.fulfill({json:{snapshot_id:'s1',members:{concepts:'v1'}}}));
  await page.route('**/api/runs/unified/resume',r=>{
    writes.push(r.request().postDataJSON().payload);
    view={...view,status:'COMPLETED',pending:null,report_ready:true,solutions:[{key:'C1',title:'전도 연결부',verdict:'조건 확인 필요',score:null,
      assumptions:[],transfer_conditions:[],validation:[],risks:[],evidence:[],reference_cards:[]}]};
    return r.fulfill({json:{ok:true}});
  });
  await page.route('**/api/runs/unified/feedback',r=>{writes.push(r.request().postDataJSON());return r.fulfill({json:{ok:true}});});
  await page.goto('/?page=solve&run=unified');
  await expect(page.getByText('과거 조건 질문')).toHaveCount(0);
  await expect(page.getByText('조건별 충족')).toHaveCount(0);
  await page.getByLabel('진행 판단').selectOption('accept');
  await page.getByRole('button',{name:'답변 전달하고 계속'}).click();
  await expect.poll(()=>writes.length).toBe(1);
  expect(writes[0]).toEqual({decisions:{C1:'accept'}});
  expect(JSON.stringify(writes[0])).not.toContain('application_reviews');
  await page.getByRole('button',{name:'피드백',exact:true}).click();
  await expect(page.getByPlaceholder('실제 적용 가능성과 보완할 점을 알려 주세요.')).toBeVisible();
  await page.getByLabel('전도 연결부 평가').selectOption('4');
  await page.getByRole('button',{name:'피드백 저장',exact:true}).click();
  await expect.poll(()=>writes.length).toBe(2);
  expect(writes[1].solution_feedback[0]).toMatchObject({concept_id:'C1',rating:4});
  expect(writes[1]).not.toHaveProperty('training_consent');
  const expectNoLearningCardInAnyTab=async()=>{
    for(const name of ['분석 현황','문제 정의','해결안','보고서','피드백']){
      const tab=page.getByRole('button',{name,exact:true});
      await tab.click();
      await expect(tab).toHaveClass('active');
      await expect(page.getByRole('region',{name:'기법 선택과 학습 상태'})).toHaveCount(0);
      await expect(page.getByText('기법 선택과 학습 상태',{exact:true})).toHaveCount(0);
    }
  };
  await expectNoLearningCardInAnyTab();
  await expect(page.getByRole('button',{name:'피드백 저장',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'검토 의견 저장',exact:true})).toBeVisible();
  view={...view,run_id:'next-run',status:'CREATED',pending:null,report_ready:false,solutions:[]};
  await page.goto('/?page=solve&run=next-run');
  await expectNoLearningCardInAnyTab();
  await expect(page.getByText('ACTIVE_Q')).toHaveCount(0);
});
