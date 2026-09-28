import { test, expect } from '@playwright/test';

test('interrupted AX project requires consent before recovery and resume', async ({ page }) => {
  const runId = 'battery-recovery';
  const project = { run_id: runId, title: '무가압 전고체 배터리', query: '계면 밀착과 강성-유연성 상충',
    status: 'INTERRUPTED', stage_index: 6,
    stages: Array.from({ length: 12 }, (_, index) => ({ key: `stage-${index}`, label: `${index + 1}. 분석 단계`, index })),
    guide: '사용량 미확인으로 중단되었습니다.', constraints: [], reviewers: [], solutions: [],
    report_sections: [], report_ready: false, pending: null, ax: { gates: {} } };
  const writes = [];
  await page.route('**/auth/session', route => route.fulfill({ json: { configured: true, user: { id: 'owner', name: 'Tester' } } }));
  await page.route('**/api/notifications', route => route.fulfill({ json: [] }));
  await page.route(`**/api/runs/${runId}/view`, route => route.fulfill({ json: project }));
  await page.route(`**/api/runs/${runId}/ax/usage-recovery`, route => {
    if (route.request().method() === 'POST') {
      writes.push({ kind: 'authorize', body: route.request().postDataJSON() });
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: { expected_epoch: 4, items: [{ task_id: 'lost-h', can_authorize: true,
      retained_reserve_microusd: 133379, retry_reserve_limit_microusd: 133379 }] } });
  });
  await page.route(`**/api/runs/${runId}/continue`, route => {
    writes.push({ kind: 'continue' });
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto(`/?page=solve&run=${runId}`);
  const resume = page.getByRole('button', { name: '이어서 실행', exact: true });
  await expect(resume).toBeVisible();
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('$0.133379');
    await dialog.dismiss();
  });
  await resume.click();
  await expect(resume).toBeEnabled();
  expect(writes).toEqual([]);
  page.once('dialog', dialog => dialog.accept());
  await resume.click();
  await expect.poll(() => writes.length).toBe(2);
  expect(writes).toEqual([{ kind: 'authorize', body: { task_id: 'lost-h', expected_epoch: 4,
    acknowledge_possible_duplicate_charge: true } }, { kind: 'continue' }]);
});
