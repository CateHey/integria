// IntegrIA Tech — un solo bucle para scroll suave, fondo 3D, menú, indicador de fase y cursor.
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 860px)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const lang = root.lang === 'en' ? 'en' : 'es';

/* ---------- Pantalla de carga (solo primera visita) ---------- */
const loader = document.getElementById('loader');
if (loader && root.classList.contains('first-visit') && !reduced) {
  const cnt = loader.querySelector('.count'), bar = loader.querySelector('.bar i');
  const t0 = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - t0) / 1200), e = 1 - Math.pow(1 - t, 3);
    cnt.textContent = String(Math.round(e * 100)).padStart(3, '0');
    bar.style.transform = `scaleX(${e})`;
    if (t < 1) requestAnimationFrame(tick); else loader.classList.add('done');
  };
  requestAnimationFrame(tick);
}

/* ---------- Scroll suave ---------- */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.09 });
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      if (target) { ev.preventDefault(); lenis.scrollTo(target); }
    });
  });
}

/* ---------- Cambio de idioma con barrido ---------- */
document.querySelectorAll('a.lang').forEach((a) => {
  a.addEventListener('click', (ev) => {
    if (reduced || ev.metaKey || ev.ctrlKey) return;
    ev.preventDefault();
    root.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 420);
  });
});
addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('leaving'); });

/* ---------- Menú claro/oscuro ---------- */
const nav = document.querySelector('.nav');
const zones = document.querySelectorAll('[data-zone]');
if (nav && zones.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) nav.classList.toggle('on-light', e.target.dataset.zone === 'light'); });
  }, { rootMargin: '-44px 0px -95% 0px' });
  zones.forEach((z) => io.observe(z));
}
// Zonas opacas que tapan el fondo 3D (para no dibujarlo cuando no se ve)
const lightZones = Array.from(document.querySelectorAll('.light-zone'));

// Menú desplegable en pantallas angostas
const menuBtn = document.querySelector('.menu-btn');
if (nav && menuBtn) {
  const labels = lang === 'en' ? ['Open menu', 'Close menu'] : ['Abrir menú', 'Cerrar menú'];
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', labels[open ? 1 : 0]);
  };
  menuBtn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('.nav-pages a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); menuBtn.focus(); } });
  document.addEventListener('click', (e) => { if (nav.classList.contains('open') && !nav.contains(e.target)) setOpen(false); });
  matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// Fondo del menú al bajar, para que el logo no se cruce con el texto
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Cursor y botones magnéticos ---------- */
const cursor = document.querySelector('.cursor');
const mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };
const cpos = { x: mouse.x, y: mouse.y };
addEventListener('pointermove', (e) => {
  mouse.x = e.clientX; mouse.y = e.clientY;
  mouse.nx = (e.clientX / innerWidth) * 2 - 1; mouse.ny = (e.clientY / innerHeight) * 2 - 1;
  if (e.pointerType === 'mouse') root.classList.add('cursor-live');
}, { passive: true });
const cursorOn = finePointer && !reduced && cursor;
if (cursorOn) {
  root.classList.add('has-cursor');
  document.querySelectorAll('a, button, .svc, input, select, textarea').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('big'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('big'));
  });
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------- Animación propia de cada fase (01–04) ---------- */
const steps = document.querySelectorAll('.step');
if (steps.length && !reduced && 'IntersectionObserver' in window) {
  root.classList.add('anim');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      en.target.classList.add('in');
      // Fase 03: el porcentaje acompaña a la barra (1,8 s, empieza a los 0,4 s)
      const pct = en.target.querySelector('.fx-progress .pct');
      if (pct) {
        const s = performance.now() + 400;
        const run = (now) => {
          const t = Math.max(0, Math.min(1, (now - s) / 1800));
          const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          pct.textContent = `${Math.round(e * 100)}%`;
          if (t < 1) requestAnimationFrame(run);
        };
        pct.textContent = '0%';
        requestAnimationFrame(run);
      }
    });
  }, { threshold: 0.35 });
  steps.forEach((s) => io.observe(s));
}

/* ---------- Formulario de contacto ---------- */
const form = document.getElementById('contact-form');
if (form) {
  const status = form.querySelector('.status');
  const submit = form.querySelector('button[type="submit"]');
  const msg = {
    es: { sending: 'Enviando…', ok: 'Mensaje enviado. Te respondemos en un máximo de dos días hábiles.', err: 'No se pudo enviar. Escríbenos directamente a hvarasg@gmail.com.', mail: 'Se abrirá tu programa de correo con el mensaje listo para enviar.' },
    en: { sending: 'Sending…', ok: 'Message sent. We reply within two business days.', err: 'The message could not be sent. Please write to hvarasg@gmail.com.', mail: 'Your email app will open with the message ready to send.' },
  }[lang];
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('botcheck')) return;
    const key = form.dataset.key;
    status.className = 'status';
    if (!key) {
      // Sin clave de Web3Forms configurada: se arma el correo en el cliente de email del visitante
      const subject = `${lang === 'es' ? 'Consulta web' : 'Website enquiry'}: ${data.get('service') || ''} — ${data.get('company') || data.get('name')}`;
      const body = ['name', 'company', 'email', 'phone', 'service', 'message'].map((k) => `${k}: ${data.get(k) || '-'}`).join('\n');
      status.textContent = msg.mail;
      location.href = `mailto:hvarasg@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }
    submit.disabled = true; status.textContent = msg.sending;
    data.append('access_key', key);
    data.append('subject', `IntegrIA web: ${data.get('company') || data.get('name')}`);
    try {
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      form.reset(); status.textContent = msg.ok; status.classList.add('ok');
    } catch (e) {
      status.textContent = msg.err; status.classList.add('err');
    } finally { submit.disabled = false; }
  });
}

/* ---------- Indicador de fase (inicio) ---------- */
const method = document.getElementById('metodo');
const hud = document.querySelector('.hud');
const phases = { es: ['Diagnóstico', 'Diseño', 'Ejecución', 'Operación'], en: ['Assessment', 'Design', 'Delivery', 'Operation'] }[lang];
let hudOn = false, lastPhase = -1;
function scrollProgress() {
  const stepH = method.firstElementChild.offsetHeight;
  const rel = (innerHeight / 2 - method.getBoundingClientRect().top) / stepH;
  return Math.max(0, Math.min(4, rel + 0.5));
}
function updateHud(p) {
  if (!hud) return;
  const r = method.getBoundingClientRect();
  const on = r.top < innerHeight * 0.4 && r.bottom > innerHeight * 0.6;
  if (on !== hudOn) { hudOn = on; hud.classList.toggle('on', on); }
  if (!on) return;
  const k = Math.max(0, Math.min(3, Math.round(p) - 1));
  if (k !== lastPhase) { lastPhase = k; hud.querySelector('.n').textContent = `0${k + 1}`; hud.querySelector('.name').textContent = phases[k]; }
  hud.querySelector('.track i').style.transform = `scaleX(${Math.max(0, Math.min(1, (p - 0.5) / 3.5))})`;
}

/* ---------- Fondo 3D ---------- */
let field = null;
function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}
async function startField() {
  const canvas = document.getElementById('gl');
  if (!canvas) return;
  const weak = mobile && (navigator.hardwareConcurrency || 8) <= 4;
  if (!hasWebGL() || weak) { root.classList.add('no-gl'); return; }
  try {
    const { createField } = await import('./particles.js');
    field = createField({ canvas, mobile, reduced });
    field.setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
    addEventListener('resize', () => field.resize());
    requestAnimationFrame(() => canvas.classList.add('ready'));
  } catch (e) { root.classList.add('no-gl'); }
}
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));
if (document.readyState === 'complete') idle(startField); else addEventListener('load', () => idle(startField));

/* ---------- Bucle único ---------- */
let pSmooth = method ? 0 : 0;
function lightCovers() {
  for (const z of lightZones) { const r = z.getBoundingClientRect(); if (r.top <= 0 && r.bottom >= innerHeight) return true; }
  return false;
}
function frame(time) {
  if (lenis) lenis.raf(time);
  const p = method ? scrollProgress() : 4;
  pSmooth = reduced ? p : pSmooth + (p - pSmooth) * (method ? 0.07 : 0.025);
  if (method) updateHud(p);
  if (cursorOn) {
    cpos.x += (mouse.x - cpos.x) * 0.2; cpos.y += (mouse.y - cpos.y) * 0.2;
    cursor.style.transform = `translate(${cpos.x}px, ${cpos.y}px)`;
  }
  if (field && !document.hidden && !lightCovers()) field.render(time, pSmooth, mouse);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- Tema claro / oscuro ---------- */
const themeBtn = document.querySelector('.theme-btn');
const themeMeta = document.querySelector('meta[name="theme-color"]');
function applyTheme(t) {
  if (t === 'dark') root.dataset.theme = 'dark'; else delete root.dataset.theme;
  if (themeMeta) themeMeta.content = t === 'dark' ? '#05070D' : '#F7FAFF';
  if (themeBtn) themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
  if (field) field.setTheme(t);
}
if (themeBtn) {
  themeBtn.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
  themeBtn.addEventListener('click', () => {
    const t = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', t); } catch (e) {}
    applyTheme(t);
  });
}
