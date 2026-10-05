import React, { useEffect, useRef, useState } from 'react';
import './ServiceNotice.css';

const storageKey = 'triz-service-notice-hidden-date';
// The service's calendar day is based on Korea, even when a visitor travels.
export function noticeDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function shouldShow() {
  try { return localStorage.getItem(storageKey) !== noticeDate(); }
  catch { return true; }
}

export function ServiceNotice() {
  const [visible, setVisible] = useState(shouldShow);
  const [hideToday, setHideToday] = useState(false);
  const dialog = useRef(null);
  const heading = useRef(null);
  useEffect(() => {
    if (!visible) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    heading.current.focus();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  function dismiss() {
    if (hideToday) {
      try { localStorage.setItem(storageKey, noticeDate()); } catch {}
    }
    setVisible(false);
  }
  function containFocus(event) {
    if (event.key !== 'Tab') return;
    const controls = dialog.current.querySelectorAll('a[href], input, button');
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  if (!visible) return null;
  return <dialog ref={dialog} className="service-notice" aria-labelledby="service-notice-title"
    aria-describedby="service-notice-description" onKeyDown={containFocus}
    onCancel={event => { event.preventDefault(); dismiss(); }}>
    <p className="eyebrow">RESEARCH PREVIEW</p>
    <h2 id="service-notice-title" ref={heading} tabIndex={-1}>시험 운영 안내</h2>
    <div id="service-notice-description" className="service-notice-copy">
      <p>해당 Service는 논문 연구 및 실증을 위해 시험 운영 중인 서비스입니다.</p>
      <p>자유롭게 테스트 할 수 있으나, 생성 답변에 대한 책임은 사용자에게 있습니다.</p>
      <p>제한된 Infra로 운영 중이며, 동작이 되지 않을 경우 <a href="mailto:equipment0226@gmail.com">equipment0226@gmail.com</a>으로 말씀해주세요.</p>
    </div>
    <div className="service-notice-actions">
      <label><input type="checkbox" checked={hideToday} onChange={event => setHideToday(event.target.checked)} />오늘은 보지 않음</label>
      <button type="button" className="button dark" onClick={dismiss}>확인</button>
    </div>
  </dialog>;
}
