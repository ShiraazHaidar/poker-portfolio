import content from './content.js';
import { initAnimations } from './animations.js';
import { initCalculator } from './calculator.js';

const RED_SUITS = new Set(['♥', '♦']);

// Tiny element helper: el('p', { class: 'x' }, 'text', childNode, ...)
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

const slot = (name) => document.querySelector(`[data-slot="${name}"]`);
const suitClass = (suit) => (RED_SUITS.has(suit) ? 'suit-red' : 'suit-black');

function corner(card, pos) {
  return el('span', { class: `corner corner-${pos} ${suitClass(card.suit)}`, 'aria-hidden': 'true' },
    el('span', { class: 'corner-rank' }, card.rank),
    el('span', { class: 'corner-suit' }, card.suit));
}

// Every playing card shares this structure so the flip animation can treat them alike.
function playingCard({ card, extraClass = '', label, front }) {
  return el('div', { class: `card ${extraClass}`, ...(label ? { role: 'img', 'aria-label': label } : {}) },
    el('div', { class: 'card-inner' },
      el('div', { class: 'card-front' }, corner(card, 'tl'), front, corner(card, 'br')),
      el('div', { class: 'card-back', 'aria-hidden': 'true' })));
}

function renderHero(c) {
  slot('name').textContent = c.name;
  slot('tagline').textContent = c.tagline;
  slot('pitch').textContent = c.pitch;
  slot('resume-link').setAttribute('href', c.links.resume);

  slot('hole-cards').replaceChildren(...c.initials.map((card, i) =>
    playingCard({
      card,
      extraClass: `hole-card hole-card-${i}`,
      label: `${card.rank} of ${RED_SUITS.has(card.suit) ? 'hearts' : 'spades'}`,
      front: el('span', { class: `hole-center ${suitClass(card.suit)}`, 'aria-hidden': 'true' },
        el('span', { class: 'hole-rank' }, card.rank),
        el('span', { class: 'hole-suit' }, card.suit)),
    })));

  slot('stats').replaceChildren(...c.stats.map((s) =>
    el('div', { class: 'stat' }, el('dt', {}, s.label), el('dd', {}, s.value))));
}

let detailId = 0;
function projectPlay(project) {
  const id = `detail-${++detailId}`;
  const toggle = el('button', { class: 'card-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': id },
    'How I built it');
  const detail = el('div', { class: 'card-detail', id, hidden: true },
    el('ul', {}, project.built.map((b) => el('li', {}, b))),
    project.link && el('a', { class: 'detail-link', href: project.link, target: '_blank', rel: 'noopener' },
      'View the code on GitHub →'));

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    detail.hidden = open;
    play.classList.toggle('is-expanded', !open);
  });

  const front = el('div', { class: 'project' },
    el('p', { class: 'project-dates' }, project.dates),
    el('h3', { class: 'project-title' }, project.title),
    el('p', { class: 'project-role' }, project.role),
    el('p', { class: 'project-problem' }, project.problem),
    el('p', { class: 'project-result' }, project.result),
    el('ul', { class: 'tags', 'aria-label': 'Tech stack' }, project.stack.map((s) => el('li', {}, s))),
    toggle);

  const play = el('div', { class: 'play' },
    playingCard({ card: project.card, extraClass: 'project-card', front }),
    detail);
  return play;
}

function renderProjects(c) {
  slot('flop').replaceChildren(...c.flop.map(projectPlay));
  slot('turn').replaceChildren(...c.turn.map(projectPlay));
}

function renderRiver(c) {
  slot('experience').replaceChildren(...c.experience.map((x) =>
    el('li', { class: 'job' },
      el('p', { class: 'job-dates' }, x.dates),
      el('h3', { class: 'job-title' }, x.title),
      el('p', { class: 'job-org' }, x.org),
      el('ul', { class: 'job-points' }, x.points.map((p) => el('li', {}, p))))));

  slot('skills').replaceChildren(...c.skills.map((s, i) =>
    el('div', { class: `chip-stack chip-color-${i % 3}` },
      el('div', { class: 'stack-visual', 'aria-hidden': 'true' },
        s.items.map(() => el('span', { class: 'chip-disc' }))),
      el('div', { class: 'stack-text' },
        el('p', { class: 'stack-group' }, s.group),
        el('ul', { class: 'stack-items' }, s.items.map((item) => el('li', {}, item)))))));

  slot('honors').replaceChildren(...c.honors.map((h) => el('li', {}, h)));
  slot('education').textContent = c.education;
}

function renderShowdown(c) {
  const l = c.links;
  const items = [
    { label: 'Email', value: l.email, href: `mailto:${l.email}` },
    { label: 'GitHub', value: '@' + l.github.replace(/\/$/, '').split('/').pop(), href: l.github },
    { label: 'LinkedIn', value: 'in/' + l.linkedin.replace(/\/$/, '').split('/').pop(), href: l.linkedin },
    { label: 'Résumé', value: 'Download PDF', href: l.resume },
  ];
  slot('contact').replaceChildren(...items.map((it) => {
    const external = !it.href.startsWith('mailto:');
    return el('li', {},
      el('a', { class: 'contact-card', href: it.href, ...(external ? { target: '_blank', rel: 'noopener' } : {}) },
        el('span', { class: 'contact-label' }, it.label),
        el('span', { class: 'contact-value' }, it.value)));
  }));

  const pot = document.getElementById('pot');
  pot.replaceChildren(...Array.from({ length: 15 }, (_, i) =>
    el('span', { class: `chip chip-color-${i % 3}`, style: `--s:${i % 3};--h:${Math.floor(i / 3)}` })));
}

function renderBoards() {
  for (const board of document.querySelectorAll('.board')) {
    const dealt = Number(board.dataset.dealt);
    board.replaceChildren(...Array.from({ length: 5 }, (_, i) =>
      el('span', { class: `board-slot${i < dealt ? ' is-dealt' : ''}` })));
  }
}

export function renderAll(c) {
  renderHero(c);
  renderProjects(c);
  renderRiver(c);
  renderShowdown(c);
  renderBoards();
}

function start() {
  renderAll(content);
  initCalculator();
  initAnimations();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
