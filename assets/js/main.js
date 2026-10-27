// Dzikri Mountain Guide — page behaviour. No dependencies.
const WA = '6281214799020';
const OPEN_TRIP = { price: 250000, dp: 50000, maxPeople: 20 };
const PRIVATE_DP = 0.3;
const BASECAMP_MDPL = 1100, SUMMIT_MDPL = 3078;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rupiah = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* Navigation: scrolled state, mobile sheet, current section */
const nav = $('#nav'), toggle = $('#menu-toggle');
const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  document.documentElement.classList.toggle('menu-open', open);
};
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
$$('#nav-links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });

const navLinks = new Map($$('#nav-links a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
const sectionObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  navLinks.forEach((a, id) => a.toggleAttribute('aria-current', id === e.target.id));
}), { rootMargin: '-40% 0px -55% 0px' });
navLinks.forEach((_, id) => { const el = document.getElementById(id); if (el) sectionObserver.observe(el); });

/* Scroll: nav background + altimeter, batched into one frame */
const altimeter = $('.altimeter'), altValue = $('#alt-value');
let ticking = false;
const onScroll = () => {
  ticking = false;
  nav.classList.toggle('is-scrolled', scrollY > 30);
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, scrollY / max) : 0;
  altimeter.style.setProperty('--p', p.toFixed(4));
  altValue.textContent = (Math.round((BASECAMP_MDPL + p * (SUMMIT_MDPL - BASECAMP_MDPL)) / 2) * 2).toLocaleString('id-ID');
};
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

/* Reveal on scroll + stat counters */
const revealObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  revealObserver.unobserve(e.target);
}), { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
$$('[data-reveal]').forEach((el) => revealObserver.observe(el));

const countObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  countObserver.unobserve(e.target);
  const el = e.target, target = Number(el.dataset.count), start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / 1400);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { threshold: 0.6 });
if (!reduced) $$('[data-count]').forEach((el) => { el.textContent = '0'; countObserver.observe(el); });

/* About photo strip */
const strip = $('#about-strip');
$$('[data-strip]').forEach((btn) => btn.addEventListener('click', () => {
  const step = strip.firstElementChild.getBoundingClientRect().width + 16;
  strip.scrollBy({ left: Number(btn.dataset.strip) * step, behavior: reduced ? 'auto' : 'smooth' });
}));

/* Gallery filter + lightbox */
const gallery = $('#gallery'), items = $$('li', gallery);
$$('.filters button').forEach((btn) => btn.addEventListener('click', () => {
  $$('.filters button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  const f = btn.dataset.filter;
  items.forEach((li) => {
    const show = f === 'all' || li.dataset.cat === f;
    li.hidden = !show;
    li.classList.remove('pop');
    if (show && !reduced) { void li.offsetWidth; li.classList.add('pop'); }
  });
}));

const lightbox = $('#lightbox'), lbImg = $('#lightbox-img'), lbCount = $('#lightbox-count');
let visible = [], current = 0;
const show = (i) => {
  current = (i + visible.length) % visible.length;
  const btn = $('button', visible[current]), thumb = $('img', btn);
  lbImg.src = btn.dataset.full;
  lbImg.alt = thumb.alt;
  lbCount.textContent = `${current + 1} / ${visible.length}`;
};
gallery.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-full]');
  if (!btn) return;
  visible = items.filter((li) => !li.hidden);
  show(visible.indexOf(btn.parentElement));
  lightbox.showModal();
});
$$('[data-lb]').forEach((b) => b.addEventListener('click', () => show(current + Number(b.dataset.lb))));
lightbox.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') show(current - 1);
  if (e.key === 'ArrowRight') show(current + 1);
});
let touchX = null;
lightbox.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  touchX = null;
});

/* Dialogs: open triggers, close buttons, backdrop click */
$$('[data-open]').forEach((b) => b.addEventListener('click', () => document.getElementById(b.dataset.open).showModal()));
$$('dialog').forEach((d) => {
  $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => d.close()));
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  d.addEventListener('close', () => document.documentElement.classList.remove('menu-open'));
  d.addEventListener('toggle', () => document.documentElement.classList.toggle('menu-open', d.open));
});

/* Cost calculator */
const calc = $('#calc');
const field = (id) => document.getElementById(id);
const clampInput = (input) => {
  const min = Number(input.min), max = Number(input.max);
  const v = Math.round(Number(input.value));
  input.value = Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
  return Number(input.value);
};
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
field('calc-date').min = today;

const updateCalc = () => {
  const mode = calc.mode.value;
  $$('.calc-fields', calc).forEach((f) => { f.hidden = f.dataset.mode !== mode; });
  const date = field('calc-date').value;
  const dateText = date ? new Date(date + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum ditentukan';
  let total, dp, lines;
  if (mode === 'open') {
    const people = clampInput(field('calc-people'));
    total = OPEN_TRIP.price * people;
    dp = OPEN_TRIP.dp * people;
    field('calc-dp-label').textContent = `DP ${rupiah(OPEN_TRIP.dp)} × ${people} orang`;
    lines = ['- Paket: Open Trip Tektok Ciremai via Palutungan', `- Peserta: ${people} orang`];
  } else {
    const days = clampInput(field('calc-days'));
    const service = field('calc-service');
    total = Number(service.value) * days;
    dp = total * PRIVATE_DP;
    field('calc-dp-label').textContent = `DP ${PRIVATE_DP * 100}% untuk booking`;
    lines = [`- Paket: Private Trip ${field('calc-region').value}`, `- Layanan: ${service.selectedOptions[0].text.split(' · ')[0]}`, `- Durasi: ${days} hari`];
  }
  field('calc-total').textContent = rupiah(total);
  field('calc-dp').textContent = rupiah(dp);
  const text = ['Halo Dzikri, saya mau booking trip.', '', '*Rincian dari kalkulator:*', ...lines, `- Tanggal: ${dateText}`, `- Estimasi total: ${rupiah(total)}`, `- DP: ${rupiah(dp)}`, '', 'Mohon info ketersediaan tanggal dan cara pembayaran DP. Terima kasih.'].join('\n');
  field('calc-send').href = `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
};
calc.addEventListener('input', updateCalc);
calc.addEventListener('change', updateCalc);
$$('[data-step]', calc).forEach((b) => b.addEventListener('click', () => {
  const input = $('input', b.parentElement);
  input.value = Number(input.value) + Number(b.dataset.step);
  updateCalc();
}));
calc.addEventListener('submit', (e) => e.preventDefault());
updateCalc();
