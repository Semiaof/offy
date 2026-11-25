'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — เขียนค้นหา (handwriting input)
   Draw a character; after every stroke the pad lists the closest characters. Works offline:
   data/hw.js (window.OFFY_HW, ~340 KB) = stroke templates of all 3,088 HSK characters + the parts the composer uses,
   from Make Me a Hanzi (Arphic Public License) via แปล HSK1 5ภาษา/tools/build_compose.py.
   Matching: both the drawing and each template are scaled into their own box (0–63), every stroke resampled to 5
   points; drawn strokes are paired with template strokes (order counts a little, so a wrong order still finds it).
   HandPad.open({ onPick(ch), keep }) — keep: stay open after a pick (typing a word in the library).
   ===================================================================== */
const HandPad = (() => {
  const SRC = 'data/hw.js?v=1';
  const B = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const P = 5;                                    // points per stroke
  let TPL = null, loading = null, el = null, cv = null, ctx = null, opts = {}, strokes = [], cur = null, lastFocus = null;

  Object.assign(window.OFFY_EN || {}, {
    'เขียนอักษร': 'Write a character', 'เขียนค้นหา': 'Handwriting', 'เขียนตัวจีนในช่อง': 'Write a Chinese character in the box',
    'ลบเส้นล่าสุด': 'Undo stroke', 'ล้าง': 'Clear', 'ปิด': 'Close', 'กำลังโหลดลายเส้น…': 'Loading strokes…',
    'ยังไม่เจอตัวที่ใกล้เคียง': 'No close match yet', 'ลายเส้น: Make Me a Hanzi (Arphic PL)': 'Strokes: Make Me a Hanzi (Arphic PL)'
  });

  /* ---------- templates ---------- */
  function load() {
    if (TPL) return Promise.resolve(TPL);
    return loading = loading || Fx.script(SRC).then(() => {
      const H = window.OFFY_HW; TPL = [];
      [...H.c].forEach((c, i) => {
        const s = H.s[i], n = s.length / (P * 2), a = new Float32Array(s.length);
        for (let k = 0; k < s.length; k++) a[k] = B.indexOf(s[k]);
        TPL.push({ c, n, a, hsk: i });
      });
      return TPL;
    });
  }

  /* ---------- geometry ---------- */
  function resample(pts) {
    if (pts.length < 2) { const p = pts[0] || [0, 0]; return Array.from({ length: P }, () => p); }
    const seg = []; let total = 0;
    for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(d); total += d; }
    if (!total) return Array.from({ length: P }, () => pts[0]);
    const out = []; let k = 0, acc = 0;
    for (let m = 0; m < P; m++) {
      const t0 = total * m / (P - 1);
      while (k < seg.length - 1 && acc + seg[k] < t0) { acc += seg[k]; k++; }
      const t = seg[k] ? Math.min(1, Math.max(0, (t0 - acc) / seg[k])) : 0, a = pts[k], b = pts[k + 1];
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    return out;
  }
  function normalize(list) {
    const all = list.flat();
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
    const sc = 63 / Math.max(w, h, 1), ox = (63 - w * sc) / 2, oy = (63 - h * sc) / 2;
    return list.map(s => resample(s).map(([x, y]) => [(x - x0) * sc + ox, (y - y0) * sc + oy]));
  }

  /* ---------- matching ---------- */
  function recognize(list, max = 12) {
    if (!TPL || !list.length) return [];
    const D = normalize(list), m = D.length, tol = Math.max(2, Math.round(m * .3));
    const res = [];
    for (const t of TPL) {
      const n = t.n; if (Math.abs(n - m) > tol) continue;
      const used = new Uint8Array(n); let total = 0, got = 0;
      for (let i = 0; i < m; i++) {
        const want = m > 1 ? i * (n - 1) / (m - 1) : 0; let best = 1e9, bj = -1;
        for (let j = 0; j < n; j++) {
          if (used[j]) continue;
          const o = j * P * 2; let d = 0, r = 0;
          for (let k = 0; k < P; k++) {
            const dx = D[i][k][0] - t.a[o + k * 2], dy = D[i][k][1] - t.a[o + k * 2 + 1];
            d += Math.sqrt(dx * dx + dy * dy);
            const rx = D[i][P - 1 - k][0] - t.a[o + k * 2], ry = D[i][P - 1 - k][1] - t.a[o + k * 2 + 1];
            r += Math.sqrt(rx * rx + ry * ry);
          }
          const c = Math.min(d, r + 12) / P + 2.2 * Math.abs(j - want);   // drawn backwards: allowed, but costs
          if (c < best) { best = c; bj = j; }
        }
        if (bj >= 0) { used[bj] = 1; total += best; got++; } else total += 22;
      }
      total += (n - got) * 22;
      res.push([total / Math.max(m, n) + (t.hsk > 3087 ? .8 : 0), t.c]);
    }
    res.sort((a, b) => a[0] - b[0]);
    return res.slice(0, max).map(r => r[1]);
  }

  /* ---------- pad ---------- */
  function build() {
    el = document.createElement('div');
    el.className = 'hp'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', T_('เขียนอักษร'));
    el.innerHTML = `<div class="hp-card">
      <div class="hp-h"><b>${ic('pen')}${T_('เขียนอักษร')}</b><button class="hp-x" data-hp="close" aria-label="${T_('ปิด')}">${ic('x')}</button></div>
      <div class="hp-cands" lang="zh-Hans" aria-live="polite"></div>
      <div class="hp-pad"><canvas></canvas><p class="hp-hint">${T_('เขียนตัวจีนในช่อง')}</p></div>
      <div class="hp-f"><button data-hp="undo">${ic('undo')}${T_('ลบเส้นล่าสุด')}</button><button data-hp="clear">${ic('trash')}${T_('ล้าง')}</button><small>${T_('ลายเส้น: Make Me a Hanzi (Arphic PL)')}</small></div>
    </div>`;
    document.body.appendChild(el);
    cv = el.querySelector('canvas'); ctx = cv.getContext('2d');
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-hp],[data-pick]'); if (!b) return;
      if (b.dataset.pick) { pick(b.dataset.pick); return; }
      const a = b.dataset.hp;
      if (a === 'close') close();
      if (a === 'undo') { strokes.pop(); redraw(); update(); }
      if (a === 'clear') { strokes = []; redraw(); update(); }
    });
    cv.addEventListener('pointerdown', e => {
      e.preventDefault(); cv.setPointerCapture(e.pointerId);
      cur = [pt(e)]; strokes.push(cur); el.classList.add('drawing'); redraw();
    });
    cv.addEventListener('pointermove', e => {
      if (!cur) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      evs.forEach(ev => cur.push(pt(ev)));
      redraw();
    });
    const end = () => { if (!cur) return; cur = null; update(); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    addEventListener('keydown', e => { if (!el.hidden && e.key === 'Escape') close(); if (!el.hidden && (e.ctrlKey || e.metaKey) && e.key === 'z') { strokes.pop(); redraw(); update(); } });
    addEventListener('resize', () => { if (!el.hidden) size(); });
    addEventListener('hashchange', () => { if (!el.hidden) close(); });
  }
  const T_ = s => T(s);
  function pt(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function size() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(3, devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); redraw();
  }
  function redraw() {
    const w = cv.clientWidth, h = cv.clientHeight, cs = getComputedStyle(cv);
    const dark = document.documentElement.dataset.theme === 'dark';
    ctx.clearRect(0, 0, w, h);
    // 米字格 practice grid
    ctx.save(); ctx.strokeStyle = cs.getPropertyValue('--hp-grid').trim() || (dark ? 'rgba(255,255,255,.16)' : '#ccc'); ctx.lineWidth = 1; ctx.setLineDash([5, 6]);
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke(); ctx.restore();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(5, w / 42);
    const ink = cs.getPropertyValue('--hp-ink').trim() || (dark ? '#f0f3f7' : '#1b1d1a');
    const last = cs.getPropertyValue('--hp-last').trim() || ink;
    strokes.forEach((s, i) => {
      ctx.strokeStyle = i === strokes.length - 1 ? last : ink;
      ctx.beginPath(); ctx.moveTo(s[0][0], s[0][1]);
      if (s.length === 1) ctx.lineTo(s[0][0] + .1, s[0][1] + .1);
      for (let k = 1; k < s.length; k++) { const a = s[k - 1], b = s[k]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
      ctx.stroke();
    });
    el.classList.toggle('empty', !strokes.length);
  }
  function update() {
    const box = el.querySelector('.hp-cands');
    if (!strokes.length) { box.innerHTML = ''; return; }
    if (!TPL) { box.innerHTML = `<span class="hp-wait">${T_('กำลังโหลดลายเส้น…')}</span>`; load().then(update); return; }
    const r = recognize(strokes);
    box.innerHTML = r.length ? r.map((c, i) => `<button data-pick="${c}" style="--i:${i}">${c}</button>`).join('') : `<span class="hp-wait">${T_('ยังไม่เจอตัวที่ใกล้เคียง')}</span>`;
  }
  function pick(c) {
    try { sfx('tap'); } catch (e) { }
    if (opts.onPick) opts.onPick(c);
    if (opts.keep) { strokes = []; redraw(); update(); } else close();
  }
  function open(o = {}) {
    if (!el) build();
    opts = o; strokes = []; lastFocus = document.activeElement;
    el.hidden = false; requestAnimationFrame(() => { el.classList.add('on'); size(); update(); });
    load().catch(() => { });
  }
  function close() {
    if (!el || el.hidden) return;
    el.classList.remove('on'); setTimeout(() => { el.hidden = true; }, 220);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { }
  }
  /* a pen button for any search box: <button data-handpad="#qInput" data-hp-mode="append|replace"> */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-handpad]'); if (!b) return;
    e.preventDefault();
    const inp = document.querySelector(b.dataset.handpad), append = b.dataset.hpMode === 'append';
    open({
      keep: append,
      onPick: c => {
        if (!inp) return;
        inp.value = append ? inp.value + c : c;
        inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
  return { open, close, recognize, load };
})();
