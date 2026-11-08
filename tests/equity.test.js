import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCard } from '../poker/cards.js';
import { equity, validate } from '../poker/equity.js';

const h = (s) => s.split(' ').map(parseCard);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const near = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: ${actual} not within ${tol} of ${expected}`);

test('AA vs KK preflop', () => {
  const r = equity({ hands: [h('As Ah'), h('Ks Kh')], board: [], trials: 200000, rng: mulberry32(42) });
  near(r.win[0], 0.8237, 0.005, 'AA win'); // exact enumeration: 82.365%
  near(r.win[1], 0.1709, 0.005, 'KK win'); // exact: 17.092%
  assert.equal(r.exact, false);
  assert.equal(r.trials, 200000);
  assert.ok(r.ci95[0] > 0 && r.ci95[0] < 0.01);
});

test('AKs vs QQ preflop', () => {
  const r = equity({ hands: [h('As Ks'), h('Qd Qc')], board: [], trials: 200000, rng: mulberry32(42) });
  near(r.win[0] + r.tie[0], 0.46, 0.006, 'AKs equity');
});

test('exact river', () => {
  const r = equity({ hands: [h('As Ah'), h('Ks Kh')], board: h('2c 7d 9h Js 3c') });
  assert.deepEqual(r.win, [1, 0]);
  assert.equal(r.exact, true);
  assert.equal(r.trials, 1);
  assert.deepEqual(r.ci95, [0, 0]);
});

test('exact turn', () => {
  const r = equity({ hands: [h('As Ah'), h('Ks Kh')], board: h('Kd 7d 9h 2c') });
  assert.equal(r.exact, true);
  assert.equal(r.trials, 44);
  near(r.win[0], 2 / 44, 1e-9, 'AA outs');
  near(r.win[1], 42 / 44, 1e-9, 'KK holds');
});

test('chopped board splits the pot', () => {
  const r = equity({ hands: [h('2c 3d'), h('4c 5d')], board: h('As Ks Qs Js Ts') });
  assert.deepEqual(r.tie, [0.5, 0.5]);
  assert.deepEqual(r.win, [0, 0]);
});

test('equity rejects duplicate cards', () => {
  assert.throws(() => equity({ hands: [h('As Ah'), h('As Kh')], board: [] }), /duplicate/i);
  assert.match(validate({ hands: [h('As Ah'), h('Kd Kh')], board: h('Ah 2c 3d') }), /duplicate/i);
});

test('equity rejects incomplete input', () => {
  assert.throws(() => equity({ hands: [h('As'), h('Ks Kh')], board: [] }), /2 cards/);
  assert.throws(() => equity({ hands: [h('As Ah'), h('Ks Kh')], board: h('2c 3d') }), /board/i);
  assert.throws(() => equity({ hands: [h('As Ah')], board: [] }), /2.4 players/);
  assert.equal(validate({ hands: [h('As Ah'), h('Ks Kh')], board: [] }), null);
});

test('progress callback fires', () => {
  let calls = 0;
  equity({
    hands: [h('As Ah'), h('Ks Kh')], board: [], trials: 20000, progressEvery: 5000,
    rng: mulberry32(1), onProgress: () => calls++,
  });
  assert.ok(calls >= 3, `expected >=3 progress calls, got ${calls}`);
});

test('exact flop enumerates every turn and river', () => {
  const r = equity({ hands: [h('As Ah'), h('Ks Kh')], board: h('2c 7d 9h') });
  assert.equal(r.exact, true);
  assert.equal(r.trials, 990); // C(45, 2)
  assert.deepEqual(r.ci95, [0, 0]);
  near(r.win[0] + r.tie[0] + r.win[1] + r.tie[1], 1, 1e-9, 'equities sum to 1');
});

test('four players with a three-way split', () => {
  // Board AA KK 7: three players play AAKK with a queen kicker; the 8 kicker loses.
  const r = equity({
    hands: [h('Qh 3c'), h('Qd 4c'), h('Qc 5h'), h('8h 3d')],
    board: h('As Ad Ks Kd 7c'),
  });
  assert.deepEqual(r.win, [0, 0, 0, 0]);
  r.tie.slice(0, 3).forEach((t) => near(t, 1 / 3, 1e-12, 'three-way share'));
  assert.equal(r.tie[3], 0);
});
