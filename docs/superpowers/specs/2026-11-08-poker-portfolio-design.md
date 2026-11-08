# Poker-Themed Portfolio — Design Spec

**Date:** 2026-11-08
**Owner:** Shiraaz Haidar

## Goal

A free, immersive, poker-themed personal website that Shiraaz can link from job applications (software engineering and quant roles) and forums. The site must prove engineering skill by itself, while letting a recruiter find projects, experience, résumé and contact within seconds.

## Constraints

- **Free hosting:** Netlify, deployed from a new public GitHub repo (e.g. `poker-portfolio`). URL like `shiraaz-haidar.netlify.app`. Does not touch the existing `ShiraazHaidar.github.io` repo (it serves `umichaws.me`). Custom domain can be added later.
- **Stack:** Plain HTML, CSS and JavaScript. No build step. GSAP (pinned version from cdnjs) for scroll-triggered animation. No other runtime dependencies.
- **Privacy:** No phone number or hometown on the site. A sanitized résumé PDF (no phone or address) is linked; Shiraaz provides it.
- **No target-role banner** (explicitly declined).
- **Performance:** First load under ~300 KB excluding fonts. Works on phones (360px and up). Respects `prefers-reduced-motion`.
- **Editability:** All personal content lives in one file, `content.js`, so updating projects or experience never means touching layout code.

## Structure: the page plays out a hand

One long page on a dark felt table. Normal scrolling, never scroll-jacked.

| Section | Poker frame | Content |
|---|---|---|
| Hero | **Preflop** | Two hole cards dealt face-down, flip to **S♠ H♥**. Name, "CS + Applied Math @ University of Michigan", one-line pitch about building simulations and systems that make decisions under uncertainty. Résumé button. Dealer button "D" (opens the calculator). |
| Projects | **The Flop** | Three cards flip in on scroll: **Solar Car Race Simulator** (C++, drag/rolling resistance/solar/battery model, binary search for max sustainable speed, stochastic weather sims), **Rocket Flight Software** (C++ predictive sensor filtering / state estimation, flew on 10,466-ft flight), **AWSFinance** (Python Lambdas ×8, API Gateway, DynamoDB, AWS CDK infra-as-code, React + TypeScript frontend with auth; links to github.com/ShiraazHaidar/AWSFinance). Each card: problem, what was built, stack, result. Click to expand. |
| Side projects | **The Turn** | One card: Roblox cooperative escape game (Luau, inventory/persistence, fixed multiplayer heartbeat sync bugs, 30+ 3D assets) and DIY racing wheelbase (STM32F405 ODESC, MT6701 encoders, Hall-effect and load-cell pedals; in progress). Framed as "side action". |
| Experience & skills | **The River** | VP & Founding Member, AWS Student Builder Group; GM Student Corps Intern; Mathematics Tutor (400+ hours); Co-Founder, HOPE (5,000+ meals). Honors: CyberPatriots Michigan 1st Place Gold Tier, QuestBridge Finalist. Skills as labeled chip stacks: Languages (C++, Python, TypeScript, Luau), Methods (numerical simulation, state estimation, sensor filtering), Tools (Git, CMake, React, AWS). |
| Contact | **Showdown** | Email (shiraazh@umich.edu), GitHub, LinkedIn, résumé PDF. Chips slide to the pot. Closing line: "All in." |

A slim fixed nav bar shows the name and links: Projects · Experience · Résumé · Contact.

## Visual style

- **Palette (CSS custom properties):** felt `#0f3d2e` with a radial fade to near-black; ivory card faces; brass/gold accents; red only for hearts and diamonds. Dark is the default.
- **Type:** Playfair Display (headings), Inter (body), JetBrains Mono (numbers and stats), all from Google Fonts.
- **Texture:** Subtle felt-grain noise, vignette, and a gentle cursor-following spotlight (desktop only).
- **Cards:** CSS 3D transforms for flips. Thin edge and soft shadow for depth.
- **Motion budget:** One signature animation per section, each runs once. With reduced motion, everything renders in its final state.

## Equity calculator (hidden extra)

- **How to open it:** Click the dealer button, press `E`, or use the footer chip "♠ Run the numbers". It opens as an overlay panel; `Esc` closes it.
- **Input:** 2–4 players' hole cards and 0–5 board cards, chosen from a 52-card grid. Cards already in use are disabled.
- **Engine:**
  - A hand evaluator written from scratch (7-card best-of-5, ranking all hand categories with kickers).
  - Monte Carlo simulation (default 100k trials) in a Web Worker, posting progress every ~5k trials so the win/tie bars update live.
  - Exact enumeration when 4 or 5 board cards are known.
- **Output:** Win % and tie % per player, trials per second, and a ±95% confidence interval. Includes a "How it works" note and a link to the source on GitHub.
- **Tests:** A plain-JS test file run with `node`, covering:
  - hand-category ranking and kicker ties;
  - AA vs KK preflop ≈ 81.9% / 17.8% (±0.5% at 200k trials);
  - AKs vs QQ ≈ 46% / 54%;
  - exact river results.

## Files

```
index.html          page markup and sections
styles.css          theme tokens, layout, card and table styling
content.js          all personal content (single source of truth)
main.js             renders content, scroll animations, nav, calculator overlay
poker/evaluator.js  hand evaluator (shared by worker and tests)
poker/worker.js     Monte Carlo and enumeration worker
tests/evaluator.test.js
assets/resume.pdf   sanitized résumé (supplied by Shiraaz)
netlify.toml        headers and cache config
```

## Out of scope

Blog, CMS, analytics, a 3D/WebGL scene, a playable hand vs the visitor, and a custom domain (can be added later).

## Open items

- LinkedIn URL (placeholder in `content.js` until provided).
- Sanitized résumé PDF (placeholder link until provided).
- Netlify account: Shiraaz creates it and connects the repo. Claude prepares everything else.
