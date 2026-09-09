import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Bell, ArrowRight, RefreshCw, X} from 'lucide-react';
import {api} from '../lib/api';

const retryRequired = item => item.kind === 'RETRY_REQUIRED';
const description = item => item.description || (retryRequired(item)
  ? '분석이 중단되었어요. 저장된 내용을 확인하고 이어서 실행해 주세요.'
  : `${item.title} 검토가 요청되었어요.`);
const actionLabel = item => item.action_label || (retryRequired(item) ? '이어서 확인' : '지금 진행');

export function Notifications({user, openRun}) {
  const storageKey = 'triz-notifications:' + (user.id || user.email || user.name);
  const [items,setItems] = useState([]), [expanded,setExpanded] = useState(false);
  const [seen,setSeen] = useState(()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'[]');}catch{return [];}});
  const root=useRef(), menu=useRef();
  const [menuPosition,setMenuPosition]=useState({});
  useEffect(()=>{
    let active=true, fetching=false;
    async function refresh(){
      if(fetching) return;
      fetching=true;
      try {const data=await api('/notifications'); if(active) setItems(data);}
      catch {/* Session handling belongs to the shared API client; retry on the next poll. */}
      finally {fetching=false;}
    }
    refresh();
    const timer=setInterval(refresh,15000);
    window.addEventListener('focus',refresh);
    window.addEventListener('triz-run-updated',refresh);
    return ()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('triz-run-updated',refresh);};
  },[storageKey]);
  useEffect(()=>{
    function close(e){if(root.current&&!root.current.contains(e.target)&&!menu.current?.contains(e.target))setExpanded(false);}
    function escape(e){if(e.key==='Escape')setExpanded(false);}
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
  },[]);
  useEffect(()=>{
    if(!expanded) return;
    function position(){
      const rect=root.current?.getBoundingClientRect();
      if(rect) setMenuPosition({'--notification-top':`${rect.bottom+12}px`,'--notification-right':`${Math.max(16,innerWidth-rect.right)}px`});
    }
    position();
    window.addEventListener('resize',position);
    window.addEventListener('scroll',position,true);
    return ()=>{window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);};
  },[expanded]);
  const popup=items.find(item=>!seen.includes(item.id));
  function acknowledge(item, navigate=false){
    const next=[...new Set([...seen,item.id])].slice(-300);
    setSeen(next);try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{}
    if(navigate){setExpanded(false);openRun(item.run_id);}
  }
  return <div className="notifications" ref={root}>
    <button className={'notification-bell'+(items.length?' has-notifications':'')} aria-label={`알림 ${items.length}건`} aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>
      <Bell size={21}/>{items.length>0&&<span className="notification-count">{items.length}</span>}
    </button>
    {expanded&&createPortal(<div className="notification-menu" ref={menu} style={menuPosition}><div className="notification-heading"><b>확인이 필요한 알림</b><small>{items.length}건</small></div>
      {items.length?items.map(item=><button key={item.id} onClick={()=>acknowledge(item,true)}><strong>{item.project_title}</strong><span>{description(item)}</span><small>{retryRequired(item) ? actionLabel(item) : '이어서 확인하기'} →</small></button>):<p className="muted">지금은 기다리는 요청이 없어요.</p>}
    </div>,document.body)}
    {popup&&!expanded&&createPortal(<aside className="notification-toast" role="dialog" aria-labelledby="request-notification-title" aria-describedby="request-notification-description">
      <button className="toast-close" aria-label="나중에 알림 확인" onClick={()=>acknowledge(popup)}><X size={18}/></button>
      <p className="eyebrow">{retryRequired(popup) ? <RefreshCw size={14}/> : <Bell size={14}/>} {retryRequired(popup) ? '분석 재시도' : 'YOUR TURN'}</p>
      <h3 id="request-notification-title">{retryRequired(popup) ? '분석을 이어서 실행해 주세요' : '의견을 들려주세요'}</h3>
      <p id="request-notification-description"><strong>{popup.project_title}</strong><br/>{description(popup)}</p>
      <div className="actions"><button className="button dark" onClick={()=>acknowledge(popup,true)}>{actionLabel(popup)} <ArrowRight size={15}/></button><button className="button subtle" onClick={()=>acknowledge(popup)}>{retryRequired(popup) ? '나중에 확인' : '나중에 진행'}</button></div>
    </aside>,document.body)}
  </div>;
}
