export async function api(path, options = {}) {
  const response = await fetch("/api" + path, options);
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("triz-session-expired"));
    let message = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    try {
      const error = await response.json();
      if (typeof error.detail === "string") message = error.detail;
      if (response.status === 409 && error.detail?.snapshot_id) {
        message = '검토 중 분석 버전이 변경되었습니다. 화면을 새로고침한 뒤 변경 내용을 확인해 주세요. 변경 항목: ' + (error.detail.changed || []).map(c => c.key).join(', ');
      }
    } catch {}
    throw new Error(message);
  }
  return response.json();
}
export const post = (path, body = {}) =>
  api(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
