// One signature animation per street. Content is fully visible without this file:
// hidden starting states are only applied here, after GSAP has loaded.

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initSpotlight() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const light = document.querySelector('.spotlight');
  if (!light) return;
  let frame = 0;
  window.addEventListener('pointermove', (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      light.style.setProperty('--mx', `${e.clientX}px`);
      light.style.setProperty('--my', `${e.clientY}px`);
      light.classList.add('is-on');
      frame = 0;
    });
  }, { passive: true });
}

export function initAnimations({ intro = true } = {}) {
  const gsap = window.gsap;
  if (!gsap || prefersReducedMotion()) return;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  const hasScroll = Boolean(window.ScrollTrigger);
  const onScroll = (trigger, start = 'top 72%') =>
    (hasScroll ? { scrollTrigger: { trigger, start, once: true } } : {});

  initSpotlight();

  if (intro) dealPreflop(gsap);

  // The Flop: three cards land face-down and flip over, one after another.
  gsap.from('.flop-grid .card-inner', {
    rotationY: 180,
    y: 50,
    duration: 0.9,
    stagger: 0.15,
    ease: 'power3.out',
    ...onScroll('.flop-grid'),
  });

  // The Turn: the card slides in from the right.
  gsap.from('.turn-grid .play', {
    x: 160,
    rotation: 6,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out',
    ...onScroll('.turn-grid'),
  });

  // The River: experience is revealed, then the chip stacks rise.
  gsap.from('.job', {
    y: 30,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: 'power2.out',
    ...onScroll('.experience'),
  });
  gsap.from('.chip-disc', {
    y: -60,
    opacity: 0,
    duration: 0.45,
    stagger: 0.04,
    ease: 'bounce.out',
    ...onScroll('.skills', 'top 80%'),
  });

  // Showdown: the chips are pushed into the pot.
  gsap.from('#pot .chip', {
    x: () => gsap.utils.random(-260, 260),
    y: () => gsap.utils.random(140, 260),
    opacity: 0,
    duration: 0.8,
    stagger: 0.04,
    ease: 'power3.out',
    ...onScroll('#showdown', 'top 65%'),
  });
}

// Preflop: the two hole cards are dealt from the top of the table, then turned over.
function dealPreflop(gsap) {
  const holeCards = gsap.utils.toArray('.hole-card');
  const deal = gsap.timeline({ delay: 0.25, defaults: { ease: 'power3.out' } });
  holeCards.forEach((card, i) => {
    deal.from(card, {
      y: -window.innerHeight * 0.6,
      x: i === 0 ? 60 : -60,
      rotation: i === 0 ? -40 : 35,
      opacity: 0,
      duration: 0.75,
    }, i * 0.18);
  });
  deal.from('.hole-card .card-inner', {
    rotationY: 180,
    duration: 0.7,
    stagger: 0.15,
    ease: 'back.out(1.4)',
  }, '>-0.1');
  deal.from('.hero-copy > *', { y: 18, opacity: 0, duration: 0.6, stagger: 0.07 }, 0.35);
  gsap.set('#dealer-btn', { transition: 'none' });
  deal.from('#dealer-btn', {
    scale: 0, rotation: -180, duration: 0.6, ease: 'back.out(2)',
    onComplete: () => gsap.set('#dealer-btn', { clearProps: 'transition,transform' }),
  }, '>-0.3');
}
