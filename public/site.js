// ClearDesk site behaviour: OS-aware downloads & keys, live launch pricing,
// Lemon Squeezy checkout. No trackers.

/* ---- Edit these before launch ---------------------------------------- */
const CONFIG = {
  downloads: {
    // e.g. 'https://github.com/<you>/cleardesk/releases/latest/download/ClearDesk_x64-setup.exe'
    windows: '[WINDOWS INSTALLER URL]',
    // null until the Mac build ships → the button offers to email you instead.
    mac: null,
  },
  macWaitlist: 'mailto:[SUPPORT EMAIL]?subject=Tell%20me%20when%20ClearDesk%20for%20Mac%20ships',
  // Shown if /api/pricing can't be reached (e.g. opening the file locally).
  // Keep in sync with lib/tiers.js.
  fallbackTiers: [
    { id: 'founding', name: 'Founding', price: 9, seats: 5 },
    { id: 'early', name: 'Early', price: 14, seats: 20 },
    { id: 'standard', name: 'Standard', price: 19, seats: null },
  ],
};
/* ---------------------------------------------------------------------- */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

// ---------- OS-aware keys, downloads and screenshots ----------
function applyOs(os) {
  const mac = os === 'mac';
  $$('[data-key-combo]').forEach((k) => {
    k.outerHTML = mac ? '<kbd>⌘</kbd><kbd>⇧</kbd><kbd>Space</kbd>' : '<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>Space</kbd>';
  });
  $$('[data-mod]').forEach((k) => (k.textContent = mac ? '⌘' : 'Ctrl'));
}

function setShots(os, animate = false) {
  const stack = $('.shot-stack');
  const swap = () => $$('[data-shot]').forEach((img) => (img.src = `/img/${img.dataset.shot}-${os}.webp`));
  if (animate && stack) {
    stack.classList.add('swap');
    setTimeout(() => { swap(); stack.classList.remove('swap'); }, 260);
  } else swap();
  $$('.os-toggle button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.os === os)));
}

function setupDownloads() {
  const win = $('[data-dl="windows"]');
  const mac = $('[data-dl="mac"]');
  const ready = (u) => u && !u.startsWith('[');
  if (ready(CONFIG.downloads.windows)) win.href = CONFIG.downloads.windows;
  else { win.href = '#pricing'; win.title = 'Installer link coming at launch'; }
  if (ready(CONFIG.downloads.mac)) mac.href = CONFIG.downloads.mac;
  else {
    mac.href = CONFIG.macWaitlist;
    $('[data-mac-label]').textContent = 'macOS — get notified';
  }
  // Lead with the visitor's own system.
  if (isMac) {
    mac.classList.add('primary');
    win.classList.remove('primary');
    mac.parentElement.prepend(mac);
  }
}

// ---------- Motion ----------
let ladderSeen = false;
const REVEAL = [
  '.problem .eyebrow', '.problem h2', '.pains > div',
  '.features .eyebrow', '.features h2', '.feature-hero', '.grid .card',
  '.how .eyebrow', '.how h2', '.steps li', '.keys',
  '.compare .eyebrow', '.compare h2', '.table-scroll',
  '.privacy-in > div', '.pgrid li',
  '.pricing .eyebrow', '.pricing h2', '.pricing .lead', '.tier', '.buy-card',
  '.faq .eyebrow', '.faq h2', '.faq details', '.final-in > *',
];

function setupMotion() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    ladderSeen = true;
    return;
  }
  // Stagger siblings so grids cascade in.
  const els = $$(REVEAL.join(','));
  els.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => els.includes(c));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 80}ms`);
    el.classList.add('reveal');
  });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));

  // Progress bars fill when the ladder scrolls into view.
  const ladder = $('[data-ladder]');
  const lo = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    ladderSeen = true;
    $$('[data-bar]').forEach((b) => { if (b.dataset.w) b.style.width = b.dataset.w; });
    lo.disconnect();
  }, { threshold: 0.3 });
  if (ladder) lo.observe(ladder);
}

// ---------- Pricing ----------
let current = null;

function renderPricing(data) {
  const tiers = data.tiers;
  current = data.current;
  const standard = tiers[tiers.length - 1];
  for (const t of tiers) {
    const el = $(`[data-tier="${t.id}"]`);
    if (!el) continue;
    el.classList.remove('current', 'upcoming', 'sold_out');
    el.classList.add(t.state);
    $('[data-price]', el).textContent = t.price;
    const seats = $('[data-seats]', el);
    if (seats && t.seats) seats.textContent = t.seats;
    const state = $('.t-state', el);
    if (t.state === 'current') state.textContent = 'Now';
    else if (t.state === 'sold_out') state.textContent = 'Sold out';
    else state.textContent = t.seats === null ? 'After launch' : 'Next';
    if (t.seats) {
      const left = t.seats - (t.taken ?? 0);
      const bar = $('[data-bar]', el);
      if (bar) {
        bar.dataset.w = `${Math.round(((t.taken ?? 0) / t.seats) * 100)}%`;
        if (ladderSeen) bar.style.width = bar.dataset.w;
      }
      const l = $('[data-left]', el);
      if (l) l.textContent = t.state === 'sold_out' ? 'All taken' : `${left} of ${t.seats} left`;
    }
  }
  $$('[data-current-price]').forEach((n) => (n.textContent = current.price));
  const was = $('[data-was]');
  was.textContent = `$${standard.price}`;
  was.hidden = current.price >= standard.price;

  const pill = $('[data-launch-pill]');
  const final = $('[data-final-note]');
  if (current.left !== null && current.left !== undefined) {
    const msg = `${current.name} price: $${current.price} · ${current.left} of ${current.seats} left`;
    $('[data-launch-text]').textContent = msg;
    pill.hidden = false;
    final.textContent = `${current.left} ${current.name.toLowerCase()} licence${current.left === 1 ? '' : 's'} left at $${current.price}. Then $${nextPrice(tiers)}.`;
  } else {
    pill.hidden = true;
    final.textContent = 'One-time purchase. Free 1.x updates.';
  }
  $$('[data-price-label]').forEach((a) => (a.textContent = `Get ClearDesk · $${current.price}`));
}

function nextPrice(tiers) {
  const i = tiers.findIndex((t) => t.state === 'current');
  return tiers[Math.min(i + 1, tiers.length - 1)].price;
}

function fallbackData() {
  const tiers = CONFIG.fallbackTiers.map((t, i) => ({ ...t, taken: 0, state: i === 0 ? 'current' : 'upcoming' }));
  const f = tiers[0];
  return { live: false, tiers, current: { ...f, left: f.seats } };
}

async function loadPricing() {
  renderPricing(fallbackData());
  try {
    const res = await fetch('/api/pricing', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    renderPricing(await res.json());
  } catch {
    /* static preview: keep the fallback ladder */
  }
}

// ---------- Checkout ----------
async function buy(btn) {
  const err = $('[data-buy-error]');
  err.hidden = true;
  const label = btn.textContent;
  btn.setAttribute('aria-disabled', 'true');
  btn.textContent = 'Opening secure checkout…';
  try {
    const res = await fetch('/api/checkout', { method: 'POST', headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || 'Checkout is not available right now.');
    if (data.tier && current && data.tier.price !== current.price) {
      // The tier changed since the page loaded; refresh the ladder so the
      // visitor sees the price they're about to pay.
      void loadPricing();
    }
    if (window.LemonSqueezy?.Url?.Open) window.LemonSqueezy.Url.Open(data.url);
    else window.location.href = data.url;
  } catch (e) {
    err.textContent = e.message;
    err.hidden = false;
  } finally {
    btn.removeAttribute('aria-disabled');
    btn.textContent = label;
  }
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', () => {
  const os = isMac ? 'mac' : 'win';
  applyOs(os);
  setShots(os);
  setupDownloads();
  $$('.os-toggle button').forEach((b) => b.addEventListener('click', () => setShots(b.dataset.os, true)));
  setupMotion();
  $$('[data-buy]').forEach((b) => b.addEventListener('click', () => buy(b)));
  void loadPricing();

  // Lemon.js overlay: refresh tiers after a successful purchase.
  window.createLemonSqueezy?.();
  window.LemonSqueezy?.Setup?.({
    eventHandler: (e) => {
      if (e?.event === 'Checkout.Success') void loadPricing();
    },
  });
});
