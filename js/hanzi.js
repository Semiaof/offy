/* ============================================================
   อักษร (#/hanzi) — the character tools, on their own menu under "หนังสือ"
   · สายวิวัฒนาการ (js/digi.js · OffyDigi)      #/hanzi/digi
   · ต้นไม้ตัวอักษร (js/tree.js · OffyTree)     #/hanzi/tree
   · ผสมอักษร   (js/compose.js · OffyCompose)  #/hanzi/compose
   Plus HzKit: shared 5-lang lookup, learned-status indicator, stroke-order Sheet,
   and 1-tap cross-tab jump between Evolution / Character Tree / Compose.
   ============================================================ */
Object.assign(window.OFFY_EN || {}, {
  'อักษร': 'Hanzi', 'สายวิวัฒนาการ': 'Evolution', 'ต้นไม้ตัวอักษร': 'Character tree', 'ผสมอักษร': 'Compose',
  'ซ้าย': 'left', 'ขวา': 'right', 'หน้าตาเหมือน แต่คนละตัว': 'Looks the same, different radical',
  'เต็มจอ': 'Full screen', 'ออกจากเต็มจอ': 'Exit full screen',
  'ลำดับขีด': 'Strokes', 'เขียนตาม': 'Practice', 'เล่นซ้ำ': 'Replay',
  'จำได้แล้ว': 'Mastered', 'กำลังเรียน': 'Learning', 'แตะเพื่อดู 5 ภาษา': 'Tap word for 5-lang card',
  'ค้นหาราก / ส่วนประกอบ / อักษร': 'Search radical, part or char',
  'ค้นหาตระกูล เช่น 青, 木, 马…': 'Search clan e.g. 青, 木, 马…'
});

/* Shared helper across Evolution (digi), Character Tree (tree), and Compose */
const HzKit = (() => {
  let _wMap = null, _wLen = 0;

  function wMap() {
    if (typeof WORDS === 'undefined' || !WORDS.length) return new Map();
    if (_wMap && _wLen === WORDS.length) return _wMap;
    const m = new Map();
    const has5 = id => typeof FIVE !== 'undefined' && FIVE.has && FIVE.has(id);
    for (const w of WORDS) {
      if (!w || !w.zh) continue;
      const prev = m.get(w.zh);
      if (!prev) { m.set(w.zh, w); continue; }
      const p5 = has5(prev.id), c5 = has5(w.id);
      if (c5 && !p5) m.set(w.zh, w);
      else if (c5 === p5 && (+w.lvl || 99) < (+prev.lvl || 99)) m.set(w.zh, w);
    }
    _wMap = m; _wLen = WORDS.length;
    return m;
  }

  function lang() {
    try {
      if (typeof f5main === 'function') return f5main();
    } catch (e) {}
    return typeof LANG !== 'undefined' && LANG === 'en' ? 'en' : 'th';
  }

  function findWord(zh) {
    if (!zh) return null;
    return wMap().get(String(zh).split('@')[0]) || null;
  }

  function pickWordText(w, L) {
    if (!w) return '';
    try {
      if (typeof FIVE !== 'undefined' && FIVE.meta) {
        const meta = FIVE.meta(w.id);
        if (meta && meta.m) {
          const v = L === 'ja' ? (typeof meta.m.ja === 'object' ? meta.m.ja.w : meta.m.ja) : meta.m[L];
          if (v) return String(v);
        }
      }
    } catch (e) {}
    if (L === 'th') return w.th || '';
    if (L === 'en') return w.en || '';
    return '';
  }

  /* Meaning for a multi-char or 1-char HSK word (uses our 5-lang / Thai dictionary before tree.js EN fallback) */
  function wordGloss(zh, treeGloss, treeIsTh) {
    const L = lang(), w = findWord(zh);
    const local = pickWordText(w, L);
    if (local) return { t: local, fb: false };
    if (L === 'th' && treeIsTh && treeGloss) return { t: treeGloss, fb: false };
    if (L === 'en' && treeGloss && !treeIsTh) return { t: treeGloss, fb: false };
    if (w && L !== 'en' && w.th) return { t: w.th, fb: false };
    if (treeGloss) return { t: treeGloss, fb: L !== 'en' && !treeIsTh };
    if (w && w.en) return { t: w.en, fb: L !== 'en' };
    return { t: '', fb: false };
  }

  /* Meaning for a single character (checks 5-lang/Thai WORDS first, then tree.js, then radical table) */
  function charMean(c, treeD, radOfGlyph) {
    const base = String(c || '').split('@')[0];
    const L = lang();
    const w = findWord(base);
    const local = pickWordText(w, L);
    if (local) return { t: local, fb: false };
    const x = treeD && treeD.c && treeD.c[c];
    if (x) {
      const v = L === 'th' ? x[9] : L === 'vi' ? x[7] : L === 'ja' ? x[14] : x[10];
      if (v) return { t: v, fb: false };
      if (L === 'th' && w && w.th) return { t: w.th, fb: false };
      return { t: x[10] || '', fb: L !== 'en' };
    }
    const r = radOfGlyph && radOfGlyph.get(c);
    if (r) {
      const v = { th: r[4], en: r[5], vi: r[6], ja: r[7] }[L];
      return { t: v || r[5] || '', fb: !v && L !== 'en' };
    }
    return { t: '', fb: false };
  }

  function short(s, max = 10) {
    const t = String(s || '').split(/[\/;,，、·(（]/)[0].trim();
    const arr = [...t];
    return arr.length > max ? arr.slice(0, max - 1).join('') + '…' : t;
  }

  /* Learned status of a single character from Store.d.words ('mastered' | 'learning' | '') */
  function charStatus(c) {
    if (typeof Store === 'undefined' || !Store.d || !Store.d.words) return '';
    const base = String(c || '').split('@')[0];
    const w = findWord(base);
    if (w) {
      const st = Store.status(w.id);
      if (st === 'mastered') return 'mastered';
      if (st === 'learning' || st === 'review') return 'learning';
    }
    // Also check if any practiced/mastered multi-char word contains this character
    if (typeof WORDS !== 'undefined') {
      let hasL = false, mCnt = 0;
      for (const wd of WORDS) {
        if (!wd.zh || !wd.zh.includes(base)) continue;
        const st = Store.status(wd.id);
        if (st === 'mastered') { mCnt++; if (mCnt >= 2) return 'mastered'; hasL = true; }
        else if (st === 'learning' || st === 'review') hasL = true;
      }
      if (mCnt >= 1) return 'mastered';
      if (hasL) return 'learning';
    }
    return '';
  }

  function dotHtml(c) {
    const st = charStatus(c);
    if (!st) return '';
    return `<i class="hz-dot ${st === 'mastered' ? 'm' : 'l'}" title="${esc(st === 'mastered' ? T('จำได้แล้ว') : T('กำลังเรียน'))}" aria-label="${esc(st === 'mastered' ? T('จำได้แล้ว') : T('กำลังเรียน'))}"></i>`;
  }

  function openWord(zh) {
    const w = findWord(zh);
    if (w && typeof Dict !== 'undefined' && Dict.detail) {
      try { sfx('tap'); } catch (e) {}
      Dict.detail(w.id);
      return true;
    }
    if (typeof TTS !== 'undefined') TTS.speak(zh);
    if (typeof toast === 'function') toast(`${zh} · ${T('ฟังเสียงแล้ว')}`, { icon: 'vol' });
    return false;
  }

  /* In-place Stroke Order + Practice Sheet using HanziWriter */
  async function strokeSheet(rawCh) {
    const ch = String(rawCh || '').split('@')[0];
    if (!ch || typeof Sheet === 'undefined') return;
    try { sfx('tap'); } catch (e) {}
    const treeD = window.OFFY_TREE;
    const x = treeD && treeD.c && treeD.c[ch];
    const mo = charMean(ch, treeD, null);
    const body = `<div class="hz-sw">
      <div class="hz-sw-h">
        <div><b lang="zh-Hans">${esc(ch)}</b>${x && x[0] ? `<span class="pyx">${esc(x[0])}</span>` : ''}${x && x[2] ? `<small>${x[2]} ${T('ขีด')}</small>` : ''}</div>
        <button type="button" class="ibtn sm" data-hzsay="${esc(ch)}" aria-label="${esc(T('ฟังเสียง'))}">${ic('vol')}</button>
      </div>
      ${mo.t ? `<p class="hz-sw-m">${esc(mo.t)}</p>` : ''}
      <div class="hz-sw-box" id="hzSwBox"><span class="muted">${T('กำลังโหลดเนื้อหา…')}</span></div>
      <div class="hz-sw-acts">
        <button type="button" class="btn primary sm" id="hzSwAnim">${ic('play')}${T('เล่นซ้ำ')}</button>
        <button type="button" class="btn sm" id="hzSwQuiz">${ic('pen')}${T('เขียนตาม')}</button>
      </div>
    </div>`;
    Sheet.open(body, '');
    const wrap = $('#sheetBody');
    const sayBtn = wrap && wrap.querySelector('[data-hzsay]');
    if (sayBtn) sayBtn.onclick = () => TTS.speak(ch);

    try {
      if (!window.HanziWriter) await Fx.script('https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js');
    } catch (e) {}
    const box = $('#hzSwBox');
    if (!box || !box.isConnected) return;
    if (!window.HanziWriter) {
      box.innerHTML = `<p class="muted" style="padding:20px;text-align:center">${T('โหลดข้อมูลลำดับขีดไม่ได้ (ต้องต่ออินเทอร์เน็ต)')}</p>`;
      return;
    }
    const dark = typeof currentTheme === 'function' && currentTheme() === 'dark';
    const sz = Math.min(240, Math.max(180, box.clientWidth || 220));
    let hw = null;
    const mountWriter = (quiz) => {
      box.innerHTML = '';
      hw = HanziWriter.create(box, ch, {
        width: sz, height: sz, padding: 12, showOutline: true, showCharacter: false,
        strokeAnimationSpeed: 1.15, delayBetweenStrokes: 200,
        strokeColor: dark ? '#ebeee8' : '#1b1d1a',
        outlineColor: dark ? '#2f342f' : '#e7e3d9',
        radicalColor: dark ? '#5ec69b' : '#1f6f54',
        drawingColor: dark ? '#5ec69b' : '#1f6f54',
        onLoadCharDataError: () => { box.innerHTML = `<p class="muted" style="padding:18px;text-align:center">${T('โหลดข้อมูลลำดับขีดไม่ได้ (ต้องต่ออินเทอร์เน็ต)')}</p>`; }
      });
      if (quiz) hw.quiz({ onComplete: () => { try { sfx('complete'); } catch (e) {} toast(T('เขียนครบแล้ว'), { icon: 'check' }); } });
      else hw.animateCharacter();
    };
    mountWriter(false);
    const aBtn = $('#hzSwAnim'), qBtn = $('#hzSwQuiz');
    if (aBtn) aBtn.onclick = () => mountWriter(false);
    if (qBtn) qBtn.onclick = () => mountWriter(true);
  }

  /* Unified cross-tab action bar on focused character cards */
  function crossBar(rawCh, curTab) {
    const ch = String(rawCh || '').split('@')[0];
    if (!ch || !/[\u3400-\u9fff]/.test(ch)) return '';
    const w = findWord(ch);
    const btns = [];
    btns.push(`<button type="button" class="hz-xbtn" data-hzstroke="${esc(ch)}">${ic('brush')}<span>${T('ลำดับขีด')}</span></button>`);
    if (w) btns.push(`<button type="button" class="hz-xbtn" data-hzdict="${esc(ch)}">${ic('vocab')}<span>5 ภาษา</span></button>`);
    if (curTab !== 'digi') btns.push(`<button type="button" class="hz-xbtn" data-hzjump="digi" data-hzch="${esc(ch)}">${ic('bolt')}<span>${T('สายวิวัฒนาการ')}</span></button>`);
    if (curTab !== 'tree') btns.push(`<button type="button" class="hz-xbtn" data-hzjump="tree" data-hzch="${esc(ch)}">${ic('list')}<span>${T('ต้นไม้ตัวอักษร')}</span></button>`);
    if (curTab !== 'compose') btns.push(`<button type="button" class="hz-xbtn" data-hzjump="compose" data-hzch="${esc(ch)}">${ic('wand')}<span>${T('ผสมอักษร')}</span></button>`);
    return `<div class="hz-xbar">${btns.join('')}</div>`;
  }

  /* Global delegated handler for cross-tab buttons inside #v-hanzi */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-hzstroke],[data-hzdict],[data-hzjump]');
    if (!b) return;
    const d = b.dataset;
    if (d.hzstroke) { e.stopPropagation(); strokeSheet(d.hzstroke); return; }
    if (d.hzdict) { e.stopPropagation(); openWord(d.hzdict); return; }
    if (d.hzjump && d.hzch) { e.stopPropagation(); try { sfx('tap'); } catch (err) {} HanziView.jump(d.hzjump, d.hzch); }
  });

  return { lang, findWord, wordGloss, charMean, short, charStatus, dotHtml, openWord, strokeSheet, crossBar };
})();

/* HSK levels shown on every tab of this page (collapsible via #hzLvBtn chip) */
const HzLv = (() => {
  const ALL = [1, 2, 3, 4, 5, 6, 7];
  const get = () => { const v = S().hzLv; return Array.isArray(v) && v.length ? v : ALL.slice(); };
  const name = l => l === 7 ? '7–9' : String(l);
  const label = () => {
    const on = get(); if (on.length === ALL.length) return 'HSK 1–9';
    const runs = []; on.forEach(l => { const r = runs[runs.length - 1]; if (r && l === r[1] + 1) r[1] = l; else runs.push([l, l]); });
    return 'HSK ' + runs.map(([a, b]) => a === b ? name(a) : `${a}–${b === 7 ? 9 : b}`).join(', ');
  };
  function set(v) {
    try { S().hzLv = [...new Set(v)].sort((a, b) => a - b); Store.save(); } catch (e) { }
    paint(); dispatchEvent(new CustomEvent('hz-lv'));
  }
  function paintTrad() {
    const btn = document.getElementById('hzTrad'); if (!btn) return;
    const tr = !!S().hzTrad;
    btn.setAttribute('aria-pressed', tr);
    const sp = btn.querySelectorAll('span');
    if (sp[0]) sp[0].classList.toggle('on', !tr);
    if (sp[1]) sp[1].classList.toggle('on', tr);
  }
  function paint() {
    const on = get(), all = on.length === ALL.length;
    const btn = document.getElementById('hzLvBtn');
    if (btn) {
      const dots = on.slice(0, 4).map(l => `<i style="--c:var(--hsk${l})"></i>`).join('');
      btn.classList.toggle('filtered', !all);
      btn.innerHTML = `<span class="hz-lvdots">${dots}</span><span>${esc(label())}</span>${ic('chev-d')}`;
    }
    const el = document.getElementById('hzLv');
    if (el) {
      el.innerHTML = `<span class="hz-lv-t">HSK</span>${ALL.map(l => `<button data-l="${l}" class="${on.includes(l) ? 'on' : ''}${l === 7 ? ' w' : ''}" style="--c:var(--hsk${l})" aria-pressed="${on.includes(l)}" aria-label="HSK ${name(l)}">${name(l)}</button>`).join('')}
        <button class="hz-lv-all${all ? ' on' : ''}" data-l="all">${T('ทั้งหมด')}</button>`;
    }
    paintTrad();
  }
  document.addEventListener('click', e => {
    const toggleBtn = e.target.closest('#hzLvBtn');
    if (toggleBtn) {
      try { sfx('tap'); } catch (err) {}
      const pop = document.getElementById('hzLvPop');
      if (pop) {
        const open = pop.hidden;
        pop.hidden = !open;
        toggleBtn.setAttribute('aria-expanded', open);
        toggleBtn.classList.toggle('open', open);
        if (typeof HanziView !== 'undefined' && HanziView.fit) setTimeout(HanziView.fit, 40);
      }
      return;
    }
    const tradBtn = e.target.closest('#hzTrad');
    if (tradBtn) {
      try { sfx('tap'); } catch (err) {}
      S().hzTrad = !S().hzTrad;
      try { Store.save(); } catch (err) {}
      paintTrad();
      dispatchEvent(new CustomEvent('hz-lv'));
      return;
    }
    const b = e.target.closest('#hzLv [data-l]'); if (!b) return;
    try { sfx('tap'); } catch (err) { }
    const on = get(), l = b.dataset.l;
    if (l === 'all') { set(ALL); return; }
    const n = +l;
    if (on.includes(n)) { if (on.length === 1) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); return; } set(on.filter(x => x !== n)); }
    else set(on.concat(n));
  });
  return { get, has: l => get().includes(l > 7 ? 7 : l), set, paint, paintTrad, label };
})();

const HanziView = (() => {
  addEventListener('hz-lv', () => {
    [typeof OffyDigi !== 'undefined' && OffyDigi, typeof OffyTree !== 'undefined' && OffyTree, typeof OffyCompose !== 'undefined' && OffyCompose].forEach(m => { if (m && m.refresh) m.refresh(); });
    setTimeout(fit, 60);
  });
  const TABS = {
    digi: () => typeof OffyDigi !== 'undefined' && OffyDigi,
    tree: () => typeof OffyTree !== 'undefined' && OffyTree,
    compose: () => typeof OffyCompose !== 'undefined' && OffyCompose
  };
  let cur = null, pendingJump = null;
  const $id = id => document.getElementById(id);
  const view = () => $id('v-hanzi'), stage = () => $id('hzStage');

  function fit() {
    const v = view(); if (!v || !v.classList.contains('active')) return;
    const t = stage().querySelector('.dg-view, .tr-cols'); if (!t) return;
    const tab = document.body.classList.contains('hz-full') ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tab')) || 0;
    const top = t.getBoundingClientRect().top + scrollY;
    let h = innerHeight - top - tab - (tab ? 28 : 14);
    if (t.classList.contains('dg-view') && innerWidth < 1000) h = Math.min(Math.max(380, h), innerHeight * .62);
    v.style.setProperty('--hz-h', Math.max(360, Math.round(h)) + 'px');
  }
  const refit = () => [0, 120, 500, 1400].forEach(ms => setTimeout(fit, ms));

  function applyPending(id, m) {
    if (!pendingJump || pendingJump.tab !== id || !m) return;
    const ch = pendingJump.ch;
    pendingJump = null;
    if (id === 'compose' && m.start) m.start(ch);
    else if (m.focus) m.focus(ch);
  }

  function open(id, force) {
    if (!TABS[id]) id = 'digi';
    segSet($id('hzTabs'), id);
    try { S().hzTab = id; Store.save(); } catch (e) { }
    view().dataset.tool = id;
    const m = TABS[id]();
    if (cur === id && !force && stage().firstElementChild) {
      applyPending(id, m);
      refit();
      return;
    }
    cur = id;
    const box = document.createElement('div'); box.className = id === 'compose' ? 'hz-box' : 'tr-root hz-box'; box.dataset.tool = id;
    stage().replaceChildren(box);
    if (m) Promise.resolve(m.mount(box)).then(() => { applyPending(id, m); refit(); });
    refit();
  }

  function jump(tab, ch) {
    pendingJump = { tab, ch };
    if (location.hash === '#/hanzi/' + tab) open(tab, false);
    else Router.replace('/hanzi/' + tab);
  }

  function full(on) {
    document.body.classList.toggle('hz-full', on);
    try { Tip.hide(); } catch (e) { }
    const de = document.documentElement;
    try {
      if (on && !document.fullscreenElement && de.requestFullscreen) de.requestFullscreen().catch(() => { });
      if (!on && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => { });
    } catch (e) { }
    refit();
  }
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('hz-full')) { document.body.classList.remove('hz-full'); refit(); } });
  addEventListener('hashchange', () => { if (!location.hash.startsWith('#/hanzi') && document.body.classList.contains('hz-full')) full(false); });
  addEventListener('resize', () => fit());
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('hz-full') && !document.querySelector('.hp.on')) full(false); });

  document.addEventListener('click', e => {
    const b = e.target.closest('#hzTabs [data-v]');
    if (b) { sfx('tap'); Router.replace('/hanzi/' + b.dataset.v); return; }
    if (e.target.closest('#hzFull')) { sfx('tap'); full(true); return; }
    if (e.target.closest('#hzExit')) { sfx('tap'); full(false); }
  });
  return {
    show(a) { HzLv.paint(); const id = a || (S().hzTab) || 'digi'; open(id, !stage().firstElementChild); },
    jump,
    fit
  };
})();
