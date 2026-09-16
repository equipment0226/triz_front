import {test,expect} from '@playwright/test';

// Requires the local isolated test server; it never uses a live model or corpus.
test.skip(!process.env.PATENT_BROWSER_API,'Start .deployment/patent_browser_api.py for the actual API contract test');
test('private source to editable export uses real API, SQLite, governor and independent reviews',async({page,request})=>{
  test.setTimeout(120000);
  const backend=process.env.PATENT_BROWSER_API;
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:{id:'owner',name:'Tester',email:'equipment0226@gmail.com'}}}));
  await page.route('**/api/notifications',r=>r.fulfill({json:[]}));
  await page.route('**/api/public/runs**',r=>r.fulfill({json:{items:[],total:0,page:1,page_size:20}}));
  await page.route('**/api/patent/**',async r=>{
    const url=new URL(r.request().url());
    const response=await r.fetch({url:backend+url.pathname+url.search,
      headers:{...r.request().headers(),'x-triz-session':'local-browser-tester'}});
    await r.fulfill({response});
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?page=patent');
  await page.getByRole('button',{name:'DLC solution',exact:true}).click();
  await page.getByRole('button',{name:'비공개 초안 만들기',exact:true}).click();
  await expect(page.getByRole('heading',{name:'실제 적용 조건과 확인할 사항'})).toBeVisible();
  const fields=page.locator('textarea[required]');
  await expect(fields).toHaveCount(3);
  for(let i=0;i<3;i++)await fields.nth(i).fill(['시설수와 장치 루프 분리','기존 배관 유지, 시설수 입구 35도','결로와 유량 부족 미검증'][i]);
  await page.getByRole('button',{name:'답변 저장',exact:true}).click();
  await page.locator('.patent-consent input').check();
  await page.getByRole('button',{name:'예산 승인',exact:true}).click();
  await page.getByRole('button',{name:'작성 계속',exact:true}).click();
  await page.getByRole('button',{name:'발명정보',exact:true}).click();
  await expect(page.getByRole('button',{name:'발명정보 확인',exact:true})).toBeVisible({timeout:30000});
  await page.getByRole('button',{name:'발명정보 확인',exact:true}).click();
  await page.getByRole('button',{name:'작성 계속',exact:true}).click();
  await page.getByRole('button',{name:'청구범위',exact:true}).click();
  await expect(page.getByRole('button',{name:'현재 청구범위 확인',exact:true})).toBeVisible({timeout:30000});
  await page.getByRole('button',{name:'현재 청구범위 확인',exact:true}).click();
  await page.getByRole('button',{name:'작성 계속',exact:true}).click();
  await page.getByRole('button',{name:'검토·수정',exact:true}).click();
  await expect(page.getByRole('heading',{name:'최종 일관성 검토 · 검토 기록 있음',exact:true})).toBeVisible({timeout:40000});
  await page.reload();
  await expect(page.getByRole('heading',{name:'최종 일관성 검토 · 검토 기록 있음',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'내보내기',exact:true}).click();
  await page.getByRole('button',{name:'내보내기 준비',exact:true}).click();
  await expect(page.getByRole('button',{name:'이 버전의 ZIP 내려받기',exact:true})).toBeVisible();
  const downloaded=page.waitForEvent('download');
  await page.getByRole('button',{name:'이 버전의 ZIP 내려받기',exact:true}).click();
  const download=await downloaded;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
  const proof=await (await request.get(backend+'/test/verification')).json();
  expect(proof.source_unchanged).toBe(true);expect(proof.paid_calls).toBe(0);
  expect(proof.roles).toEqual(['GLOBAL_FINAL','PATENT_CONTENT','TECHNICAL_CONTENT']);
  expect(errors).toEqual([]);
});
