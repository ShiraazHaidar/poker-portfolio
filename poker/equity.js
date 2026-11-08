// Equity engine: Monte Carlo when 3+ board cards are unknown, exact enumeration otherwise.
// Pure module (no DOM) so it runs in Node tests and inside a Web Worker.
import { fullDeck } from './cards.js';
import { evaluate7 } from './evaluator.js';

export function validate({ hands, board }) {
  if (!Array.isArray(hands) || hands.length < 2 || hands.length > 4) return 'Choose 2–4 players.';
  for (let i = 0; i < hands.length; i++) {
    if (!Array.isArray(hands[i]) || hands[i].length !== 2) return `Player ${i + 1} needs 2 cards.`;
  }
  if (!Array.isArray(board) || ![0, 3, 4, 5].includes(board.length)) {
    return 'The board must have 0, 3, 4 or 5 cards.';
  }
  const seen = new Set();
  for (const c of [...hands.flat(), ...board]) {
    if (!Number.isInteger(c) || c < 0 || c > 51) return 'Invalid card.';
    if (seen.has(c)) return 'A card is used twice (duplicate).';
    seen.add(c);
  }
  return null;
}

export function equity({
  hands, board, trials = 100000, rng = Math.random, onProgress, progressEvery = 5000,
}) {
  const err = validate({ hands, board });
  if (err) throw new Error(err);

  const start = Date.now();
  const n = hands.length;
  const wins = new Float64Array(n);
  const ties = new Float64Array(n);
  const used = new Set([...hands.flat(), ...board]);
  const deck = fullDeck().filter((c) => !used.has(c));
  const missing = 5 - board.length;

  // Per-player 7-card buffers: [h0, h1, b0..b4]; known board cards filled once.
  const sevens = hands.map((hand) => [hand[0], hand[1], ...board, ...new Array(missing).fill(0)]);
  const scores = new Float64Array(n);

  function score(runout) {
    let best = -1;
    let count = 0;
    for (let p = 0; p < n; p++) {
      const s7 = sevens[p];
      for (let k = 0; k < missing; k++) s7[2 + board.length + k] = runout[k];
      const s = evaluate7(s7);
      scores[p] = s;
      if (s > best) { best = s; count = 1; } else if (s === best) count++;
    }
    for (let p = 0; p < n; p++) {
      if (scores[p] === best) {
        if (count === 1) wins[p] += 1;
        else ties[p] += 1 / count;
      }
    }
  }

  function result(done, exact) {
    const win = Array.from(wins, (w) => w / done);
    const tie = Array.from(ties, (t) => t / done);
    const ci95 = win.map((w, i) => {
      if (exact) return 0;
      const p = w + tie[i];
      return 1.96 * Math.sqrt((p * (1 - p)) / done);
    });
    return { win, tie, trials: done, exact, ci95, elapsedMs: Date.now() - start };
  }

  if (missing <= 2) {
    // Exact enumeration over every remaining runout.
    let done = 0;
    const runout = [0, 0];
    if (missing === 0) { score(runout); done = 1; }
    else if (missing === 1) {
      for (const a of deck) { runout[0] = a; score(runout); done++; }
    } else {
      for (let i = 0; i < deck.length; i++)
        for (let j = i + 1; j < deck.length; j++) {
          runout[0] = deck[i]; runout[1] = deck[j]; score(runout); done++;
        }
    }
    return result(done, true);
  }

  // Monte Carlo: partial Fisher–Yates draws only the cards needed each trial.
  const runout = new Array(missing).fill(0);
  const len = deck.length;
  for (let t = 1; t <= trials; t++) {
    for (let k = 0; k < missing; k++) {
      const j = k + Math.floor(rng() * (len - k));
      const tmp = deck[k]; deck[k] = deck[j]; deck[j] = tmp;
      runout[k] = deck[k];
    }
    score(runout);
    if (onProgress && t % progressEvery === 0 && t < trials) onProgress(result(t, false));
  }
  return result(trials, false);
}
