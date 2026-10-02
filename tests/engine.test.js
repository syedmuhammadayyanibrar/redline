import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarios } from '../js/data.js';
import { check, contextOnly } from '../js/engine.js';

test('Full mode: Naive agent violations match [2, 2, 2, 2, 2, 1]', () => {
  const expected = [2, 2, 2, 2, 2, 1];
  const actual = scenarios.map(sc => check({ meta: sc.meta, lines: sc.naive }, 'full').length);
  assert.deepEqual(actual, expected);
});

test('Full mode: Guarded agent violations match [0, 0, 0, 0, 0, 0]', () => {
  const expected = [0, 0, 0, 0, 0, 0];
  const actual = scenarios.map(sc => check({ meta: sc.meta, lines: sc.guard }, 'full').length);
  assert.deepEqual(actual, expected);
});

test('Turn mode: Scenarios 2 and 4 naive drop to 0 violations ([2, 0, 2, 0, 2, 1])', () => {
  const expected = [2, 0, 2, 0, 2, 1];
  const actual = scenarios.map(sc => check({ meta: sc.meta, lines: sc.naive }, 'turn').length);
  assert.deepEqual(actual, expected);
});

test('Turn mode: Guarded agent remains clean [0, 0, 0, 0, 0, 0]', () => {
  const expected = [0, 0, 0, 0, 0, 0];
  const actual = scenarios.map(sc => check({ meta: sc.meta, lines: sc.guard }, 'turn').length);
  assert.deepEqual(actual, expected);
});

test('Custom transcript: exactly 3 violations (Missing disclosure L0, Cease L2, Threat L2)', () => {
  const custom = {
    meta: { time: '20:30', calls7: 3, third: false },
    lines: [
      ['ag', 'Hi, this is Sam about your $640 balance.'],
      ['bo', 'Please stop calling me.'],
      ['ag', "If you don't pay this week we will sue you."]
    ]
  };

  const violations = check(custom, 'full');
  assert.equal(violations.length, 3);

  // Line 0: Missing disclosure
  const v0 = violations.filter(v => v.i === 0);
  assert.equal(v0.length, 1);
  assert.equal(v0[0].rule, 'Missing disclosure');
  assert.equal(v0[0].cite, 'FDCPA §807(11)');

  // Line 2: Cease communication and Threat
  const v2 = violations.filter(v => v.i === 2);
  assert.equal(v2.length, 2);

  const rulesAt2 = v2.map(v => v.rule);
  assert.ok(rulesAt2.includes('Cease communication'));
  assert.ok(rulesAt2.includes('Threat'));
});

test('contextOnly returns violations present in full mode but missed in turn mode', () => {
  // Scenario 2 Naive (Stop calling me) has Cease communication context-only
  const s2 = { meta: scenarios[1].meta, lines: scenarios[1].naive };
  const missedS2 = contextOnly(s2);
  assert.equal(missedS2.length, 2);
  assert.ok(missedS2.every(v => v.rule === 'Cease communication'));

  // Scenario 4 Naive (That\'s not my debt) has Disputed debt context-only
  const s4 = { meta: scenarios[3].meta, lines: scenarios[3].naive };
  const missedS4 = contextOnly(s4);
  assert.equal(missedS4.length, 2);
  assert.ok(missedS4.every(v => v.rule === 'Disputed debt'));

  // Guarded scenarios have 0 context-only violations
  scenarios.forEach(sc => {
    assert.equal(contextOnly({ meta: sc.meta, lines: sc.guard }).length, 0);
  });
});
