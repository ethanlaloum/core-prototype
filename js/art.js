/*
 * Procedural placeholder artworks.
 * Every work in the prototype is drawn from a seed + a palette, so the mockup
 * never shows a real artist's image under a fictional name. Swap Art.src()
 * for real photo URLs when the backend exists.
 */
(function () {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const rr = (r, a, b) => a + r() * (b - a);
  const f = (n) => Math.round(n * 10) / 10;

  function hexToRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
  function rgbToHex(c) { return '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  // amt > 0 mixes toward white, amt < 0 toward black
  function shade(hex, amt) {
    const c = hexToRgb(hex);
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    return rgbToHex(c.map((v) => v + (t - v) * p));
  }
  function shuffle(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function smoothClosed(pts) {
    const n = pts.length;
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + 'Z';
  }
  function smoothOpen(pts) {
    const n = pts.length;
    let d = `${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }

  const GRAIN = '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1"/></filter>';
  const grainLayer = (W, H, o) => `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="${o}" style="mix-blend-mode:multiply"/>`;
  const softFilter = (seed, scale, blur) => `<filter id="soft" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.028" numOctaves="3" seed="${seed % 997}"/><feDisplacementMap in="SourceGraphic" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="${blur}"/></filter>`;
  const roughFilter = (seed, scale) => `<filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="4" seed="${seed % 997}"/><feDisplacementMap in="SourceGraphic" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`;

  /* ---------- 2D generators ---------- */

  function colorfield(c) {
    const { r, p, W, H, seed } = c;
    const m = W * rr(r, 0.06, 0.1), n = r() < 0.55 ? 2 : 3, gap = H * rr(r, 0.025, 0.05);
    const avail = H - 2 * m - gap * (n - 1);
    const ws = Array.from({ length: n }, () => rr(r, 0.6, 1.5)); const sum = ws.reduce((a, b) => a + b, 0);
    const cols = shuffle(r, p.slice(1));
    let y = m, body = `<rect width="${W}" height="${H}" fill="${p[0]}"/><g filter="url(#soft)">`;
    body += `<rect x="${f(m * 0.7)}" y="${f(m * 0.7)}" width="${f(W - m * 1.4)}" height="${f(H - m * 1.4)}" fill="${shade(p[0], -0.12)}" opacity="0.5"/>`;
    for (let i = 0; i < n; i++) {
      const h = (avail * ws[i]) / sum, col = cols[i % cols.length];
      body += `<rect x="${f(m)}" y="${f(y)}" width="${f(W - 2 * m)}" height="${f(h)}" fill="${col}" opacity="${rr(r, 0.86, 0.97).toFixed(2)}"/>`;
      body += `<rect x="${f(m + W * 0.02)}" y="${f(y + h * 0.1)}" width="${f(W - 2 * m - W * 0.04)}" height="${f(h * 0.8)}" fill="${shade(col, rr(r, -0.12, 0.12))}" opacity="0.35"/>`;
      y += h + gap;
    }
    body += '</g>';
    return { defs: softFilter(seed, W * 0.028, W * 0.005), body };
  }

  function geometric(c) {
    const { r, p, W, H } = c;
    const cols = pick(r, [3, 3, 4]), cell = W / cols, rows = Math.ceil(H / cell);
    let body = `<rect width="${W}" height="${H}" fill="${p[0]}"/>`;
    const inks = p.slice(1);
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const x = gx * cell, y = gy * cell, cx = x + cell / 2, cy = y + cell / 2;
        const t = pick(r, ['circle', 'quarter', 'quarter', 'half', 'half', 'rect', 'stripes', 'empty', 'ring']);
        const col = pick(r, inks), col2 = pick(r, inks.filter((k) => k !== col));
        const rot = pick(r, [0, 90, 180, 270]);
        if (r() < 0.35) body += `<rect x="${f(x)}" y="${f(y)}" width="${f(cell)}" height="${f(cell)}" fill="${col2}"/>`;
        const tr = `transform="rotate(${rot} ${f(cx)} ${f(cy)})"`;
        if (t === 'circle') body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(cell * 0.42)}" fill="${col}"/>`;
        if (t === 'ring') body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(cell * 0.32)}" fill="none" stroke="${col}" stroke-width="${f(cell * 0.14)}"/>`;
        if (t === 'quarter') body += `<path d="M${f(x)} ${f(y)} L${f(x + cell)} ${f(y)} A${f(cell)} ${f(cell)} 0 0 1 ${f(x)} ${f(y + cell)} Z" fill="${col}" ${tr}/>`;
        if (t === 'half') body += `<path d="M${f(x)} ${f(cy)} A${f(cell / 2)} ${f(cell / 2)} 0 0 1 ${f(x + cell)} ${f(cy)} Z" fill="${col}" ${tr}/>`;
        if (t === 'rect') body += `<rect x="${f(x)}" y="${f(y)}" width="${f(cell / 2)}" height="${f(cell)}" fill="${col}" ${tr}/>`;
        if (t === 'stripes') for (let i = 0; i < 4; i++) body += `<rect x="${f(x)}" y="${f(y + i * cell / 4)}" width="${f(cell)}" height="${f(cell / 8)}" fill="${col}" ${tr}/>`;
      }
    }
    return { defs: '', body };
  }

  function blobs(c) {
    const { r, p, W, H } = c;
    let body = `<rect width="${W}" height="${H}" fill="${p[0]}"/>`;
    const n = Math.floor(rr(r, 6, 10)), inks = p.slice(1);
    for (let i = 0; i < n; i++) {
      const cx = rr(r, 0.1, 0.9) * W, cy = rr(r, 0.1, 0.9) * H, rad = rr(r, 0.08, 0.24) * Math.min(W, H);
      const k = Math.floor(rr(r, 6, 10)), pts = [];
      for (let j = 0; j < k; j++) {
        const a = (j / k) * Math.PI * 2, rv = rad * rr(r, 0.55, 1.25);
        pts.push([cx + Math.cos(a) * rv, cy + Math.sin(a) * rv]);
      }
      const stretch = r() < 0.4 ? `transform="rotate(${f(rr(r, -60, 60))} ${f(cx)} ${f(cy)}) translate(${f(cx)} ${f(cy)}) scale(0.55 1.6) translate(${f(-cx)} ${f(-cy)})"` : '';
      body += `<path d="${smoothClosed(pts)}" fill="${pick(r, inks)}" ${stretch}/>`;
    }
    for (let i = 0; i < 5; i++) body += `<circle cx="${f(rr(r, 0.05, 0.95) * W)}" cy="${f(rr(r, 0.05, 0.95) * H)}" r="${f(rr(r, 0.01, 0.035) * W)}" fill="${pick(r, inks)}"/>`;
    return { defs: '', body };
  }

  function waves(c) {
    const { r, p, W, H } = c;
    const n = Math.floor(rr(r, 22, 34)), amp = H * rr(r, 0.015, 0.05), freq = rr(r, 1.5, 4) * Math.PI * 2 / W, shift = rr(r, 0.08, 0.3);
    const curve = (i) => { const pts = []; const base = (i / n) * H * 1.1 - H * 0.05; for (let x = -20; x <= W + 20; x += W / 48) pts.push([x, base + amp * Math.sin(freq * x + i * shift) + amp * 0.6 * Math.sin(freq * 0.37 * x - i * shift * 1.7)]); return pts; };
    let body = `<rect width="${W}" height="${H}" fill="${p[0]}"/>`;
    const accentAt = Math.floor(rr(r, 0.2, 0.8) * n);
    for (let i = 0; i < n; i += 2) {
      const top = curve(i), bot = curve(i + 1).reverse();
      const col = Math.abs(i - accentAt) < 3 ? p[2 + (i % 2 ? 1 : 0)] || p[2] : p[1];
      body += `<path d="M${smoothOpen(top)} L${smoothOpen(bot)} Z" fill="${col}"/>`;
    }
    return { defs: '', body };
  }

  function horizon(c) {
    const { r, p, W, H, seed } = c;
    const hz = H * rr(r, 0.52, 0.66), sunR = W * rr(r, 0.12, 0.2), sx = W * rr(r, 0.3, 0.7), sy = hz - sunR * rr(r, 0.1, 0.8);
    let defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>`;
    defs += `<clipPath id="above"><rect width="${W}" height="${f(hz)}"/></clipPath>`;
    defs += softFilter(seed, W * 0.02, W * 0.003);
    let body = `<g filter="url(#soft)"><rect width="${W}" height="${f(hz + 4)}" fill="url(#sky)"/>`;
    body += `<g clip-path="url(#above)"><circle cx="${f(sx)}" cy="${f(sy)}" r="${f(sunR)}" fill="${p[3]}"/>`;
    for (let i = 0; i < 4; i++) body += `<rect x="0" y="${f(sy + sunR * (0.15 + i * 0.22))}" width="${W}" height="${f(sunR * (0.04 + i * 0.03))}" fill="${p[2]}"/>`;
    body += '</g>';
    let y = hz; const bands = Math.floor(rr(r, 5, 9));
    for (let i = 0; i < bands; i++) {
      const h = (H - hz) / bands * rr(r, 0.7, 1.3);
      body += `<rect x="-10" y="${f(y)}" width="${W + 20}" height="${f(h + 3)}" fill="${i % 2 ? p[0] : shade(p[4], i * 0.06 - 0.1)}"/>`;
      y += h;
    }
    body += `<rect x="-10" y="${f(y)}" width="${W + 20}" height="${f(H - y + 10)}" fill="${p[0]}"/>`;
    for (let i = 0; i < 6; i++) {
      const w = sunR * 2 * (1 - i * 0.14) * rr(r, 0.7, 1.1);
      body += `<rect x="${f(sx - w / 2)}" y="${f(hz + (H - hz) * (0.08 + i * 0.13))}" width="${f(w)}" height="${f(H * 0.012)}" fill="${p[3]}" opacity="${(0.85 - i * 0.1).toFixed(2)}"/>`;
    }
    body += '</g>';
    return { defs, body };
  }

  function gestural(c) {
    const { r, p, W, H, seed } = c;
    let body = `<rect width="${W}" height="${H}" fill="${p[0]}"/><g filter="url(#rough)" stroke-linecap="round" fill="none">`;
    const n = Math.floor(rr(r, 14, 24)), inks = p.slice(1);
    for (let i = 0; i < n; i++) {
      const x0 = rr(r, -0.1, 1.1) * W, y0 = rr(r, -0.1, 1.1) * H, x1 = rr(r, -0.1, 1.1) * W, y1 = rr(r, -0.1, 1.1) * H;
      const cx = rr(r, 0, 1) * W, cy = rr(r, 0, 1) * H;
      body += `<path d="M${f(x0)} ${f(y0)} Q${f(cx)} ${f(cy)} ${f(x1)} ${f(y1)}" stroke="${pick(r, inks)}" stroke-width="${f(rr(r, 0.012, 0.085) * W)}" opacity="${rr(r, 0.72, 0.96).toFixed(2)}"/>`;
    }
    body += '</g>';
    for (let i = 0; i < 26; i++) body += `<circle cx="${f(rr(r, 0, 1) * W)}" cy="${f(rr(r, 0, 1) * H)}" r="${f(rr(r, 0.002, 0.009) * W)}" fill="${pick(r, inks)}" opacity="0.9"/>`;
    return { defs: roughFilter(seed, W * 0.022), body };
  }

  function digital(c) {
    const { r, p, W, H } = c;
    let defs = `<filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(W * 0.07)}"/></filter>`;
    defs += `<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity="0.25"/></pattern>`;
    let body = `<rect width="${W}" height="${H}" fill="${p[0]}"/><g filter="url(#bloom)">`;
    for (let i = 0; i < 5; i++) body += `<circle cx="${f(rr(r, 0.1, 0.9) * W)}" cy="${f(rr(r, 0.1, 0.9) * H)}" r="${f(rr(r, 0.15, 0.32) * W)}" fill="${p[1 + (i % (p.length - 1))]}" opacity="0.85"/>`;
    body += '</g>';
    if (r() < 0.5) {
      const cx = rr(r, 0.35, 0.65) * W, cy = rr(r, 0.35, 0.65) * H;
      for (let i = 1; i < 26; i++) body += `<circle cx="${f(cx + i * 1.5)}" cy="${f(cy)}" r="${f(i * W * 0.022)}" fill="none" stroke="${p[3]}" stroke-width="1.6" opacity="0.55"/>`;
    } else {
      const s = W / 40, x0 = rr(r, 0.05, 0.4) * W, y0 = rr(r, 0.1, 0.5) * H;
      for (let gy = 0; gy < 14; gy++) for (let gx = 0; gx < 18; gx++) if (r() < 0.55) body += `<rect x="${f(x0 + gx * s)}" y="${f(y0 + gy * s)}" width="${f(s * 0.8)}" height="${f(s * 0.8)}" fill="${p[3]}" opacity="${rr(r, 0.2, 0.9).toFixed(2)}"/>`;
    }
    for (let i = 0; i < 7; i++) body += `<rect x="${f(rr(r, -0.2, 0.6) * W)}" y="${f(rr(r, 0, 1) * H)}" width="${f(rr(r, 0.2, 0.7) * W)}" height="${f(rr(r, 0.004, 0.03) * H)}" fill="${pick(r, p.slice(1))}" opacity="0.8" style="mix-blend-mode:screen"/>`;
    body += `<rect width="${W}" height="${H}" fill="url(#scan)"/>`;
    return { defs, body };
  }

  /* ---------- object generators (photographed on a studio backdrop) ---------- */

  function backdrop(c) {
    const { p, W, H } = c;
    const wall = p.backdrop || shade(p[0], 0.1);
    return `<defs><linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(wall, 0.08)}"/><stop offset="0.72" stop-color="${wall}"/><stop offset="0.721" stop-color="${shade(wall, -0.06)}"/><stop offset="1" stop-color="${shade(wall, -0.12)}"/></linearGradient><filter id="sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(W * 0.018)}"/></filter></defs><rect width="${W}" height="${H}" fill="url(#bd)"/>`;
  }
  const floorShadow = (cx, y, w, o = 0.28) => `<ellipse cx="${f(cx)}" cy="${f(y)}" rx="${f(w / 2)}" ry="${f(w * 0.08)}" fill="#000" opacity="${o}" filter="url(#sh)"/>`;

  function vase(c) {
    const { r, p, W, H, side } = c;
    const floor = H * 0.8, inks = p.slice(1);
    let body = backdrop(c), defs = '';
    const count = pick(r, [1, 2, 2, 3]);
    const widths = []; let total = 0;
    for (let i = 0; i < count; i++) { const w = rr(r, 0.16, 0.3) * W * (count === 1 ? 1.5 : 1); widths.push(w); total += w; }
    let x = (W - total - (count - 1) * W * 0.04) / 2;
    for (let i = 0; i < count; i++) {
      const w = widths[i] * (side ? 0.86 : 1), h = w * rr(r, 1.1, 2.1), cx = x + widths[i] / 2, base = floor;
      const bw = w * rr(r, 0.28, 0.4), bb = w * 0.5, yb = h * rr(r, 0.25, 0.55), nw = w * rr(r, 0.14, 0.26), yn = h * rr(r, 0.78, 0.9), lw = nw * rr(r, 1.05, 1.5);
      const right = [[bw, 0], [bb, yb], [nw, yn], [lw, h]];
      const pts = right.map(([dx, dy]) => [cx + dx, base - dy]);
      const left = right.map(([dx, dy]) => [cx - dx, base - dy]).reverse();
      const d = `M${f(cx - bw)} ${f(base)} L${f(cx + bw)} ${f(base)} C${smoothOpen(pts).split(' C').slice(1).join(' C')} L${f(cx - lw)} ${f(base - h)} C${smoothOpen(left).split(' C').slice(1).join(' C')} Z`;
      const col = inks[i % inks.length], id = 'vg' + i;
      defs += `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(col, -0.35)}"/><stop offset="${side ? 0.45 : 0.32}" stop-color="${shade(col, 0.18)}"/><stop offset="1" stop-color="${shade(col, -0.45)}"/></linearGradient><clipPath id="vc${i}"><path d="${d}"/></clipPath>`;
      body += floorShadow(cx + (side ? w * 0.18 : w * 0.08), base, w * 1.3);
      body += `<path d="${d}" fill="url(#${id})"/>`;
      if (r() < 0.6) {
        const g = inks[(i + 1) % inks.length], gy = base - h * rr(r, 0.55, 0.8);
        let wave = `M${f(cx - w)} ${f(base - h - 10)} L${f(cx + w)} ${f(base - h - 10)} L${f(cx + w)} ${f(gy)}`;
        for (let k = 8; k >= 0; k--) wave += ` L${f(cx - w + (k / 8) * 2 * w)} ${f(gy + (k % 2 ? 1 : -0.2) * h * rr(r, 0.02, 0.09))}`;
        body += `<g clip-path="url(#vc${i})"><path d="${wave}Z" fill="${g}" opacity="0.9"/><rect x="${f(cx - w)}" y="${f(base - h)}" width="${f(w * 2)}" height="${f(h)}" fill="url(#${id})" opacity="0.35" style="mix-blend-mode:multiply"/></g>`;
      }
      for (let k = 1; k < 7; k++) body += `<path d="M${f(cx - w)} ${f(base - h * k / 7)} h${f(w * 2)}" stroke="#000" stroke-width="1.2" opacity="0.07" clip-path="url(#vc${i})"/>`;
      x += widths[i] + W * 0.04;
    }
    return { defs, body };
  }

  function chair(c) {
    const { r, p, W, H, side } = c;
    const floor = H * 0.84, c1 = p[1], c2 = p[2], c3 = p[3] || p[1];
    let body = backdrop(c);
    const s = side ? 0.84 : 1;
    if (r() < 0.5) {
      const w = W * 0.46 * s, cx = W / 2, seatY = floor - H * 0.3, backH = H * rr(r, 0.24, 0.34), legW = W * 0.028;
      body += floorShadow(cx + W * 0.04, floor, w * 1.35);
      body += `<rect x="${f(cx - w / 2 + legW)}" y="${f(seatY)}" width="${f(legW * 0.8)}" height="${f(floor - seatY - H * 0.02)}" fill="${shade(c2, -0.25)}"/><rect x="${f(cx + w / 2 - legW * 1.8)}" y="${f(seatY)}" width="${f(legW * 0.8)}" height="${f(floor - seatY - H * 0.02)}" fill="${shade(c2, -0.25)}"/>`;
      body += `<rect x="${f(cx - w / 2 + w * 0.06)}" y="${f(seatY - backH)}" width="${f(w * 0.88)}" height="${f(backH)}" rx="${f(w * rr(r, 0.02, 0.2))}" fill="${c1}"/>`;
      body += `<rect x="${f(cx - w / 2 + w * 0.06)}" y="${f(seatY - backH)}" width="${f(w * 0.88)}" height="${f(backH * 0.18)}" rx="${f(w * 0.02)}" fill="${shade(c1, 0.15)}" opacity="0.6"/>`;
      body += `<rect x="${f(cx - w / 2)}" y="${f(seatY)}" width="${f(w)}" height="${f(H * 0.045)}" rx="${f(H * 0.01)}" fill="${shade(c1, -0.15)}"/>`;
      body += `<rect x="${f(cx - w / 2)}" y="${f(seatY + H * 0.045)}" width="${f(legW)}" height="${f(floor - seatY - H * 0.045)}" fill="${c2}"/><rect x="${f(cx + w / 2 - legW)}" y="${f(seatY + H * 0.045)}" width="${f(legW)}" height="${f(floor - seatY - H * 0.045)}" fill="${c2}"/>`;
    } else {
      const cx = W / 2, rx = W * 0.2 * s, seatY = floor - H * 0.36;
      body += floorShadow(cx + W * 0.03, floor, rx * 2.8);
      const legs = [[-0.9, 0.9], [0.9, 0.9], [0, 0.4]];
      legs.forEach(([dx, dep], i) => { body += `<path d="M${f(cx + dx * rx * 0.55)} ${f(seatY + H * 0.03)} L${f(cx + dx * rx * 1.05)} ${f(floor - (i === 2 ? H * 0.03 : 0))}" stroke="${shade(c2, i === 2 ? -0.3 : 0)}" stroke-width="${f(W * 0.022)}" stroke-linecap="round"/>`; });
      body += `<path d="M${f(cx - rx * 0.6)} ${f(seatY + H * 0.22)} L${f(cx + rx * 0.6)} ${f(seatY + H * 0.22)}" stroke="${shade(c2, -0.15)}" stroke-width="${f(W * 0.01)}"/>`;
      body += `<ellipse cx="${f(cx)}" cy="${f(seatY + H * 0.03)}" rx="${f(rx)}" ry="${f(rx * 0.22)}" fill="${shade(c1, -0.25)}"/><ellipse cx="${f(cx)}" cy="${f(seatY)}" rx="${f(rx)}" ry="${f(rx * 0.22)}" fill="${c1}"/><ellipse cx="${f(cx - rx * 0.2)}" cy="${f(seatY - rx * 0.03)}" rx="${f(rx * 0.5)}" ry="${f(rx * 0.08)}" fill="${shade(c1, 0.25)}" opacity="0.5"/>`;
      body += `<circle cx="${f(cx + rx * 0.5)}" cy="${f(seatY)}" r="${f(rx * 0.05)}" fill="${c3}"/>`;
    }
    return { defs: '', body };
  }

  function garment(c) {
    const { r, p, W, H, side } = c;
    let body = backdrop(c), defs = '';
    const base = p[1], alt = p[2], trim = p[3] || p[2];
    const kind = pick(r, ['stripes', 'check', 'dots', 'solid', 'stripes']);
    const pw = 12;
    if (kind === 'stripes') defs += `<pattern id="fab" width="${pw}" height="${pw}" patternUnits="userSpaceOnUse" patternTransform="rotate(${pick(r, [0, 90, 45])})"><rect width="${pw}" height="${pw}" fill="${base}"/><rect width="${pw * 0.35}" height="${pw}" fill="${alt}"/></pattern>`;
    if (kind === 'check') defs += `<pattern id="fab" width="${pw}" height="${pw}" patternUnits="userSpaceOnUse"><rect width="${pw}" height="${pw}" fill="${base}"/><rect width="${pw / 2}" height="${pw}" fill="${alt}" opacity="0.55"/><rect width="${pw}" height="${pw / 2}" fill="${alt}" opacity="0.55"/></pattern>`;
    if (kind === 'dots') defs += `<pattern id="fab" width="${pw}" height="${pw}" patternUnits="userSpaceOnUse"><rect width="${pw}" height="${pw}" fill="${base}"/><circle cx="${pw / 2}" cy="${pw / 2}" r="${pw * 0.18}" fill="${alt}"/></pattern>`;
    const fill = kind === 'solid' ? base : 'url(#fab)';
    const long = rr(r, 0, 1), hem = 96 + long * 14, sw = rr(r, 0, 1);
    const R = [[56, 6], [73 + sw * 3, 11], [79 + sw * 3, 16], [92 + sw * 4, 64], [84 + sw * 4, 68], [75, 34], [75 + long * 4, hem - 2], [50, hem]];
    const L = R.map(([x, y]) => [100 - x, y]).reverse().slice(1);
    const d = 'M44 6 Q50 12 56 6 ' + R.slice(1).map(([x, y]) => `L${f(x)} ${f(y)}`).join(' ') + ' ' + L.map(([x, y]) => `L${f(x)} ${f(y)}`).join(' ') + ' Z';
    const scale = (H * 0.68) / 120, gx = W / 2 - 50 * scale * (side ? 0.8 : 1), gy = H * 0.14;
    body += `<g transform="translate(${f(gx)} ${f(gy)}) scale(${f(scale * (side ? 0.8 : 1))} ${f(scale)})">`;
    body += `<path d="M26 11 L50 -2 L74 11" fill="none" stroke="#2b2b2b" stroke-width="1.2"/><path d="M50 -2 L50 -6 Q50 -10 54 -10 Q58 -10 58 -6" fill="none" stroke="#2b2b2b" stroke-width="1.2"/>`;
    body += `<path d="${d}" fill="#000" opacity="0.18" transform="translate(2.5 2.5)" filter="url(#sh)"/>`;
    body += `<path d="${d}" fill="${fill}" stroke="${shade(base, -0.35)}" stroke-width="0.4"/>`;
    body += `<path d="M44 6 L50 44 L37 17 Z" fill="${shade(base, -0.2)}"/><path d="M56 6 L50 44 L63 17 Z" fill="${shade(base, -0.28)}"/>`;
    body += `<path d="M50 44 L50 ${f(hem)}" stroke="${shade(base, -0.4)}" stroke-width="0.5"/>`;
    for (let i = 0; i < 3; i++) body += `<circle cx="52.5" cy="${54 + i * 11}" r="1.4" fill="${trim}"/>`;
    body += `<path d="M58 70 h10" stroke="${shade(base, -0.4)}" stroke-width="0.6"/><path d="M32 70 h10" stroke="${shade(base, -0.4)}" stroke-width="0.6"/>`;
    body += `<path d="${d}" fill="url(#fold)" opacity="0.5"/>`;
    body += '</g>';
    defs += `<linearGradient id="fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.25"/><stop offset="0.4" stop-color="#fff" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></linearGradient>`;
    return { defs, body };
  }

  function toy(c) {
    const { r, p, W, H, side } = c;
    const floor = H * 0.84, cx = W / 2, u = W * 0.1 * (side ? 0.88 : 1);
    const skin = p[1], suit = p[2], acc = p[3] || p[2];
    let body = backdrop(c);
    body += `<ellipse cx="${f(cx)}" cy="${f(floor - u * 0.1)}" rx="${f(u * 1.9)}" ry="${f(u * 0.34)}" fill="${shade(acc, -0.2)}"/><rect x="${f(cx - u * 1.9)}" y="${f(floor - u * 0.3)}" width="${f(u * 3.8)}" height="${f(u * 0.2)}" fill="${shade(acc, -0.35)}"/><ellipse cx="${f(cx)}" cy="${f(floor - u * 0.3)}" rx="${f(u * 1.9)}" ry="${f(u * 0.34)}" fill="${acc}"/>`;
    const fy = floor - u * 0.35;
    body += `<rect x="${f(cx - u * 0.75)}" y="${f(fy - u * 1.3)}" width="${f(u * 0.6)}" height="${f(u * 1.3)}" rx="${f(u * 0.25)}" fill="${shade(suit, -0.2)}"/><rect x="${f(cx + u * 0.15)}" y="${f(fy - u * 1.3)}" width="${f(u * 0.6)}" height="${f(u * 1.3)}" rx="${f(u * 0.25)}" fill="${shade(suit, -0.2)}"/>`;
    const by = fy - u * 3.1;
    body += `<rect x="${f(cx - u * 1.05)}" y="${f(by)}" width="${f(u * 2.1)}" height="${f(u * 2.2)}" rx="${f(u * 0.6)}" fill="${suit}"/>`;
    body += `<rect x="${f(cx - u * 1.55)}" y="${f(by + u * 0.2)}" width="${f(u * 0.55)}" height="${f(u * 1.6)}" rx="${f(u * 0.27)}" fill="${shade(suit, -0.1)}" transform="rotate(12 ${f(cx - u * 1.3)} ${f(by + u * 0.3)})"/><rect x="${f(cx + u * 1.0)}" y="${f(by + u * 0.2)}" width="${f(u * 0.55)}" height="${f(u * 1.6)}" rx="${f(u * 0.27)}" fill="${shade(suit, -0.1)}" transform="rotate(-12 ${f(cx + u * 1.3)} ${f(by + u * 0.3)})"/>`;
    const hw = u * rr(r, 2.6, 3.2), hh = u * rr(r, 2.2, 2.7), hy = by - hh + u * 0.2;
    const ears = pick(r, ['round', 'bunny', 'cat', 'none']);
    if (ears === 'round') body += `<circle cx="${f(cx - hw * 0.4)}" cy="${f(hy + u * 0.1)}" r="${f(u * 0.55)}" fill="${skin}"/><circle cx="${f(cx + hw * 0.4)}" cy="${f(hy + u * 0.1)}" r="${f(u * 0.55)}" fill="${skin}"/>`;
    if (ears === 'bunny') body += `<ellipse cx="${f(cx - hw * 0.22)}" cy="${f(hy - u * 0.9)}" rx="${f(u * 0.32)}" ry="${f(u * 1.2)}" fill="${skin}"/><ellipse cx="${f(cx + hw * 0.22)}" cy="${f(hy - u * 0.9)}" rx="${f(u * 0.32)}" ry="${f(u * 1.2)}" fill="${skin}"/>`;
    if (ears === 'cat') body += `<path d="M${f(cx - hw * 0.45)} ${f(hy + u * 0.4)} L${f(cx - hw * 0.36)} ${f(hy - u * 0.7)} L${f(cx - hw * 0.1)} ${f(hy + u * 0.1)} Z M${f(cx + hw * 0.45)} ${f(hy + u * 0.4)} L${f(cx + hw * 0.36)} ${f(hy - u * 0.7)} L${f(cx + hw * 0.1)} ${f(hy + u * 0.1)} Z" fill="${skin}"/>`;
    body += `<rect x="${f(cx - hw / 2)}" y="${f(hy)}" width="${f(hw)}" height="${f(hh)}" rx="${f(u * 0.9)}" fill="${skin}"/>`;
    body += `<ellipse cx="${f(cx - hw * 0.2)}" cy="${f(hy + hh * 0.22)}" rx="${f(hw * 0.22)}" ry="${f(hh * 0.1)}" fill="#fff" opacity="0.22"/>`;
    const ey = hy + hh * 0.52, ex = hw * 0.2;
    if (r() < 0.5) body += `<circle cx="${f(cx - ex)}" cy="${f(ey)}" r="${f(u * 0.2)}" fill="#141414"/><circle cx="${f(cx + ex)}" cy="${f(ey)}" r="${f(u * 0.2)}" fill="#141414"/><circle cx="${f(cx - ex + u * 0.06)}" cy="${f(ey - u * 0.06)}" r="${f(u * 0.06)}" fill="#fff"/><circle cx="${f(cx + ex + u * 0.06)}" cy="${f(ey - u * 0.06)}" r="${f(u * 0.06)}" fill="#fff"/>`;
    else { const k = u * 0.17; body += `<path d="M${f(cx - ex - k)} ${f(ey - k)} l${f(2 * k)} ${f(2 * k)} M${f(cx - ex + k)} ${f(ey - k)} l${f(-2 * k)} ${f(2 * k)} M${f(cx + ex - k)} ${f(ey - k)} l${f(2 * k)} ${f(2 * k)} M${f(cx + ex + k)} ${f(ey - k)} l${f(-2 * k)} ${f(2 * k)}" stroke="#141414" stroke-width="${f(u * 0.09)}" stroke-linecap="round"/>`; }
    body += `<path d="M${f(cx - u * 0.35)} ${f(ey + u * 0.5)} q${f(u * 0.35)} ${f(u * 0.25)} ${f(u * 0.7)} 0" fill="none" stroke="#141414" stroke-width="${f(u * 0.07)}" stroke-linecap="round"/>`;
    body += `<circle cx="${f(cx)}" cy="${f(by + u * 1.1)}" r="${f(u * 0.3)}" fill="${acc}"/>`;
    return { defs: '', body };
  }

  const GENS = { colorfield, geometric, blobs, waves, horizon, gestural, digital, vase, chair, garment, toy };
  const OBJECTS = new Set(['vase', 'chair', 'garment', 'toy']);

  const cache = new Map();

  // spec: { gen, palette, seed, w, h, side }
  function svg(spec) {
    const isObj = OBJECTS.has(spec.gen);
    const W = 1000, H = isObj ? 1250 : Math.round(1000 * (spec.h / spec.w));
    const seed = typeof spec.seed === 'number' ? spec.seed : hashStr(String(spec.seed));
    const r = mulberry32(seed);
    const p = spec.palette.slice(); p.backdrop = spec.backdrop;
    const out = GENS[spec.gen]({ r, p, W, H, seed, side: !!spec.side });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"><defs>${GRAIN}${out.defs}</defs>${out.body}${grainLayer(W, H, isObj ? 0.1 : 0.16)}</svg>`;
  }
  function src(spec) {
    const key = [spec.gen, spec.seed, spec.w, spec.h, spec.side ? 1 : 0, spec.palette.join('')].join('|');
    if (!cache.has(key)) cache.set(key, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(spec)));
    return cache.get(key);
  }
  function ratio(spec) { return OBJECTS.has(spec.gen) ? 4 / 5 : spec.w / spec.h; }

  window.Art = { src, svg, ratio, isObject: (g) => OBJECTS.has(g), shade, hashStr };
})();
