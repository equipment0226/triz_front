import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

const frozen = JSON.parse(readFileSync(new URL('./fixtures/ax-full-report.json', import.meta.url), 'utf8'));
const stressSections = Array.from({length:16}, (_, i) => ({key:`chapter-${i}`, title:`긴 보고서 ${i + 1}`, blocks:[
  ...Array.from({length:8}, (_, j) => ({type:'html', html:`<p data-read-token="p-${i}-${j}">${'분석 근거와 검증 조건을 확인합니다. '.repeat(150)}</p>`})),
  {type:'figure', figure:{key:`figure-${i}`, title:`도식 ${i + 1}`, svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">${Array.from({length:300}, (_, n) => `<circle cx="${n%30*20}" cy="${Math.floor(n/30)*20}" r="4"/>`).join('')}</svg>`}},
]}));
stressSections.push({key:'trace', title:'긴 추론 표', blocks:[{type:'html', html:'<table><thead><tr><th>추론 단계</th></tr></thead><tbody>' +
  Array.from({length:120}, (_, i) => `<tr data-read-token="row-${i}"><td>${i}: ${'기록된 판단과 근거. '.repeat(50)}</td></tr>`).join('') + '</tbody></table><p data-read-token="last">마지막 문단</p><img src="x" onerror="window.reportUnsafe=true"><script>window.reportUnsafe=true</script>'}]});
const stress = {...frozen, run_id:'long-report', status:'COMPLETED', pending:null, report_sections:stressSections};

async function mock(page, view = stress) {
  await page.route('**/auth/session', r => r.fulfill({json:{configured:true, user:{id:'reader',name:'Reader'}}}));
  await page.route('**/api/notifications', r => r.fulfill({json:[]}));
  await page.route('**/api/**/view', r => r.fulfill({json:view}));
}

test('mobile chapter chooser numbers each entry once without changing report headings', async ({page}) => {
  const cases = [
    ['요약', '요약'],
    ['1. 문제 정의', '문제 정의'],
    ['2.시스템 분석', '시스템 분석'],
    ['제3장 해결 방향', '해결 방향'],
    ['4장 제약 검토', '제약 검토'],
    ['5) 적용 계획', '적용 계획'],
    ['(6) 검증 사항', '검증 사항'],
    ['7.1. 상세 검토', '상세 검토'],
    ['부록 A. 참고자료', '부록 A. 참고자료'],
    ['3D 구조 검토', '3D 구조 검토'],
    ['3.5 mm 간격 검토', '3.5 mm 간격 검토'],
  ];
  const sections = cases.map(([title], i) => ({key:`numbered-${i}`, title,
    blocks:[{type:'html', html:`<p data-chapter="${i}">장 본문 ${i + 1}</p>`}]}));
  await page.setViewportSize({width:390,height:844});
  await mock(page, {...frozen, report_sections:sections});
  await page.goto(`/?page=cases&run=${frozen.run_id}&tab=report`);
  const chooser = page.getByLabel('보고서 페이지', {exact:true});
  await expect(chooser.locator('option')).toHaveText(cases.map(([, label], i) => `${i + 1}. ${label}`));
  await expect(page.getByLabel('장 바로가기').getByRole('button')).toHaveText(cases.map((_, i) => String(i + 1)));
  for (const [i, [title]] of cases.entries()) {
    await chooser.selectOption(String(i));
    await expect(page.locator('.report-section h2')).toHaveText(title);
    await expect(page.locator('.report-section [data-chapter]')).toHaveAttribute('data-chapter', String(i));
    await expect(page.getByLabel('장 바로가기').locator('[aria-current="page"]')).toHaveText(String(i + 1));
  }
});

test('mobile report keeps each complete chapter on one numbered page', async ({page}) => {
  test.setTimeout(90000);
  await page.setViewportSize({width:390,height:844});
  await mock(page);
  const errors = [], documents = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => {if(r.isNavigationRequest() && r.frame() === page.mainFrame()) documents.push(r.url());});
  await page.goto('/?page=cases&run=long-report&tab=report');
  const chooser = page.getByLabel('보고서 페이지', {exact:true});
  await expect(chooser).toBeVisible();
  const values = await chooser.locator('option').evaluateAll(options => options.map(o => o.value));
  expect(values.length).toBe(stressSections.length);
  await expect(page.getByLabel('장 바로가기').getByRole('button')).toHaveCount(stressSections.length);
  await page.getByRole('button', {name:'2장으로 이동',exact:true}).click();
  await expect(chooser).toHaveValue('1');
  await expect(page.locator('[data-read-token="p-1-0"]')).toHaveCount(1);
  await expect(page.locator('[data-read-token="p-1-7"]')).toHaveCount(1);
  const tokens = new Set(), figures = new Set();
  let peakNodes = 0;
  for (const value of values) {
    await chooser.selectOption(value);
    await expect(page.locator('.report-section')).toHaveCount(1);
    const content = await page.locator('.report-process').evaluate(root => ({
      tokens:[...root.querySelectorAll('[data-read-token]')].map(el => el.dataset.readToken),
      figures:[...root.querySelectorAll('figcaption')].map(el => el.textContent),
      nodes:root.querySelectorAll('*').length,
    }));
    content.tokens.forEach(t => tokens.add(t));
    content.figures.forEach(t => figures.add(t));
    peakNodes = Math.max(peakNodes, content.nodes);
  }
  expect(tokens.size).toBe(16*8 + 120 + 1);
  expect(figures.size).toBe(16);
  expect(peakNodes).toBeLessThan(900);
  expect(await page.evaluate(() => window.reportUnsafe)).toBeUndefined();
  for (let i=0; i<12; i++) {
    await page.getByRole('tab',{name:'해결안',exact:true}).click();
    await expect(page.locator('.report-process')).toHaveCount(0);
    await page.getByRole('tab',{name:'보고서',exact:true}).click();
    await expect(page.locator('.report-section')).toHaveCount(1);
  }
  expect(documents).toHaveLength(1);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
  await expect(page.getByRole('link',{name:'전체 보고서 다운로드'})).toHaveAttribute('href','/api/public/runs/long-report/report');
  await test.info().attach('report-dom-metrics', {body:JSON.stringify({pages:values.length,peakNodes,allFigures:figures.size,allContentTokens:tokens.size,tabSwitches:12}),contentType:'application/json'});
});

test('full frozen report retains all figures across mobile pages and desktop view', async ({page}) => {
  test.setTimeout(60000);
  await mock(page, frozen);
  await page.setViewportSize({width:390,height:844});
  await page.goto(`/?page=cases&run=${frozen.run_id}&tab=report`);
  const chooser = page.getByLabel('보고서 페이지',{exact:true});
  await expect(chooser).toBeVisible();
  await expect(chooser.locator('option')).toHaveText([
    '1. 요약 (Executive Summary)', '2. 문제 정의', '3. 시스템 분석', '4. 문제 정의 (TRIZ)',
    '5. 해결책 도출 과정', '6. 제약조건 검토', '7. 최종 해결책 (우선순위순)', '8. 실행 로드맵',
    '9. 한계 및 검증 필요사항', '10. 부록 A. 참고자료 (검색 기반)',
    '11. 부록 C. 추론 이력 (Step Trace)', '12. 부록 D. 검증 상태와 분석 기록',
  ]);
  const values = await chooser.locator('option').evaluateAll(options => options.map(o => o.value));
  const titles = [];
  for (const value of values) {
    await chooser.selectOption(value);
    titles.push(...await page.locator('.report-section figcaption').allTextContents());
  }
  const expected = frozen.report_sections.flatMap(s => s.blocks.filter(b => b.type === 'figure').map(b => b.figure.title));
  expect(titles).toEqual(expected);
  await page.setViewportSize({width:1366,height:900});
  await expect(chooser).toHaveCount(0);
  await expect(page.locator('.report-section')).toHaveCount(frozen.report_sections.length);
  await expect(page.locator('.report-section figcaption')).toHaveCount(expected.length);
});

test('completed private report stops polling and a resumed run continues updating', async ({page}) => {
  let requests = 0, status = 'COMPLETED';
  await mock(page);
  await page.route('**/api/runs/long-report/view', r => {
    requests++;
    return r.fulfill({json:{...stress,status}});
  });
  await page.route('**/api/runs/long-report/rerun', r => {status='RUNNING'; return r.fulfill({json:{ok:true}});});
  await page.clock.install();
  await page.goto('/?page=solve&run=long-report&tab=report');
  await expect(page.locator('.report-section').first()).toBeVisible();
  await expect.poll(() => requests).toBe(2); // Initial load plus status transition.
  await page.clock.fastForward(12000);
  expect(requests).toBe(2);
  await page.getByRole('button',{name:'분석 현황',exact:true}).click();
  await page.getByLabel('보완 의견').fill('해결 원리를 다시 검토해 주세요.');
  await page.getByRole('button',{name:'의견 반영해 다시 검토'}).click();
  await expect.poll(() => requests).toBeGreaterThan(2);
  const restarted = requests;
  await page.clock.fastForward(4000);
  await expect.poll(() => requests).toBeGreaterThan(restarted);
});
