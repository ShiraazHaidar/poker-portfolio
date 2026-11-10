// Hand evaluator with no poker-library dependencies.
// Score = category * 16^5 + tiebreak ranks packed as base-16 digits (most significant first),
// so a higher score is always a stronger hand and equal scores are exact ties.

export const CATEGORY = [
  'High Card', 'Pair', 'Two Pair', 'Trips', 'Straight',
  'Flush', 'Full House', 'Quads', 'Straight Flush',
];

const BASE = 16 ** 5;
const WHEEL_MASK = (1 << 12) | 0b1111; // A,2,3,4,5
const counts = new Uint8Array(13);
const tb = [0, 0, 0, 0, 0];

function pack(category, n) {
  let score = 0;
  for (let i = 0; i < 5; i++) score = score * 16 + (i < n ? tb[i] : 0);
  return category * BASE + score;
}

export function categoryOf(score) {
  return Math.floor(score / BASE);
}

export function evaluate5(c) {
  counts.fill(0);
  const suit0 = c[0] & 3;
  let flush = true;
  let mask = 0;
  for (let i = 0; i < 5; i++) {
    const r = c[i] >> 2;
    counts[r]++;
    mask |= 1 << r;
    if ((c[i] & 3) !== suit0) flush = false;
  }

  let distinct = 0;
  for (let m = mask; m; m &= m - 1) distinct++;

  if (distinct === 5) {
    const high = 31 - Math.clz32(mask);
    let straightHigh = -1;
    if (high >= 4 && mask === (0x1f << (high - 4))) straightHigh = high;
    else if (mask === WHEEL_MASK) straightHigh = 3;

    if (straightHigh >= 0) {
      tb[0] = straightHigh;
      return pack(flush ? 8 : 4, 1);
    }
    let n = 0;
    for (let r = 12; r >= 0; r--) if (counts[r]) tb[n++] = r;
    return pack(flush ? 5 : 0, 5);
  }

  // Paired hands: order ranks by (count desc, rank desc).
  let n = 0;
  let first = 0;
  let second = 0;
  for (let k = 4; k >= 1; k--) {
    for (let r = 12; r >= 0; r--) {
      if (counts[r] === k) {
        if (n === 0) first = k;
        else if (n === 1) second = k;
        tb[n++] = r;
      }
    }
  }
  let category;
  if (first === 4) category = 7;
  else if (first === 3) category = second === 2 ? 6 : 3;
  else category = second === 2 ? 2 : 1;
  return pack(category, n);
}

const COMBOS_7_5 = [];
for (let a = 0; a < 7; a++)
  for (let b = a + 1; b < 7; b++)
    // the two cards left OUT are a and b
    COMBOS_7_5.push([0, 1, 2, 3, 4, 5, 6].filter((i) => i !== a && i !== b));

const five = [0, 0, 0, 0, 0];

export function evaluate7(c) {
  let best = -1;
  for (let k = 0; k < COMBOS_7_5.length; k++) {
    const idx = COMBOS_7_5[k];
    for (let i = 0; i < 5; i++) five[i] = c[idx[i]];
    const s = evaluate5(five);
    if (s > best) best = s;
  }
  return best;
}
