import { useEffect, useRef } from 'react';

// Animate only when content enters the viewport. Text stays available before JS
// runs, and newly loaded library content is observed after the lazy boundary.
export function useGuideMotion(pageKey) {
  const root=useRef(null);
  useEffect(()=>{
    const host=root.current;
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(!host || !window.IntersectionObserver)return;
    const seen=new WeakSet();
    const animations=new Set();
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(({target,isIntersecting})=>{
        if(!isIntersecting)return;
        observer.unobserve(target);
        if(preference.matches)return;
        const animation=target.animate([
          {opacity:.25,transform:'translateY(18px)'},
          {opacity:1,transform:'translateY(0)'},
        ],{duration:520,easing:'cubic-bezier(.2,.7,.2,1)'});
        animations.add(animation);
        animation.onfinish=()=>animations.delete(animation);
      });
    },{threshold:.08});
    const scan=()=>host.querySelectorAll('.guide-journey article,.material-cover,.technique-card,.library-entry,.library-hero,.chapter-hero,.standards-explorer,.triz-pillars article').forEach(node=>{
      if(!seen.has(node)){seen.add(node);observer.observe(node);}
    });
    scan();
    const updates=new MutationObserver(scan);
    updates.observe(host,{childList:true,subtree:true});
    const cancel=()=>{if(preference.matches)animations.forEach(a=>a.cancel());};
    preference.addEventListener('change',cancel);
    return()=>{observer.disconnect();updates.disconnect();preference.removeEventListener('change',cancel);animations.forEach(a=>a.cancel());};
  },[pageKey]);
  return root;
}
