// Keep only a short-lived allowlisted route. Private answers stay on the server.
const key='triz-patent-login-return';
const tabs=['발명정보','질문','선행기술','청구범위','명세서·도면','검토·수정','내보내기'];
const identifier=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(value)?value:undefined;
export function rememberPatentRoute(route) {
  if(route.page!=='Patent (Test)')return;
  const safe={page:'Patent (Test)',patentCase:identifier(route.patentCase),
    patentSourceRun:identifier(route.patentSourceRun),patentConcept:identifier(route.patentConcept),
    patentTab:tabs.includes(route.patentTab)?route.patentTab:'질문'};
  sessionStorage.setItem(key,JSON.stringify({expires:Date.now()+600000,route:safe}));
}
export function clearPatentReturn() {sessionStorage.removeItem(key);}
export function takePatentReturn() {
  const raw=sessionStorage.getItem(key);clearPatentReturn();
  try {
    const value=JSON.parse(raw);
    if(!value||value.expires<Date.now()||value.expires>Date.now()+600000||value.route?.page!=='Patent (Test)')return null;
    const route=value.route;
    return {page:'Patent (Test)',patentCase:identifier(route.patentCase),patentSourceRun:identifier(route.patentSourceRun),
      patentConcept:identifier(route.patentConcept),patentTab:tabs.includes(route.patentTab)?route.patentTab:'질문'};
  } catch {return null;}
}
