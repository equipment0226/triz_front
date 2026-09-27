// Synthetic response interception only: no real project is created or changed.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const directory=path.join(root,'pilot/data/report-introduction-review');
const fixture=JSON.parse(await fs.readFile(path.join(directory,'view.json'),'utf8'));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(directory,'gallery.html')).href);
  for(const key of ['tc-0','pc-0','sufield-0','ceca','ariz-step-1','matrix-0','quadrant'])
    await page.locator(`#${key}`).screenshot({path:path.join(directory,key+'.png')});
  const spills=await page.locator('.diagram-node').evaluateAll(nodes=>nodes.flatMap(node=>{
    const box=node.querySelector('rect')?.getBBox();
    if(!box)return [];
    return [...node.querySelectorAll('text')].filter(text=>{
      const r=text.getBBox();return r.x<box.x-1||r.y<box.y-1||r.x+r.width>box.x+box.width+1||r.y+r.height>box.y+box.height+1;
    }).map(()=>node.dataset.node);
  }));
  assert.deepEqual(spills,[],'Node text must stay inside the cards');
  await page.goto(pathToFileURL(path.join(directory,'report.html')).href);
  await page.pdf({path:path.join(directory,'report.pdf'),format:'A4',printBackground:true,margin:{top:'15mm',bottom:'15mm',left:'10mm',right:'10mm'}});

  await page.route('**/auth/session',route=>route.fulfill({json:{configured:false,user:null}}));
  await page.route('**/api/public/runs/introduction-design-review/view',route=>route.fulfill({json:fixture}));
  await page.goto((process.argv[2]||'https://trizstudio.online')+'/?page=cases&run=introduction-design-review&tab=report');
  await page.locator('[data-guide-kind="contradiction"]').waitFor();
  assert.equal(await page.locator('svg[data-template="introduction"]').count(),fixture.figures.length);
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:1000});
    const figure=page.locator('figure').filter({has:page.locator('[data-guide-kind="contradiction"]')});
    await figure.screenshot({path:path.join(directory,`app-${width}.png`)});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page must not overflow horizontally');
    const before=await figure.locator('svg').boundingBox();
    await figure.getByRole('button',{name:'도식 확대',exact:true}).click();
    const after=await figure.locator('svg').boundingBox();
    assert.ok(after.width>=before.width);
    if(width===390) assert.ok(await figure.locator('.figure-scroll').evaluate(el=>el.scrollWidth>el.clientWidth));
    await figure.getByRole('button',{name:'도식 크기 초기화',exact:true}).click();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({status:'VERIFIED',figures:fixture.figures.length,nodeTextSpills:spills.length,widths:[1440,390],portablePDF:true}));
} finally { await browser.close(); }
