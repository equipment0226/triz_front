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

function inputSignature(userId, query, mode, consent, files) {
  return JSON.stringify([userId, query.trim(), mode, String(consent),
    files.map(file => [file.name, file.size, file.lastModified])]);
}
export function canRetrySubmission({ userId, query, mode, publicConsent, files }) {
  const previous = read();
  return previous?.pending === true && previous.input === inputSignature(userId, query, mode, publicConsent, files);
}

export async function submitProblem(data, userId, ticketBalance) {
  const files = await Promise.all(data.getAll('files').map(async file => ({
    name: file.name,
    hash: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())))
      .map(byte => byte.toString(16).padStart(2, '0')).join(''),
  })));
  const fingerprint = JSON.stringify([userId, data.get('query').trim(), data.get('mode'), data.get('public_consent'), files,
    data.get('training_consent') || 'PROJECT_ONLY']);
  const previous = read();
  const sameRequest = previous?.fingerprint === fingerprint;
  if (Number.isFinite(ticketBalance) && ticketBalance < 1 && !(sameRequest && previous.pending))
    throw new Error('사용 가능한 티켓이 없습니다. 새 분석에는 티켓 1개가 필요합니다.');
  const submission = { ...(sameRequest ? previous : { fingerprint, key: crypto.randomUUID() }), pending: true,
    input: inputSignature(userId, data.get('query'), data.get('mode'), data.get('public_consent'), data.getAll('files')) };
  // Persist before sending: a lost response or page reload must reuse this key.
  save(submission);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const result = await api('/runs', { method: 'POST', body: data,
      headers: { 'Idempotency-Key': submission.key }, signal: controller.signal });
    if (!result.run_id) throw new Error('프로젝트 접수 결과를 확인하지 못했습니다. 다시 확인해 주세요.');
    save({ ...submission, pending: false });
    return result;
  } catch (error) {
    // Busy/retryable responses may follow a successful debit in another worker.
    if (error.code === 'submission_already_used' ||
      (error.status >= 400 && error.status < 500 && ![408, 409, 429].includes(error.status)))
      save({ ...submission, pending: false });
    if (error.name === 'AbortError' || error instanceof TypeError)
      throw new Error('접수 결과를 확인하지 못했습니다. 다시 누르면 같은 요청으로 확인합니다. 내 분석 이력에서도 확인할 수 있어요.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
