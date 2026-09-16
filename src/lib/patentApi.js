export async function patentApi(path, options = {}) {
  const response = await fetch('/api/patent' + path, options);
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('triz-session-expired'));
    let error;
    try { error = await response.json(); } catch {}
    const message = typeof error?.detail === 'string' ? error.detail : '특허 초안 요청을 처리하지 못했습니다.';
    throw Object.assign(new Error(message), {code:error?.code,status:response.status});
  }
  return response.json();
}
export function patentPost(path, body, key = crypto.randomUUID()) {
  return patentApi(path, {method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)});
}
export const versionBody = (record,payload={}) => ({expected_revision:record.revision,expected_epoch:record.epoch,input_snapshot_id:record.snapshot_id,payload});
export async function contentHash(value) {
  const sorted = v => Array.isArray(v) ? v.map(sorted) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])) : v;
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(sorted(value))));
  return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
