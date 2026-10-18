import { test, expect } from '@playwright/test';

const user = { id: 'withdrawal-user', name: '탈퇴 테스트', email: 'withdrawal@example.com' };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    localStorage.setItem('triz-service-notice-hidden-date', day);
  });
  await page.route('**/auth/session', route => route.fulfill({ json: { configured: true, user } }));
  await page.route('**/api/notifications', route => route.fulfill({ json: [] }));
});

async function confirm(page) {
  await page.getByRole('button', { name: '회원탈퇴 진행', exact: true }).click();
  await page.getByRole('checkbox', { name: '삭제되는 항목과 복구할 수 없음을 확인했습니다.' }).check();
  await page.getByLabel('확인 문구', { exact: true }).fill('회원탈퇴');
}

test('account management explains deletion and cancellation sends no request', async ({ page }) => {
  let deletions = 0;
  await page.route('**/api/auth/account', route => { deletions++; return route.fulfill({ json: { ok: true } }); });
  await page.goto('/');
  await page.getByRole('button', { name: '계정 관리', exact: true }).click();
  await expect(page).toHaveURL(/page=account/);
  await expect(page.getByRole('heading', { name: '계정 관리', exact: true })).toBeVisible();
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await expect(page.getByText(/내 TRIZ 분석 이력·보고서·첨부파일 및 공개한 분석 사례/)).toBeVisible();
  await confirm(page);
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(page.getByRole('button', { name: '회원탈퇴 진행', exact: true })).toBeFocused();
  await expect(page.getByLabel('확인 문구', { exact: true })).toHaveCount(0);
  expect(deletions).toBe(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: '내 계정', exact: true })).toBeVisible();
});

test('exact confirmation and acknowledgement are required; one request clears private state', async ({ page }) => {
  let deletions = 0, respond;
  const ready = new Promise(resolve => { respond = resolve; });
  await page.route('**/api/auth/account', async route => {
    deletions++;
    expect(route.request().method()).toBe('DELETE');
    expect(route.request().postDataJSON()).toEqual({ confirmation: '회원탈퇴' });
    await ready;
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto('/?page=account');
  await page.evaluate(() => {
    sessionStorage.setItem('triz-draft', '비공개 문제');
    sessionStorage.setItem('triz-submission', '{"fingerprint":"private"}');
    sessionStorage.setItem('triz-patent-login-return', 'private');
    localStorage.setItem('triz-notifications:withdrawal-user', '["private"]');
    localStorage.setItem('unrelated-app', 'keep');
  });
  await page.getByRole('button', { name: '회원탈퇴 진행', exact: true }).click();
  const submit = page.getByRole('button', { name: '영구 탈퇴', exact: true });
  await page.getByLabel('확인 문구', { exact: true }).fill('회원탈퇴');
  await expect(submit).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page.getByLabel('확인 문구', { exact: true }).fill('탈퇴');
  await expect(submit).toBeDisabled();
  await page.getByLabel('확인 문구', { exact: true }).fill('회원탈퇴');
  await page.locator('.withdrawal-form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
  await expect(page.getByRole('button', { name: '탈퇴 처리 중…' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '취소', exact: true })).toBeDisabled();
  expect(deletions).toBe(1);
  respond();
  await expect(page.getByRole('heading', { name: '회원탈퇴가 완료되었습니다' })).toBeVisible();
  await expect(page.getByRole('button', { name: '로그아웃', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => ({
    session: Object.keys(sessionStorage).filter(key => key.startsWith('triz-')),
    local: Object.keys(localStorage).filter(key => key.startsWith('triz-')),
    unrelated: localStorage.getItem('unrelated-app'),
  }))).toEqual({ session: [], local: [], unrelated: 'keep' });
  await page.getByRole('button', { name: 'Problem Solving', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Google 계정으로 시작하세요' })).toBeVisible();
  expect(deletions).toBe(1);
});

test('busy-work errors preserve the account and allow retry', async ({ page }) => {
  let deletions = 0;
  await page.route('**/api/auth/account', route => {
    deletions++;
    return deletions === 1 ? route.fulfill({ status: 409, json: { detail: '진행 중인 작업이 있습니다. 잠시 후 다시 시도해 주세요.' } }) : route.fulfill({ json: { ok: true } });
  });
  await page.goto('/?page=account');
  await page.evaluate(() => sessionStorage.setItem('triz-draft', '유지할 문제'));
  await confirm(page);
  await page.getByRole('button', { name: '영구 탈퇴', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('진행 중인 작업이 있습니다.');
  await expect(page.getByRole('button', { name: '로그아웃', exact: true })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('triz-draft'))).toBe('유지할 문제');
  await page.getByRole('button', { name: '영구 탈퇴', exact: true }).click();
  await expect(page.getByRole('heading', { name: '회원탈퇴가 완료되었습니다' })).toBeVisible();
  expect(deletions).toBe(2);
});

test('a session refresh started before deletion cannot restore the deleted user', async ({ page }) => {
  await page.route('**/api/auth/account', route => route.fulfill({ json: { ok: true } }));
  await page.goto('/?page=account');
  await expect(page.getByRole('heading', { name: '내 계정', exact: true })).toBeVisible();
  let respond;
  const ready = new Promise(resolve => { respond = resolve; });
  await page.route('**/auth/session', async route => {
    await ready;
    await route.fulfill({ json: { configured: true, user } });
  });
  const stale = page.waitForRequest('**/auth/session');
  await page.evaluate(() => window.dispatchEvent(new Event('triz-session-expired')));
  await stale;
  await confirm(page);
  await page.getByRole('button', { name: '영구 탈퇴', exact: true }).click();
  await expect(page.getByRole('heading', { name: '회원탈퇴가 완료되었습니다' })).toBeVisible();
  const staleResponse = page.waitForResponse('**/auth/session');
  respond();
  await staleResponse;
  await expect(page.getByRole('button', { name: '로그아웃', exact: true })).toHaveCount(0);
});

test('anonymous account links require explicit sign in', async ({ page }) => {
  await page.route('**/auth/session', route => route.fulfill({ json: { configured: true, user: null } }));
  await page.goto('/?page=account');
  await expect(page.getByText('계정을 관리하려면 로그인해 주세요.')).toBeVisible();
  await expect(page.getByRole('button', { name: '회원탈퇴 진행', exact: true })).toHaveCount(0);
});

test('account confirmation fits mobile and desktop screens', async ({ page }, testInfo) => {
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?page=account');
    await confirm(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.getByRole('button', { name: '영구 탈퇴', exact: true })).toBeEnabled();
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole('heading', { name: '계정 관리', exact: true })).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`account-${width}.png`), fullPage: true });
  }
});
