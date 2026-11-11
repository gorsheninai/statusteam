import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TICKET, CHECKOUT_ENABLED } from '../src/content/ticket.ts';
import { ticketTotalKopecks, formatRubles } from '../src/features/forms/ticket-order.ts';

test('confirmed price and integer order total are in kopecks', () => {
  assert.equal(TICKET.priceKopecks, 2_500_000);
  assert.equal(ticketTotalKopecks(1, TICKET.priceKopecks, TICKET.capacity), 2_500_000);
  assert.equal(ticketTotalKopecks(2, TICKET.priceKopecks, TICKET.capacity), 5_000_000);
  assert.equal(ticketTotalKopecks(100, TICKET.priceKopecks, TICKET.capacity), 250_000_000);
  assert.match(formatRubles(5_000_000), /50\s000\s₽/);
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
