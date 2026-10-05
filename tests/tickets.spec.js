import { test, expect } from '@playwright/test';

const project = { run_id: 'ticket-run', title: '코팅 균일도 분석', status: 'INTERRUPTED',
  stage_index: 0, stages: [{ key: 's0_bootstrap', label: '문제 접수', index: 0 }],
  guide: '분석을 이어서 실행할 수 있습니다.', constraints: [], reviewers: [], solutions: [], report_ready: false };
const question = '유리 기판의 코팅 균일도를 개선합니다.';

async function setup(page, initialBalance) {
  const state = { balance: initialBalance };
  await page.route('**/auth/session', route => route.fulfill({ json: { configured: true,
    user: { id: 'tester', name: 'Tester', ticket_balance: state.balance } } }));
  await page.route('**/api/notifications', route => route.fulfill({ json: [] }));
  await page.route('**/api/runs/ticket-run/view', route => route.fulfill({ json: project }));
  return state;
}
async function fill(page, query = question) {
  await page.getByLabel('해결하고 싶은 문제').fill(query);
  await page.getByRole('checkbox', { name: /무료 베타에서 입력한 문제/ }).check();
}

test('new analysis updates the displayed balance and zero tickets block fresh submissions', async ({ page }) => {
  const state = await setup(page, 1);
  let requests = 0;
  await page.route('**/api/runs', route => {
    requests++;
    state.balance = 0;
    return route.fulfill({ status: 202, json: { run_id: project.run_id, ticket_balance: 0 } });
  });
  await page.goto('/?page=solve');
  await expect(page.locator('.ticket-balance')).toHaveText('Ticket 1개');
  await expect(page.locator('.ticket-notice')).toContainText('새 분석마다 Ticket 1개가 차감됩니다.');
  await fill(page);
  await page.getByRole('button', { name: 'AI와 문제 분석 시작' }).click();
  await expect(page).toHaveURL(/run=ticket-run/);
  await expect(page.locator('.ticket-balance')).toHaveText('Ticket 0개');
  await page.getByRole('button', { name: '새 문제 분석', exact: true }).click();
  await fill(page);
  await expect(page.getByRole('button', { name: 'AI와 문제 분석 시작' })).toBeDisabled();
  await expect(page.locator('.ticket-notice')).toContainText('사용 가능한 티켓이 없습니다.');
  expect(requests).toBe(1);
});

test('a server-side insufficient balance refreshes the account and disables submission', async ({ page }) => {
  const state = await setup(page, 1);
  await page.route('**/api/runs', route => {
    state.balance = 0;
    return route.fulfill({ status: 402, json: { detail: { code: 'insufficient_tickets',
      message: '사용 가능한 티켓이 없습니다. 새 분석에는 티켓 1개가 필요합니다.', ticket_balance: 0 } } });
  });
  await page.goto('/?page=solve');
  await fill(page);
  await page.getByRole('button', { name: 'AI와 문제 분석 시작' }).click();
  await expect(page.getByRole('alert')).toContainText('새 분석에는 티켓 1개가 필요합니다.');
  await expect(page.locator('.ticket-balance')).toHaveText('Ticket 0개');
  await expect(page.getByRole('button', { name: 'AI와 문제 분석 시작' })).toBeDisabled();
});

test('an uncertain submission can be recovered at zero after reload using its original key', async ({ page }) => {
  const state = await setup(page, 1);
  const keys = [];
  await page.route('**/api/runs', route => {
    keys.push(route.request().headers()['idempotency-key']);
    state.balance = 0;
    if (keys.length === 1) return route.abort('failed');
    return route.fulfill({ status: 202, json: { run_id: project.run_id, ticket_balance: 0, reused: true } });
  });
  await page.goto('/?page=solve');
  await fill(page);
  await page.getByRole('button', { name: 'AI와 문제 분석 시작' }).click();
  await expect(page.getByRole('alert')).toContainText('같은 요청으로 확인');
  await expect(page.locator('.ticket-balance')).toHaveText('Ticket 0개');
  await expect(page.getByRole('button', { name: 'AI와 문제 분석 시작' })).toBeEnabled();
  await page.getByLabel('해결하고 싶은 문제').fill('새로운 질문');
  await expect(page.getByRole('button', { name: 'AI와 문제 분석 시작' })).toBeDisabled();
  await page.reload();
  await fill(page);
  await expect(page.locator('.ticket-notice')).toContainText('같은 요청에는 티켓이 추가로 차감되지 않습니다.');
  await page.getByRole('button', { name: 'AI와 문제 분석 시작' }).click();
  await expect(page).toHaveURL(/run=ticket-run/);
  expect(keys).toHaveLength(2);
  expect(keys[1]).toBe(keys[0]);
});

test('zero balance permits continuing an existing analysis and remains visible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, 0);
  let continued = 0;
  await page.route('**/api/runs/ticket-run/continue', route => {
    continued++;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('/?page=solve&run=ticket-run');
  await expect(page.locator('.ticket-balance')).toBeVisible();
  await page.getByRole('button', { name: '이어서 실행' }).click();
  await expect.poll(() => continued).toBe(1);
  await expect(page.locator('.ticket-balance')).toHaveText('Ticket 0개');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('a busy request preserves its key and can be retried after the ticket is debited', async ({ page }) => {
  const state = await setup(page, 1);
  const keys = [];
  await page.route('**/api/runs', route => {
    keys.push(route.request().headers()['idempotency-key']);
    state.balance = 0;
    if (keys.length === 1) return route.fulfill({ status: 409, json: { detail: 'Run is busy' } });
    return route.fulfill({ status: 202, json: { run_id: project.run_id, ticket_balance: 0, reused: true } });
  });
  await page.goto('/?page=solve');
  await fill(page);
  await page.getByRole('button', { name: 'AI와 문제 분석 시작' }).click();
  await expect(page.getByRole('alert')).toContainText('Run is busy');
  await expect(page.locator('.ticket-balance')).toHaveText('Ticket 0개');
  await expect(page.getByRole('button', { name: 'AI와 문제 분석 시작' })).toBeEnabled();
  await page.getByRole('button', { name: 'AI와 문제 분석 시작' }).click();
  await expect(page).toHaveURL(/run=ticket-run/);
  expect(keys).toHaveLength(2);
  expect(keys[1]).toBe(keys[0]);
});
