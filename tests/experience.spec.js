import {test,expect} from '@playwright/test';
const project={run_id:'r1',title:'진동 데이터 해상도와 저장 용량',mode:'DEEP',industry:'제조',system:'진동 수집',query:'진동 데이터를 분석합니다.',status:'WAITING_HUMAN',stage_index:0,
  stages:[{key:'s1',label:'문제 정의',index:0}],guide:'조건을 확인해 주세요.',problem:'해상도와 용량의 상충',constraints:['기존 센서 유지'],reviewers:[{role:'센서 전문가',mandate:'계측 조건 확인',avatar:0}],
  solutions:[],report_sections:[],report_ready:false,pending:{interrupt_id:'request-1',kind:'CLARIFY',title:'샘플링 조건 확인',payload:{questions:[{question:'센서 수는 몇 개인가요?',why_needed:'용량 산정'}]}}};
test.beforeEach(async({page})=>{
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:{id:'test-user',name:'Tester'}}}));
  await page.route('**/api/notifications',r=>r.fulfill({json:[]}));
  await page.route('**/api/runs/r1/view',r=>r.fulfill({json:project}));
  await page.route('**/api/public/runs/r1/view',r=>r.fulfill({json:{...project,pending:null}}));
});
test('notifications arrive across pages, defer once, and open the response tab',async({page})=>{
  let requests=[];
  await page.route('**/api/notifications',r=>r.fulfill({json:requests}));
  await page.goto('/');
  await page.getByRole('button',{name:'Tool 소개',exact:true}).click();
  requests=[{id:'request-1',run_id:'r1',project_title:project.title,title:'샘플링 조건 확인'}];
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('dialog')).toContainText(project.title);
  await page.getByRole('button',{name:'나중에 진행',exact:true}).click();
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'알림 1건'}).click();
  await page.locator('.notification-menu').getByRole('button').click();
  await expect(page.getByLabel('센서 수는 몇 개인가요?')).toBeVisible();
  await expect(page.getByText('문제의 경계를 함께 정리합니다')).toHaveCount(0);
  await expect(page.getByText('특허 검색 현황')).toHaveCount(0);
  await page.locator('.tabs').getByRole('button',{name:'문제 정의',exact:true}).click();
  await expect(page.getByText('기존 센서 유지')).toBeVisible();
  await expect(page.getByText('센서 전문가',{exact:true})).toBeVisible();
  requests=[{id:'request-2',run_id:'r1',project_title:project.title,title:'해결안 검토'}];
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('dialog')).toContainText('해결안 검토');
  await page.getByRole('button',{name:'지금 진행',exact:true}).click();
  await expect(page.getByLabel('센서 수는 몇 개인가요?')).toBeVisible();
});
test('both libraries paginate 20 records and label every analysis mode',async({page})=>{
  const items=Array.from({length:23},(_,i)=>({...project,run_id:'r'+i,title:'분석 기록 '+i,mode:['LITE','FULL','DEEP'][i%3]}));
  async function list(route){
    const url=new URL(route.request().url()),p=Number(url.searchParams.get('page')||1),term=url.searchParams.get('search')||'';
    const filtered=items.filter(i=>i.title.includes(term));
    await route.fulfill({json:{items:filtered.slice((p-1)*20,p*20),total:filtered.length,page:p,page_size:20}});
  }
  await page.route('**/api/runs?*',list);await page.route('**/api/public/runs?*',list);
  await page.goto('/');
  for(const nav of ['Problem Solving','Sample Case']){
    await page.getByRole('button',{name:nav,exact:true}).click();
    if(nav==='Problem Solving')await page.getByRole('button',{name:'내 분석 이력',exact:true}).click();
    await expect(page.locator('.history-row')).toHaveCount(20);
    for(const mode of ['LITE','FULL','DEEP'])await expect(page.locator('.history-row .mode-'+mode).first()).toHaveCSS('color','rgb(255, 255, 255)');
    await page.getByRole('button',{name:'다음',exact:true}).click();
    await expect(page.locator('.history-row')).toHaveCount(3);
    await page.getByLabel('프로젝트 검색').fill('분석 기록 22');
    await expect(page.locator('.history-row')).toHaveCount(1);
    await expect(page.locator('.history-row')).toContainText('분석 기록 22');
  }
});
test('sample tabs share spacing and hide patent status',async({page})=>{
  await page.route('**/api/public/runs?*',r=>r.fulfill({json:{items:[project],page:1,total:1,page_size:20}}));
  await page.goto('/');await page.getByRole('button',{name:'Sample Case',exact:true}).click();await page.locator('.history-row').click();
  for(const name of ['문제 정의','해결안','보고서']){
    await page.getByRole('tab',{name,exact:true}).click();
    const nav=await page.getByRole('tablist').boundingBox(),content=await page.locator('.case-tab-content').boundingBox();
    expect(content.y-nav.y-nav.height).toBeGreaterThanOrEqual(24);
  }
  await expect(page.getByText('특허 검색 현황')).toHaveCount(0);
  await expect(page.getByRole('tab',{name:'분석 현황',exact:true})).toHaveCount(0);
  await page.getByRole('tab',{name:'문제 정의',exact:true}).click();
  await expect(page.getByText(project.problem,{exact:true})).toBeVisible();
  await expect(page.getByText('기존 센서 유지',{exact:true})).toBeVisible();
  await expect(page.getByText('센서 전문가',{exact:true})).toBeVisible();
  await expect(page.getByText('계측 조건 확인',{exact:true})).toBeVisible();
  await expect(page).toHaveURL(/tab=definition/);
  await page.reload();
  await expect(page.getByRole('tab',{name:'문제 정의',exact:true})).toHaveAttribute('aria-selected','true');
  await page.goto('/?page=cases&run=r1&tab=analysis');
  await expect(page.getByRole('tab',{name:'문제 정의',exact:true})).toHaveAttribute('aria-selected','true');
});
test('technical photos load and reduced motion disables continuous effects',async({page})=>{
  await page.goto('/');await page.locator('.sample-grid').scrollIntoViewIfNeeded();
  await expect.poll(()=>page.locator('.sample-art img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.core-shape')).toHaveCSS('animation-name','none');
  await page.getByRole('button',{name:'Problem Solving',exact:true}).click();
  await expect(page.locator('.bot')).toHaveCSS('animation-name','none');
  await expect(page.locator('.tree-speech')).toContainText('관찰한 현상');
});
