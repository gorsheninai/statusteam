import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const origin = 'https://statusteam-official.ru';
const ticketUrl = origin + '/api/index.php?r=ticket#' + 'a'.repeat(64);
const drain = () => new Promise(resolve => setImmediate(resolve));

function checkout(...responses) {
  const elements = new Map();
  const redirects = [];
  const removed = [];
  const timers = [];
  const get = id => {
    if (!elements.has(id)) elements.set(id, { addEventListener() {} });
    return elements.get(id);
  };
  runInNewContext(script, {
    document: { body: { dataset: { page: 'return' } }, getElementById: get },
    location: { origin, hash: '#' + 'b'.repeat(64), replace: value => redirects.push(value) },
    sessionStorage: { removeItem: key => removed.push(key) },
    fetch: async () => ({ ok: true, json: async () => responses.shift() }),
    setTimeout: handler => timers.push(handler), clearTimeout() {}, URL,
  });
  return { get, redirects, removed, timers };
}

test('the paid return opens the QR ticket directly and clears the purchase key', async () => {
  const state = checkout({ status: 'paid', ticketUrl });
  await drain();
  assert.deepEqual(state.redirects, [ticketUrl]);
  assert.ok(state.removed.includes('status-request-purchase'));
});

test('a pending return retries instead of opening the ticket before confirmation', async () => {
  const state = checkout({ status: 'reserved' }, { status: 'paid', ticketUrl });
  await drain();
  assert.equal(state.redirects.length, 0);
  assert.equal(state.get('message').textContent, 'Проверяем оплату…');
  await state.timers.shift()();
  assert.deepEqual(state.redirects, [ticketUrl]);
});

test('a canceled or unrelated return remains on the status page', async () => {
  for (const response of [
    { status: 'canceled' },
    { status: 'paid', ticketUrl: ticketUrl.replace(origin, 'https://example.invalid') },
  ]) {
    const state = checkout(response);
    await drain();
    assert.equal(state.redirects.length, 0);
    assert.equal(state.get('refresh').hidden, false);
  }
});
