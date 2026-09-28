import { test, expect } from '@playwright/test';

const project = {run_id:'run-submission', title:'코팅 균일도 분석', status:'INTERRUPTED',
  stage_index:0, stages:[{key:'s0_bootstrap',label:'문제 접수',index:0}],
  guide:'분석 실행 요청을 전달하지 못했습니다. 다시 시도해 주세요.',
  constraints:[],reviewers:[],solutions:[],report_ready:false};

test.beforeEach(async ({page}) => {
  await page.route('**/auth/session', r => r.fulfill({json:{configured:true,user:{id:'tester',name:'Tester'}}}));
  await page.route('**/api/notifications', r => r.fulfill({json:[]}));
  await page.route('**/api/runs/run-submission/view', r => r.fulfill({json:project}));
});

async function fill(page) {
  await page.getByLabel('해결하고 싶은 문제').fill('유리 기판의 코팅 균일도를 개선합니다.');
  await page.getByRole('checkbox',{name:/무료 베타에서 입력한 문제/}).check();
}

test('one submit shows progress and opens the saved project even when dispatch failed', async ({page}) => {
  let requests = 0;
  let respond;
  const ready = new Promise(resolve => { respond = resolve; });
  await page.route('**/api/runs', async r => {
    requests++;
    expect(r.request().headers()['idempotency-key']).toBeTruthy();
    await ready;
    await r.fulfill({status:202,json:{run_id:project.run_id}});
  });
  await page.goto('/?page=solve');
  await fill(page);
  await page.locator('form.input-panel').evaluate(form => {form.requestSubmit();form.requestSubmit();});
  await expect(page.getByRole('heading',{name:'문제 해결을 준비하고 있어요'})).toBeVisible();
  await expect.poll(() => requests).toBe(1);
  respond();
  await expect(page).toHaveURL(/run=run-submission/);
  await expect(page.getByRole('heading',{name:project.title})).toBeVisible();
  await expect(page.getByRole('button',{name:'이어서 실행'})).toBeVisible();
  await expect(page.locator('.input-panel')).toHaveCount(0);
});

test('lost response and reload retry with the same key, explicit new problem gets a new key', async ({page}) => {
  const keys = [];
  await page.route('**/api/runs', async r => {
    keys.push(r.request().headers()['idempotency-key']);
    if (keys.length === 1) return r.abort('failed');
    return r.fulfill({status:202,json:{run_id:project.run_id,reused:keys.length===2}});
  });
  await page.goto('/?page=solve');
  await fill(page);
  await page.getByRole('button',{name:'AI와 문제 분석 시작'}).click();
  await expect(page.getByRole('alert')).toContainText('같은 요청으로 확인');
  await page.reload();
  await fill(page);
  await page.getByRole('button',{name:'AI와 문제 분석 시작'}).click();
  await expect(page).toHaveURL(/run=run-submission/);
  expect(keys[1]).toBe(keys[0]);
  await page.getByRole('button',{name:'새 문제 분석',exact:true}).click();
  await fill(page);
  await page.getByRole('button',{name:'AI와 문제 분석 시작'}).click();
  await expect(page).toHaveURL(/run=run-submission/);
  expect(keys[2]).not.toBe(keys[0]);
});
