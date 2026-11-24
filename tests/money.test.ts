// Run with: npm test   (Node 22.18+ runs TypeScript directly)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyKey, computeTip, formatMinor, formatRawInput, rawToMinor } from '../src/money.ts';

const usd = { locale: 'en-US', currency: 'USD', fractionDigits: 2 };
const base = { tipPct: 20, people: 1, roundUp: false, excludeTax: false, taxRate: 0, fractionDigits: 2 };

const type = (keys: string[], fd = 2) => keys.reduce((raw, k) => applyKey(raw, k, fd), '');

test('keypad input rules', () => {
  assert.equal(type(['8', '4', '.', '2', '1']), '84.21');
  assert.equal(type(['.', '5']), '0.5');
  assert.equal(type(['0', '0', '7']), '7');
  assert.equal(type(['1', '.', '2', '3', '4']), '1.23'); // max 2 decimals
  assert.equal(type(['1', '.', '.', '5']), '1.5'); // one separator
  assert.equal(type(['1', '2', '3', '4', '5', '6', '7', '8']), '1234567'); // 7 integer digits
  assert.equal(type(['5', '.'], 0), '5'); // zero-decimal currency ignores '.'
  assert.equal(applyKey('12.5', 'back', 2), '12.');
  assert.equal(applyKey('12.5', 'clear', 2), '');
});

test('raw input to minor units', () => {
  assert.equal(rawToMinor('84.21', 2), 8421);
  assert.equal(rawToMinor('84.2', 2), 8420);
  assert.equal(rawToMinor('84.', 2), 8400);
  assert.equal(rawToMinor('', 2), 0);
  assert.equal(rawToMinor('1500', 0), 1500);
});

test('formats as typed', () => {
  assert.equal(formatRawInput('1234.5', usd), '$1,234.5');
  assert.equal(formatRawInput('12.', usd), '$12.');
  assert.equal(formatRawInput('0.05', usd), '$0.05');
  assert.equal(formatMinor(10105, usd), '$101.05');
  const eur = { locale: 'de-DE', currency: 'EUR', fractionDigits: 2 };
  assert.equal(formatRawInput('1234.5', eur).replace(/\s/g, ' '), '1.234,5 €');
});

test('basic tip', () => {
  const r = computeTip({ ...base, billMinor: 8425 });
  assert.equal(r.tipMinor, 1685);
  assert.equal(r.totalMinor, 10110);
  assert.equal(r.shareMinor, 10110);
  assert.equal(r.lowerCount, 0);
});

test('uneven split never loses a cent', () => {
  const r = computeTip({ ...base, billMinor: 8421, people: 3 });
  assert.equal(r.totalMinor, 10105);
  assert.equal(r.shareMinor, 3369);
  assert.equal(r.lowerCount, 2);
  const collected = r.shareMinor * (3 - r.lowerCount) + (r.shareMinor - 1) * r.lowerCount;
  assert.equal(collected, r.totalMinor);
});

test('every split adds up exactly', () => {
  for (let bill = 1; bill < 5000; bill += 37) {
    for (let people = 1; people <= 12; people++) {
      const r = computeTip({ ...base, billMinor: bill, people, tipPct: 18 });
      const collected = r.shareMinor * (people - r.lowerCount) + (r.shareMinor - 1) * r.lowerCount;
      assert.equal(collected, r.totalMinor, `bill ${bill} people ${people}`);
    }
  }
});

test('round up per person', () => {
  const r = computeTip({ ...base, billMinor: 8421, people: 3, roundUp: true });
  assert.equal(r.shareMinor, 3400);
  assert.equal(r.totalMinor, 10200);
  assert.equal(r.tipMinor, 10200 - 8421);
  assert.ok(r.adjusted);
  const even = computeTip({ ...base, billMinor: 10000, tipPct: 20, roundUp: true });
  assert.equal(even.totalMinor, 12000);
  assert.equal(even.adjusted, false);
});

test('tip before tax', () => {
  // $108.88 receipt at 8.875% tax → $100.00 subtotal → $20.00 tip.
  const r = computeTip({ ...base, billMinor: 10888, excludeTax: true, taxRate: 8.875 });
  assert.equal(r.baseMinor, 10000);
  assert.equal(r.tipMinor, 2000);
  assert.equal(r.totalMinor, 12888);
});

test('zero-decimal currency rounds to 100', () => {
  const r = computeTip({ ...base, billMinor: 4380, fractionDigits: 0, people: 2, roundUp: true, tipPct: 10 });
  assert.equal(r.shareMinor, 2500);
});

test('empty bill', () => {
  const r = computeTip({ ...base, billMinor: 0, people: 4, roundUp: true });
  assert.equal(r.totalMinor, 0);
  assert.equal(r.shareMinor, 0);
});
