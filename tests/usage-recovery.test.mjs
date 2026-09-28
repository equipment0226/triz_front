import test from 'node:test';
import assert from 'node:assert/strict';
import { continueWithRecovery } from '../src/lib/usageRecovery.js';

const recovery = { expected_epoch: 4, items: [{ task_id: 'lost-h', can_authorize: true,
  retained_reserve_microusd: 133379, retry_reserve_limit_microusd: 133379 }] };

test('cancel preserves interrupted analysis without authorizing or continuing', async () => {
  const sent = [];
  const result = await continueWithRecovery('battery', { isAx: true, request: async () => recovery,
    send: async (...args) => sent.push(args), confirm: message => {
      assert.match(message, /\$0\.133379/);
      assert.match(message, /확정 청구액이 아닙니다/);
      return false;
    } });
  assert.equal(result, false);
  assert.deepEqual(sent, []);
});

test('explicit consent is recorded before continuing', async () => {
  const sent = [];
  assert.equal(await continueWithRecovery('battery', { isAx: true, request: async () => recovery,
    send: async (...args) => sent.push(args), confirm: () => true }), true);
  assert.deepEqual(sent, [
    ['/runs/battery/ax/usage-recovery', { task_id: 'lost-h', expected_epoch: 4, acknowledge_possible_duplicate_charge: true }],
    ['/runs/battery/continue', {}],
  ]);
});

test('a second unknown retry blocks without requesting consent or continuing', async () => {
  await assert.rejects(continueWithRecovery('battery', { isAx: true,
    request: async () => ({ items: [{ can_authorize: false, reason: '관리자 확인' }] }),
    send: async () => assert.fail('must not continue'), confirm: () => assert.fail('must not ask'),
  }), /관리자 확인/);
});

test('rejected authorization never continues the run', async () => {
  const sent = [];
  await assert.rejects(continueWithRecovery('battery', { isAx: true, request: async () => recovery,
    confirm: () => true, send: async path => { sent.push(path); throw new Error('stale epoch'); },
  }), /stale epoch/);
  assert.deepEqual(sent, ['/runs/battery/ax/usage-recovery']);
});

test('ordinary AX continuation needs no recovery consent', async () => {
  const sent = [];
  await continueWithRecovery('battery', { isAx: true, request: async () => ({ items: [] }),
    send: async path => sent.push(path), confirm: () => assert.fail('unexpected consent') });
  assert.deepEqual(sent, ['/runs/battery/continue']);
});

test('legacy continuation does not call AX recovery', async () => {
  const sent = [];
  await continueWithRecovery('battery', { request: async () => assert.fail('unexpected AX request'),
    send: async path => sent.push(path) });
  assert.deepEqual(sent, ['/runs/battery/continue']);
});
