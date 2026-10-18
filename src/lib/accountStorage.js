import { clearSubmission } from './submission';

// Remove only this application's data, including drafts and per-user notification state.
export function clearAccountStorage() {
  clearSubmission();
  for (const name of ['sessionStorage', 'localStorage']) {
    try {
      const storage = window[name];
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      for (const key of keys) if (key?.startsWith('triz-')) storage.removeItem(key);
    } catch { /* Storage may be unavailable; the server has already revoked the session. */ }
  }
}
