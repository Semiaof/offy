/* ============================================================
   อักษร (#/hanzi) — the character tools, on their own menu under "หนังสือ"
   · สายวิวัฒนาการ (js/digi.js · OffyDigi)      #/hanzi/digi
   · ต้นไม้ตัวอักษร (js/tree.js · OffyTree)     #/hanzi/tree
   · ผสมอักษร   (js/compose.js · OffyCompose)  #/hanzi/compose
   The page uses the whole width, and the graph / columns grow to the bottom of the screen (--hz-h).
   เต็มจอ hides the menu and the page title too (and asks the browser for real full screen where it can).
   Each tab mounts into a fresh box (the tools bind their listeners to the box they get).
   ============================================================ */
Object.assign(window.OFFY_EN || {}, { 'อักษร': 'Hanzi', 'สายวิวัฒนาการ': 'Evolution', 'ต้นไม้ตัวอักษร': 'Character tree', 'ผสมอักษร': 'Compose', 'ซ้าย': 'left', 'ขวา': 'right', 'หน้าตาเหมือน แต่คนละตัว': 'Looks the same, different radical', 'เต็มจอ': 'Full screen', 'ออกจากเต็มจอ': 'Exit full screen' });
/* HSK levels shown on every tab of this page: small squares in each level's colour, tap to switch one on/off.
   HSK 3.0 has one band for 7–9 (one word list, one character list, one exam paper; the score gives 7, 8 or 9 —
   GF0025-2021 does not split the advanced band by level), so 7–9 is one square. Saved in S().hzLv. */
const HzLv = (() => {
  const ALL = [1, 2, 3, 4, 5, 6, 7];
  const get = () => { const v = S().hzLv; return Array.isArray(v) && v.length ? v : ALL.slice(); };
  const name = l => l === 7 ? '7–9' : String(l);
  function set(v) {
    try { S().hzLv = [...new Set(v)].sort((a, b) => a - b); Store.save(); } catch (e) { }
    paint(); dispatchEvent(new CustomEvent('hz-lv'));
  }
  function paint() {
    const el = document.getElementById('hzLv'); if (!el) return;
    const on = get(), all = on.length === ALL.length;
    el.innerHTML = `<span class="hz-lv-t">HSK</span>${ALL.map(l => `<button data-l="${l}" class="${on.includes(l) ? 'on' : ''}${l === 7 ? ' w' : ''}" style="--c:var(--hsk${l})" aria-pressed="${on.includes(l)}" aria-label="HSK ${name(l)}">${name(l)}</button>`).join('')}
      <button class="hz-lv-all${all ? ' on' : ''}" data-l="all">${T('ทั้งหมด')}</button>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('#hzLv [data-l]'); if (!b) return;
    try { sfx('tap'); } catch (err) { }
    const on = get(), l = b.dataset.l;
    if (l === 'all') { set(ALL); return; }
    const n = +l;
    if (on.includes(n)) { if (on.length === 1) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); return; } set(on.filter(x => x !== n)); }   // keep at least one
    else set(on.concat(n));
  });
  // a single word on the screen: "HSK 1–3", "HSK 1, 4, 7–9"
  const label = () => { const on = get(); if (on.length === ALL.length) return 'HSK 1–9';
    const runs = []; on.forEach(l => { const r = runs[runs.length - 1]; if (r && l === r[1] + 1) r[1] = l; else runs.push([l, l]); });
    return 'HSK ' + runs.map(([a, b]) => a === b ? name(a) : `${a}–${b === 7 ? 9 : b}`).join(', '); };
  return { get, has: l => get().includes(l > 7 ? 7 : l), set, paint, label };
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
  let cur = null;
  const $id = id => document.getElementById(id);
  const view = () => $id('v-hanzi'), stage = () => $id('hzStage');

  /* the graph (or the tree's columns) reaches down to the bottom of the screen */
  function fit() {
    const v = view(); if (!v || !v.classList.contains('active')) return;
    const t = stage().querySelector('.dg-view, .tr-cols'); if (!t) return;
    const tab = document.body.classList.contains('hz-full') ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tab')) || 0;
    const top = t.getBoundingClientRect().top + scrollY;
    let h = innerHeight - top - tab - (tab ? 28 : 14);
    if (t.classList.contains('dg-view') && innerWidth < 1000) h = Math.min(h, innerHeight * .66);   // the card sits below: leave room to scroll
    v.style.setProperty('--hz-h', Math.max(360, Math.round(h)) + 'px');
  }
  const refit = () => [0, 120, 500, 1400].forEach(ms => setTimeout(fit, ms));

  function open(id, force) {
    if (!TABS[id]) id = 'digi';
    segSet($id('hzTabs'), id);
    try { S().hzTab = id; Store.save(); } catch (e) { }
    view().dataset.tool = id;
    if (cur === id && !force && stage().firstElementChild) { refit(); return; }
    cur = id;
    const box = document.createElement('div'); box.className = id === 'compose' ? 'hz-box' : 'tr-root hz-box'; box.dataset.tool = id;
    stage().replaceChildren(box);
    const m = TABS[id](); if (m) Promise.resolve(m.mount(box)).then(refit);
    refit();
  }

  function full(on) {
    document.body.classList.toggle('hz-full', on);
    try { Tip.hide(); } catch (e) { }                 // the button's tooltip would stay behind when the button hides
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
    fit
  };
})();
