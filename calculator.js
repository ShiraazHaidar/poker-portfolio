// Hidden equity calculator: UI over the poker engine, which runs in a module Web Worker.
import { validate } from './poker/equity.js';
import { parseCard, cardToString, RANKS, SUITS } from './poker/cards.js';

const SOURCE_URL = 'https://github.com/ShiraazHaidar/poker-portfolio/blob/main/poker/evaluator.js';
const TRIALS = 100000;
const SUIT_SYMBOL = { s: '♠', h: '♥', d: '♦', c: '♣' };
const SUIT_NAME = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
const RANK_NAME = { T: '10', J: 'Jack', Q: 'Queen', K: 'King', A: 'Ace' };

const state = {
  seats: [[parseCard('As'), parseCard('Ah')], [parseCard('Ks'), parseCard('Kh')]],
  board: [null, null, null, null, null],
  active: { kind: 'board', j: 0 }, // { kind: 'seat', i, j } | { kind: 'board', j } | null
  worker: null,
  result: null,
  running: false,
};

let dialog;
let opener = null;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

const isRed = (c) => { const s = cardToString(c)[1]; return s === 'h' || s === 'd'; };
const cardLabel = (c) => {
  const [r, s] = cardToString(c);
  return `${RANK_NAME[r] ?? r} of ${SUIT_NAME[s]}`;
};
const cardFace = (c) => {
  const [r, s] = cardToString(c);
  return `${r === 'T' ? '10' : r}${SUIT_SYMBOL[s]}`;
};

function usedCards() {
  return new Set([...state.seats.flat(), ...state.board].filter((c) => c != null));
}

function currentInput() {
  return {
    hands: state.seats.map((s) => s.filter((c) => c != null)),
    board: state.board.filter((c) => c != null),
  };
}

function slotsInOrder() {
  const out = [];
  state.seats.forEach((s, i) => s.forEach((_, j) => out.push({ kind: 'seat', i, j })));
  state.board.forEach((_, j) => out.push({ kind: 'board', j }));
  return out;
}
const getSlot = (a) => (a.kind === 'seat' ? state.seats[a.i][a.j] : state.board[a.j]);
function setSlot(a, value) {
  if (a.kind === 'seat') state.seats[a.i][a.j] = value;
  else state.board[a.j] = value;
}
const sameSlot = (a, b) => a && b && a.kind === b.kind && a.i === b.i && a.j === b.j;

function nextEmpty(after) {
  const all = slotsInOrder();
  const start = after ? all.findIndex((s) => sameSlot(s, after)) + 1 : 0;
  for (let k = 0; k < all.length; k++) {
    const s = all[(start + k) % all.length];
    if (getSlot(s) == null) return s;
  }
  return null;
}

function invalidate() {
  stopWorker();
  state.result = null;
  render();
}

// ---------- Rendering ----------

function slotButton(a, label) {
  const card = getSlot(a);
  const active = sameSlot(a, state.active);
  const btn = el('button', {
    type: 'button',
    class: `eq-slot${card != null ? ' is-filled' : ''}${active ? ' is-active' : ''}${card != null && isRed(card) ? ' is-red' : ''}`,
    'aria-label': card != null ? `${label}: ${cardLabel(card)}. Click to clear.` : `${label}: empty. Click to choose.`,
    'aria-pressed': active ? 'true' : 'false',
    'data-focus-key': a.kind === 'seat' ? `seat-${a.i}-${a.j}` : `board-${a.j}`,
  }, card != null ? cardFace(card) : '+');
  btn.addEventListener('click', () => {
    if (card != null) setSlot(a, null);
    state.active = a;
    invalidate();
  });
  return btn;
}

function renderSeats() {
  const r = state.result;
  const box = dialog.querySelector('[data-eq="seats"]');
  box.replaceChildren(...state.seats.map((seat, i) => {
    const win = r ? r.win[i] : 0;
    const tie = r ? r.tie[i] : 0;
    return el('div', { class: 'eq-seat' },
      el('p', { class: 'eq-seat-name' }, `Player ${i + 1}`),
      el('div', { class: 'eq-slots' }, seat.map((_, j) => slotButton({ kind: 'seat', i, j }, `Player ${i + 1} card ${j + 1}`))),
      el('div', { class: 'eq-bar', 'aria-hidden': 'true' },
        el('span', { class: 'eq-bar-win', style: `width:${(win * 100).toFixed(2)}%` }),
        el('span', { class: 'eq-bar-tie', style: `width:${(tie * 100).toFixed(2)}%` })),
      el('p', { class: 'eq-pct' },
        r ? el('strong', {}, `${((win + tie) * 100).toFixed(1)}%`) : el('strong', {}, '—'),
        r ? ` win ${(win * 100).toFixed(1)}% · tie ${(tie * 100).toFixed(1)}%` : ' equity'));
  }));
}

function renderBoard() {
  dialog.querySelector('[data-eq="board"]').replaceChildren(
    ...state.board.map((_, j) => slotButton({ kind: 'board', j }, `Board card ${j + 1}`)));
}

function renderGrid() {
  const used = usedCards();
  const grid = dialog.querySelector('[data-eq="grid"]');
  const buttons = [];
  for (const s of SUITS) {
    for (let r = RANKS.length - 1; r >= 0; r--) {
      const card = parseCard(RANKS[r] + s);
      const taken = used.has(card);
      const btn = el('button', {
        type: 'button',
        class: `eq-card${isRed(card) ? ' is-red' : ''}`,
        disabled: taken || !state.active,
        'data-focus-key': `card-${card}`,
        'aria-label': `${cardLabel(card)}${taken ? ' (in use)' : ''}`,
      }, cardFace(card));
      btn.addEventListener('click', () => {
        if (!state.active) return;
        setSlot(state.active, card);
        state.active = nextEmpty(state.active);
        invalidate();
      });
      buttons.push(btn);
    }
  }
  grid.replaceChildren(...buttons);
  dialog.querySelector('[data-eq="grid-hint"]').textContent = state.active
    ? 'Pick a card for the highlighted slot.'
    : 'Click any slot above, then pick a card.';
}

function renderControls() {
  const error = validate(currentInput());
  const run = dialog.querySelector('[data-eq="run"]');
  run.disabled = Boolean(error);
  run.setAttribute('aria-disabled', String(Boolean(error) || state.running));
  run.textContent = state.running ? 'Running…' : 'Run the numbers';
  dialog.querySelector('[data-eq="hint"]').textContent = error ?? '';
  dialog.querySelector('[data-eq="add"]').disabled = state.seats.length >= 4;
  dialog.querySelector('[data-eq="remove"]').disabled = state.seats.length <= 2;

  const meta = dialog.querySelector('[data-eq="meta"]');
  const r = state.result;
  if (!r) meta.textContent = 'Ready.';
  else if (r.exact) meta.textContent = `Exact · enumerated ${r.trials.toLocaleString()} runout${r.trials === 1 ? '' : 's'}`;
  else {
    const rate = r.elapsedMs > 0 ? Math.round((r.trials / r.elapsedMs) * 1000) : 0;
    const ci = Math.max(...r.ci95);
    meta.textContent = `${r.trials.toLocaleString()} trials · ${rate.toLocaleString()}/s · ±${(ci * 100).toFixed(2)}% (95% CI)`;
  }
}

// Re-rendering replaces buttons, so put keyboard focus back on the equivalent element.
function withFocus(fn) {
  const focused = document.activeElement;
  const key = dialog.contains(focused) ? focused?.dataset?.focusKey : null;
  fn();
  if (!key) return;
  let target = dialog.querySelector(`[data-focus-key="${key}"]`);
  if (target?.disabled && key.startsWith('card-')) {
    // The card just picked is now in use: move to the next card still available.
    const cards = [...dialog.querySelectorAll('.eq-card')];
    const at = cards.indexOf(target);
    target = [...cards.slice(at + 1), ...cards.slice(0, at)].find((b) => !b.disabled)
      ?? dialog.querySelector('[data-eq="run"]');
  }
  if (target && !target.disabled) target.focus({ preventScroll: true });
}

function render() {
  withFocus(() => {
    renderSeats();
    renderBoard();
    renderGrid();
    renderControls();
  });
}

// ---------- Worker ----------

function stopWorker() {
  if (state.worker) state.worker.terminate();
  state.worker = null;
  state.running = false;
}

function run() {
  const input = currentInput();
  if (state.running || validate(input)) return;
  stopWorker();
  state.running = true;
  state.result = null;
  const worker = new Worker(new URL('./poker/worker.js', import.meta.url), { type: 'module' });
  state.worker = worker;
  worker.onmessage = (e) => {
    if (state.worker !== worker) return;
    const msg = e.data;
    if (msg.type === 'error') {
      stopWorker();
      dialog.querySelector('[data-eq="hint"]').textContent = msg.message;
      return;
    }
    state.result = msg.result;
    if (msg.type === 'done') stopWorker();
    withFocus(() => { renderSeats(); renderControls(); });
  };
  worker.onerror = () => {
    stopWorker();
    renderControls();
    dialog.querySelector('[data-eq="hint"]').textContent = 'The simulation could not start in this browser.';
  };
  worker.postMessage({ ...input, trials: TRIALS });
  withFocus(() => { renderSeats(); renderControls(); });
}

// ---------- Dialog ----------

function buildDialog() {
  dialog = el('dialog', { id: 'equity', class: 'equity', 'aria-labelledby': 'equity-title' },
    el('div', { class: 'eq-head' },
      el('div', {},
        el('p', { class: 'street-label' }, 'Hidden extra'),
        el('h2', { id: 'equity-title' }, 'Run the numbers')),
      el('button', { type: 'button', class: 'eq-close', 'aria-label': 'Close calculator', 'data-eq': 'close', 'data-focus-key': 'close' }, '×')),
    el('p', { class: 'eq-intro' },
      'Pick hole cards for 2–4 players and an optional board. Odds are computed in a Web Worker and update live.'),
    el('div', { class: 'eq-seats', 'data-eq': 'seats' }),
    el('div', { class: 'eq-board-row' },
      el('p', { class: 'eq-seat-name' }, 'Board'),
      el('div', { class: 'eq-slots eq-board', 'data-eq': 'board' })),
    el('div', { class: 'eq-controls' },
      el('button', { type: 'button', class: 'btn btn-brass', 'data-eq': 'run', 'data-focus-key': 'run' }, 'Run the numbers'),
      el('button', { type: 'button', class: 'btn btn-ghost', 'data-eq': 'add', 'data-focus-key': 'add' }, '+ Player'),
      el('button', { type: 'button', class: 'btn btn-ghost', 'data-eq': 'remove', 'data-focus-key': 'remove' }, '− Player'),
      el('button', { type: 'button', class: 'btn btn-ghost', 'data-eq': 'clear', 'data-focus-key': 'clear' }, 'Clear')),
    el('p', { class: 'eq-hint', role: 'status', 'data-eq': 'hint' }),
    el('p', { class: 'eq-meta', 'aria-live': 'polite', 'data-eq': 'meta' }),
    el('p', { class: 'eq-grid-hint', 'data-eq': 'grid-hint' }),
    el('div', { class: 'eq-grid', role: 'group', 'aria-label': 'Deck', 'data-eq': 'grid' }),
    el('details', { class: 'eq-how' },
      el('summary', {}, 'How it works'),
      el('p', {},
        'Each hand is scored by a 7-card evaluator that uses no poker libraries: it checks all 21 five-card combinations and ranks them by category, then kickers. ',
        'Preflop, a Web Worker deals 100,000 random runouts (Monte Carlo) and reports each player’s share of wins and split pots, with a 95% confidence interval. ',
        'Once the flop is known there are at most 1,081 runouts left, so it enumerates every one for an exact answer.'),
      el('a', { href: SOURCE_URL, target: '_blank', rel: 'noopener' }, 'Read the evaluator source on GitHub →')));

  // All content sits in one full-size wrapper, so only a true backdrop click targets the <dialog>.
  const body = el('div', { class: 'eq-body' });
  body.append(...dialog.childNodes);
  dialog.append(body);

  dialog.querySelector('[data-eq="close"]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-eq="run"]').addEventListener('click', run);
  dialog.querySelector('[data-eq="add"]').addEventListener('click', () => {
    if (state.seats.length >= 4) return;
    state.seats.push([null, null]);
    state.active = { kind: 'seat', i: state.seats.length - 1, j: 0 };
    invalidate();
  });
  dialog.querySelector('[data-eq="remove"]').addEventListener('click', () => {
    if (state.seats.length <= 2) return;
    state.seats.pop();
    if (state.active?.kind === 'seat' && state.active.i >= state.seats.length) state.active = null;
    invalidate();
  });
  dialog.querySelector('[data-eq="clear"]').addEventListener('click', () => {
    state.seats = state.seats.map(() => [null, null]);
    state.board = [null, null, null, null, null];
    state.active = { kind: 'seat', i: 0, j: 0 };
    invalidate();
  });
  // Click on the backdrop closes the dialog.
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    stopWorker();
    renderControls();
    opener?.focus();
  });
  document.body.append(dialog);
}

function open(from) {
  opener = from ?? document.activeElement;
  render();
  dialog.showModal();
}

export function initCalculator() {
  buildDialog();
  for (const id of ['dealer-btn', 'equity-chip']) {
    const btn = document.getElementById(id);
    btn?.addEventListener('click', () => open(btn));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'e' && e.key !== 'E') return;
    if (e.metaKey || e.ctrlKey || e.altKey || dialog.open) return;
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    open(document.activeElement);
  });
}
