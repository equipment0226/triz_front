import {useCallback, useEffect, useRef, useState} from 'react';

const pages = {main:'Main',tool:'Tool 소개',solve:'Problem Solving',cases:'Sample Case',about:'About us'};
const tabs = {analysis:'분석 현황',definition:'문제 정의',solutions:'해결안',report:'보고서',feedback:'피드백'};

export function readRoute() {
  const params = new URLSearchParams(window.location.search);
  const page = pages[params.get('page')] || 'Main';
  const projectPage = ['Problem Solving','Sample Case'].includes(page);
  const run = projectPage ? params.get('run') || null : null;
  const defaultTab = page === 'Sample Case' ? '문제 정의' : '분석 현황';
  const allowedTabs = page === 'Sample Case' ? ['문제 정의','해결안','보고서'] : Object.values(tabs);
  const requestedTab = page === 'Sample Case' && params.get('tab') === 'analysis' ? '문제 정의' : tabs[params.get('tab')];
  const tab = allowedTabs.includes(requestedTab) ? requestedTab : defaultTab;
  const listPage = Number(params.get('listPage'));
  return {page,run,tab,library:page === 'Problem Solving' && params.get('view') === 'history' && !run,
    listPage:Number.isSafeInteger(listPage) && listPage > 0 ? listPage : 1, search:params.get('search') || ''};
}

function routeUrl(route) {
  const params = new URLSearchParams();
  const slug = Object.keys(pages).find(key => pages[key] === route.page) || 'main';
  if(slug !== 'main') params.set('page',slug);
  if(['solve','cases'].includes(slug)) {
    if(route.run) {
      params.set('run',route.run);
      params.set('tab',Object.keys(tabs).find(key => tabs[key] === route.tab) || (slug === 'cases' ? 'definition' : 'analysis'));
    } else if(slug === 'solve' && route.library) params.set('view','history');
    if(route.listPage > 1) params.set('listPage',String(route.listPage));
    if(route.search) params.set('search',route.search);
  }
  return window.location.pathname + (params.size ? '?' + params.toString() : '');
}

// One history entry per user navigation, including project tabs. OAuth's existing
// ?page=solve callback remains compatible; refresh and shared URLs read the same state.
export function useNavigation() {
  const [route,setRoute] = useState(readRoute);
  const current = useRef(route);
  useEffect(() => {
    const restore = () => {current.current = readRoute(); setRoute(current.current);};
    window.addEventListener('popstate',restore);
    return () => window.removeEventListener('popstate',restore);
  },[]);
  const navigate = useCallback((next,{replace=false,scrollTop=false}={}) => {
    const target = typeof next === 'function' ? next(current.current) : next;
    const url = routeUrl(target);
    if(url !== window.location.pathname + window.location.search) {
      window.history[replace ? 'replaceState' : 'pushState'](null,'',url);
    }
    current.current = readRoute();
    setRoute(current.current);
    if(scrollTop) window.scrollTo({top:0,behavior:'instant'});
  },[]);
  return [route,navigate];
}
