import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TICKET, CHECKOUT_ENABLED } from '../src/content/ticket.ts';
import { ticketTotalKopecks, formatRubles } from '../src/features/forms/ticket-order.ts';
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
test('moderation storefront cannot accept real money', () => {
  assert.equal(CHECKOUT_ENABLED, false);
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
