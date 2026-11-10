import assert from 'node:assert/strict';
import { test } from 'node:test';
import { consentDocuments, isMinorAge, requiredConsentsAccepted, validCastingAge } from '../src/features/forms/consents.ts';
import { LEGAL_DOCUMENTS, documentsPublished } from '../src/content/legal.ts';

const agreed = { termsAccepted: 'yes', consent: 'yes' };
test('all application forms require two separate explicit consents', () => {
  for (const kind of ['partner', 'press']) {
    for (const data of [{}, { consent: 'yes' }, { termsAccepted: 'yes' }, { ...agreed, consent: 'no' }]) {
      assert.equal(requiredConsentsAccepted(kind, data), false);
    }
    assert.equal(requiredConsentsAccepted(kind, agreed), true);
  }
});
test('newsletter also requires advertising permission', () => {
  assert.equal(requiredConsentsAccepted('subscribe', agreed), false);
  assert.equal(requiredConsentsAccepted('subscribe', { ...agreed, advertisingConsent: 'yes' }), true);
});
test('minor candidate uses guardian consent; adult uses candidate consent', () => {
  for (const age of ['1', '17']) {
    assert.equal(isMinorAge(age), true);
    assert.equal(requiredConsentsAccepted('casting', { ...agreed, age, consentSubject: 'candidate' }), false);
    assert.equal(requiredConsentsAccepted('casting', { ...agreed, age, consentSubject: 'guardian' }), true);
    assert.ok(consentDocuments('casting', age).includes('guardian'));
  }
  assert.equal(isMinorAge('18'), false);
  assert.equal(requiredConsentsAccepted('casting', { ...agreed, age: '18', consentSubject: 'guardian' }), false);
  assert.equal(requiredConsentsAccepted('casting', { ...agreed, age: '18', consentSubject: 'candidate' }), true);
  assert.ok(consentDocuments('casting', '18').includes('casting'));
});
test('missing, nonnumeric, negative and fractional ages cannot submit', () => {
  for (const age of ['', ' ', 'NaN', 'Infinity', '0', '-1', '17.5']) {
    assert.equal(validCastingAge(age), false);
    assert.equal(requiredConsentsAccepted('casting', { ...agreed, age, consentSubject: 'candidate' }), false);
  }
});
test('a document URL without an approved version does not unlock submission', () => {
  assert.equal(documentsPublished(['terms', 'privacy']), false);
  const original = { ...LEGAL_DOCUMENTS.terms };
  try {
    LEGAL_DOCUMENTS.terms.href = '/approved-terms.pdf';
    assert.equal(documentsPublished(['terms']), false);
    LEGAL_DOCUMENTS.terms.version = '2026-11-10';
    assert.equal(documentsPublished(['terms']), true);
    assert.equal(documentsPublished(['terms', 'privacy']), false);
  } finally { Object.assign(LEGAL_DOCUMENTS.terms, original); }
});
