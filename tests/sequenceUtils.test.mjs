import test from 'node:test';
import assert from 'node:assert/strict';
import { clean, stats, rc } from '../src/sequenceUtils.js';

test('clean normalises DNA and removes invalid characters', () => {
  assert.equal(clean('a c-gTxN!'), 'ACGTN');
});

test('reverse complement is correct', () => {
  assert.equal(rc('ACGTN'), 'NACGT');
});

test('stats returns correct length, nucleotide counts, GC and AT', () => {
  const result = stats('AACCGGTN');
  assert.equal(result.n, 8);
  assert.deepEqual(result.c, { A: 2, C: 2, G: 2, T: 1, N: 1 });
  assert.equal(result.gc, '50.00');
  assert.equal(result.at, '37.50');
});

test('empty sequence statistics are safe', () => {
  const result = stats('');
  assert.equal(result.n, 0);
  assert.equal(result.gc, '0.00');
  assert.equal(result.at, '0.00');
});
