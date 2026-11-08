# Poker Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Shiraaz Haidar's poker-themed one-page portfolio with a working, tested Monte Carlo equity calculator, ready to deploy free on Netlify.

**Architecture:**
- **Engine:** The poker engine (`poker/`) is pure ES modules with no DOM access. It is unit-tested with `node --test` and runs in the browser inside a module Web Worker.
- **Page:** The page is static HTML whose sections are rendered from a single `content.js` data module by `main.js`. GSAP ScrollTrigger adds one-shot reveal animations on top of content that is already visible without JavaScript.

**Tech Stack:**
- HTML, CSS and vanilla JS as ES modules, with no build step.
- GSAP 3.12.5 + ScrollTrigger from cdnjs.
- Google Fonts: Playfair Display, Inter, JetBrains Mono.
- Node 26 test runner.
- Netlify for hosting.

**Spec:** `docs/superpowers/specs/2026-11-08-poker-portfolio-design.md`

## Global Constraints

- **Dependencies:** No build step. The only runtime dependency is GSAP (`https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` and `.../ScrollTrigger.min.js`).
- **Privacy:** No phone number and no hometown anywhere on the site.
- **No banner:** No target-role banner.
- **Content:** All personal copy lives in `content.js`. Contact details:
  - email `shiraazh@umich.edu`
  - GitHub `https://github.com/ShiraazHaidar`
  - LinkedIn `https://www.linkedin.com/in/shiraazhaidar/`
  - AWSFinance `https://github.com/ShiraazHaidar/AWSFinance`
- **Palette tokens:** felt `#0f3d2e`, ivory card face `#f5efe0`, brass `#c9a24a`, suit red `#b3262e`, near-black `#07130e`.
- **Fonts:** Playfair Display for headings, Inter for body, JetBrains Mono for numbers.
- **Layout and motion:**
  - Works from 360px wide with no horizontal scroll.
  - Under `prefers-reduced-motion: reduce`, there is no animation and every element is in its final state.
  - Scrolling is never hijacked: no scroll pinning that blocks normal scrolling.
- **Weight:** First load under ~300 KB, excluding fonts.

## Review Focus

1. **Shared card picked twice:** If the same card is chosen for two players, or for a player and the board, the calculator refuses to run and the grid shows that card as disabled. It must never return nonsense odds. Tested in Task 2 (`equity rejects duplicate cards`) and enforced in the UI in Task 5.
2. **Wheel straight:** A-2-3-4-5 ranks as a 5-high straight (and a steel wheel as a 5-high straight flush), below 2-3-4-5-6. Tested in Task 1.
3. **Incomplete hands:** If any player has fewer than 2 cards, or the board has 1–2 cards, the Run button is disabled with a hint. An "unfinished" flop can't be simulated meaningfully, so it is rejected rather than guessed. Tested in Task 2 (`equity rejects incomplete input`).
4. **GSAP CDN blocked or JS slow:** All content is still visible and readable, because animations only start from a hidden state when GSAP has loaded. Verified in Task 4.
5. **Phone width:** At 360px wide, the flop's three cards stack vertically, the nav doesn't overflow, and the calculator overlay scrolls inside itself. Verified in Tasks 3 and 5.

---

### Task 1: Hand evaluator

**Files:**
- Create: `poker/cards.js`, `poker/evaluator.js`, `package.json`
- Test: `tests/evaluator.test.js`

**Interfaces:**
- Produces:
  - `cards.js`:
    - `RANKS = '23456789TJQKA'`
    - `SUITS = 'shdc'`
    - `parseCard(s: string) -> number`, where a card is `rank*4 + suit`, `rank` runs 0 (2) to 12 (A), and an invalid string throws.
    - `cardToString(c: number) -> string`
    - `fullDeck() -> number[]` (52 cards)
  - `evaluator.js`:
    - `evaluate5(cards: number[5]) -> number` and `evaluate7(cards: number[7]) -> number`. A higher score is a stronger hand, and equal scores are exact ties.
    - `CATEGORY = ['High Card','Pair','Two Pair','Trips','Straight','Flush','Full House','Quads','Straight Flush']`
    - `categoryOf(score) -> number` (an index into CATEGORY)
- Score encoding: `category * 16**5 + tiebreak ranks packed as base-16 digits` (most significant first).

- [ ] **Step 1: Create `package.json`**

Fields: `{"name":"poker-portfolio","private":true,"type":"module","scripts":{"test":"node --test tests/"}}`.

- [ ] **Step 2: Write the failing tests in `tests/evaluator.test.js`**

Helper: `h = s => s.split(' ').map(parseCard)`.

Tests:
- `parseCard('As') === 50`, `cardToString(parseCard('Td')) === 'Td'`, and `parseCard('Xx')` throws.
- `fullDeck().length === 52`, with no duplicates.
- **Category ordering:** `categoryOf(evaluate5(...))` gives the expected index for one hand of each category, in order: `'2s 7h 9d Jc Kd'` → 0, `'2s 2h 9d Jc Kd'` → 1, … `'9s Ts Js Qs Ks'` → 8. Each score is strictly greater than the previous one.
- **Kickers:** `evaluate5(h('As Ah Kd 7c 3s')) > evaluate5(h('Ad Ac Qd Jc 9s'))`.
- **Exact tie:** `evaluate5(h('As Kh Qd Jc 9s')) === evaluate5(h('Ah Kd Qc Js 9h'))`.
- **Wheel:**
  - `evaluate5(h('As 2h 3d 4c 5s'))` is category 4, and it is `< evaluate5(h('2s 3h 4d 5c 6s'))`.
  - `h('As 2s 3s 4s 5s')` is category 8.
- **Two pair kicker:** `h('Ks Kh 4d 4c As') > h('Kd Kc 4s 4h Qs')`.
- **Full house compare:** `h('3s 3h 3d 2c 2s') > h('2d 2h 2c As Ad')`.
- **evaluate7 picks the best 5:** `categoryOf(evaluate7(h('As Ks Qs Js Ts 2d 2c'))) === 8`, and `evaluate7(h('2s 2h 2d 2c As Kd Qh'))` is category 7.

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `npm test`. Expected: FAIL (modules not found).

- [ ] **Step 4: Implement `cards.js` and `evaluator.js`**

- `evaluate5`:
  - Count ranks.
  - Check for a flush: all suits equal.
  - Check for a straight: 5 distinct ranks with `max-min==4`, or the wheel set `{12,0,1,2,3}`, whose high rank is 3.
  - Order the tiebreak ranks by (count desc, rank desc).
- `evaluate7`: the max of `evaluate5` over the 21 combinations, using a precomputed `COMBOS_7_5` index table.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npm test`. Expected: all evaluator tests PASS.

- [ ] **Step 6: Commit**

`git add package.json poker/cards.js poker/evaluator.js tests/evaluator.test.js && git commit -m "feat: poker hand evaluator with tests"`

---

### Task 2: Equity engine and worker

**Files:**
- Create: `poker/equity.js`, `poker/worker.js`
- Test: `tests/equity.test.js`

**Interfaces:**
- Consumes: `evaluate7`, `fullDeck`, `parseCard` from Task 1.
- Produces:
  - `validate({hands: number[][], board: number[]}) -> string|null`, which returns an error message or null. Rules:
    - 2–4 hands, each with exactly 2 cards.
    - A board of 0, 3, 4 or 5 cards.
    - No duplicate cards.
  - `equity({hands, board, trials = 100000, rng = Math.random, onProgress, progressEvery = 5000}) -> {win: number[], tie: number[], trials: number, exact: boolean, ci95: number[], elapsedMs: number}`.
    - `win[i]` and `tie[i]` are fractions in [0,1].
    - `ci95[i]` is the half-width `1.96*sqrt(p(1-p)/n)` for win+tie/2 equity, and is 0 when the result is exact.
    - It throws `Error(validate(...))` on invalid input.
    - With 4 or 5 board cards it enumerates every runout (`exact: true`, and `trials` is the number of runouts). Otherwise it runs Monte Carlo.
    - A split pot among k players adds `1/k` to each tied player's `tie` share, so `win[i] + tie[i]` is player i's equity.
    - `onProgress(partialResult)` is called every `progressEvery` trials.
  - `worker.js`:
    - On receiving `{hands, board, trials}` it runs `equity`.
    - It posts `{type:'progress', result}` during the run, then `{type:'done', result}` at the end, or `{type:'error', message}` on failure.
    - It uses `self.onmessage`, and is loaded as `new Worker(new URL('./poker/worker.js', import.meta.url), {type:'module'})`.

- [ ] **Step 1: Write the failing tests in `tests/equity.test.js`**

Use a seeded RNG: mulberry32, defined in the test file, with seed `42`.

Tests:
- **`AA vs KK preflop`:** `equity({hands:[h('As Ah'),h('Ks Kh')], board:[], trials:200000, rng})`. Expect `win[0]` within ±0.005 of 0.819, `win[1]` within ±0.005 of 0.178, and `exact === false`.
- **`AKs vs QQ preflop`:** `[h('As Ks'), h('Qd Qc')]`, 200k trials. Expect `win[0]+tie[0]` within ±0.006 of 0.460.
- **`exact river`:** hands `[h('As Ah'), h('Ks Kh')]`, board `h('2c 7d 9h Js 3c')`. Expect `win` deep-equal to `[1,0]`, `exact === true` and `trials === 1`.
- **`exact turn`:** hands `[h('As Ah'), h('Ks Kh')]`, board `h('Kd 7d 9h 2c')`. Expect `exact`, `trials === 44`, and `win[0]` close to `2/44` (only the two remaining Aces, Ad and Ac, save AA). Allow a 1e-9 tolerance.
- **`chopped board`:** hands `[h('2c 3d'), h('4c 5d')]`, board `h('As Ks Qs Js Ts')`. Expect `tie` deep-equal to `[0.5, 0.5]`.
- **`equity rejects duplicate cards`:** `[h('As Ah'), h('As Kh')]` throws a message matching `/duplicate/i`.
- **`equity rejects incomplete input`:** a single-card hand throws `/2 cards/`, a 2-card board throws `/board/i`, and 1 hand throws `/2.4 players/`.
- **`progress callback fires`:** with trials 20000 and progressEvery 5000, `onProgress` is called at least 3 times.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`. Expected: the equity tests FAIL (module not found).

- [ ] **Step 3: Implement `validate` and `equity` in `poker/equity.js`, and `poker/worker.js`**

- **Monte Carlo:**
  - Build the remaining deck once.
  - For each trial, partially Fisher–Yates shuffle just enough cards to fill the board.
  - Score each hand with `evaluate7` and credit the winners.
- **Enumeration:** nested loops over the missing 1–2 board cards.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`. Expected: all tests PASS.

- [ ] **Step 5: Commit**

`git add poker/equity.js poker/worker.js tests/equity.test.js && git commit -m "feat: Monte Carlo and exact equity engine with worker"`

---

### Task 3: Page, content and theme (static, no animation)

**Files:**
- Create: `index.html`, `styles.css`, `content.js`, `main.js`, `assets/favicon.svg`, `assets/resume.pdf` (already present: sanitized résumé supplied by Shiraaz)

**Interfaces:**
- Produces:
  - `content.js` default export:
    - `{ name, initials: [{rank:'S',suit:'♠'},{rank:'H',suit:'♥'}], tagline, pitch, links: {email, github, linkedin, resume:'assets/resume.pdf'} }`
    - `flop: Project[3]` and `turn: Project[]`, where `Project = {title, role, dates, problem, built: string[], stack: string[], result, link?}`
    - `experience: {title, org, dates, points: string[]}[]`
    - `honors: string[]`
    - `skills: {group, items: string[]}[]`
  - DOM hooks in `index.html`, which Task 4 animates and Task 5 binds:
    - section ids `#preflop #flop #turn #river #showdown`
    - card elements with class `.card` and an inner `.card-inner`, plus faces `.card-front`/`.card-back`
    - `#dealer-btn` and `#equity-chip` (both open the calculator)
    - `.chip-stack` elements
    - `#pot` in the showdown section
  - `main.js` exports `renderAll(content)` and calls it on `DOMContentLoaded`.

- [ ] **Step 1: Write `content.js`**

- Fill it from the spec's Structure table, word for word where the spec gives copy.
- `tagline: 'CS + Applied Math @ University of Michigan'`.
- `pitch: 'I build simulations and systems that make decisions under uncertainty.'`
- No phone number, no hometown.

- [ ] **Step 2: Write `index.html`**

- Semantic sections in spec order, with a fixed `<nav>`: Projects · Experience · Résumé · Contact.
- Load the Google Fonts.
- Load `main.js` as `type="module"`. GSAP scripts load with `defer`.
- A `<noscript>` fallback links to the résumé and GitHub.
- `<title>Shiraaz Haidar</title>`, plus a meta description and an Open Graph title and description, so forum links preview well.

- [ ] **Step 3: Write `styles.css`**

- Palette tokens on `:root` from the Global Constraints.
- **Felt:** a radial gradient from the felt color to near-black, plus SVG `feTurbulence` noise as a data URI at about 6% opacity, and a vignette.
- **Cards:**
  - Aspect ratio 5/7, an ivory front and a brass-patterned back.
  - Flipping uses `.card-inner { transform-style: preserve-3d; transition }` with `.is-flipped` rotating it 180°.
  - In the final state (no `.is-flipped` needed when JS is absent), cards show their front.
- **Responsiveness:** the flop is a grid with 3 columns at ≥800px and 1 column below that.
- **Reduced motion:** a `prefers-reduced-motion` block sets transitions to none.
- **Focus:** visible focus rings in brass.

- [ ] **Step 4: Implement `renderAll` in `main.js`**

It builds the cards and lists from `content` using `document.createElement` and `textContent` (no innerHTML with content strings). Clicking a flop card toggles an `.is-expanded` detail panel, as a `<button>` with `aria-expanded`.

- [ ] **Step 5: Verify in the browser**

- Serve with `npx --yes http-server -p 8080 -c-1 .`, using a `.claude/launch.json` entry, and open it in the preview.
- Check that all five sections render with the correct content, and that `get_page_text` contains no phone digits `734`.
- At 375px wide: `document.documentElement.scrollWidth <= innerWidth`, and the flop is stacked.
- The console has no errors.

- [ ] **Step 6: Commit**

`git add index.html styles.css content.js main.js assets .claude/launch.json && git commit -m "feat: static poker-table page rendered from content.js"`

---

### Task 4: Signature animations

**Files:**
- Create: `animations.js`
- Modify: `main.js` (import it and call `initAnimations()` after `renderAll`)

**Interfaces:**
- Consumes: the DOM hooks from Task 3, plus global `gsap` and `ScrollTrigger` when present.
- Produces: `initAnimations() -> void`, which is a no-op when `!window.gsap` or the user prefers reduced motion.

- [ ] **Step 1: Implement `initAnimations` with one animation per section, each with `once: true`**

- **Preflop:** the hole cards deal from the top center (translate, rotate, then flip) when the page loads.
- **Flop:** the three cards flip in with a 0.15s stagger at `start: 'top 70%'`.
- **Turn:** the card slides in from the right.
- **River:** the card reveals, then the skill chip stacks rise.
- **Showdown:** `.chip` elements tween into `#pot`.
- **Spotlight:** a cursor-following radial-gradient spotlight via a CSS variable, on `(pointer: fine)` only.
- Set the hidden initial state with `gsap.set` inside `initAnimations` only. That way, without GSAP everything stays visible (Review Focus 4).

- [ ] **Step 2: Verify in the browser**

- Scroll through and screenshot each section. Every element ends in its final state, and there's no console error.
- **Reduced motion:** emulate it, reload, and confirm all cards are face-up immediately.
- **GSAP blocked:** temporarily point the GSAP script at a bad URL, reload, and confirm all content is visible. Then restore the URL.

- [ ] **Step 3: Commit**

`git add animations.js main.js index.html && git commit -m "feat: one-shot scroll animations with reduced-motion and no-GSAP fallbacks"`

---

### Task 5: Equity calculator overlay

**Files:**
- Create: `calculator.js`
- Modify: `index.html` (an overlay `<dialog id="equity">`), `styles.css` (overlay styles), `main.js` (import `initCalculator()`)

**Interfaces:**
- Consumes: `validate` from `poker/equity.js` (imported in the main thread for instant UI validation), `fullDeck` and `cardToString` from `poker/cards.js`, and the worker message protocol from Task 2.
- Produces: `initCalculator() -> void`.

- [ ] **Step 1: Implement the overlay**

- **Opening and closing:**
  - It opens from `#dealer-btn`, `#equity-chip`, or the `E` key (ignored while typing in an input).
  - `Esc` closes it (native `<dialog>`), and focus returns to the opener.
- **Slots:**
  - Player slots: 2 by default, with Add/Remove between 2 and 4.
  - Board slots: 5.
  - Click a slot, then a card in the 52-card grid, to fill it. Click a filled slot to clear it.
  - Cards already used are disabled in the grid (Review Focus 1).
- **Run button:**
  - It is disabled while `validate()` returns an error, and the message is shown as a hint (Review Focus 3).
  - It posts `{hands, board, trials: 100000}` to the worker.
  - Progress messages update the per-player win/tie bars and percentages (to 1 decimal place), plus the trials count, trials per second, and `±` CI in JetBrains Mono.
  - Starting a new run terminates any in-flight worker and creates a fresh one.
- **Footer:** a "How it works" `<details>` block (a 3-sentence method description) and a link to `poker/evaluator.js` on GitHub. The link reads `https://github.com/ShiraazHaidar/poker-portfolio/blob/main/poker/evaluator.js`; set it once the repo name is confirmed in Task 6.
- **Mobile:** at 360px the dialog fills the viewport and scrolls internally (Review Focus 5).

- [ ] **Step 2: Verify in the browser**

- AA vs KK preflop shows about 82% / 18%, with the bars filling live.
- The exact river case shows "exact".
- Choosing a duplicate card is impossible, because it is disabled.
- With a 2-card board, Run is disabled and the hint is shown.
- At 375px the dialog is usable with no horizontal scroll.
- The console has no errors.

- [ ] **Step 3: Commit**

`git add calculator.js index.html styles.css main.js && git commit -m "feat: hidden equity calculator overlay"`

---

### Task 6: Deploy configuration and publish

**Files:**
- Create: `netlify.toml`, `README.md`, `.gitignore`

- [ ] **Step 1: Write the deploy files**

- **`netlify.toml`:**
  - `publish = "."` with no build command.
  - Headers: `/poker/*` and `*.js` get `Cache-Control: public, max-age=3600`.
  - Add `X-Content-Type-Options: nosniff`.
- **`README.md`:**
  - One paragraph on the project and how to edit `content.js`.
  - `npm test` to run the tests.
  - Local preview instructions.
- **`.gitignore`:** `node_modules`, `.DS_Store`, and `docs/superpowers/` stays tracked.

- [ ] **Step 2: Run the full test suite and a final browser pass**

Run: `npm test`. Expected: all PASS. Then repeat the Task 5 browser checks once more.

- [ ] **Step 3: Commit**

`git add netlify.toml README.md .gitignore && git commit -m "chore: Netlify config and README"`

- [ ] **Step 4: Publish (requires Shiraaz's explicit go-ahead)**

- Run `gh repo create ShiraazHaidar/poker-portfolio --public --source . --push`, then update the calculator's GitHub source link if the repo name differs.
- Shiraaz connects the repo in Netlify (Add new site → Import from Git → `poker-portfolio`, with no build command and the publish directory `.`) and picks the site name.
