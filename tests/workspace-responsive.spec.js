import {test,expect} from '@playwright/test';

const project={
  run_id:'responsive-run',title:'현장 팀의 의사결정 지연과 자율성 확보',industry:'비즈니스',system:'팀 의사결정',
  query:'검토 단계를 줄이면서 잘못된 의사결정을 방지하고 싶습니다.',status:'WAITING_HUMAN',stage_index:2,
  stages:Array.from({length:12},(_,index)=>({key:`stage-${index}`,label:`${index+1}. 문제와 해결 방향 검토`,index})),
  guide:'다음 단계로 가기 전에 의사결정 조건을 알려 주세요.',constraints:[],reviewers:[],solutions:[],report_sections:[],report_ready:false,
  pending:{interrupt_id:'clarify-1',kind:'CLARIFY',title:'의사결정 조건 확인',payload:{questions:[{question:'승인이 필요한 결정은 무엇인가요?',why_needed:'권한과 책임의 범위 확인'}]}},
};
const notice={id:'retry-1',run_id:project.run_id,project_title:project.title,kind:'RETRY_REQUIRED',title:'분석 재시도',
  description:'분석이 중단되었어요. 저장된 내용을 확인하고 이어서 실행해 주세요.',action_label:'이어서 확인'};

test.beforeEach(async({page})=>{
  await page.route('**/auth/session',route=>route.fulfill({json:{configured:true,user:{id:'responsive-user',name:'Tester'}}}));
  await page.route('**/api/notifications',route=>route.fulfill({json:[]}));
  await page.route('**/api/runs/responsive-run/view',route=>route.fulfill({json:project}));
});

test('interrupted analysis notifies on another page and opens the run without retrying it',async({page})=>{
  let notifications=[];
  const mutations=[];
  page.on('request',request=>{if(request.url().includes('/api/')&&request.method()==='POST')mutations.push(request.url());});
  await page.route('**/api/notifications',route=>route.fulfill({json:notifications}));
  await page.route('**/api/runs/responsive-run/view',route=>route.fulfill({json:{...project,status:'FAILED',pending:null}}));
  await page.goto('/?page=about');
  notifications=[notice];
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  const dialog=page.getByRole('dialog');
  await expect(dialog).toContainText('분석을 이어서 실행해 주세요');
  await expect(dialog).toContainText(notice.description);
  await expect(dialog).not.toContainText('검토가 요청되었어요');
  await dialog.getByRole('button',{name:'나중에 확인',exact:true}).click();
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button',{name:'알림 1건',exact:true}).click();
  await expect(page.locator('.notification-menu')).toContainText(notice.description);
  await page.locator('.notification-menu').getByRole('button').click();
  await expect(page).toHaveURL(/run=responsive-run/);
  await expect(page.locator('.tabs .active')).toHaveText('분석 현황');
  await expect(page.getByRole('button',{name:'이어서 실행',exact:true})).toBeVisible();
  expect(mutations).toEqual([]);
  // A later interruption is a new notification even when the same run was dismissed.
  notifications=[{...notice,id:'retry-2'}];
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(dialog).toBeVisible();
});

test('mobile notification popup and menu stay centered in the viewport after scrolling',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/api/notifications',route=>route.fulfill({json:[notice]}));
  for(const width of [320,360,390,768]){
    await page.setViewportSize({width,height:800});
    await page.goto('/?page=solve&run=responsive-run');
    await page.evaluate(()=>localStorage.removeItem('triz-notifications:responsive-user'));
    await page.reload();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.evaluate(()=>window.scrollTo(0,250));
    async function expectCentered(locator){
      const box=await locator.boundingBox();
      expect(Math.abs(box.x+box.width/2-width/2)).toBeLessThan(1);
      expect(Math.abs(box.y+box.height/2-400)).toBeLessThan(1);
      expect(box.x).toBeGreaterThanOrEqual(15);
      expect(box.y).toBeGreaterThanOrEqual(15);
      expect(box.x+box.width).toBeLessThanOrEqual(width-15);
      expect(box.y+box.height).toBeLessThanOrEqual(785);
    }
    await expectCentered(page.getByRole('dialog'));
    if(width===390) await page.screenshot({path:'test-results/notification-mobile-centered.png'});
    await page.getByRole('button',{name:'알림 1건',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expectCentered(page.locator('.notification-menu'));
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button',{name:'나중에 확인',exact:true}).click();
    await page.getByRole('button',{name:'알림 1건',exact:true}).click();
    await expectCentered(page.locator('.notification-menu'));
    await page.keyboard.press('Escape');
    await expect(page.locator('.notification-menu')).toHaveCount(0);
  }
});

test('workspace navigation, analysis tabs and content fit mobile and tablet widths',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [320,360,390,768,900,1280,1366]){
    const height=width>1000?768:844;
    await page.setViewportSize({width,height});
    await page.goto('/?page=solve&run=responsive-run');
    await expect(page.getByLabel('승인이 필요한 결정은 무엇인가요?')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    const navigation=await page.locator('main>.workspace-nav').boundingBox();
    const workspace=await page.locator('.workspace').boundingBox();
    expect(Math.abs(navigation.x-workspace.x)).toBeLessThan(1);
    expect(Math.abs(navigation.width-workspace.width)).toBeLessThan(1);
    const firstAction=await page.locator('main>.workspace-nav button').first().boundingBox();
    const heading=await page.locator('.project-heading').boundingBox();
    expect(Math.abs(firstAction.x-heading.x)).toBeLessThan(1);
    const content=await page.locator('.work-main').boundingBox();
    for(const tab of await page.locator('.tabs button').all()){
      const box=await tab.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(content.x-1);
      expect(box.x+box.width).toBeLessThanOrEqual(content.x+content.width+1);
      expect(box.y+box.height).toBeLessThanOrEqual(height);
    }
    for(const item of await page.locator('.header nav button').all()){
      const box=await item.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x+box.width).toBeLessThanOrEqual(width);
    }
    if(width<=1000) expect((await page.locator('.stage-nav').boundingBox()).height).toBeLessThan(75);
    if(width===390) await page.screenshot({path:'test-results/workspace-mobile-aligned.png',fullPage:true});
    if(width===1366) await page.screenshot({path:'test-results/workspace-desktop-aligned.png'});
  }
});
