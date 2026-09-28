import { api, post } from './api.js';

export async function continueWithRecovery(runId, {
  isAx = false, request = api, send = post, confirm = message => window.confirm(message),
} = {}) {
  if (isAx) {
    const recovery = await request(`/runs/${runId}/ax/usage-recovery`);
    const items = recovery.items || [];
    if (items.some(item => !item.can_authorize)) {
      throw new Error(items.find(item => !item.can_authorize).reason || '호출 상태를 관리자가 확인해야 합니다.');
    }
    if (items.length) {
      const dollars = amount => `$${(amount / 1000000).toFixed(6)}`;
      const held = items.reduce((total, item) => total + item.retained_reserve_microusd, 0);
      const retry = items.reduce((total, item) => total + item.retry_reserve_limit_microusd, 0);
      const agreed = confirm(`이전 요청의 응답을 잃어 사용량을 확인하지 못했습니다.\n\n` +
        `미확인 비용 예약 ${dollars(held)}은 그대로 유지합니다. 이는 확정 청구액이 아닙니다.\n` +
        `미완료 작업 ${items.length}개를 각각 한 번 더 시도하며, 추가 예약 한도는 ${dollars(retry)}입니다.\n` +
        `완료된 분석을 유지하고 기존 프로젝트 예산 안에서 실행합니다. 추가 비용 발생 가능성에 동의하고 재시도하시겠습니까?`);
      if (!agreed) return false;
      for (const item of items) {
        await send(`/runs/${runId}/ax/usage-recovery`, {
          task_id: item.task_id, expected_epoch: recovery.expected_epoch,
          acknowledge_possible_duplicate_charge: true,
        });
      }
    }
  }
  await send(`/runs/${runId}/continue`, {});
  return true;
}
