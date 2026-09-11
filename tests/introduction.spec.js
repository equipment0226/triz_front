import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const knowledge=JSON.parse(readFileSync(new URL('../src/data/knowledge.json',import.meta.url),'utf8'));

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/session', route => route.fulfill({json:{configured:false,user:null}}));
  await page.emulateMedia({reducedMotion:'reduce'});
});

test('introduction defaults to Tool, restores tab URLs and supports keyboard navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Introduction',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Tool 소개',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.chapter-detail')).toHaveCount(4);
  await expect(page.locator('.guide-hero')).toContainText('문제점을 설명하고');
  await expect(page.getByRole('heading',{name:'네 번의 단계, 열 번의 스텝.'})).toBeVisible();
  const collaboration=page.locator('.human-ai-image img');
  await expect.poll(() => collaboration.evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
  await expect(page.locator('.guide-hero .guide-visual')).toHaveCount(0);
  await page.getByRole('tab',{name:'TRIZ란?',exact:true}).click();
  await expect(page).toHaveURL(/topic=triz/);
  const prose = (await page.locator('.triz-prose').innerText()).replace(/\n/g,'');
  expect(prose.length).toBeGreaterThanOrEqual(500);
  expect(prose.length).toBeLessThanOrEqual(1000);
  const portrait=page.getByRole('img',{name:/알츠슐러의 초상 사진/});
  await expect(portrait).toBeVisible();
  await expect.poll(() => portrait.evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
  await page.reload();
  await expect(page.getByRole('tab',{name:'TRIZ란?',exact:true})).toHaveAttribute('aria-selected','true');
  await page.getByRole('tab',{name:'TRIZ란?',exact:true}).press('ArrowRight');
  await expect(page.getByRole('tab',{name:'Tool 소개',exact:true})).toBeFocused();
  await page.goBack();
  await expect(page.locator('.triz-prose')).toBeVisible();
  await page.getByRole('button',{name:'Main',exact:true}).click();
  await page.getByRole('button',{name:'Introduction',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Tool 소개',exact:true})).toHaveAttribute('aria-selected','true');
});

test('every chapter presents techniques, diagrams and service template examples', async ({ page }) => {
  for(const chapter of ['01','02','03','04']) {
    await page.goto(`/?page=tool&chapter=${chapter}`);
    const cards=page.locator('.technique-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(1);
    await expect(page.getByRole('button',{name:/템플릿/})).toHaveCount(0);
    await expect(page.locator('.template-source')).toHaveCount(0);
    await expect(page.locator('.technique-list')).not.toContainText('레포트 1.1');
    await expect(page.locator('.technique-list')).not.toContainText('학습용 템플릿으로 요약');
    for(const card of await cards.all()) {
      await expect(card.locator('svg.guide-visual')).toHaveCount(1);
      await expect(card.locator('table')).toHaveCount(1);
      await expect(card.locator('tbody tr')).not.toHaveCount(0);
      await expect(card.locator('.technique-flow li')).toHaveCount(3);
    }
  }
  await page.goto('/?page=tool&chapter=02');
  await expect(page.locator('.chapter-hero h1')).toHaveText('문제를 구조화합니다');
  await page.getByRole('link',{name:/76 표준해 자료 보기/}).click();
  await expect(page).toHaveURL(/chapter=02&material=standards/);
  await page.goBack();
  await expect(page.locator('#technique-nine-windows')).toBeAttached();
  await page.goto('/?page=tool&chapter=03');
  await expect(page.locator('#technique-technical svg.guide-visual')).toContainText('특성 A · 경량성');
  await expect(page.locator('#technique-technical svg.guide-visual')).toContainText('특성 B · 강도');
  await expect(page.locator('#technique-physical svg.guide-visual')).toContainText('동일한 특성 · 벽의 두께');
  await expect(page.locator('#technique-physical svg.guide-visual')).toContainText('얇아야 한다');
  await expect(page.locator('#technique-physical svg.guide-visual')).toContainText('두꺼워야 한다');
});

test('standards explorer exposes all 76 solutions through classes and subgroups', async ({ page }) => {
  await page.goto('/?page=tool&material=standards');
  await expect(page.locator('.standard-class-toggle')).toHaveCount(5);
  await expect(page.locator('.library-entry')).toHaveCount(0);
  await expect(page.locator('.standard-leaf')).toHaveCount(0);
  for(const branch of await page.locator('.standard-class-toggle').all()) await branch.click();
  for(const group of await page.locator('.standard-group-toggle').all()) await group.click();
  await expect(page.locator('.standard-leaf')).toHaveCount(76);
  await page.getByLabel('자료 분류').selectOption('2');
  await expect(page.locator('.standard-leaf')).toHaveCount(23);
  await page.getByLabel('자료 검색').fill('2.4.12');
  await expect(page.locator('.standard-leaf')).toHaveCount(1);
  await page.locator('.standard-leaf').click();
  await expect(page).toHaveURL(/standard=2.4.12/);
  await expect(page.locator('.standard-reading')).toContainText('전기유변');
  await expect(page.locator('.standard-reference')).toContainText('MATRIZ');
  await page.reload();
  await expect(page.locator('.standard-reading')).toContainText('전기유변');
  await page.getByLabel('자료 검색').fill('없는자료123');
  await expect(page.getByRole('heading',{name:'일치하는 자료가 없습니다.'})).toBeVisible();
  await page.getByRole('button',{name:'검색 초기화'}).click();
  await expect(page.locator('.standard-class-toggle')).toHaveCount(5);
});

test('matrix and separation links reveal the selected principle at the right scroll position', async ({ page }) => {
  const checkTarget=async id=>{
    const target=page.locator(`#material-principles-${id}`);
    await expect(target).toHaveAttribute('open','');
    await expect.poll(()=>target.evaluate(el=>Math.round(el.getBoundingClientRect().top))).toBeGreaterThanOrEqual(0);
    await expect.poll(()=>target.evaluate(el=>Math.round(el.getBoundingClientRect().top))).toBeLessThan(180);
    await expect(target.locator('summary')).toBeFocused();
  };
  await page.goto('/?page=tool');
  await expect(page.locator('a.material-cover[href="?page=tool&material=matrix"] .material-cover-name > span')).toHaveText('39');
  await page.goto('/?page=tool&material=principles');
  await expect(page.locator('.library-entry')).toHaveCount(40);
  await page.goto('/?page=tool&material=matrix');
  await page.locator('.library-entry summary').first().click();
  await expect(page.locator('.library-entries')).not.toContainText('적용 메모');
  await expect(page.locator('.matrix-explorer')).not.toContainText('Contradiction_Matrix');
  await page.getByLabel('개선 파라미터',{exact:true}).selectOption('1');
  await page.getByLabel('악화 파라미터',{exact:true}).selectOption('3');
  await expect(page.locator('.matrix-principles article')).toHaveCount(4);
  await expect(page.locator('.matrix-principles')).toContainText('동적성');
  await page.locator('.principle-links a').filter({hasText:'#15 '}).click();
  await expect(page).toHaveURL(/material=principles&principle=15/);
  await checkTarget('15');
  await page.reload();
  await checkTarget('15');
  await page.goBack();
  await page.getByLabel('악화 파라미터',{exact:true}).selectOption('1');
  await expect(page.locator('.matrix-result')).toContainText('같은 파라미터');
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/?page=tool&chapter=03&material=separation');
    await page.locator('.library-entry summary').first().click();
    const link=page.locator('.library-entry').first().locator('.principle-links a').last();
    const id=new URL(await link.getAttribute('href'),'http://localhost').searchParams.get('principle');
    await link.click();
    await expect(page).toHaveURL(new RegExp(`chapter=03&material=principles&principle=${id}$`));
    await checkTarget(id);
  }
});

test('mobile details return to the top and the final chapter has no next chapter', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  for(const chapter of ['01','02','03','04']) {
    await page.goto(`/?page=tool&chapter=${chapter}`);
    await expect(page.locator('.technique-card').first()).toBeVisible();
    await expect(page.locator('.guide-next')).toHaveCount(chapter==='04'?0:1);
    await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
    await page.getByRole('button',{name:'맨 위로 이동'}).click();
    await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
  }
  await page.goto('/?page=tool&material=standards');
  await page.locator('.standard-class-toggle').first().click();
  await page.locator('.standard-group-toggle').first().click();
  await page.locator('.standard-leaf').first().click();
  await expect(page.locator('.standard-reading')).toBeVisible();
  await expect(page.locator('.standards-tree')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.getByRole('button',{name:'탐색기로 돌아가기'}).click();
  await expect(page.locator('.standards-tree')).toBeVisible();
  await page.screenshot({path:'test-results/standards-mobile.png',fullPage:true});
});

test('guide pages stay readable on mobile and every material route opens', async ({ page }) => {
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  for(const width of [360,768,1440]) {
    await page.setViewportSize({width,height:1000});
    for(const query of ['','&topic=triz','&chapter=03','&material=effects','&material=matrix']) {
      await page.goto(`/?page=tool${query}`);
      await expect(page.locator('.guide-page h1')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    }
  }
  for(const material of ['separation','trends','ariz','business']) {
    await page.goto(`/?page=tool&material=${material}`);
    await page.locator('.library-entry summary').first().click();
    await expect(page.locator('.entry-body').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
  await page.goto('/?page=tool');
  await expect(page.locator('.guide-hero h1')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path:'test-results/introduction-desktop.png',fullPage:true});
  await page.goto('/?page=tool&topic=triz');
  await expect(page.locator('.triz-prose')).toBeVisible();
  await page.screenshot({path:'test-results/triz-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?page=tool&chapter=03');
  await expect(page.locator('.technique-card').first()).toBeVisible();
  await page.screenshot({path:'test-results/introduction-mobile.png',fullPage:true});
});

test('effects explorer exposes the whole catalogue and keeps search and direct links coherent', async ({ page }) => {
  await page.goto('/?page=tool&chapter=03&material=effects');
  await expect(page.locator('.effect-function-toggle')).toHaveCount(19);
  await expect(page.locator('.effect-leaf')).toHaveCount(0);
  await expect(page.locator('.library-entry,.library-more')).toHaveCount(0);
  for(const branch of await page.locator('.effect-function-toggle').all()) await branch.click();
  await expect(page.locator('.effect-leaf')).toHaveCount(200);
  await page.getByLabel('자료 검색').fill('ESC');
  await expect(page.locator('.effect-leaf')).toHaveCount(1);
  await page.locator('.effect-leaf').click();
  await expect(page).toHaveURL(/chapter=03&material=effects&effect=1.4/);
  await expect(page.locator('.effect-reading h2')).toContainText('ESC');
  await page.reload();
  await expect(page.locator('.effect-leaf.selected')).toContainText('ESC');
  await expect(page.locator('.effect-reading h2')).toContainText('ESC');
  await page.locator('.effect-paging a').last().click();
  await expect(page).toHaveURL(/effect=1.5/);
  await page.goBack();
  await expect(page.locator('.effect-reading h2')).toContainText('ESC');
  await page.screenshot({path:'test-results/effects-explorer-desktop.png',fullPage:true});
  await page.getByLabel('자료 분류').selectOption('BIOLOGICAL');
  await expect(page.locator('.effect-reading h2')).not.toContainText('ESC');
  await page.locator('.effect-leaf').first().click();
  await expect(page.locator('.effect-reading-heading')).toContainText('생물');
  await page.getByLabel('자료 검색').fill('zzzz-no-effect');
  await expect(page.locator('.effect-leaf')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'일치하는 자료가 없습니다.'})).toBeVisible();
  await page.getByRole('button',{name:'검색 초기화'}).click();
  await expect(page.locator('.effect-function-toggle')).toHaveCount(19);
});

test('effects explorer mobile opens a readable detail and returns to its selected leaf', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?page=tool&material=effects&effect=1.4');
  await expect(page.locator('.effect-reading h2')).toContainText('ESC');
  await expect(page.locator('.effects-tree')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await expect(page.locator('.effect-reading tr')).toHaveCount(4);
  await page.screenshot({path:'test-results/effects-explorer-mobile.png',fullPage:true});
  await page.locator('.effect-reading .standard-mobile-back').click();
  await expect(page.locator('.effects-tree')).toBeVisible();
  await page.locator('.effect-leaf.selected').click();
  await expect(page.locator('.effects-tree')).toBeHidden();
  await expect(page.locator('.effect-reading')).toBeVisible();
  await page.reload();
  await expect(page.locator('.effect-reading h2')).toContainText('ESC');
  await page.goBack();
});

test('reference refinements keep effects concise and distinguish ARIZ choices', async ({ page }) => {
  await page.goto('/?page=tool');
  await expect(page.locator('.human-label')).toContainText('질문, 검토');
  await expect(page.locator('.ai-label')).toContainText('구조화, 분석, 아이디어 도출');
  await page.goto('/?page=tool&material=effects');
  await page.getByLabel('자료 검색').fill('ESC');
  await expect(page.locator('.effect-leaf')).toHaveCount(1);
  await page.locator('.effect-leaf').click();
  await expect(page.locator('.effect-reading tr th')).toHaveText(['자료 식별자','요구 기능','작동 원리','필요 조건']);
  await expect(page.locator('.effect-reading')).toContainText('1.4');
  await expect(page.locator('.effect-reading')).toContainText('밀착·고정');
  await expect(page.locator('.effect-transformation,.effect-variants')).toHaveCount(0);
  await page.goto('/?page=tool&material=trends');
  await expect(page.locator('.library-hero svg circle')).toHaveCount(0);
  await expect(page.locator('.library-hero .curve-next')).toHaveAttribute('stroke-dasharray','7 6');
  for(const summary of await page.locator('.library-entry summary').all()) await summary.click();
  await expect(page.locator('.library-entries svg.guide-visual')).toHaveCount(1);
  await expect(page.locator('#material-trends-TR-12 svg.guide-visual')).toHaveCount(1);
  await page.screenshot({path:'test-results/trends-desktop.png',fullPage:true});
  await page.goto('/?page=tool&material=ariz');
  for(const summary of await page.locator('.library-entry summary').all()) await summary.click();
  const required=page.locator('.ariz-required').first(),optional=page.locator('.ariz-optional').first();
  await expect(required).toHaveText('필수');
  await expect(optional).toHaveText('선택');
  expect(await required.evaluate(e=>getComputedStyle(e).backgroundColor)).not.toBe(await optional.evaluate(e=>getComputedStyle(e).backgroundColor));
  await page.goto('/?page=tool&material=business');
  await expect(page.locator('.library-context')).toHaveText('비즈니스 Triz 전용 파라미터입니다. 공학용 모순행렬과 별도 체계의 분석을 적용합니다.');
  await expect(page.locator('.business-hero-photo')).toHaveCount(0);
  await expect(page.getByRole('img',{name:'서류가방과 문서로 표현한 비즈니스 문제 분석'})).toBeVisible();
  await page.screenshot({path:'test-results/business-desktop.png',fullPage:true});
  await page.goto('/');
  await expect.poll(()=>page.locator('.hero-research-photo').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await expect(page.locator('.hero-art')).toContainText('다양한 산업/직군의 문제점');
  await expect(page.locator('.core-shape,.orbit')).toHaveCount(0);
  await page.screenshot({path:'test-results/home-photo-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'test-results/home-photo-mobile.png',fullPage:true});
});

test('introduction cards respond to hover and respect reduced motion', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/?page=tool');
  const card=page.locator('.material-cover').first();
  await card.hover();
  await expect.poll(()=>card.evaluate(e=>getComputedStyle(e).transform)).not.toBe('none');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(card).toHaveCSS('transform','none');
  await page.goto('/?page=tool&material=principles');
  await page.locator('.library-entry summary').first().click();
  await expect(page.locator('.entry-body').first()).toHaveCSS('animation-name','none');
});

test('all standard detail URLs load their own reference drawing',async({page})=>{
  test.setTimeout(90000);
  const sources=new Set();
  for(const standard of knowledge.standards_76.standards) {
    await page.goto(`/?page=tool&material=standards&standard=${standard.code}`);
    const image=page.locator('.standard-specific-diagram img');
    await expect(image).toHaveAttribute('src',`/diagrams/standards/${standard.code}.svg`);
    await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    sources.add(await image.getAttribute('src'));
  }
  expect(sources.size).toBe(76);
  await page.goto('/?page=tool&material=standards&standard=5.4.2');
  await page.locator('.standard-specific-diagram img').scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/standard-critical-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await expect(page.locator('.standard-specific-diagram img')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:'test-results/standard-critical-mobile.png',fullPage:true});
});

test('separation highlights just the selected axis and ARIZ draws its actual steps',async({page})=>{
  await page.goto('/?page=tool&material=separation');
  for(const entry of await page.locator('.library-entry').all()) {
    await entry.locator('summary').click();
    const id=(await entry.getAttribute('id')).replace('material-separation-','');
    await expect(entry.locator('[data-active=true]')).toHaveAttribute('data-separation',id);
    await expect(entry.locator('[data-active=true] rect')).toHaveAttribute('fill','#e4eccf');
    for(const rect of await entry.locator('[data-active=false] rect').all()) await expect(rect).toHaveAttribute('fill','#fff');
  }
  await page.goto('/?page=tool&material=ariz');
  for(const part of knowledge.ariz_85c.parts) {
    const entry=page.locator(`#material-ariz-${part.id}`);
    await entry.locator('summary').click();
    await expect(entry.locator('.ariz-diagram-steps li')).toHaveCount(part.steps.length);
    await expect(entry.locator('.ariz-step-top>span')).toHaveText(part.steps.map(step=>step.code));
    await expect(entry.locator('.entry-body>svg.guide-visual')).toHaveCount(0);
    await expect(entry.locator('.ariz-diagram-steps strong')).toHaveText(part.steps.map(step=>step.title));
  }
  await expect(page.locator('.library-hero>svg.guide-visual')).toHaveCount(1);
  await page.locator('#material-ariz-5 .ariz-part-diagram').screenshot({path:'test-results/ariz-knowledge-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.locator('#material-ariz-5 .ariz-part-diagram').scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.locator('#material-ariz-5 .ariz-part-diagram').screenshot({path:'test-results/ariz-knowledge-mobile.png'});
});
