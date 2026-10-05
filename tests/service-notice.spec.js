import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await page.route('**/auth/session', route => route.fulfill({ json: { configured: true, user: null } }));
});

test('first entry shows an accessible notice; normal dismissal lasts through navigation', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: '시험 운영 안내' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('해당 Service는 논문 연구 및 실증을 위해 시험 운영 중인 서비스입니다.');
  await expect(dialog).toContainText('생성 답변에 대한 책임은 사용자에게 있습니다.');
  await expect(dialog.getByRole('link', { name: 'equipment0226@gmail.com' })).toHaveAttribute('href', 'mailto:equipment0226@gmail.com');
  await expect(page.getByRole('heading', { name: '시험 운영 안내' })).toBeFocused();
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'About us', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(dialog).toBeVisible();
});

test('hide today persists until the next Korean calendar day', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-05T14:59:00Z') });
  await page.goto('/');
  await page.getByRole('checkbox', { name: '오늘은 보지 않음' }).check();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('triz-service-notice-hidden-date'))).toBe('2026-10-05');
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.clock.setSystemTime(new Date('2026-10-05T15:01:00Z'));
  await page.reload();
  await expect(page.getByRole('dialog', { name: '시험 운영 안내' })).toBeVisible();
});

test('blocked local storage still permits reading and closing the notice on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {
    get() { throw new DOMException('Storage unavailable', 'SecurityError'); }
  }));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: '시험 운영 안내' });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  await page.screenshot({ path: 'test-results/service-notice-mobile.png' });
  await page.getByRole('checkbox', { name: '오늘은 보지 않음' }).check();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(dialog).toBeVisible();
  expect(errors).toEqual([]);
});

test('About us identifies the owner, repository and research use conditions', async ({ page }) => {
  await page.goto('/?page=about');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.locator('.about')).toContainText('소유자 : Dae-Seong Ray Yang');
  await expect(page.locator('.about').getByRole('link', { name: 'https://github.com/equipment0226/triz_backend' }))
    .toHaveAttribute('href', 'https://github.com/equipment0226/triz_backend');
  await expect(page.locator('.about')).toContainText('TRIZ + AI 접목 연구를 위해 논문 진행 중인 Theme으로, 참고 활용은 괜찮으나 무단 전재/복제/배포는 금지합니다.');
});
