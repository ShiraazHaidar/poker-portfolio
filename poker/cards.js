// Card encoding: rank * 4 + suit, where rank 0 = '2' … 12 = 'A'.
export const RANKS = '23456789TJQKA';
export const SUITS = 'shdc';

export function parseCard(s) {
  if (typeof s !== 'string' || s.length !== 2) throw new Error(`Invalid card: ${s}`);
  const r = RANKS.indexOf(s[0].toUpperCase());
  const su = SUITS.indexOf(s[1].toLowerCase());
  if (r < 0 || su < 0) throw new Error(`Invalid card: ${s}`);
  return r * 4 + su;
}

export function cardToString(c) {
  return RANKS[c >> 2] + SUITS[c & 3];
}

export function fullDeck() {
  return Array.from({ length: 52 }, (_, i) => i);
}
