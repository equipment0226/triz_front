import {test, expect} from '@playwright/test';

test('private and sample solution cards keep the stored total without dimension charts', async ({page}) => {
  const comments = [
    {role:'현장 운영 검토자',comment:'책임자의 승인 범위를 먼저 확정하면 작은 팀부터 도입할 수 있습니다.'},
    {role:'비용 및 자원 관리 검토자',comment:'기존 인력으로 시범 운영하되 반복 업무가 늘어나는지 먼저 확인해야 합니다.'},
  ];
  const view = {run_id:'comments-run',title:'권한 위임 개선',query:'승인 지연',status:'COMPLETED',stage_index:1,
    stages:[{key:'done',label:'분석 완료',index:0}],industry:'비즈니스',system:'팀 운영',guide:'완료',
    constraints:[],reviewers:[],report_sections:[],report_ready:true,pending:null,figures:[],additions:[],
    solutions:[{key:'C1',title:'승인 범위 명시',summary:'작은 팀에서 검증',description:'권한과 책임을 함께 정합니다.',
      mechanism:'책임자 승인',effect:'승인 지연 감소',score:3.5,rank:1,verdict:'조건 확인 필요',
      dimensions:{TIME:3,COST:3,GOAL:4,RESOLUTION:4,CAUSAL:3,SAFETY:2,' safety ':1,'안전':1},reviewer_comments:comments,
      assumptions:[],transfer_conditions:[],validation:[],risks:[],evidence:[],reference_cards:[]}]};
  await page.route('**/auth/session',route=>route.fulfill({json:{configured:true,user:{id:'tester',name:'Tester'}}}));
  await page.route('**/api/notifications',route=>route.fulfill({json:[]}));
  await page.route('**/api/runs/comments-run/view',route=>route.fulfill({json:view}));
  await page.route('**/api/public/runs/comments-run/view',route=>route.fulfill({json:view}));
  for(const width of [320,390,1366]) {
    await page.setViewportSize({width,height:844});
    for (const path of ['/?page=solve&run=comments-run&tab=solutions', '/?page=cases&run=comments-run&tab=solutions']) {
    await page.goto(path);
    const card=page.locator('.solution-card');
    await expect(card).toBeVisible();
    await expect(card.locator('.score')).toHaveText('3.5 / 5');
    await expect(card.locator('.reviewer-comments')).toHaveCount(0);
    await expect(card.locator('meter')).toHaveCount(0);
    await expect(card.locator('.score-bars')).toHaveCount(0);
    for(const {role,comment} of comments) {
      await expect(card.getByText(role,{exact:true})).toHaveCount(0);
      await expect(card.getByText(comment,{exact:true})).toHaveCount(0);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    }
  }
});
