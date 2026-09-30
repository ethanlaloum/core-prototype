/*
 * CORE clickable prototype. Hash router + views, no backend.
 * State (role, follows, requests, edits) lives in memory and localStorage.
 */
(function () {
  'use strict';

  const D = window.CORE_DATA;
  const main = document.getElementById('main');
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');
  const protoEl = document.getElementById('proto');
  const toastEl = document.getElementById('toasts');
  const modalRoot = document.getElementById('modal-root');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= utilities ================= */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n).toLocaleString('en-US');
  const inch = (cm) => (cm / 2.54).toFixed(1).replace(/\.0$/, '');
  const dims = (w) => `${w.w} × ${w.h} cm`;
  const dimsFull = (w) => `${w.w} × ${w.h} cm · ${inch(w.w)} × ${inch(w.h)} in`;
  const first = (name) => name.split(' ')[0];
  const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('');

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
    map: '<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.7a1 1 0 0 0-.2-.6l-3.5-4.3A1 1 0 0 0 17.5 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    brush: '<path d="m9.1 11.3 3.6 3.6"/><path d="M18.4 2.6a2 2 0 0 1 2.9 2.9l-8.3 8.3-2.9-2.9z"/><path d="M7 14a3 3 0 0 0-3 3c0 1.5-1 2-2 2.5 1 1.5 2.7 2.5 4.5 2.5a4.5 4.5 0 0 0 4.5-4.5 3 3 0 0 0-3-3.5z"/>',
    tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    door: '<path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01"/><path d="M13 4.6v16.2a1 1 0 0 1-1.2 1L5 20V5.6a2 2 0 0 1 1.5-1.9l4-1A2 2 0 0 1 13 4.6z"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    hide: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/>',
    plug: '<path d="M12 22v-5M9 8V2M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  };
  const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  /* ================= state ================= */
  const KEY = 'core-prototype-v1';
  const INITIAL_FOLLOWING = ['ines-moreau', 'dario-mendoza', 'lea-fontaine', 'marcus-hale', 'kofi-mensah'];
  const defaults = () => ({
    role: 'visitor',
    following: INITIAL_FOLLOWING.slice(),
    saved: ['sofia-2', 'yuna-3', 'noor-1'],
    requests: JSON.parse(JSON.stringify(D.REQUESTS)),
    readReq: [],
    overrides: {},
    extraWorks: [],
    pending: {},
    moderation: {},
    spotlight: { current: D.SPOTLIGHT.current.slice(), queue: D.SPOTLIGHT.queue.slice(), curatorPick: D.SPOTLIGHT.curatorPick, rules: { city: true, cat: true, pick: true }, published: false },
    profile: {},
    plan: 'studio',
    billing: 'monthly',
    brandJoined: false,
    joined: null,
  });
  let S = defaults();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(defaults(), JSON.parse(raw)); } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  /* ================= data access ================= */
  const allWorks = () => D.works.concat(S.extraWorks);
  function work(id) { const w = allWorks().find((x) => x.id === id); if (!w) return null; const o = S.overrides[id]; return o ? { ...w, ...o } : w; }
  const isPublic = (w) => !w.hidden && (!w.review || w.review === 'approved');
  function worksOf(cid, all) { return allWorks().filter((w) => w.creatorId === cid).map((w) => work(w.id)).filter((w) => all || isPublic(w)); }
  const publicWorks = () => allWorks().map((w) => work(w.id)).filter(isPublic);
  function creator(id) {
    const c = D.creators.find((x) => x.id === id); if (!c) return null;
    if (id === D.ME_CREATOR) {
      const p = S.profile;
      return { ...c, ...p, studio: { ...c.studio, ...(p.studio || {}) }, plan: S.plan };
    }
    return c;
  }
  function featuredWork(cid) { const ws = worksOf(cid); return ws.find((w) => w.status === 'available') || ws[0]; }
  const isFollowing = (id) => S.role !== 'visitor' && S.following.includes(id);
  function followerCount(c) { const base = c.followers; const was = INITIAL_FOLLOWING.includes(c.id); const is = isFollowing(c.id); return base + (is && !was ? 1 : 0) - (!is && was ? 1 : 0); }
  function cityCounts(filterFn) {
    const out = {}; Object.keys(D.CITIES).forEach((k) => (out[k] = { works: 0, creators: new Set(), studios: 0 }));
    publicWorks().filter((w) => w.status !== 'sold').filter(filterFn || (() => true)).forEach((w) => { out[w.city].works++; out[w.city].creators.add(w.creatorId); });
    D.creators.forEach((c) => { if (c.studio.open) out[c.city].studios++; });
    return out;
  }
  function darkest(pal) {
    const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    return pal.slice().sort((a, b) => lum(a) - lum(b))[0];
  }
  const avatar = (c, size = '') => `<span class="avatar ${size}" style="background:${darkest(c.palette)}" aria-hidden="true">${esc(initials(c.name))}</span>`;
  const kindOf = (w) => (w.category === 'Painting' ? 'canvas' : w.category === 'Digital' ? 'framed' : 'object');

  function artImg(w, opts = {}) {
    const c = creator(w.creatorId);
    const k = kindOf(w);
    const src = Art.src({ ...w.art, side: !!opts.side });
    const obj = Art.isObject(w.art.gen);
    const width = 1000, height = obj ? 1250 : Math.round(1000 * (w.h / w.w));
    return `<div class="art-img is-${k}" ${opts.style ? `style="${opts.style}"` : ''}><img src="${src}" alt="${esc(w.title)} by ${esc(c.name)}, ${esc(w.medium.toLowerCase())}" width="${width}" height="${height}" ${opts.eager ? '' : 'loading="lazy"'} decoding="async"></div>`;
  }
  // A work shown whole inside a fixed 4:5 plinth box (rotation grids, admin previews).
  function boxImg(w, extra = '') {
    const k = kindOf(w);
    return `<div class="box-img ${extra}"><img class="${k}" src="${Art.src(w.art)}" alt="${esc(w.title)} by ${esc(creator(w.creatorId).name)}" loading="lazy"></div>`;
  }
  const STATUS = {
    available: { label: 'Available', cls: 'st-available', pill: 'pill-ok' },
    reserved: { label: 'Reserved', cls: 'st-reserved', pill: 'pill-warn' },
    sold: { label: 'Sold', cls: 'st-sold', pill: 'pill-muted' },
    commission: { label: 'Made to order', cls: 'st-commission', pill: 'pill-accent' },
  };
  function priceLine(w) {
    const st = STATUS[w.status];
    const price = w.status === 'sold' ? '' : `<span>${w.status === 'commission' ? 'from ' : ''}${money(w.price)}</span>`;
    return `<div class="price-row">${price}<span class="${st.cls}"><span class="dot"></span> ${st.label}</span></div>`;
  }
  function workCard(w, opts = {}) {
    const c = creator(w.creatorId);
    const saved = S.role !== 'visitor' && S.saved.includes(w.id);
    return `<article class="art">
      <div style="position:relative">
        <a href="#/work/${w.id}" aria-label="${esc(w.title)} by ${esc(c.name)}">${artImg(w)}</a>
        <div class="art-save"><button class="icon-btn" data-action="save" data-id="${w.id}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved' : 'Save'} ${esc(w.title)}">${icon('bookmark', 'i-sm')}</button></div>
      </div>
      <div class="wall-label">
        ${opts.hideCreator ? '' : `<a class="who" href="#/creator/${c.id}" style="text-decoration:none">${esc(c.name)}</a>`}
        <a class="what" href="#/work/${w.id}" style="text-decoration:none"><em>${esc(w.title)}</em>, ${w.year}</a>
        <div class="meta">${opts.showCity ? esc(w.city) + ' · ' : ''}${esc(w.medium)} · ${dims(w)}${w.edition ? ' · Ed. ' + esc(w.edition) : ''}</div>
        ${priceLine(w)}
      </div>
    </article>`;
  }
  function creatorCard(c) {
    const ws = worksOf(c.id).sort((a, b) => (a.status === 'sold') - (b.status === 'sold')).slice(0, 3);
    const avail = worksOf(c.id).filter((w) => w.status !== 'sold').length;
    return `<a class="creator-card" href="#/creator/${c.id}">
      <div class="strip">${ws.map((w) => `<div><img src="${Art.src(w.art)}" alt="" loading="lazy"></div>`).join('')}</div>
      <div class="who">${avatar(c)}<div style="min-width:0"><div class="name">${esc(c.name)}</div><div class="where">${esc(c.city)} · ${esc(c.category)} · ${avail} available</div></div></div>
    </a>`;
  }
  function badge(c) {
    if (c.badge === 'represented') return `<span class="badge-core">${icon('sparkle', 'i-sm')} Represented by The Art Plug</span>`;
    return `<span class="badge-core">${icon('shield', 'i-sm')} Verified by The Art Plug</span>`;
  }

  /* ================= toasts & modal ================= */
  function toast(msg) {
    const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = icon('check') + '<span>' + esc(msg) + '</span>';
    toastEl.appendChild(el); setTimeout(() => el.remove(), 3200);
  }
  let lastFocus = null;
  function openModal(html, mount) {
    lastFocus = document.activeElement;
    modalRoot.innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${html}</div></div>`;
    if (mount) mount($('.modal', modalRoot));
    const f = $('input, select, textarea, button:not([data-action="close-modal"])', modalRoot); if (f) f.focus();
  }
  function closeModal() { modalRoot.innerHTML = ''; if (lastFocus) lastFocus.focus(); }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalRoot.innerHTML) closeModal(); });

  /* ================= router ================= */
  let cleanups = [];
  function parse() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = h.split('?');
    return { path, parts: path.split('/').filter(Boolean), q: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  function setRole(role) { S.role = role; save(); }

  const ROUTES = {
    '': landingView,
    discover: discoverView,
    creator: creatorView,
    work: workView,
    request: requestView,
    me: collectorView,
    studio: studioView,
    pricing: pricingView,
    brands: brandsView,
    admin: adminView,
    join: joinView,
  };

  let lastPath = null;
  function render() {
    cleanups.forEach((fn) => fn()); cleanups = [];
    modalRoot.innerHTML = '';
    const r = parse();
    const view = ROUTES[r.parts[0] || ''] || notFound;
    const out = view(r);
    main.innerHTML = out.html;
    renderHeader(r); renderProto(r);
    if (out.mount) out.mount(r);
    document.title = (out.title ? out.title + ' · ' : '') + 'CORE';
    if (r.path !== lastPath) {
      window.scrollTo(0, 0); main.focus({ preventScroll: true });
      main.classList.remove('page-in'); void main.offsetWidth; if (!reduceMotion) main.classList.add('page-in');
    }
    lastPath = r.path;
    motion();
  }

  /* ================= motion ================= */
  // Elements below the fold rise in as they scroll into view; anything already on screen stays put.
  const REVEAL = '.section-head, .masonry > .art, .grid > *, .audience, .fact, .plan, .use-case, .cta-card, .tl-step, .universe-stats > div, .quote, .req-card, .queue-card, .kpi, .dash-grid > .panel';
  function motion() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    const vh = window.innerHeight;
    const els = $$(REVEAL, main).filter((el) => el.getBoundingClientRect().top > vh * 0.92);
    const io = new IntersectionObserver((entries) => {
      let k = 0;
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.style.setProperty('--rd', Math.min(k++, 6) * 80 + 'ms');
        en.target.classList.add('reveal-in');
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io2.unobserve(en.target); en.target.classList.add('in-view');
        $$('[data-count]', en.target).forEach(countUp);
      });
    }, { threshold: 0.2 });
    $$('[data-inview]', main).forEach((el) => io2.observe(el));
    cleanups.push(() => { io.disconnect(); io2.disconnect(); });
  }
  function countUp(el) {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function pop(el) { if (reduceMotion || !el) return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  window.addEventListener('hashchange', render);

  function notFound() {
    return { html: `<section class="wrap section"><div class="empty"><p class="h3">This page doesn't exist in the prototype.</p><a class="btn btn-primary" href="#/">Back to home</a></div></section>` };
  }

  /* ================= header / footer / prototype panel ================= */
  function renderHeader(r) {
    const cur = r.parts[0] || '';
    const isMap = cur === 'discover' && parse().q.view === 'map';
    const links = [
      ['#/discover', 'Discover', cur === 'discover' && !isMap],
      ['#/discover?view=map', 'Cities', isMap],
      ['#/pricing', 'For creators', cur === 'pricing'],
      ['#/brands', 'For brands', cur === 'brands'],
    ];
    const me = creator(D.ME_CREATOR);
    const newCount = S.requests.filter((q) => q.creatorId === D.ME_CREATOR && q.status === 'new').length;
    let right = '';
    if (S.role === 'visitor') right = `<button class="btn btn-ghost btn-sm hide-sm" data-action="signin">Sign in</button><a class="btn btn-primary btn-sm" href="#/join">Join CORE</a>`;
    if (S.role === 'collector') right = `<a class="user-chip" href="#/me"><span class="avatar" style="background:var(--accent-ink)">${D.COLLECTOR.initials}</span><span class="hide-sm">My collection</span></a>`;
    if (S.role === 'creator') right = `<a class="btn btn-ghost btn-sm hide-sm" href="#/creator/${me.id}">Public profile</a><a class="user-chip" href="#/studio">${avatar(me)}<span>Studio</span>${newCount ? `<span class="pill pill-accent no-dot">${newCount} new</span>` : ''}</a>`;
    if (S.role === 'admin') right = `<a class="user-chip" href="#/admin"><span class="avatar" style="background:var(--accent)">MK</span><span>Marcel · Admin</span></a>`;
    headerEl.innerHTML = `<div class="wrap">
      <nav class="nav" aria-label="Main">
        <a class="logo" href="#/" aria-label="CORE home"><span class="logo-word">CORE<i></i></span><span class="logo-by">by The Art Plug</span></a>
        <div class="nav-links">${links.map(([h, t, a]) => `<a href="${h}" ${a ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</div>
        <div class="nav-actions">${right}<button class="icon-btn menu-btn" data-action="menu" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}</button></div>
      </nav>
      <div class="mobile-nav" id="mobile-nav">${links.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}${S.role === 'visitor' ? '<a href="#" data-action="signin">Sign in</a>' : ''}</div>
    </div>`;
  }

  function renderFooter() {
    footerEl.innerHTML = `<div class="wrap">
      <div class="footer-grid">
        <div class="stack" style="gap:14px"><a class="logo" href="#/"><span class="logo-word">CORE<i></i></span></a><p class="muted small" style="max-width:36ch">Creators & Originals Resource Exchange. Curated by The Art Plug, Miami. Subscriptions for creators, zero commission on every sale.</p></div>
        <div><h4>Collect</h4><ul><li><a href="#/discover">Discover works</a></li><li><a href="#/discover?view=map">Browse by city</a></li><li><a href="#/me">My collection</a></li></ul></div>
        <div><h4>Create</h4><ul><li><a href="#/join?role=creator">Open your studio</a></li><li><a href="#/pricing">Plans</a></li><li><a href="#/studio">Studio dashboard</a></li></ul></div>
        <div><h4>CORE</h4><ul><li><a href="#/brands">For brands</a></li><li><a href="#/pricing">How rotation works</a></li><li><a href="#/admin">Curation team</a></li></ul></div>
      </div>
      <div class="footer-note"><span>© 2026 CORE · The Art Plug</span><span>Prototype: every creator, collector and work shown here is fictional.</span></div>
    </div>`;
  }

  const SCREENS = [
    ['#/', 'Landing', null],
    ['#/discover?city=Paris&avail=1', 'Discover · Paris', null],
    ['#/creator/ines-moreau', 'Creator profile', null],
    ['#/work/ines-1', 'Artwork page', null],
    ['#/request?type=purchase&work=ines-1', 'Contact request', 'collector'],
    ['#/me', 'Collector profile', 'collector'],
    ['#/studio', 'Creator studio', 'creator'],
    ['#/pricing', 'Plans', null],
    ['#/brands', 'Brands (coming soon)', null],
    ['#/admin', 'Admin', 'admin'],
  ];
  const ROLES = [['visitor', 'Visitor', 'Not signed in'], ['collector', 'Collector', D.COLLECTOR.name], ['creator', 'Creator', 'Inès Moreau'], ['admin', 'Admin', 'Marcel Katz']];
  let protoOpen = false;
  function renderProto() {
    const here = '#' + (location.hash.replace(/^#/, '') || '/');
    const roleName = ROLES.find((x) => x[0] === S.role)[1];
    protoEl.innerHTML = `
      <div class="proto-panel" id="proto-panel" ${protoOpen ? '' : 'hidden'}>
        <div><span class="label">Screens</span>
          <ol style="margin-top:8px">${SCREENS.map(([h, t, role]) => `<li><a href="${h}" data-role="${role || ''}" ${here.split('?')[0] === h.split('?')[0] ? 'aria-current="page"' : ''}><span>${t}</span><span class="as">${role ? 'as ' + role : ''}</span></a></li>`).join('')}</ol>
        </div>
        <div><span class="label">View as</span><div class="roles" style="margin-top:8px">${ROLES.map(([k, t, s]) => `<button data-action="role" data-role="${k}" aria-pressed="${S.role === k}">${t}<small>${esc(s)}</small></button>`).join('')}</div></div>
        <button class="btn btn-ghost btn-sm" data-action="reset">${icon('refresh', 'i-sm')} Reset prototype data</button>
      </div>
      <button class="proto-toggle" data-action="proto" aria-expanded="${protoOpen}" aria-controls="proto-panel">${icon('layers', 'i-sm')} <span class="tag">Prototype</span> Viewing as ${roleName}</button>`;
  }

  /* ================= global click delegation ================= */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-role]');
    if (a && a.tagName === 'A' && a.dataset.role) { setRole(a.dataset.role); protoOpen = false; }
    const t = e.target.closest('[data-action]');
    if (!t) { if (protoOpen && !e.target.closest('.proto')) { protoOpen = false; renderProto(); } return; }
    const act = t.dataset.action;
    switch (act) {
      case 'proto': protoOpen = !protoOpen; renderProto(); break;
      case 'role': setRole(t.dataset.role); protoOpen = false; render(); toast('Now viewing as ' + ROLES.find((x) => x[0] === t.dataset.role)[1].toLowerCase()); break;
      case 'reset': try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ } S = defaults(); protoOpen = false; location.hash = '#/'; render(); toast('Prototype data reset'); break;
      case 'menu': { const nav = $('#mobile-nav'); const open = nav.classList.toggle('is-open'); t.setAttribute('aria-expanded', open); break; }
      case 'signin': e.preventDefault(); signInModal(); break;
      case 'close-modal': closeModal(); break;
      case 'modal-backdrop': if (e.target === t) closeModal(); break;
      case 'signin-as': setRole(t.dataset.role); closeModal(); location.hash = t.dataset.go; render(); toast('Signed in as ' + t.dataset.name); break;
      case 'save': {
        const id = t.dataset.id;
        if (S.role === 'visitor') { setRole('collector'); if (!S.saved.includes(id)) S.saved.push(id); save(); render(); toast(`Signed in as ${D.COLLECTOR.name} (demo). Saved to your collection.`); break; }
        const on = !S.saved.includes(id);
        S.saved = on ? S.saved.concat(id) : S.saved.filter((x) => x !== id); save();
        $$(`[data-action="save"][data-id="${id}"]`).forEach((b) => { b.setAttribute('aria-pressed', on); pop(b); });
        toast(on ? 'Saved to your collection' : 'Removed from saved'); break;
      }
      case 'follow': {
        const id = t.dataset.id;
        if (S.role === 'visitor') { setRole('collector'); if (!S.following.includes(id)) S.following.push(id); save(); render(); toast(`Signed in as ${D.COLLECTOR.name} (demo). Following ${creator(id).name}.`); break; }
        const on = !isFollowing(id);
        S.following = on ? S.following.concat(id) : S.following.filter((x) => x !== id); save();
        const c = creator(id);
        $$(`[data-action="follow"][data-id="${id}"]`).forEach((b) => { b.setAttribute('aria-pressed', on); b.innerHTML = on ? icon('check', 'i-sm') + ' Following' : icon('plus', 'i-sm') + ' Follow'; pop(b); });
        $$(`[data-followers="${id}"]`).forEach((el) => (el.textContent = followerCount(c).toLocaleString('en-US')));
        toast(on ? `Following ${c.name}. New works will show up in your collection.` : `Unfollowed ${c.name}`); break;
      }
      default: break;
    }
  });

  function signInModal() {
    openModal(`<div class="modal-head"><div><span class="label">Demo sign-in</span><h2 class="h2" id="modal-title" style="margin-top:8px">Sign in to CORE</h2></div><button class="icon-btn" data-action="close-modal" aria-label="Close">${icon('x')}</button></div>
      <p class="muted">This prototype has no real accounts. Pick a demo profile to see its screens.</p>
      <div class="stack" style="gap:10px">
        <button class="btn btn-secondary btn-lg" style="justify-content:flex-start" data-action="signin-as" data-role="collector" data-go="#/me" data-name="${D.COLLECTOR.name}">${icon('bookmark')} Collector · ${D.COLLECTOR.name}, Miami</button>
        <button class="btn btn-secondary btn-lg" style="justify-content:flex-start" data-action="signin-as" data-role="creator" data-go="#/studio" data-name="Inès Moreau">${icon('brush')} Creator · Inès Moreau, Paris</button>
        <button class="btn btn-secondary btn-lg" style="justify-content:flex-start" data-action="signin-as" data-role="admin" data-go="#/admin" data-name="Marcel Katz">${icon('plug')} Admin · Marcel Katz, The Art Plug</button>
      </div>`);
  }

  /* ================= dot map ================= */
  let DOTS = null;
  function dotPath() {
    if (DOTS) return DOTS;
    const m = window.WORLD_MASK; let d = '';
    m.rows.forEach((hex, r) => {
      for (let i = 0; i < hex.length; i++) {
        const n = parseInt(hex[i], 16);
        for (let b = 0; b < 4; b++) if (n & (8 >> b)) { const c = i * 4 + b; d += `M${c + 0.2} ${r + 0.5}a.3 .3 0 1 0 .6 0a.3 .3 0 1 0-.6 0`; }
      }
    });
    DOTS = d; return d;
  }
  // Label side for each pin, so clustered cities (Europe, East Asia) stay readable.
  const TAG_DIR = { 'London': 'w', 'Paris': 's', 'Berlin': 'e', 'Lisbon': 'w', 'Seoul': 'n', 'Tokyo': 's', 'Miami': 'e', 'New York': 'n', 'Los Angeles': 'w', 'Mexico City': 's', 'Lagos': 's', 'São Paulo': 'e' };
  const pos = (city) => { const c = D.CITIES[city]; return { left: ((c.lon + 180) / 360) * 100, top: ((78 - c.lat) / 136) * 100 }; };
  const f1 = (n) => Math.round(n * 100) / 100;
  function dotMap(opts) {
    const counts = opts.counts; const act = opts.active;
    const pins = Object.keys(D.CITIES).map((city) => {
      const p = pos(city); const n = counts[city].works; const hq = opts.network && city === 'Miami';
      const tag = hq ? `Miami<span class="mono">The Art Plug HQ · ${n}</span>` : `${esc(city)}<span class="mono">${n}</span>`;
      return `<button class="pin tag-${TAG_DIR[city] || 'n'} ${hq ? 'is-hq' : ''} ${act === city ? 'is-active' : ''} ${n ? '' : 'is-dim'}" style="left:${p.left}%;top:${p.top}%" data-action="${opts.action}" data-city="${esc(city)}" aria-label="${esc(city)}${hq ? ', home of The Art Plug' : ''}: ${n} works available" aria-pressed="${act === city}"><span class="pin-dot"></span><span class="pin-tag">${tag}</span></button>`;
    }).join('');
    let net = '';
    if (opts.network) {
      // Arcs from The Art Plug's home in Miami to every CORE city, drawn in the map's own 160 × 58 space so strokes scale evenly.
      const toMap = (c) => { const p = pos(c); return [p.left * 1.6, p.top * 0.58]; };
      const [hx, hy] = toMap('Miami');
      net = `<svg class="net" viewBox="0 0 160 58" aria-hidden="true">${Object.keys(D.CITIES).filter((c) => c !== 'Miami').map((city, i) => {
        const [x, y] = toMap(city); const lift = Math.hypot(x - hx, y - hy) * 0.24;
        const d = `M${f1(hx)} ${f1(hy)} Q${f1((hx + x) / 2)} ${f1((hy + y) / 2 - lift)} ${f1(x)} ${f1(y)}`;
        return `<path class="base" pathLength="1" style="--i:${i}" d="${d}"/><path class="flow" pathLength="1" style="--i:${i}" d="${d}"/>`;
      }).join('')}</svg>`;
    }
    return `<div class="dotmap ${opts.tags ? 'show-tags' : ''} ${opts.network ? 'has-net' : ''}" ${opts.network ? 'data-inview' : ''}><svg viewBox="0 0 160 58" preserveAspectRatio="none" aria-hidden="true"><path class="land" d="${dotPath()}"/></svg>${net}${pins}</div>`;
  }

  /* ================= The Art Plug universe: shared pieces ================= */
  function marquee(items, cls = '') {
    const row = items.map((t) => `<span class="marquee-item">${t}</span><span class="marquee-sep">${icon('sparkle')}</span>`).join('');
    return `<div class="marquee ${cls}" aria-hidden="true"><div class="marquee-track">${row}${row}</div></div>`;
  }
  // Paint drips along the top edge of the dark Art Plug band, seeded so they never move between renders.
  function drips() {
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let x = 6, out = '';
    while (x < 1190) {
      const w = 8 + rnd() * 16, len = 6 + rnd() * rnd() * 62, r = w / 2;
      out += `<path class="drip" style="--d:${Math.round(rnd() * 700)}ms" d="M${x.toFixed(1)} 8v${len.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${w.toFixed(1)} 0V8z"/>`;
      x += w + 16 + rnd() * 64;
    }
    return `<svg class="drips" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true"><rect class="band" width="1200" height="10"/>${out}</svg>`;
  }
  const STICKER = () => `<div class="sticker" aria-hidden="true"><svg viewBox="0 0 120 120"><g class="ring"><circle class="disc" cx="60" cy="60" r="58"/><path id="stk-path" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" fill="none"/><text class="stk-text"><textPath href="#stk-path" textLength="272" lengthAdjust="spacing">CURATED BY THE ART PLUG ✦ MIAMI ✦ </textPath></text></g><circle class="hub" cx="60" cy="60" r="27"/><g class="plug" transform="translate(45.5 45.5) scale(1.2)">${ICONS.plug}</g></svg></div>`;
  const SPRAY = '<svg class="spray" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M6 24 C 70 10, 130 32, 190 19 S 268 12, 294 21"/><path class="drip-line" pathLength="1" d="M262 17 C 263 25, 262 31, 263 38"/></svg>';
  const words = (text, start) => text.split(' ').map((w, k) => `<span class="w" style="--i:${start + k}">${w}</span>`).join(' ');
  const pickLabel = "Marcel's pick";
  // Works The Art Plug has shared on Instagram (sample data for the prototype).
  const SHARED = { 'ines-1': 'Sep 14', 'dario-1': 'Aug 28', 'kofi-1': 'Sep 3', 'marcus-1': 'Sep 22' };

  /* ================= 1. landing ================= */
  function nextMonday() {
    const now = new Date(); const d = new Date(now); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    const ms = d - now; const days = Math.floor(ms / 864e5); const hours = Math.floor((ms % 864e5) / 36e5);
    return `${days}d ${String(hours).padStart(2, '0')}h`;
  }
  function landingView() {
    const spot = S.spotlight.current.map((id) => ({ c: creator(id), w: featuredWork(id) }));
    const counts = cityCounts();
    const fresh = publicWorks().filter((w) => w.status === 'available').sort((a, b) => a.addedDaysAgo - b.addedDaysAgo).slice(0, 8);
    const cityCount = Object.keys(D.CITIES).length;
    const brands = ['Lyft', 'Heineken', 'Atlantic Records', 'Virgin', 'Stoli', 'Champs Sports', 'BuzzFeed'];
    const html = `
    <section class="hero"><div class="wrap hero-grid">
      <div>
        <div class="curated"><span class="line"></span><span class="label">Curated by The Art Plug · Miami</span></div>
        <h1>${words('Original work,', 0)} <em>${words('straight from the', 2)} <span class="w tagged" style="--i:5">studio.${SPRAY}</span></em></h1>
        <p class="lede">CORE, the Creators & Originals Resource Exchange, connects painters, designers, fashion makers, collectible artists and digital artists with the people who collect them. You talk to creators directly, and CORE never takes a commission on a sale.</p>
        <div class="ctas"><a class="btn btn-primary btn-lg" href="#/join?role=creator">Open your studio</a><a class="btn btn-secondary btn-lg" href="#/join?role=collector">Start collecting</a></div>
        <div class="fineprint"><span>${icon('check', 'i-sm')} Free to join</span><span>${icon('check', 'i-sm')} 0% commission</span><span>${icon('check', 'i-sm')} Every creator gets featured</span></div>
      </div>
      <div class="stage" id="spot" aria-roledescription="carousel" aria-label="Spotlight rotation">
        <div class="stage-light"></div>
        ${STICKER()}
        <div class="stage-top"><span class="label">Spotlight · Week ${D.SPOTLIGHT.week}</span><span class="label">Next rotation in <span class="num">${nextMonday()}</span></span></div>
        <div class="stage-work" id="spot-work" aria-live="polite"></div>
        <div class="stage-foot">
          <div class="stage-label" id="spot-label"></div>
          <div class="stage-controls">
            <button class="icon-btn" id="spot-prev" aria-label="Previous creator">${icon('chevL')}</button>
            <div class="stage-dots" role="tablist">${spot.map((s, i) => `<button role="tab" data-i="${i}" aria-label="${esc(s.c.name)}"></button>`).join('')}</div>
            <button class="icon-btn" id="spot-next" aria-label="Next creator">${icon('chevR')}</button>
          </div>
        </div>
        <div class="stage-progress" aria-hidden="true"><span id="spot-progress"></span></div>
      </div>
    </div></section>

    ${marquee(['Original work', '<em>straight from the studio</em>', '0% commission', 'Curated by The Art Plug', '<em>Miami to the world</em>', 'Painting', 'Design', 'Fashion', 'Collectibles', 'Digital', '<em>get plugged in</em>'])}

    <section class="wrap"><div class="facts" data-inview>
      <div class="fact"><span class="big num">0%</span><span class="muted small">commission on sales. Creators keep every dollar.</span></div>
      <div class="fact"><span class="big num" data-count="${D.CATEGORIES.length}">${D.CATEGORIES.length}</span><span class="muted small">disciplines: painting, design, fashion, collectibles, digital.</span></div>
      <div class="fact"><span class="big num" data-count="${cityCount}">${cityCount}</span><span class="muted small">cities with open studios, from Miami to Tokyo.</span></div>
      <div class="fact"><span class="big num" data-count="${publicWorks().length}">${publicWorks().length}</span><span class="muted small">original works listed by verified creators.</span></div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head">
        <div><span class="label">In rotation · ${D.SPOTLIGHT.range}</span><h2 class="h2">This week's spotlight</h2></div>
        <p class="muted" style="max-width:52ch">Every verified creator gets the same front-page time. The lineup changes every Monday, one slot is Marcel's pick, and no plan can buy a place.</p>
      </div>
      <div class="grid grid-6">${spot.map(({ c, w }) => `
        <a class="art" href="#/creator/${c.id}" style="gap:12px">
          <div style="position:relative">${boxImg(w)}${S.spotlight.curatorPick === c.id ? `<span class="pill pill-accent no-dot" style="position:absolute;top:8px;left:8px">${pickLabel}</span>` : ''}</div>
          <div class="wall-label"><span class="who">${esc(c.name)}</span><span class="meta">${esc(c.city)} · ${esc(c.category)}</span></div>
        </a>`).join('')}
      </div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="wrap">
      <div class="section-head"><div><span class="label">New this month</span><h2 class="h2">Fresh from the studio</h2></div><a class="link-arrow" href="#/discover?sort=new">See everything new ${icon('arrowR', 'i-sm')}</a></div>
      <div class="masonry">${fresh.map((w) => workCard(w)).join('')}</div>
    </div></section>

    <section class="section" style="background:var(--plinth)"><div class="wrap">
      <div class="section-head"><div><span class="label">Browse by city</span><h2 class="h2">Every dot is a studio</h2></div><p class="muted" style="max-width:50ch">Marcel Katz calls himself a “dot connector”. CORE draws the lines from Miami to studios everywhere, so you can see who has work available wherever you are.</p></div>
      ${dotMap({ counts, action: 'land-city', tags: true, network: true })}
      <div class="chips" style="margin-top:28px">${Object.keys(D.CITIES).map((city) => `<a class="chip" href="#/discover?city=${encodeURIComponent(city)}&avail=1">${esc(city)} <span class="count">${counts[city].works}</span></a>`).join('')}</div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><div><span class="label">Three sides, one exchange</span><h2 class="h2">Who CORE is for</h2></div></div>
      <div class="audiences">
        <div class="audience"><span class="label">Creators</span><h3>Show your work to the world, keep what you earn.</h3>
          <ul><li>${icon('check', 'i-sm')} A portfolio, a shop window and an inbox in one profile</li><li>${icon('check', 'i-sm')} Purchase, commission and studio-visit requests</li><li>${icon('check', 'i-sm')} Featured in rotation, whatever your plan</li></ul>
          <a class="link-arrow" href="#/join?role=creator">Open your studio ${icon('arrowR', 'i-sm')}</a></div>
        <div class="audience"><span class="label">Collectors</span><h3>Buy directly from the person who made it.</h3>
          <ul><li>${icon('check', 'i-sm')} Filter by city, discipline and budget</li><li>${icon('check', 'i-sm')} Follow creators and track every request</li><li>${icon('check', 'i-sm')} Commission custom pieces or visit the studio</li></ul>
          <a class="link-arrow" href="#/join?role=collector">Start collecting ${icon('arrowR', 'i-sm')}</a></div>
        <div class="audience"><span class="label">Brands · Coming soon</span><h3>Find talent for your next collaboration.</h3>
          <ul><li>${icon('check', 'i-sm')} Collabs, campaigns, installations and events</li><li>${icon('check', 'i-sm')} Shortlists curated by The Art Plug</li><li>${icon('check', 'i-sm')} Brief creators without middlemen</li></ul>
          <a class="link-arrow" href="#/brands">Join the waitlist ${icon('arrowR', 'i-sm')}</a></div>
      </div>
    </div></section>

    <section class="universe" data-inview aria-labelledby="universe-title">
      ${drips()}
      <div class="wrap universe-inner">
        <div class="universe-head">
          <div class="stack" style="gap:20px">
            <span class="label">${icon('plug', 'i-sm')} The Art Plug universe</span>
            <h2 class="universe-title" id="universe-title">From the <em>Power House</em> to every studio.</h2>
            <p class="lede">Marcel Katz founded The Art Plug in Miami in 2017 to connect artists, collectors and brands: curation, murals, commissions, collaborations, and the Power House, its immersive show during Miami Art Week. The network grew faster than any agency can follow, one artist at a time. CORE opens it to creators everywhere, with the same eye.</p>
          </div>
          <figure class="quote">
            <blockquote>“…give young collectors an opportunity to buy quality art without spending $100,000.”</blockquote>
            <figcaption><span class="avatar" style="background:var(--accent)">MK</span><span><strong>Marcel Katz</strong><span class="mono">Founder, The Art Plug</span></span></figcaption>
          </figure>
        </div>
        <ol class="tl">
          <li class="tl-step"><span class="tl-year">2017</span><strong>The Art Plug opens in Miami</strong><span>Art advisory, curation, commissions and murals, run by a small hands-on team.</span></li>
          <li class="tl-step"><span class="tl-year">2018</span><strong>The first Power House</strong><span>A police impound lot in Allapattah becomes an art playground for Miami Art Week, with some 30 artists.</span></li>
          <li class="tl-step"><span class="tl-year">2022</span><strong>Power House at The Wharf</strong><span>More than 25 artists, murals, digital art and live DJs on the Miami River.</span></li>
          <li class="tl-step is-now"><span class="tl-year">2026</span><strong>CORE</strong><span>The network goes worldwide. Every verified creator gets a studio page, a spotlight slot and direct access to collectors.</span></li>
        </ol>
        <div>
          <span class="label">Brands The Art Plug has worked with</span>
          <ul class="sr-only">${brands.map((b) => `<li>${b}</li>`).join('')}</ul>
          ${marquee(brands, 'marquee-brands')}
        </div>
        <div class="universe-stats">
          <div><span class="big" data-count="246" data-suffix="K">246K</span><span>people follow The Art Plug on Instagram</span></div>
          <div><span class="big">1 in 6</span><span>spotlight slots each week is Marcel's pick</span></div>
          <div><span class="big">100%</span><span>of creator profiles reviewed by a curator</span></div>
        </div>
      </div>
    </section>

    <section class="section"><div class="wrap">
      <div class="section-head"><div><span class="label">Join CORE</span><h2 class="h2">Get plugged in.</h2></div></div>
      <div class="cta-split">
        <a class="cta-card" href="#/join?role=creator"><span class="label">For creators</span><h3>Open your studio on CORE</h3><p class="muted">Free to start. Upgrade for unlimited works, full stats and one-on-one time with The Art Plug.</p><span class="link-arrow">Create a creator profile ${icon('arrowR', 'i-sm')}</span></a>
        <a class="cta-card" href="#/join?role=collector"><span class="label">For collectors</span><h3>Start a collection you can trace</h3><p class="muted">Always free. Follow creators, save works and contact studios directly.</p><span class="link-arrow">Create a collector account ${icon('arrowR', 'i-sm')}</span></a>
      </div>
    </div></section>`;

    function mount() {
      let i = 0; let timer = null;
      const stage = $('#spot'), workEl = $('#spot-work'), labelEl = $('#spot-label'), dots = $$('.stage-dots button'), bar = $('#spot-progress');
      const restartBar = () => { if (!bar) return; bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; };
      function show(n, first) {
        i = (n + spot.length) % spot.length; const { c, w } = spot[i];
        const paint = () => {
          workEl.innerHTML = `<a href="#/work/${w.id}" aria-label="${esc(w.title)} by ${esc(c.name)}">${artImg(w, { eager: true })}</a>`;
          if (!reduceMotion) { const a = $('.art-img', workEl); if (a) a.classList.add('hang'); }
          labelEl.innerHTML = `<div class="stack" style="gap:3px">${S.spotlight.curatorPick === c.id ? `<span class="pill pill-accent no-dot" style="align-self:flex-start;margin-bottom:4px">${pickLabel}</span>` : ''}<a href="#/creator/${c.id}" style="text-decoration:none;font-weight:600;font-size:.875rem">${esc(c.name)} · ${esc(c.city)}</a><a class="what" href="#/work/${w.id}" style="text-decoration:none"><em>${esc(w.title)}</em>, ${w.year}</a><span class="mono muted">${esc(w.medium)} · ${dims(w)}</span>${priceLine(w)}</div>`;
          workEl.classList.remove('is-leaving');
        };
        dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
        if (first || reduceMotion) paint(); else { workEl.classList.add('is-leaving'); setTimeout(paint, 260); }
        restartBar();
      }
      function start() { if (reduceMotion) return; stop(); stage.classList.remove('is-paused'); restartBar(); timer = setInterval(() => show(i + 1), 6500); }
      function stop() { if (timer) clearInterval(timer); timer = null; stage.classList.add('is-paused'); }
      $('#spot-prev').addEventListener('click', () => { show(i - 1); start(); });
      $('#spot-next').addEventListener('click', () => { show(i + 1); start(); });
      dots.forEach((d) => d.addEventListener('click', () => { show(+d.dataset.i); start(); }));
      stage.addEventListener('mouseenter', stop); stage.addEventListener('mouseleave', start);
      stage.addEventListener('focusin', stop);
      show(0, true); start();
      cleanups.push(stop);
    }
    return { html, mount, title: 'Original work, straight from the studio' };
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action="land-city"]'); if (!b) return;
    location.hash = `#/discover?city=${encodeURIComponent(b.dataset.city)}&avail=1`;
  });

  /* ================= 2. discover ================= */
  const BUDGETS = [['', 'Any budget'], ['u1', 'Under $1,000'], ['1-3', '$1,000 – $3,000'], ['3-7', '$3,000 – $7,500'], ['7p', '$7,500 and up']];
  const inBudget = (p, b) => !b || (b === 'u1' && p < 1000) || (b === '1-3' && p >= 1000 && p < 3000) || (b === '3-7' && p >= 3000 && p < 7500) || (b === '7p' && p >= 7500);
  const SORTS = [['fair', 'Fair shuffle'], ['new', 'Newest'], ['asc', 'Price: low to high'], ['desc', 'Price: high to low']];
  let DQ = {};
  function daySeed() { const d = new Date(); return d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate(); }
  function fairOrder(list) {
    return list.map((w) => ({ w, k: Art.hashStr(w.id + daySeed()) })).sort((a, b) => a.k - b.k).map((x) => x.w);
  }
  function discoverView(r) {
    const q = r.q;
    DQ = { text: q.q || '', city: D.CITIES[q.city] ? q.city : '', cat: D.CATEGORIES.includes(q.cat) ? q.cat : '', budget: q.budget || '', avail: q.avail === '1', sort: q.sort || 'fair', tab: q.tab === 'creators' ? 'creators' : 'works', view: q.view === 'map' ? 'map' : 'grid' };
    const html = `
    <section class="wrap page-head">
      <span class="label">Discover</span>
      <h1 class="h1" style="margin-block:10px 24px">Original work, city by city.</h1>
      <div class="search" id="d-search">
        ${icon('search')}
        <input id="d-q" type="search" placeholder="Search a city, creator or work" aria-label="Search a city, creator or work" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="d-suggest" aria-autocomplete="list" value="${esc(DQ.text)}">
        <button class="btn btn-primary btn-sm" id="d-go" style="border-radius:999px">Search</button>
        <div class="suggest" id="d-suggest" role="listbox" hidden></div>
      </div>
      <div class="quick"><span class="label">Try</span>
        ${['Paris', 'Miami', 'New York', 'Tokyo', 'Lagos'].map((c) => `<button class="chip" data-dq="near" data-city="${c}">${icon('pin', 'i-sm')} I'm in ${c}</button>`).join('')}
      </div>
    </section>
    <div class="filters"><div class="wrap filters-row" id="d-filters"></div></div>
    <section class="wrap" id="d-results" aria-live="polite"></section>`;
    return { html, mount: mountDiscover, title: 'Discover' };
  }
  function syncHash() {
    const p = new URLSearchParams();
    if (DQ.text) p.set('q', DQ.text); if (DQ.city) p.set('city', DQ.city); if (DQ.cat) p.set('cat', DQ.cat); if (DQ.budget) p.set('budget', DQ.budget);
    if (DQ.avail) p.set('avail', '1'); if (DQ.sort !== 'fair') p.set('sort', DQ.sort); if (DQ.tab !== 'works') p.set('tab', DQ.tab); if (DQ.view !== 'grid') p.set('view', DQ.view);
    const s = p.toString(); history.replaceState(null, '', '#/discover' + (s ? '?' + s : ''));
    renderHeader(parse()); renderProto();
  }
  function matchWork(w, ignoreCity) {
    if (!ignoreCity && DQ.city && w.city !== DQ.city) return false;
    if (DQ.cat && w.category !== DQ.cat) return false;
    if (DQ.avail && !(w.status === 'available' || w.status === 'commission')) return false;
    if (DQ.budget && (w.status === 'sold' || !inBudget(w.price, DQ.budget))) return false;
    if (DQ.text) { const c = creator(w.creatorId); const hay = (w.title + ' ' + c.name + ' ' + w.medium + ' ' + w.city + ' ' + w.category).toLowerCase(); if (!hay.includes(DQ.text.toLowerCase())) return false; }
    return true;
  }
  function sortWorks(list) {
    if (DQ.sort === 'new') return list.sort((a, b) => a.addedDaysAgo - b.addedDaysAgo);
    if (DQ.sort === 'asc') return list.sort((a, b) => a.price - b.price);
    if (DQ.sort === 'desc') return list.sort((a, b) => b.price - a.price);
    return fairOrder(list);
  }
  function renderFilters() {
    $('#d-filters').innerHTML = `
      <div class="chips" role="group" aria-label="Discipline">
        <button class="chip" data-dq="cat" data-v="" aria-pressed="${!DQ.cat}">All</button>
        ${D.CATEGORIES.map((c) => `<button class="chip" data-dq="cat" data-v="${c}" aria-pressed="${DQ.cat === c}">${c}</button>`).join('')}
      </div>
      <div class="group">
        <label class="select ${DQ.city ? 'is-set' : ''}"><span class="sr-only">City</span><select id="d-city"><option value="">All cities</option>${Object.keys(D.CITIES).map((c) => `<option value="${esc(c)}" ${DQ.city === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>${icon('chevD')}</label>
        <label class="select ${DQ.budget ? 'is-set' : ''}"><span class="sr-only">Budget</span><select id="d-budget">${BUDGETS.map(([v, t]) => `<option value="${v}" ${DQ.budget === v ? 'selected' : ''}>${t}</option>`).join('')}</select>${icon('chevD')}</label>
        <label class="toggle"><input type="checkbox" id="d-avail" ${DQ.avail ? 'checked' : ''}><span class="track"></span>Available now</label>
      </div>
`;
    $('#d-city').onchange = (e) => upd({ city: e.target.value });
    $('#d-budget').onchange = (e) => upd({ budget: e.target.value });
    $('#d-avail').onchange = (e) => upd({ avail: e.target.checked });
  }
  function upd(patch) { Object.assign(DQ, patch); renderFilters(); renderResults(); syncHash(); }
  function renderResults() {
    const el = $('#d-results');
    const works = sortWorks(publicWorks().filter((w) => matchWork(w)));
    const creatorIds = [...new Set(publicWorks().filter((w) => matchWork(w)).map((w) => w.creatorId))];
    let creators = D.creators.filter((c) => creatorIds.includes(c.id));
    if (!DQ.budget && !DQ.avail && !DQ.text) creators = D.creators.filter((c) => (!DQ.city || c.city === DQ.city) && (!DQ.cat || c.category === DQ.cat));
    creators = fairOrder(creators.map((c) => ({ ...c, id: c.id }))).map((c) => creator(c.id));
    const cityInfo = DQ.city ? D.CITIES[DQ.city] : null;
    const openStudios = creators.filter((c) => c.studio.open).length;
    const availCount = works.filter((w) => w.status !== 'sold').length;
    const head = `<div class="result-bar">
      <div>
        <h2 class="h2">${DQ.city ? esc(DQ.city) : DQ.text ? `Results for “${esc(DQ.text)}”` : 'Everywhere'}</h2>
        <p class="muted small" style="margin-top:6px">${cityInfo ? esc(cityInfo.country) + ' · ' : ''}${creators.length} creator${creators.length === 1 ? '' : 's'} · ${availCount} work${availCount === 1 ? '' : 's'} you can buy or commission${openStudios ? ` · ${openStudios} open studio${openStudios === 1 ? '' : 's'}` : ''}</p>
      </div>
      <div class="row" style="gap:14px">
        ${DQ.sort === 'fair' ? `<span class="fair-note">${icon('shuffle', 'i-sm')} Reshuffled daily, so no creator is always first</span>` : ''}
        <label class="select"><span class="sr-only">Sort</span><select id="d-sort">${SORTS.map(([v, t]) => `<option value="${v}" ${DQ.sort === v ? 'selected' : ''}>${t}</option>`).join('')}</select>${icon('chevD')}</label>
        <div class="seg" role="group" aria-label="View"><button data-dq="view" data-v="grid" aria-pressed="${DQ.view === 'grid'}">${icon('grid', 'i-sm')} Grid</button><button data-dq="view" data-v="map" aria-pressed="${DQ.view === 'map'}">${icon('map', 'i-sm')} Map</button></div>
      </div>
    </div>
    <div class="tabs" role="tablist" aria-label="Result type">
      <button role="tab" data-dq="tab" data-v="works" aria-selected="${DQ.tab === 'works'}">Works<span class="count">${works.length}</span></button>
      <button role="tab" data-dq="tab" data-v="creators" aria-selected="${DQ.tab === 'creators'}">Creators<span class="count">${creators.length}</span></button>
    </div>`;
    let body = '';
    const empty = () => `<div class="empty" style="margin-top:32px"><p class="h3">Nothing matches ${DQ.city ? 'in ' + esc(DQ.city) + ' ' : ''}with these filters yet.</p><p class="muted">Try widening your budget or discipline${DQ.city ? ', or look at creators who ship to ' + esc(DQ.city) : ''}.</p><div class="row" style="justify-content:center">${DQ.budget || DQ.cat ? `<button class="btn btn-primary btn-sm" data-dq="widen">Show all of ${DQ.city ? esc(DQ.city) : 'CORE'}</button>` : ''}<button class="btn btn-secondary btn-sm" data-dq="clear">Clear all filters</button></div></div>`;
    const grid = () => (DQ.tab === 'works' ? (works.length ? `<div class="masonry" style="margin-top:32px">${works.map((w) => workCard(w, { showCity: !DQ.city })).join('')}</div>` : empty()) : (creators.length ? `<div class="grid grid-3" style="margin-top:32px">${creators.map(creatorCard).join('')}</div>` : empty()));
    if (DQ.view === 'map') {
      const counts = cityCounts((w) => matchWork(w, true));
      body = `<div class="map-layout">
        <div class="map-panel">${dotMap({ counts, active: DQ.city, action: 'dq-city' })}</div>
        <div><span class="label">Cities</span><ul class="city-list" style="margin-top:8px">${Object.keys(D.CITIES).sort((a, b) => counts[b].works - counts[a].works).map((c) => `<li><button data-action="dq-city" data-city="${esc(c)}" class="${DQ.city === c ? 'is-active' : ''}" aria-pressed="${DQ.city === c}">${icon('pin', 'i-sm')} ${esc(c)} <span class="mono">${counts[c].works} work${counts[c].works === 1 ? '' : 's'}</span></button></li>`).join('')}</ul></div>
      </div>
      ${DQ.city ? grid() : `<div class="empty" style="margin-top:32px"><p class="h3">Pick a city on the map</p><p class="muted">Pins show how many works you can buy or commission in each city right now.</p></div>`}`;
    } else body = grid();
    el.innerHTML = head + body;
    $('#d-sort').onchange = (e) => upd({ sort: e.target.value });
  }
  function mountDiscover() {
    renderFilters(); renderResults();
    const input = $('#d-q'), box = $('#d-suggest');
    let hl = -1, items = [];
    function suggestions(t) {
      t = t.trim().toLowerCase(); if (!t) return [];
      const out = [];
      Object.keys(D.CITIES).forEach((c) => { if (c.toLowerCase().includes(t) || D.CITIES[c].country.toLowerCase().includes(t)) out.push({ kind: 'City', label: c, sub: D.CITIES[c].country, city: c }); });
      D.creators.forEach((c) => { if (c.name.toLowerCase().includes(t)) out.push({ kind: 'Creator', label: c.name, sub: c.city, go: '#/creator/' + c.id }); });
      publicWorks().forEach((w) => { if (w.title.toLowerCase().includes(t)) out.push({ kind: 'Work', label: w.title, sub: creator(w.creatorId).name, go: '#/work/' + w.id }); });
      return out.slice(0, 7);
    }
    function draw() {
      if (!items.length) { box.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
      box.innerHTML = items.map((s, k) => `<button role="option" id="sg-${k}" class="${k === hl ? 'is-hl' : ''}" aria-selected="${k === hl}" data-k="${k}">${icon(s.kind === 'City' ? 'pin' : s.kind === 'Creator' ? 'user' : 'image', 'i-sm')}<span><strong>${esc(s.label)}</strong> <span class="muted">${esc(s.sub)}</span></span><span class="kind">${s.kind}</span></button>`).join('');
      box.hidden = false; input.setAttribute('aria-expanded', 'true');
      if (hl >= 0) input.setAttribute('aria-activedescendant', 'sg-' + hl); else input.removeAttribute('aria-activedescendant');
    }
    function choose(s) {
      box.hidden = true; items = [];
      if (s.city) { input.value = ''; upd({ city: s.city, text: '' }); } else location.hash = s.go;
    }
    let deb;
    input.addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(() => { items = suggestions(input.value); hl = -1; draw(); }, 120); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); hl = (hl + 1) % items.length; draw(); }
      else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); hl = (hl - 1 + items.length) % items.length; draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (hl >= 0) choose(items[hl]); else { box.hidden = true; const t = input.value.trim(); const city = Object.keys(D.CITIES).find((c) => c.toLowerCase() === t.toLowerCase()); upd(city ? { city, text: '' } : { text: t }); if (city) input.value = ''; } }
      else if (e.key === 'Escape') { box.hidden = true; }
    });
    box.addEventListener('mousedown', (e) => { const b = e.target.closest('[data-k]'); if (b) { e.preventDefault(); choose(items[+b.dataset.k]); } });
    input.addEventListener('blur', () => setTimeout(() => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); }, 120));
    $('#d-go').addEventListener('click', () => { const t = input.value.trim(); const city = Object.keys(D.CITIES).find((c) => c.toLowerCase() === t.toLowerCase()); if (city) { input.value = ''; upd({ city, text: '' }); } else upd({ text: t }); });

    const onClick = (e) => {
      const b = e.target.closest('[data-dq], [data-action="dq-city"]'); if (!b || !main.contains(b)) return;
      const k = b.dataset.dq || 'city';
      if (k === 'cat') upd({ cat: b.dataset.v });
      if (k === 'view') upd({ view: b.dataset.v });
      if (k === 'tab') upd({ tab: b.dataset.v });
      if (k === 'near') { input.value = ''; upd({ city: b.dataset.city, avail: true, text: '' }); toast(`Showing work you can get in ${b.dataset.city}`); }
      if (k === 'city') upd({ city: DQ.city === b.dataset.city ? '' : b.dataset.city });
      if (k === 'widen') upd({ budget: '', cat: '', text: '' });
      if (k === 'clear') { input.value = ''; upd({ city: '', budget: '', cat: '', avail: false, text: '' }); }
    };
    main.addEventListener('click', onClick);
    cleanups.push(() => main.removeEventListener('click', onClick));
  }

  /* ================= 3. creator profile ================= */
  function creatorView(r) {
    const c = creator(r.parts[1]);
    if (!c) return notFound();
    const ws = worksOf(c.id);
    const avail = ws.filter((w) => w.status !== 'sold');
    const hero = featuredWork(c.id);
    const following = isFollowing(c.id);
    const isMe = S.role === 'creator' && c.id === D.ME_CREATOR;
    const html = `
    <div class="wrap" style="padding-top:20px"><nav aria-label="Breadcrumb" class="small muted"><a class="link" href="#/discover">Discover</a> / <a class="link" href="#/discover?city=${encodeURIComponent(c.city)}">${esc(c.city)}</a> / <span>${esc(c.name)}</span></nav></div>
    <section class="wrap profile-hero">
      <a class="showcase" href="#/work/${hero.id}" aria-label="Featured work: ${esc(hero.title)}">${artImg(hero, { eager: true })}</a>
      <div class="stack" style="gap:22px">
        ${badge(c)}
        <div class="row" style="gap:18px;flex-wrap:nowrap">${avatar(c, 'avatar-lg')}<h1 class="profile-name">${esc(c.name)}</h1></div>
        <div class="meta-list"><span>${icon('pin', 'i-sm')} ${esc(c.city)}, ${esc(D.CITIES[c.city].country)}</span><span>${icon('brush', 'i-sm')} ${esc(c.category)}</span><span>${icon('at', 'i-sm')} ${esc(c.handle)}</span></div>
        <p class="lede">${esc(c.bio)}</p>
        <div class="stats-inline">
          <div><strong data-followers="${c.id}">${followerCount(c).toLocaleString('en-US')}</strong><span class="label">Followers</span></div>
          <div><strong>${avail.length}</strong><span class="label">Available</span></div>
          <div><strong>${ws.length}</strong><span class="label">In portfolio</span></div>
        </div>
        ${isMe ? `<div class="row"><a class="btn btn-primary" href="#/studio/profile">${icon('edit', 'i-sm')} Edit profile</a><a class="btn btn-secondary" href="#/studio">Back to studio</a></div>` : `
        <div class="row">
          <button class="btn btn-secondary btn-follow" data-action="follow" data-id="${c.id}" aria-pressed="${following}">${following ? icon('check', 'i-sm') + ' Following' : icon('plus', 'i-sm') + ' Follow'}</button>
          <a class="btn btn-primary" href="#/request?creator=${c.id}&type=purchase">${icon('message', 'i-sm')} Contact ${esc(first(c.name))}</a>
          ${c.studio.open ? `<a class="btn btn-secondary" href="#/request?creator=${c.id}&type=visit">${icon('door', 'i-sm')} Book a studio visit</a>` : ''}
        </div>`}
        <p class="small muted">${icon('clock', 'i-sm')} ${esc(c.replies)} · On CORE since ${esc(c.joined)}</p>
      </div>
    </section>
    <div class="wrap"><div class="tabs" role="tablist" aria-label="Profile sections">
      <button role="tab" data-tab="available" aria-selected="true">Available<span class="count">${avail.length}</span></button>
      <button role="tab" data-tab="portfolio" aria-selected="false">Portfolio<span class="count">${ws.length}</span></button>
      <button role="tab" data-tab="about" aria-selected="false">About & studio</button>
    </div></div>
    <section class="wrap section-tight" id="cp-panel"></section>`;
    function panel(tab) {
      const el = $('#cp-panel');
      if (tab === 'available') el.innerHTML = avail.length ? `<div class="masonry">${avail.map((w) => workCard(w, { hideCreator: true })).join('')}</div>` : `<div class="empty"><p class="h3">Nothing available right now</p><p class="muted">Follow ${esc(first(c.name))} to hear about new work, or ask about a commission.</p></div>`;
      if (tab === 'portfolio') el.innerHTML = `<div class="masonry">${ws.map((w) => workCard(w, { hideCreator: true })).join('')}</div>`;
      if (tab === 'about') el.innerHTML = `<div class="two-col">
        <div class="prose"><span class="label">Statement</span><p class="quote">“${esc(c.statement)}”</p><p>${esc(c.bio)}</p></div>
        <div class="stack" style="gap:24px">
          <div class="studio-card"><span class="label">Studio visits</span>${c.studio.open ? `<strong>${esc(c.studio.where)}</strong><span class="muted small">${esc(c.studio.when)}</span>${isMe ? '' : `<a class="link-arrow" style="margin-top:8px" href="#/request?creator=${c.id}&type=visit">Request a visit ${icon('arrowR', 'i-sm')}</a>`}` : `<span class="muted small">${esc(first(c.name))} doesn't host studio visits at the moment.</span>`}</div>
          <div><span class="label">Shows & moments</span><ul class="list-plain" style="margin-top:8px">${c.shows.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
        </div>
      </div>`;
    }
    function mount() {
      panel('available');
      $$('[data-tab]').forEach((b) => b.addEventListener('click', () => { $$('[data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b)); panel(b.dataset.tab); }));
    }
    return { html, mount, title: c.name };
  }

  /* ================= 4. work page ================= */
  function workView(r) {
    const w = work(r.parts[1]);
    if (!w) return notFound();
    const c = creator(w.creatorId);
    const obj = Art.isObject(w.art.gen);
    const st = STATUS[w.status];
    const saved = S.role !== 'visitor' && S.saved.includes(w.id);
    const more = worksOf(c.id).filter((x) => x.id !== w.id).slice(0, 4);
    const views = obj ? [['front', 'Front'], ['detail', 'Detail'], ['side', 'Side']] : [['front', 'Front'], ['detail', 'Detail'], ['room', 'In a room'], ['angle', 'Angle']];
    const buy = w.status === 'available' || w.status === 'reserved';
    const html = `
    <div class="wrap" style="padding-top:20px"><nav aria-label="Breadcrumb" class="small muted"><a class="link" href="#/discover?city=${encodeURIComponent(c.city)}">${esc(c.city)}</a> / <a class="link" href="#/creator/${c.id}">${esc(c.name)}</a> / <span>${esc(w.title)}</span></nav></div>
    <section class="wrap work-layout">
      <div class="viewer">
        <div class="viewer-stage" id="vw-stage"></div>
        <div class="thumbs" role="group" aria-label="Photos">${views.map(([k, t], i) => `<button class="thumb" data-view="${k}" aria-pressed="${i === 0}" aria-label="${t} view">${thumbFor(w, k)}<span class="t-label">${t}</span></button>`).join('')}</div>
      </div>
      <aside class="work-info">
        <a class="work-by" href="#/creator/${c.id}">${avatar(c)}<span><strong style="display:block;font-size:.9375rem">${esc(c.name)}</strong><span class="mono muted">${esc(c.city)} · ${esc(c.category)}</span></span></a>
        <div class="stack" style="gap:14px">
          <h1 class="work-title">${esc(w.title)}</h1>
          ${SHARED[w.id] ? `<span class="pill pill-accent no-dot" style="align-self:flex-start">${icon('plug', 'i-sm')} Shared by The Art Plug · ${SHARED[w.id]}</span>` : ''}
          <div class="row" style="gap:14px">${w.status === 'sold' ? '<span class="price-big muted">Sold</span>' : `<span class="price-big">${w.status === 'commission' ? '<span style="font-size:.5em">from</span> ' : ''}${money(w.price)}</span>`}<span class="pill ${st.pill}">${st.label}</span></div>
        </div>
        <p style="color:var(--ink-2)">${esc(w.description)}</p>
        <dl class="spec">
          <dt>Year</dt><dd>${w.year}</dd>
          <dt>Medium</dt><dd>${esc(w.medium)}</dd>
          <dt>Size</dt><dd>${dimsFull(w)}</dd>
          ${w.edition ? `<dt>Edition</dt><dd>${esc(w.edition)}, signed and numbered</dd>` : `<dt>Edition</dt><dd>Unique piece</dd>`}
          <dt>Ships from</dt><dd>${esc(c.city)}, ${esc(D.CITIES[c.city].country)}</dd>
          <dt>Studio</dt><dd>${c.studio.open ? 'Open for visits · ' + esc(c.studio.when) : 'No visits'}</dd>
        </dl>
        <div class="stack" style="gap:10px">
          ${buy ? `<a class="btn btn-primary btn-lg btn-block" href="#/request?type=purchase&work=${w.id}">${icon('tag', 'i-sm')} ${w.status === 'reserved' ? 'Join the waitlist for this work' : 'Request to buy'}</a>` : ''}
          <a class="btn ${buy ? 'btn-secondary' : 'btn-primary'} btn-lg btn-block" href="#/request?type=commission&work=${w.id}">${icon('brush', 'i-sm')} ${w.status === 'commission' ? 'Order this piece' : w.status === 'sold' ? 'Commission something similar' : 'Commission a custom piece'}</a>
          <div class="row" style="gap:10px">
            ${c.studio.open ? `<a class="btn btn-ghost btn-sm" href="#/request?type=visit&work=${w.id}">${icon('door', 'i-sm')} See it at the studio</a>` : ''}
            <button class="btn btn-ghost btn-sm" data-action="save" data-id="${w.id}" aria-pressed="${saved}">${icon('bookmark', 'i-sm')} Save</button>
          </div>
        </div>
        <div class="zero-note">${icon('percent')}<span><strong>0% commission.</strong> You agree on payment and delivery directly with ${esc(first(c.name))}. CORE never takes a cut of the sale.</span></div>
      </aside>
    </section>
    ${more.length ? `<section class="wrap section-tight"><div class="section-head"><div><span class="label">More from the studio</span><h2 class="h2">More by ${esc(c.name)}</h2></div><a class="link-arrow" href="#/creator/${c.id}">View profile ${icon('arrowR', 'i-sm')}</a></div><div class="grid grid-4" style="align-items:end">${more.map((x) => workCard(x, { hideCreator: true })).join('')}</div></section>` : ''}`;

    function stage(mode) {
      const el = $('#vw-stage'); el.className = 'viewer-stage mode-' + mode;
      if (mode === 'front' || mode === 'angle' || mode === 'side') {
        el.innerHTML = `<div class="fit">${artImg(w, { eager: true, side: mode === 'side' })}</div>`;
        fitArt();
      } else if (mode === 'detail') {
        el.innerHTML = `<div class="zoom" style="background-image:url(&quot;${Art.src(w.art)}&quot;);background-position:${obj ? '50% 60%' : '14% 18%'}" role="img" aria-label="Detail of ${esc(w.title)}"></div><span class="room-scale">Detail · 2×</span>`;
      } else if (mode === 'room') {
        const wallW = 400, wallH = 320; // cm represented by the stage (5:4)
        const aw = (w.w / wallW) * 100, ah = (w.h / wallH) * 100, center = 14 + (150 / wallH) * 100;
        el.innerHTML = `<div class="room" role="img" aria-label="${esc(w.title)} hung on a wall at true scale, above a 150 cm bench">
          <div class="floor"></div>
          <div class="hung ${kindOf(w) === 'framed' ? 'is-framed' : ''}" style="width:${aw}%;height:${ah}%;bottom:${center}%"><img src="${Art.src(w.art)}" alt=""></div>
          <div class="bench" style="width:${(150 / wallW) * 100}%;height:${(45 / wallH) * 100}%"><div class="top"></div><div class="leg" style="left:6%"></div><div class="leg" style="right:6%"></div></div>
        </div><span class="room-scale">Wall 4 m wide · hung at 150 cm centre · bench 150 cm</span>`;
      }
    }
    // Size the work to the stage in px: 72% × 78% of the wall for 2D pieces, nearly full height for object photos.
    function fitArt() {
      const el = $('#vw-stage'); const box = $('.fit .art-img', el); if (!box) return;
      const ar = obj ? 0.8 : w.w / w.h;
      const bw = el.clientWidth * (obj ? 0.9 : 0.72), bh = el.clientHeight * (obj ? 0.94 : 0.78);
      let width = bw, height = bw / ar;
      if (height > bh) { height = bh; width = bh * ar; }
      box.style.width = Math.round(width) + 'px'; box.style.height = Math.round(height) + 'px';
    }
    function mount() {
      window.addEventListener('resize', fitArt);
      cleanups.push(() => window.removeEventListener('resize', fitArt));
      stage('front');
      $$('.thumb').forEach((b) => b.addEventListener('click', () => { $$('.thumb').forEach((x) => x.setAttribute('aria-pressed', x === b)); stage(b.dataset.view); }));
    }
    return { html, mount, title: w.title };
  }
  function thumbFor(w, k) {
    const src = Art.src({ ...w.art, side: k === 'side' });
    if (k === 'detail') return `<span style="position:absolute;inset:0;background:url(&quot;${src}&quot;) ${Art.isObject(w.art.gen) ? '50% 60%' : '14% 18%'} / 210% no-repeat"></span>`;
    if (k === 'room') return `<span style="position:absolute;inset:0;background:#EFECEA"><span style="position:absolute;left:0;right:0;bottom:0;height:16%;background:#D3CBC4"></span><img src="${src}" alt="" style="position:absolute;left:50%;bottom:46%;transform:translate(-50%,50%);max-height:${Math.min(55, (w.h / 320) * 100 * 1.4)}%;max-width:${Math.min(60, (w.w / 400) * 100 * 1.4)}%"></span>`;
    if (k === 'angle') return `<img src="${src}" alt="" style="transform:perspective(200px) rotateY(-30deg)">`;
    return `<img src="${src}" alt="">`;
  }

  /* ================= 5. request form ================= */
  const TYPES = {
    purchase: { label: 'Buy a work', short: 'Purchase', icon: 'tag', hint: 'Ask about price, shipping or framing.' },
    commission: { label: 'Custom commission', short: 'Commission', icon: 'brush', hint: 'Describe what you would like made.' },
    visit: { label: 'Studio visit', short: 'Studio visit', icon: 'door', hint: 'See the work in person.' },
  };
  function requestView(r) {
    if (r.parts[1] === 'sent') return requestSentView(r.parts[2]);
    const q = r.q;
    const w = q.work ? work(q.work) : null;
    const c = creator(w ? w.creatorId : q.creator);
    if (!c) return notFound();
    let type = TYPES[q.type] ? q.type : 'purchase';
    if (w && w.status === 'commission' && type === 'purchase') type = 'commission';
    if (w && w.status === 'sold' && type === 'purchase') type = 'commission';
    const available = worksOf(c.id).filter((x) => x.status === 'available' || x.status === 'reserved');
    const signed = S.role === 'collector';
    const me = D.COLLECTOR;
    const today = new Date().toISOString().slice(0, 10);
    const html = `
    <div class="wrap" style="padding-top:20px"><a class="link small" href="${w ? '#/work/' + w.id : '#/creator/' + c.id}">${icon('arrowL', 'i-sm')} Back to ${w ? esc(w.title) : esc(c.name)}</a></div>
    <section class="wrap request-layout">
      <form class="form" id="req-form" novalidate>
        <div><span class="label">Contact ${esc(c.name)}</span><h1 class="h1" style="margin-top:10px">What would you like to do?</h1></div>
        <fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Request type</legend>
          <div class="type-picker">${Object.entries(TYPES).map(([k, t]) => {
            const disabled = (k === 'visit' && !c.studio.open) || (k === 'purchase' && w && (w.status === 'sold' || w.status === 'commission'));
            return `<label class="type-opt" style="${disabled ? 'opacity:.45;cursor:not-allowed' : ''}"><input type="radio" name="type" value="${k}" ${type === k ? 'checked' : ''} ${disabled ? 'disabled' : ''}><strong>${icon(t.icon, 'i-sm')} ${t.label}</strong><span>${disabled ? (k === 'visit' ? 'No studio visits for now' : 'Not for sale as is') : t.hint}</span></label>`;
          }).join('')}</div>
        </fieldset>
        <div id="type-fields"></div>
        <div class="form-grid">
          <div class="field"><label for="f-name">Your name</label><input class="input" id="f-name" name="name" autocomplete="name" value="${signed ? esc(me.name) : ''}"></div>
          <div class="field"><label for="f-email">Email</label><input class="input" id="f-email" name="email" type="email" autocomplete="email" value="${signed ? esc(me.email) : ''}"><span class="help">Shared with ${esc(first(c.name))} only once they reply.</span></div>
        </div>
        <div class="field"><label for="f-city">Your city</label><input class="input" id="f-city" name="city" autocomplete="address-level2" value="${signed ? esc(me.city) : ''}" placeholder="e.g. Miami"></div>
        <div class="field"><label for="f-msg">Message to ${esc(first(c.name))}</label><textarea id="f-msg" name="message" placeholder=""></textarea><span class="help" id="msg-help">Be simple, genuine and direct. A few lines about you and what you're looking for get the fastest replies.</span></div>
        <label class="check"><input type="checkbox" id="f-updates" checked> Email me when ${esc(first(c.name))} replies or posts new work</label>
        <div class="row"><button class="btn btn-primary btn-lg" type="submit">${icon('mail', 'i-sm')} Send request</button><span class="small muted">No payment now. Nothing is charged through CORE.</span></div>
      </form>
      <aside class="summary" id="req-summary"></aside>
    </section>`;

    function fields(t) {
      const el = $('#type-fields');
      if (t === 'purchase') el.innerHTML = `<div class="form-grid">
        ${w ? '' : `<div class="field"><label for="f-work">Which work?</label><select id="f-work" name="work">${available.map((x) => `<option value="${x.id}">${esc(x.title)} · ${money(x.price)}</option>`).join('')}</select></div>`}
        <div class="field"><label for="f-delivery">Delivery</label><select id="f-delivery" name="delivery"><option>Ship it to me</option><option>I'll pick it up at the studio</option><option>Not sure yet</option></select></div>
        ${w ? `<div class="field"><label for="f-offer">Your budget <span class="opt">(optional)</span></label><input class="input" id="f-offer" name="offer" inputmode="numeric" placeholder="${money(w.price)}"></div>` : ''}
      </div>`;
      if (t === 'commission') el.innerHTML = `<div class="stack" style="gap:20px"><div class="form-grid">
        <div class="field"><label for="f-budget">Budget</label><select id="f-budget" name="budget"><option>Under $1,000</option><option ${w && w.price >= 1000 && w.price < 2500 ? 'selected' : ''}>$1,000 – $2,500</option><option ${w && w.price >= 2500 && w.price < 7500 ? 'selected' : ''}>$3,000 – $7,500</option><option ${w && w.price >= 7500 ? 'selected' : ''}>$7,500 and up</option></select></div>
        <div class="field"><label for="f-timeline">Timeline</label><select id="f-timeline" name="timeline"><option>No rush</option><option>Within 6 months</option><option selected>Within 3 months</option><option>Within a month</option></select></div>
      </div>
      <div class="field"><label for="f-size">Size, colors, materials <span class="opt">(optional)</span></label><input class="input" id="f-size" name="size" placeholder="${w && !Art.isObject(w.art.gen) ? 'e.g. about 100 × 150 cm, warmer palette' : 'e.g. navy wool, size M, for summer'}"></div>
      <div class="field"><span class="flabel">Reference images <span class="opt">(optional)</span></span><label class="dropzone" for="f-refs">${icon('upload')}<span id="refs-label">Add photos of your space or references. JPG or PNG, up to 10 MB each.</span></label><input id="f-refs" type="file" accept="image/*" multiple class="sr-only"></div></div>`;
      if (t === 'visit') el.innerHTML = `<div class="stack" style="gap:20px">
        <div class="studio-card"><span class="label">Studio</span><strong>${esc(c.studio.where || '')}</strong><span class="small muted">${esc(c.studio.when || '')}. The exact address is shared once ${esc(first(c.name))} confirms.</span></div>
        <div class="form-grid">
          <div class="field"><label for="f-date1">Preferred date</label><input class="input" id="f-date1" name="date1" type="date" min="${today}"></div>
          <div class="field"><label for="f-date2">Another date that works <span class="opt">(optional)</span></label><input class="input" id="f-date2" name="date2" type="date" min="${today}"></div>
        </div>
        <div class="field" style="max-width:240px"><label for="f-group">People coming</label><select id="f-group" name="group"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5 or more</option></select></div></div>`;
      const refs = $('#f-refs');
      if (refs) refs.addEventListener('change', () => { $('#refs-label').textContent = refs.files.length ? Array.from(refs.files).map((f) => f.name).join(', ') : 'Add photos of your space or references.'; });
      const ph = { purchase: w ? `Hi ${first(c.name)}, I love ${w.title}. Is it still available, and could you ship to my city?` : `Hi ${first(c.name)}, I'm interested in one of your works…`, commission: `Hi ${first(c.name)}, I'd love a piece in the spirit of ${w ? w.title : 'your recent work'}, for…`, visit: `Hi ${first(c.name)}, I'll be in ${c.city} soon and would love to see your work in person…` };
      $('#f-msg').placeholder = ph[t];
      summary(t);
    }
    function summary(t) {
      const sel = !w && t === 'purchase' && $('#f-work') ? work($('#f-work').value) : w;
      $('#req-summary').innerHTML = `
        <span class="label">${TYPES[t].short} request</span>
        ${sel ? `<div style="display:grid;place-items:center;padding:12px 0">${artImg(sel)}</div><div class="wall-label"><span class="what"><em>${esc(sel.title)}</em>, ${sel.year}</span><span class="meta">${esc(sel.medium)} · ${dims(sel)}</span>${priceLine(sel)}</div>` : ''}
        <div class="row" style="gap:12px">${avatar(c)}<div><strong style="font-size:.875rem">${esc(c.name)}</strong><div class="mono muted">${esc(c.city)} · ${esc(c.replies.replace('Usually replies ', 'replies '))}</div></div></div>
        <hr class="rule">
        <ol class="steps small">
          <li><span>${esc(first(c.name))} gets your request by email and in their CORE inbox.</span></li>
          <li><span>You agree together on price, payment and delivery, or a time to visit.</span></li>
          <li><span>You pay the creator directly. CORE takes 0% of the sale.</span></li>
        </ol>`;
      const fw = $('#f-work'); if (fw) fw.onchange = () => summary('purchase');
    }
    function mount() {
      fields(type);
      $$('input[name="type"]').forEach((i) => i.addEventListener('change', () => { type = i.value; fields(type); }));
      $('#req-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target; let ok = true; let firstBad = null;
        $$('.field.has-error', f).forEach((x) => { x.classList.remove('has-error'); const er = $('.err', x); if (er) er.remove(); });
        const err = (id, msg) => { const inp = $('#' + id); const fl = inp.closest('.field'); fl.classList.add('has-error'); fl.insertAdjacentHTML('beforeend', `<span class="err" id="${id}-err">${icon('alert', 'i-sm')} ${msg}</span>`); inp.setAttribute('aria-describedby', id + '-err'); inp.setAttribute('aria-invalid', 'true'); ok = false; firstBad = firstBad || inp; };
        if (!$('#f-name').value.trim()) err('f-name', 'Add your name so the creator knows who is writing.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#f-email').value.trim())) err('f-email', 'Enter an email address like name@example.com.');
        if ($('#f-msg').value.trim().length < 20) err('f-msg', 'Write at least 20 characters. A short intro gets faster replies.');
        if (type === 'visit' && !$('#f-date1').value) err('f-date1', 'Pick a date for your visit.');
        if (!ok) { firstBad.focus(); return; }
        const fmtDate = (v) => new Date(v + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const now = new Date(); const at = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + now.toTimeString().slice(0, 5);
        const req = {
          id: 'r' + Date.now(), mine: true, type, creatorId: c.id,
          workId: w ? w.id : ($('#f-work') ? $('#f-work').value : null),
          from: { name: $('#f-name').value.trim(), city: $('#f-city').value.trim(), email: $('#f-email').value.trim() },
          date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), status: 'new',
          thread: [{ who: 'collector', at, text: $('#f-msg').value.trim() }],
        };
        if (type === 'commission') { req.budget = $('#f-budget').value; req.timeline = $('#f-timeline').value; }
        if (type === 'visit') { req.dates = [$('#f-date1').value, $('#f-date2').value].filter(Boolean).map(fmtDate); req.group = $('#f-group').value; }
        S.requests.unshift(req);
        if (S.role === 'visitor') S.role = 'collector';
        save();
        location.hash = '#/request/sent/' + req.id;
      });
    }
    return { html, mount, title: 'Contact ' + c.name };
  }
  function requestSentView(id) {
    const q = S.requests.find((x) => x.id === id);
    if (!q) return notFound();
    const c = creator(q.creatorId); const w = q.workId ? work(q.workId) : null;
    const html = `<section class="wrap section" style="max-width:860px">
      <span class="pill pill-ok">Request sent</span>
      <h1 class="h1" style="margin-top:18px">${esc(first(c.name))} has your ${TYPES[q.type].short.toLowerCase()} request.</h1>
      <p class="lede" style="margin-top:16px">${esc(c.replies)}. You'll get an email at ${esc(q.from.email)} as soon as they answer, and you can follow the conversation from your collection.</p>
      <div class="row" style="margin-top:28px"><a class="btn btn-primary btn-lg" href="#/me?tab=requests">Track this request</a><a class="btn btn-secondary btn-lg" href="#/discover?city=${encodeURIComponent(c.city)}">Keep browsing ${esc(c.city)}</a></div>
      <hr class="rule" style="margin-block:48px 8px">
      <div class="two-col" style="align-items:start">
        <div><span class="label">What happens next</span><ol class="steps" style="margin-top:12px">
          <li><span><strong>${esc(first(c.name))} replies</strong><br><span class="muted small">Usually with availability, a price for shipping, or dates for a visit.</span></span></li>
          <li><span><strong>You agree on the details</strong><br><span class="muted small">Price, payment method and delivery are arranged between the two of you.</span></span></li>
          <li><span><strong>You pay the creator directly</strong><br><span class="muted small">CORE takes no commission. The creator keeps 100% of the sale.</span></span></li>
        </ol></div>
        <div class="summary" style="position:static">${w ? artImg(w) : avatar(c, 'avatar-lg')}<div class="wall-label"><span class="who">${esc(c.name)}</span>${w ? `<span class="what"><em>${esc(w.title)}</em>, ${w.year}</span>` : ''}<span class="meta">${esc(TYPES[q.type].short)} · sent ${esc(q.date)}</span></div><p class="small" style="color:var(--ink-2)">“${esc(q.thread[0].text)}”</p></div>
      </div>
    </section>`;
    return { html, title: 'Request sent' };
  }

  /* ================= shared: request status ================= */
  const REQ_STATUS = {
    new: { creator: 'New', collector: 'Sent', pill: 'pill-accent' },
    replied: { creator: 'Replied', collector: 'Creator replied', pill: 'pill-info' },
    discussion: { creator: 'In discussion', collector: 'In discussion', pill: 'pill-warn' },
    closed: { creator: 'Closed', collector: 'Closed', pill: 'pill-muted' },
  };
  function threadHtml(q, side) {
    return q.thread.map((m) => `<div class="msg ${m.who === side ? 'me' : ''}">${esc(m.text)}<span class="at">${m.who === 'creator' ? esc(creator(q.creatorId).name) : esc(q.from.name)} · ${esc(m.at)}</span></div>`).join('');
  }
  function reqThumb(q, side) {
    const w = q.workId ? work(q.workId) : null;
    if (w) return `<img src="${Art.src(w.art)}" alt="">`;
    return side === 'creator' ? `<span class="avatar" style="background:var(--ink-2)" aria-hidden="true">${esc(initials(q.from.name))}</span>` : avatar(creator(q.creatorId));
  }

  /* ================= 6. collector profile ================= */
  function collectorView(r) {
    if (S.role !== 'collector') return gate('collector', 'Your collection', 'Sign in as a collector to see the creators you follow and the requests you sent.', '#/me');
    const tab = ['following', 'requests', 'saved'].includes(r.q.tab) ? r.q.tab : 'following';
    const me = D.COLLECTOR;
    const mine = S.requests.filter((q) => q.mine);
    const followed = S.following.map(creator).filter(Boolean);
    const saved = S.saved.map(work).filter(Boolean);
    const html = `
    <section class="wrap page-head"><div class="row" style="gap:20px;align-items:center">
      <span class="avatar avatar-xl" style="background:var(--accent-ink)">${me.initials}</span>
      <div class="stack" style="gap:6px"><span class="label">Collector</span><h1 class="h1">${esc(me.name)}</h1><div class="meta-list"><span>${icon('pin', 'i-sm')} ${esc(me.city)}</span><span>${icon('calendar', 'i-sm')} Member since ${esc(me.since)}</span></div></div>
      <span class="spacer"></span>
      <a class="btn btn-secondary" href="#/discover?city=${encodeURIComponent(me.city)}&avail=1">${icon('pin', 'i-sm')} Art near me</a>
    </div></section>
    <div class="wrap" style="margin-top:32px"><div class="tabs" role="tablist">
      <a href="#/me?tab=following" role="tab" aria-selected="${tab === 'following'}">Following<span class="count">${followed.length}</span></a>
      <a href="#/me?tab=requests" role="tab" aria-selected="${tab === 'requests'}">Requests<span class="count">${mine.length}</span></a>
      <a href="#/me?tab=saved" role="tab" aria-selected="${tab === 'saved'}">Saved works<span class="count">${saved.length}</span></a>
    </div></div>
    <section class="wrap section-tight">${tab === 'following' ? followingPanel(followed) : tab === 'requests' ? requestsPanel(mine) : (saved.length ? `<div class="masonry">${saved.map((w) => workCard(w)).join('')}</div>` : `<div class="empty"><p class="h3">No saved works yet</p><p class="muted">Tap the bookmark on any work to keep it here.</p><a class="btn btn-primary" href="#/discover">Discover works</a></div>`)}</section>`;
    function mount() {
      $$('[data-reply]').forEach((form) => form.addEventListener('submit', (e) => {
        e.preventDefault(); const ta = $('textarea', form); const text = ta.value.trim(); if (!text) { ta.focus(); return; }
        const q = S.requests.find((x) => x.id === form.dataset.reply);
        q.thread.push({ who: 'collector', at: 'Just now', text }); if (q.status === 'replied') q.status = 'discussion'; save();
        render(); toast('Message sent to ' + creator(q.creatorId).name);
      }));
    }
    return { html, mount, title: 'My collection' };
  }
  function followingPanel(list) {
    if (!list.length) return `<div class="empty"><p class="h3">You don't follow anyone yet</p><a class="btn btn-primary" href="#/discover?tab=creators">Find creators</a></div>`;
    return `<div class="stack" style="gap:0">${list.map((c) => {
      const ws = worksOf(c.id).filter((w) => w.status !== 'sold').slice(0, 4);
      return `<div class="req-card" style="grid-template-columns:minmax(0,1fr) auto;align-items:center">
        <div class="stack" style="gap:14px">
          <a class="row" style="text-decoration:none;gap:14px" href="#/creator/${c.id}">${avatar(c, 'avatar-lg')}<span><strong style="font-size:1.125rem;display:block">${esc(c.name)}</strong><span class="mono muted">${esc(c.city)} · ${esc(c.category)} · ${ws.length} available</span></span></a>
          <div class="row" style="gap:10px;flex-wrap:nowrap;overflow-x:auto">${ws.map((w) => `<a href="#/work/${w.id}" title="${esc(w.title)}" style="flex:none;width:92px;height:92px;background:var(--plinth);display:grid;place-items:center"><img src="${Art.src(w.art)}" alt="${esc(w.title)}" style="max-width:78%;max-height:78%"></a>`).join('')}</div>
        </div>
        <div class="stack" style="gap:8px"><button class="btn btn-secondary btn-sm btn-follow" data-action="follow" data-id="${c.id}" aria-pressed="true">${icon('check', 'i-sm')} Following</button><a class="btn btn-ghost btn-sm" href="#/request?creator=${c.id}&type=purchase">${icon('message', 'i-sm')} Contact</a></div>
      </div>`;
    }).join('')}</div>`;
  }
  function requestsPanel(list) {
    if (!list.length) return `<div class="empty"><p class="h3">No requests yet</p><p class="muted">When you contact a creator, the conversation shows up here.</p></div>`;
    const order = ['new', 'replied', 'discussion', 'closed'];
    return list.map((q) => {
      const c = creator(q.creatorId); const w = q.workId ? work(q.workId) : null; const st = REQ_STATUS[q.status];
      const idx = order.indexOf(q.status);
      const steps = [['Sent', 0], ['Creator replied', 1], ['In discussion', 2], [q.outcome || 'Closed', 3]];
      return `<article class="req-card">
        <div class="thumbbox">${reqThumb(q)}</div>
        <div style="min-width:0">
          <div class="row" style="gap:10px"><span class="pill ${st.pill}">${st.collector}</span><span class="mono muted">${TYPES[q.type].short} · ${esc(q.date)}</span></div>
          <h3 class="h3" style="margin-top:8px">${w ? `<em class="title-work" style="font-size:1.375rem;font-weight:400">${esc(w.title)}</em> · ` : ''}${esc(c.name)}</h3>
          <div class="facts-inline" style="margin-top:6px">${q.budget ? `<span>${icon('tag', 'i-sm')} ${esc(q.budget)}</span>` : ''}${q.dates ? `<span>${icon('calendar', 'i-sm')} ${esc(q.dates.join(' or '))}</span>` : ''}${q.group ? `<span>${icon('users', 'i-sm')} ${esc(q.group)}</span>` : ''}</div>
          <div class="timeline" aria-label="Progress">${steps.map(([t, k]) => `<span class="tstep ${k < idx || (k === idx && k === 3) ? 'done' : k === idx ? 'current' : ''}">${k < idx || (k === 3 && idx === 3) ? icon('check', 'i-sm') : ''}${esc(t)}</span>`).join('')}</div>
          <details style="margin-top:14px"><summary class="link small" style="cursor:pointer">Conversation (${q.thread.length})</summary>
            <div class="thread-body" style="padding:14px 0">${threadHtml(q, 'collector')}</div>
            ${q.status !== 'closed' ? `<form class="thread-foot" style="padding:0;border:0" data-reply="${q.id}"><label class="sr-only" for="rep-${q.id}">Reply</label><textarea id="rep-${q.id}" placeholder="Write to ${esc(first(c.name))}…"></textarea><div><button class="btn btn-primary btn-sm" type="submit">Send</button></div></form>` : ''}
          </details>
        </div>
        <div class="stack" style="gap:8px"><a class="btn btn-secondary btn-sm" href="#/creator/${c.id}">View creator</a></div>
      </article>`;
    }).join('');
  }
  function gate(role, title, text, go) {
    const names = { collector: D.COLLECTOR.name, creator: 'Inès Moreau', admin: 'Marcel Katz' };
    return { html: `<section class="wrap section" style="max-width:720px"><span class="label">Sign in required</span><h1 class="h1" style="margin-top:12px">${esc(title)}</h1><p class="lede" style="margin-top:16px">${esc(text)}</p><div class="row" style="margin-top:28px"><button class="btn btn-primary btn-lg" data-action="signin-as" data-role="${role}" data-go="${go}" data-name="${esc(names[role])}">Continue as ${esc(names[role])} (demo)</button><a class="btn btn-secondary btn-lg" href="#/join">Create an account</a></div></section>`, title };
  }

  /* ================= 7. creator studio ================= */
  function studioView(r) {
    if (S.role !== 'creator') return gate('creator', 'Your studio', 'Sign in as a creator to manage your profile, works and requests.', '#/studio');
    const tab = ['works', 'requests', 'profile', 'plan'].includes(r.parts[1]) ? r.parts[1] : 'overview';
    const c = creator(D.ME_CREATOR);
    const inbox = S.requests.filter((q) => q.creatorId === c.id);
    const newCount = inbox.filter((q) => q.status === 'new').length;
    const nav = [['overview', 'Overview', 'home', '#/studio'], ['works', 'Works', 'image', '#/studio/works'], ['requests', 'Requests', 'inbox', '#/studio/requests'], ['profile', 'Profile', 'user', '#/studio/profile'], ['plan', 'Plan', 'card', '#/studio/plan']];
    const side = `<aside class="side">
      <div class="side-id">${avatar(c)}<div><strong style="font-size:.9375rem">${esc(c.name)}</strong><div class="mono muted">${planName(S.plan)} plan</div></div></div>
      <ul class="side-nav">${nav.map(([k, t, ic, h]) => `<li><a href="${h}" ${tab === k ? 'aria-current="page"' : ''}>${icon(ic, 'i-sm')} ${t}${k === 'requests' && newCount ? `<span class="n">${newCount}</span>` : ''}</a></li>`).join('')}</ul>
      <a class="link-arrow" href="#/creator/${c.id}">View public profile ${icon('external', 'i-sm')}</a>
    </aside>`;
    const views = { overview: studioOverview, works: studioWorks, requests: studioRequests, profile: studioProfile, plan: studioPlan };
    const v = views[tab](c, inbox, r);
    return { html: `<div class="wrap shell">${side}<div class="stack" style="gap:24px;min-width:0">${v.html}</div></div>`, mount: v.mount, title: 'Studio' };
  }
  const planName = (p) => ({ open: 'Open', studio: 'Studio', signature: 'Signature' }[p]);
  function spotlightStatus(cid) {
    const i = S.spotlight.queue.indexOf(cid);
    if (S.spotlight.current.includes(cid)) return { now: true, text: `You're in this week's spotlight (${D.SPOTLIGHT.range}). Your work is on the CORE home page until Sunday.` };
    if (i > -1 && i < 6) return { text: `You're in next week's spotlight rotation (${D.SPOTLIGHT.nextRange}). Your profile will be on the CORE home page for 7 days.` };
    if (i > -1) return { text: `You're number ${i + 1} in the rotation queue, about ${Math.ceil((i + 1) / 6)} weeks away. Every creator moves up the same way.` };
    return { text: 'Your profile is in the rotation queue.' };
  }
  function studioOverview(c, inbox) {
    const series = D.VIEWS; const total = series.reduce((a, b) => a + b.v, 0);
    const ws = worksOf(c.id, true);
    const workViews = ws.reduce((a, w) => a + (w.views || 0), 0);
    const sp = spotlightStatus(c.id);
    const top = ws.filter((w) => isPublic(w)).sort((a, b) => b.views - a.views).slice(0, 4);
    const cities = [['Paris', 34], ['Miami', 18], ['New York', 12], ['London', 9], ['Other', 27]];
    const html = `
      <div class="row" style="justify-content:space-between"><div><span class="label">Studio · Overview</span><h1 class="h1" style="margin-top:8px">Hello, ${esc(first(c.name))}.</h1></div><a class="btn btn-primary" href="#/studio/works?add=1">${icon('plus', 'i-sm')} Add a work</a></div>
      <div class="spot-banner">${icon('rotate', 'i-lg')}<div style="flex:1;min-width:220px"><strong>Spotlight rotation</strong><div class="small">${esc(sp.text)}</div></div><a class="link-arrow" href="#/pricing">How rotation works ${icon('arrowR', 'i-sm')}</a></div>
      <div class="kpis">
        <div class="kpi"><span class="label">Profile views</span><span class="v">${total.toLocaleString('en-US')}</span><span class="delta up">${icon('arrowUp', 'i-sm')} 18% vs August</span></div>
        <div class="kpi"><span class="label">Work views</span><span class="v">${workViews.toLocaleString('en-US')}</span><span class="delta up">${icon('arrowUp', 'i-sm')} 11%</span></div>
        <div class="kpi"><span class="label">Followers</span><span class="v">${followerCount(c).toLocaleString('en-US')}</span><span class="delta up">${icon('arrowUp', 'i-sm')} 36 this month</span></div>
        <div class="kpi"><span class="label">Requests</span><span class="v">${inbox.length}</span><span class="delta flat">${inbox.filter((q) => q.status === 'new').length} waiting for you</span></div>
      </div>
      <div class="dash-grid">
        <div class="panel"><div class="panel-head"><h2 class="h3">Profile views, September</h2><span class="mono muted">daily</span></div><div class="chart" id="views-chart">${lineChart(series)}<div class="tip" id="views-tip" hidden></div></div></div>
        <div class="panel"><div class="panel-head"><h2 class="h3">Where viewers are</h2><span class="mono muted">share of views</span></div>
          <div class="hbar">${cities.map(([n, v]) => `<div class="hbar-row"><span>${n}</span><span class="hbar-track"><span class="hbar-fill" style="width:${(v / 34) * 100}%"></span></span><span class="mono">${v}%</span></div>`).join('')}</div>
          <p class="small muted" style="margin-top:16px">Miami viewers jumped after The Art Plug shared Salt Hour with its 246K followers on Sep 14.</p>
        </div>
      </div>
      <div class="dash-grid">
        <div class="panel"><div class="panel-head"><h2 class="h3">Latest requests</h2><a class="link-arrow" href="#/studio/requests">Open inbox ${icon('arrowR', 'i-sm')}</a></div>
          <div class="stack">${inbox.slice(0, 4).map((q) => { const st = REQ_STATUS[q.status]; return `<a class="inbox-item" style="text-decoration:none" href="#/studio/requests?id=${q.id}"><div class="thumbbox">${reqThumb(q, 'creator')}</div><div style="min-width:0"><div class="top">${q.status === 'new' ? '<span class="unread-dot" aria-label="New"></span>' : ''}<strong>${esc(q.from.name)}</strong><span class="mono">${esc(q.date)}</span></div><div class="excerpt">${esc(q.thread[q.thread.length - 1].text)}</div><div class="tags"><span class="pill ${st.pill}">${st.creator}</span><span class="pill pill-muted no-dot">${TYPES[q.type].short}</span></div></div></a>`; }).join('')}</div>
        </div>
        <div class="panel"><div class="panel-head"><h2 class="h3">Most viewed works</h2></div>
          <div class="stack" style="gap:12px">${top.map((w) => `<a class="row" style="text-decoration:none;flex-wrap:nowrap" href="#/work/${w.id}"><span style="width:52px;height:52px;background:var(--plinth);display:grid;place-items:center;flex:none"><img src="${Art.src(w.art)}" alt="" style="max-width:80%;max-height:80%"></span><span style="min-width:0;flex:1"><em class="title-work" style="font-size:1.125rem">${esc(w.title)}</em><span class="mono muted" style="display:block">${w.views.toLocaleString('en-US')} views · ${w.saves} saves</span></span></a>`).join('')}</div>
        </div>
      </div>`;
    return { html, mount: () => mountChart(series) };
  }
  function lineChart(series) {
    const W = 640, H = 290, pl = 40, pr = 18, pt = 26, pb = 28, max = 350;
    const x = (i) => pl + (i * (W - pl - pr)) / (series.length - 1);
    const y = (v) => pt + (1 - v / max) * (H - pt - pb);
    let g = '';
    [0, 100, 200, 300].forEach((t) => { g += `<line class="grid-line" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-text" x="${pl - 8}" y="${y(t) + 3}" text-anchor="end">${t}</text>`; });
    [0, 7, 14, 21, 28].forEach((i) => { g += `<text class="axis-text" x="${x(i)}" y="${H - 8}" text-anchor="middle">${series[i].label}</text>`; });
    const line = series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.v).toFixed(1)}`).join('');
    const area = `${line}L${x(series.length - 1)} ${y(0)}L${x(0)} ${y(0)}Z`;
    const pk = 13; const last = series.length - 1;
    const ann = `<line class="annot-line" x1="${x(pk)}" x2="${x(pk)}" y1="${y(series[pk].v) - 4}" y2="${pt - 8}"/><text class="annot" x="${x(pk) + 6}" y="${pt - 10}">Shared by The Art Plug on Instagram</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily profile views in September, from ${series[0].v} on Sep 1 to ${series[last].v} on Sep 30, peaking at ${series[pk].v} on Sep 14">
      ${g}<path class="area" d="${area}"/><path class="line" d="${line}"/>${ann}
      <circle class="endpoint" cx="${x(last)}" cy="${y(series[last].v)}" r="4.5"/>
      <text class="axis-text" x="${x(last)}" y="${y(series[last].v) - 10}" text-anchor="end" style="fill:var(--ink);font-weight:500">${series[last].v}</text>
      <g id="cross" visibility="hidden"><line class="cross" x1="0" x2="0" y1="${pt}" y2="${H - pb}"/><circle class="endpoint" r="4.5" cx="0" cy="0"/></g>
      <rect class="hit" x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}"/>
    </svg>`;
  }
  function mountChart(series) {
    const wrap = $('#views-chart'); if (!wrap) return;
    const svg = $('svg', wrap), tip = $('#views-tip'), cross = $('#cross', wrap);
    const W = 640, H = 290, pl = 40, pr = 18, pt = 26, pb = 28, max = 350;
    const x = (i) => pl + (i * (W - pl - pr)) / (series.length - 1);
    const y = (v) => pt + (1 - v / max) * (H - pt - pb);
    const move = (e) => {
      const r = svg.getBoundingClientRect(); const vx = ((e.clientX - r.left) / r.width) * W;
      const i = Math.max(0, Math.min(series.length - 1, Math.round(((vx - pl) / (W - pl - pr)) * (series.length - 1))));
      const d = series[i];
      cross.setAttribute('visibility', 'visible'); $('line', cross).setAttribute('x1', x(i)); $('line', cross).setAttribute('x2', x(i));
      $('circle', cross).setAttribute('cx', x(i)); $('circle', cross).setAttribute('cy', y(d.v));
      tip.hidden = false; tip.innerHTML = `${d.label} · <strong>${d.v}</strong> views`;
      tip.style.left = (x(i) / W) * r.width + 'px'; tip.style.top = (y(d.v) / H) * r.height + 'px';
    };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; });
  }

  function studioWorks(c, inbox, r) {
    const ws = worksOf(c.id, true);
    const html = `
      <div class="row" style="justify-content:space-between"><div><span class="label">Studio · Works</span><h1 class="h1" style="margin-top:8px">Your works</h1></div><button class="btn btn-primary" data-sw="add">${icon('plus', 'i-sm')} Add a work</button></div>
      <p class="muted" style="margin-top:-8px">${ws.length} works · ${planName(S.plan)} plan: ${S.plan === 'open' ? 'up to 10 works' : 'unlimited works'}. Changes to price and status are live right away.</p>
      <div class="panel" style="padding:0"><div class="table-wrap"><table class="table">
        <thead><tr><th scope="col"><span class="sr-only">Image</span></th><th scope="col">Work</th><th scope="col">Status</th><th scope="col" class="num">Price</th><th scope="col" class="num">Views</th><th scope="col" class="num">Saves</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${ws.map((w) => `<tr>
          <td><div class="t-thumb"><img src="${Art.src(w.art)}" alt=""></div></td>
          <td style="min-width:200px"><a href="#/work/${w.id}" style="text-decoration:none"><em class="title-work" style="font-size:1.125rem">${esc(w.title)}</em></a><div class="mono muted">${w.year} · ${esc(w.medium)} · ${dims(w)}</div></td>
          <td>${w.review && w.review !== 'approved' ? `<span class="pill pill-info">In review</span>` : `<label class="sr-only" for="st-${w.id}">Status of ${esc(w.title)}</label><select id="st-${w.id}" data-status="${w.id}">${Object.entries(STATUS).map(([k, s]) => `<option value="${k}" ${w.status === k ? 'selected' : ''}>${s.label}</option>`).join('')}</select>`}</td>
          <td class="num">${money(w.price)}</td>
          <td class="num">${(w.views || 0).toLocaleString('en-US')}</td>
          <td class="num">${w.saves || 0}</td>
          <td><button class="btn btn-ghost btn-sm" data-sw="edit" data-id="${w.id}">${icon('edit', 'i-sm')} Edit</button></td>
        </tr>`).join('')}</tbody>
      </table></div></div>
      <p class="small muted">${icon('shield', 'i-sm')} New works are checked by The Art Plug's curation team before they go public, usually within 24 hours.</p>`;
    function mount() {
      $$('[data-status]').forEach((s) => s.addEventListener('change', () => {
        S.overrides[s.dataset.status] = { ...(S.overrides[s.dataset.status] || {}), status: s.value }; save();
        toast(`Marked as ${STATUS[s.value].label.toLowerCase()}. Collectors see it right away.`);
      }));
      $$('[data-sw]').forEach((b) => b.addEventListener('click', () => workModal(c, b.dataset.sw === 'edit' ? work(b.dataset.id) : null)));
      if (r.q.add) { history.replaceState(null, '', '#/studio/works'); workModal(c, null); }
    }
    return { html, mount };
  }
  function workModal(c, w) {
    const isNew = !w;
    openModal(`<div class="modal-head"><div><span class="label">${isNew ? 'New work' : 'Edit work'}</span><h2 class="h2" id="modal-title" style="margin-top:6px">${isNew ? 'Add a work' : esc(w.title)}</h2></div><button class="icon-btn" data-action="close-modal" aria-label="Close">${icon('x')}</button></div>
      <form class="form" id="work-form" novalidate>
        ${isNew ? `<div class="field"><span class="flabel">Photos</span><label class="dropzone" for="wf-photos">${icon('upload')}<span id="wf-photos-label">Drop up to 8 photos, at least 1,600 px wide. The first one is the cover.</span></label><input id="wf-photos" type="file" accept="image/*" multiple class="sr-only"></div>` : ''}
        <div class="field"><label for="wf-title">Title</label><input class="input" id="wf-title" value="${isNew ? '' : esc(w.title)}"></div>
        <div class="form-grid">
          <div class="field"><label for="wf-year">Year</label><input class="input" id="wf-year" inputmode="numeric" value="${isNew ? '2026' : w.year}"></div>
          <div class="field"><label for="wf-medium">Medium</label><input class="input" id="wf-medium" value="${isNew ? 'Oil on linen' : esc(w.medium)}"></div>
          <div class="field"><label for="wf-w">Width (cm)</label><input class="input" id="wf-w" inputmode="numeric" value="${isNew ? '80' : w.w}"></div>
          <div class="field"><label for="wf-h">Height (cm)</label><input class="input" id="wf-h" inputmode="numeric" value="${isNew ? '100' : w.h}"></div>
          <div class="field"><label for="wf-price">Price (USD)</label><input class="input" id="wf-price" inputmode="numeric" value="${isNew ? '' : w.price}"><span class="help">You keep 100%. CORE takes no commission.</span></div>
          <div class="field"><label for="wf-status">Status</label><select id="wf-status">${Object.entries(STATUS).map(([k, s]) => `<option value="${k}" ${!isNew && w.status === k ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
        </div>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${isNew ? 'Submit for review' : 'Save changes'}</button></div>
      </form>`, (m) => {
      const ph = $('#wf-photos', m); if (ph) ph.addEventListener('change', () => { $('#wf-photos-label', m).textContent = ph.files.length ? `${ph.files.length} photo${ph.files.length > 1 ? 's' : ''} ready: ${Array.from(ph.files).map((f) => f.name).join(', ')}` : 'Drop up to 8 photos.'; });
      $('#work-form', m).addEventListener('submit', (e) => {
        e.preventDefault();
        $$('.err', m).forEach((x) => x.remove()); $$('.has-error', m).forEach((x) => x.classList.remove('has-error'));
        const val = (id) => $('#' + id, m).value.trim();
        let bad = null;
        const err = (id, msg) => { const f = $('#' + id, m).closest('.field'); f.classList.add('has-error'); f.insertAdjacentHTML('beforeend', `<span class="err">${icon('alert', 'i-sm')} ${msg}</span>`); bad = bad || $('#' + id, m); };
        if (!val('wf-title')) err('wf-title', 'Give the work a title, or "Untitled".');
        const price = parseInt(val('wf-price').replace(/[^0-9]/g, ''), 10);
        if (!price) err('wf-price', 'Enter a price in US dollars, numbers only.');
        const ww = parseInt(val('wf-w'), 10), hh = parseInt(val('wf-h'), 10);
        if (!ww || !hh) err(!ww ? 'wf-w' : 'wf-h', 'Enter the size in centimetres.');
        if (bad) { bad.focus(); return; }
        const patch = { title: val('wf-title'), year: parseInt(val('wf-year'), 10) || 2026, medium: val('wf-medium'), w: ww, h: hh, price, status: $('#wf-status', m).value };
        if (isNew) {
          const id = 'new-' + Date.now();
          S.extraWorks.push({ id, creatorId: c.id, ...patch, edition: null, category: c.category, city: c.city, art: { gen: c.gen, palette: c.palette, backdrop: c.backdrop, seed: Art.hashStr(id), w: ww, h: hh }, views: 0, saves: 0, addedDaysAgo: 0, description: `${patch.title} (${patch.year}), ${patch.medium.toLowerCase()}. New on CORE.`, review: 'pending' });
          save(); closeModal(); render(); toast('Submitted. The curation team usually reviews new works within 24 hours.');
        } else {
          S.overrides[w.id] = { ...(S.overrides[w.id] || {}), ...patch, art: { ...w.art, w: ww, h: hh } }; save(); closeModal(); render(); toast('Changes saved');
        }
      });
    });
  }

  function studioRequests(c, inbox, r) {
    const sel = inbox.find((q) => q.id === r.q.id) || inbox[0];
    const filters = [['all', 'All'], ['new', 'New'], ['replied', 'Replied'], ['discussion', 'In discussion'], ['closed', 'Closed']];
    const html = `
      <div><span class="label">Studio · Requests</span><h1 class="h1" style="margin-top:8px">Requests</h1></div>
      <div class="chips" role="group" aria-label="Filter requests">${filters.map(([k, t]) => `<button class="chip" data-rf="${k}" aria-pressed="${k === 'all'}">${t} <span class="count">${k === 'all' ? inbox.length : inbox.filter((q) => q.status === k).length}</span></button>`).join('')}</div>
      <div class="inbox">
        <ul class="inbox-list" id="inbox-list">${inbox.map((q) => { const st = REQ_STATUS[q.status]; return `<li data-st="${q.status}"><button class="inbox-item ${sel && q.id === sel.id ? 'is-active' : ''}" data-req="${q.id}"><div class="thumbbox">${reqThumb(q, 'creator')}</div><div style="min-width:0"><div class="top">${q.status === 'new' ? '<span class="unread-dot" aria-label="New"></span>' : ''}<strong>${esc(q.from.name)}</strong><span class="mono">${esc(q.date)}</span></div><div class="excerpt">${esc(q.thread[q.thread.length - 1].text)}</div><div class="tags"><span class="pill ${st.pill}">${st.creator}</span><span class="pill pill-muted no-dot">${TYPES[q.type].short}</span></div></div></button></li>`; }).join('')}</ul>
        <div class="thread" id="thread">${sel ? threadPane(sel) : '<div class="empty" style="margin:20px">No requests yet.</div>'}</div>
      </div>`;
    function mount() {
      $$('[data-req]').forEach((b) => b.addEventListener('click', () => { history.replaceState(null, '', '#/studio/requests?id=' + b.dataset.req); render(); }));
      $$('[data-rf]').forEach((b) => b.addEventListener('click', () => {
        $$('[data-rf]').forEach((x) => x.setAttribute('aria-pressed', x === b));
        $$('#inbox-list li').forEach((li) => (li.hidden = b.dataset.rf !== 'all' && li.dataset.st !== b.dataset.rf));
      }));
      bindThread();
    }
    return { html, mount };
  }
  function threadPane(q) {
    const w = q.workId ? work(q.workId) : null;
    return `<div class="thread-head">
        <div style="flex:1;min-width:200px"><strong>${esc(q.from.name)}</strong> <span class="muted small">· ${esc(q.from.city)}</span>
          <div class="facts-inline" style="margin-top:6px"><span>${icon(TYPES[q.type].icon, 'i-sm')} ${TYPES[q.type].label}</span>${w ? `<span><em class="title-work">${esc(w.title)}</em> · ${money(w.price)}</span>` : ''}${q.budget ? `<span>${icon('tag', 'i-sm')} ${esc(q.budget)}</span>` : ''}${q.timeline ? `<span>${icon('clock', 'i-sm')} ${esc(q.timeline)}</span>` : ''}${q.dates ? `<span>${icon('calendar', 'i-sm')} ${esc(q.dates.join(' or '))}</span>` : ''}${q.group ? `<span>${icon('users', 'i-sm')} ${esc(q.group)} ${q.group === '1' || q.group === 1 ? 'person' : 'people'}</span>` : ''}</div>
        </div>
        <label class="sr-only" for="q-status">Status</label>
        <div class="select"><select id="q-status" data-qid="${q.id}">${Object.entries(REQ_STATUS).map(([k, s]) => `<option value="${k}" ${q.status === k ? 'selected' : ''}>${s.creator}</option>`).join('')}</select>${icon('chevD')}</div>
      </div>
      <div class="thread-body">${threadHtml(q, 'creator')}${q.outcome ? `<p class="small muted" style="text-align:center">${esc(q.outcome)}</p>` : ''}</div>
      <form class="thread-foot" id="reply-form" data-qid="${q.id}">
        <label class="sr-only" for="reply-text">Reply to ${esc(q.from.name)}</label>
        <textarea id="reply-text" placeholder="Reply to ${esc(first(q.from.name))}…"></textarea>
        <div class="row" style="justify-content:space-between"><span class="small muted">Your reply shares your email with ${esc(first(q.from.name))} so you can continue directly.</span><button class="btn btn-primary btn-sm" type="submit">${icon('mail', 'i-sm')} Send reply</button></div>
      </form>`;
  }
  function bindThread() {
    const s = $('#q-status'); if (!s) return;
    s.addEventListener('change', () => { const q = S.requests.find((x) => x.id === s.dataset.qid); q.status = s.value; save(); render(); toast('Request marked as ' + REQ_STATUS[s.value].creator.toLowerCase()); });
    $('#reply-form').addEventListener('submit', (e) => {
      e.preventDefault(); const ta = $('#reply-text'); const text = ta.value.trim(); if (!text) { ta.focus(); return; }
      const q = S.requests.find((x) => x.id === e.target.dataset.qid);
      q.thread.push({ who: 'creator', at: 'Just now', text }); if (q.status === 'new') q.status = 'replied'; save(); render(); toast('Reply sent to ' + q.from.name);
    });
  }

  function studioProfile(c) {
    const html = `
      <div><span class="label">Studio · Profile</span><h1 class="h1" style="margin-top:8px">Your public profile</h1></div>
      <div class="two-col" style="grid-template-columns:minmax(0,3fr) minmax(0,2fr)">
        <form class="form panel" id="prof-form">
          <div class="form-grid">
            <div class="field"><label for="p-name">Display name</label><input class="input" id="p-name" value="${esc(c.name)}"></div>
            <div class="field"><label for="p-handle">Instagram handle</label><input class="input" id="p-handle" value="${esc(c.handle)}"></div>
            <div class="field"><label for="p-city">City</label><input class="input" id="p-city" value="${esc(c.city)}" disabled><span class="help">Moving? Contact the curation team to change city.</span></div>
            <div class="field"><label for="p-cat">Main discipline</label><select id="p-cat">${D.CATEGORIES.map((k) => `<option ${c.category === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label for="p-bio">Short bio</label><textarea id="p-bio" maxlength="220">${esc(c.bio)}</textarea><span class="help"><span id="bio-count">${c.bio.length}</span> / 220 characters. Shown under your name.</span></div>
          <div class="field"><label for="p-statement">Artist statement</label><textarea id="p-statement">${esc(c.statement)}</textarea></div>
          <label class="toggle"><input type="checkbox" id="p-open" ${c.studio.open ? 'checked' : ''}><span class="track"></span>Open my studio to visit requests</label>
          <div class="form-grid" id="p-studio" ${c.studio.open ? '' : 'hidden'}>
            <div class="field"><label for="p-where">Studio area</label><input class="input" id="p-where" value="${esc(c.studio.where || '')}"><span class="help">Neighborhood only. The address is shared after you accept.</span></div>
            <div class="field"><label for="p-when">When you host</label><input class="input" id="p-when" value="${esc(c.studio.when || '')}"></div>
          </div>
          <div class="row"><button class="btn btn-primary" type="submit">Save profile</button><a class="btn btn-ghost" href="#/creator/${c.id}">Preview public page</a></div>
        </form>
        <div class="stack" style="gap:12px"><span class="label">Preview</span><div class="panel stack" id="p-preview" style="gap:14px"></div></div>
      </div>`;
    function mount() {
      const pv = () => {
        $('#p-preview').innerHTML = `${badge(c)}<div class="row" style="gap:14px;flex-wrap:nowrap">${avatar(c, 'avatar-lg')}<span class="display" style="font-size:2.25rem;min-width:0;overflow-wrap:anywhere">${esc($('#p-name').value)}</span></div><div class="meta-list"><span>${icon('pin', 'i-sm')} ${esc(c.city)}</span><span>${icon('brush', 'i-sm')} ${esc($('#p-cat').value)}</span><span>${icon('at', 'i-sm')} ${esc($('#p-handle').value)}</span></div><p style="color:var(--ink-2)">${esc($('#p-bio').value)}</p>${$('#p-open').checked ? `<div class="studio-card"><span class="label">Studio visits</span><strong>${esc($('#p-where').value)}</strong><span class="small muted">${esc($('#p-when').value)}</span></div>` : ''}`;
        $('#bio-count').textContent = $('#p-bio').value.length;
      };
      $('#prof-form').addEventListener('input', pv);
      $('#p-open').addEventListener('change', () => { $('#p-studio').hidden = !$('#p-open').checked; pv(); });
      $('#prof-form').addEventListener('submit', (e) => {
        e.preventDefault();
        S.profile = { name: $('#p-name').value.trim() || c.name, handle: $('#p-handle').value.trim(), category: $('#p-cat').value, bio: $('#p-bio').value.trim(), statement: $('#p-statement').value.trim(), studio: { open: $('#p-open').checked, where: $('#p-where').value.trim(), when: $('#p-when').value.trim() } };
        save(); toast('Profile saved. Your public page is up to date.'); renderHeader(parse());
      });
      pv();
    }
    return { html, mount };
  }

  function studioPlan(c) {
    const ws = worksOf(c.id, true);
    const html = `
      <div><span class="label">Studio · Plan</span><h1 class="h1" style="margin-top:8px">Your plan</h1></div>
      <div class="plan-banner"><div><span class="label">Current plan</span><div class="display" style="font-size:2.5rem;margin-top:6px">${planName(S.plan)}</div><p class="muted small">${S.plan === 'open' ? 'Free forever.' : `${S.plan === 'studio' ? '$19' : '$49'} per month · renews Oct 14, 2026.`}</p></div>
        <div class="stack" style="gap:8px;align-items:flex-end"><a class="btn btn-primary" href="#/pricing">Compare plans</a>${S.plan !== 'open' ? `<button class="btn btn-ghost btn-sm" data-plan-cancel>Switch to the free plan</button>` : ''}</div></div>
      <div class="grid grid-3">
        <div class="panel"><span class="label">Portfolio</span><div class="display" style="font-size:2rem;margin-top:8px">${ws.length} <span class="muted" style="font-size:1rem;font-family:var(--sans)">/ ${S.plan === 'open' ? '10' : 'unlimited'}</span></div></div>
        <div class="panel"><span class="label">Commission on sales</span><div class="display" style="font-size:2rem;margin-top:8px">0%</div><p class="small muted">On every plan, always.</p></div>
        <div class="panel"><span class="label">The Art Plug session</span><div class="display" style="font-size:2rem;margin-top:8px">${S.plan === 'signature' ? 'Nov 4' : '—'}</div><p class="small muted">${S.plan === 'signature' ? 'Portfolio review with a curator, 45 min.' : 'Included with Signature.'}</p></div>
      </div>
      <div class="panel"><div class="panel-head"><h2 class="h3">Billing history</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Description</th><th class="num">Amount</th></tr></thead><tbody>
        <tr><td>Sep 14, 2026</td><td>${planName(S.plan === 'open' ? 'studio' : S.plan)} plan, monthly</td><td class="num">${S.plan === 'signature' ? '$49.00' : '$19.00'}</td></tr>
        <tr><td>Aug 14, 2026</td><td>Studio plan, monthly</td><td class="num">$19.00</td></tr>
        <tr><td>Jul 14, 2026</td><td>Studio plan, monthly</td><td class="num">$19.00</td></tr>
      </tbody></table></div></div>`;
    function mount() { const b = $('[data-plan-cancel]'); if (b) b.addEventListener('click', () => { S.plan = 'open'; save(); render(); toast('You are now on the free Open plan. Your works stay online.'); }); }
    return { html, mount };
  }

  /* ================= 8. pricing ================= */
  const PLANS = [
    { k: 'open', name: 'Open', m: 0, y: 0, pitch: 'Everything you need to get discovered.', cta: 'Start free',
      f: [['Public profile and portfolio, up to 10 works', 1], ['Purchase, commission and visit requests', 1], ['0% commission on every sale', 1], ['Equal place in the spotlight rotation', 1], ['Total views, last 30 days', 1], ['Full stats: cities, sources, top works', 0], ['Featured in city guides and the newsletter', 0], ['One-on-one time with The Art Plug', 0]] },
    { k: 'studio', name: 'Studio', m: 19, y: 190, pitch: 'For creators selling regularly.', cta: 'Choose Studio', featured: true,
      f: [['Unlimited works and collections', 1], ['Purchase, commission and visit requests', 1], ['0% commission on every sale', 1], ['Equal place in the spotlight rotation', 1], ['Full stats: cities, sources, top works', 1], ['Studio-visit calendar and commission form', 1], ['Featured in city guides and the newsletter', 1], ['One-on-one time with The Art Plug', 0]] },
    { k: 'signature', name: 'Signature', m: 49, y: 490, pitch: 'Grow your practice with The Art Plug.', cta: 'Choose Signature',
      f: [['Everything in Studio', 1], ['Quarterly portfolio review with a curator', 1], ['Pricing and pitch guidance', 1], ['First in line for brand collabs', 1], ['Apply to show at the Power House, Miami Art Week', 1], ['Collector insights and data export', 1], ['0% commission on every sale', 1], ['Equal place in the spotlight rotation', 1]] },
  ];
  function pricingView() {
    const annual = S.billing === 'annual';
    const html = `
    <section class="wrap page-head" style="text-align:left">
      <span class="label">Plans for creators</span>
      <h1 class="h1" style="margin-top:12px;max-width:16ch">Pay for tools, never for sales.</h1>
      <p class="lede" style="margin-top:16px">CORE runs on subscriptions. Whatever your plan, you keep 100% of every sale and you get the same place in the spotlight rotation. Collectors always join free.</p>
      <div class="row" style="margin-top:28px;justify-content:space-between">
        <div class="seg" role="group" aria-label="Billing period"><button data-bill="monthly" aria-pressed="${!annual}">Monthly</button><button data-bill="annual" aria-pressed="${annual}">Yearly · 2 months free</button></div>
      </div>
    </section>
    <section class="wrap section-tight"><div class="plans">${PLANS.map((p) => `
      <div class="plan ${p.featured ? 'is-featured' : ''}">
        ${p.featured ? '<span class="pill pill-accent no-dot ribbon">Recommended</span>' : ''}
        <div><div class="plan-name">${p.name}</div><p class="muted small" style="margin-top:8px">${p.pitch}</p></div>
        <div class="plan-price"><span class="amt">$${annual ? p.y : p.m}</span><span class="muted small">${p.m ? (annual ? '/ year' : '/ month') : 'forever'}</span></div>
        ${S.role === 'creator' && S.plan === p.k ? `<button class="btn btn-secondary btn-block" disabled>Your current plan</button>` : `<button class="btn ${p.featured ? 'btn-accent' : 'btn-secondary'} btn-block" data-choose="${p.k}">${p.cta}</button>`}
        <ul class="feat">${p.f.map(([t, on]) => `<li class="${on ? '' : 'off'}">${icon(on ? 'check' : 'x', 'i-sm')}<span>${t}</span></li>`).join('')}</ul>
      </div>`).join('')}</div></section>
    <section class="wrap section-tight"><div class="rotation-note">
      <div><span class="label">Fair discovery</span><h2 class="h2" style="margin-top:10px">How the spotlight rotation works</h2></div>
      <div class="stack" style="gap:14px;color:var(--ink-2)">
        <p>Every Monday, six creators take over the CORE home page for a week. The queue is ordered by who has waited longest since their last feature, and every verified creator is in it, on every plan.</p>
        <p>One slot a week is Marcel's pick: Marcel Katz and The Art Plug choose a creator they want the world to see. The rest follow the queue, with at most two creators from the same city or discipline in a week so the lineup stays varied.</p>
        <p>Paid plans add visibility on top of the rotation (city guides, the newsletter), never instead of it.</p>
      </div>
    </div></section>
    <section class="wrap section-tight"><div class="section-head"><h2 class="h2">Questions</h2></div><div class="faq">
      ${[['Why no commission?', 'Because creators already give enough to galleries and platforms. CORE is paid by the tools creators choose to use, so we have no reason to push one sale over another.'],
        ['How do payments work?', 'Collectors and creators agree on price, payment and delivery directly. In this first version CORE does not process payments, which is also why there is nothing to take a cut from.'],
        ['Who can join as a creator?', 'Anyone making original work in painting, design, fashion, collectibles or digital art. Every profile is reviewed by The Art Plug before it goes live, usually within 72 hours.'],
        ['Can I change plans later?', 'Yes, at any time. If you move back to Open with more than 10 works, your extra works stay online but you cannot add new ones.']].map(([q, a]) => `<details><summary>${q}${icon('plus')}</summary><p>${a}</p></details>`).join('')}
    </div></section>`;
    function mount() {
      $$('[data-bill]').forEach((b) => b.addEventListener('click', () => { S.billing = b.dataset.bill; save(); render(); }));
      $$('[data-choose]').forEach((b) => b.addEventListener('click', () => {
        if (S.role === 'creator') { S.plan = b.dataset.choose; save(); toast(`You're now on the ${planName(S.plan)} plan`); location.hash = '#/studio/plan'; }
        else location.hash = '#/join?role=creator&plan=' + b.dataset.choose;
      }));
    }
    return { html, mount, title: 'Plans' };
  }

  /* ================= 9. brands ================= */
  function brandsView() {
    const picks = ['dario-1', 'noor-1', 'marcus-1', 'lea-1', 'yuna-1', 'theo-2', 'kofi-1', 'jordan-1', 'sofia-1'].map(work);
    const html = `
    <section class="wrap brands-hero">
      <div class="stack" style="gap:20px">
        <span class="pill pill-accent no-dot" style="align-self:flex-start">Coming soon</span>
        <h1 class="h1" style="font-size:clamp(2.75rem,5.5vw,4.5rem)">CORE for brands</h1>
        <p class="lede">Find the right creator for a collaboration, a campaign, an installation or an event, from a pool curated by The Art Plug. Brief them directly, without an agency in the middle.</p>
        <p class="small muted">The Art Plug has produced collaborations with Lyft, Heineken, Atlantic Records, Virgin and Stoli, from Lyft cars wrapped by Miami artists to Power House activations during Miami Art Week. CORE for brands turns that know-how into a self-serve tool.</p>
      </div>
      <div class="brands-mosaic" aria-hidden="true">${picks.map((w) => `<div><img src="${Art.src(w.art)}" alt="" loading="lazy"></div>`).join('')}</div>
    </section>
    <section class="wrap section-tight"><div class="use-cases">
      ${[['sparkle', 'Collabs', 'Limited products and capsule drops co-signed by a creator.'], ['megaphone', 'Campaigns', 'Original artwork for ads, packaging and social.'], ['box', 'Installations', 'Murals, window displays and site-specific pieces.'], ['ticket', 'Events', 'Live painting, Power House activations and artist-led experiences.']].map(([ic, t, d]) => `<div class="use-case">${icon(ic, 'i-lg')}<h3>${t}</h3><p class="muted small">${d}</p></div>`).join('')}
    </div></section>
    <section class="wrap section-tight"><div class="two-col" style="align-items:start">
      <div class="stack" style="gap:14px"><span class="label">What you'll be able to do</span>
        <ul class="list-plain">${['Search creators by discipline, city, style and past brand work', 'Receive shortlists hand-picked by The Art Plug', 'Send briefs and budgets, and book creators directly', 'Track proposals, contracts and deliverables in one place'].map((t) => `<li class="row" style="gap:10px;flex-wrap:nowrap">${icon('check', 'i-sm')} ${t}</li>`).join('')}</ul>
      </div>
      <div class="panel" id="brand-box">${S.brandJoined ? brandThanks() : `
        <form class="form" id="brand-form" novalidate><div><span class="label">Waitlist</span><h2 class="h2" style="margin-top:8px;font-size:2rem">Get early access</h2></div>
          <div class="field"><label for="b-company">Company</label><input class="input" id="b-company" autocomplete="organization"></div>
          <div class="field"><label for="b-email">Work email</label><input class="input" id="b-email" type="email" autocomplete="email"></div>
          <div class="field"><label for="b-type">Your first project</label><select id="b-type"><option>Collaboration</option><option>Campaign</option><option>Installation</option><option>Event</option><option>Not sure yet</option></select></div>
          <button class="btn btn-primary btn-lg" type="submit">Join the waitlist</button>
        </form>`}</div>
    </div></section>`;
    function mount() {
      const f = $('#brand-form'); if (!f) return;
      f.addEventListener('submit', (e) => {
        e.preventDefault(); $$('.err', f).forEach((x) => x.remove()); $$('.has-error', f).forEach((x) => x.classList.remove('has-error'));
        const bad = [];
        if (!$('#b-company').value.trim()) bad.push(['b-company', 'Add your company name.']);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#b-email').value.trim())) bad.push(['b-email', 'Enter a work email like name@brand.com.']);
        bad.forEach(([id, m]) => { const fl = $('#' + id).closest('.field'); fl.classList.add('has-error'); fl.insertAdjacentHTML('beforeend', `<span class="err">${icon('alert', 'i-sm')} ${m}</span>`); });
        if (bad.length) { $('#' + bad[0][0]).focus(); return; }
        S.brandJoined = true; save(); $('#brand-box').innerHTML = brandThanks(); toast("You're on the list");
      });
    }
    return { html, mount, title: 'For brands' };
  }
  const brandThanks = () => `<div class="stack" style="gap:12px"><span class="pill pill-ok" style="align-self:flex-start">On the waitlist</span><h2 class="h2" style="font-size:2rem">Thanks, we'll be in touch.</h2><p class="muted">The Art Plug team will contact you before CORE for brands opens, with a first shortlist for your project.</p><a class="link-arrow" href="#/discover">Browse creators in the meantime ${icon('arrowR', 'i-sm')}</a></div>`;

  /* ================= 10. admin ================= */
  function adminView(r) {
    if (S.role !== 'admin') return gate('admin', 'Curation console', 'This area is for Marcel and The Art Plug curation team.', '#/admin');
    const tab = ['works', 'spotlight'].includes(r.parts[1]) ? r.parts[1] : 'profiles';
    const pendingLeft = D.PENDING_CREATORS.filter((p) => !S.pending[p.id]).length;
    const modItems = moderationItems();
    const modLeft = modItems.filter((m) => !S.moderation[m.id]).length;
    const html = `
    <section class="wrap page-head"><div class="row" style="justify-content:space-between"><div><span class="label">${icon('plug', 'i-sm')} The Art Plug · Curation console</span><h1 class="h1" style="margin-top:10px">Welcome back, Marcel.</h1></div><span class="mono muted">Week ${D.SPOTLIGHT.week} · ${D.SPOTLIGHT.range}</span></div>
      <div class="kpis" style="margin-top:28px">
        <div class="kpi"><span class="label">Profiles to review</span><span class="v">${pendingLeft}</span><span class="delta flat">oldest waiting 2 days</span></div>
        <div class="kpi"><span class="label">Works to moderate</span><span class="v">${modLeft}</span><span class="delta flat">${modItems.filter((m) => m.level === 'flag' && !S.moderation[m.id]).length} flagged</span></div>
        <div class="kpi"><span class="label">Live creators</span><span class="v">${D.creators.length + Object.values(S.pending).filter((v) => v === 'approved').length}</span><span class="delta up">${icon('arrowUp', 'i-sm')} 4 this week</span></div>
        <div class="kpi"><span class="label">Rotation queue</span><span class="v">${S.spotlight.queue.length}</span><span class="delta flat">next lineup ${D.SPOTLIGHT.nextRange}</span></div>
      </div>
    </section>
    <div class="wrap" style="margin-top:28px"><div class="tabs">
      <a href="#/admin" ${tab === 'profiles' ? 'aria-current="page"' : ''}>Profile validation<span class="count">${pendingLeft}</span></a>
      <a href="#/admin/works" ${tab === 'works' ? 'aria-current="page"' : ''}>Artwork moderation<span class="count">${modLeft}</span></a>
      <a href="#/admin/spotlight" ${tab === 'spotlight' ? 'aria-current="page"' : ''}>Spotlight rotation</a>
    </div></div>
    <section class="wrap section-tight" id="admin-panel">${tab === 'profiles' ? adminProfiles() : tab === 'works' ? adminWorks(modItems) : adminSpotlight()}</section>`;
    function mount() {
      $$('[data-pv]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.id, v = b.dataset.pv; const p = D.PENDING_CREATORS.find((x) => x.id === id);
        if (v === 'undo') delete S.pending[id]; else S.pending[id] = v; save(); render();
        if (v !== 'undo') toast({ approved: `${p.name} is now live on CORE`, changes: `Change request sent to ${p.name}`, declined: `${p.name}'s application was declined` }[v]);
      }));
      $$('[data-mod]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.id, v = b.dataset.mod; const m = modItems.find((x) => x.id === id);
        if (v === 'undo') { delete S.moderation[id]; applyModeration(m, 'undo'); } else { S.moderation[id] = v; applyModeration(m, v); }
        save(); render();
        if (v !== 'undo') toast({ approved: `${m.title} is public`, hidden: `${m.title} is hidden from CORE`, contacted: `Message sent to ${creator(m.creatorId).name}` }[v]);
      }));
      $$('[data-sp]').forEach((b) => b.addEventListener('click', () => {
        const act = b.dataset.sp, id = b.dataset.id; const q = S.spotlight.queue; const i = q.indexOf(id);
        if (act === 'up' && i > 0) [q[i - 1], q[i]] = [q[i], q[i - 1]];
        if (act === 'down' && i < q.length - 1) [q[i + 1], q[i]] = [q[i], q[i + 1]];
        if (act === 'skip') { q.splice(i, 1); q.push(id); toast(`${creator(id).name} moved to the end of the queue`); }
        if (act === 'pick') { S.spotlight.nextPick = id; toast(`${creator(id).name} is your pick for next week`); }
        if (act === 'publish') { S.spotlight.published = true; toast(`Week ${D.SPOTLIGHT.week + 1} lineup scheduled for Monday`); }
        if (act === 'rule') { S.spotlight.rules[id] = !S.spotlight.rules[id]; }
        save(); render();
      }));
    }
    return { html, mount, title: 'Admin' };
  }
  function adminProfiles() {
    return D.PENDING_CREATORS.map((p) => {
      const done = S.pending[p.id];
      const samples = [0, 1, 2].map((k) => Art.src({ gen: p.gen, palette: p.palette, backdrop: p.backdrop, seed: Art.hashStr(p.id + k), w: 80, h: 100 }));
      const chk = (k, label) => { const v = p.checks[k]; return `<span class="pill ${v === 'ok' ? 'pill-ok' : v === 'warn' ? 'pill-warn' : 'pill-danger'}">${label}${v === 'ok' ? '' : v === 'warn' ? ': check' : ': flagged'}</span>`; };
      if (done) return `<div class="queue-card"><div class="row" style="gap:14px"><span class="pill ${done === 'approved' ? 'pill-ok' : done === 'changes' ? 'pill-warn' : 'pill-muted'}">${{ approved: 'Approved', changes: 'Changes requested', declined: 'Declined' }[done]}</span><strong>${esc(p.name)}</strong><span class="mono muted">${esc(p.city)} · ${esc(p.category)}</span></div><div><button class="btn btn-ghost btn-sm" data-pv="undo" data-id="${p.id}">Undo</button></div></div>`;
      return `<article class="queue-card">
        <div style="min-width:0">
          <div class="row" style="gap:12px"><span class="avatar" style="background:${darkest(p.palette)}">${initials(p.name)}</span><div><strong style="font-size:1.0625rem">${esc(p.name)}</strong><div class="mono muted">${esc(p.city)}, ${esc(p.country)} · ${esc(p.category)} · @${esc(p.handle)} · submitted ${esc(p.submitted)}</div></div></div>
          <div class="thumbs3">${samples.map((s) => `<div><img src="${s}" alt="Sample work by ${esc(p.name)}"></div>`).join('')}<div style="display:grid;place-items:center" class="mono muted">+${p.works - 3}</div></div>
          <div class="checks">${chk('identity', 'Identity')}${chk('portfolio', 'Portfolio')}${chk('originality', 'Originality')}</div>
          <p class="small" style="margin-top:10px;color:var(--ink-2)">${icon(p.checks.originality === 'flag' ? 'alert' : 'message', 'i-sm')} ${esc(p.note)}</p>
        </div>
        <div class="queue-actions">
          <button class="btn btn-primary btn-sm" data-pv="approved" data-id="${p.id}">${icon('check', 'i-sm')} Approve</button>
          <button class="btn btn-secondary btn-sm" data-pv="changes" data-id="${p.id}">${icon('edit', 'i-sm')} Request changes</button>
          <button class="btn btn-danger btn-sm" data-pv="declined" data-id="${p.id}">${icon('x', 'i-sm')} Decline</button>
        </div>
      </article>`;
    }).join('');
  }
  function moderationItems() {
    const fromStudio = S.extraWorks.filter((w) => w.review).map((w) => ({ id: 'x-' + w.id, workId: w.id, creatorId: w.creatorId, title: w.title, medium: w.medium, w: w.w, h: w.h, price: w.price, reason: 'New upload', detail: 'Submitted from the creator studio. Automatic checks passed.', level: 'info', art: w.art }));
    return fromStudio.concat(D.MODERATION.map((m) => {
      if (m.ref) { const w = work(m.ref); return { ...m, title: w.title, medium: w.medium, w: w.w, h: w.h, price: w.price, art: w.art, workId: w.id }; }
      const c = creator(m.creatorId);
      return { ...m, art: { gen: c.gen, palette: c.palette, backdrop: c.backdrop, seed: Art.hashStr(m.id + m.title), w: m.w, h: m.h } };
    }));
  }
  function applyModeration(m, v) {
    if (m.id.startsWith('x-')) { const w = S.extraWorks.find((x) => x.id === m.workId); if (w) w.review = v === 'approved' ? 'approved' : v === 'hidden' ? 'hidden' : v === 'undo' ? 'pending' : w.review; return; }
    if (m.ref) { S.overrides[m.ref] = { ...(S.overrides[m.ref] || {}), hidden: v === 'hidden' }; return; }
    const wid = 'mod-' + m.id;
    S.extraWorks = S.extraWorks.filter((x) => x.id !== wid);
    if (v === 'approved') S.extraWorks.push({ id: wid, creatorId: m.creatorId, title: m.title, year: 2026, medium: m.medium, w: m.w, h: m.h, price: m.price, status: 'available', edition: null, category: creator(m.creatorId).category, city: creator(m.creatorId).city, art: m.art, views: 0, saves: 0, addedDaysAgo: 0, description: `${m.title} (2026), ${m.medium.toLowerCase()}. New on CORE.` });
  }
  function adminWorks(items) {
    return items.map((m) => {
      const c = creator(m.creatorId); const done = S.moderation[m.id];
      const lvl = { info: ['pill-info', 'Review'], warn: ['pill-warn', 'Check'], flag: ['pill-danger', 'Flagged'] }[m.level];
      return `<article class="queue-card" style="${done ? 'opacity:.7' : ''}">
        <div class="row" style="gap:18px;align-items:flex-start;flex-wrap:nowrap;min-width:0">
          <div style="width:110px;height:110px;background:var(--plinth);display:grid;place-items:center;flex:none"><img src="${Art.src(m.art)}" alt="${esc(m.title)}" style="max-width:82%;max-height:82%;box-shadow:var(--hang)"></div>
          <div style="min-width:0">
            <div class="row" style="gap:8px"><span class="pill ${lvl[0]}">${lvl[1]}</span><span class="mono muted">${esc(m.reason)}</span></div>
            <div style="margin-top:8px"><em class="title-work" style="font-size:1.375rem">${esc(m.title)}</em> <span class="muted">by ${esc(c.name)}</span></div>
            <div class="mono muted">${esc(m.medium)} · ${m.w} × ${m.h} cm · ${money(m.price)}</div>
            <p class="small" style="margin-top:8px;color:var(--ink-2)">${esc(m.detail)}</p>
          </div>
        </div>
        <div class="queue-actions">${done ? `<span class="pill ${done === 'approved' ? 'pill-ok' : done === 'hidden' ? 'pill-muted' : 'pill-info'}">${{ approved: 'Approved', hidden: 'Hidden', contacted: 'Creator contacted' }[done]}</span><button class="btn btn-ghost btn-sm" data-mod="undo" data-id="${m.id}">Undo</button>` : `
          <button class="btn btn-primary btn-sm" data-mod="approved" data-id="${m.id}">${icon('check', 'i-sm')} Approve</button>
          <button class="btn btn-secondary btn-sm" data-mod="contacted" data-id="${m.id}">${icon('message', 'i-sm')} Ask the creator</button>
          <button class="btn btn-danger btn-sm" data-mod="hidden" data-id="${m.id}">${icon('hide', 'i-sm')} Hide</button>`}
        </div>
      </article>`;
    }).join('');
  }
  function adminSpotlight() {
    const sp = S.spotlight; const nextPick = sp.nextPick || sp.queue[0];
    const next = sp.queue.slice(0, 6);
    const slot = (id, pick) => { const c = creator(id); const w = featuredWork(id); return `<div class="slot"><div style="position:relative">${boxImg(w)}${pick ? `<span class="pill pill-accent no-dot" style="position:absolute;top:8px;left:8px">${pickLabel}</span>` : ''}</div><div><strong class="small">${esc(c.name)}</strong><div class="mono muted">${esc(c.city)} · ${esc(c.category)}</div></div></div>`; };
    return `
      <div class="section-head" style="margin-bottom:20px"><div><span class="label">Live now · ${D.SPOTLIGHT.range}</span><h2 class="h2" style="margin-top:6px">Week ${D.SPOTLIGHT.week} lineup</h2></div><span class="fair-note">${icon('rotate', 'i-sm')} Rotates Monday 00:00 Miami time</span></div>
      <div class="slots">${sp.current.map((id) => slot(id, id === sp.curatorPick)).join('')}</div>
      <hr class="rule" style="margin-block:40px">
      <div class="two-col" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">
        <div>
          <div class="section-head" style="margin-bottom:12px"><div><span class="label">Up next · ${D.SPOTLIGHT.nextRange}</span><h2 class="h2" style="margin-top:6px">Rotation queue</h2></div>
            <button class="btn ${sp.published ? 'btn-secondary' : 'btn-primary'} btn-sm" data-sp="publish" ${sp.published ? 'disabled' : ''}>${sp.published ? icon('check', 'i-sm') + ' Week 41 scheduled' : 'Schedule week 41'}</button></div>
          <p class="small muted" style="margin-bottom:12px">Ordered by longest wait since last feature. The first six go live next Monday.</p>
          <div class="table-wrap"><table class="table queue-table"><thead><tr><th>#</th><th>Creator</th><th>Last featured</th><th>Plan</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>
            ${sp.queue.map((id, i) => { const c = creator(id); return `<tr style="${i < 6 ? '' : 'color:var(--ink-3)'}">
              <td class="pos">${i + 1}</td>
              <td><div class="row" style="gap:10px;flex-wrap:nowrap">${avatar(c)}<div><strong>${esc(c.name)}</strong>${nextPick === id && i < 6 ? ' <span class="pill pill-accent no-dot">Pick</span>' : ''}<div class="mono muted" style="white-space:nowrap">${esc(c.city)} · ${esc(c.category)}</div></div></div></td>
              <td class="mono">${esc(D.SPOTLIGHT.lastFeatured[id] || '—')}</td>
              <td><span class="pill pill-muted no-dot">${planName(id === D.ME_CREATOR ? S.plan : c.plan)}</span></td>
              <td><div class="row" style="gap:4px;flex-wrap:nowrap;justify-content:flex-end">
                <button class="icon-btn" style="width:36px;height:36px" data-sp="up" data-id="${id}" aria-label="Move ${esc(c.name)} up" ${i === 0 ? 'disabled' : ''}>${icon('arrowUp', 'i-sm')}</button>
                <button class="icon-btn" style="width:36px;height:36px" data-sp="down" data-id="${id}" aria-label="Move ${esc(c.name)} down" ${i === sp.queue.length - 1 ? 'disabled' : ''}>${icon('arrowDown', 'i-sm')}</button>
                <button class="icon-btn" style="width:36px;height:36px" data-sp="pick" data-id="${id}" aria-label="Make ${esc(c.name)} next week's pick" title="${pickLabel}">${icon('sparkle', 'i-sm')}</button>
                <button class="btn btn-ghost btn-sm" data-sp="skip" data-id="${id}">Skip</button>
              </div></td></tr>`; }).join('')}
          </tbody></table></div>
        </div>
        <div class="stack" style="gap:16px">
          <div class="panel"><div class="panel-head"><h2 class="h3">Next week preview</h2></div><div class="grid" style="grid-template-columns:repeat(3,1fr);gap:8px">${next.map((id) => boxImg(featuredWork(id), 'square')).join('')}</div></div>
          <div class="panel"><div class="panel-head"><h2 class="h3">Rotation rules</h2></div><div class="rules">
            <div class="r"><span>Creators per week</span><span class="mono">6</span></div>
            <div class="r"><span>Feature length</span><span class="mono">7 days</span></div>
            ${[['city', 'Max 2 from the same city'], ['cat', 'Max 2 from the same discipline'], ['pick', "1 Marcel's pick per week"]].map(([k, t]) => `<div class="r"><span>${t}</span><label class="toggle"><input type="checkbox" data-sp="rule" data-id="${k}" ${sp.rules[k] ? 'checked' : ''}><span class="track"></span><span class="sr-only">${t}</span></label></div>`).join('')}
            <div class="r"><span>Paid plans affect order</span><span class="row small muted" style="gap:6px">${icon('lock', 'i-sm')} Never</span></div>
          </div></div>
        </div>
      </div>`;
  }

  /* ================= join ================= */
  function joinView(r) {
    const role = r.q.role === 'collector' ? 'collector' : r.q.role === 'creator' ? 'creator' : '';
    if (!role) return { html: `<section class="wrap section" style="max-width:960px"><span class="label">Join CORE</span><h1 class="h1" style="margin-top:12px">How will you use CORE?</h1><div class="cta-split" style="margin-top:36px">
      <a class="cta-card" href="#/join?role=creator"><span class="label">Creator</span><h3>I make original work</h3><p class="muted">Open a studio profile, list works and receive requests. Free to start.</p><span class="link-arrow">Continue ${icon('arrowR', 'i-sm')}</span></a>
      <a class="cta-card" href="#/join?role=collector"><span class="label">Collector</span><h3>I want to discover and buy</h3><p class="muted">Follow creators, save works and contact studios. Always free.</p><span class="link-arrow">Continue ${icon('arrowR', 'i-sm')}</span></a></div></section>`, title: 'Join' };
    const plan = PLANS.find((p) => p.k === r.q.plan) ? r.q.plan : 'open';
    const html = `<section class="wrap section" style="max-width:780px">
      <a class="link small" href="#/join">${icon('arrowL', 'i-sm')} Back</a>
      <span class="label" style="display:block;margin-top:24px">Join as a ${role}</span>
      <h1 class="h1" style="margin-top:10px">${role === 'creator' ? 'Open your studio' : 'Start collecting'}</h1>
      <p class="lede" style="margin-top:12px">${role === 'creator' ? 'Tell us about your practice. The Art Plug reviews every profile before it goes live, usually within 72 hours.' : 'Create a free account to follow creators, save works and send requests.'}</p>
      <form class="form" id="join-form" style="margin-top:32px" novalidate>
        <div class="form-grid">
          <div class="field"><label for="j-name">${role === 'creator' ? 'Name or studio name' : 'Your name'}</label><input class="input" id="j-name" autocomplete="name"></div>
          <div class="field"><label for="j-email">Email</label><input class="input" id="j-email" type="email" autocomplete="email"></div>
          <div class="field"><label for="j-city">City</label><input class="input" id="j-city" autocomplete="address-level2" list="city-list"><datalist id="city-list">${Object.keys(D.CITIES).map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
          ${role === 'creator' ? `<div class="field"><label for="j-cat">Main discipline</label><select id="j-cat">${D.CATEGORIES.map((c) => `<option>${c}</option>`).join('')}</select></div>` : `<div class="field"><span class="flabel">Interested in</span><div class="chips" id="j-interests">${D.CATEGORIES.map((c) => `<button type="button" class="chip" aria-pressed="false">${c}</button>`).join('')}</div></div>`}
        </div>
        ${role === 'creator' ? `
        <div class="field"><label for="j-link">Instagram or website</label><input class="input" id="j-link" placeholder="@yourstudio"></div>
        <div class="field"><span class="flabel">Three works that represent you</span><label class="dropzone" for="j-works">${icon('upload')}<span id="j-works-label">Add 3 photos, at least 1,600 px wide.</span></label><input id="j-works" type="file" accept="image/*" multiple class="sr-only"></div>
        <fieldset style="border:0;padding:0;margin:0"><legend class="flabel" style="font-weight:600;font-size:.875rem;margin-bottom:8px">Plan</legend><div class="type-picker">${PLANS.map((p) => `<label class="type-opt"><input type="radio" name="plan" value="${p.k}" ${plan === p.k ? 'checked' : ''}><strong>${p.name}</strong><span>${p.m ? '$' + p.m + ' / month' : 'Free'}</span></label>`).join('')}</div></fieldset>` : ''}
        <label class="check"><input type="checkbox" id="j-terms"> I agree to the CORE terms. ${role === 'creator' ? 'I confirm the work I list is my own.' : ''}</label>
        <div><button class="btn btn-primary btn-lg" type="submit">${role === 'creator' ? 'Submit my profile' : 'Create my account'}</button></div>
      </form>
    </section>`;
    function mount() {
      $$('#j-interests .chip').forEach((b) => b.addEventListener('click', () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true')));
      const jw = $('#j-works'); if (jw) jw.addEventListener('change', () => { $('#j-works-label').textContent = jw.files.length ? `${jw.files.length} photo${jw.files.length > 1 ? 's' : ''} selected` : 'Add 3 photos.'; });
      $('#join-form').addEventListener('submit', (e) => {
        e.preventDefault(); const f = e.target; $$('.err', f).forEach((x) => x.remove()); $$('.has-error', f).forEach((x) => x.classList.remove('has-error'));
        const bad = [];
        if (!$('#j-name').value.trim()) bad.push(['j-name', 'Add a name.']);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#j-email').value.trim())) bad.push(['j-email', 'Enter an email address like name@example.com.']);
        if (!$('#j-city').value.trim()) bad.push(['j-city', 'Add your city so we can show you nearby work.']);
        bad.forEach(([id, m]) => { const fl = $('#' + id).closest('.field'); fl.classList.add('has-error'); fl.insertAdjacentHTML('beforeend', `<span class="err">${icon('alert', 'i-sm')} ${m}</span>`); });
        if (!$('#j-terms').checked) { $('#j-terms').closest('.check').insertAdjacentHTML('afterend', `<span class="err small" style="color:var(--danger)">${icon('alert', 'i-sm')} Please accept the terms to continue.</span>`); bad.push(['j-terms']); }
        if (bad.length) { $('#' + bad[0][0]).focus(); return; }
        const name = $('#j-name').value.trim();
        if (role === 'creator') {
          main.innerHTML = `<section class="wrap section" style="max-width:780px"><span class="pill pill-ok">Profile submitted</span><h1 class="h1" style="margin-top:18px">Thanks, ${esc(first(name))}. A curator will look at your work.</h1><p class="lede" style="margin-top:16px">The Art Plug team reviews every creator by hand, usually within 72 hours. We'll email you at ${esc($('#j-email').value.trim())} when your studio is live.</p><ol class="steps" style="margin-top:32px"><li><span><strong>Review</strong><br><span class="muted small">A curator checks your portfolio and identity.</span></span></li><li><span><strong>Go live</strong><br><span class="muted small">Your profile appears in Discover and joins the spotlight queue.</span></span></li><li><span><strong>Get requests</strong><br><span class="muted small">Collectors contact you directly. You keep 100% of every sale.</span></span></li></ol><div class="row" style="margin-top:28px"><button class="btn btn-primary btn-lg" data-action="signin-as" data-role="creator" data-go="#/studio" data-name="Inès Moreau">Preview a live studio (demo)</button><a class="btn btn-secondary btn-lg" href="#/">Back to home</a></div></section>`;
          window.scrollTo(0, 0);
        } else {
          setRole('collector'); const city = $('#j-city').value.trim();
          toast(`Welcome to CORE, ${first(name)}`);
          location.hash = D.CITIES[city] ? `#/discover?city=${encodeURIComponent(city)}&avail=1` : '#/discover';
        }
      });
    }
    return { html, mount, title: 'Join' };
  }

  /* ================= boot ================= */
  renderFooter();
  render();
})();
