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
test('payment retries are scoped to the submitted buyer details', async () => {
  const entries = new Map();
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: key => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
    },
  });
  const buyer = { name: 'First Buyer', email: 'first@example.invalid', phone: '+70000000000' };
  const legacyKey = 'a'.repeat(64);
  entries.set('status-request-purchase', JSON.stringify({ digest: '', key: legacyKey }));
  const first = await retryKey('purchase', buyer);
  assert.notEqual(first, legacyKey);
  assert.equal(await retryKey('purchase', buyer), first);
  const changedEmail = { ...buyer, email: 'second@example.invalid' };
  const second = await retryKey('purchase', changedEmail);
  assert.notEqual(second, first);
  assert.equal(await retryKey('purchase', changedEmail), second);
  const changedPhone = { ...changedEmail, phone: '+70000000001' };
  const third = await retryKey('purchase', changedPhone);
  assert.notEqual(third, second);
  assert.notEqual(await retryKey('purchase', { ...changedPhone, name: 'Second Buyer' }), third);
});

test('checkout retries preserve the request key when mobile storage fails', async () => {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: () => JSON.stringify({ digest: '', key: 'a'.repeat(64) }),
      setItem() { throw new Error('storage unavailable'); },
    },
  });
  const buyer = { email: 'first@example.invalid' };
  const first = await retryKey('mobile-fixture', buyer);
  assert.equal(await retryKey('mobile-fixture', buyer), first);
  assert.notEqual(await retryKey('mobile-fixture', { email: 'second@example.invalid' }), first);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test('checkout reports field errors and shared throttling', () => {
  assert.match(checkoutErrorMessage(422, 'invalid_phone'), /телефона/);
  assert.match(checkoutErrorMessage(429, 'rate_limited'), /Слишком много попыток/);
  assert.match(checkoutErrorMessage(503, null), /недоступен/);
});
