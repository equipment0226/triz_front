import {test,expect} from '@playwright/test';

// Requires the local isolated test server; it never uses a live model or corpus.
test.skip(!process.env.PATENT_BROWSER_API,'Start .deployment/patent_browser_api.py for the actual API contract test');
test('private source to editable export uses real API, SQLite, governor and independent reviews',async({page,request},testInfo)=>{
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
  await expect(fields).toHaveCount(1);
  await fields.first().fill('시설수와 장치 루프 분리. 기존 배관 유지, 입구 35도. 결로와 유량 부족은 미검증.');
  await page.getByRole('button',{name:'답변 저장하고 자동 작성',exact:true}).click();
  await page.locator('.patent-consent input').check();
  await page.getByRole('button',{name:'예산 승인하고 자동 작성',exact:true}).click();
  await expect(page.getByRole('button',{name:'최종 초안 확인',exact:true})).toBeVisible({timeout:60000});
  await page.getByRole('button',{name:'분석·키워드',exact:true}).click();
  await expect(page.getByRole('cell',{name:/냉각판/}).first()).toBeVisible();
  await page.getByRole('button',{name:'프로세스',exact:true}).click();
  await page.getByRole('button',{name:/P1.K · Subprocess/}).click();
  await expect(page.getByText('patent_extract_keywords',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'보고서',exact:true}).click();
  await expect(page.getByRole('region',{name:'특허 초안 보고서'})).toBeVisible();
  await expect(page.getByRole('button',{name:/ZIP/})).toHaveCount(0);
  await page.getByRole('button',{name:'최종 초안 확인',exact:true}).click();
  await expect(page.getByRole('button',{name:'최종 초안 확인',exact:true})).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('link',{name:'Word 다운로드',exact:true})).toBeVisible();
  await page.screenshot({path:'../test-results/patent-report-desktop.png',fullPage:true});
  for(const [name,extension,type] of [['Word 다운로드','docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],['PDF 다운로드','pdf','application/pdf']]){
    const downloaded=page.waitForEvent('download');
    await page.getByRole('link',{name,exact:true}).click();
    const download=await downloaded;
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename().endsWith('.'+extension)).toBe(true);
    const artifactPath=testInfo.outputPath('patent-report.fixture.'+extension);
    await download.saveAs(artifactPath);
    await testInfo.attach('patent-report-'+extension,{path:artifactPath,contentType:type});
  }
  const proof=await (await request.get(backend+'/test/verification')).json();
  expect(proof.source_unchanged).toBe(true);expect(proof.paid_calls).toBe(0);
  expect(proof.roles).toEqual(['GLOBAL_FINAL','PATENT_CONTENT','TECHNICAL_CONTENT']);
  expect(errors).toEqual([]);
});
