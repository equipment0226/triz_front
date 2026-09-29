import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const published = read('../src/data/knowledge.json');
const standards = read('../../pilot/triz/knowledge/standards_76.json');
const separation = read('../../pilot/triz/knowledge/separation.json');

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/session', route => route.fulfill({json:{configured:false,user:null}}));
  await page.emulateMedia({reducedMotion:'reduce'});
});

test('published reference contains the complete canonical text and all supplemental diagrams', async ({ request }) => {
  test.setTimeout(60000);
  expect(published.standards_76).toEqual(standards);
  expect(published.separation).toEqual(separation);
  expect(standards.standards).toHaveLength(76);
  let substandards=0, variants=0, sequences=0;
  for (const standard of standards.standards) {
    const keys = [
      ...(standard.substandards || []).map(entry => {substandards++; return `sub-${entry.code}`;}),
      ...(standard.variants || []).map((_, index) => {variants++; return `variant-${index+1}`;}),
      ...(standard.development_sequence?.length ? ['sequence'] : []),
    ];
    if (standard.development_sequence?.length) sequences++;
    for (const key of ['', ...keys]) {
      const response = await request.get(`/diagrams/standards/${standard.code}${key ? `--${key}` : ''}.svg`);
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toContain('image/svg+xml');
      expect(await response.text()).toContain('<svg');
    }
  }
  expect(substandards).toBe(11);
  expect(variants).toBe(76);
  expect(sequences).toBe(13);
});

test('official submethods expose exact transformations, conditions, sources and drawings', async ({ page }) => {
  for (const code of ['1.1.8','5.1.1']) {
    const standard=standards.standards.find(row=>row.code===code);
    await page.goto(`/?page=tool&material=standards&standard=${code}`);
    const section=page.getByRole('region',{name:'공식 하위 방법',exact:true});
    await expect(section.locator('details')).toHaveCount(standard.substandards.length);
    for (const child of standard.substandards) {
      const detail=section.locator(`[data-standard-detail="${child.code}"]`);
      await detail.locator('summary').click();
      await expect(detail).toContainText(child.transformation);
      await expect(detail).toContainText(child.conditions);
      await expect(detail.locator('.standard-reference a')).toHaveCount(child.sources.length);
      const image=detail.locator('img');
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute('src',`/diagrams/standards/${code}--sub-${child.code}.svg`);
      await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    }
    await page.locator('.standard-source-review>summary').click();
    await expect(page.locator('.standard-source-review')).toContainText(standard.source_review.summary);
    await expect(page.locator('.standard-source-review')).toContainText(standard.source_review.cross_check);
    await expect(page.locator('.standard-source-review')).toContainText(standard.source_review.diagram_review);
    await expect(page.locator('.standard-source-review')).toContainText(standard.notes);
    await expect(page.locator('.standard-source-review')).toContainText(standards.version);
  }
});

test('variants and development sequences remain distinct and searchable', async ({ page }) => {
  const variantParent=standards.standards.find(row=>row.code==='3.1.1');
  await page.goto('/?page=tool&material=standards');
  await page.getByLabel('자료 검색').fill(variantParent.variants[0].title_ko);
  const leaf=page.locator('.standard-leaf').filter({hasText:variantParent.title_ko});
  await expect(leaf).toBeVisible();
  await leaf.click();
  const variants=page.getByRole('region',{name:'분기와 대안',exact:true});
  await expect(variants).toContainText('공식 표준해 번호가 아닙니다');
  await expect(variants.locator('details')).toHaveCount(variantParent.variants.length);
  for (const [index, entry] of variantParent.variants.entries()) {
    const detail=variants.locator('details').nth(index);
    await detail.locator('summary').click();
    await expect(detail).toContainText(entry.transformation);
    await expect(detail).toContainText(entry.conditions);
    await expect(detail.locator('img')).toHaveAttribute('src',`/diagrams/standards/3.1.1--variant-${index+1}.svg`);
  }
  await page.goto('/?page=tool&material=standards&standard=2.4.2');
  const sequence=standards.standards.find(row=>row.code==='2.4.2').development_sequence;
  await expect(page.locator('.standard-development p')).toHaveText(sequence);
  await expect(page.getByRole('region',{name:'발전·적용 순서',exact:true}).locator('img')).toHaveAttribute('src','/diagrams/standards/2.4.2--sequence.svg');
});

test('seven approaches distinguish five separations, two complements and unrestricted bypass', async ({ page }) => {
  await page.goto('/?page=tool&chapter=03');
  await expect(page.locator('#technique-separation')).toContainText('5가지 분리원리 + 2가지 보완 접근');
  await expect(page.locator('#technique-separation img')).toHaveAttribute('src','/knowledge/separation/overview.svg');
  await page.goto('/?page=tool&material=separation');
  await expect(page.locator('.library-entry')).toHaveCount(7);
  for (const [kind, approach] of Object.entries(separation)) {
    const entry=page.locator(`#material-separation-${kind}`);
    await entry.locator(':scope > summary').click();
    await expect(entry.locator('.entry-tags')).toContainText(approach.family==='SEPARATE'?'분리원리':'보완 접근');
    await expect(entry).toContainText(approach.description);
    await expect(entry).toContainText(approach.question);
    await expect(entry).toContainText(approach.catalog_version);
    await expect(entry.locator('.entry-sources a')).toHaveAttribute('href',approach.source_url);
    await expect(entry.locator('.separation-recommendations .principle-links a')).toHaveCount(approach.principles.length);
    const image=entry.locator('img[data-separation]');
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute('src',`/knowledge/separation/${kind.toLowerCase()}.svg`);
    await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  }
  const bypass=page.locator('#material-separation-BYPASS');
  await expect(bypass).toContainText('공식 권장 목록은 비어 있습니다');
  await bypass.locator('.separation-all-principles>summary').click();
  await expect(bypass.locator('.separation-all-principles .principle-links a')).toHaveCount(40);
  await expect(page.locator('#material-separation-CONDITION')).toContainText('온도·하중의 임계값 변화만으로 관계 분리라고 판정하지 않는다');
  await bypass.locator('.separation-reference-diagram').screenshot({path:'test-results/separation-bypass-reference.png'});
  await page.locator('.library-hero').screenshot({path:'test-results/separation-overview-reference.png'});
});

test('expanded reference remains readable without page overflow on a narrow screen', async ({ page }) => {
  await page.setViewportSize({width:360,height:800});
  await page.goto('/?page=tool&material=standards&standard=5.1.1');
  await page.locator('.standard-alternative>summary').last().click();
  await page.locator('.standard-source-review>summary').click();
  await expect(page.locator('.standard-alternative').last()).toContainText('물리적 상태(고체·액체·기체 등)');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.goto('/?page=tool&material=separation');
  await page.locator('#material-separation-BYPASS>summary').click();
  await page.locator('.separation-all-principles>summary').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
