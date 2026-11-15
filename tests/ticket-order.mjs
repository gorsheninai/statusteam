import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TICKET } from '../src/content/ticket.ts';
import { ticketTotalKopecks, formatRubles, checkoutMatchesPublication, checkoutErrorMessage } from '../src/features/forms/ticket-order.ts';
import { retryKey } from '../src/features/forms/api.ts';

test('confirmed price and integer order total are in kopecks', () => {
  assert.equal(TICKET.priceKopecks, 3_000_000);
  assert.equal(ticketTotalKopecks(1, TICKET.priceKopecks, TICKET.capacity), 3_000_000);
  assert.equal(ticketTotalKopecks(2, TICKET.priceKopecks, TICKET.capacity), 6_000_000);
  assert.equal(ticketTotalKopecks(100, TICKET.priceKopecks, TICKET.capacity), 300_000_000);
  assert.match(formatRubles(6_000_000), /60\s000\s₽/);
});
test('zero, fractions, overselling and unsafe amounts are rejected', () => {
  for (const qty of [0, -1, 1.5, 101, NaN, Infinity]) {
    assert.equal(ticketTotalKopecks(qty, TICKET.priceKopecks, TICKET.capacity), null);
  }
  assert.equal(ticketTotalKopecks(2, Number.MAX_SAFE_INTEGER, 100), null);
});
test('enable payment only after the server confirms the published terms and price', () => {
  const docs = [{ id: 'terms', version: 'v2', href: '/documents/files/terms-v2.pdf' }];
  const matching = { amountKopecks: TICKET.priceKopecks, documents: docs };
  assert.equal(checkoutMatchesPublication(matching, TICKET.priceKopecks, docs), true);
  assert.equal(checkoutMatchesPublication(null, TICKET.priceKopecks, docs), false);
  assert.equal(checkoutMatchesPublication({ ...matching, amountKopecks: 100 }, TICKET.priceKopecks, docs), false);
  assert.equal(checkoutMatchesPublication({
    ...matching, documents: [{ ...docs[0], version: 'v1' }],
  }, TICKET.priceKopecks, docs), false);
  assert.equal(checkoutMatchesPublication({
    ...matching, documents: [{ ...docs[0], href: '/documents/files/terms-v1.pdf' }],
  }, TICKET.priceKopecks, docs), false);
});
test('changing payment method keeps the order key until the buyer starts a new order', async () => {
  const entries = new Map();
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: key => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
    },
  });
  const card = { paymentMethod: 'bank_card' };
  const sbp = { paymentMethod: 'sbp' };
  const first = await retryKey('purchase', card, true);
  assert.equal(await retryKey('purchase', sbp, true), first);
  entries.delete('status-request-purchase');
  assert.notEqual(await retryKey('purchase', sbp, true), first);
});

test('checkout retries use the same random key when mobile storage writes fail', async () => {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: { getItem: () => null, setItem() { throw new Error('storage unavailable'); } },
  });
  const original = globalThis.crypto;
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { getRandomValues: array => original.getRandomValues(array) },
  });
  try {
    const first = await retryKey('mobile-fixture', { device: 'phone' }, true);
    assert.equal(await retryKey('mobile-fixture', { device: 'phone' }, true), first);
    assert.notEqual(await retryKey('other-device-fixture', { device: 'laptop' }, true), first);
    assert.match(first, /^[a-f0-9]{64}$/);
  } finally {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: original });
  }
});

test('checkout reports field errors and shared throttling', () => {
  assert.match(checkoutErrorMessage(422, 'invalid_phone'), /телефона/);
  assert.match(checkoutErrorMessage(429, 'rate_limited'), /Слишком много попыток/);
  assert.match(checkoutErrorMessage(503, null), /недоступен/);
});
