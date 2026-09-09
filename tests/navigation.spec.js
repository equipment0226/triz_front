import {test,expect} from '@playwright/test';

const report = [{key:'report',title:'긴 보고서',blocks:[
  {type:'html',html:'<table><tr>'+Array.from({length:10},(_,i)=>`<th>비교 항목 ${i}</th>`).join('')+'</tr><tr>'+Array.from({length:10},()=>'<td>긴 항목 내용 '+ '데이터'.repeat(30)+'</td>').join('')+'</tr></table>'},
  {type:'figure',figure:{key:'wide',title:'구성도',svg:'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="600" viewBox="0 0 1600 600"><rect width="1600" height="600" fill="#edf3e1"/><text x="30" y="50">도표</text></svg>'}},
  {type:'html',html:'<p>보고서 본문</p>'.repeat(80)}]}];
const project={run_id:'r1',title:'진동 데이터 분석',industry:'제조',system:'수집 장치',query:'진동 센서를 분석합니다.',status:'COMPLETED',stage_index:0,stages:[{key:'s1',label:'문제 정의',index:0}],guide:'분석 완료',constraints:['기존 센서 유지'],reviewers:[],solutions:[],report_ready:true,report_sections:report};
test.beforeEach(async({page})=>{
  await page.route('**/auth/session',r=>r.fulfill({json:{configured:true,user:{id:'tester',name:'Tester'}}}));
  await page.route('**/api/notifications',r=>r.fulfill({json:[]}));
  await page.route('**/api/**/r1/view',r=>r.fulfill({json:project}));
  await page.route(/\/api\/(public\/)?runs\?/,r=>{
    const p=Number(new URL(r.request().url()).searchParams.get('page')||1);
    return r.fulfill({json:{items:[project],page:p,total:21,page_size:20}});
  });
});

test('back, forward and refresh restore project tabs and the list page',async({page})=>{
  await page.goto('/?page=solve&view=history&listPage=2&search=진동');
  await expect(page.getByLabel('프로젝트 검색')).toHaveValue('진동');
  await expect(page.locator('.pagination')).toContainText('2 / 2');
  await page.locator('.history-row').click();
  await page.locator('.tabs').getByRole('button',{name:'문제 정의',exact:true}).click();
  await page.locator('.tabs').getByRole('button',{name:'보고서',exact:true}).click();
  await expect(page).toHaveURL(/tab=report/);
  await page.getByRole('button',{name:'Sample Case',exact:true}).click();
  await page.locator('.history-row').click();
  await expect(page.getByRole('tab',{name:'보고서',exact:true})).toHaveAttribute('aria-selected','true');
  await page.getByRole('tab',{name:'해결안',exact:true}).click();
  await page.goBack();
  await expect(page.getByRole('tab',{name:'보고서',exact:true})).toHaveAttribute('aria-selected','true');
  await page.goBack();
  await expect(page.locator('.history-row')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.tabs .active')).toHaveText('보고서');
  await page.reload();
  await expect(page.locator('.report-section')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.tabs .active')).toHaveText('문제 정의');
  await page.goBack();
  await expect(page.locator('.tabs .active')).toHaveText('분석 현황');
  await page.goBack();
  await expect(page.locator('.pagination')).toContainText('2 / 2');
  await expect(page.getByLabel('프로젝트 검색')).toHaveValue('진동');
  await page.goForward();
  await expect(page.locator('.tabs .active')).toHaveText('분석 현황');
});

test('mobile reports stay within the viewport and scroll-to-top works on both pages',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [360,390,768]){
    await page.setViewportSize({width,height:800});
    for(const type of ['solve','cases']){
      await page.goto(`/?page=${type}&run=r1&tab=report`);
      await expect(page.locator('.report-section')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const scroll = page.locator('.figure-scroll');
      await scroll.evaluate(el=>el.scrollLeft=el.scrollWidth);
      if(width<700) expect(await scroll.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
      await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
      const button=page.getByRole('button',{name:'맨 위로 이동'});
      await expect(button).toBeVisible();
      await expect(button).toHaveCSS('position','fixed');
      await button.click();
      await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
    }
  }
});

test('every home photo fills its entire card on desktop and mobile',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [1280,390]){
    await page.setViewportSize({width,height:900});await page.goto('/');
    await page.locator('.sample-grid').scrollIntoViewIfNeeded();
    for(const art of await page.locator('.sample-art').all()){
      const photo=art.locator('img');
      await expect.poll(()=>photo.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
      const frame=await art.boundingBox(),image=await photo.boundingBox();
      expect(Math.abs(frame.width-image.width)).toBeLessThan(1);
      expect(Math.abs(frame.height-image.height)).toBeLessThan(1);
      await expect(photo).toHaveCSS('object-fit','cover');
    }
  }
});
