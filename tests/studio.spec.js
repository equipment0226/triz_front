import { test, expect } from "@playwright/test";
const stages = [
  { key: "s0_bootstrap", label: "실행 계획", index: 0 },
  { key: "s0_research", label: "산업·기술 심층 검토", index: 1 },
];
const run = {
  run_id: "run-test",
  title: "반도체 세정 성능과 패턴 손상",
  industry: "반도체",
  system: "웨이퍼 세정",
  query: "패턴 손상",
  status: "WAITING_HUMAN",
  stage_index: 1,
  stages,
  guide: "패턴의 치수를 함께 확인할게요.",
  problem: "세정 성능과 패턴 손상",
  constraints: ["패턴 손상 최소화"],
  reviewers: [],
  solutions: [],
  figures: [],
  report_ready: false,
  summary: "",
  additions: [],
  evidence_gaps: [],
  search_status: {},
  pending: {
    interrupt_id: "internal-test-id",
    kind: "CLARIFY",
    title: "분석 조건을 알려 주세요",
    payload: {
      questions: [
        {
          question: "패턴 치수는 얼마인가요?",
          why_needed: "스케일별 작용 검토",
        },
      ],
    },
  },
};

test('both report screens keep centered tables, semantic colors and compact model notes', async ({ page }) => {
  const detail = { ...run, pending:null, status:'COMPLETED', report_ready:true,
    report_sections:[{key:'report-layout',title:'보고서 양식 확인',blocks:[
      {type:'html',html:'<table><tr><th>방향</th><th>설명</th></tr><tr><td><strong class="report-term" style="color:#1764b5">개선</strong></td><td>높이가 다른 셀<br>두 번째 줄</td></tr></table>'},
      {type:'figure',figure:{key:'standard-0',compact:true,title:'표준해 변환',note:'주황: 변경된 물질·장',
        svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 180"><g class="diagram-node" data-tone="changed"><circle cx="150" cy="90" r="60" fill="#fff0d5"/><text x="150" y="90" text-anchor="middle">최소 샘플링</text></g></svg>'}}
    ]}]};
  await page.route('**/api/runs/run-test/view', route=>route.fulfill({json:detail}));
  await page.route('**/api/public/runs/run-test/view', route=>route.fulfill({json:detail}));
  await page.goto('/');
  await page.getByRole('button',{name:'Problem Solving',exact:true}).click();
  await page.getByRole('button',{name:'내 분석 이력',exact:true}).click();
  await page.getByRole('button',{name:/반도체 세정/}).click();
  await page.getByRole('button',{name:'보고서',exact:true}).click();
  async function verify() {
    await expect(page.locator('.figure-compact circle')).toHaveCount(1);
    await expect(page.locator('.figure-note')).toContainText('변경된 물질');
    expect(await page.locator('.report-prose th,.report-prose td').evaluateAll(cells=>cells.every(c=>
      getComputedStyle(c).textAlign==='center' && getComputedStyle(c).verticalAlign==='middle'))).toBe(true);
    await expect(page.locator('.report-term')).toHaveCSS('color','rgb(23, 100, 181)');
  }
  await verify();
  await page.getByRole('button',{name:'Sample Case',exact:true}).click();
  await page.getByRole('button',{name:/반도체 세정/}).click();
  await page.getByRole('tab',{name:'보고서',exact:true}).click();
  await verify();
});
test.beforeEach(async ({ page }) => {
  await page.route('**/api/notifications',route=>route.fulfill({json:[]}));
  await page.route('**/api/public/runs?*',route=>route.fulfill({json:{items:[{run_id:'run-test',title:run.title,industry:'반도체',status:'COMPLETED',mode:'FULL'}],total:1,page:1,page_size:20}}));
  await page.route('**/api/runs?*',route=>route.fulfill({json:{items:[{run_id:'run-test',title:run.title,industry:'반도체',status:'WAITING_HUMAN',mode:'FULL'}],total:1,page:1,page_size:20}}));
  await page.route("**/api/public/runs", route => route.fulfill({ json: [{ run_id: "run-test", title: run.title, industry: "반도체", status: "COMPLETED" }] }));
  await page.route("**/api/public/runs/run-test/view", route => route.fulfill({ json: { ...run, pending: null, report_ready: true,
    search_status: {patent_status:"UNAVAILABLE",patent_queries:12,patent_records:0},
    report_sections: [{key:"definition",title:"1. 문제 정의",html:"<p>공개 문제 정의</p>",figures:[]}] } }));
  await page.route("**/auth/session", route => route.fulfill({ json: { configured: true, user: { name: "Fixture" } } }));
  await page.route("**/api/runs", (route) =>
    route.fulfill({
      json: [
        {
          run_id: "run-test",
          title: run.title,
          industry: "반도체",
          target_system: "웨이퍼 세정",
          status: "WAITING_HUMAN",
          started_at: "2026-09-08",
        },
      ],
    }),
  );
  await page.route("**/api/runs/run-test/view", (route) =>
    route.fulfill({ json: run }),
  );
});
test("desktop landing, five pages and technology photograph", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /풀리지 않던 문제/ }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: /연구자들이 로봇 장치를/ })).toBeVisible();
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Introduction", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /TRIZ를 몰라도/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "About us", exact: true }).click();
  await expect(page.getByRole("heading", { name: "About us" })).toBeVisible();
  expect(errors).toEqual([]);
});
test("new project submits query and attachment and displays human questions", async ({
  page,
}) => {
  let submitted = false;
  await page.route("**/api/runs", async (route) => {
    if (route.request().method() === "POST") {
      submitted = route.request().postData().includes("웨이퍼");
      await route.fulfill({ json: { run_id: "run-test" } });
    } else await route.fulfill({ json: [] });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Problem Solving", exact: true })
    .click();
  await page
    .getByLabel("해결하고 싶은 문제")
    .fill("웨이퍼 세정과 패턴 손상 문제");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "measurement.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("pressure,20 MPa"),
    });
  await page.getByRole("checkbox", { name: /비회원에게도 공개/ }).check();
  await page.getByRole("button", { name: "AI와 문제 분석 시작" }).click();
  await expect(page.getByLabel("패턴 치수는 얼마인가요?")).toBeVisible();
  expect(submitted).toBe(true);
  await expect(page.locator("body")).not.toContainText("internal-test-id");
});
test("history opens real run and resumes with answer", async ({ page }) => {
  let answer;
  await page.route("**/api/runs/run-test/resume", async (route) => {
    answer = route.request().postDataJSON().payload;
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Problem Solving", exact: true }).click();
  await page.getByRole("button", { name: "내 분석 이력", exact: true }).click();
  await page
    .getByRole("button", { name: /반도체 세정 성능과 패턴 손상/ })
    .click();
  await page.getByLabel("패턴 치수는 얼마인가요?").fill("20nm");
  await page.getByRole("button", { name: "답변 전달하고 계속" }).click();
  await expect.poll(() => answer?.answers?.[0]).toBe("20nm");
  expect(answer.interrupt_id).toBe("internal-test-id");
});
test("mobile layout stays within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /풀리지 않던 문제/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Problem Solving", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/intake-mobile.png",
    fullPage: true,
  });
});
test("report embeds diagrams, separates feedback and hides missing evidence notices", async ({
  page,
}) => {
  await page.route("**/api/runs/run-test/view", (route) =>
    route.fulfill({
      json: {
        ...run,
        report_ready: true,
        pending: null,
        status: "COMPLETED",
        report_sections: [{ key: "analysis", title: "2. 시스템 분석", blocks: [
          { type: "html", html: "<h3>2.3 기능 모델</h3><p>기능 분석 내용이다.</p>" },
          { type: "figure", figure: { key: "functions", title: "기능 모델", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><text x="20" y="40">웨이퍼</text></svg>' } },
        ] }],
        figures: [
          {
            key: "sufield",
            title: "물질–장 분석",
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><text x="20" y="40">S1 · 웨이퍼</text></svg>',
          },
        ],
        solutions: [
          {
            key: "CPT-hidden-id",
            title: "시간 분리 세정",
            summary: "세정과 지지 분리",
            description: "세정 작용을 시간에 따라 분리합니다.",
            mechanism: "시간 분리",
            effect: "가정 검증 필요",
            assumptions: [],
            transfer_conditions: [],
            risks: [],
            validation: [],
            score: 3.8,
            rank: 99,
            verdict: "조건 확인 필요",
            dimensions: { QUALITY: 4 },
            evidence: [
              {
                kind: "특허",
                title: "Reference patent",
                mechanism: "작용 원리를 비교한다.",
                url: "https://patents.google.com/patent/US1234567",
              },
            ],
          },
        ],
        evidence_gaps: [{ title: "시간 분리 세정", missing: ["PAPER"] }],
        related_references: [{ concept_id: "CPT-hidden-id", status: "유사 사례", reason: "추가 검토가 필요하다.", reference: { kind: "논문", title: "Related paper", url: "https://example.com/paper" } }],
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Problem Solving", exact: true }).click();
  await page.getByRole("button", { name: "내 분석 이력", exact: true }).click();
  await page.getByRole("button", { name: /반도체 세정/ }).click();
  await expect(page.getByRole("button", { name: "분석 도식", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "보고서", exact: true }).click();
  await expect(page.locator("figure svg")).toBeVisible();
  await expect(page.locator(".solution-card")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "피드백 저장" })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "보고서 다운로드", exact: true }),
  ).toHaveAttribute("href", "/api/runs/run-test/report?format=html");
  await page.getByRole("button", { name: "해결안", exact: true }).click();
  await expect(page.getByText("추가 도출", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("근거를 아직 확보하지 못했습니다");
  await expect(page.locator(".reference-card")).toHaveCount(2);
  expect(await page.locator(".reference-card").evaluateAll(cards => cards.every(card =>
    parseFloat(getComputedStyle(card.querySelector('.reference-title')).fontSize) > parseFloat(getComputedStyle(card.querySelector('.reference-description')).fontSize)))).toBe(true);
  await expect(page.locator("body")).not.toContainText("CPT-hidden-id");
  await page.getByRole("button", { name: "피드백", exact: true }).click();
  await expect(page.getByRole("button", { name: "피드백 저장" })).toBeVisible();
});

test("public pages remain accessible and solving requires Google login", async ({ page }) => {
  await page.route("**/auth/session", route => route.fulfill({ json: { configured: true, user: null } }));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Main", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("SAMSUNG");
  await page.getByRole("button", { name: "Sample Case", exact: true }).click();
  await expect(page.getByRole("heading", { name: "모두의 분석 사례" })).toBeVisible();
  await page.getByRole("button", { name: /반도체 세정 성능과 패턴 손상/ }).click();
  await expect(page.getByRole("tab", { name: "문제 정의", exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(run.problem, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "보고서 다운로드" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "분석 도식" })).toHaveCount(0);
  await page.getByRole("tab", { name: "문제 정의", exact: true }).click();
  await expect(page.locator('.search-status')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "피드백 저장" })).toHaveCount(0);
  await page.getByRole("button", { name: "Problem Solving", exact: true }).click();
  await expect(page.getByRole("link", { name: "Google로 계속하기" })).toHaveAttribute("href", "/auth/google");
  await expect(page.getByLabel("해결하고 싶은 문제")).toHaveCount(0);
});
