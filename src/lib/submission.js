import { api } from './api';

const storageKey = 'triz-submission';
let latest;
function read() {
  try { return JSON.parse(sessionStorage.getItem(storageKey)) || latest; }
  catch { return latest; }
}
function save(value) {
  latest = value;
  try { sessionStorage.setItem(storageKey, JSON.stringify(value)); } catch {}
}
export function clearSubmission() {
  latest = undefined;
  try { sessionStorage.removeItem(storageKey); } catch {}
}

export async function submitProblem(data, userId) {
  const files = await Promise.all(data.getAll('files').map(async file => ({
    name: file.name,
    hash: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())))
      .map(byte => byte.toString(16).padStart(2, '0')).join(''),
  })));
  const fingerprint = JSON.stringify([userId, data.get('query').trim(), data.get('mode'), data.get('public_consent'), files]);
  const previous = read();
  const submission = previous?.fingerprint === fingerprint ? previous : { fingerprint, key: crypto.randomUUID() };
  // Persist before sending: a lost response or page reload must reuse this key.
  save(submission);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const result = await api('/runs', { method: 'POST', body: data,
      headers: { 'Idempotency-Key': submission.key }, signal: controller.signal });
    if (!result.run_id) throw new Error('프로젝트 접수 결과를 확인하지 못했습니다. 다시 확인해 주세요.');
    return result;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError)
      throw new Error('접수 결과를 확인하지 못했습니다. 다시 누르면 같은 요청으로 확인합니다. 내 분석 이력에서도 확인할 수 있어요.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
