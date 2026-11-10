import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readCookieChoice } from '../src/features/privacy/cookie-choice.ts';

test('empty, malformed and unrecognized choices do not authorize analytics', () => {
  for (const raw of [null, '', '{', 'null', '[]', 'true', '{}', '{"analytics":"yes","version":"v1"}']) {
    assert.equal(readCookieChoice(raw, 'v1'), null);
  }
});
test('analytics permission is valid only for the published current revision', () => {
  const raw = JSON.stringify({ analytics: true, version: 'v1' });
  assert.equal(readCookieChoice(raw, ''), null);
  assert.equal(readCookieChoice(raw, 'v2'), null);
  assert.deepEqual(readCookieChoice(raw, 'v1'), { analytics: true, version: 'v1' });
});
test('necessary-only choice remains a refusal when document versions change', () => {
  const raw = JSON.stringify({ analytics: false, version: '' });
  assert.deepEqual(readCookieChoice(raw, 'v2'), { analytics: false, version: '' });
});
