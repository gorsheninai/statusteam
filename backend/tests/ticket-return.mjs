import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const origin = 'https://statusteam-official.ru';
const ticketUrl = origin + '/api/index.php?r=ticket#' + 'a'.repeat(64);
const drain = () => new Promise(resolve => setImmediate(resolve));

const orderToken = 'b'.repeat(64);
function checkout(page, ...responses) {
  const elements = new Map();
  const redirects = [];
  const removed = [];
  const timers = [];
  const requests = [];
  const get = id => {
    if (!elements.has(id)) elements.set(id, { addEventListener() {} });
    return elements.get(id);
  };
  runInNewContext(script, {
    document: { body: { dataset: { page } }, getElementById: get },
    location: { origin, hash: '#' + (page === 'ticket' ? 'order-' : '') + orderToken, replace: value => redirects.push(value) },
    sessionStorage: { removeItem: key => removed.push(key) },
    fetch: async (url, options) => {
      requests.push([url, JSON.parse(options.body)]);
      return { ok: true, json: async () => responses.shift() };
    },
    setTimeout: handler => timers.push(handler), clearTimeout() {}, URL,
  });
  return { get, redirects, removed, timers, requests };
}

test('the paid return opens the QR ticket directly and clears the purchase key', async () => {
  for (const page of ['ticket', 'return']) {
    const state = checkout(page, { status: 'paid', ticketUrl });
    await drain();
    assert.deepEqual(state.redirects, [ticketUrl]);
    assert.deepEqual(state.requests, [
      ['index.php?r=order-status', { token: orderToken, verifyPayment: true, csrf: '' }],
    ]);
    assert.equal(state.get('return-actions').hidden, true);
    assert.ok(state.removed.includes('status-request-purchase'));
  }
});

test('a pending return retries instead of opening the ticket before confirmation', async () => {
  const state = checkout('ticket', { status: 'reserved' }, { status: 'paid', ticketUrl });
  await drain();
  assert.equal(state.redirects.length, 0);
  assert.equal(state.get('message').textContent, 'Открываем билет…');
  await state.timers.shift()();
  assert.deepEqual(state.redirects, [ticketUrl]);
  assert.equal(state.requests[1][1].verifyPayment, false);
});

test('a canceled or unrelated return remains on the status page', async () => {
  for (const response of [
    { status: 'canceled' },
    { status: 'paid', ticketUrl: ticketUrl.replace(origin, 'https://example.invalid') },
  ]) {
    const state = checkout('ticket', response);
    await drain();
    assert.equal(state.redirects.length, 0);
    assert.equal(state.get('return-actions').hidden, false);
  }
});
