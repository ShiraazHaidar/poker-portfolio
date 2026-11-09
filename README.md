# Shiraaz Haidar — poker-table portfolio

A one-page personal site that plays out a hand of poker: **Preflop** (intro), **the Flop** (projects), **the Turn** (side projects), **the River** (experience and skills) and **Showdown** (contact). It is plain HTML, CSS and JavaScript with no build step. GSAP adds scroll animations, and everything stays readable without it.

Hidden extra: press **E**, or click the dealer button **D**, to open a poker equity calculator. Its hand evaluator is written from scratch. Preflop it runs a Monte Carlo simulation in a Web Worker; once the flop is known it enumerates every remaining runout for an exact answer.

## Editing content

All text, links and projects live in [`content.js`](content.js). Edit that file; no layout code needs to change. Replace `assets/resume.pdf` to update the résumé.

## Run locally

```bash
npx http-server -p 8080 -c-1 .
```

Then open http://localhost:8080.

## Tests

```bash
npm test
```

These run the evaluator and equity-engine tests with Node's built-in test runner, including AA vs KK checked against exact enumeration.

## Deploy

Live at https://shiraazhaidar.com, hosted on Cloudflare Pages from this repository. There is no build command; the output directory is the repository root. Response headers are set in `_headers`.
