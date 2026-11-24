/* 中文很难 · ฝึกเขียนอักษรจีน
   © 2026 李牧飞 Aphisit Kaewnet. All rights reserved. */
/* interface (home · practice · explore · search · detail drawer)
   Uses the engine in core.js: data constants, CharAnim / StrokeAnim, renderSteps,
   structure diagrams and the brush canvas (initPencilProStudio). */
'use strict';

const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const isHan = c => /\p{Script=Han}/u.test(c);
const plain = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s\d,]/g, '').toLowerCase();
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2705}\u{2714}\u{2713}]/gu;
function cleanText(t) {
  return String(t)
    .replace(/^\s*✅?\s*ยืนยัน[^:：]{0,24}[:：]\s*/u, '')
    .replace(EMOJI_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
(function cleanData(o, depth) {
  if (!o || depth > 8) return;
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === 'string') { if (/[✅✓❤\u{1F300}-\u{1FAFF}]|ยืนยัน/u.test(v)) o[k] = cleanText(v); }
    else if (v && typeof v === 'object') cleanData(v, depth + 1);
  }
})(window.APP_DATA, 0);

const I_SPEAK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const I_REPLAY = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const LS_META = {
  '象形': { th: 'อักษรภาพ', en: 'Pictographs', tone: 'mint', icon: '山' },
  '指事': { th: 'อักษรบ่งชี้', en: 'Simple ideographs', tone: 'sky', icon: '上' },
  '会意': { th: 'อักษรประสมความหมาย', en: 'Compound ideographs', tone: 'lav', icon: '明' },
  '形声': { th: 'อักษรรูปควบเสียง', en: 'Phono-semantic compounds', tone: 'peach', icon: '清' },
  '假借': { th: 'อักษรยืมเสียง', en: 'Phonetic loans', tone: 'butter', icon: '我' },
  '转注': { th: 'อักษรอรรถาธิบาย', en: 'Derived cognates', tone: 'rose', icon: '考' }
};
const ROLE_SHORT = { semantic: 'บอกความหมาย', phonetic: 'บอกเสียง', meaning: 'ส่วนความหมาย', pictograph: 'รูปภาพ', indicator: 'สัญลักษณ์ชี้', component: 'ชิ้นส่วน' };
const LS_CATS = (LIUSHU_THEORY.groups || []).flatMap(g => g.categories || []);
/** wrap runs of Chinese characters in <span class="zh"> so Latin / Thai keep the UI font */
const zhWrap = t => esc(t).replace(/([\p{Script=Han}⺀-⿟　-〿]+)/gu, '<span class="zh">$1</span>');
/** '阝 (ขวา R)' -> { han: '阝', rest: 'ขวา R' } */
function splitForm(t) {
  const m = String(t || '').match(/^([\p{Script=Han}⺀-⿟㇀-㇯]+)\s*\(?([^)]*)\)?\s*$/u);
  return m ? { han: m[1], rest: m[2].trim() } : { han: String(t || ''), rest: '' };
}
function formsHTML(forms) {
  return (forms || []).map(f => { const x = splitForm(f); return `${esc(x.han)}${x.rest ? `<small>${esc(x.rest)}</small>` : ''}`; }).join(' ');
}
const lsBadge = ls => ls ? `<span class="ls-badge ls-${esc(ls)}"><span class="zh">${esc(ls)}</span>${esc((LS_META[ls] || {}).th || '')}</span>` : '';

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2000);
}

function speak(ch) {
  try {
    if (!window.speechSynthesis) return toast('อุปกรณ์นี้ไม่รองรับเสียงอ่าน');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(ch);
    u.lang = 'zh-CN'; u.rate = 0.8;
    const v = speechSynthesis.getVoices().find(v => /zh[-_]CN/i.test(v.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) {}
}

/** small character tile (glyph · pinyin · meaning) */
function ctile(ch, extraCls = '') {
  const f = getInfo(ch);
  return `<button class="tile ${extraCls} ${f.liushu ? 'ls-' + esc(f.liushu) : ''}" data-char="${esc(ch)}">
    <span class="g">${esc(ch)}</span>
    <span class="p">${esc(f.py)}</span>
    <span class="t">${esc(f.th)}</span>
    ${f.en ? `<span class="e">${esc(f.en)}</span>` : ''}
  </button>`;
}

/* ============================== ROUTER ============================== */
const PAGES = ['home', 'practice', 'explore', 'search'];
let pendingSearch = null;
function route() {
  const [p, sub] = (location.hash.slice(1) || 'home').split('/');
  const page = PAGES.includes(p) ? p : 'home';
  closeDrawer();
  $$('.page').forEach(el => {
    const on = el.id === 'page-' + page;
    if (!on && el.classList.contains('on') && el.id !== 'page-practice') destroyAnimsIn(el);
    el.classList.toggle('on', on);
  });
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === page));
  if (page === 'home') renderHome();
  if (page === 'explore') renderExplore(sub);
  if (page === 'search') renderSearchPage();
  if (page === 'practice') setTimeout(resizeStudioCanvases, 30);
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
window.addEventListener('scroll', () => $('.topbar').classList.toggle('scrolled', window.scrollY > 4), { passive: true });

/* ============================== HOME ============================== */
const PATH_STEPS = [
  { tab: 'strokes', glyph: '笔', title: 'ขีดพื้นฐาน', meta: `${STROKES.length} ขีด`, tone: 'sky' },
  { tab: 'rules', glyph: '序', title: 'กฎลำดับขีด', meta: `${RULES_BASIC.length} กฎหลัก`, tone: 'lav' },
  { tab: 'structure', glyph: '构', title: 'โครงสร้างอักษร', meta: 'เดี่ยว · ประสม', tone: 'butter' },
  { tab: 'radicals', glyph: '部', title: 'หมวดนำ', meta: `${RADICALS.length} หมวด`, tone: 'peach' },
  { tab: 'liushu', glyph: '书', title: 'ศาสตร์ 六书', meta: `${Object.keys(CHAR_DECOMP).length} ตัวอักษร`, tone: 'mint' }
];
function charOfDay() {
  // beginner-friendly: characters from the 六书 lesson groups that have a memory tip
  const pool = [...new Set(LS_CATS.flatMap(c => (c.subcategories || []).flatMap(s => s.chars || [])))]
    .filter(c => CHAR_DECOMP[c] && CHAR_DECOMP[c].mnemonicTh);
  const day = Math.floor(Date.now() / 864e5);
  return pool.length ? pool[day % pool.length] : '永';
}
function practiceSets() {
  const sets = [];
  LS_CATS.forEach(c => (c.subcategories || []).forEach(sc => {
    const chars = (sc.chars || []).filter(ch => CHAR_DECOMP[ch] || DICT[ch]);
    if (chars.length >= 4) sets.push({ title: String(sc.th || '').replace(/^\d+(\.\d+)?\s*/, ''), chars, tone: (LS_META[c.zh] || {}).tone || 'peach', badge: chars[0] });
  }));
  return sets;
}
function renderHome() {
  const host = $('#page-home');
  destroyAnimsIn(host);
  const ch = charOfDay();
  const f = getInfo(ch), d = CHAR_DECOMP[ch] || {};
  const sets = practiceSets().slice(0, 9);
  host.innerHTML = `
    <section class="hero" data-bg="${esc(ch)}">
      <div>
        <span class="hero-eyebrow">อักษรประจำวัน · <span class="zh">今日一字</span></span>
        <h1><span class="hz">${esc(ch)}</span><span class="py">${esc(f.py)}</span></h1>
        <div class="hero-mean">${esc(f.th)}</div>
        ${f.en ? `<div class="hero-en">${esc(f.en)}</div>` : ''}
        ${d.mnemonicTh ? `<p class="hero-tip">${esc(d.mnemonicTh)}</p>` : '<p class="hero-tip"></p>'}
        <div class="hero-actions">
          <button class="btn primary lg" data-practice-one="${esc(ch)}">ฝึกเขียนตัวนี้</button>
          <button class="btn lg" data-char="${esc(ch)}">ดูที่มาของตัวอักษร</button>
        </div>
      </div>
      <div class="hero-anim"><div class="tian" id="heroAnim" style="width:220px;height:220px"></div></div>
    </section>

    <div class="sec-title"><h2>เส้นทางเรียน<span class="zh">学习路线</span></h2></div>
    <div class="path">${PATH_STEPS.map((s, i) => `
      <a class="path-card t-${s.tone}" href="#explore/${s.tab}">
        <span class="step">ขั้นที่ ${i + 1}</span>
        <span class="glyph">${s.glyph}</span>
        <b>${s.title}</b>
        <small>${s.meta}</small>
      </a>`).join('')}</div>

    <div class="sec-title"><h2>ชุดฝึกเขียน<span class="zh">练字</span></h2><a href="#practice">เปิดกระดาน →</a></div>
    <div class="sets">${sets.map(s => `
      <button class="set-card" data-practice="${esc(s.chars.join(''))}">
        <span class="badge t-${s.tone}">${esc(s.badge)}</span>
        <span class="info"><b>${esc(s.title)}</b><span class="cs">${esc(s.chars.join(''))}</span></span>
        <span class="go">ฝึก →</span>
      </button>`).join('')}</div>

    <div class="sec-title"><h2>ค้นลำดับขีด<span class="zh">笔顺</span></h2></div>
    <form class="quick-lookup" id="homeLookup">
      <input id="homeLookupInput" placeholder="พิมพ์อักษรจีน เช่น 你好" aria-label="อักษรที่ต้องการค้น" autocomplete="off" enterkeyhint="search">
      <button class="btn primary" type="submit">ค้นหา</button>
    </form>

    <div class="home-foot"><button class="link-btn" data-install>ติดตั้งเป็นแอปบน iPhone / iPad</button></div>`;
  const a = new CharAnim($('#heroAnim'), ch, 216);
  a.setVisible(true);
  $('#homeLookup').onsubmit = e => {
    e.preventDefault();
    const v = $('#homeLookupInput').value.trim();
    if (!v) return;
    pendingSearch = v;
    location.hash = '#search';
  };
}

/* ============================== EXPLORE ============================== */
const EX_TABS = [
  { id: 'strokes', glyph: '笔', title: 'ขีดพื้นฐาน', sub: `${STROKES.length} ขีด`, tone: 'sky' },
  { id: 'rules', glyph: '序', title: 'กฎลำดับขีด', sub: 'เขียนอะไรก่อน', tone: 'lav' },
  { id: 'structure', glyph: '构', title: 'โครงสร้าง', sub: 'จัดวางชิ้นส่วน', tone: 'butter' },
  { id: 'radicals', glyph: '部', title: 'หมวดนำ 214', sub: 'รากศัพท์คังซี', tone: 'peach' },
  { id: 'liushu', glyph: '书', title: 'ศาสตร์ 六书', sub: '6 วิธีสร้างอักษร', tone: 'mint' }
];
let exTab = 'strokes';
function renderExplore(sub) {
  if (sub && EX_TABS.some(t => t.id === sub)) exTab = sub;
  const host = $('#page-explore');
  destroyAnimsIn(host);
  host.innerHTML = `
    <div class="page-title"><h1>สำรวจ</h1><span class="zh">学汉字</span></div>
    <div class="ex-tabs" role="tablist">${EX_TABS.map(t => `
      <a class="ex-tab ${t.id === exTab ? 'on' : ''}" href="#explore/${t.id}" role="tab" aria-selected="${t.id === exTab}">
        <span class="ic t-${t.tone}">${t.glyph}</span>
        <span><b>${t.title}</b><small>${t.sub}</small></span>
      </a>`).join('')}</div>
    <div id="exBody"></div>`;
  ({ radicals: viewRadicals, liushu: viewLiushu, strokes: viewStrokes, rules: viewRules, structure: viewStructure })[exTab]($('#exBody'));
}

/* ---- radicals ---- */
const radState = { q: '', sc: 0, mode: 'all' };
function viewRadicals(host) {
  const counts = {};
  RADICALS.forEach(r => { counts[r.strokes] = (counts[r.strokes] || 0) + 1; });
  host.innerHTML = `
    <div class="toolbar">
      <label class="search-field"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input id="radQ" type="search" placeholder="氵, น้ำ, shui, #85" value="${esc(radState.q)}" aria-label="ค้นหมวดนำ" autocomplete="off"></label>
      <div class="seg" id="radMode">
        <button data-m="all" class="${radState.mode === 'all' ? 'active' : ''}">ทั้งหมด</button>
        <button data-m="solo" class="${radState.mode === 'solo' ? 'active' : ''}">ใช้เดี่ยวได้</button>
        <button data-m="bound" class="${radState.mode === 'bound' ? 'active' : ''}">ใช้เดี่ยวไม่ได้</button>
        <button data-m="var" class="${radState.mode === 'var' ? 'active' : ''}">มีรูปเปลี่ยน</button>
      </div>
      <span class="count" id="radCount"></span>
    </div>
    <div class="chips scroll" id="radSc">
      <button class="chip ${radState.sc === 0 ? 'on' : ''}" data-sc="0">ทุกจำนวนขีด</button>
      ${Object.keys(counts).map(Number).sort((a, b) => a - b).map(n => `<button class="chip ${radState.sc === n ? 'on' : ''}" data-sc="${n}">${n} ขีด <span class="n">${counts[n]}</span></button>`).join('')}
    </div>
    <div id="radGrid"></div>`;
  $('#radQ').oninput = e => { radState.q = e.target.value; drawRadGrid(); };
  $$('#radMode button').forEach(b => b.onclick = () => { radState.mode = b.dataset.m; $$('#radMode button').forEach(x => x.classList.toggle('active', x === b)); drawRadGrid(); });
  $$('#radSc .chip').forEach(b => b.onclick = () => { radState.sc = +b.dataset.sc; $$('#radSc .chip').forEach(x => x.classList.toggle('on', x === b)); drawRadGrid(); });
  drawRadGrid();
}
function drawRadGrid() {
  const q = radState.q.trim().toLowerCase(), pq = plain(q);
  const list = RADICALS.filter(r => {
    const vars = r.transformedForms || [];
    if (radState.sc && r.strokes !== radState.sc) return false;
    if (radState.mode === 'var' && !vars.length && !(r.variants || []).length) return false;
    if (radState.mode === 'solo' && !r.isStandalone) return false;
    if (radState.mode === 'bound' && r.isStandalone) return false;
    if (!q) return true;
    if (q.startsWith('#')) return String(r.id) === q.slice(1);
    const hay = [r.radical, r.kangxiClassic, r.traditional, r.meaningTh, r.meaningEn, r.colloquialName, ...vars, ...(r.variants || []).map(v => v.char)].join(' ').toLowerCase();
    return hay.includes(q) || (pq && plain(r.pinyin).includes(pq));
  });
  // in "ใช้เดี่ยวไม่ได้" also list the variant forms (偏旁) that only appear as components
  const varList = radState.mode !== 'bound' ? [] : RADICALS.flatMap(r => (r.variants || [])
    .filter(v => v.isStandalone === false)
    .map(v => ({ r, v })))
    .filter(({ r, v }) => !q || [v.char, v.displayLabel, v.colloquialName, v.originCharacter, r.radical, r.meaningTh].join(' ').toLowerCase().includes(q) || (pq && plain(r.pinyin).includes(pq)));
  $('#radCount').textContent = varList.length ? `${list.length} หมวด · ${varList.length} รูปเปลี่ยน` : `${list.length} หมวด`;
  const groups = {};
  list.forEach(r => (groups[r.strokes] = groups[r.strokes] || []).push(r));
  $('#radGrid').innerHTML = list.length ? Object.keys(groups).map(Number).sort((a, b) => a - b).map(n => `
    <div class="group-h"><h3>${n} ขีด</h3><span>${groups[n].length} หมวด</span></div>
    <div class="tiles">${groups[n].map(r => `
      <button class="tile" data-rad="${r.id}">
        <span class="no">${r.id}</span>
        ${r.isStandalone ? '' : '<span class="bound-tag">ประกอบ</span>'}
        <span class="g">${esc(r.radical)}</span>
        <span class="v">${formsHTML(r.transformedForms)}</span>
        <span class="p">${esc(String(r.pinyin || '').split(',')[0])}</span>
        <span class="t">${esc(r.meaningTh)}</span>
        ${r.meaningEn ? `<span class="e">${esc(r.meaningEn)}</span>` : ''}
      </button>`).join('')}</div>`).join('') : (varList.length ? '' : '<div class="empty">ไม่พบหมวดนำ</div>');
  if (varList.length) {
    $('#radGrid').insertAdjacentHTML('beforeend', `
      <div class="group-h"><h3>รูปเปลี่ยน <span class="zh">偏旁</span></h3><span>${varList.length} รูป · ใช้ประกอบตัวอักษรเท่านั้น</span></div>
      <div class="tiles">${varList.map(({ r, v }) => {
        const pos = splitForm(v.displayLabel || '').rest;
        return `<button class="tile" data-rad="${r.id}">
          <span class="no">${r.id}</span>
          <span class="bound-tag">ประกอบ</span>
          <span class="g">${esc(v.char)}</span>
          <span class="v">${pos ? `<small>${esc(pos)}</small>` : ''}</span>
          <span class="p">จาก <span class="zh">${esc(r.radical)}</span></span>
          <span class="t">${zhWrap(String(v.colloquialName || r.meaningTh).replace(/\s*\(.*$/, ''))}</span>
          ${r.meaningEn ? `<span class="e">${esc(r.meaningEn)}</span>` : ''}
        </button>`;
      }).join('')}</div>`);
  }
}

/* ---- 六书 ---- */
let lsSel = '象形';
let famIdx = 0;
function viewLiushu(host) {
  const counts = {};
  Object.values(CHAR_DECOMP).forEach(d => { counts[d.liushu] = (counts[d.liushu] || 0) + 1; });
  const cat = LS_CATS.find(c => c.zh === lsSel) || LS_CATS[0];
  const meta = LS_META[cat.zh] || {};
  const inSubs = new Set((cat.subcategories || []).flatMap(s => s.chars || []));
  const others = Object.keys(CHAR_DECOMP).filter(c => CHAR_DECOMP[c].liushu === cat.zh && !inSubs.has(c));
  host.innerHTML = `
    <div class="ls-cats">${LS_CATS.map(c => {
      const m = LS_META[c.zh] || {};
      return `<button class="ls-cat t-${m.tone} ${c.zh === cat.zh ? 'on' : ''}" data-lscat="${esc(c.zh)}">
        <span class="zh">${esc(c.zh)}</span><b>${esc(m.th || c.th)}</b><em class="en">${esc(m.en || '')}</em><small>${counts[c.zh] || 0} ตัว</small><span class="bg">${m.icon || ''}</span>
      </button>`;
    }).join('')}</div>
    <div class="ls-panel">
      <div class="ls-panel-head">
        <div class="big t-${meta.tone}">${esc(cat.zh)}</div>
        <div><h2>${esc(cat.th)} <span class="py">${esc(cat.py || '')}</span></h2><p>${esc(cat.desc || '')}</p></div>
      </div>
      ${(cat.subcategories || []).map(sc => `
        <div class="sub-block"><h4>${esc(String(sc.th || '').replace(/^\d+(\.\d+)?\s*/, ''))} <span class="zh">${esc(sc.zh || '')}</span></h4>
        <div class="tiles sm">${(sc.chars || []).map(ch => ctile(ch)).join('')}</div></div>`).join('')}
      ${cat.phoneticFamilies && cat.phoneticFamilies.length ? `<div class="sub-block"><h4>ตระกูลเสียง <span class="zh">声旁家族</span></h4><div id="famHost"></div></div>` : ''}
      ${others.length ? `<div class="sub-block"><h4>อักษรอื่นในหมวดนี้ <span class="zh">${others.length} 字</span></h4><div class="tiles sm">${others.map(ch => ctile(ch)).join('')}</div></div>` : ''}
    </div>`;
  $$('[data-lscat]', host).forEach(b => b.onclick = () => { lsSel = b.dataset.lscat; famIdx = 0; viewLiushu(host); });
  if (cat.phoneticFamilies && cat.phoneticFamilies.length) drawFamilies(cat.phoneticFamilies);
}
function drawFamilies(fams) {
  const fam = fams[famIdx] || fams[0];
  $('#famHost').innerHTML = `
    <div class="fam-tabs">${fams.map((f, i) => `<button class="fam-tab ${i === famIdx ? 'on' : ''}" data-fam="${i}"><span class="zh">${esc(f.phonetic)}</span><span><b>${esc(f.py)}</b><small>${esc(f.meaning)}</small></span></button>`).join('')}</div>
    <div class="fam-grid">${(fam.items || []).map(it => `
      <button class="eq-card" data-char="${esc(it.char)}">
        <div class="eq"><span class="a">${esc(it.comp)}</span><i>+</i><span class="b">${esc(fam.phonetic)}</span><i>=</i><span class="r">${esc(it.char)}</span></div>
        <div class="m"><b>${esc(it.py)}</b>${esc(it.th)}</div>
      </button>`).join('')}</div>`;
  $$('[data-fam]').forEach(b => b.onclick = () => { famIdx = +b.dataset.fam; drawFamilies(fams); });
}

/* ---- strokes ---- */
let strokesAll = false;
function viewStrokes(host) {
  const list = STROKES.map((s, i) => ({ s, i })).filter(x => strokesAll || x.s.basic);
  host.innerHTML = `
    <div class="toolbar">
      <div class="seg" id="strokeSeg">
        <button class="${!strokesAll ? 'active' : ''}" data-all="0">ขีดพื้นฐาน ${STROKES.filter(s => s.basic).length}</button>
        <button class="${strokesAll ? 'active' : ''}" data-all="1">ทั้งหมด ${STROKES.length}</button>
      </div>
    </div>
    <div class="stroke-tiles">${list.map(({ s, i }) => `
      <div class="stroke-tile" data-stroke="${i}" role="button" tabindex="0">
        <div class="tian" data-sanim="${i}" style="width:124px;height:124px"></div>
        <div class="nm"><span class="zh">${esc(s.zh)}</span><span class="py">${esc(s.py)}</span> <span class="th">${esc(s.th)}</span></div>
        ${s.basic ? '<span class="basic">พื้นฐาน</span>' : ''}
      </div>`).join('')}</div>`;
  $$('#strokeSeg button').forEach(b => b.onclick = () => { strokesAll = b.dataset.all === '1'; viewStrokes(host); });
  $$('[data-sanim]', host).forEach(h => new StrokeAnim(h, STROKES[+h.dataset.sanim], 120));
}

/* ---- rules ---- */
let rulesAll = false;
function rexHTML([ch, book, added]) {
  const f = getInfo(ch);
  return `<div class="rex">
    <div class="tian" data-anim="${esc(ch)}" style="width:96px;height:96px"></div>
    <div class="meta">
      <div class="ch" data-char="${esc(ch)}">${esc(ch)}</div>
      <div class="seq">${esc(book.split(' ').join(' → '))}</div>
      <div class="mean">${esc(f.py)} ${esc(f.th)}${f.en ? ` · ${esc(f.en)}` : ''}</div>
      <div class="steps" data-steps="${esc(ch)}"></div>
    </div>
  </div>`;
}
function viewRules(host) {
  let h = `
    <div class="toolbar">
      <div class="seg" id="ruleSeg">
        <button class="${!rulesAll ? 'active' : ''}" data-all="0">กฎหลัก ${RULES_BASIC.length} ข้อ</button>
        <button class="${rulesAll ? 'active' : ''}" data-all="1">ทั้งหมด</button>
      </div>
    </div>
    <div class="rule-list">${RULES_BASIC.map((r, i) => `
      <div class="rule-card">
        <div class="rule-head"><span class="rule-no">${i + 1}</span><h3>${esc(r.th)}</h3><span class="zh">${esc(r.zh)}</span><span class="py">${esc(r.py)}</span></div>
        <div class="rex-row">${r.ex.map(rexHTML).join('')}</div>
      </div>`).join('')}</div>`;
  if (rulesAll) {
    h += `<div class="group-banner"><h3>กฎเพิ่มเติม</h3><span class="zh">补充规则</span></div><div class="rule-list">${RULES_EXTRA.map((g, i) => `
      <div class="rule-card">
        <div class="rule-head"><span class="rule-no">${i + 1}</span><h3>${esc(g.th)}</h3><span class="zh">${esc(g.zh)}</span></div>
        ${g.subs.map(s => `<div class="rule-sub"><h4>${esc(s.th)} <span class="zh">${esc(s.zh)}</span></h4><div class="rex-row">${s.ex.map(rexHTML).join('')}</div></div>`).join('')}
      </div>`).join('')}</div>`;
    h += `<div class="group-banner"><h3>หมวดนำที่เปลี่ยนขีด</h3><span class="zh">注意</span></div><div class="rule-list">${NOTES.map((n, i) => `
      <div class="rule-card">
        <div class="rule-head"><span class="rule-no">${i + 1}</span><h3 class="zh" style="font-size:28px">${esc(n.rad)}</h3></div>
        <p class="rule-text">${esc(n.th)}</p>
        <div class="rex-row">${n.ex.map(rexHTML).join('')}</div>
      </div>`).join('')}</div>`;
  }
  host.innerHTML = h;
  $$('#ruleSeg button').forEach(b => b.onclick = () => { rulesAll = b.dataset.all === '1'; destroyAnimsIn(host); viewRules(host); });
  $$('[data-steps]', host).forEach(el => renderSteps(el.dataset.steps, el, 30));
  $$('[data-anim]', host).forEach(el => new CharAnim(el, el.dataset.anim, 92));
}

/* ---- structure ---- */
function charButtons(list) {
  return `<div class="mini-chars">${(list || []).map(c => `<button data-char="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
}
function structLeaf(n) {
  return `<div class="st-leaf">
    ${n.img ? renderStructCSSDiagram(n.img, n.zh, n.th) : '<div></div>'}
    <div>
      <h4>${esc(n.th)} <span class="zh">${esc(n.zh)}</span></h4>
      ${n.desc ? `<p>${esc(n.desc)}</p>` : ''}
      ${n.tip ? `<span class="st-tip">${esc(ORDER_TIP[n.tip] || '')}</span>` : ''}
      ${n.subPatterns ? `<div class="sp-list">${n.subPatterns.map(sp => `
        <div class="sp-card">${renderSubPatternDiagram(sp.code)}
          <div><b>${esc(sp.label)}</b><p>${esc(sp.desc || '')}</p>${charButtons(sp.chars || sp.examples)}</div>
        </div>`).join('')}</div>` : ''}
      ${n.patterns ? charButtons(n.patterns.flat()) : ''}
    </div>
  </div>`;
}
function structSub(n) {
  const leafy = n.img || n.subPatterns || n.patterns;
  if (leafy) return structLeaf(n) + (n.children || []).map(structSub).join('');
  return `<div class="st-sub" id="st-${esc(n.id).replace(/\./g, '-')}">
    <h3>${esc(n.th)} <span class="zh">${esc(n.zh)}</span></h3>
    ${n.tip ? `<span class="st-tip">${esc(ORDER_TIP[n.tip] || '')}</span>` : ''}
    ${(n.children || []).map(structSub).join('')}
  </div>`;
}
let structAll = false;
function firstLeaf(n) {
  if (n.img) return n;
  for (const c of n.children || []) { const f = firstLeaf(c); if (f) return f; }
  return null;
}
function sampleChars(n, max = 8) {
  const out = [];
  (function walk(x) {
    (x.subPatterns || []).forEach(sp => out.push(...(sp.chars || sp.examples || [])));
    (x.patterns || []).forEach(p => out.push(...p));
    (x.children || []).forEach(walk);
  })(n);
  return [...new Set(out)].slice(0, max);
}
const cleanTitle = t => String(t || '').replace(/\s*—.*$/, '');
function basicCard(n) {
  const leaf = firstLeaf(n);
  return `<div class="st-basic-card">
    ${leaf ? renderStructCSSDiagram(leaf.img, n.zh, '') : ''}
    <h4>${esc(cleanTitle(n.th))}<span class="zh">${esc(n.zh)}</span></h4>
    ${n.tip ? `<span class="st-tip">${esc(ORDER_TIP[n.tip] || '')}</span>` : ''}
    ${charButtons(sampleChars(n))}
  </div>`;
}
function viewStructure(host) {
  const seg = `<div class="toolbar"><div class="seg" id="structSeg">
      <button class="${!structAll ? 'active' : ''}" data-all="0">พื้นฐาน</button>
      <button class="${structAll ? 'active' : ''}" data-all="1">ทั้งหมด</button>
    </div></div>`;
  const bindSeg = () => $$('#structSeg button').forEach(b => b.onclick = () => { structAll = b.dataset.all === '1'; viewStructure(host); });
  if (!structAll) {
    host.innerHTML = seg + STRUCT_TREE.map(n => `
      <section class="st-group">
        <h2>${esc(n.th)} <span class="zh">${esc(n.zh)}</span></h2>
        ${n.children
          ? n.children.map(g => `<div class="st-sub"><h3>${esc(cleanTitle(g.th))} <span class="zh">${esc(g.zh)}</span></h3>
              ${g.tip ? `<span class="st-tip">${esc(ORDER_TIP[g.tip] || '')}</span>` : ''}
              <div class="st-basic-grid">${(g.children && !g.img ? g.children : [g]).map(basicCard).join('')}</div></div>`).join('')
          : `<div class="st-basic-grid">${basicCard(n)}</div>`}
      </section>`).join('');
    bindSeg();
    return;
  }
  const toc = [];
  STRUCT_TREE.forEach(n => (n.children || []).forEach(c => toc.push(c)));
  host.innerHTML = seg + `
    <div class="chips scroll st-toc">${toc.map(c => `<button class="chip" data-jump="st-${esc(c.id).replace(/\./g, '-')}"><span class="zh">${esc(c.zh.replace('结构', ''))}</span>${esc(c.th.replace('โครงสร้าง', ''))}</button>`).join('')}</div>
    ${STRUCT_TREE.map(n => `
      <section class="st-group">
        <h2>${esc(n.th)} <span class="zh">${esc(n.zh)}</span></h2>
        ${n.desc ? `<p>${esc(n.desc)}</p>` : ''}
        ${(n.img || n.subPatterns) ? structLeaf(n) : ''}
        ${(n.children || []).map(structSub).join('')}
      </section>`).join('')}`;
  bindSeg();
  $$('[data-jump]', host).forEach(b => b.onclick = () => {
    const el = document.getElementById(b.dataset.jump);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ============================== SEARCH ============================== */
const HIST_KEY = 'hanzi_v5_history';
const MAX_LOOKUP = 200;   // enough for a full poem (110+ characters)
let lkIO = null;
let lastQuery = '';
let lkAnims = [];
let seqToken = 0;
function renderSearchPage() {
  const host = $('#page-search');
  const q = pendingSearch != null ? pendingSearch : lastQuery;
  pendingSearch = null;
  host.innerHTML = `
    <div class="search-hero">
      <h1>ค้นหา</h1>
      <p></p>
      <form class="bigsearch" id="sForm">
        <input id="sq" value="${esc(q)}" placeholder="我爱你 · shui · น้ำ" aria-label="ค้นหาอักษร พินอิน หรือคำแปล" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">
        <button class="btn primary" type="submit">ค้นหา</button>
      </form>
      <div class="search-hints" id="sHints"></div>
    </div>
    <div id="sResults"></div>`;
  $('#sForm').onsubmit = e => { e.preventDefault(); runSearch($('#sq').value); };
  drawHints();
  if (q) runSearch(q, false); else setTimeout(() => $('#sq') && $('#sq').focus(), 50);
}
function drawHints() {
  const hist = store.get(HIST_KEY, []);
  const ex = ['我爱学习中文', '清晴请情', '水火木', '永', 'น้ำ', 'ren'];
  $('#sHints').innerHTML = (hist.length ? `<span class="lbl">ล่าสุด</span>${hist.map((h, i) => `<span class="hchip" title="${esc(h)}"><span class="hq" data-q="${esc(h)}" role="button" tabindex="0">${esc([...h].length > 10 ? [...h].slice(0, 10).join('') + '…' : h)}</span><span class="x" data-delhist="${i}" role="button" aria-label="ลบ">×</span></span>`).join('')}` : '')
    + `<span class="lbl">${hist.length ? '· ' : ''}ลองค้น</span>${ex.map(e => `<button class="hchip ex" data-q="${esc(e)}">${esc(e)}</button>`).join('')}`;
}
function saveHistory(q) {
  const h = store.get(HIST_KEY, []).filter(x => x !== q);
  h.unshift(q);
  store.set(HIST_KEY, h.slice(0, 8));
}
function runSearch(raw, save = true) {
  const q = String(raw || '').trim();
  lastQuery = q;
  const out = $('#sResults');
  seqToken++;
  lkAnims.forEach(a => a.destroy()); lkAnims = [];
  destroyAnimsIn(out);
  if (!q) { out.innerHTML = ''; return; }
  const allChars = [...q].filter(isHan);
  const chars = allChars.slice(0, MAX_LOOKUP);
  if (chars.length) {
    if (save) { saveHistory(chars.join('')); drawHints(); }
    out.innerHTML = `
      <div class="results-bar">
        <button class="btn primary sm" id="lkSeq">เล่นทีละตัว</button>
        <button class="btn soft sm" id="lkAll">เล่นพร้อมกัน</button>
        <button class="btn soft sm" data-practice="${esc(chars.join(''))}">ฝึกชุดนี้</button>
        <span class="count">${allChars.length > MAX_LOOKUP ? `แสดง ${MAX_LOOKUP} ตัวแรก จาก ${allChars.length} ตัว` : `${chars.length} ตัว`}</span>
      </div>
      <div class="lk-grid">${chars.map((c, i) => {
        const f = getInfo(c);
        return `<div class="lk-card">
          <div class="lk-top">
            <div style="display:flex;gap:12px;align-items:center;min-width:0">
              <span class="lk-no">${i + 1}</span>
              <span class="zh" data-char="${esc(c)}">${esc(c)}</span>
              <div style="min-width:0"><div class="py">${esc(f.py)}</div><div class="th">${esc(f.th)}</div>${f.en ? `<div class="en">${esc(f.en)}</div>` : ''}</div>
            </div>
            <span class="cnt" data-cnt="${i}"></span>
          </div>
          <div class="tian" data-lk="${i}" style="width:168px;height:168px"></div>
          <div class="steps" data-lksteps="${i}"></div>
          <div class="lk-actions">
            <button class="btn soft sm" data-char="${esc(c)}">รายละเอียด</button>
            <button class="btn primary sm" data-practice="${esc(chars.join(''))}" data-focus-idx="${i}">ฝึกเขียน</button>
          </div>
        </div>`;
      }).join('')}</div>`;
    if (lkIO) lkIO.disconnect();
    lkIO = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const card = en.target, i = +card.dataset.i, c = chars[i];
      lkIO.unobserve(card);
      renderSteps(c, card.querySelector('[data-lksteps]'), 32);
      if (hasHW()) loadData(c).then(d => { const el = card.querySelector('[data-cnt]'); if (el) el.textContent = `${d.strokes.length} ขีด`; }).catch(() => {});
    }), { rootMargin: '600px 0px' });
    $$('.lk-card', out).forEach((card, i) => { card.dataset.i = i; lkIO.observe(card); });
    chars.forEach((c, i) => lkAnims.push(new CharAnim(out.querySelector(`[data-lk="${i}"]`), c, 164)));
    $('#lkAll').onclick = () => { seqToken++; lkAnims.forEach(a => { if (a.writer) a.loop(); else a.mode = 'loop'; }); };
    $('#lkSeq').onclick = async () => {
      const my = ++seqToken;
      // only stop writers that exist; the rest stay idle until their turn
      lkAnims.forEach(a => { if (a.writer) a.stop(); else a.mode = 'idle'; });
      for (const a of lkAnims) {
        if (my !== seqToken) return;
        a.host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        await a.playOnce();
      }
    };
    return;
  }
  // text: pinyin / Thai / English
  const pq = plain(q);
  const pool = [...new Set([...Object.keys(CHAR_DECOMP), ...Object.keys(DICT)])];
  const hits = pool.filter(c => {
    const f = getInfo(c);
    return (pq && plain(f.py).startsWith(pq)) || (f.th && f.th.includes(q)) || (pq.length > 2 && plain(f.en).includes(pq));
  }).slice(0, 60);
  const rads = RADICALS.filter(r => (r.meaningTh || '').includes(q) || (pq && plain(r.pinyin).startsWith(pq))).slice(0, 12);
  out.innerHTML = `
    ${hits.length ? `<div class="group-h"><h3>ตัวอักษร</h3><span>${hits.length}</span></div><div class="tiles">${hits.map(c => ctile(c)).join('')}</div>` : ''}
    ${rads.length ? `<div class="group-h"><h3>หมวดนำ</h3><span>${rads.length}</span></div><div class="tiles">${rads.map(r => `
      <button class="tile" data-rad="${r.id}"><span class="no">${r.id}</span><span class="g">${esc(r.radical)}</span><span class="v">${formsHTML(r.transformedForms)}</span><span class="p">${esc(String(r.pinyin).split(',')[0])}</span><span class="t">${esc(r.meaningTh)}</span>${r.meaningEn ? `<span class="e">${esc(r.meaningEn)}</span>` : ''}</button>`).join('')}</div>` : ''}
    ${!hits.length && !rads.length ? '<div class="empty">ไม่พบ ลองพิมพ์คำอื่น</div>' : ''}`;
}

/* ============================== DRAWER ============================== */
let walkTimer = null;
function openDrawer(html) {
  stopWalk();
  destroyAnimsIn($('#drawerBody'));
  $('#drawerBody').innerHTML = html;
  $('#drawer').hidden = false;
  $('#drawerBackdrop').hidden = false;
  $('#drawerBody').scrollTop = 0;
  document.body.classList.add('lock');
}
function closeDrawer() {
  stopWalk();
  if ($('#drawer').hidden) return;
  destroyAnimsIn($('#drawerBody'));
  $('#drawer').hidden = true;
  $('#drawerBackdrop').hidden = true;
  $('#drawerBody').innerHTML = '';
  document.body.classList.remove('lock');
  try { speechSynthesis.cancel(); } catch (e) {}
}
function stopWalk() { if (walkTimer) { clearInterval(walkTimer); walkTimer = null; } }

/** called by core.js (studio "details" button) */
function showChar(ch) { openChar(ch); }

function openChar(ch) {
  const f = getInfo(ch), d = CHAR_DECOMP[ch];
  const comps = d && d.components ? d.components : [];
  openDrawer(`
    <div class="d-head">
      <div class="d-glyph">${esc(ch)}</div>
      <div>
        <div class="d-py">${esc(f.py)}</div>
        <div class="d-th">${esc(f.th || '—')}</div>
        ${f.en ? `<div class="d-en">${esc(f.en)}</div>` : ''}
        <div class="d-chips">
          <span class="d-chip" id="dCount">… ขีด</span>
          ${f.radical ? `<span class="d-chip">หมวดนำ <span class="zh">${esc(f.radical)}</span></span>` : ''}
          ${f.struct ? `<span class="d-chip">${esc(STRUCT_TH[f.struct] || f.struct)}</span>` : ''}
          ${f.liushu ? lsBadge(f.liushu) : ''}
        </div>
      </div>
    </div>
    <div class="d-stage">
      <div class="d-boxes">
        <div class="tian" id="dAnim" style="width:188px;height:188px"></div>
        <div class="tian" id="dComp" style="width:188px;height:188px"></div>
      </div>
      <div class="d-actions">
        <button class="btn primary sm" data-practice-one="${esc(ch)}">ฝึกเขียน</button>
        <button class="btn soft sm" id="dQuiz">ทดสอบ</button>
        <button class="btn soft sm" id="dWalk">ทีละขีด</button>
        <button class="btn soft sm" id="dReplay" aria-label="เล่นใหม่">${I_REPLAY}</button>
        <button class="icon-btn" data-speak="${esc(ch)}" aria-label="ฟังเสียง">${I_SPEAK}</button>
      </div>
      <div class="d-msg" id="dMsg"></div>
    </div>
    ${d ? `<div class="d-card">
      <h4>ที่มา${d.liushuSub ? ' · ' + esc(d.liushuSub) : ''}</h4>
      <p>${esc(d.logicTh)}</p>
      ${d.mnemonicTh ? `<div class="d-tip">${esc(d.mnemonicTh)}</div>` : ''}
      ${d.examples && d.examples.length ? `<ul class="d-ex">${d.examples.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    </div>` : ''}
    ${comps.length ? `<div class="d-card">
      <h4>ชิ้นส่วน</h4>
      <div class="comps">${comps.map((c, i) => {
        const color = COMP_COLORS[i % COMP_COLORS.length];
        return `<div class="comp" data-ci="${i}" style="--cc:${color}">
          <span class="cg">${esc(c.char)}</span>
          <span class="cb">
            <span class="role">${esc(ROLE_SHORT[c.role] || 'ชิ้นส่วน')}${c.position ? ' · ' + esc(c.position) : ''}</span>
            <span class="mean" style="display:block">${c.pinyin ? `<span style="color:${color}">${esc(c.pinyin)}</span> · ` : ''}${esc(c.meaningTh)}</span>
            <span class="meta" id="dRange${i}"></span>
            <span class="acts">
              <button data-hl="${i}">ไฮไลต์ขีด</button>
              ${c.radicalId ? `<button data-rad="${c.radicalId}">หมวดนำ ›</button>` : ((COMP_INDEX[c.char] || []).length > 1 ? `<button data-comp="${esc(c.char)}">อักษรที่มี ›</button>` : '')}
            </span>
          </span>
        </div>`;
      }).join('')}</div>
      <div class="walk" id="dWalkTxt"></div>
    </div>` : '<div class="walk" id="dWalkTxt" style="margin-top:14px"></div>'}
    <div class="d-card"><h4>ลำดับขีด</h4><div class="steps d-steps" id="dSteps"></div></div>`);

  const anim = new CharAnim($('#dAnim'), ch, 184);
  anim.setVisible(true);
  $('#dReplay').onclick = () => { stopWalk(); anim.loop(); $('#dMsg').textContent = ''; };
  $('#dQuiz').onclick = () => {
    stopWalk();
    $('#dMsg').textContent = 'เขียนในกรอบซ้ายตามลำดับขีด';
    anim.quiz({ onComplete: s => { $('#dMsg').textContent = s.totalMistakes ? `เสร็จแล้ว · พลาด ${s.totalMistakes} ครั้ง` : 'ถูกทุกขีด'; } });
  };
  if (!hasHW()) return;

  loadData(ch).then(data => {
    if (!$('#dCount')) return;
    const n = data.strokes.length;
    $('#dCount').textContent = `${n} ขีด`;
    const map = mapStrokesToComponents(ch, data);
    const names = getStrokeNames(ch, data);
    comps.forEach((_, i) => {
      const idx = map.filter(m => m.compIdx === i).map(m => m.strokeIdx + 1);
      const el = $('#dRange' + i);
      if (el && idx.length) el.textContent = idx.length === 1 ? `ขีดที่ ${idx[0]}` : `ขีดที่ ${idx[0]}–${idx[idx.length - 1]}`;
    });
    const drawComp = (active = null, onlyComp = null) => {
      const host = $('#dComp');
      if (!host) return;
      const size = 184;
      host.innerHTML = '';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', HanziWriter.getScalingTransform(size, size, 14).transform);
      data.strokes.forEach((s, j) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', s);
        const sm = map[j];
        const tc = themeColors();
        let fill = sm ? sm.color : tc.stroke, op = 1;
        if (onlyComp !== null) { if (!sm || sm.compIdx !== onlyComp) { fill = tc.outline; op = .9; } }
        else if (active !== null) { if (j > active) { fill = tc.future; op = 1; } else if (j < active) op = .45; }
        p.setAttribute('fill', fill); p.setAttribute('fill-opacity', op);
        g.appendChild(p);
      });
      svg.appendChild(g);
      host.appendChild(svg);
    };
    drawComp();
    const highlight = i => {
      const sm = map[i];
      drawComp(i);
      $$('#dSteps .step').forEach((el, k) => el.classList.toggle('active-step', k === i));
      $$('.comp[data-ci]').forEach(el => el.classList.toggle('on', sm && +el.dataset.ci === sm.compIdx));
      const name = names && names[i] ? ` · <span class="zh">${esc(names[i])}</span> ${esc(strokeTh(names[i]))}` : '';
      const t = $('#dWalkTxt');
      if (t) t.innerHTML = `ขีดที่ ${i + 1}/${n}${name}${sm && sm.comp && comps.length ? ` → อยู่ในชิ้นส่วน <span class="zh">${esc(sm.comp.char)}</span>` : ''}`;
    };
    renderSteps(ch, $('#dSteps'), 56, true, i => { stopWalk(); highlight(i); });
    $$('[data-hl]').forEach(b => b.onclick = e => {
      e.stopPropagation(); stopWalk();
      const ci = +b.dataset.hl;
      drawComp(null, ci);
      $$('.comp[data-ci]').forEach(el => el.classList.toggle('on', +el.dataset.ci === ci));
      $$('#dSteps .step').forEach(el => el.classList.toggle('active-step', +el.dataset.compIdx === ci));
      const t = $('#dWalkTxt'); if (t) t.innerHTML = `ชิ้นส่วน <span class="zh">${esc(comps[ci].char)}</span> ${esc(comps[ci].meaningTh)}`;
    });
    $('#dWalk').onclick = () => {
      stopWalk();
      let cur = 0;
      highlight(cur);
      walkTimer = setInterval(() => {
        cur++;
        if (cur >= n) { stopWalk(); setTimeout(() => { if ($('#dComp')) drawComp(); }, 1200); return; }
        highlight(cur);
      }, 950);
    };
  }).catch(() => {});
}

function openRadical(id) {
  const r = RAD_BY_ID[id];
  if (!r) return;
  const animCh = r.isStandalone ? r.radical : (r.kangxiClassic || r.radical);
  const rel = new Map();
  [...(COMP_INDEX[r.radical] || [])].forEach(x => { if (x && x.char) rel.set(x.char, x); });
  (r.characters || []).forEach(c => { if (!rel.has(c)) rel.set(c, { char: c }); });
  const chars = [...rel.keys()].filter(isHan);
  openDrawer(`
    <div class="d-head">
      <div class="d-glyph">${esc(r.radical)}</div>
      <div>
        <div class="d-en">หมวดนำที่ ${r.id} · ${r.strokes} ขีด</div>
        <div class="d-py">${esc(r.pinyin)}</div>
        <div class="d-th">${zhWrap(r.meaningTh)}</div>
        ${r.meaningEn ? `<div class="d-en">${esc(r.meaningEn)}</div>` : ''}
        <div class="d-chips">
          <span class="d-chip ${r.isStandalone ? '' : 'bound'}">${r.isStandalone ? 'ใช้เป็นตัวอักษรเดี่ยวได้' : 'ใช้เดี่ยวไม่ได้ · เป็นส่วนประกอบเท่านั้น'}</span>
          ${r.colloquialName ? `<span class="d-chip">${zhWrap(r.colloquialName)}</span>` : ''}
          ${r.traditional && r.traditional !== r.radical ? `<span class="d-chip">ตัวเต็ม <span class="zh">${esc(r.traditional)}</span></span>` : ''}
        </div>
      </div>
    </div>
    <div class="d-stage">
      <div class="tian" id="rAnim" style="width:180px;height:180px"></div>
      <div class="d-actions">
        <button class="btn primary sm" data-practice-one="${esc(animCh)}">ฝึกเขียน</button>
        <button class="icon-btn" data-speak="${esc(r.radical)}" aria-label="ฟังเสียง">${I_SPEAK}</button>
      </div>
    </div>
    ${(r.variants || []).length ? `<div class="d-card"><h4>รูปเมื่อเปลี่ยนรูป</h4><div class="var-list">${r.variants.map(v => `
      <div class="var-item"><span class="vg">${esc(v.char)}</span><span><b>${zhWrap(v.colloquialName || '')}${splitForm(v.displayLabel || '').rest ? `<span class="pos">${esc(splitForm(v.displayLabel).rest)}</span>` : ''}</b><small>${v.isStandalone === false ? 'ใช้ประกอบเท่านั้น · ' : ''}${zhWrap(v.note || v.position || '')}</small></span></div>`).join('')}</div></div>` : ''}
    ${(r.position || r.usageNote || r.verificationNote) ? `<div class="d-card">
      ${r.position || r.usageNote ? `<dl class="kv">${r.position ? `<dt>ตำแหน่ง</dt><dd>${esc(r.position)}</dd>` : ''}${r.usageNote ? `<dt>หมายเหตุ</dt><dd>${zhWrap(r.usageNote)}</dd>` : ''}</dl>` : ''}
      ${r.verificationNote ? `<div class="note-card">${zhWrap(r.verificationNote)}</div>` : ''}
    </div>` : ''}
    ${chars.length ? `<div class="d-card"><h4>อักษรในหมวดนี้ · ${chars.length} ตัว</h4><div class="tiles sm">${chars.map(c => ctile(c)).join('')}</div>
      <div class="d-actions" style="margin-top:14px"><button class="btn soft sm" data-practice="${esc(chars.slice(0, 8).join(''))}">ฝึกอักษรในหมวดนี้</button></div></div>` : ''}`);
  const a = new CharAnim($('#rAnim'), animCh, 176);
  a.setVisible(true);
}

function openStroke(i) {
  const s = STROKES[i];
  if (!s) return;
  openDrawer(`
    <div class="d-head">
      <div class="d-glyph">${esc(s.zh)}</div>
      <div>
        <div class="d-py">${esc(s.py)}</div>
        <div class="d-th">เส้น${esc(s.th)}</div>
        <div class="d-chips">${s.basic ? '<span class="d-chip">ขีดพื้นฐาน</span>' : ''}${[...s.zh].map(c => `<span class="d-chip"><span class="zh">${esc(c)}</span> ${esc(PART_TH[c] || '')}</span>`).join('')}</div>
      </div>
    </div>
    <div class="d-stage"><div class="tian" id="sBig" style="width:220px;height:220px"></div></div>
    ${s.tip ? `<div class="d-card"><h4>วิธีเขียน</h4><p>${esc(s.tip)}</p></div>` : ''}
    <div class="d-card"><h4>ในตัวอักษร <span class="zh" style="font-size:18px;color:var(--ink)">${esc(s.src[0])}</span> · ขีดที่ ${s.src[1] + 1}</h4><div id="sSrc"></div></div>
    <div class="d-card"><h4>ตัวอย่าง</h4><div class="d-boxes" style="justify-content:flex-start">${s.ex.map(c => `
      <div style="text-align:center"><div class="tian" data-exanim="${esc(c)}" style="width:110px;height:110px"></div>
      <button class="link-btn" data-char="${esc(c)}"><span class="zh" style="font-size:20px">${esc(c)}</span> ${esc(getInfo(c).th)}</button></div>`).join('')}</div></div>`);
  const sa = new StrokeAnim($('#sBig'), s, 216);
  sa.setVisible(true);
  $$('[data-exanim]', $('#drawerBody')).forEach(el => new CharAnim(el, el.dataset.exanim, 106));
  if (hasHW()) loadData(s.src[0]).then(d => {
    const host = $('#sSrc');
    if (!host) return;
    const svg = stepSVG(d, s.src[1], 96, true);
    [...svg.querySelectorAll('path')].forEach((p, j) => p.setAttribute('fill', j === s.src[1] ? 'var(--accent)' : themeColors().outline));
    host.appendChild(svg);
  }).catch(() => {});
}

function openComponent(cc) {
  const list = COMP_INDEX[cc] || [];
  openDrawer(`
    <div class="d-head"><div class="d-glyph">${esc(cc)}</div>
      <div><div class="d-th">อักษรที่มี 「<span class="zh">${esc(cc)}</span>」</div><div class="d-en">${list.length} ตัว</div></div></div>
    <div class="tiles sm">${list.map(x => ctile(x.char)).join('')}</div>
    ${list.length ? `<div class="d-actions" style="margin-top:16px;justify-content:flex-start"><button class="btn soft sm" data-practice="${esc(list.slice(0, 8).map(x => x.char).join(''))}">ฝึกชุดนี้</button></div>` : ''}`);
}

function openInstall() {
  openDrawer(`
    <div class="d-head"><div class="d-glyph">装</div><div><div class="d-th">ติดตั้งเป็นแอป</div><div class="d-en">iPhone · iPad</div></div></div>
    <div class="d-card"><ol class="install-steps">
      <li>เปิดเว็บนี้ใน <b>Safari</b></li>
      <li>แตะปุ่ม <b>แชร์</b></li>
      <li>เลือก <b>เพิ่มไปยังหน้าจอโฮม</b></li>
    </ol></div>`);
}

/* ============================== PRACTICE ============================== */
const QUEUE_KEY = 'hanzi_v5_queue';
(function restoreQueue() {
  const saved = store.get(QUEUE_KEY, null);
  if (saved && Array.isArray(saved.q) && saved.q.length) {
    studioQueue = saved.q.filter(isHan);
    studioActiveIdx = Math.min(saved.i || 0, studioQueue.length - 1);
  }
  const inp = $('#studioCharInput');
  if (inp) inp.value = studioQueue.join('');
})();

function renderStudioQueue() {
  const host = $('#studioCharPills');
  host.innerHTML = studioQueue.map((ch, i) => `<button class="studio-char-pill ${i === studioActiveIdx ? 'active' : ''}" data-st-idx="${i}" aria-label="${esc(ch)}">${esc(ch)}</button>`).join('');
  $$('.studio-char-pill', host).forEach(b => b.onclick = () => { studioActiveIdx = +b.dataset.stIdx; renderStudioQueue(); loadStudioActiveChar(); });
  const act = host.querySelector('.active');
  if (act) act.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function loadStudioActiveChar() {
  const ch = studioQueue[studioActiveIdx] || '永';
  const f = getInfo(ch), d = CHAR_DECOMP[ch];
  $('#stActiveChar').textContent = ch;
  $('#stActivePy').textContent = f.py || '';
  $('#stActiveTh').textContent = f.th || '';
  $('#stActiveEn').textContent = f.en || '';
  const sum = $('#stCompSummary');
  if (d && d.components && d.components.length > 1) {
    sum.innerHTML = d.components.map(c => `<span class="zh">${esc(c.char)}</span> ${esc(String(c.meaningTh).split(' ')[0])}`).join(' &nbsp;+&nbsp; ')
      + (d.mnemonicTh ? `<div style="margin-top:6px">${esc(d.mnemonicTh)}</div>` : '');
  } else {
    sum.innerHTML = d && d.mnemonicTh ? esc(d.mnemonicTh) : '';
  }
  const animHost = $('#stAnimHost');
  if (studioAnim) studioAnim.destroy();
  animHost.innerHTML = '';
  studioAnim = new CharAnim(animHost, ch, 128);
  studioAnim.setVisible(true);

  studioStrokesHistory = [];
  studioCharHWData = null;
  redrawStudioCanvas();
  $('#stStrokeCountTxt').textContent = 'ชิ้นส่วน';
  $('#stCompSvgHost').innerHTML = '';
  $('#stStepsHost').innerHTML = '';
  store.set(QUEUE_KEY, { q: studioQueue, i: studioActiveIdx });

  if (!hasHW()) return;
  loadData(ch).then(data => {
    if (studioQueue[studioActiveIdx] !== ch) return;
    studioCharHWData = data;
    $('#stStrokeCountTxt').textContent = `${data.strokes.length} ขีด`;
    const map = mapStrokesToComponents(ch, data);
    const size = 128;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', HanziWriter.getScalingTransform(size, size, 10).transform);
    data.strokes.forEach((s, j) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', s);
      p.setAttribute('fill', map[j] ? map[j].color : themeColors().stroke);
      g.appendChild(p);
    });
    svg.appendChild(g);
    $('#stCompSvgHost').appendChild(svg);
    renderSteps(ch, $('#stStepsHost'), 44, true);
    redrawStudioCanvas();
  }).catch(() => {});
}

function openInPencilStudio(charsStr, focusChar = null, focusIdx = null) {
  const list = [...(charsStr || '')].filter(isHan);
  if (list.length) {
    studioQueue = list;
    studioActiveIdx = focusIdx != null && focusIdx < list.length ? focusIdx
      : (focusChar && studioQueue.includes(focusChar) ? studioQueue.indexOf(focusChar) : 0);
  } else if (focusChar) {
    if (!studioQueue.includes(focusChar)) studioQueue.unshift(focusChar);
    studioActiveIdx = studioQueue.indexOf(focusChar);
  }
  $('#studioCharInput').value = studioQueue.join('');
  closeDrawer();
  if (location.hash !== '#practice') location.hash = '#practice';
  renderStudioQueue();
  loadStudioActiveChar();
  setTimeout(resizeStudioCanvases, 60);
}

function setupPracticeExtras() {
  const ed = $('#queueEditor'), btn = $('#editQueueBtn');
  btn.onclick = () => {
    const open = ed.hidden;
    ed.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) { $('#studioCharInput').focus(); $('#studioCharInput').select(); }
  };
  const presets = [{ title: 'ทดลองพู่กัน', chars: '永' }, ...practiceSets().slice(0, 8)].map(s => ({ title: s.title, chars: Array.isArray(s.chars) ? s.chars.join('') : s.chars }));
  $('#queuePresets').innerHTML = presets.map(p => `<button data-preset="${esc(p.chars)}">${esc(p.title)}<span class="zh">${esc(p.chars.slice(0, 6))}</span></button>`).join('');
  $$('[data-preset]').forEach(b => b.onclick = () => { $('#studioCharInput').value = b.dataset.preset; $('#studioLoadBtn').click(); });
  // close the editor after loading a new set
  $('#studioLoadBtn').addEventListener('click', () => { ed.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
  // core.js loads the queue but does not persist it
  const save = () => store.set(QUEUE_KEY, { q: studioQueue, i: studioActiveIdx });
  ['#stPrevCharBtn', '#stNextCharBtn', '#studioLoadBtn'].forEach(s => $(s).addEventListener('click', () => setTimeout(save, 0)));
  window.addEventListener('resize', () => { if ($('#page-practice').classList.contains('on')) resizeStudioCanvases(); });
}

/* ============================== GLOBAL CLICKS ============================== */
document.addEventListener('click', e => {
  if (e.target.id === 'drawerBackdrop' || e.target.closest('#drawerClose')) { closeDrawer(); return; }
  const t = e.target.closest('[data-practice],[data-practice-one],[data-char],[data-rad],[data-comp],[data-stroke],[data-speak],[data-q],[data-delhist],[data-install]');
  if (!t) return;
  const d = t.dataset;
  if (d.practice) return openInPencilStudio(d.practice, d.focus || null, d.focusIdx != null ? +d.focusIdx : null);
  if (d.practiceOne) return openInPencilStudio(null, d.practiceOne);
  if (d.speak) return speak(d.speak);
  if (d.delhist !== undefined) {
    e.stopPropagation();
    const h = store.get(HIST_KEY, []); h.splice(+d.delhist, 1); store.set(HIST_KEY, h); drawHints(); return;
  }
  if (d.q) { const inp = $('#sq'); if (inp) inp.value = d.q; runSearch(d.q); return; }
  if (d.install !== undefined) return openInstall();
  if (d.char) return openChar(d.char);
  if (d.rad) return openRadical(+d.rad);
  if (d.comp) return openComponent(d.comp);
  if (d.stroke !== undefined) return openStroke(+d.stroke);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDrawer();
  if (e.key === 'Enter' && e.target.matches('.stroke-tile')) openStroke(+e.target.dataset.stroke);
  if (e.key === '/' && !e.target.matches('input, textarea')) { e.preventDefault(); location.hash = '#search'; }
});

/* ============================== SAVE IMAGE (with credit) ============================== */
function saveHandwriting() {
  const src = $('#stInkCanvas');
  const ch = studioQueue[studioActiveIdx] || '字';
  const out = document.createElement('canvas');
  out.width = src.width; out.height = src.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(src, 0, 0);
  const fs = Math.max(11, Math.round(out.width * 0.022));
  ctx.font = `600 ${fs}px "IBM Plex Sans Thai", sans-serif`;
  ctx.fillStyle = 'rgba(27, 31, 42, .45)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Designed by 李牧飞 Aphisit Kaewnet', out.width - fs * 1.6, out.height - fs * 1.4);
  const a = document.createElement('a');
  a.download = `中文很难-${ch}.png`;
  a.href = out.toDataURL('image/png');
  a.click();
}

/* ============================== THEME ============================== */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#14161c' : '#f6f4f0');
  // the writing board keeps its paper colour; redraw so the grid matches
  if (typeof redrawStudioCanvas === 'function') redrawStudioCanvas();
}
$('#themeBtn').onclick = () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('hanzi_theme', next); } catch (e) {}
  applyTheme(next);
  // animations bake their colours in when created, so redraw the current screen
  const y = window.scrollY;
  route();
  if ($('#page-practice').classList.contains('on')) {
    // keep what the learner has written; only rebuild the reference animation + steps
    const ch = studioQueue[studioActiveIdx] || '永';
    if (studioAnim) studioAnim.destroy();
    $('#stAnimHost').innerHTML = '';
    studioAnim = new CharAnim($('#stAnimHost'), ch, 128);
    studioAnim.setVisible(true);
    renderSteps(ch, $('#stStepsHost'), 44, true);
  }
  window.scrollTo(0, y);
};
applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

/* ============================== START ============================== */
initPencilProStudio();
$('#stSaveImgBtn').onclick = saveHandwriting;
setupPracticeExtras();
route();

if (false && 'serviceWorker' in navigator && location.protocol === 'https:') {   // inside new offy the app's own service worker is not used
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
