import React from 'react';

export function GuideLink({ go, to = {}, children, className = '', ...props }) {
  const query = new URLSearchParams({page:'tool',...to});
  return <a className={className} href={`?${query}`} onClick={event => {
    if(event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); go(to);
  }} {...props}>{children}</a>;
}
