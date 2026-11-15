import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const origin = 'https://statusteam-official.ru';
const ticketToken = 'a'.repeat(64);
const ticketUrl = origin + '/api/index.php?r=ticket#' + ticketToken;
const ticketData = { control: false, status: 'valid', qr: 'data:image/svg+xml,qr' };
const drain = () => new Promise(resolve => setImmediate(resolve));

const orderToken = 'b'.repeat(64);
function checkout(page, responses, { linked = false, testTicket = false } = {}) {
  const elements = new Map();
  const addresses = [];
  const removed = [];
  const timers = [];
  const requests = [];
  const get = id => {
    if (!elements.has(id)) elements.set(id, {
      addEventListener() {},
      dataset: { test: testTicket ? 'yes' : 'no' },
      getBoundingClientRect: () => ({ width: 500, height: 350 }),
      style: { setProperty() {} },
    });
    return elements.get(id);
  };
  runInNewContext(script, {
    document: { body: { dataset: { page } }, getElementById: get },
    location: { origin, pathname: '/api/index.php', hash: linked
      ? '#' + ticketToken : '#' + (page === 'ticket' ? 'order-' : '') + orderToken },
    history: { replaceState: (_state, _title, url) => addresses.push(url) },
    sessionStorage: { removeItem: key => removed.push(key) },
    fetch: async (url, options) => {
      requests.push([url, JSON.parse(options.body)]);
      return { ok: true, json: async () => responses.shift() };
    },
    setTimeout: handler => timers.push(handler), clearTimeout() {}, URL,
  });
  return { get, addresses, removed, timers, requests };
}

test('the paid return opens the QR ticket directly and clears the purchase key', async () => {
  for (const page of ['ticket', 'return']) {
    const state = checkout(page, [{ status: 'paid', ticketUrl }, ticketData]);
    await drain();
    assert.deepEqual(state.addresses, [ticketUrl]);
    assert.deepEqual(state.requests, [
      ['index.php?r=order-status', { token: orderToken, verifyPayment: true, csrf: '' }],
      ['index.php?r=ticket-data', { token: ticketToken, csrf: '' }],
    ]);
    assert.equal(state.get('return-actions').hidden, true);
    assert.equal(state.get('ticket').hidden, false);
    assert.equal(state.get('qr').src, ticketData.qr);
    assert.equal(state.get('ticket-status').textContent, 'Действителен для прохода');
    assert.equal(state.get('message').textContent, '');
    assert.ok(state.removed.includes('status-request-purchase'));
  }
});

test('a pending return retries instead of opening the ticket before confirmation', async () => {
  const state = checkout('ticket', [{ status: 'reserved' }, { status: 'paid', ticketUrl }, ticketData]);
  await drain();
  assert.equal(state.addresses.length, 0);
  assert.equal(state.get('message').textContent, 'Открываем билет…');
  await state.timers.shift()();
  assert.deepEqual(state.addresses, [ticketUrl]);
  assert.equal(state.requests[1][1].verifyPayment, false);
});

test('a canceled or unrelated return remains on the status page', async () => {
  for (const response of [
    { status: 'canceled' },
    { status: 'paid', ticketUrl: ticketUrl.replace(origin, 'https://example.invalid') },
  ]) {
    const state = checkout('ticket', [response]);
    await drain();
    assert.equal(state.addresses.length, 0);
    assert.equal(state.get('return-actions').hidden, false);
  }
});

test('control, test and used tickets never display valid admission', async () => {
  for (const [changes, testTicket, expected] of [
    [{ control: true }, false, 'Для прохода недействителен'],
    [{}, true, 'Для прохода недействителен'],
    [{ status: 'used' }, false, 'Уже использован'],
  ]) {
    const state = checkout('ticket', [{ ...ticketData, ...changes }], { linked: true, testTicket });
    await drain();
    assert.equal(state.get('ticket-status').textContent, expected);
  }
});
