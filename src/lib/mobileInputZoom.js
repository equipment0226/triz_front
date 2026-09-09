// Keep a small, reversible editing zoom separate from the user's pinch zoom.
export function installMobileInputZoom() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return () => {};
  const mobile = window.matchMedia('(max-width: 800px) and (pointer: coarse)');
  const textTypes = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number']);
  const isEditor = element => element instanceof HTMLElement && !element.disabled && !element.readOnly &&
    (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' && textTypes.has(element.type));
  let session = null, pointerDown = false, timer;

  function restore() {
    if (!session) return;
    viewport.setAttribute('content', session.original);
    session = null;
  }
  function settle() {
    clearTimeout(timer);
    // Let a tapped submit/navigation button receive its click before changing zoom.
    timer = setTimeout(() => {
      if (!pointerDown && !isEditor(document.activeElement)) restore();
    }, 0);
  }
  function focus(event) {
    if (!mobile.matches || !isEditor(event.target)) return;
    clearTimeout(timer);
    if (session) return;
    const visual = window.visualViewport;
    // Respect zoom the user had already chosen before they started editing.
    if (visual && Math.abs(visual.scale - 1) > 0.05) return;
    const original = viewport.getAttribute('content') || 'width=device-width, initial-scale=1';
    session = {original, height: visual ? visual.height * visual.scale : innerHeight, keyboardOpen: false};
    const options = original.split(',').map(s => s.trim()).filter(s => !/^initial-scale\s*=/i.test(s));
    viewport.setAttribute('content', [...options, 'initial-scale=1.15'].join(', '));
  }
  function resize() {
    if (!session) return;
    if (!mobile.matches) {
      restore();
      return;
    }
    if (!isEditor(document.activeElement)) {
      settle();
      return;
    }
    const visual = window.visualViewport;
    if (!visual) return;
    const height = visual.height * visual.scale;
    if (height < session.height - 150) session.keyboardOpen = true;
    else if (session.keyboardOpen && height >= session.height - 80) {
      // Mobile keyboard dismissal can leave the field focused; end editing then.
      document.activeElement.blur();
      restore();
    }
  }
  const down = () => {pointerDown = true;};
  const up = () => {pointerDown = false; settle();};
  const hidden = () => {if (document.hidden) restore();};
  const removed = new MutationObserver(() => {
    if (session && !isEditor(document.activeElement)) settle();
  });
  document.addEventListener('focusin', focus);
  document.addEventListener('focusout', settle);
  document.addEventListener('pointerdown', down, true);
  document.addEventListener('pointerup', up, true);
  document.addEventListener('pointercancel', up, true);
  document.addEventListener('visibilitychange', hidden);
  window.visualViewport?.addEventListener('resize', resize);
  window.addEventListener('orientationchange', restore);
  mobile.addEventListener('change', resize);
  removed.observe(document.body, {childList: true, subtree: true});
  return () => {
    clearTimeout(timer);
    restore();
    removed.disconnect();
    document.removeEventListener('focusin', focus);
    document.removeEventListener('focusout', settle);
    document.removeEventListener('pointerdown', down, true);
    document.removeEventListener('pointerup', up, true);
    document.removeEventListener('pointercancel', up, true);
    document.removeEventListener('visibilitychange', hidden);
    window.visualViewport?.removeEventListener('resize', resize);
    window.removeEventListener('orientationchange', restore);
    mobile.removeEventListener('change', resize);
  };
}
