import {test,expect} from '@playwright/test';

test('four gates and optional version review do not add coordinator approval',async({page})=>{
  const ax={snapshot_id:'snap-fixture',epoch:3,coordinator_hitl:false,
    gates:{G1:{label:'문제 정의',status:'PASS'},G2:{label:'문제 분석',status:'PASS'},G3:{label:'해결안 도출',status:'CONDITIONAL'},G4:{label:'검증·선택',status:'CONDITIONAL'}},
    coordination:{reason:'열전달과 분리 원리 자동 탐색'},selection:{conditional:['C1','C2','C3'],shortfall:2,
      coverage_gaps:[{obligation_id:'TC1',description:'미해결 모순에 대한 추가 검토 권고'}]}};
  const view={run_id:'ax-fixture',title:'DLC 냉각수와 GPU 온도 상충',query:'DLC',industry:'데이터센터',system:'DLC',
    status:'COMPLETED',stage_index:2,stages:[{key:'s5_solve',label:'다중 기법 해결책 탐색',index:0},{key:'s10_feedback',label:'피드백 반영',index:1}],guide:'완료',
    pending:null,problem:'온도 상충',constraints:[],reviewers:[],solutions:[],figures:[],report_ready:true,
    report_sections:[],summary:'',additions:[],evidence_gaps:[],search_status:{},ax};
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:{name:'Fixture'}}}));
  await page.route('**/api/notifications',r=>r.fulfill({json:[]}));
  await page.route('**/api/public/runs**',r=>r.fulfill({json:{items:[],total:0,page:1,page_size:20}}));
  await page.route('**/api/runs?*',r=>r.fulfill({json:{items:[view],total:1,page:1,page_size:20}}));
  await page.route('**/api/runs',r=>r.fulfill({json:[view]}));
  await page.route('**/api/runs/ax-fixture/view',r=>r.fulfill({json:view}));
  await page.route('**/api/runs/ax-fixture/steps',r=>r.fulfill({json:[]}));
  await page.route('**/api/runs/ax-fixture/events',r=>r.fulfill({body:'',contentType:'text/event-stream'}));
  await page.route('**/api/runs/ax-fixture/ax/snapshots/snap-fixture',r=>r.fulfill({json:{snapshot_id:ax.snapshot_id,members:{concepts:'av-candidates'}}}));
  let submitted;
  await page.route('**/api/runs/ax-fixture/ax/reviews',r=>{submitted=r.request().postDataJSON();return r.fulfill({json:{event_id:submitted.event_id}});});
  await page.goto('/');
  await page.getByRole('button',{name:'Problem Solving',exact:true}).click();
  await page.getByRole('button',{name:'내 분석 이력',exact:true}).click();
  await page.getByRole('button',{name:/DLC 냉각수/}).click();
  const progress=page.getByRole('region',{name:'4개 게이트 진행 상황'});
  await expect(progress).toContainText('G4 검증·선택 · 검토 종료');
  await expect(progress).toContainText('현재 단계: 피드백 반영 · 완료');
  await expect(progress).not.toContainText(/조건부|필요한 시험|적용을 판단|목표 5개|추가 검토|추가 해결|미해결 모순/);
  await expect(page.getByText('자동 조율: 열전달과 분리 원리 자동 탐색')).toHaveCount(0);
  await page.getByRole('button',{name:'피드백',exact:true}).click();
  await page.getByLabel('이유',{exact:true}).fill('냉각 에너지와 GPU 온도를 함께 측정할 필요가 있음');
  await page.getByRole('button',{name:'검토 의견 저장',exact:true}).click();
  await expect(page.getByText('검토 당시 분석 버전에 의견을 저장했습니다.')).toBeVisible();
  expect(submitted.snapshot_id).toBe('snap-fixture');
  expect(submitted.expected_epoch).toBe(3);
  expect(submitted.consent).toBe('NO_TRAINING');

  // Server state after reload must remain visible without exposing selection advice.
  for(const [status,gateStatus,label,gateLabel] of [
    ['RUNNING','RUNNING','분석 중','진행 중'],
    ['WAITING_HUMAN','WAITING','의견 확인','입력 대기'],
    ['INTERRUPTED','INTERRUPTED','일시 중단','중단'],
  ]){
    await page.setViewportSize({width:status==='WAITING_HUMAN'?390:1366,height:900});
    Object.assign(view,{status,stage_index:0,report_ready:false});
    ax.gates.G3.status=gateStatus;
    ax.gates.G4.status='NOT_RUN';
    await page.goto('/?page=solve&run=ax-fixture');
    await expect(progress).toContainText(`현재 단계: 다중 기법 해결책 탐색 · ${label}`);
    await expect(progress).toContainText(`G3 해결안 도출 · ${gateLabel}`);
    await expect(progress).toContainText('G4 검증·선택 · 예정');
    await expect(progress).not.toContainText(/조건부|필요한 시험|적용을 판단|목표 5개|추가 검토|추가 해결|미해결 모순|자동 조율/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2)).toBe(true);
  }
});
