import {test,expect} from '@playwright/test';

const project={
  run_id:'mobile-action-run',title:'현장 팀의 의사결정 지연과 자율성 확보',industry:'비즈니스',system:'팀 의사결정',
  query:'검토 단계를 줄이면서 잘못된 의사결정을 방지하고 싶습니다.',status:'INTERRUPTED',stage_index:2,
  stages:Array.from({length:12},(_,index)=>({key:`stage-${index}`,label:`${index+1}. 문제와 해결 방향 검토`,index})),
  guide:'저장된 분석을 이어서 실행해 주세요.',constraints:[],reviewers:[],solutions:[],report_sections:[],report_ready:false,pending:null,
};

test('resume text and icon fit inside the button across mobile layout breakpoints',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/auth/session',route=>route.fulfill({json:{configured:true,user:{id:'mobile-action-user',name:'Tester'}}}));
  await page.route('**/api/notifications',route=>route.fulfill({json:[]}));
  let status='INTERRUPTED';
  await page.route('**/api/runs/mobile-action-run/view',route=>route.fulfill({json:{...project,status}}));
  for(const nextStatus of ['INTERRUPTED','FAILED','QUEUED']){
    status=nextStatus;
    for(const width of [320,390,500,501,600,601,700,768]){
      await page.setViewportSize({width,height:width===320?568:844});
      await page.goto('/?page=solve&run=mobile-action-run');
      const button=page.getByRole('button',{name:'이어서 실행',exact:true});
      await expect(button).toBeVisible();
      // Mobile browsers can enlarge text independently of the page layout.
      if(width===320) await button.evaluate(element=>{element.style.fontSize='26px';});
      const geometry=await button.evaluate(element=>{
        const box=element.getBoundingClientRect(),guide=element.parentElement.getBoundingClientRect();
        const contents=Array.from(element.childNodes).filter(node=>node.nodeType!==Node.TEXT_NODE||node.textContent.trim()).flatMap(node=>{
          if(node.nodeType===Node.ELEMENT_NODE){
            const rect=node.getBoundingClientRect();
            return [{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom}];
          }
          const range=document.createRange();
          range.selectNodeContents(node);
          return Array.from(range.getClientRects()).map(rect=>({left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom}));
        });
        const guideStyle=getComputedStyle(element.parentElement);
        return {box:{left:box.left,right:box.right,top:box.top,bottom:box.bottom,height:box.height},guide:{left:guide.left+parseFloat(guideStyle.paddingLeft),right:guide.right-parseFloat(guideStyle.paddingRight)},contents,
          pageWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
      });
      expect(geometry.box.height).toBeGreaterThanOrEqual(44);
      expect(geometry.box.left).toBeGreaterThanOrEqual(geometry.guide.left);
      expect(geometry.box.right).toBeLessThanOrEqual(geometry.guide.right);
      expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth+1);
      for(const content of geometry.contents){
        expect(content.left).toBeGreaterThanOrEqual(geometry.box.left);
        expect(content.right).toBeLessThanOrEqual(geometry.box.right);
        expect(content.top).toBeGreaterThanOrEqual(geometry.box.top);
        expect(content.bottom).toBeLessThanOrEqual(geometry.box.bottom);
      }
    }
  }
});
