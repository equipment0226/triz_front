import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

const frozen = JSON.parse(readFileSync(new URL('./fixtures/ax-full-report.json', import.meta.url), 'utf8'));
const detail = key => ({type:'details', title:'상세 분석 기록', html:
  `<div data-analysis-record="${key}"><h3>상세 내부 제목 ${key}</h3>` +
  Array.from({length:240}, (_, i) => `<p>보존된 상세 근거 ${key} ${i}</p>`).join('') +
  '<img src="x" onerror="window.reportDetailUnsafe=true"><script>window.reportDetailUnsafe=true</script></div>'});

async function mock(page, blocks) {
  const view = {...frozen, run_id:'folded-report', status:'COMPLETED', pending:null,
    report_sections:[{key:'ariz', title:'4. 해결책 도출 과정', blocks}]};
  await page.route('**/auth/session', r => r.fulfill({json:{configured:true, user:{id:'reader',name:'Reader'}}}));
  await page.route('**/api/notifications', r => r.fulfill({json:[]}));
  await page.route('**/api/**/view', r => r.fulfill({json:view}));
  await page.goto('/?page=cases&run=folded-report&tab=report');
}

for (const width of [1366, 390]) {
  test(`analysis records mount only when opened and unmount when closed at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});
    await mock(page, [{type:'html', html:'<h5>1.1 현재 분석 단계</h5><p>항상 보이는 요약표</p>'},
      detail('first'), {type:'html',html:'<h5>1.2 다음 분석 단계</h5>'}, detail('second')]);
    await expect(page.getByText('항상 보이는 요약표')).toBeVisible();
    await expect(page.locator('.report-details')).toHaveCount(2);
    await expect(page.locator('[data-analysis-record]')).toHaveCount(0);
    const first = page.locator('.report-details').nth(0);
    const second = page.locator('.report-details').nth(1);
    await expect(first.getByRole('button',{name:'펼치기',exact:true})).toHaveAttribute('aria-expanded','false');
    await first.getByRole('button',{name:'펼치기',exact:true}).click();
    await expect(first.getByRole('button',{name:'접기',exact:true})).toHaveAttribute('aria-expanded','true');
    await expect(page.locator('[data-analysis-record="first"] p')).toHaveCount(240);
    await expect(page.locator('[data-analysis-record="second"]')).toHaveCount(0);
    await expect(first.locator('script, [onerror]')).toHaveCount(0);
    expect(await page.evaluate(() => window.reportDetailUnsafe)).toBeUndefined();
    await second.getByRole('button',{name:'펼치기',exact:true}).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-analysis-record="second"]')).toHaveCount(1);
    await first.getByRole('button',{name:'접기',exact:true}).click();
    await expect(page.locator('[data-analysis-record="first"]')).toHaveCount(0);
    await expect(page.locator('[data-analysis-record="second"]')).toHaveCount(1);
    await page.getByRole('tab',{name:'해결안',exact:true}).click();
    await expect(page.locator('.report-process')).toHaveCount(0);
    await page.getByRole('tab',{name:'보고서',exact:true}).click();
    await expect(page.locator('[data-analysis-record]')).toHaveCount(0);
    await expect(page.getByRole('button',{name:'펼치기',exact:true})).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
  });
}

test('mobile pagination keeps every analysis disclosure reachable and closed', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await mock(page, Array.from({length:25}, (_, i) => detail(String(i))));
  const chooser = page.getByLabel('보고서 페이지',{exact:true});
  await expect(chooser).toBeVisible();
  const values = await chooser.locator('option').evaluateAll(options => options.map(o => o.value));
  let count = 0;
  for (const value of values) {
    await chooser.selectOption(value);
    await expect(page.locator('[data-analysis-record]')).toHaveCount(0);
    count += await page.locator('.report-details').count();
    expect(await page.locator('.report-process *').count()).toBeLessThan(110);
  }
  expect(count).toBe(25);
  await chooser.selectOption('0');
  await page.getByRole('button',{name:'펼치기',exact:true}).first().click();
  await expect(page.locator('[data-analysis-record="0"]')).toHaveCount(1);
  await chooser.selectOption('1');
  await expect(page.locator('[data-analysis-record]')).toHaveCount(0);
  await chooser.selectOption('0');
  await expect(page.locator('[data-analysis-record]')).toHaveCount(0);
});
