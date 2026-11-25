'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — Apple Pencil Book Highlighter & Notes (js/ink.js)
   · Attaches cleanly to #v-book article.card.reader across ALL books (Pinyin, Grammar, Synonym, Ref, Course, Interactive)
   · Auto Pen-vs-Finger split: Apple Pencil writes/highlights directly; finger scrolls & taps buttons natively!
   · Pressure + tilt fine pen, translucent highlighter, whole-stroke eraser, Undo, Hide/Show, per-page localStorage persistence
   · Auto-adapts ink color in dark mode so handwritten notes always remain crisp
   ===================================================================== */
const BookInk = (() => {
  const STORE_KEY = 'limu_ink_v1';
  const HL_COLORS = [
    { id: 'amber', hex: '#eab308' },
    { id: 'sage',  hex: '#34b37a' },
    { id: 'rose',  hex: '#e56b6f' },
    { id: 'sky',   hex: '#4d96e8' }
  ];
  const PEN_COLORS = [
    { id: 'ink',       hex: 'auto' },
    { id: 'vermilion', hex: '#c84b31' },
    { id: 'cobalt',    hex: '#2e6aa8' }
  ];

  Object.assign(window.OFFY_EN || {}, {
    'ไฮไลต์และจดโน้ต': 'Highlight & notes', 'ไฮไลต์': 'Highlight', 'ปากกา': 'Pen', 'ยางลบ': 'Eraser',
    'ซ่อนโน้ต': 'Hide notes', 'แสดงโน้ต': 'Show notes', 'นิ้วเขียน': 'Finger draw',
    'ปากกา = เขียน · นิ้ว = เลื่อนหน้า': 'Pencil = write · Finger = scroll',
    'ล้างโน้ตหน้านี้แล้ว': 'Cleared notes on this page', 'ล้างหน้านี้': 'Clear page'
  });
  const T_ = s => (typeof T === 'function' ? T(s) : s);

  let data = {};
  let active = false;       // toolbar open
  let tool = 'hl';          // 'hl' | 'pen' | 'erase'
  let hlColor = 'amber';
  let penColor = 'ink';
  let hiddenInk = false;
  let fingerDraw = false;   // false = Pen draws, Finger scrolls natively! true = Finger also draws
  let pageKey = '';
  let curStroke = null, curPid = null, erasing = false;

  let viewEl = null, readerEl = null, cv = null, ctx = null, barEl = null, toggleBtn = null;
  let ro = null, mo = null, themeMo = null, resizeTimer = 0;

  /* ---------- persistence ---------- */
  function loadStore() {
    try { data = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; }
    catch (e) { data = {}; }
  }
  function saveStore() {
    try {
      // Prune empty pages before saving
      Object.keys(data).forEach(k => { if (!Array.isArray(data[k]) || !data[k].length) delete data[k]; });
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {
      // If quota exceeded, trim oldest page entries
      const keys = Object.keys(data);
      if (keys.length > 10) {
        keys.slice(0, Math.ceil(keys.length / 4)).forEach(k => delete data[k]);
        try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (err) {}
      }
    }
  }
  function strokesOf(k) { return (data[k] && Array.isArray(data[k])) ? data[k] : []; }
  function computePageKey() {
    const bid = (typeof Book !== 'undefined' && Book.id) ? Book.id : 'book';
    const bi = (typeof Book !== 'undefined' && typeof Book.i === 'number') ? Book.i : 0;
    const vol = ($('#bkVol') && $('#bkVol').textContent || '').trim().slice(0, 52);
    return `${bid}|${bi}|${vol}`;
  }

  /* ---------- canvas sizing & rendering ---------- */
  function resolveColor(t, cid) {
    if (t === 'hl') return (HL_COLORS.find(c => c.id === cid) || HL_COLORS[0]).hex;
    if (cid === 'ink') return document.documentElement.dataset.theme === 'dark' ? '#f0f3f7' : '#1c201d';
    return (PEN_COLORS.find(c => c.id === cid) || PEN_COLORS[0]).hex;
  }

  function syncSize() {
    if (!readerEl || !cv || !ctx) return;
    const w = readerEl.clientWidth, h = readerEl.scrollHeight || readerEl.clientHeight;
    if (!w || !h) return;
    // Cap DPR slightly on ultra-tall pages to stay within mobile WebKit canvas memory limits
    const maxPx = 12000000;
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    while (w * dpr * h * dpr > maxPx && dpr > 1) dpr = Math.max(1, dpr - 0.25);
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (cv.width !== pw || cv.height !== ph) {
      cv.width = pw; cv.height = ph;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function drawOne(s, w) {
    if (!s || !s.p || !s.p.length) return;
    const col = resolveColor(s.t, s.c);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    if (s.t === 'hl') {
      const dark = document.documentElement.dataset.theme === 'dark';
      ctx.globalAlpha = dark ? 0.30 : 0.34;
      ctx.globalCompositeOperation = dark ? 'screen' : 'multiply';
      ctx.lineWidth = Math.max(12, (s.w || 0.028) * w);
      ctx.beginPath();
      ctx.moveTo(s.p[0][0] * w, s.p[0][1] * w);
      if (s.p.length === 1) ctx.lineTo(s.p[0][0] * w + 0.5, s.p[0][1] * w);
      for (let i = 1; i < s.p.length; i++) {
        const a = s.p[i - 1], b = s.p[i];
        ctx.quadraticCurveTo(a[0] * w, a[1] * w, ((a[0] + b[0]) / 2) * w, ((a[1] + b[1]) / 2) * w);
      }
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.94;
      const pts = s.p;
      if (pts.length === 1) {
        const r = Math.max(1, (pts[0][2] || 0.0038) * w * 0.5);
        ctx.beginPath(); ctx.arc(pts[0][0] * w, pts[0][1] * w, r, 0, Math.PI * 2); ctx.fill();
      } else {
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i];
          const prevM = i === 1 ? [a[0] * w, a[1] * w] : [((pts[i - 2][0] + a[0]) / 2) * w, ((pts[i - 2][1] + a[1]) / 2) * w];
          const nextM = i === pts.length - 1 ? [b[0] * w, b[1] * w] : [((a[0] + b[0]) / 2) * w, ((a[1] + b[1]) / 2) * w];
          ctx.lineWidth = Math.max(1.2, (((a[2] || 0.0038) + (b[2] || 0.0038)) * 0.5) * w);
          ctx.beginPath();
          ctx.moveTo(prevM[0], prevM[1]);
          ctx.quadraticCurveTo(a[0] * w, a[1] * w, nextM[0], nextM[1]);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function redraw() {
    if (!cv || !ctx || !readerEl) return;
    const w = readerEl.clientWidth || 1, h = readerEl.scrollHeight || readerEl.clientHeight || 1;
    ctx.clearRect(0, 0, w, h);
    if (hiddenInk) return;
    const list = strokesOf(pageKey);
    // Draw highlights first, then crisp pen strokes on top
    for (const s of list) if (s.t === 'hl') drawOne(s, w);
    for (const s of list) if (s.t !== 'hl') drawOne(s, w);
    if (curStroke) drawOne(curStroke, w);
    syncBadge();
  }

  function syncBadge() {
    if (!toggleBtn) return;
    const has = strokesOf(pageKey).length > 0;
    toggleBtn.classList.toggle('has-ink', has);
    toggleBtn.classList.toggle('on', active);
  }

  /* ---------- stroke eraser hit-test ---------- */
  function eraseAt(nx, ny, w) {
    const list = strokesOf(pageKey);
    if (!list.length) return false;
    const tol = 16 / Math.max(280, w);
    let hit = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      const pts = list[i].p || [];
      const pad = list[i].t === 'hl' ? tol * 1.45 : tol;
      for (let k = 0; k < pts.length; k++) {
        if (Math.hypot(pts[k][0] - nx, pts[k][1] - ny) <= pad) { hit = i; break; }
      }
      if (hit >= 0) break;
    }
    if (hit >= 0) {
      list.splice(hit, 1);
      saveStore();
      redraw();
      try { sfx('tap'); } catch (e) {}
      return true;
    }
    return false;
  }

  /* ---------- pointer coordinate & pressure helpers ---------- */
  function normPt(e, prev) {
    const r = readerEl.getBoundingClientRect();
    const w = Math.max(200, r.width);
    const x = (e.clientX - r.left) / w;
    const y = (e.clientY - r.top) / w;
    let sw;
    if (tool === 'hl') {
      sw = Math.max(0.022, Math.min(0.042, 18 / w));
    } else {
      const basePx = 2.6;
      if (e.pointerType === 'pen' && e.pressure > 0) {
        const tilt = 1 + Math.min(0.28, (Math.abs(e.tiltX || 0) + Math.abs(e.tiltY || 0)) / 240);
        sw = (basePx * (0.45 + e.pressure * 1.35) * tilt) / w;
      } else {
        sw = basePx / w;
      }
      if (prev) sw = prev[2] * 0.6 + sw * 0.4;
    }
    return [+(x.toFixed(4)), +(y.toFixed(4)), +(sw.toFixed(5))];
  }

  /* ---------- floating toolbar UI ---------- */
  function renderBar() {
    if (!barEl) return;
    const colors = tool === 'hl' ? HL_COLORS : tool === 'pen' ? PEN_COLORS : [];
    const curCol = tool === 'hl' ? hlColor : penColor;
    barEl.innerHTML = `
      <div class="ink-grp">
        <button type="button" class="ink-b${tool === 'hl' ? ' on' : ''}" data-ink-tool="hl" aria-label="${T_('ไฮไลต์')}" title="${T_('ไฮไลต์')}">${ic('highlighter')}</button>
        <button type="button" class="ink-b${tool === 'pen' ? ' on' : ''}" data-ink-tool="pen" aria-label="${T_('ปากกา')}" title="${T_('ปากกา')}">${ic('pen')}</button>
        <button type="button" class="ink-b${tool === 'erase' ? ' on' : ''}" data-ink-tool="erase" aria-label="${T_('ยางลบ')}" title="${T_('ยางลบ')}">${ic('eraser')}</button>
      </div>
      ${colors.length ? `<div class="ink-swatches">${colors.map(c =>
        `<button type="button" class="ink-sw${curCol === c.id ? ' on' : ''}${c.hex === 'auto' ? ' is-auto' : ''}" data-ink-col="${c.id}" style="${c.hex !== 'auto' ? `--sw:${c.hex}` : ''}" aria-label="${c.id}"></button>`
      ).join('')}</div>` : ''}
      <span class="ink-sep" aria-hidden="true"></span>
      <div class="ink-grp">
        <button type="button" class="ink-b" data-ink-act="undo" aria-label="${T_('ลบเส้นล่าสุด')}" title="${T_('ลบเส้นล่าสุด')}">${ic('undo')}</button>
        <button type="button" class="ink-b${hiddenInk ? ' on' : ''}" data-ink-act="hide" aria-label="${hiddenInk ? T_('แสดงโน้ต') : T_('ซ่อนโน้ต')}" title="${hiddenInk ? T_('แสดงโน้ต') : T_('ซ่อนโน้ต')}">${ic(hiddenInk ? 'eye-off' : 'eye')}</button>
        <button type="button" class="ink-pill${fingerDraw ? ' on' : ''}" data-ink-act="finger" title="${T_('ปากกา = เขียน · นิ้ว = เลื่อนหน้า')}">${fingerDraw ? T_('นิ้วเขียน') : 'Pencil'}</button>
        <button type="button" class="ink-b" data-ink-act="clear" aria-label="${T_('ล้างหน้านี้')}" title="${T_('ล้างหน้านี้')}">${ic('trash')}</button>
        <button type="button" class="ink-b" data-ink-act="close" aria-label="${T_('ปิด')}" title="${T_('ปิด')}">${ic('x')}</button>
      </div>`;
  }

  function syncModeClasses() {
    if (!viewEl || !readerEl) return;
    viewEl.classList.toggle('ink-active', active);
    // Only block touch scrolling on canvas when fingerDraw is explicitly enabled!
    readerEl.classList.toggle('ink-finger', active && fingerDraw);
    if (barEl) {
      barEl.hidden = !active;
      barEl.classList.toggle('on', active);
    }
    syncBadge();
  }

  function openBar() {
    active = true;
    hiddenInk = false;
    renderBar();
    syncModeClasses();
    syncSize();
  }
  function closeBar() {
    active = false;
    curStroke = null; curPid = null; erasing = false;
    syncModeClasses();
  }
  function toggleBar() { active ? closeBar() : openBar(); }

  /* ---------- page change sync ---------- */
  function checkPageChange() {
    if (!viewEl || !viewEl.classList.contains('active')) return;
    const nk = computePageKey();
    if (nk !== pageKey) {
      pageKey = nk;
      curStroke = null; curPid = null; erasing = false;
    }
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncSize, 45);
  }

  /* ---------- mount once on #v-book ---------- */
  function init() {
    viewEl = $('#v-book');
    readerEl = viewEl && viewEl.querySelector('article.card.reader');
    if (!viewEl || !readerEl) return;
    loadStore();

    // Inject clean monochrome toggle button right in #v-book header
    const actions = viewEl.querySelector('.ph-a');
    if (actions && !$('#bkInkBtn')) {
      toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.id = 'bkInkBtn';
      toggleBtn.className = 'ibtn bk-ink-btn';
      toggleBtn.setAttribute('aria-label', T_('ไฮไลต์และจดโน้ต'));
      toggleBtn.title = T_('ไฮไลต์และจดโน้ต');
      toggleBtn.innerHTML = ic('highlighter');
      actions.prepend(toggleBtn);
      toggleBtn.addEventListener('click', toggleBar);
    }

    // Transparent ink overlay canvas inside .reader
    readerEl.classList.add('ink-host');
    cv = document.createElement('canvas');
    cv.className = 'ink-cv';
    cv.setAttribute('aria-hidden', 'true');
    readerEl.appendChild(cv);
    ctx = cv.getContext('2d');

    // Minimal floating editorial ink toolbar
    barEl = document.createElement('div');
    barEl.className = 'ink-bar';
    barEl.hidden = true;
    barEl.setAttribute('role', 'toolbar');
    barEl.setAttribute('aria-label', T_('ไฮไลต์และจดโน้ต'));
    document.body.appendChild(barEl);
    renderBar();

    barEl.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.inkTool) { tool = d.inkTool; hiddenInk = false; renderBar(); redraw(); return; }
      if (d.inkCol) { if (tool === 'hl') hlColor = d.inkCol; else penColor = d.inkCol; hiddenInk = false; renderBar(); return; }
      if (d.inkAct === 'undo') {
        const list = strokesOf(pageKey);
        if (list.length) { list.pop(); saveStore(); redraw(); try { sfx('tap'); } catch (err) {} }
      } else if (d.inkAct === 'hide') {
        hiddenInk = !hiddenInk; renderBar(); redraw();
      } else if (d.inkAct === 'finger') {
        fingerDraw = !fingerDraw; renderBar(); syncModeClasses();
      } else if (d.inkAct === 'clear') {
        if (strokesOf(pageKey).length) {
          data[pageKey] = []; saveStore(); redraw();
          if (typeof toast === 'function') toast(T_('ล้างโน้ตหน้านี้แล้ว'), { icon: 'trash' });
        }
      } else if (d.inkAct === 'close') {
        closeBar();
      }
    });

    /* ---------- iPadOS WebKit stylus guard: stops Safari text-selection/scroll ONLY for Apple Pencil, keeping finger scroll 100% native ---------- */
    const blockStylusScroll = e => {
      if (!e.touches || !e.touches.length) return;
      if (e.target.closest && e.target.closest('button, a, input, select, textarea, audio')) return;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].touchType === 'stylus') { e.preventDefault(); return; }
      }
    };
    readerEl.addEventListener('touchstart', blockStylusScroll, { passive: false });
    readerEl.addEventListener('touchmove', blockStylusScroll, { passive: false });

    /* ---------- Pointer handling: Apple Pencil draws ALWAYS (auto-wakes!); Finger scrolls natively! ---------- */
    readerEl.addEventListener('pointerdown', e => {
      const isPen = e.pointerType === 'pen';
      const isMouse = e.pointerType === 'mouse' && e.button === 0;
      const isTouch = e.pointerType === 'touch';

      // Ignore interactive controls inside the book unless actively drawing with pen on text
      if (!isPen && e.target.closest('button, a, input, select, textarea, summary, audio')) return;
      if (isPen && e.target.closest('button, a, input, select, textarea, audio')) return;

      // Auto-wake ink mode when Apple Pencil touches the book page!
      if (isPen && !active) openBar();

      // Decide if this pointer should ink vs pass through to native scroll/click
      const shouldDraw = active && (isPen || isMouse || (isTouch && fingerDraw));
      if (!shouldDraw) return;

      // Reject palm touches even if fingerDraw is on
      if (isTouch && ((e.width || 0) > 36 || (e.height || 0) > 36)) return;

      e.preventDefault();
      if (hiddenInk) { hiddenInk = false; renderBar(); }
      curPid = e.pointerId;
      try { readerEl.setPointerCapture(e.pointerId); } catch (err) {}

      const w = readerEl.clientWidth || 1;
      const pt = normPt(e, null);
      if (tool === 'erase') {
        erasing = true;
        eraseAt(pt[0], pt[1], w);
        return;
      }
      curStroke = {
        t: tool,
        c: tool === 'hl' ? hlColor : penColor,
        w: tool === 'hl' ? pt[2] : undefined,
        p: [pt]
      };
      redraw();
    });

    readerEl.addEventListener('pointermove', e => {
      if (e.pointerId !== curPid) return;
      if (!curStroke && !erasing) return;
      e.preventDefault();
      const w = readerEl.clientWidth || 1;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (evs.length ? evs : [e]).forEach(ev => {
        if (erasing) {
          const pt = normPt(ev, null);
          eraseAt(pt[0], pt[1], w);
        } else if (curStroke) {
          const prev = curStroke.p[curStroke.p.length - 1];
          const pt = normPt(ev, prev);
          if (Math.hypot((pt[0] - prev[0]) * w, (pt[1] - prev[1]) * w) >= 1.4) {
            curStroke.p.push(pt);
          }
        }
      });
      if (curStroke) redraw();
    });

    const finishStroke = e => {
      if (e.pointerId !== curPid) return;
      curPid = null;
      if (erasing) { erasing = false; return; }
      if (curStroke) {
        if (!data[pageKey]) data[pageKey] = [];
        data[pageKey].push(curStroke);
        curStroke = null;
        saveStore();
        redraw();
      }
    };
    readerEl.addEventListener('pointerup', finishStroke);
    readerEl.addEventListener('pointercancel', finishStroke);

    // Observe page content, size, route, and theme changes
    const bkBody = $('#bkBody');
    if (bkBody && typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(() => checkPageChange());
      mo.observe(bkBody, { childList: true, subtree: false });
    }
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (viewEl.classList.contains('active')) {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(syncSize, 60);
        }
      });
      ro.observe(readerEl);
    }
    if (typeof MutationObserver !== 'undefined') {
      themeMo = new MutationObserver(() => { if (viewEl.classList.contains('active')) redraw(); });
      themeMo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
    window.addEventListener('hashchange', () => {
      if (!location.hash.startsWith('#/book')) closeBar();
      else setTimeout(checkPageChange, 60);
    });
    window.addEventListener('keydown', e => {
      if (!active) return;
      if (e.key === 'Escape') closeBar();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const list = strokesOf(pageKey);
        if (list.length) { e.preventDefault(); list.pop(); saveStore(); redraw(); }
      }
    });

    setTimeout(checkPageChange, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { open: openBar, close: closeBar, toggle: toggleBar, sync: checkPageChange };
})();
