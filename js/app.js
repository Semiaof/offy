'use strict';
/* =====================================================================
   Library of Limu · new offy v4 — app
   appearance · home · learn · stage map · custom deck · dictionary
   statistics · library · settings · routes · boot
   ===================================================================== */

/* ---------- global appearance ---------- */
const currentTheme = () => S().theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function applySettings() {
  const s = S(), theme = currentTheme();
  document.documentElement.dataset.theme = theme;
  document.body.classList.toggle('hide-pinyin', !s.showPinyin);
  document.body.classList.toggle('hide-th', !s.showTh);
  document.body.classList.toggle('hide-en', !s.showEn);
  const r = document.documentElement.style;
  r.setProperty('--s-hz', s.scale.hz / 100); r.setProperty('--s-mean', s.scale.mean / 100);
  r.setProperty('--s-ex', s.scale.ex / 100); r.setProperty('--s-dict', s.scale.dict / 100);
  [1, 2, 3, 4].forEach(n => r.setProperty('--f' + n, (s.front['s' + n] || 100) / 100));
  applyColors(theme);
  $$('.js-theme use').forEach(u => u.setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon'));
  $$('.js-pinyin').forEach(b => { b.classList.toggle('off', !s.showPinyin); b.querySelector('use').setAttribute('href', s.showPinyin ? '#i-eye' : '#i-eye-off'); });
  $$('.js-sound').forEach(b => { b.classList.toggle('off', !s.sfx); b.querySelector('use').setAttribute('href', s.sfx ? '#i-vol' : '#i-mute'); });
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = theme === 'dark' ? '#0e1217' : '#f1ede3';
  Sfx.setVol();
  if (typeof Scene !== 'undefined' && Scene.cv && Scene.cv.isConnected) Scene.draw();
}
/** custom colours: every shade is derived from the few colours picked in settings, for the current theme.
    An empty value removes the override, so the built-in palette in the stylesheet applies again. */
function applyColors(theme = currentTheme()) {
  const c = S().colors || {}, st = document.documentElement.style, dark = theme === 'dark';
  const put = o => Object.entries(o).forEach(([k, v]) => { if (v == null) st.removeProperty(k); else st.setProperty(k, v); });
  const A = Color.ok(c.accent) ? c.accent : null;
  // app accent (buttons, links, active states, calendar)
  if (A) {
    const a = dark ? Color.bright(A, .3) : A, base = dark ? '#1c222b' : '#e6e0d1';
    put({
      '--accent': a, '--accent-hover': dark ? Color.mix(a, '#ffffff', .16) : Color.mix(a, '#000000', .14),
      '--on-accent': Color.lum(a) > .42 ? '#111411' : '#ffffff', '--accent-soft': Color.alpha(a, dark ? .16 : .13),
      '--accent-ink': dark ? Color.mix(a, '#ffffff', .18) : Color.deep(A, .17),
      '--h1': Color.mix(base, a, .3), '--h2': Color.mix(base, a, .55), '--h3': Color.mix(base, a, .8), '--h4': dark ? Color.mix(a, '#ffffff', .15) : Color.mix(a, '#000000', .12)
    });
  } else put({ '--accent': null, '--accent-hover': null, '--on-accent': null, '--accent-soft': null, '--accent-ink': null, '--h1': null, '--h2': null, '--h3': null, '--h4': null });
  // card table — follows the accent unless picked separately; kept dark enough for the white labels on it
  const F0 = Color.ok(c.felt) ? c.felt : (A ? Color.mix(A, '#000000', .18) : null);
  if (F0) {
    const F = Color.deep(F0, .16);
    put(dark ? { '--felt-a': Color.mix(F, '#000000', .16), '--felt-b': Color.mix(F, '#000000', .34), '--felt-c': Color.mix(F, '#000000', .54) }
      : { '--felt-a': Color.mix(F, '#ffffff', .12), '--felt-b': F, '--felt-c': Color.mix(F, '#000000', .26) });
  } else put({ '--felt-a': null, '--felt-b': null, '--felt-c': null });
  // the card itself: paper, hanzi ink, pinyin
  const P = Color.ok(c.paper) ? c.paper : null, I = Color.ok(c.ink) ? c.ink : null, Y = Color.ok(c.pinyin) ? c.pinyin : null;
  if (P || I || Y || A) {
    const p = P || (dark ? '#f7f3e8' : '#fffdf8'), light = Color.lum(p) > .38;
    const ink = I || (light ? '#1a1a18' : '#f2f2ec');
    const py = Y || (A ? (light ? Color.deep(A, .2) : Color.bright(A, .42)) : (light ? '#24507a' : '#a8cdef'));
    put({ '--paper': p, '--paper-ink': ink, '--paper-line': Color.mix(p, ink, .1), '--paper-muted': Color.mix(p, ink, .6), '--paper-soft': Color.mix(p, ink, .06), '--paper-chip': Color.mix(p, py, .14), '--paper-py': py });
  } else put({ '--paper': null, '--paper-ink': null, '--paper-line': null, '--paper-muted': null, '--paper-soft': null, '--paper-chip': null, '--paper-py': null });
}
/** switch theme with a circular reveal from the button that was pressed */
function setTheme(next, origin) {
  const apply = () => { S().theme = next; applySettings(); Store.save(); };
  const before = currentTheme(), after = next || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (before === after || !document.startViewTransition || reducedMotion()) { apply(); return; }
  const r = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : null;
  const x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight / 2;
  const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  try {
    const root = document.documentElement; root.dataset.vtTheme = '1';          // the menu bar joins the circular reveal instead of fading on its own
    const vt = document.startViewTransition(apply);
    vt.finished.finally(() => delete root.dataset.vtTheme).catch(() => { }); vt.updateCallbackDone.catch(() => { });
    vt.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] }, { duration: 640, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => { });
  } catch (e) { apply(); }
}
function toggleTheme(e) { sfx('pop'); setTheme(currentTheme() === 'dark' ? 'light' : 'dark', e && e.currentTarget); }
function togglePinyin() { const s = S(); s.showPinyin = !s.showPinyin; applySettings(); Store.save(); sfx(s.showPinyin ? 'on' : 'off'); toast(s.showPinyin ? `${T('แสดงพินอิน')}` : `${T('ซ่อนพินอิน ฝึกอ่านจากตัวจีนล้วน')}`, { icon: s.showPinyin ? 'eye' : 'eye-off', ms: 1800 }); }
function toggleSound() { const s = S(); s.sfx = !s.sfx; if (s.sfx && !s.vol) s.vol = 60; applySettings(); Store.save(); if (s.sfx) sfx('on'); toast(s.sfx ? `${T('เปิดเสียงเอฟเฟกต์')}` : `${T('ปิดเสียงเอฟเฟกต์')}`, { icon: s.sfx ? 'vol' : 'mute', ms: 1600 }); }
function aboutDlg() { modal({ title: 'Library of Limu', html: `${T('คลังคำศัพท์ HSK 3.0 · ฝึกจำ ฝึกฟัง ฝึกเขียน')}<br><br>${T('อภิสิทธิ์ แก้วเนตร')} · Aphisit Kaewnet<br><span class="hz" style="font-size:24px;color:var(--ink)">大家好</span>` }); }

const STATUS_NAME = { new: `${T('ยังไม่เคยเล่น')}`, learning: `${T('กำลังเรียน')}`, mastered: `${T('จำได้แล้ว')}`, review: `${T('รอทบทวน')}` };
function wordRowHTML(w, opts = {}) {
  const st = Stats.status(w.id);
  // the word list shows its running number instead of the status dot (the status filter still works)
  const lead = opts.n ? `<span class="wr-n">${opts.n}</span>` : `<span class="mdot ${st}" title="${STATUS_NAME[st]}"></span>`;
  return `<div class="wr${opts.n ? ' num' : ''}" data-id="${esc(w.id)}">${lead}
    <span class="wr-zh">${esc(w.zh)}</span>
    <span class="wr-i"><span class="wr-py pyx">${esc(w.py)}</span><span class="wr-m">${meanHTML(w)}</span></span>
    ${opts.badges ? `<span class="wr-b">${lvlBadge(w.lvl)}${posBadge(w)}</span>` : ''}
    <button class="ibtn sm" data-speak="${esc(w.id)}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></div>`;
}
function emptyHTML(icon, title, text, btn = '') { return `<div class="empty"><div class="e-ic">${ic(icon)}</div><b>${title}</b>${text}${btn}</div>`; }

/* Home, Learn, the stage road and the insights dashboard live in js/views.js */

/* ---------- PRACTICE: custom deck builder ---------- */
const SEC_CHOICES = [5, 6, 8, 10, 15, 20, 30];
const Custom = {
  c: null,
  defaults() { const s = S(); return { type: 'flash', mode: 'manual', count: '', cats: [], stages: {}, picked: [], timer: s.timer, sec: s.sec, answer: s.answer, ask: s.ask, ans: 'draw', repeat: 2, rate: s.rate, meanHint: true, strict: true }; },
  init() {
    const seg = (id, key, conv = x => x) => $(id).addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; this.c[key] = conv(b.dataset.v); this.render(); });
    $('#cType').addEventListener('click', e => { const b = e.target.closest('[data-game]'); if (!b) return; this.c.type = b.dataset.game; sfx('pop'); this.render(); });
    $('#cPasteAdd').onclick = () => this.paste();
    seg('#cMode', 'mode'); seg('#cQuiz', 'answer'); seg('#cAns', 'ans'); seg('#cAsk', 'ask'); seg('#cTimer', 'timer'); seg('#cRepeat', 'repeat', Number);
    $('#cSec').innerHTML = SEC_CHOICES.map(n => `<button class="chip" data-n="${n}">${n} ${T('วิ')}</button>`).join('');
    $('#cSec').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; this.c.sec = +b.dataset.n; this.render(); });
    $('#cCount').addEventListener('input', e => { this.c.count = e.target.value; this.renderSummary(); this.renderCountChips(); });
    $('#cCountChips').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; this.c.count = this.c.count === b.dataset.n ? '' : b.dataset.n; $('#cCount').value = this.c.count; this.renderCountChips(); this.renderSummary(); });
    $('#cRate').oninput = e => { this.c.rate = +e.target.value; $('#cRateVal').textContent = rateTxt(this.c.rate); };
    $('#cMeanHint').onchange = e => { this.c.meanHint = e.target.checked; };
    $('#cStrict').onchange = e => { this.c.strict = e.target.checked; };
    // level chips (multi-select)
    $('#cCats').addEventListener('click', e => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      const all = this.catList(), k = b.dataset.k;
      if (k === 'ALL') this.c.cats = this.c.cats.length === all.length ? [] : all.map(x => x.k);
      else if (this.c.cats.includes(k)) this.c.cats = this.c.cats.filter(x => x !== k);
      else this.c.cats.push(k);
      this.c.cats.sort((a, b2) => all.findIndex(x => x.k === a) - all.findIndex(x => x.k === b2));
      this.c.cats.forEach(c => { if (c !== 'C' && !this.c.stages[c]) this.c.stages[c] = Array.from({ length: stageCount(+c) }, (_, i) => i + 1); });
      Object.keys(this.c.stages).forEach(c => { if (!this.c.cats.includes(c)) delete this.c.stages[c]; });
      this.renderCats(); this.renderStages(); this.renderSummary();
    });
    // stage chips: tap toggles one stage; a sideways drag paints many; vertical movement scrolls the page
    const wrap = $('#cStagesWrap'); let drag = null;
    const chipAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest ? el.closest('.stage-chips button') : null; };
    const apply = btn => { if (!btn || !drag) return; const k = btn.dataset.k, n = +btn.dataset.n; const set = new Set(this.c.stages[k] || []); const had = set.has(n); if (drag.on) set.add(n); else set.delete(n); this.c.stages[k] = [...set].sort((a, b) => a - b); btn.classList.toggle('on', drag.on); if (had !== drag.on) sfx('tap'); };
    const finish = () => { drag = null; this.renderStages(); this.renderSummary(); };
    wrap.addEventListener('pointerdown', e => { const btn = e.target.closest('.stage-chips button'); if (!btn) return; drag = { btn, x: e.clientX, y: e.clientY, on: !btn.classList.contains('on'), started: false, id: e.pointerId }; });
    addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.started) { const dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y); if (dx < 8 && dy < 8) return; if (dy > dx) { drag = null; return; } drag.started = true; apply(drag.btn); }
      apply(chipAt(e.clientX, e.clientY));
    });
    addEventListener('pointerup', e => { if (!drag || e.pointerId !== drag.id) return; if (!drag.started) apply(drag.btn); finish(); });
    addEventListener('pointercancel', () => { if (drag) { const st = drag.started; drag = null; if (st) finish(); } });
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-allk],[data-nonek]'); if (!b) return;
      if (b.dataset.allk) this.c.stages[b.dataset.allk] = Array.from({ length: stageCount(+b.dataset.allk) }, (_, i) => i + 1);
      else this.c.stages[b.dataset.nonek] = [];
      this.renderStages(); this.renderSummary();
    });
    // search & pick specific words
    const doSearch = debounce(() => this.renderSearch(), 140);
    $('#cSearch').addEventListener('input', doSearch);
    $('#cSearchClr').onclick = () => { $('#cSearch').value = ''; this.renderSearch(); };
    $('#cSearchRes').addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (!b) return; const id = b.dataset.add; if (!this.c.picked.includes(id)) this.c.picked.push(id); else this.c.picked = this.c.picked.filter(x => x !== id); this.renderSearch(); this.renderPicked(); this.renderSummary(); });
    $('#cPicked').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; this.c.picked = this.c.picked.filter(x => x !== b.dataset.rm); this.renderPicked(); this.renderSearch(); this.renderSummary(); });
    $('#mwAdd').onclick = () => this.addMyWord();
    $('#myWordsList').addEventListener('click', async e => {
      const b = e.target.closest('[data-delmw]'); if (!b) return;
      const zh = b.dataset.delmw;
      if (!(await confirmDlg(`${T('ลบคำนี้')}?`, `${T('ลบ')} “${zh}” ${T('ออกจากคำของฉัน')}`, `${T('ลบ')}`, true))) return;
      removeMyWord(zh); this.render();
    });
    $('#cRandomize').onclick = () => this.randomize();
    $('#cCreate').onclick = () => this.create();
  },
  catList() {
    const list = LEVELS.filter(l => levelWords(l).length).map(l => ({ k: String(l), name: `HSK ${l}`, n: levelWords(l).length }));
    if (levelWords('C').length) list.push({ k: 'C', name: `${T('คำของฉัน')}`, n: levelWords('C').length });
    return list;
  },
  show(arg) {
    if (!this.c) { this.c = Object.assign(this.defaults(), Store.d.customCfg || {}); this.c.picked = []; }
    // drop stale categories (e.g. my-words deleted)
    const valid = this.catList().map(x => x.k);
    this.c.cats = (this.c.cats || []).filter(k => valid.includes(k));
    Object.keys(this.c.stages || {}).forEach(k => { if (!valid.includes(k)) delete this.c.stages[k]; else this.c.stages[k] = this.c.stages[k].filter(n => n <= stageCount(+k)); });
    this.c.picked = this.c.picked.filter(id => BY_ID.has(id));
    if (arg === 'tingxie') this.c.type = 'tingxie';
    if (arg === 'flash') this.c.type = 'flash';
    if (arg === 'review') this.c.mode = 'review';
    this.render();
  },
  render() {
    const c = this.c;
    if (!GAME_BY_ID[c.type]) c.type = 'flash';
    $('#cType').innerHTML = gamePickerHTML(c.type); segSet($('#cMode'), c.mode); segSet($('#cQuiz'), c.answer); segSet($('#cAns'), c.ans); segSet($('#cAsk'), c.ask); segSet($('#cTimer'), c.timer); segSet($('#cRepeat'), c.repeat);
    const rv = Stats.reviewIds().length;
    $('#cReviewCnt').textContent = rv; $('#cReviewCnt').hidden = !rv;
    $('#cCount').value = c.count; $('#cCount').placeholder = c.mode === 'random' ? '20' : `${T('ทั้งหมด')}`;
    $$('#cSec .chip').forEach(b => b.classList.toggle('on', +b.dataset.n === +c.sec)); $('#cSec').hidden = c.timer !== 'countdown';
    $('#cRate').value = c.rate; rangeFill($('#cRate')); $('#cRateVal').textContent = rateTxt(c.rate);
    $('#cMeanHint').checked = c.meanHint; $('#cStrict').checked = c.strict;
    $('#cFlashOpts').hidden = c.type !== 'flash';
    $('#cDictOpts').hidden = c.type !== 'tingxie';
    $('#cStrictRow').hidden = c.ans !== 'type';
    $('#cPickBox').hidden = c.mode !== 'manual';
    $('#cCatHint').textContent = c.mode === 'manual' ? `${T('เลือกระดับ แล้วเลือกด่าน')}` : `${T('ไม่เลือก = ทุกระดับ')}`;
    this.renderCountChips(); this.renderCats(); this.renderStages(); this.renderPicked(); this.renderSearch(); this.renderMyWords(); this.renderSummary();
  },
  renderCountChips() { $$('#cCountChips .chip').forEach(b => b.classList.toggle('on', b.dataset.n === String(this.c.count))); },
  renderCats() {
    const list = this.catList(), c = this.c;
    const allOn = list.length > 0 && list.every(x => c.cats.includes(x.k));
    $('#cCats').innerHTML = list.map(x => `<button class="chip ${c.cats.includes(x.k) ? 'on' : ''}" data-k="${x.k}" style="--c:${lvlColor(x.k === 'C' ? 'C' : +x.k)}"><span class="dot"></span>${x.name}<small>${fmtNum(x.n)}</small></button>`).join('')
      + `<button class="chip ${allOn ? 'on' : ''}" data-k="ALL">${T('ทั้งหมด')}</button>`;
  },
  renderStages() {
    const c = this.c, wrap = $('#cStagesWrap');
    if (c.mode !== 'manual') { wrap.innerHTML = ''; return; }
    if (!c.cats.length) { wrap.innerHTML = `<p class="hint-p">${T('เลือกระดับก่อน แล้วเลือกด่านที่ต้องการ ลากนิ้วผ่านหลายด่านเพื่อเลือกทีเดียวได้')}</p>`; return; }
    wrap.innerHTML = c.cats.map(k => {
      if (k === 'C') return `<div class="stage-group"><div class="gh" style="--c:var(--hskC)"><span class="dot"></span>${T('คำของฉัน')}<span class="badge">${levelWords('C').length} ${T('คำ · ใช้ทั้งหมด')}</span></div></div>`;
      const n = stageCount(+k), on = new Set(c.stages[k] || []);
      let chips = ''; for (let i = 1; i <= n; i++) chips += `<button type="button" class="${on.has(i) ? 'on' : ''}" data-k="${k}" data-n="${i}">${i}</button>`;
      return `<div class="stage-group"><div class="gh" style="--c:${lvlColor(+k)}"><span class="dot"></span>HSK ${k}<span class="badge">${on.size}/${n} ${T('ด่าน')}</span><span class="sp"></span>
        <button class="btn sm ghost" data-allk="${k}">${T('ทั้งหมด')}</button><button class="btn sm ghost" data-nonek="${k}">${T('ล้าง')}</button></div>
        <div class="stage-chips">${chips}</div></div>`;
    }).join('');
  },
  renderSearch() {
    const q = $('#cSearch').value.trim(), box = $('#cSearchRes');
    if (!q) { box.innerHTML = ''; return; }
    const res = Dict.search(q, WORDS).slice(0, 30);
    box.innerHTML = res.length ? res.map(w => { const on = this.c.picked.includes(w.id); return `<div class="sr"><span class="hz">${esc(w.zh)}</span><div class="t"><span class="pyx">${esc(w.py)}</span>${lvlBadge(w.lvl)}<br>${esc(meaningText(w))}</div><button class="btn sm ${on ? 'good' : 'soft'}" data-add="${esc(w.id)}">${on ? `${ic('check')}${T('เพิ่มแล้ว')}` : `${ic('plus')}${T('เพิ่ม')}`}</button></div>`; }).join('') : `<p class="hint-p" style="padding:6px 4px">${T('ไม่พบคำศัพท์')}</p>`;
  },
  renderPicked() {
    $('#cPicked').innerHTML = this.c.picked.map(id => { const w = BY_ID.get(id); return w ? `<span class="wchip"><span class="hz">${esc(w.zh)}</span><button class="rm" data-rm="${esc(id)}" aria-label="${T('เอาออก')}">${ic('x')}</button></span>` : ''; }).join('');
  },
  renderMyWords() {
    $('#myWordsList').innerHTML = levelWords('C').map(w => `<span class="wchip"><span class="hz">${esc(w.zh)}</span><small class="pyx">${esc(w.py)}</small><button class="rm" data-delmw="${esc(w.zh)}" aria-label="${T('ลบ')}">${ic('x')}</button></span>`).join('');
  },
  addMyWord() {
    const zh = $('#mwZh').value.trim(), py = $('#mwPy').value.trim(), th = $('#mwTh').value.trim(), en = $('#mwEn').value.trim();
    if (!zh || !py) { toast(`${T('กรอกตัวจีนและพินอินให้ครบ')}`); return; }
    if (!/[㐀-鿿]/.test(zh)) { toast(`${T('ช่องตัวจีนต้องมีอักษรจีนอย่างน้อย 1 ตัว')}`); return; }
    if (!th && !en) { toast(`${T('ใส่ความหมายไทยหรืออังกฤษอย่างน้อย 1 ช่อง')}`); return; }
    if (Store.d.customWords.some(w => w.zh === zh && w.py === py)) { toast(`${T('มีคำนี้อยู่แล้ว')}`); return; }
    Store.d.customWords.push({ zh, py, th, en }); Store.save(); buildWords();
    const id = `C:${zh}:${py}`; if (!this.c.picked.includes(id)) this.c.picked.push(id);
    ['#mwZh', '#mwPy', '#mwTh', '#mwEn'].forEach(s => $(s).value = '');
    sfx('save'); toast(`${T('เพิ่ม')} “${zh}” ${T('แล้ว และใส่ลงสำรับนี้')}`, { icon: 'check' }); this.render();
  },
  /** returns {words, label, poolSize} for the current configuration */
  build() {
    const c = this.c; let pool = [], label = '';
    const cats = c.cats.length ? c.cats : this.catList().map(x => x.k);
    const catName = k => k === 'C' ? `${T('คำของฉัน')}` : 'HSK ' + k;
    if (c.mode === 'manual') {
      const parts = [];
      c.cats.forEach(k => {
        if (k === 'C') { pool.push(...levelWords('C')); parts.push(`${T('คำของฉัน')}`); return; }
        const st = c.stages[k] || []; if (!st.length) return;
        st.forEach(n => pool.push(...stageWords(+k, n)));
        parts.push(`${catName(k)} ${st.length === stageCount(+k) ? `${T('ทุกด่าน')}` : `${T('ด่าน')} ${compactRange(st)}`}`);
      });
      const extra = c.picked.map(id => BY_ID.get(id)).filter(Boolean);
      const ids = new Set(pool.map(w => w.id)); extra.forEach(w => { if (!ids.has(w.id)) { pool.push(w); ids.add(w.id); } });
      if (extra.length) parts.push(`+${extra.length} ${T('คำที่เลือก')}`);
      label = parts.join(', ');
    } else if (c.mode === 'random') {
      cats.forEach(k => pool.push(...levelWords(k === 'C' ? 'C' : +k)));
      label = `${T('สุ่มจาก')} ${c.cats.length ? c.cats.map(catName).join(', ') : `${T('ทุกระดับ')}`}`;
    } else {
      const set = new Set(cats.map(String));
      pool = Stats.reviewIds().map(id => BY_ID.get(id)).filter(w => w && set.has(String(w.lvl)));
      label = `${T('คำที่ตอบผิดและคำที่ถึงรอบทบทวน')}`;
    }
    let n = parseInt(c.count, 10);
    if (c.mode === 'random' && !(n > 0)) n = 20;
    let words = shuffle(pool);
    if (n > 0 && words.length > n) words = words.slice(0, n);
    return { words, label, poolSize: pool.length };
  },
  renderSummary() {
    const { words, label, poolSize } = this.build(), el = $('#cSummary');
    if (!words.length) {
      el.innerHTML = `<span>${this.c.mode === 'review' ? (Stats.reviewIds().length ? `${T('ไม่มีคำทบทวนในระดับที่เลือก')}` : `${T('ยังไม่มีคำที่ต้องทบทวน')}`) : (this.c.mode === 'manual' ? `${T('ยังไม่ได้เลือกด่านหรือคำศัพท์')}` : `${T('ไม่มีคำศัพท์')}`)}</span>`;
      $('#cCreate').disabled = true; return;
    }
    $('#cCreate').disabled = false;
    el.innerHTML = `<b>${fmtNum(words.length)}</b> ${T('คำ')}${poolSize > words.length ? ` ${T('จาก')} ${fmtNum(poolSize)}` : ''}<span>${esc(label)}</span>`;
  },
  /** paste a list of words (from a teacher, a textbook…): each piece is looked up; pieces without spaces are split into known words */
  paste() {
    const raw = $('#cPaste').value.trim(); if (!raw) { toast(L('วางคำศัพท์ก่อน', 'Paste some words first')); return; }
    const byZh = new Map(); WORDS.forEach(w => { const o = byZh.get(w.zh); if (!o || (o.custom && !w.custom) || (+w.lvl < +o.lvl)) byZh.set(w.zh, w); });
    const found = [], missing = [];
    const take = piece => {
      const a = Array.from(piece);
      for (let i = 0; i < a.length;) {
        let k = Math.min(6, a.length - i);
        for (; k > 0; k--) if (byZh.has(a.slice(i, i + k).join(''))) break;
        if (!k) { missing.push(a[i]); i++; continue; }
        found.push(byZh.get(a.slice(i, i + k).join(''))); i += k;
      }
    };
    raw.split(/[\s,，、;；。.!！?？\/|]+/).filter(Boolean).forEach(p => {
      if (/[㐀-鿿]/.test(p)) { take(p.replace(/[^㐀-鿿]/g, '')); return; }
      const q = p.toLowerCase(), hit = WORDS.find(w => w._py === pyPlain(q) && pyPlain(q).length > 1) || WORDS.find(w => w._th === q || w._en === q);
      if (hit) found.push(hit); else missing.push(p);
    });
    const c = this.c; let added = 0;
    found.forEach(w => { if (!c.picked.includes(w.id)) { c.picked.push(w.id); added++; } });
    if (added && c.mode !== 'manual') c.mode = 'manual';
    const miss = [...new Set(missing)].filter(x => x.trim());
    $('#cPasteMsg').textContent = (added ? L(`เพิ่ม ${added} คำลงสำรับแล้ว`, `Added ${added} words`) : L('ไม่มีคำใหม่ที่เพิ่มได้', 'Nothing new to add')) + (miss.length ? L(` · ไม่พบ: ${miss.slice(0, 12).join(' ')}${miss.length > 12 ? ' …' : ''} (เพิ่มเป็น "คำของฉัน" ได้)`, ` · not found: ${miss.slice(0, 12).join(' ')}${miss.length > 12 ? ' …' : ''}`) : '');
    if (added) { $('#cPaste').value = ''; sfx('save'); }
    this.render();
  },
  randomize() {
    const c = this.c, list = this.catList().filter(x => x.k !== 'C');
    if (!list.length) return;
    c.mode = 'manual';
    const k = list[Math.floor(Math.random() * list.length)].k;
    c.cats = [k];
    const n = stageCount(+k), len = 1 + Math.floor(Math.random() * Math.min(4, n)), start = 1 + Math.floor(Math.random() * (n - len + 1));
    c.stages = { [k]: Array.from({ length: len }, (_, i) => start + i) };
    c.count = String([10, 15, 20, 30][Math.floor(Math.random() * 4)]);
    c.timer = Math.random() < 0.65 ? 'countdown' : 'stopwatch';
    c.sec = [8, 10, 15][Math.floor(Math.random() * 3)];
    if (c.type === 'flash') { c.answer = Math.random() < 0.6 ? 'quiz' : 'self'; c.ask = ['zh', 'zh', 'mean', 'listen'][Math.floor(Math.random() * 4)]; }
    c.picked = [];
    this.render();
    toast(`${T('สุ่มให้แล้ว')}: HSK ${k} ${T('ด่าน')} ${compactRange(c.stages[k])} · ${c.count} ${T('คำ')}`, { icon: 'shuffle' });
  },
  create() {
    const { words, label } = this.build();
    if (!words.length) { toast(`${T('ยังไม่มีคำศัพท์ให้เล่น')}`); return; }
    const c = this.c;
    Store.d.customCfg = { type: c.type, mode: c.mode, count: c.count, cats: c.cats, stages: c.stages, timer: c.timer, sec: c.sec, answer: c.answer, ask: c.ask, ans: c.ans, repeat: c.repeat, rate: c.rate, meanHint: c.meanHint, strict: c.strict };
    Store.save();
    const kind = c.mode === 'review' ? 'review' : 'custom';
    if (c.type === 'flash') Game.start({ words, title: c.mode === 'review' ? `${T('ทบทวนคำศัพท์')}` : `${T('สำรับของฉัน')} · ${words.length} ${T('คำ')}`, sub: label, kind, back: '/practice', answer: c.answer, ask: c.ask, timer: c.timer, sec: c.sec });
    else if (c.type !== 'tingxie') playGame(c.type, { words, title: c.mode === 'review' ? `${T('ทบทวนคำศัพท์')}` : `${words.length} ${T('คำ')}`, kind, back: '/practice' });
    else Dicta.start({ words, title: `听写 · ${words.length} ${T('คำ')}`, ans: c.ans, repeat: c.repeat, rate: c.rate, meanHint: c.meanHint, strict: c.strict, back: '/practice', kind });
  }
};
function removeMyWord(zh) {
  const d = Store.d; const ids = d.customWords.filter(w => w.zh === zh).map(w => `C:${w.zh}:${w.py}`);
  d.customWords = d.customWords.filter(w => w.zh !== zh);
  d.review = d.review.filter(id => !ids.includes(id)); ids.forEach(id => delete d.ws[id]);
  if (Custom.c) Custom.c.picked = Custom.c.picked.filter(id => !ids.includes(id));
  Store.save(); buildWords();
}

/* ---------- DICTIONARY ---------- */
const Dict = {
  st: { q: '', lvl: 'all', pos: '', status: '', limit: 120 }, preset: null,
  search(q, pool) {
    const raw = q.trim().toLowerCase(); if (!raw) return pool;
    const qp = pyPlain(raw).replace(/\s+/g, '');
    const hasHan = /[㐀-鿿]/.test(raw);
    const enRe = /^[a-z][a-z' -]*$/.test(raw) ? new RegExp(`(^|[^a-z])${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`) : null;
    const scored = [];
    for (const w of pool) {
      let sc = 0;
      if (w.zh === raw) sc = 100;
      else if (hasHan && w.zh.startsWith(raw)) sc = 80;
      else if (hasHan && w.zh.includes(raw)) sc = 60;
      else if (qp && w._py === qp) sc = 90;
      else if (qp && qp.length >= 2 && w._py.startsWith(qp)) sc = 70;
      else if (w._th && w._th.includes(raw)) sc = w._th === raw ? 85 : 50;
      else if (w._en && w._en.includes(raw)) sc = w._en === raw ? 75 : enRe && enRe.test(w._en) ? 55 : 40;
      else if (qp && qp.length >= 3 && w._py.includes(qp)) sc = 30;
      if (sc) scored.push([sc, w]);
    }
    return scored.sort((a, b) => b[0] - a[0]).map(x => x[1]);
  },
  init() {
    const run = debounce(() => { this.st.q = $('#qInput').value; this.st.limit = 120; this.render(); }, 140);
    $('#qInput').addEventListener('input', run);
    $('#qClear').onclick = () => { $('#qInput').value = ''; this.st.q = ''; this.render(); $('#qInput').focus(); };
    $('#qLevels').addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (!b) return; this.st.lvl = b.dataset.l; this.st.limit = 120; this.render(); });
    $('#qPos').onchange = e => { this.st.pos = e.target.value; this.st.limit = 120; this.render(); };
    $('#qStatus').onchange = e => { this.st.status = e.target.value; this.st.limit = 120; this.render(); };
    $('#qMore').onclick = () => this.more();
    // the next rows arrive on their own a little before you reach the end of the list (no button to hunt for)
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && currentView === 'v-dict' && !$('#qMore').hidden) this.more(); }, { rootMargin: '900px 0px' }).observe($('#qMore'));
    $('#qList').addEventListener('click', e => {
      const sp = e.target.closest('[data-speak]'); if (sp) { speakWord(BY_ID.get(sp.dataset.speak)); return; }
      const row = e.target.closest('.wr'); if (row) this.detail(row.dataset.id);
    });
  },
  show() {
    if (this.preset) { Object.assign(this.st, { q: '', lvl: 'all', status: '', pos: '', limit: 120 }, this.preset); this.preset = null; $('#qInput').value = this.st.q; }
    const lv = [['all', `${T('ทั้งหมด')}`]].concat(LEVELS.filter(l => levelWords(l).length).map(l => [String(l), `HSK ${l}`]));
    if (levelWords('C').length) lv.push(['C', `${T('คำของฉัน')}`]);
    if (!lv.some(x => x[0] === this.st.lvl)) this.st.lvl = 'all';
    $('#qLevels').innerHTML = lv.map(([k, n]) => `<button class="chip" data-l="${k}" ${k !== 'all' ? `style="--c:${lvlColor(k === 'C' ? 'C' : +k)}"` : ''}>${k !== 'all' ? '<span class="dot"></span>' : ''}${n}</button>`).join('');
    const order = Object.keys(POS_NAME), keys = [...new Set(WORDS.map(w => w._pk))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    $('#qPos').innerHTML = `<option value="">${T('ทุกชนิดคำ')}</option>` + keys.map(k => `<option value="${k}">${POS_NAME[k] || k}</option>`).join('');
    $('#qPos').value = this.st.pos; $('#qStatus').value = this.st.status;
    this.render();
  },
  render() {
    const st = this.st;
    $$('#qLevels .chip').forEach(b => b.classList.toggle('on', b.dataset.l === st.lvl));
    let pool = st.lvl === 'all' ? WORDS : levelWords(st.lvl === 'C' ? 'C' : +st.lvl);
    if (st.pos) pool = pool.filter(w => w._pk === st.pos);
    if (st.status) pool = pool.filter(w => Stats.status(w.id) === st.status);
    const res = this.search(st.q, pool);
    $('#qCount').textContent = `${fmtNum(res.length)} ${T('คำ')}${st.q.trim() ? ` ${T('สำหรับ')} “${st.q.trim()}”` : ''}`;
    const list = $('#qList'), shown = res.slice(0, st.limit); this.res = res;
    list.innerHTML = shown.length ? shown.map((w, i) => wordRowHTML(w, { badges: true, n: i + 1 })).join('') :emptyHTML('search', `${T('ไม่พบคำศัพท์')}`, `${T('ลองพิมพ์พินอินแบบไม่มีวรรณยุกต์ เช่น')} xuexi`);
    $('#qMore').hidden = res.length <= st.limit;
    $('#qMore').textContent = `${T('แสดงเพิ่ม')} (${fmtNum(res.length - st.limit)} ${T('คำ')})`;
    $('#qClear').hidden = !st.q;
  },
  /** add the next rows to the end without rebuilding the ones already on screen */
  more() {
    const st = this.st, res = this.res || [], from = st.limit; if (from >= res.length) return;
    st.limit += 160;
    $('#qList').insertAdjacentHTML('beforeend', res.slice(from, st.limit).map((w, i) => wordRowHTML(w, { badges: true, n: from + i + 1 })).join(''));
    $('#qMore').hidden = res.length <= st.limit;
    $('#qMore').textContent = `${T('แสดงเพิ่ม')} (${fmtNum(res.length - st.limit)} ${T('คำ')})`;
  },
  detail(id) {
    const w = BY_ID.get(id); if (!w) return;
    const ws = Store.d.ws[id] || { s: 0, c: 0, w: 0 }, st = Stats.status(id);
    const inReview = Store.d.review.includes(id), hasHan = /[㐀-鿿]/.test(w.zh);
    const body = `<div class="d-head"><div class="row center" style="gap:6px">${lvlBadge(w.lvl)}${posBadge(w)}</div>
        <div class="d-hz">${esc(w.zh)}</div><div class="d-py pyx">${esc(w.py)}</div>
        <div class="d-th lang-th">${esc(w.th)}</div><div class="d-en lang-en">${esc(w.en)}</div></div>
      <div class="d-acts"><button class="btn sm soft" data-say="w">${ic('vol')}${T('ฟังเสียง')}</button>${hasHan ? `<button class="btn sm" data-say="strokes">${ic('brush')}${T('ลำดับขีด')}</button>` : ''}</div>
      <div class="strokes" id="dStrokes"></div>
      ${w.ex_zh ? `<div class="ex-card"><div><div class="expy pyx">${esc(w.ex_py)}</div><div class="exzh">${esc(w.ex_zh)}</div><div class="lang-th">${esc(w.ex_th)}</div><div class="muted lang-en">${esc(w.ex_en)}</div></div><button class="ibtn sm" data-say="ex" aria-label="${T('ฟังประโยค')}">${ic('vol')}</button></div>` : ''}
      <div class="kv"><div><b>${ws.s || 0}</b><span>${T('เคยเจอ')}</span></div><div><b style="color:var(--good)">${ws.c || 0}</b><span>${T('ถูก')}</span></div><div><b style="color:var(--bad)">${ws.w || 0}</b><span>${T('ผิด')}</span></div><div><b class="sm">${STATUS_NAME[st]}</b><span>${T('สถานะ')}</span></div></div>
      ${ws.t ? `<p class="fine" style="margin-top:8px">${T('เล่นล่าสุด')} ${fmtDate(ws.t)}</p>` : ''}`;
    const foot = `<button class="btn" data-act="rv">${inReview ? `${T('เอาออกจากทบทวน')}` : `${ic('plus')}${T('ทบทวน')}`}</button>${w.custom ? `<button class="btn danger" data-act="del">${T('ลบ')}</button>` : ''}<button class="btn primary" data-act="play">${ic('play')}${T('ฝึกคำนี้')}</button>`;
    Sheet.open(body, foot);
    $('#sheetBody').onclick = e => { const b = e.target.closest('[data-say]'); if (!b) return; if (b.dataset.say === 'ex') TTS.speak(w.ex_zh); else if (b.dataset.say === 'strokes') this.strokes(w); else speakWord(w); };
    $('#sheetFoot').onclick = async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'rv') { const d = Store.d; if (d.review.includes(id)) d.review = d.review.filter(x => x !== id); else d.review.push(id); Store.save(); Sheet.close(); if (currentView === 'v-dict') this.render(); toast(d.review.includes(id) ? `${T('ใส่รายการทบทวนแล้ว')}` : `${T('เอาออกจากรายการทบทวนแล้ว')}`, { icon: 'check' }); }
      else if (b.dataset.act === 'play') { Sheet.close(); const same = levelWords(w.lvl).filter(x => x.id !== w.id); Game.start({ words: [w, ...shuffle(same).slice(0, 4)], title: `${T('ฝึก')} “${w.zh}” ${T('กับคำระดับเดียวกัน')}`, kind: 'custom', back: location.hash.slice(1) || '/dict' }); }
      else if (b.dataset.act === 'del') { Sheet.close(); if (await confirmDlg(`${T('ลบคำนี้')}?`, `${T('ลบ')} “${w.zh}” ${T('ออกจากคำของฉัน')}`, `${T('ลบ')}`, true)) { removeMyWord(w.zh); if (currentView === 'v-dict') this.show(); } }
    };
  },
  /** animated stroke order (loads the open-source Hanzi Writer on demand — needs internet) */
  async strokes(w) {
    const host = $('#dStrokes'); if (!host) return;
    const chars = Array.from(w.zh).filter(c => /[㐀-鿿]/.test(c));
    const tok = (this._stok = (this._stok || 0) + 1);
    host.innerHTML = `<span class="muted" style="font-size:13px">${T('กำลังโหลดลำดับขีด')}…</span>`;
    try { await Fx.script('https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js'); }
    catch (e) { host.innerHTML = ''; toast(`${T('ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อดูลำดับขีด')}`, { icon: 'info' }); return; }
    if (tok !== this._stok || !host.isConnected || !window.HanziWriter) return;
    host.innerHTML = chars.map((c, i) => `<div class="stroke-cell" id="skc${i}" style="animation-delay:${i * 60}ms"></div>`).join('');
    const writers = chars.map((c, i) => HanziWriter.create('skc' + i, c, { width: 109, height: 109, padding: 9, showOutline: true, showCharacter: false, strokeColor: '#1b1b19', outlineColor: '#e6dfd2', strokeAnimationSpeed: 1.15, delayBetweenStrokes: 110, onLoadCharDataError: () => { const el = $('#skc' + i); if (el) el.remove(); } }));
    for (const wr of writers) { if (tok !== this._stok || !host.isConnected) return; try { await wr.animateCharacter(); } catch (e) { } await sleep(160); }
  }
};
function openPosInDict(k) {
  if (!WORDS.some(w => w._pk === k)) { toast(`${T('ยังไม่มีคำชนิดนี้ในคลังคำศัพท์')}`, { icon: 'info' }); return; }
  Dict.preset = { pos: k }; Router.go('/dict');
}

/* ---------- LIBRARY & BOOK READER ---------- */
const BOOK_COLOR = { green: '#2c8259', blue: '#2e6aa8', orange: '#c2631f', red: '#b0433a', purple: '#74489d', dark: '#3b4759' };
const SHELF = [
  { id: 'pinyin', tag: 'Phonetic', hz: '拼音', th: `Pinyin ${T('ฐานเสียง')}`, vol: '01', c: 'green' }, { tag: 'Writing', hz: '基本笔画', th: `${T('ลำดับการเขียน')}`, vol: '02', c: 'orange' }, { tag: 'Origin', hz: '六书', th: `${T('อักษร 6 ประเภท')}`, vol: '03', c: 'purple' },
  { tag: 'Radicals', hz: '部首查字', th: `${T('รากศัพท์ 214 ตัว')}`, vol: '04', c: 'red' }, { id: 'pos', tag: 'Grammar', hz: '汉语词类', th: `${T('ชนิดของคำ 13 ชนิด')}`, vol: '05', c: 'blue' }, { tag: 'Rules', hz: '语法手册', th: `${T('คู่มือไวยากรณ์จีน')}`, vol: '06', c: 'dark' },
  { tag: 'Time', hz: '时间表达', th: `${T('การบอกเวลา')}`, vol: '07', c: 'blue' }, { tag: 'HSK 4-6', hz: '高频词汇', th: `${T('ศัพท์ระดับกลาง-สูง')}`, vol: '08', c: 'green' }, { tag: 'Idioms', hz: '成语大全', th: `${T('สำนวนจีน 4 ตัว')}`, vol: '09', c: 'orange' },
  { tag: 'Measure', hz: '常用量词', th: `${T('ลักษณนามใช้บ่อย')}`, vol: '10', c: 'red' }, { tag: 'Syntax', hz: '句型结构', th: `${T('รูปแบบโครงสร้างประโยค')}`, vol: '11', c: 'purple' }, { tag: 'Synonym', hz: '近义词辨析', th: `${T('คำเหมือน/คำสับสน')}`, vol: '12', c: 'dark' },
  { id: 'deep', tag: 'Pronunciation', hz: '发音进阶', th: `Pinyin ${T('เจาะลึกการออกเสียง')}`, vol: '13', c: 'green' }
];
const BOOK_META = {
  pinyin: { vol: 'VOL. 01 · Phonetic', title: `拼音 Pinyin ${T('ฐานเสียง')}`, pages: () => BOOKS.py, labels: ['a', 'b', '1', '2', '3', '4'], toc: 1 },
  deep: { vol: 'VOL. 13 · Pronunciation', title: `发音进阶 ${T('เจาะลึกการออกเสียง')}`, pages: () => BOOKS.deep, labels: ['a', 'b', '1', '2', '3', '4', '5', '6', '7', '8'], toc: 1 },
  pos: { vol: 'VOL. 05 · Grammar', title: `汉语词类 ${T('ชนิดของคำ')}`, pages: () => [`<h3>${T('ชนิดของคำในภาษาจีน')}</h3><p class="muted">${T('ชนิดของคำในภาษาจีนมีทั้งหมด 13 ชนิด แตะเพื่อดูคำศัพท์ชนิดนั้นในคลังคำ')}</p>${BOOKS.pos}`], labels: ['1'], toc: null }
};
const Library = {
  show() {
    const ready = SHELF.filter(b => b.id), soon = SHELF.filter(b => !b.id);
    $('#shelf').innerHTML = ready.concat(soon).map((b, i) => b.id
      ? `<a class="bk" href="#/book/${b.id}" style="--c:${BOOK_COLOR[b.c]};--i:${i}" aria-label="${esc(b.th)}"><span class="bk-vol">VOL. ${b.vol}</span><span class="bk-hz hz">${b.hz}</span><span class="bk-th">${b.th}</span><span class="bk-tag">${b.tag}</span></a>`
      : `<button class="bk soon" data-soon style="--i:${i}" aria-label="${esc(b.th)} ${T('เร็ว ๆ นี้')}">${ic('lock', 'lk')}<span class="bk-vol">VOL. ${b.vol}</span><span class="bk-hz hz">${b.hz}</span><span class="bk-th">${b.th}</span><span class="bk-tag">${T('เร็ว ๆ นี้')}</span></button>`).join('');
    $('#shelf').onclick = e => { if (e.target.closest('[data-soon]')) toast(`${T('เล่มนี้กำลังจัดทำเนื้อหา')}`, { icon: 'lock' }); };
  }
};
const Book = {
  id: null, i: 0, pos: {},
  show(id) {
    const m = BOOK_META[id]; if (!m) { Router.replace('/library'); return; }
    this.id = id; this.i = this.pos[id] || 0;
    $('#bkVol').textContent = m.vol; $('#bkTitle').innerHTML = m.title.replace(/^(\S+)/, '<span class="hz">$1</span>');
    $('#bkToc').hidden = m.toc === null;
    this.render();
  },
  pages() { return BOOK_META[this.id].pages(); },
  go(i) { const n = this.pages().length; i = clamp(i, 0, n - 1); if (i === this.i) return; this.i = i; this.pos[this.id] = i; sfx('flip'); this.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  render() {
    const m = BOOK_META[this.id], pages = this.pages(), body = $('#bkBody');
    body.innerHTML = pages[this.i] || '';
    body.style.animation = 'none'; void body.offsetWidth; body.style.animation = '';
    $$('table', body).forEach(t => { if (!t.closest('.matrix-wrapper,.tbl-scroll')) { const w = document.createElement('div'); w.className = 'tbl-scroll'; t.parentNode.insertBefore(w, t); w.appendChild(t); } });
    $('#bkVol').textContent = pages.length > 1 ? `${m.vol} · ${T('หน้า')} ${m.labels[this.i] || this.i + 1} (${this.i + 1}/${pages.length})` : m.vol;
    $('#bkPrev').disabled = this.i === 0; $('#bkNext').disabled = this.i === pages.length - 1;
    $('.pager').hidden = pages.length < 2;
    $('#bkDots').innerHTML = pages.length > 1 ? pages.map((_, k) => `<button class="${k === this.i ? 'on' : ''}" data-p="${k}" aria-label="${T('หน้า')} ${m.labels[k]}"></button>`).join('') : '';
  },
  init() {
    $('#bkPrev').onclick = () => this.go(this.i - 1); $('#bkNext').onclick = () => this.go(this.i + 1);
    $('#bkToc').onclick = () => { const t = BOOK_META[this.id].toc; if (t !== null) this.go(t); };
    $('#bkDots').onclick = e => { const b = e.target.closest('[data-p]'); if (b) this.go(+b.dataset.p); };
    const body = $('#bkBody'); let sx = 0, sy = 0, tgt = null;
    body.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; tgt = e.target; }, { passive: true });
    body.addEventListener('touchend', e => {
      if (tgt && tgt.closest && tgt.closest('.matrix-wrapper,.tbl-scroll')) return;
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (sx > 30 && Math.abs(dx) > 70 && Math.abs(dy) < 60) this.go(this.i + (dx < 0 ? 1 : -1));
    }, { passive: true });
  },
  key(e) { if (e.key === 'ArrowRight') this.go(this.i + 1); else if (e.key === 'ArrowLeft') this.go(this.i - 1); }
};
// functions referenced by the original book pages (onclick="setPinyinPage(3)" …)
window.setPinyinPage = n => Book.go(n - 1);
window.setDeepPinyinPage = n => Book.go(n - 1);
window.openPosInDict = openPosInDict;

/* ---------- SETTINGS ---------- */
const FONT_SLIDERS = [['hz', `${T('ตัวจีนด้านเฉลย')}`], ['mean', `${T('พินอิน ความหมาย และตัวเลือก')}`], ['ex', `${T('ประโยคตัวอย่าง')}`], ['dict', `${T('รายการคำในคลังคำ')}`]];
const TUNE_SAMPLES = {
  1: { lvl: 1, zh: '爱', py: 'ài', pos: 'Verb', th: `${T('รัก')}`, en: 'to love', ex_zh: '我爱我的爸爸妈妈。', ex_py: 'Wǒ ài wǒ de bàba māma.', ex_th: `${T('ฉันรักพ่อแม่ของฉัน')}`, ex_en: 'I love my mom and dad.' },
  2: { lvl: 1, zh: '你好', py: 'nǐ hǎo', pos: 'Phrase', th: `${T('สวัสดี')}`, en: 'hello', ex_zh: '你好，我叫小明。', ex_py: 'Nǐ hǎo, wǒ jiào Xiǎomíng.', ex_th: `${T('สวัสดี ฉันชื่อเสี่ยวหมิง')}`, ex_en: 'Hello, my name is Xiaoming.' },
  3: { lvl: 2, zh: '图书馆', py: 'túshūguǎn', pos: 'Noun', th: `${T('ห้องสมุด')}`, en: 'library', ex_zh: '我在图书馆看书。', ex_py: 'Wǒ zài túshūguǎn kàn shū.', ex_th: `${T('ฉันอ่านหนังสืออยู่ที่ห้องสมุด')}`, ex_en: 'I am reading in the library.' },
  4: { lvl: 2, zh: '不好意思', py: 'bù hǎoyìsi', pos: 'Phrase', th: `${T('ขอโทษ, เขินอาย')}`, en: 'sorry, embarrassed', ex_zh: '不好意思，我来晚了。', ex_py: 'Bù hǎoyìsi, wǒ lái wǎn le.', ex_th: `${T('ขอโทษนะ ฉันมาสาย')}`, ex_en: 'Sorry, I am late.' }
};
/* [key, label, presets: [value ('' = built-in), name, colour shown on the swatch (null = "auto")], colour the picker opens with] */
const COLOR_ROWS = [
  ['accent', `${T('สีหลักของแอป')}`, [['', `${T('ครามลายคราม (เริ่มต้น')})`, '#24507a'], ['#1f6f54', `${T('หยก')}`], ['#b23a25', `${T('ชาด')}`], ['#a8741a', `${T('อำพัน')}`], ['#6f4a9c', `${T('องุ่น')}`], ['#3b4250', `${T('หมึก')}`]], '#24507a'],
  ['felt', `${T('สีโต๊ะวางการ์ด')}`, [['', `${T('ตามสีหลัก')}`, null], ['#1f456d', `${T('ผ้าคราม')}`], ['#1d5c45', `${T('เขียวสักหลาด')}`], ['#7a2a2a', `${T('แดงเข้ม')}`], ['#33383d', `${T('ชาร์โคล')}`], ['#6b4a2e', `${T('ไม้')}`]], '#1f456d'],
  ['paper', `${T('สีการ์ด')}`, [['', `${T('ขาวนวล (เริ่มต้น')})`, '#fffdf8'], ['#f7efdc', `${T('ครีม')}`], ['#eceeed', `${T('เทาหมอก')}`], ['#e4f0e3', `${T('เขียวอ่อน')}`], ['#20231f', `${T('ดำถ่าน')}`]], '#fffdf8'],
  ['ink', `${T('สีตัวจีน')}`, [['', `${T('อัตโนมัติ')}`, null], ['#1a1a18', `${T('ดำ')}`], ['#1d3557', `${T('น้ำเงินหมึก')}`], ['#9d2b22', `${T('แดงชาด')}`], ['#2f5d3a', `${T('เขียวเข้ม')}`]], '#1a1a18'],
  ['pinyin', `${T('สีพินอิน')}`, [['', `${T('ตามสีหลัก')}`, null], ['#24507a', `${T('คราม')}`], ['#1f6f54', `${T('เขียว')}`], ['#c2412d', `${T('แดง')}`], ['#6b6b66', `${T('เทา')}`]], '#24507a']
];
const Tune = {
  tab: 'front', len: 2,
  init() {
    const s = () => S();
    $('#tuneTab').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; this.tab = b.dataset.v; this.show(); });
    $('#tuneLen').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; this.len = +b.dataset.n; this.show(); });
    $('#tuneFrontSize').oninput = e => { s().front['s' + this.len] = +e.target.value; $('#tuneFrontVal').textContent = e.target.value + '%'; applySettings(); Store.save(); };
    $('#tuneGrid4').onchange = e => { s().front.rows4 = e.target.checked; Store.save(); this.preview(); };
    $('#fontSliders').innerHTML = FONT_SLIDERS.map(([k, n]) => `<div class="fs"><div class="row"><span>${n}</span><span class="val" id="fv-${k}">100%</span></div><input type="range" min="60" max="160" step="5" data-fk="${k}" aria-label="${n}"></div>`).join('');
    $('#fontSliders').addEventListener('input', e => { const k = e.target.dataset.fk; if (!k) return; s().scale[k] = +e.target.value; $('#fv-' + k).textContent = e.target.value + '%'; applySettings(); Store.save(); });
    $('#sFontReset').onclick = () => { s().scale = { ...DEFAULT_SETTINGS.scale }; s().front = { ...DEFAULT_SETTINGS.front }; applySettings(); Store.save(); this.show(); toast(`${T('คืนค่าขนาดเริ่มต้นแล้ว')}`, { icon: 'check', ms: 1600 }); };
    $('#sColorReset').onclick = () => { s().colors = { ...DEFAULT_SETTINGS.colors }; applySettings(); Store.save(); this.markColors(); toast(`${T('คืนค่าสีเริ่มต้นแล้ว')}`, { icon: 'check', ms: 1600 }); };
    // the preview is a real card: tap to flip, speaker speaks
    const pv = $('#pvCard');
    pv.onclick = e => { if (e.target.closest('[data-say]')) { TTS.speak(this.sample().zh); return; } pv.classList.toggle('flipped'); sfx('flip'); };
    pv.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pv.click(); } };
    // colour rows are built once; picking only moves the selection (rebuilding would close an open colour picker)
    $('#colorRows').innerHTML = COLOR_ROWS.map(([k, name, presets, start]) => `<div class="crow"><div class="row"><span>${name}</span><small id="cn-${k}"></small></div><div class="sws">`
      + presets.map(([v, label, show]) => `<button class="sw ${show === null ? 'auto' : ''}" data-ck="${k}" data-cv="${v}" ${show === null ? '' : `style="--sw:${show || v}"`} aria-label="${label}" data-tip="${label}">${show === null ? 'A' : ''}</button>`).join('')
      + `<label class="sw custom" data-tip="${T('เลือกสีเอง')}">${ic('plus')}<input type="color" data-ck="${k}" value="${start}" aria-label="${T('เลือก')}${name}${T('เอง')}"></label></div></div>`).join('');
    $('#colorRows').addEventListener('click', e => { const b = e.target.closest('button[data-ck]'); if (!b) return; sfx('pop'); this.setColor(b.dataset.ck, b.dataset.cv); });
    $('#colorRows').addEventListener('input', e => { if (e.target.type === 'color') this.setColor(e.target.dataset.ck, e.target.value); });
  },
  sample() { const t = TUNE_SAMPLES[this.len]; return RAW_WORDS.find(x => x.zh === t.zh) || t; },
  setColor(k, v) { S().colors[k] = v; applySettings(); Store.save(); this.markColors(); },
  markColors() {
    COLOR_ROWS.forEach(([k, , presets]) => {
      const cur = String(S().colors[k] || '').toLowerCase(), hit = presets.find(p => p[0] === cur), custom = !!cur && !hit;
      $$(`#colorRows button[data-ck="${k}"]`).forEach(b => b.classList.toggle('on', b.dataset.cv === cur));
      const inp = $(`#colorRows input[data-ck="${k}"]`), lab = inp.parentElement;
      lab.classList.toggle('on', custom);
      if (custom) { lab.style.setProperty('--sw', cur); if (inp.value !== cur) inp.value = cur; } else lab.style.removeProperty('--sw');
      $('#cn-' + k).textContent = hit ? hit[1] : cur.toUpperCase();
    });
  },
  preview() {
    // same markup as the game, so what you see here is what the table shows
    $('#pvCard').innerHTML = Game.cardEl.call({ s: { ask: 'zh', answer: 'quiz' } }, this.sample()).innerHTML;
  },
  show() {
    const s = S(), f = s.front;
    segSet($('#tuneTab'), this.tab);
    $('#tuneFront').hidden = this.tab !== 'front'; $('#tuneBack').hidden = this.tab !== 'back'; $('#tuneColor').hidden = this.tab !== 'color';
    $('#sFontReset').hidden = this.tab === 'color'; $('#sColorReset').hidden = this.tab !== 'color';
    $$('#tuneLen .chip').forEach(b => b.classList.toggle('on', +b.dataset.n === this.len));
    $('#tuneFrontLbl').textContent = `${T('ขนาดตัวจีน · คำ')} ${this.len} ${T('ตัว')}${this.len === 4 ? `${T('ขึ้นไป')}` : ''}`;
    $('#tuneFrontSize').value = f['s' + this.len]; $('#tuneFrontVal').textContent = f['s' + this.len] + '%';
    $('#tuneGridRow').hidden = this.len !== 4; $('#tuneGrid4').checked = f.rows4 !== false;
    FONT_SLIDERS.forEach(([k]) => { const r = $(`[data-fk="${k}"]`); r.value = s.scale[k]; $('#fv-' + k).textContent = s.scale[k] + '%'; });
    this.preview(); this.markColors();
    $('#pvCard').classList.toggle('flipped', this.tab !== 'front');
  }
};
const Settings = {
  init() {
    const s = () => S();
    const sw = (id, key, after) => $(id).onchange = e => { s()[key] = e.target.checked; after && after(e); applySettings(); Store.save(); };
    const seg = (id, key) => $(id).addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; s()[key] = b.dataset.v; Store.save(); this.show(); });
    $('#sTheme').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; setTheme(b.dataset.v === 'auto' ? null : b.dataset.v, b); segSet($('#sTheme'), b.dataset.v); });
    sw('#sPinyin', 'showPinyin');
    sw('#sTh', 'showTh', e => { if (!e.target.checked && !s().showEn) { s().showEn = true; $('#sEn').checked = true; toast(`${T('ต้องแสดงอย่างน้อย 1 ภาษา จึงเปิดภาษาอังกฤษให้')}`); } });
    sw('#sEn', 'showEn', e => { if (!e.target.checked && !s().showTh) { s().showTh = true; $('#sTh').checked = true; toast(`${T('ต้องแสดงอย่างน้อย 1 ภาษา จึงเปิดภาษาไทยให้')}`); } });
    sw('#sSfx', 'sfx', e => { if (e.target.checked && !s().vol) { s().vol = 60; this.show(); } });
    sw('#sHaptic', 'haptic', e => { if (e.target.checked) buzz(20); });
    sw('#sAutoSpeak', 'autoSpeak'); seg('#sAfterOk', 'afterOk'); seg('#sAfterBad', 'afterBad');
    // the menu language is read once when the page loads, so switching it reloads
    $('#sLang').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b || b.dataset.v === (s().lang || 'th')) return; s().lang = b.dataset.v; Store.flush(); location.reload(); });
    seg('#sAsk', 'ask'); seg('#sQuiz', 'answer'); seg('#sTimer', 'timer');
    $('#sSec').innerHTML = SEC_CHOICES.map(n => `<button class="chip" data-n="${n}">${n} ${T('วิ')}</button>`).join('');
    $('#sSec').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; s().sec = +b.dataset.n; Store.save(); this.show(); });
    $('#sVol').oninput = e => { s().vol = +e.target.value; $('#sVolVal').textContent = s().vol + '%'; if (s().vol && !s().sfx) { s().sfx = true; $('#sSfx').checked = true; } applySettings(); Store.save(); };
    $('#sVol').onchange = () => sfx('correct', 2);
    $('#sVoice').onchange = e => { s().voiceURI = e.target.value; Store.save(); TTS.speak('你好'); };
    $('#sRate').oninput = e => { s().rate = +e.target.value; $('#sRateVal').textContent = rateTxt(s().rate); Store.save(); };
    $('#sTest').onclick = async () => { const ok = await TTS.speak('你好，欢迎来到 Library of Limu'); if (!ok && !TTS.voices.length) toast(`${T('ไม่พบเสียงภาษาจีนในเครื่องนี้')}`, { icon: 'info' }); };
    $('#sGoal').oninput = e => { s().goal = +e.target.value; $('#sGoalVal').textContent = s().goal; Store.save(); };
    Tune.init();
    $('#sExport').onclick = () => this.exportData();
    $('#sImport').onclick = () => $('#sImportFile').click();
    $('#sImportFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) this.importData(f); };
    $$('[data-reset]').forEach(b => b.onclick = () => this.reset(b.dataset.reset));
  },
  show() {
    const s = S();
    segSet($('#sTheme'), s.theme || 'auto'); segSet($('#sLang'), s.lang || 'th'); segSet($('#sAfterOk'), String(s.afterOk)); segSet($('#sAfterBad'), String(s.afterBad)); segSet($('#sAsk'), s.ask); segSet($('#sQuiz'), s.answer); segSet($('#sTimer'), s.timer);
    $('#sPinyin').checked = s.showPinyin; $('#sTh').checked = s.showTh; $('#sEn').checked = s.showEn;
    $('#sSfx').checked = !!s.sfx; $('#sHaptic').checked = !!s.haptic; $('#sAutoSpeak').checked = !!s.autoSpeak;
    $('#sHapticNote').textContent = CAN_VIBRATE ? `${T('เฉพาะอุปกรณ์ที่รองรับ')}` : `${T('อุปกรณ์นี้สั่นไม่ได้ จะเป็นเสียงทุ้มสั้น ๆ แทน')}`;
    $$('#sSec .chip').forEach(b => b.classList.toggle('on', +b.dataset.n === +s.sec)); $('#sSec').hidden = s.timer !== 'countdown';
    $('#sVol').value = s.vol; $('#sVolVal').textContent = s.vol + '%';
    $('#sRate').value = s.rate; $('#sRateVal').textContent = rateTxt(s.rate);
    $('#sGoal').value = s.goal; $('#sGoalVal').textContent = s.goal;
    Tune.show();
    $$('#v-settings input[type=range]').forEach(rangeFill);
    this.renderVoices();
  },
  renderVoices() {
    const sel = $('#sVoice'); if (!sel) return;
    const v = TTS.voices, auto = TTS.pick();
    sel.innerHTML = `<option value="">${T('อัตโนมัติ')}${auto ? ` (${esc(auto.name)})` : ''}</option>` + v.map(x => `<option value="${esc(x.voiceURI)}">${esc(x.name)} · ${esc(x.lang)}</option>`).join('');
    sel.value = v.some(x => x.voiceURI === S().voiceURI) ? S().voiceURI : '';
    $('#sVoiceNote').textContent = !TTS.ok ? `${T('เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง')}` : v.length ? `${T('พบเสียงภาษาจีน')} ${v.length} ${L('เสียง', 'voices')}` : `${T('ไม่พบเสียงภาษาจีนในเครื่อง · Windows: Settings › Time & language › Language & region › เพิ่ม 中文(简体) พร้อม Text-to-speech หรือใช้ Microsoft Edge ซึ่งมีเสียงออนไลน์ในตัว')}`;
  },
  exportData() {
    Store.flush();
    const blob = new Blob([JSON.stringify(Store.d, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `offy-backup-${ymd()}.json`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    try { localStorage.setItem('offy.backupAt', String(Date.now())); } catch (e) { }
    toast(`${T('ดาวน์โหลดไฟล์สำรองแล้ว')}`, { icon: 'down' });
  },
  importData(file) {
    const r = new FileReader();
    r.onload = async () => {
      let d; try { d = JSON.parse(r.result); } catch (e) { toast(`${T('ไฟล์ไม่ถูกต้อง อ่าน JSON ไม่ได้')}`, { icon: 'info' }); return; }
      if (!d || ![1, 2, 3, 4].includes(d.v) || !d.settings || !Array.isArray(d.sessions)) { toast(`${T('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ')} new offy`, { icon: 'info' }); return; }
      if (!(await confirmDlg(`${T('นำเข้าข้อมูล')}?`, `${T('ข้อมูลปัจจุบันจะถูกแทนที่ด้วยไฟล์นี้')} (${d.sessions.length} ${T('รอบการเล่น')})`, `${T('นำเข้า')}`, true))) return;
      Store.d = Store.normalize(d); Store.flush(); buildWords(); applySettings(); Custom.c = null;
      sfx('save'); toast(`${T('นำเข้าข้อมูลแล้ว')}`, { icon: 'check' }); this.show();
    };
    r.readAsText(file);
  },
  async reset(kind) {
    const txt = { review: [`${T('ล้างรายการทบทวน')}?`, `${T('คำทั้งหมดในรายการคำที่ตอบผิดจะถูกลบ')}`], stats: [`${T('ล้างสถิติและดาว')}?`, `${T('ประวัติการเล่น ดาวทุกด่าน และสถานะการจำคำจะถูกลบ คำของฉันและการตั้งค่ายังอยู่')}`], mywords: [`${T('ลบคำของฉันทั้งหมด')}?`, `${T('คำศัพท์ที่เพิ่มเองจะถูกลบทั้งหมด')}`], all: [`${T('ล้างข้อมูลทั้งหมด')}?`, `${T('ทุกอย่างจะกลับเป็นค่าเริ่มต้น แนะนำให้สำรองข้อมูลก่อน')}`] }[kind];
    if (!(await confirmDlg(txt[0], txt[1] + ` · ${T('ย้อนกลับไม่ได้')}`, `${T('ล้างข้อมูล')}`, true))) return;
    const d = Store.d;
    if (kind === 'review') d.review = [];
    if (kind === 'stats' || kind === 'all') { d.sessions = []; d.ws = {}; d.stages = {}; d.review = []; d.legacy = { days: {} }; d.last = null; }
    if (kind === 'mywords') { const ids = d.customWords.map(w => `C:${w.zh}:${w.py}`); d.customWords = []; d.review = d.review.filter(id => !ids.includes(id)); ids.forEach(id => delete d.ws[id]); }
    if (kind === 'all') { Store.d = Store.defaults(); Store.d.settings.theme = d.settings.theme; }
    Store.flush(); buildWords(); applySettings(); Custom.c = null; this.show(); toast(`${T('ล้างข้อมูลแล้ว')}`, { icon: 'check' });
  }
};

/* ---------- ROUTE TABLE ---------- */
const VIEWS = {
  home: { el: 'v-home', nav: 'home', show: () => Home.show() },
  learn: { el: 'v-learn', nav: 'learn', show: () => Learn.show(), title: `${T('มินิเกม')}` },
  level: { el: 'v-level', nav: 'learn', show: a => Level.show(a[0]), title: 'HSK' },
  practice: { el: 'v-practice', nav: 'practice', show: a => Custom.show(a[0]), title: `${T('ฝึกเอง')}` },
  mini: { el: 'v-mini', immersive: true, show: () => Mini.onShow(), need: () => !!Mini.s, title: 'Mini-games' },
  play: { el: 'v-game', immersive: true, show: () => Game.onShow(), need: () => !!Game.s, title: `${T('แฟลชการ์ด')}` },
  dictation: { el: 'v-dictation', immersive: true, show: () => Dicta.onShow(), need: () => !!Dicta.s && !Dicta.s.done, title: '听写' },
  dsheet: { el: 'v-dsheet', immersive: true, show: () => DSheet.show(), need: () => !!Dicta.s && Dicta.s.done, title: `${T('ใบตรวจ')} 听写` },
  dict: { el: 'v-dict', nav: 'dict', show: () => Dict.show(), title: `${T('คลังคำศัพท์')}` },
  stats: { el: 'v-stats', nav: 'stats', show: () => StatsView.show(), title: `${T('สถิติ')}` },
  library: { el: 'v-library', nav: 'library', show: () => Library.show(), title: `${T('ชั้นหนังสือ')}` },
  book: { el: 'v-book', nav: 'library', show: a => Book.show(a[0]), title: 'Only Offy' },
  settings: { el: 'v-settings', nav: 'settings', show: () => Settings.show(), title: `${T('ตั้งค่า')}` }
};
const ROUTE_ALIAS = { levels: 'learn', custom: 'practice', dash: 'stats' };   // links from the previous version
let currentView = null, currentHash = null;
/* every page remembers how far down it was scrolled (keyed by its address), like the tabs of a phone app */
const scrollMem = {};
const TAB_ROOTS = new Set(['v-home', 'v-learn', 'v-practice', 'v-dict', 'v-stats', 'v-library', 'v-settings']);
function renderRoute(h) {
  const { name, args } = Router.parse(h);
  const v = VIEWS[ROUTE_ALIAS[name] || name] || VIEWS.home;
  if (v.need && !v.need()) { Router.replace('/home'); return; }
  Sheet.close(); Tip.hide();
  const from = currentView, changing = from !== v.el, dir = Router.dir || 'none';
  if (currentHash) scrollMem[currentHash] = scrollY;
  const swap = () => {
    if (changing) $$('.view').forEach(x => x.classList.toggle('active', x.id === v.el));
    currentView = v.el; currentHash = h;
    document.body.classList.toggle('immersive', !!v.immersive);
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === v.nav));
    document.title = v.title ? `${v.title} · Library of Limu` : 'Library of Limu';
    try { v.show(args); } catch (err) { console.error(err); toast(`${T('เกิดข้อผิดพลาด')}: ` + err.message, { icon: 'info' }); }
    if (changing && (v.immersive || v.el === 'v-level') && !reducedMotion()) {
      const target = $(`#${v.el}`);
      if (target) { target.classList.remove('scroll-unfurl-view'); void target.offsetWidth; target.classList.add('scroll-unfurl-view'); setTimeout(() => target.classList.remove('scroll-unfurl-view'), 560); }
    }
    // a page opened fresh starts at the top; a tab or a page you come back to keeps its place
    if (changing) window.scrollTo(0, dir === 'push' && !TAB_ROOTS.has(v.el) ? 0 : (scrollMem[h] || 0));
  };
  // how the page change looks: entering immersive games/stage road unfurls like a Chinese scroll, going back slides away, tabs cross-fade
  const isScrollRoute = dir === 'push' && (v.immersive || v.el === 'v-level');
  const kind = !changing || !from ? '' : dir === 'pop' ? 'pop' : isScrollRoute ? 'scroll' : dir === 'push' && !TAB_ROOTS.has(v.el) ? 'push' : 'fade';
  if (!kind || !document.startViewTransition || reducedMotion() || document.hidden) { swap(); return; }
  const root = document.documentElement; root.dataset.vt = kind;
  try {
    const vt = document.startViewTransition(swap), done = () => { if (root.dataset.vt === kind) delete root.dataset.vt; };
    vt.ready.catch(() => { }); vt.updateCallbackDone.catch(() => { }); vt.finished.then(done, done);    // a transition cut short by the next tap is normal, not an error
  }
  catch (e) { delete root.dataset.vt; swap(); }
}
/* leaving an unfinished game / dictation / unsaved sheet asks first */
Router.guard = h => {
  const cur = Router.stack[Router.stack.length - 1];
  if (cur === '#/play' && h !== '#/play' && Game.s && !Game.s.finished) { Router.restore('#/play'); Game.pause(); return false; }
  if (cur === '#/dictation' && h !== '#/dictation' && h !== '#/dsheet' && Dicta.s && !Dicta.s.done) { Router.restore('#/dictation'); Dicta.quitAsk(); return false; }
  if (cur === '#/dsheet' && h !== '#/dsheet' && Dicta.s && Dicta.s.done && !Dicta.s.saved) { Router.restore('#/dsheet'); DSheet.discard(); return false; }
  if (cur === '#/play' && h !== '#/play' && Game.s && Game.s.finished) { Game.teardown(); Game.s = null; }
  if (cur === '#/mini' && h !== '#/mini' && Mini.s && !Mini.s.finished) { Router.restore('#/mini'); Mini.quitAsk(); return false; }
  if (cur === '#/mini' && h !== '#/mini' && Mini.s && Mini.s.finished) { Mini.teardown(); Mini.s = null; }
  return true;
};

/* ---------- BOOT ---------- */
function boot() {
  Store.load(); buildWords(); applySettings(); TTS.init();
  Gami.ensure(); I18n.scan();
  Sheet.init(); Tip.init();
  Custom.init(); Dict.init(); StatsView.init(); Book.init(); Settings.init();

  // delegated navigation + a soft tap sound for ordinary controls
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('.btn, .chip, .ibtn, .seg button, .li, .tile, .lv, .bk, .back-btn, .nav a, .stage-group .btn, summary, .pos-item-btn, .stat[data-go], .cta-rv, .hero') && !t.closest('.choice, [data-act], [data-d], .mark, .js-theme, .js-pinyin, .js-sound, .stage-chips, [data-speak], [data-say], #dSpeak, #dReplay, #dSlow, #sTest')) sfx('tap');
    const g = t.closest('[data-go]'); if (g && !g.disabled) { e.preventDefault(); Router.go(g.dataset.go); return; }
    const u = t.closest('[data-up]'); if (u) { e.preventDefault(); Router.up(u.dataset.up); }
  });
  document.addEventListener('change', e => { if (e.target.matches('.switch input')) { sfx(e.target.checked ? 'on' : 'off'); buzz(8); } });
  document.addEventListener('input', e => { if (e.target.matches('input[type=range]')) rangeFill(e.target); });
  // browsers only allow sound after a gesture: wake audio + speech on the first touch
  const unlock = () => { if (Sfx.enabled()) Sfx.ensure(); TTS.unlock(); };
  document.addEventListener('pointerdown', unlock, { once: true, capture: true });
  document.addEventListener('keydown', unlock, { once: true, capture: true });

  $$('.js-theme').forEach(b => b.onclick = toggleTheme);
  $$('.js-pinyin').forEach(b => b.onclick = togglePinyin);
  $$('.js-sound').forEach(b => b.onclick = toggleSound);
  $('#brandBtn').onclick = aboutDlg;
  $('#v-home h1').onclick = aboutDlg;
  $('#gAnswer').addEventListener('click', e => Game.onAnswerClick(e));
  $('#gPause').onclick = () => Game.topButton();
  $('#mgQuit').onclick = () => Mini.quitAsk();
  $('#dQuit').onclick = () => Dicta.quitAsk();
  $('#dSpeak').onclick = () => Dicta.play();
  $('#dReplay').onclick = () => Dicta.play();
  $('#dSlow').onclick = () => Dicta.play(true);
  $('#dHints').addEventListener('click', e => { const b = e.target.closest('[data-h]'); if (b) Dicta.hint(b.dataset.h); });
  $('#dWork').addEventListener('click', e => Dicta.onRevealClick(e));
  $('#dsBody').addEventListener('click', e => DSheet.click(e));
  $('#dsAllOk').onclick = () => DSheet.allOk();
  $('#dsSave').onclick = () => DSheet.save();
  $('#dsDiscard').onclick = () => DSheet.discard();
  const mq = matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', () => { if (!S().theme) applySettings(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && Sheet.isOpen() && !modalOpen()) { Sheet.close(); return; }
    if (e.target.matches && e.target.matches('input,select,textarea') && currentView !== 'v-dictation') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (currentView === 'v-game') Game.key(e);
    else if (currentView === 'v-mini') Mini.key(e);
    else if (currentView === 'v-dictation') Dicta.key(e);
    else if (currentView === 'v-book') Book.key(e);
    else if (e.key === '/' && currentView === 'v-dict') { e.preventDefault(); $('#qInput').focus(); }
  });
  let lastW = innerWidth;
  addEventListener('resize', debounce(() => {
    if (currentView === 'v-game' && Game.s) Game.fit();
    if (currentView === 'v-dictation' && Dicta.s && Dicta.s.ans === 'draw') Pad.layout();
    // phones fire "resize" while scrolling (the toolbar hides) — charts only need redrawing when the width changes, and then without replaying their animations
    if (innerWidth === lastW) return; lastW = innerWidth;
    if (currentView === 'v-stats') Fx.quiet(() => StatsView.show(true));
    if (currentView === 'v-level') Level.layout();
  }, 160));
  // the app is open in another tab and saved there: pick the newer data up instead of overwriting it later
  addEventListener('storage', e => {
    if (e.key !== Store.KEY || !e.newValue) return;
    try { Store.d = Store.normalize(JSON.parse(e.newValue)); } catch (err) { return; }
    buildWords(); applySettings(); Custom.c = null;
    if (!VIEWS[Router.parse(location.hash).name]?.immersive && !Sheet.isOpen() && !modalOpen()) Fx.quiet(() => renderRoute(location.hash));
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentView === 'v-game' && Game.s && !Game.s.finished && !Game.s.paused && Game.s.phase === 'ask') Game.pause();
    if (document.hidden && currentView === 'v-mini' && Mini.s && !Mini.s.finished && !Mini.s.paused && !modalOpen()) Mini.quitAsk();
  });

  // edge swipe from the left = back (for home-screen apps without a browser back gesture)
  let ex = null;
  document.addEventListener('touchstart', e => { const t = e.touches[0]; ex = t.clientX < 22 ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
  document.addEventListener('touchmove', e => { if (!ex) return; const t = e.touches[0], dx = t.clientX - ex.x; const el = $('#edgeL'); el.style.opacity = String(clamp(dx / 80, 0, 1)); el.style.transform = `translateX(${clamp(dx * .7, 0, 58)}px)`; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!ex) return; const t = e.changedTouches[0], dx = t.clientX - ex.x, dy = Math.abs(t.clientY - ex.y); ex = null;
    const el = $('#edgeL'); el.style.opacity = '0'; el.style.transform = '';
    if (dx > 80 && dy < 60) { if (modalOpen()) return; if (Sheet.isOpen()) { Sheet.close(); return; } const b = $('.view.active [data-up]'); if (b) b.click(); else if (currentView === 'v-game') Game.pause(); else if (currentView === 'v-mini') Mini.quitAsk(); else if (currentView === 'v-dictation') Dicta.quitAsk(); else if (currentView !== 'v-home' && currentView !== 'v-dsheet') history.back(); }
  }, { passive: true });

  Router.start();
  if (Store.migrated) setTimeout(() => toast(/^v\d$/.test(Store.migrated) ? `${T('นำความคืบหน้าจาก')} new offy ${Store.migrated} ${T('มาให้แล้ว')}` : `${T('นำความคืบหน้าจากเวอร์ชันเก่ามาให้แล้ว')}`, { icon: 'check', ms: 3600 }), 700);
  appFeel();
}

/** a toast you can tap (update ready, backup reminder) */
function actionToast(msg, label, fn, { icon = 'info', ms = 9000 } = {}) {
  const host = $('#toasts'); if (!host) return;
  const el = document.createElement('button'); el.className = 'toast act';
  el.innerHTML = ic(icon) + `<span>${esc(msg)}</span><b>${esc(label)}</b>`; host.appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 320); };
  el.onclick = () => { close(); fn(); }; setTimeout(close, ms);
}

/* the things that make the web page behave like an installed app */
function appFeel() {
  // tapping the tab you are already on scrolls back to the top, as on iOS / Android
  $('#nav').addEventListener('click', e => {
    const a = e.target.closest('a[data-nav]'); if (!a || location.hash !== a.getAttribute('href')) return;
    e.preventDefault(); scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  });
  if (typeof Home !== 'undefined' && Home.initPull) Home.initPull();
  // menu names are hidden except on the current tab: a mouse hover still tells you which is which
  $$('.nav-items a').forEach(a => { const s = a.querySelector('span'); if (s) a.dataset.tip = s.textContent.trim(); });
  // with page slides, the first screen keeps its "rise in" entrance; after that the slide is the only page animation (no blink)
  if (document.startViewTransition && !reducedMotion()) setTimeout(() => document.documentElement.classList.add('vt-on'), 900);
  // launch screen: the seal stays a moment, then lifts away
  const sp = $('#splash');
  if (sp) { const first = !sessionStorage.getItem('offy.launched'); try { sessionStorage.setItem('offy.launched', '1'); } catch (e) { }
    setTimeout(() => { sp.classList.add('out'); setTimeout(() => sp.remove(), 600); }, first && !reducedMotion() ? 650 : 0); }
  // ask the browser to keep our data (Safari otherwise may clear a site that was not opened for a week)
  if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => { });
  // a gentle reminder to back up once there is something worth keeping
  setTimeout(() => {
    try {
      const d = Store.d, n = d.sessions.length, now = Date.now(), at = +localStorage.getItem('offy.backupAt') || 0, asked = +localStorage.getItem('offy.backupAsk') || 0;
      if (n < 15 || now - at < 14 * DAY || now - asked < 4 * DAY) return;
      localStorage.setItem('offy.backupAsk', String(now));
      actionToast(at ? `${T('ไม่ได้สำรองข้อมูลมา')} ${Math.floor((now - at) / DAY)} ${T('วันแล้ว')}` : `${T('ยังไม่เคยสำรองข้อมูลการเรียน')}`, `${T('สำรองเลย')}`, () => Settings.exportData(), { icon: 'down' });
    } catch (e) { }
  }, 2500);
  // service worker: when a newer version takes over, offer a reload instead of changing files under a running game
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(r => setInterval(() => r.update().catch(() => { }), 30 * 60 * 1000)).catch(() => { });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (had) actionToast(`${T('มีเวอร์ชันใหม่ของแอป')}`, `${T('โหลดใหม่')}`, () => location.reload(), { icon: 'retry', ms: 15000 }); });
  }
}
