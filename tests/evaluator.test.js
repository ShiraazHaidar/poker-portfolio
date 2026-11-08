import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCard, cardToString, fullDeck } from '../poker/cards.js';
import { evaluate5, evaluate7, categoryOf, CATEGORY } from '../poker/evaluator.js';

const h = (s) => s.split(' ').map(parseCard);

test('parseCard / cardToString round-trip and reject bad input', () => {
  assert.equal(parseCard('As'), 48);
  assert.equal(parseCard('2s'), 0);
  assert.equal(cardToString(parseCard('Td')), 'Td');
  assert.throws(() => parseCard('Xx'));
  assert.throws(() => parseCard('A'));
});

test('fullDeck has 52 unique cards', () => {
  const d = fullDeck();
  assert.equal(d.length, 52);
  assert.equal(new Set(d).size, 52);
});

test('every category is recognised and ordered', () => {
  const hands = [
    '2s 7h 9d Jc Kd', // high card
    '2s 2h 9d Jc Kd', // pair
    '2s 2h 9d 9c Kd', // two pair
    '2s 2h 2d Jc Kd', // trips
    '5s 6h 7d 8c 9d', // straight
    '2s 7s 9s Js Ks', // flush
    '2s 2h 2d Kc Kd', // full house
    '2s 2h 2d 2c Kd', // quads
    '9s Ts Js Qs Ks', // straight flush
  ];
  let prev = -1;
  hands.forEach((hand, i) => {
    const score = evaluate5(h(hand));
    assert.equal(categoryOf(score), i, `${hand} should be ${CATEGORY[i]}`);
    assert.ok(score > prev, `${hand} should beat the previous category`);
    prev = score;
  });
});

test('kickers break ties within a category', () => {
  assert.ok(evaluate5(h('As Ah Kd 7c 3s')) > evaluate5(h('Ad Ac Qd Jc 9s')));
});

test('identical ranks in different suits tie exactly', () => {
  assert.equal(evaluate5(h('As Kh Qd Jc 9s')), evaluate5(h('Ah Kd Qc Js 9h')));
});

test('wheel is a 5-high straight below 6-high', () => {
  const wheel = evaluate5(h('As 2h 3d 4c 5s'));
  assert.equal(categoryOf(wheel), 4);
  assert.ok(wheel < evaluate5(h('2s 3h 4d 5c 6s')));
  const steelWheel = evaluate5(h('As 2s 3s 4s 5s'));
  assert.equal(categoryOf(steelWheel), 8);
  assert.ok(steelWheel < evaluate5(h('2h 3h 4h 5h 6h')));
});

test('two pair uses the kicker', () => {
  assert.ok(evaluate5(h('Ks Kh 4d 4c As')) > evaluate5(h('Kd Kc 4s 4h Qs')));
});

test('full house compares trips before pair', () => {
  assert.ok(evaluate5(h('3s 3h 3d 2c 2s')) > evaluate5(h('2d 2h 2c As Ad')));
});

test('evaluate7 picks the best five of seven', () => {
  assert.equal(categoryOf(evaluate7(h('As Ks Qs Js Ts 2d 2c'))), 8);
  assert.equal(categoryOf(evaluate7(h('2s 2h 2d 2c As Kd Qh'))), 7);
  assert.equal(evaluate7(h('As Ks Qs Js Ts 2d 2c')), evaluate5(h('As Ks Qs Js Ts')));
});
