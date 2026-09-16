import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const view = JSON.parse(readFileSync(new URL('./fixtures/ax-full-report.json', import.meta.url), 'utf8'));

for (const width of [1366, 390]) {
  test(`full frozen report and seven solutions survive reload at ${width}px`, async ({ page }) => {
    test.setTimeout(60000); // Two full report loads, including cold module compilation and SVG layout.
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/auth/session', r => r.fulfill({ json: { configured: true, user: { name: 'Fixture' } } }));
    await page.route('**/api/notifications', r => r.fulfill({ json: [] }));
    await page.route('**/api/public/runs**', r => r.fulfill({ json: { items: [], total: 0, page: 1, page_size: 20 } }));
    await page.route('**/api/runs?*', r => r.fulfill({ json: { items: [view], total: 1, page: 1, page_size: 20 } }));
    await page.route('**/api/runs', r => r.fulfill({ json: [view] }));
    await page.route(`**/api/runs/${view.run_id}/view`, r => r.fulfill({ json: view }));
    await page.route(`**/api/runs/${view.run_id}/steps`, r => r.fulfill({ json: [] }));
    await page.route(`**/api/runs/${view.run_id}/events`, r => r.fulfill({ body: '', contentType: 'text/event-stream' }));
    await page.goto(`/?page=solve&run=${view.run_id}`);
    await page.getByRole('button', { name: '해결안', exact: true }).click();
    await expect(page.locator('.solution-card')).toHaveCount(7);
    await page.getByRole('button', { name: '보고서', exact: true }).click();
    for (const title of ['1. 문제 정의', '2. 시스템 분석', '3. 문제 정의 (TRIZ)', '4. 해결책 도출 과정']) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }
    await expect(page.locator('svg[data-guide-kind]')).not.toHaveCount(0);
    await expect(page.getByText(/^자동 조율:/)).toHaveCount(0);
    await page.reload();
    await page.getByRole('button', { name: '보고서', exact: true }).click();
    await expect(page.getByRole('heading', { name: '부록 C. 추론 이력 (Step Trace)', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
  });
}
