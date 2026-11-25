'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — เขียนค้นหา (handwriting input + Apple Pencil)
   · Pressure + tilt calligraphy brush for Apple Pencil; speed-tapered ink for finger/mouse
   · Auto palm rejection when Apple Pencil is detected (1-tap toggle back to finger anytime)
   · Full modal pad: HandPad.open({ onPick(ch), keep })
   · Floating Quick-Write dock (iPad / Apple Pencil): HandPad.toggleDock({ onPick(ch) })
   Works offline via data/hw.js (3,088 HSK chars + radical parts, Make Me a Hanzi Arphic PL).
   ===================================================================== */
const HandPad = (() => {
  const SRC = 'data/hw.js?v=1';
  const B = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const P = 5;                                    // points per stroke
  let TPL = null, loading = null;
  let penOnly = false;                            // auto-enabled on first Apple Pencil stroke

  // Modal pad state
  let el = null, cv = null, ctx = null, opts = {}, strokes = [], cur = null, curPid = null, lastFocus = null;
  // Floating Quick-Write dock state
  let dockEl = null, dCv = null, dCtx = null, dockOpts = {}, dStrokes = [], dCur = null, dPid = null, dockSide = 'right';

  Object.assign(window.OFFY_EN || {}, {
    'เขียนอักษร': 'Write a character', 'เขียนค้นหา': 'Handwriting', 'เขียนตัวจีนในช่อง': 'Write a Chinese character in the box',
    'ลบเส้นล่าสุด': 'Undo stroke', 'ล้าง': 'Clear', 'ปิด': 'Close', 'กำลังโหลดลายเส้น…': 'Loading strokes…',
    'ยังไม่เจอตัวที่ใกล้เคียง': 'No close match yet', 'ลายเส้น: Make Me a Hanzi (Arphic PL)': 'Strokes: Make Me a Hanzi (Arphic PL)',
    'เขียนเร็ว': 'Quick-Write', 'กันสันมือ': 'Palm lock', 'นิ้ว+ปากกา': 'Touch + Pen', 'ย้ายซ้าย/ขวา': 'Swap left/right'
  });
  const T_ = s => T(s);

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

  /* ---------- geometry & recognition (uses x, y from [x, y, w, t]) ---------- */
  function resample(pts) {
    if (pts.length < 2) { const p = pts[0] || [0, 0]; return Array.from({ length: P }, () => [p[0], p[1]]); }
    const seg = []; let total = 0;
    for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(d); total += d; }
    if (!total) return Array.from({ length: P }, () => [pts[0][0], pts[0][1]]);
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
          const c = Math.min(d, r + 12) / P + 2.2 * Math.abs(j - want);
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

  /* ---------- Apple Pencil calligraphy brush engine (pressure + tilt + velocity) ---------- */
  function brushPt(canvas, e, prev) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const base = Math.max(4.4, r.width / 38);
    const t = e.timeStamp || performance.now();
    let w;
    if (e.pointerType === 'pen' && e.pressure > 0) {
      const tilt = 1 + Math.min(0.32, (Math.abs(e.tiltX || 0) + Math.abs(e.tiltY || 0)) / 220);
      w = base * (0.34 + e.pressure * 1.48) * tilt;
    } else if (!prev) {
      w = base * 1.04;
    } else {
      const v = Math.hypot(x - prev[0], y - prev[1]) / Math.max(1, t - prev[3]) / Math.max(0.7, r.width / 220);
      w = base * Math.max(0.48, Math.min(1.42, 1.42 - v * 0.68));
    }
    if (prev) w = prev[2] * 0.64 + w * 0.36;
    return [x, y, w, t];
  }

  function sizeCanvas(canvas, context, redrawFn) {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(3, devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    redrawFn();
  }

  function drawBrushStrokes(canvas, context, list, rootEl) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const cs = getComputedStyle(canvas);
    const dark = document.documentElement.dataset.theme === 'dark';
    context.clearRect(0, 0, w, h);

    // 米字格 practice guide
    context.save();
    context.strokeStyle = cs.getPropertyValue('--hp-grid').trim() || (dark ? 'rgba(255,255,255,.16)' : '#ccc');
    context.lineWidth = 1; context.setLineDash([5, 6]);
    context.beginPath();
    context.moveTo(w / 2, 0); context.lineTo(w / 2, h);
    context.moveTo(0, h / 2); context.lineTo(w, h / 2);
    context.moveTo(0, 0); context.lineTo(w, h);
    context.moveTo(w, 0); context.lineTo(0, h);
    context.stroke();
    context.restore();

    const ink = cs.getPropertyValue('--hp-ink').trim() || (dark ? '#f0f3f7' : '#1b1d1a');
    const last = cs.getPropertyValue('--hp-last').trim() || ink;
    context.lineCap = 'round'; context.lineJoin = 'round';

    list.forEach((s, si) => {
      if (!s.length) return;
      const col = si === list.length - 1 ? last : ink;
      context.strokeStyle = col; context.fillStyle = col;
      if (s.length === 1) {
        context.beginPath(); context.arc(s[0][0], s[0][1], (s[0][2] || 5) / 2, 0, Math.PI * 2); context.fill();
        return;
      }
      // Initial cap
      context.beginPath(); context.arc(s[0][0], s[0][1], (s[0][2] || 5) / 2, 0, Math.PI * 2); context.fill();
      // Variable-width smoothed quadratic calligraphy segments
      for (let k = 1; k < s.length; k++) {
        const a = s[k - 1], b = s[k];
        const prevM = k === 1 ? a : [(s[k - 2][0] + a[0]) / 2, (s[k - 2][1] + a[1]) / 2];
        const nextM = k === s.length - 1 ? b : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        context.lineWidth = Math.max(1.8, (a[2] + b[2]) / 2);
        context.beginPath();
        context.moveTo(prevM[0], prevM[1]);
        context.quadraticCurveTo(a[0], a[1], nextM[0], nextM[1]);
        context.stroke();
      }
    });
    if (rootEl) rootEl.classList.toggle('empty', !list.length);
  }

  function syncPalmUI() {
    document.querySelectorAll('.hp-palm').forEach(btn => {
      btn.classList.toggle('on', penOnly);
      btn.setAttribute('aria-pressed', penOnly ? 'true' : 'false');
      const sp = btn.querySelector('span');
      if (sp) sp.textContent = penOnly ? `Pencil · ${T_('กันสันมือ')}` : T_('นิ้ว+ปากกา');
    });
  }
  function setPenOnly(v) {
    penOnly = !!v;
    syncPalmUI();
  }

  /* ---------- Modal HandPad ---------- */
  function build() {
    el = document.createElement('div');
    el.className = 'hp'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', T_('เขียนอักษร'));
    el.innerHTML = `<div class="hp-card">
      <div class="hp-h">
        <b>${ic('pen')}${T_('เขียนอักษร')}</b>
        <div class="hp-ha">
          <button type="button" class="hp-palm" data-hp="palm" aria-pressed="false">${ic('brush')}<span>${T_('นิ้ว+ปากกา')}</span></button>
          <button type="button" class="hp-x" data-hp="close" aria-label="${T_('ปิด')}">${ic('x')}</button>
        </div>
      </div>
      <div class="hp-cands" lang="zh-Hans" aria-live="polite"></div>
      <div class="hp-pad"><canvas></canvas><p class="hp-hint">${T_('เขียนตัวจีนในช่อง')}</p></div>
      <div class="hp-f"><button type="button" data-hp="undo">${ic('undo')}${T_('ลบเส้นล่าสุด')}</button><button type="button" data-hp="clear">${ic('trash')}${T_('ล้าง')}</button><small>${T_('ลายเส้น: Make Me a Hanzi (Arphic PL)')}</small></div>
    </div>`;
    document.body.appendChild(el);
    cv = el.querySelector('canvas'); ctx = cv.getContext('2d');
    el.addEventListener('click', e => {
      if (e.target === el) { close(); return; }
      const b = e.target.closest('[data-hp],[data-pick]'); if (!b) return;
      if (b.dataset.pick) { pick(b.dataset.pick); return; }
      const a = b.dataset.hp;
      if (a === 'close') close();
      if (a === 'palm') setPenOnly(!penOnly);
      if (a === 'undo') { strokes.pop(); redraw(); update(); }
      if (a === 'clear') { strokes = []; redraw(); update(); }
    });
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'pen' && !penOnly) setPenOnly(true);
      if (penOnly && e.pointerType === 'touch') return; // Apple Pencil palm rejection
      if (cur) return;
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      curPid = e.pointerId;
      cur = [brushPt(cv, e, null)]; strokes.push(cur); el.classList.add('drawing'); redraw();
    });
    cv.addEventListener('pointermove', e => {
      if (!cur || e.pointerId !== curPid) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (evs.length ? evs : [e]).forEach(ev => {
        const prev = cur[cur.length - 1], p = brushPt(cv, ev, prev);
        if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) >= 0.9) cur.push(p);
      });
      redraw();
    });
    const end = e => { if (!cur || (e && e.pointerId !== curPid)) return; cur = null; curPid = null; update(); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    addEventListener('keydown', e => {
      if (!el.hidden && e.key === 'Escape') close();
      if (!el.hidden && (e.ctrlKey || e.metaKey) && e.key === 'z') { strokes.pop(); redraw(); update(); }
    });
    addEventListener('resize', () => {
      if (el && !el.hidden) size();
      if (dockEl && !dockEl.hidden) sizeDock();
    });
    addEventListener('hashchange', () => {
      if (el && !el.hidden) close();
      if (dockEl && !dockEl.hidden && !location.hash.startsWith('#/hanzi')) closeDock();
    });
    syncPalmUI();
  }
  function size() { sizeCanvas(cv, ctx, redraw); }
  function redraw() { drawBrushStrokes(cv, ctx, strokes, el); }
  function update() {
    const box = el.querySelector('.hp-cands');
    if (!strokes.length) { box.innerHTML = ''; return; }
    if (!TPL) { box.innerHTML = `<span class="hp-wait">${T_('กำลังโหลดลายเส้น…')}</span>`; load().then(update); return; }
    const r = recognize(strokes);
    box.innerHTML = r.length ? r.map((c, i) => `<button type="button" data-pick="${c}" style="--i:${i}">${c}</button>`).join('') : `<span class="hp-wait">${T_('ยังไม่เจอตัวที่ใกล้เคียง')}</span>`;
  }
  function pick(c) {
    try { sfx('tap'); } catch (e) { }
    if (opts.onPick) opts.onPick(c);
    if (opts.keep) { strokes = []; redraw(); update(); } else close();
  }
  function open(o = {}) {
    if (!el) build();
    closeDock();
    opts = o; strokes = []; lastFocus = document.activeElement;
    el.hidden = false; syncPalmUI();
    requestAnimationFrame(() => { el.classList.add('on'); size(); update(); });
    load().catch(() => { });
  }
  function close() {
    if (!el || el.hidden) return;
    el.classList.remove('on'); setTimeout(() => { el.hidden = true; }, 220);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { }
  }

  /* ---------- Floating Quick-Write Scratchpad (non-modal corner dock for iPad / Apple Pencil) ---------- */
  function buildDock() {
    dockEl = document.createElement('aside');
    dockEl.className = 'hp-dock empty'; dockEl.hidden = true;
    dockEl.setAttribute('aria-label', T_('เขียนเร็ว'));
    dockEl.innerHTML = `
      <div class="hp-dh">
        <span class="hp-dt">${ic('pen')}<b>${T_('เขียนเร็ว')}</b></span>
        <div class="hp-da">
          <button type="button" class="hp-palm sm" data-dk="palm" aria-pressed="false" title="${T_('กันสันมือ')}">${ic('brush')}<span>${T_('นิ้ว+ปากกา')}</span></button>
          <button type="button" class="hp-db" data-dk="swap" aria-label="${T_('ย้ายซ้าย/ขวา')}" title="${T_('ย้ายซ้าย/ขวา')}">${ic('arrow-r')}</button>
          <button type="button" class="hp-db" data-dk="close" aria-label="${T_('ปิด')}">${ic('x')}</button>
        </div>
      </div>
      <div class="hp-dcands" lang="zh-Hans" aria-live="polite"></div>
      <div class="hp-dpad"><canvas></canvas><p class="hp-dhint">${T_('เขียนตัวจีนในช่อง')}</p></div>
      <div class="hp-df">
        <button type="button" data-dk="undo" aria-label="${T_('ลบเส้นล่าสุด')}">${ic('undo')}<span>${T_('ลบเส้นล่าสุด')}</span></button>
        <button type="button" data-dk="clear" aria-label="${T_('ล้าง')}">${ic('trash')}<span>${T_('ล้าง')}</span></button>
      </div>`;
    document.body.appendChild(dockEl);
    dCv = dockEl.querySelector('canvas'); dCtx = dCv.getContext('2d');

    // Drag header to reposition anywhere on screen
    let dragD = null;
    const hdr = dockEl.querySelector('.hp-dh');
    hdr.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      e.preventDefault(); try { hdr.setPointerCapture(e.pointerId); } catch (err) {}
      const r = dockEl.getBoundingClientRect();
      dragD = { pid: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top, w: r.width, h: r.height };
      dockEl.classList.add('dragged');
    });
    hdr.addEventListener('pointermove', e => {
      if (!dragD || e.pointerId !== dragD.pid) return;
      const nx = Math.max(8, Math.min(innerWidth - dragD.w - 8, e.clientX - dragD.ox));
      const ny = Math.max(8, Math.min(innerHeight - dragD.h - 8, e.clientY - dragD.oy));
      dockEl.style.left = nx + 'px'; dockEl.style.top = ny + 'px';
      dockEl.style.right = 'auto'; dockEl.style.bottom = 'auto';
    });
    const endDrag = e => { if (dragD && e.pointerId === dragD.pid) dragD = null; };
    hdr.addEventListener('pointerup', endDrag); hdr.addEventListener('pointercancel', endDrag);

    dockEl.addEventListener('click', e => {
      const b = e.target.closest('[data-dk],[data-dpick]'); if (!b) return;
      if (b.dataset.dpick) {
        const ch = b.dataset.dpick;
        try { sfx('tap'); } catch (err) {}
        if (dockOpts.onPick) dockOpts.onPick(ch);
        dStrokes = []; redrawDock(); updateDock();
        return;
      }
      const a = b.dataset.dk;
      if (a === 'close') closeDock();
      if (a === 'palm') setPenOnly(!penOnly);
      if (a === 'swap') {
        dockSide = dockSide === 'right' ? 'left' : 'right';
        dockEl.classList.remove('dragged');
        dockEl.style.left = ''; dockEl.style.top = ''; dockEl.style.right = ''; dockEl.style.bottom = '';
        dockEl.classList.toggle('left', dockSide === 'left');
      }
      if (a === 'undo') { dStrokes.pop(); redrawDock(); updateDock(); }
      if (a === 'clear') { dStrokes = []; redrawDock(); updateDock(); }
    });

    dCv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'pen' && !penOnly) setPenOnly(true);
      if (penOnly && e.pointerType === 'touch') return; // Apple Pencil palm rejection
      if (dCur) return;
      e.preventDefault(); try { dCv.setPointerCapture(e.pointerId); } catch (err) {}
      dPid = e.pointerId;
      dCur = [brushPt(dCv, e, null)]; dStrokes.push(dCur); redrawDock();
    });
    dCv.addEventListener('pointermove', e => {
      if (!dCur || e.pointerId !== dPid) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (evs.length ? evs : [e]).forEach(ev => {
        const prev = dCur[dCur.length - 1], p = brushPt(dCv, ev, prev);
        if (Math.hypot(p[0] - prev[0], p[1] - prev[1]) >= 0.9) dCur.push(p);
      });
      redrawDock();
    });
    const endD = e => { if (!dCur || (e && e.pointerId !== dPid)) return; dCur = null; dPid = null; updateDock(); };
    dCv.addEventListener('pointerup', endD); dCv.addEventListener('pointercancel', endD);
    syncPalmUI();
  }
  function sizeDock() { sizeCanvas(dCv, dCtx, redrawDock); }
  function redrawDock() { drawBrushStrokes(dCv, dCtx, dStrokes, dockEl); }
  function updateDock() {
    const box = dockEl.querySelector('.hp-dcands');
    if (!dStrokes.length) { box.innerHTML = `<span class="hp-wait">${T_('เขียนตัวจีนในช่อง')}</span>`; return; }
    if (!TPL) { box.innerHTML = `<span class="hp-wait">${T_('กำลังโหลดลายเส้น…')}</span>`; load().then(updateDock); return; }
    const r = recognize(dStrokes, 7);
    box.innerHTML = r.length
      ? r.map((c, i) => `<button type="button" data-dpick="${c}" style="--i:${i}">${c}</button>`).join('')
      : `<span class="hp-wait">${T_('ยังไม่เจอตัวที่ใกล้เคียง')}</span>`;
  }
  function openDock(o = {}) {
    if (!dockEl) buildDock();
    close();
    dockOpts = o; dStrokes = [];
    dockEl.hidden = false; syncPalmUI();
    document.querySelectorAll('[data-qpad]').forEach(b => b.classList.add('on'));
    requestAnimationFrame(() => { dockEl.classList.add('on'); sizeDock(); updateDock(); });
    load().catch(() => {});
  }
  function closeDock() {
    if (!dockEl || dockEl.hidden) return;
    dockEl.classList.remove('on');
    document.querySelectorAll('[data-qpad]').forEach(b => b.classList.remove('on'));
    setTimeout(() => { if (dockEl && !dockEl.classList.contains('on')) dockEl.hidden = true; }, 200);
  }
  function toggleDock(o = {}) {
    if (dockEl && !dockEl.hidden && dockEl.classList.contains('on')) closeDock();
    else openDock(o);
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

  return { open, close, openDock, closeDock, toggleDock, recognize, load, setPenOnly };
})();
