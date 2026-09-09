import {test, expect} from '@playwright/test';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const view = {
  run_id:'input-run',title:'모바일 입력 확인',industry:'비즈니스',system:'팀 의사결정',query:'분석 입력',
  status:'WAITING_HUMAN',stage_index:2,stages:[{key:'intake',label:'의견 확인',index:2}],
  guide:'입력을 확인하고 있어요.',constraints:[],reviewers:[],solutions:[],report_sections:[],report_ready:false,
  pending:{interrupt_id:'input-question',kind:'CLARIFY',title:'조건 확인',payload:{questions:[
    {question:'현재 조건은 무엇인가요?'},{question:'원하는 목표는 무엇인가요?'}]}},
};

test.beforeEach(async({page})=>{
  await page.route('**/auth/session',route=>route.fulfill({json:{configured:true,user:{id:'input-user',name:'Tester'}}}));
  await page.route('**/api/notifications',route=>route.fulfill({json:[]}));
  await page.route('**/api/runs/input-run/view',route=>route.fulfill({json:view}));
  await page.goto('/?page=solve&run=input-run');
  await expect(page.getByLabel('현재 조건은 무엇인가요?')).toBeVisible();
});
const scale = page => page.evaluate(()=>visualViewport.scale);

test('mobile editing zoom lasts only while a text field is active and preserves answers',async({page})=>{
  const original=await page.locator('meta[name=viewport]').getAttribute('content');
  const first=page.getByLabel('현재 조건은 무엇인가요?'),second=page.getByLabel('원하는 목표는 무엇인가요?');
  await first.tap();
  await expect.poll(()=>scale(page)).toBeCloseTo(1.15,2);
  expect(await first.evaluate(e=>getComputedStyle(e).fontSize)).toBe('16px');
  await first.fill('현재 90%');
  await second.tap();
  await second.fill('목표 95%');
  await expect.poll(()=>scale(page)).toBeCloseTo(1.15,2);
  await page.evaluate(()=>document.activeElement.blur());
  await expect.poll(()=>scale(page)).toBeCloseTo(1,2);
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content',original);
  await expect(first).toHaveValue('현재 90%');
  await expect(second).toHaveValue('목표 95%');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('tapping submit while zoomed sends answers once and restores the viewport',async({page})=>{
  const submissions=[];
  await page.route('**/api/runs/input-run/resume',route=>{
    submissions.push(route.request().postDataJSON());
    return route.fulfill({json:{ok:true}});
  });
  await page.getByLabel('현재 조건은 무엇인가요?').tap();
  await page.getByLabel('현재 조건은 무엇인가요?').fill('보존할 응답');
  await expect.poll(()=>scale(page)).toBeCloseTo(1.15,2);
  await page.getByRole('button',{name:'답변 전달하고 계속',exact:true}).tap();
  await expect.poll(()=>submissions.length).toBe(1);
  expect(submissions[0].payload.answers[0]).toBe('보존할 응답');
  await expect.poll(()=>scale(page)).toBeCloseTo(1,2);
});

test('existing user pinch zoom is preserved instead of resetting it on blur',async({page,context})=>{
  const cdp=await context.newCDPSession(page);
  await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1.5});
  await expect.poll(()=>scale(page)).toBeCloseTo(1.5,2);
  const original=await page.locator('meta[name=viewport]').getAttribute('content');
  await page.getByLabel('현재 조건은 무엇인가요?').focus();
  await page.evaluate(()=>document.activeElement.blur());
  await expect.poll(()=>scale(page)).toBeCloseTo(1.5,2);
  await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content',original);
});

test('keyboard dismissal and removal of the focused field both end editing zoom',async({page})=>{
  await page.getByLabel('현재 조건은 무엇인가요?').tap();
  await expect.poll(()=>scale(page)).toBeCloseTo(1.15,2);
  // Desktop mobile emulation has no software keyboard: simulate its viewport heights.
  await page.evaluate(()=>{
    const viewport=visualViewport;
    const normalHeight=viewport.height;
    Object.defineProperty(viewport,'height',{configurable:true,get:()=>normalHeight-300});
    viewport.dispatchEvent(new Event('resize'));
    Object.defineProperty(viewport,'height',{configurable:true,get:()=>normalHeight});
    viewport.dispatchEvent(new Event('resize'));
    delete viewport.height;
  });
  await expect.poll(()=>scale(page)).toBeCloseTo(1,2);
  await page.getByLabel('현재 조건은 무엇인가요?').tap();
  await expect.poll(()=>scale(page)).toBeCloseTo(1.15,2);
  await page.evaluate(()=>document.activeElement.remove());
  await expect.poll(()=>scale(page)).toBeCloseTo(1,2);
});

test('desktop editing leaves the viewport unchanged',async({browser})=>{
  const context=await browser.newContext({viewport:{width:1366,height:768}});
  const page=await context.newPage();
  try {
    await page.route('**/auth/session',route=>route.fulfill({json:{configured:true,user:{id:'desktop-user',name:'Tester'}}}));
    await page.route('**/api/notifications',route=>route.fulfill({json:[]}));
    await page.goto('/?page=solve');
    const original=await page.locator('meta[name=viewport]').getAttribute('content');
    await page.getByLabel('해결하고 싶은 문제', {exact:true}).focus();
    await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content',original);
    expect(await scale(page)).toBe(1);
  } finally {await context.close();}
});

test('new-problem input uses the same readable font and reversible editing zoom',async({page})=>{
  await page.goto('/?page=solve');
  const input=page.getByLabel('해결하고 싶은 문제',{exact:true});
  expect(await input.evaluate(e=>getComputedStyle(e).fontSize)).toBe('16px');
  await input.tap();
  await input.fill('입력한 문제를 유지합니다.');
  await expect.poll(()=>scale(page)).toBeCloseTo(1.15,2);
  await page.evaluate(()=>document.activeElement.blur());
  await expect.poll(()=>scale(page)).toBeCloseTo(1,2);
  await expect(input).toHaveValue('입력한 문제를 유지합니다.');
});

test('a keyboard resize during button press waits for pointer release before restoring zoom',async({page})=>{
  await page.getByLabel('현재 조건은 무엇인가요?').tap();
  await expect.poll(()=>scale(page)).toBeCloseTo(1.15,2);
  await page.evaluate(()=>{
    const button=document.querySelector('.human-request button, .human-panel button') ||
      [...document.querySelectorAll('button')].find(e=>e.textContent.includes('답변 전달하고 계속'));
    button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
    button.focus();
    visualViewport.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(60);
  expect(await scale(page)).toBeCloseTo(1.15,2);
  await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true})));
  await expect.poll(()=>scale(page)).toBeCloseTo(1,2);
});
