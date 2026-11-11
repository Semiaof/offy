'use strict';
/* =====================================================================
   Library of Limu · new offy v2 — app
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
  $$('.js-theme use').forEach(u => u.setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon'));
  $$('.js-pinyin').forEach(b => { b.classList.toggle('off', !s.showPinyin); b.querySelector('use').setAttribute('href', s.showPinyin ? '#i-eye' : '#i-eye-off'); });
  $$('.js-sound').forEach(b => { b.classList.toggle('off', !s.sfx); b.querySelector('use').setAttribute('href', s.sfx ? '#i-vol' : '#i-mute'); });
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = theme === 'dark' ? '#111311' : '#f4f2ec';
  Sfx.setVol();
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
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] }, { duration: 640, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => { });
  } catch (e) { apply(); }
}
function toggleTheme(e) { sfx('pop'); setTheme(currentTheme() === 'dark' ? 'light' : 'dark', e && e.currentTarget); }
function togglePinyin() { const s = S(); s.showPinyin = !s.showPinyin; applySettings(); Store.save(); sfx(s.showPinyin ? 'on' : 'off'); toast(s.showPinyin ? 'แสดงพินอิน' : 'ซ่อนพินอิน ฝึกอ่านจากตัวจีนล้วน', { icon: s.showPinyin ? 'eye' : 'eye-off', ms: 1800 }); }
function toggleSound() { const s = S(); s.sfx = !s.sfx; if (s.sfx && !s.vol) s.vol = 60; applySettings(); Store.save(); if (s.sfx) sfx('on'); toast(s.sfx ? 'เปิดเสียงเอฟเฟกต์' : 'ปิดเสียงเอฟเฟกต์', { icon: s.sfx ? 'vol' : 'mute', ms: 1600 }); }
function aboutDlg() { modal({ title: 'Library of Limu', html: 'คลังคำศัพท์ HSK 3.0 · ฝึกจำ ฝึกฟัง ฝึกเขียน<br><br>อภิสิทธิ์ แก้วเนตร · Aphisit Kaewnet<br><span class="hz" style="font-size:24px;color:var(--ink)">大家好</span>' }); }

const STATUS_NAME = { new: 'ยังไม่เคยเล่น', learning: 'กำลังเรียน', mastered: 'จำได้แล้ว', review: 'รอทบทวน' };
function wordRowHTML(w, opts = {}) {
  const st = Stats.status(w.id);
  return `<div class="wr" data-id="${esc(w.id)}"><span class="mdot ${st}" title="${STATUS_NAME[st]}"></span>
    <span class="wr-zh">${esc(w.zh)}</span>
    <span class="wr-i"><span class="wr-py pyx">${esc(w.py)}</span><span class="wr-m">${meanHTML(w)}</span></span>
    ${opts.badges ? `<span class="wr-b">${lvlBadge(w.lvl)}${posBadge(w)}</span>` : ''}
    <button class="ibtn sm" data-speak="${esc(w.id)}" aria-label="ฟังเสียง">${ic('vol')}</button></div>`;
}
function emptyHTML(icon, title, text, btn = '') { return `<div class="empty"><div class="e-ic">${ic(icon)}</div><b>${title}</b>${text}${btn}</div>`; }

/* ---------- HOME ---------- */
const Home = {
  show() {
    const now = new Date(), s = S();
    $('#hDate').textContent = `${TH_DAY_FULL[now.getDay()]} ${now.getDate()} ${TH_MONTH[now.getMonth()]} ${now.getFullYear() + 543}`;
    const days = Stats.days(), t = days[ymd()] || { ms: 0, cards: 0 }, st = Stats.streak(days), rv = Stats.reviewIds().length;

    // continue card
    const last = Store.d.last, lvl = last && levelWords(last.lvl).length ? last.lvl : LEVELS.find(l => levelWords(l).length);
    const next = Stats.suggestStage(lvl), rec = Stats.stage(lvl, next), started = Object.keys(Store.d.stages).length > 0;
    $('#homeHero').innerHTML = `<button class="hero" id="heroBtn"><span class="hero-wm hz">学</span>
      <span class="hero-k">${started ? 'เรียนต่อจากครั้งก่อน' : 'เริ่มต้นที่นี่'}</span>
      <span class="hero-t">HSK ${lvl} · ด่าน ${next}</span>
      <span class="hero-s">${stageWords(lvl, next).length} คำ · ${rec && rec.plays ? `คะแนนดีที่สุด ${rec.pct}%` : 'ยังไม่เคยเล่น'}</span>
      <span class="hero-cta">เริ่มเลย${ic('arrow-r')}</span></button>`;
    $('#heroBtn').onclick = () => Level.play(lvl, next);

    // today
    const goal = s.goal || 30, gp = clamp(t.cards / goal, 0, 1);
    $('#homeTrio').innerHTML = `
      <div class="stat" style="--c:var(--accent)">${Fx.ring(gp)}<span class="k">${ic('target')}เป้าหมายวันนี้</span><b class="v"><span data-count="${t.cards}">0</span><small>/${goal}</small></b><span class="s">${gp >= 1 ? 'ครบเป้าแล้ว' : `การ์ด · ${Math.round(t.ms / 60000)} นาที`}</span></div>
      <div class="stat" style="--c:var(--hsk3)"><span class="k">${ic('flame')}เรียนต่อเนื่อง</span><b class="v"><span data-count="${st.cur}">0</span><small>วัน</small></b><span class="s">${st.today ? 'วันนี้เรียนแล้ว' : st.cur ? 'เรียนวันนี้เพื่อรักษาสถิติ' : `สูงสุด ${st.best} วัน`}</span></div>
      <button class="stat" style="--c:var(--bad)" data-go="/practice/review"><span class="k">${ic('repeat')}รอทบทวน</span><b class="v" ${rv ? 'style="color:var(--bad)"' : ''}><span data-count="${rv}">0</span><small>คำ</small></b><span class="s">${rv ? 'แตะเพื่อทบทวน' : 'ไม่มีคำค้าง'}</span></button>`;

    // last 7 days
    const wk = []; for (let i = 6; i >= 0; i--) { const d = addDays(dayStart(), -i); wk.push({ d, v: days[ymd(d)] || { cards: 0, ms: 0 } }); }
    const mx = Math.max(goal, ...wk.map(x => x.v.cards)), sumC = wk.reduce((a, x) => a + x.v.cards, 0), sumM = wk.reduce((a, x) => a + x.v.ms, 0);
    $('#homeWeek').innerHTML = `<div class="ch"><div><h3>7 วันล่าสุด</h3><div class="cap">${fmtNum(sumC)} การ์ด · ${fmtDur(sumM)}</div></div></div>
      <div class="week">${wk.map((x, i) => `<div class="wd ${x.v.cards ? 'on' : ''} ${i === 6 ? 'today' : ''}" data-tip="${x.d.getDate()} ${TH_MONTH[x.d.getMonth()]} · ${x.v.cards} การ์ด"><i data-h="${Math.round(8 + x.v.cards / mx * 58)}px"></i><span>${TH_DAY[x.d.getDay()]}</span></div>`).join('')}</div>`;

    // word of the day (same word for the whole day)
    const pool = RAW_WORDS, w = pool[(Math.floor(dayStart().getTime() / DAY) * 7919) % pool.length];
    $('#homeWord').innerHTML = `<div class="card wod" id="wod" role="button" tabindex="0" aria-label="คำประจำวัน ${esc(w.zh)}">
      <svg class="grid-bg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width=".8"><rect x="10" y="10" width="80" height="80" rx="6"/><path d="M50 10v80M10 50h80" stroke-dasharray="3 3"/><path d="M10 10l80 80M90 10 10 90" stroke-dasharray="2 4"/></svg>
      <span class="k">คำประจำวัน ${lvlBadge(w.lvl)}</span>
      <span class="wod-zh hz">${esc(w.zh)}</span><span class="wod-py pyx">${esc(w.py)}</span><span class="wod-m">${meanHTML(w)}</span>
      <button class="ibtn" data-speak="${esc(w.id)}" aria-label="ฟังเสียง">${ic('vol')}</button></div>`;
    const wod = $('#wod');
    wod.onclick = e => { if (e.target.closest('[data-speak]')) { speakWord(w); return; } Dict.detail(w.id); };
    wod.onkeydown = e => { if (e.key === 'Enter' && e.target === wod) Dict.detail(w.id); };

    $('#homeLinks').innerHTML = `
      <a class="li" href="#/practice/tingxie" style="--c:var(--hsk5)"><span class="li-ic">${ic('brush')}</span><span class="li-t"><b><span class="hz">听写</span> เขียนตามคำบอก</b><small>ฟังเสียง แล้วเขียนบนจอ พิมพ์ หรือใช้กระดาษ</small></span>${ic('chev-r')}</a>
      <a class="li" href="#/practice" style="--c:var(--hsk6)"><span class="li-ic">${ic('sliders')}</span><span class="li-t"><b>จัดสำรับเอง</b><small>เลือกระดับ ด่าน จำนวนคำ และรูปแบบโจทย์</small></span>${ic('chev-r')}</a>
      <a class="li" href="#/library" style="--c:var(--gold)"><span class="li-ic">${ic('book')}</span><span class="li-t"><b>Only Offy ชั้นหนังสือ</b><small>สรุปพินอิน การออกเสียง และชนิดของคำ</small></span>${ic('chev-r')}</a>`;
    Fx.settle($('#v-home'));
  }
};

/* ---------- LEARN: level select ---------- */
const Learn = {
  show() {
    $('#lvGrid').innerHTML = LEVELS.map(l => {
      const n = levelWords(l).length;
      if (!n) return '';
      const s = Stats.levelSummary(l);
      return `<a class="lv" href="#/level/${l}" style="--c:${lvlColor(l)}">
        <span class="lv-n">${l}</span>
        <span class="lv-t"><b>HSK ${l}</b><small>${fmtNum(n)} คำ · ${s.stages} ด่าน</small></span>
        <span class="lv-pct">${s.pct}<small>%</small></span>
        <span class="bar"><i data-w="${s.pct}%"></i></span>
        <span class="lv-m"><span>${starsHTML(1, 13, 1)}${s.stars}/${s.maxStars}</span><span>${ic('mastered')}จำแม่น ${fmtNum(s.mastered)}</span>${s.review ? `<span style="color:var(--bad)">${ic('repeat')}ทบทวน ${s.review}</span>` : ''}</span>
      </a>`;
    }).join('') + `<div class="lv off" style="--c:var(--muted)"><span class="lv-n">7+</span><span class="lv-t"><b>HSK 7–9</b><small>กำลังเตรียมคำศัพท์</small></span><span class="lv-pct"></span></div>`;
    Fx.settle($('#lvGrid'));
  }
};

/* ---------- LEVEL: stage map ---------- */
const Level = {
  lvl: 1,
  show(arg) {
    const l = parseInt(arg, 10);
    if (!levelWords(l).length) { Router.replace('/learn'); return; }
    this.lvl = l;
    const s = Stats.levelSummary(l), next = Stats.suggestStage(l), n = s.stages;
    $('#v-level').style.setProperty('--c', lvlColor(l));
    $('#lvEyebrow').textContent = `${fmtNum(s.words)} คำ · ${n} ด่าน ด่านละ ${STAGE_SIZE} คำ`;
    $('#lvTitle').textContent = `HSK ${l}`; document.title = `HSK ${l} · Library of Limu`;
    $('#lvSummary').innerHTML = `
      <div class="stat" style="--c:${lvlColor(l)}">${Fx.ring(s.pct / 100)}<span class="k">ความคืบหน้า</span><b class="v"><span data-count="${s.pct}">0</span><small>%</small></b><span class="s">${fmtNum(s.known)}/${fmtNum(s.words)} คำ</span></div>
      <div class="stat"><span class="k">ดาวที่เก็บได้</span><b class="v"><span data-count="${s.stars}">0</span><small>/${s.maxStars}</small></b><span class="s">ผ่านแล้ว ${s.cleared}/${n} ด่าน</span></div>
      <div class="stat"><span class="k">จำแม่นแล้ว</span><b class="v"><span data-count="${s.mastered}">0</span><small>คำ</small></b><span class="s">กำลังเรียน ${s.learning + s.review} คำ</span></div>`;
    const rv = Store.d.review.filter(id => BY_ID.get(id) && BY_ID.get(id).lvl === l);
    $('#lvActions').innerHTML = `<button class="btn primary" id="stNext">${ic('play')}ด่านแนะนำ (${next})</button>
      <button class="btn" id="stRand">${ic('shuffle')}สุ่ม 20 คำ</button>
      ${rv.length ? `<button class="btn danger" id="stRev">${ic('repeat')}ทบทวนคำผิด (${rv.length})</button>` : ''}`;
    $('#stNext').onclick = () => this.open(next);
    $('#stRand').onclick = () => Game.start({ words: shuffle(levelWords(l)).slice(0, 20), title: `HSK ${l} · สุ่ม 20 คำ`, kind: 'random', back: `/level/${l}` });
    if (rv.length) $('#stRev').onclick = () => Game.start({ words: rv.map(id => BY_ID.get(id)), title: `HSK ${l} · ทบทวนคำผิด`, kind: 'review', back: `/level/${l}` });
    let html = '';
    for (let i = 1; i <= n; i++) {
      const st = Stats.stage(l, i), cls = st && st.plays ? (st.stars === 3 ? 'gold' : 'done') : 'fresh';
      html += `<button class="tile ${cls} ${i === next ? 'next' : ''}" style="--i:${i}" data-stage="${i}" aria-label="ด่าน ${i}"><b>${i}</b>${starsHTML(st ? st.stars : 0, 10)}</button>`;
    }
    const grid = $('#stageGrid'); grid.innerHTML = html;
    grid.onclick = e => { const b = e.target.closest('[data-stage]'); if (b) this.open(+b.dataset.stage); };
    Fx.settle($('#lvSummary'));
  },
  open(n) {
    const l = this.lvl, words = stageWords(l, n), st = Stats.stage(l, n);
    const body = `<div class="sheet-h"><div><h3>HSK ${l} · ด่าน ${n}</h3><p>${st && st.plays ? `เล่นแล้ว ${st.plays} ครั้ง · ดีที่สุด ${st.pct}%` : 'ยังไม่เคยเล่น'}</p></div>${starsHTML(st ? st.stars : 0, 20)}</div>
      ${words.map(w => wordRowHTML(w)).join('')}`;
    const foot = `<button class="btn" id="shDict">${ic('brush')}<span class="hz">听写</span></button><button class="btn primary" id="shPlay">${ic('play')}เล่นแฟลชการ์ด</button>`;
    Sheet.open(body, foot);
    $('#shPlay').onclick = () => { Sheet.close(); this.play(l, n); };
    $('#shDict').onclick = () => {
      Sheet.close();
      const c = Store.d.customCfg || {};
      Dicta.start({ words, title: `听写 · HSK ${l} ด่าน ${n}`, ans: c.ans || 'draw', repeat: +c.repeat || 2, rate: +c.rate || S().rate, meanHint: c.meanHint !== false, strict: c.strict !== false, back: `/level/${l}`, kind: 'stage', lvl: l, stage: n });
    };
    $('#sheetBody').onclick = e => { const b = e.target.closest('[data-speak]'); if (b) speakWord(BY_ID.get(b.dataset.speak)); };
  },
  play(l, n) {
    const words = stageWords(l, n);
    if (!words.length) return;
    Game.start({ words, title: `HSK ${l} · ด่าน ${n}`, kind: 'stage', lvl: l, stage: n, back: `/level/${l}` });
  }
};

/* ---------- PRACTICE: custom deck builder ---------- */
const SEC_CHOICES = [5, 6, 8, 10, 15, 20, 30];
const Custom = {
  c: null,
  defaults() { const s = S(); return { type: 'flash', mode: 'manual', count: '', cats: [], stages: {}, picked: [], timer: s.timer, sec: s.sec, answer: s.answer, ask: s.ask, ans: 'draw', repeat: 2, rate: s.rate, meanHint: true, strict: true }; },
  init() {
    const seg = (id, key, conv = x => x) => $(id).addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; this.c[key] = conv(b.dataset.v); this.render(); });
    seg('#cType', 'type'); seg('#cMode', 'mode'); seg('#cQuiz', 'answer'); seg('#cAns', 'ans'); seg('#cAsk', 'ask'); seg('#cTimer', 'timer'); seg('#cRepeat', 'repeat', Number);
    $('#cSec').innerHTML = SEC_CHOICES.map(n => `<button class="chip" data-n="${n}">${n} วิ</button>`).join('');
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
      if (!(await confirmDlg('ลบคำนี้?', `ลบ “${zh}” ออกจากคำของฉัน`, 'ลบ', true))) return;
      removeMyWord(zh); this.render();
    });
    $('#cRandomize').onclick = () => this.randomize();
    $('#cCreate').onclick = () => this.create();
  },
  catList() {
    const list = LEVELS.filter(l => levelWords(l).length).map(l => ({ k: String(l), name: `HSK ${l}`, n: levelWords(l).length }));
    if (levelWords('C').length) list.push({ k: 'C', name: 'คำของฉัน', n: levelWords('C').length });
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
    segSet($('#cType'), c.type); segSet($('#cMode'), c.mode); segSet($('#cQuiz'), c.answer); segSet($('#cAns'), c.ans); segSet($('#cAsk'), c.ask); segSet($('#cTimer'), c.timer); segSet($('#cRepeat'), c.repeat);
    const rv = Stats.reviewIds().length;
    $('#cReviewCnt').textContent = rv; $('#cReviewCnt').hidden = !rv;
    $('#cCount').value = c.count; $('#cCount').placeholder = c.mode === 'random' ? '20' : 'ทั้งหมด';
    $$('#cSec .chip').forEach(b => b.classList.toggle('on', +b.dataset.n === +c.sec)); $('#cSec').hidden = c.timer !== 'countdown';
    $('#cRate').value = c.rate; rangeFill($('#cRate')); $('#cRateVal').textContent = rateTxt(c.rate);
    $('#cMeanHint').checked = c.meanHint; $('#cStrict').checked = c.strict;
    $('#cFlashOpts').hidden = c.type !== 'flash';
    $('#cDictOpts').hidden = c.type !== 'tingxie';
    $('#cStrictRow').hidden = c.ans !== 'type';
    $('#cPickBox').hidden = c.mode !== 'manual';
    $('#cCatHint').textContent = c.mode === 'manual' ? 'เลือกระดับ แล้วเลือกด่าน' : 'ไม่เลือก = ทุกระดับ';
    this.renderCountChips(); this.renderCats(); this.renderStages(); this.renderPicked(); this.renderSearch(); this.renderMyWords(); this.renderSummary();
  },
  renderCountChips() { $$('#cCountChips .chip').forEach(b => b.classList.toggle('on', b.dataset.n === String(this.c.count))); },
  renderCats() {
    const list = this.catList(), c = this.c;
    const allOn = list.length > 0 && list.every(x => c.cats.includes(x.k));
    $('#cCats').innerHTML = list.map(x => `<button class="chip ${c.cats.includes(x.k) ? 'on' : ''}" data-k="${x.k}" style="--c:${lvlColor(x.k === 'C' ? 'C' : +x.k)}"><span class="dot"></span>${x.name}<small>${fmtNum(x.n)}</small></button>`).join('')
      + `<button class="chip ${allOn ? 'on' : ''}" data-k="ALL">ทั้งหมด</button>`;
  },
  renderStages() {
    const c = this.c, wrap = $('#cStagesWrap');
    if (c.mode !== 'manual') { wrap.innerHTML = ''; return; }
    if (!c.cats.length) { wrap.innerHTML = '<p class="hint-p">เลือกระดับก่อน แล้วเลือกด่านที่ต้องการ ลากนิ้วผ่านหลายด่านเพื่อเลือกทีเดียวได้</p>'; return; }
    wrap.innerHTML = c.cats.map(k => {
      if (k === 'C') return `<div class="stage-group"><div class="gh" style="--c:var(--hskC)"><span class="dot"></span>คำของฉัน<span class="badge">${levelWords('C').length} คำ · ใช้ทั้งหมด</span></div></div>`;
      const n = stageCount(+k), on = new Set(c.stages[k] || []);
      let chips = ''; for (let i = 1; i <= n; i++) chips += `<button type="button" class="${on.has(i) ? 'on' : ''}" data-k="${k}" data-n="${i}">${i}</button>`;
      return `<div class="stage-group"><div class="gh" style="--c:${lvlColor(+k)}"><span class="dot"></span>HSK ${k}<span class="badge">${on.size}/${n} ด่าน</span><span class="sp"></span>
        <button class="btn sm ghost" data-allk="${k}">ทั้งหมด</button><button class="btn sm ghost" data-nonek="${k}">ล้าง</button></div>
        <div class="stage-chips">${chips}</div></div>`;
    }).join('');
  },
  renderSearch() {
    const q = $('#cSearch').value.trim(), box = $('#cSearchRes');
    if (!q) { box.innerHTML = ''; return; }
    const res = Dict.search(q, WORDS).slice(0, 30);
    box.innerHTML = res.length ? res.map(w => { const on = this.c.picked.includes(w.id); return `<div class="sr"><span class="hz">${esc(w.zh)}</span><div class="t"><span class="pyx">${esc(w.py)}</span>${lvlBadge(w.lvl)}<br>${esc(meaningText(w))}</div><button class="btn sm ${on ? 'good' : 'soft'}" data-add="${esc(w.id)}">${on ? `${ic('check')}เพิ่มแล้ว` : `${ic('plus')}เพิ่ม`}</button></div>`; }).join('') : '<p class="hint-p" style="padding:6px 4px">ไม่พบคำศัพท์</p>';
  },
  renderPicked() {
    $('#cPicked').innerHTML = this.c.picked.map(id => { const w = BY_ID.get(id); return w ? `<span class="wchip"><span class="hz">${esc(w.zh)}</span><button class="rm" data-rm="${esc(id)}" aria-label="เอาออก">${ic('x')}</button></span>` : ''; }).join('');
  },
  renderMyWords() {
    $('#myWordsList').innerHTML = levelWords('C').map(w => `<span class="wchip"><span class="hz">${esc(w.zh)}</span><small class="pyx">${esc(w.py)}</small><button class="rm" data-delmw="${esc(w.zh)}" aria-label="ลบ">${ic('x')}</button></span>`).join('');
  },
  addMyWord() {
    const zh = $('#mwZh').value.trim(), py = $('#mwPy').value.trim(), th = $('#mwTh').value.trim(), en = $('#mwEn').value.trim();
    if (!zh || !py) { toast('กรอกตัวจีนและพินอินให้ครบ'); return; }
    if (!/[㐀-鿿]/.test(zh)) { toast('ช่องตัวจีนต้องมีอักษรจีนอย่างน้อย 1 ตัว'); return; }
    if (!th && !en) { toast('ใส่ความหมายไทยหรืออังกฤษอย่างน้อย 1 ช่อง'); return; }
    if (Store.d.customWords.some(w => w.zh === zh && w.py === py)) { toast('มีคำนี้อยู่แล้ว'); return; }
    Store.d.customWords.push({ zh, py, th, en }); Store.save(); buildWords();
    const id = `C:${zh}:${py}`; if (!this.c.picked.includes(id)) this.c.picked.push(id);
    ['#mwZh', '#mwPy', '#mwTh', '#mwEn'].forEach(s => $(s).value = '');
    sfx('save'); toast(`เพิ่ม “${zh}” แล้ว และใส่ลงสำรับนี้`, { icon: 'check' }); this.render();
  },
  /** returns {words, label, poolSize} for the current configuration */
  build() {
    const c = this.c; let pool = [], label = '';
    const cats = c.cats.length ? c.cats : this.catList().map(x => x.k);
    const catName = k => k === 'C' ? 'คำของฉัน' : 'HSK ' + k;
    if (c.mode === 'manual') {
      const parts = [];
      c.cats.forEach(k => {
        if (k === 'C') { pool.push(...levelWords('C')); parts.push('คำของฉัน'); return; }
        const st = c.stages[k] || []; if (!st.length) return;
        st.forEach(n => pool.push(...stageWords(+k, n)));
        parts.push(`${catName(k)} ${st.length === stageCount(+k) ? 'ทุกด่าน' : `ด่าน ${compactRange(st)}`}`);
      });
      const extra = c.picked.map(id => BY_ID.get(id)).filter(Boolean);
      const ids = new Set(pool.map(w => w.id)); extra.forEach(w => { if (!ids.has(w.id)) { pool.push(w); ids.add(w.id); } });
      if (extra.length) parts.push(`+${extra.length} คำที่เลือก`);
      label = parts.join(', ');
    } else if (c.mode === 'random') {
      cats.forEach(k => pool.push(...levelWords(k === 'C' ? 'C' : +k)));
      label = `สุ่มจาก ${c.cats.length ? c.cats.map(catName).join(', ') : 'ทุกระดับ'}`;
    } else {
      const set = new Set(cats.map(String));
      pool = Stats.reviewIds().map(id => BY_ID.get(id)).filter(w => w && set.has(String(w.lvl)));
      label = 'คำที่ตอบผิดและคำที่ถึงรอบทบทวน';
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
      el.innerHTML = `<span>${this.c.mode === 'review' ? (Stats.reviewIds().length ? 'ไม่มีคำทบทวนในระดับที่เลือก' : 'ยังไม่มีคำที่ต้องทบทวน') : (this.c.mode === 'manual' ? 'ยังไม่ได้เลือกด่านหรือคำศัพท์' : 'ไม่มีคำศัพท์')}</span>`;
      $('#cCreate').disabled = true; return;
    }
    $('#cCreate').disabled = false;
    el.innerHTML = `<b>${fmtNum(words.length)}</b> คำ${poolSize > words.length ? ` จาก ${fmtNum(poolSize)}` : ''}<span>${esc(label)}</span>`;
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
    toast(`สุ่มให้แล้ว: HSK ${k} ด่าน ${compactRange(c.stages[k])} · ${c.count} คำ`, { icon: 'shuffle' });
  },
  create() {
    const { words, label } = this.build();
    if (!words.length) { toast('ยังไม่มีคำศัพท์ให้เล่น'); return; }
    const c = this.c;
    Store.d.customCfg = { type: c.type, mode: c.mode, count: c.count, cats: c.cats, stages: c.stages, timer: c.timer, sec: c.sec, answer: c.answer, ask: c.ask, ans: c.ans, repeat: c.repeat, rate: c.rate, meanHint: c.meanHint, strict: c.strict };
    Store.save();
    const kind = c.mode === 'review' ? 'review' : 'custom';
    if (c.type === 'flash') Game.start({ words, title: c.mode === 'review' ? 'ทบทวนคำศัพท์' : `สำรับของฉัน · ${words.length} คำ`, sub: label, kind, back: '/practice', answer: c.answer, ask: c.ask, timer: c.timer, sec: c.sec });
    else Dicta.start({ words, title: `听写 · ${words.length} คำ`, ans: c.ans, repeat: c.repeat, rate: c.rate, meanHint: c.meanHint, strict: c.strict, back: '/practice', kind });
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
    $('#qMore').onclick = () => { this.st.limit += 200; this.render(); };
    $('#qList').addEventListener('click', e => {
      const sp = e.target.closest('[data-speak]'); if (sp) { speakWord(BY_ID.get(sp.dataset.speak)); return; }
      const row = e.target.closest('.wr'); if (row) this.detail(row.dataset.id);
    });
  },
  show() {
    if (this.preset) { Object.assign(this.st, { q: '', lvl: 'all', status: '', pos: '', limit: 120 }, this.preset); this.preset = null; $('#qInput').value = this.st.q; }
    const lv = [['all', 'ทั้งหมด']].concat(LEVELS.filter(l => levelWords(l).length).map(l => [String(l), `HSK ${l}`]));
    if (levelWords('C').length) lv.push(['C', 'คำของฉัน']);
    if (!lv.some(x => x[0] === this.st.lvl)) this.st.lvl = 'all';
    $('#qLevels').innerHTML = lv.map(([k, n]) => `<button class="chip" data-l="${k}" ${k !== 'all' ? `style="--c:${lvlColor(k === 'C' ? 'C' : +k)}"` : ''}>${k !== 'all' ? '<span class="dot"></span>' : ''}${n}</button>`).join('');
    const order = Object.keys(POS_NAME), keys = [...new Set(WORDS.map(w => w._pk))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    $('#qPos').innerHTML = `<option value="">ทุกชนิดคำ</option>` + keys.map(k => `<option value="${k}">${POS_NAME[k] || k}</option>`).join('');
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
    $('#qCount').textContent = `${fmtNum(res.length)} คำ${st.q.trim() ? ` สำหรับ “${st.q.trim()}”` : ''}`;
    const list = $('#qList'), shown = res.slice(0, st.limit);
    list.innerHTML = shown.length ? shown.map(w => wordRowHTML(w, { badges: true })).join('') : emptyHTML('search', 'ไม่พบคำศัพท์', 'ลองพิมพ์พินอินแบบไม่มีวรรณยุกต์ เช่น xuexi');
    $('#qMore').hidden = res.length <= st.limit;
    $('#qMore').textContent = `แสดงเพิ่ม (${fmtNum(res.length - st.limit)} คำ)`;
    $('#qClear').hidden = !st.q;
  },
  detail(id) {
    const w = BY_ID.get(id); if (!w) return;
    const ws = Store.d.ws[id] || { s: 0, c: 0, w: 0 }, st = Stats.status(id);
    const inReview = Store.d.review.includes(id), hasHan = /[㐀-鿿]/.test(w.zh);
    const body = `<div class="d-head"><div class="row center" style="gap:6px">${lvlBadge(w.lvl)}${posBadge(w)}</div>
        <div class="d-hz">${esc(w.zh)}</div><div class="d-py pyx">${esc(w.py)}</div>
        <div class="d-th lang-th">${esc(w.th)}</div><div class="d-en lang-en">${esc(w.en)}</div></div>
      <div class="d-acts"><button class="btn sm soft" data-say="w">${ic('vol')}ฟังเสียง</button>${hasHan ? `<button class="btn sm" data-say="strokes">${ic('brush')}ลำดับขีด</button>` : ''}</div>
      <div class="strokes" id="dStrokes"></div>
      ${w.ex_zh ? `<div class="ex-card"><div><div class="expy pyx">${esc(w.ex_py)}</div><div class="exzh">${esc(w.ex_zh)}</div><div class="lang-th">${esc(w.ex_th)}</div><div class="muted lang-en">${esc(w.ex_en)}</div></div><button class="ibtn sm" data-say="ex" aria-label="ฟังประโยค">${ic('vol')}</button></div>` : ''}
      <div class="kv"><div><b>${ws.s || 0}</b><span>เคยเจอ</span></div><div><b style="color:var(--good)">${ws.c || 0}</b><span>ถูก</span></div><div><b style="color:var(--bad)">${ws.w || 0}</b><span>ผิด</span></div><div><b class="sm">${STATUS_NAME[st]}</b><span>สถานะ</span></div></div>
      ${ws.t ? `<p class="fine" style="margin-top:8px">เล่นล่าสุด ${fmtDate(ws.t)}</p>` : ''}`;
    const foot = `<button class="btn" data-act="rv">${inReview ? 'เอาออกจากทบทวน' : `${ic('plus')}ทบทวน`}</button>${w.custom ? `<button class="btn danger" data-act="del">ลบ</button>` : ''}<button class="btn primary" data-act="play">${ic('play')}ฝึกคำนี้</button>`;
    Sheet.open(body, foot);
    $('#sheetBody').onclick = e => { const b = e.target.closest('[data-say]'); if (!b) return; if (b.dataset.say === 'ex') TTS.speak(w.ex_zh); else if (b.dataset.say === 'strokes') this.strokes(w); else speakWord(w); };
    $('#sheetFoot').onclick = async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'rv') { const d = Store.d; if (d.review.includes(id)) d.review = d.review.filter(x => x !== id); else d.review.push(id); Store.save(); Sheet.close(); if (currentView === 'v-dict') this.render(); toast(d.review.includes(id) ? 'ใส่รายการทบทวนแล้ว' : 'เอาออกจากรายการทบทวนแล้ว', { icon: 'check' }); }
      else if (b.dataset.act === 'play') { Sheet.close(); const same = levelWords(w.lvl).filter(x => x.id !== w.id); Game.start({ words: [w, ...shuffle(same).slice(0, 4)], title: `ฝึก “${w.zh}” กับคำระดับเดียวกัน`, kind: 'custom', back: location.hash.slice(1) || '/dict' }); }
      else if (b.dataset.act === 'del') { Sheet.close(); if (await confirmDlg('ลบคำนี้?', `ลบ “${w.zh}” ออกจากคำของฉัน`, 'ลบ', true)) { removeMyWord(w.zh); if (currentView === 'v-dict') this.show(); } }
    };
  },
  /** animated stroke order (loads the open-source Hanzi Writer on demand — needs internet) */
  async strokes(w) {
    const host = $('#dStrokes'); if (!host) return;
    const chars = Array.from(w.zh).filter(c => /[㐀-鿿]/.test(c));
    const tok = (this._stok = (this._stok || 0) + 1);
    host.innerHTML = '<span class="muted" style="font-size:13px">กำลังโหลดลำดับขีด…</span>';
    try { await Fx.script('https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js'); }
    catch (e) { host.innerHTML = ''; toast('ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อดูลำดับขีด', { icon: 'info' }); return; }
    if (tok !== this._stok || !host.isConnected || !window.HanziWriter) return;
    host.innerHTML = chars.map((c, i) => `<div class="stroke-cell" id="skc${i}" style="animation-delay:${i * 60}ms"></div>`).join('');
    const writers = chars.map((c, i) => HanziWriter.create('skc' + i, c, { width: 109, height: 109, padding: 9, showOutline: true, showCharacter: false, strokeColor: '#1b1b19', outlineColor: '#e6dfd2', strokeAnimationSpeed: 1.15, delayBetweenStrokes: 110, onLoadCharDataError: () => { const el = $('#skc' + i); if (el) el.remove(); } }));
    for (const wr of writers) { if (tok !== this._stok || !host.isConnected) return; try { await wr.animateCharacter(); } catch (e) { } await sleep(160); }
  }
};
function openPosInDict(k) {
  if (!WORDS.some(w => w._pk === k)) { toast('ยังไม่มีคำชนิดนี้ในคลังคำศัพท์', { icon: 'info' }); return; }
  Dict.preset = { pos: k }; Router.go('/dict');
}

/* ---------- STATISTICS ---------- */
const StatsView = {
  range: 30, pmode: 'line', hidden: new Set(), _bk: null,
  init() {
    $('#stRange').addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (!b) return; this.range = +b.dataset.r; this.show(); });
    $('#stBody').addEventListener('click', e => {
      const sp = e.target.closest('[data-speak]'); if (sp) { speakWord(BY_ID.get(sp.dataset.speak)); return; }
      const m = e.target.closest('#stPmode [data-v]'); if (m) { this.pmode = m.dataset.v; this.drawProgress(); return; }
      const lg = e.target.closest('[data-lv]'); if (lg) { const l = +lg.dataset.lv; if (this.hidden.has(l)) this.hidden.delete(l); else this.hidden.add(l); this.drawProgress(); return; }
      const h = e.target.closest('.sess .h'); if (h) h.parentElement.classList.toggle('open');
    });
  },
  /** time buckets for every chart: 7/30 days → daily, 90 days → weekly, all → last 12 months */
  buckets(R) {
    const today = dayStart(), out = [], dm = d => `${d.getDate()} ${TH_MONTH[d.getMonth()]}`;
    if (R === 7 || R === 30) for (let i = R - 1; i >= 0; i--) { const d = addDays(today, -i); out.push({ label: R === 7 ? TH_DAY[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`, full: dm(d), from: d.getTime(), to: addDays(d, 1).getTime() }); }
    else if (R === 90) for (let i = 12; i >= 0; i--) { const to = addDays(today, 1 - i * 7), from = addDays(to, -7); out.push({ label: `${from.getDate()}/${from.getMonth() + 1}`, full: `${dm(from)} – ${dm(addDays(to, -1))}`, from: from.getTime(), to: to.getTime() }); }
    else for (let i = 11; i >= 0; i--) { const m = new Date(today.getFullYear(), today.getMonth() - i, 1), e = new Date(today.getFullYear(), today.getMonth() - i + 1, 1); out.push({ label: TH_MONTH[m.getMonth()], full: `${TH_MONTH[m.getMonth()]} ${m.getFullYear() + 543}`, from: m.getTime(), to: e.getTime() }); }
    return out;
  },
  show() {
    segSet($('#stRange'), this.range);
    const d = Store.d, R = this.range, body = $('#stBody');
    if (!d.sessions.length && !Object.keys(d.legacy.days || {}).length && !Object.keys(d.stages).length) {
      body.innerHTML = `<div class="card">${emptyHTML('chart', 'ยังไม่มีข้อมูล', 'เล่นแฟลชการ์ดหรือ 听写 สักรอบ แล้วสถิติจะขึ้นที่นี่', `<br><a class="btn primary" href="#/learn">${ic('play')}เริ่มเรียน</a>`)}</div>`;
      return;
    }
    const bk = this._bk = this.buckets(R), since = R ? bk[0].from : -Infinity, days = Stats.days();
    bk.forEach(b => { b.cards = 0; b.correct = 0; b.ms = 0; });
    let ms = 0, cards = 0, correct = 0, nSess = 0, activeDays = 0;
    Object.entries(days).forEach(([k, v]) => {
      const ts = new Date(k + 'T00:00:00').getTime();
      const b = bk.find(x => ts >= x.from && ts < x.to); if (b) { b.cards += v.cards; b.correct += v.correct; b.ms += v.ms; }
      if (ts >= since) { ms += v.ms; cards += v.cards; correct += v.correct; nSess += v.sessions; if (v.sessions > 0 || v.cards > 0) activeDays++; }
    });
    const sess = d.sessions.filter(s => s.ts >= since), streak = Stats.streak(days), rv = Stats.reviewIds();
    const rangeName = R ? `${R} วันล่าสุด` : 'ทั้งหมด', per = R === 7 || R === 30 ? 'วัน' : R === 90 ? 'สัปดาห์' : 'เดือน';
    const hsk = WORDS.filter(w => w.lvl !== 'C'), mem = { mastered: 0, learning: 0, review: 0, new: 0 };
    hsk.forEach(w => { mem[Stats.status(w.id)]++; });

    let html = '';
    if (rv.length) html += `<button class="cta-rv" data-go="/practice/review"><span class="li-ic">${ic('repeat')}</span><span class="li-t"><b>${rv.length} คำรอทบทวน</b><small>คำที่ตอบผิดและคำที่ถึงรอบทบทวน แตะเพื่อเริ่ม</small></span>${ic('chev-r')}</button>`;
    html += `<div class="kpis">
      <div class="stat" style="--c:var(--hsk3)"><span class="k">${ic('flame')}เรียนต่อเนื่อง</span><b class="v"><span data-count="${streak.cur}">0</span><small>วัน</small></b><span class="s">สูงสุด ${streak.best} วัน</span></div>
      <div class="stat" style="--c:var(--hsk5)"><span class="k">${ic('clock')}เวลาเรียน</span><b class="v" style="font-size:clamp(19px,3.6vw,26px);margin-top:9px">${fmtDur(ms)}</b><span class="s">${rangeName}</span></div>
      <div class="stat"><span class="k">${ic('target')}ความแม่นยำ</span><b class="v">${cards ? `<span data-count="${Math.round(correct / cards * 100)}">0</span><small>%</small>` : '—'}</b><span class="s">${fmtNum(correct)}/${fmtNum(cards)} การ์ด</span></div>
      <div class="stat" style="--c:var(--hsk6)"><span class="k">${ic('cards')}การ์ดที่ทำ</span><b class="v"><span data-count="${cards}">0</span></b><span class="s">${fmtNum(nSess)} รอบ · ${activeDays} วัน</span></div>
    </div><div class="st-grid">`;

    // per level (stage based — same number the old dashboard showed)
    html += `<div class="card"><div class="ch"><div><h3>ระดับ HSK</h3><div class="cap">คะแนนดีที่สุดของทุกด่านรวมกัน เทียบกับจำนวนคำทั้งระดับ</div></div></div>
      ${LEVELS.filter(l => levelWords(l).length).map(l => { const s = Stats.levelSummary(l); return `<div class="lp" style="--c:${lvlColor(l)}"><div class="lp-h"><b>HSK ${l}</b><span>${fmtNum(s.known)} / ${fmtNum(s.words)}<em>${s.pct}%</em></span></div><span class="bar"><i data-w="${s.pct}%"></i></span>
        <div class="lp-m"><span>${starsHTML(1, 12, 1)}${s.stars}/${s.maxStars}</span><span>${ic('mastered')}จำแม่น ${fmtNum(s.mastered)} คำ</span><span>ผ่าน ${s.cleared}/${s.stages} ด่าน</span></div></div>`; }).join('')}
      <div class="lp off" style="margin-top:16px"><div class="lp-h"><b>HSK 7–9</b><span><em>ยังไม่มีคำศัพท์</em></span></div></div></div>`;

    html += `<div class="card"><div class="ch"><div><h3>ความคืบหน้าตามเวลา</h3><div class="cap" id="stPcap"></div></div>
      <div class="seg sm" id="stPmode"><button data-v="line" aria-label="กราฟเส้น">${ic('line')}</button><button data-v="bar" aria-label="กราฟแท่ง">${ic('chart')}</button></div></div>
      <div class="chart" id="cProg"></div><div class="legend" id="stPleg"></div></div>`;

    html += `<div class="card"><div class="ch"><div><h3>ปฏิทินการเรียน</h3><div class="cap">26 สัปดาห์ล่าสุด · สีเข้ม = เรียนนานขึ้น</div></div></div><div class="heat-wrap" id="stHeat"></div>
      <div class="heat-legend">น้อย <i style="background:var(--h0)"></i><i style="background:var(--h1)"></i><i style="background:var(--h2)"></i><i style="background:var(--h3)"></i><i style="background:var(--h4)"></i> มาก</div></div>`;

    html += `<div class="card"><div class="ch"><div><h3>ความจำคำศัพท์</h3><div class="cap">จำแม่น = ตอบถูกติดกันตั้งแต่ 2 ครั้ง</div></div></div>
      <div class="mem">${[['mastered', 'จำแม่น'], ['learning', 'กำลังเรียน'], ['review', 'รอทบทวน'], ['new', 'ยังไม่เคยเจอ']].map(([k, n]) => mem[k] ? `<i class="c-${k}" style="flex:0 1 0" data-flex="${mem[k]}" data-tip="${n} ${fmtNum(mem[k])} คำ"></i>` : '').join('')}</div>
      <div class="legend"><span><i class="c-mastered"></i>จำแม่น <b>${fmtNum(mem.mastered)}</b></span><span><i class="c-learning"></i>กำลังเรียน <b>${fmtNum(mem.learning)}</b></span><span><i class="c-review"></i>รอทบทวน <b>${fmtNum(mem.review)}</b></span><span><i class="c-new"></i>ยังไม่เคยเจอ <b>${fmtNum(mem.new)}</b></span></div>
      <div class="modes" style="margin-top:16px">${[['flash', 'cards', 'แฟลชการ์ด', 'การ์ด'], ['dict', 'brush', '听写', 'คำ']].map(([mode, icn, name, unit]) => { const a = sess.filter(s => s.mode === mode && !s.lg), c = a.reduce((x, s) => x + s.total, 0), k = a.reduce((x, s) => x + s.correct, 0); return `<div><span class="k">${ic(icn)}${name}</span><b>${c ? Math.round(k / c * 100) + '%' : '—'}</b><small>${a.length} รอบ · ${fmtNum(c)} ${unit} · ${fmtDur(a.reduce((x, s) => x + (s.dur || 0), 0))}</small></div>`; }).join('')}</div></div>`;

    html += `<div class="card"><div class="ch"><div><h3>การ์ดที่ทำต่อ${per}</h3><div class="cap">${R ? rangeName : '12 เดือนล่าสุด'} · แตะแท่งเพื่อดูตัวเลข</div></div></div><div class="chart" id="cCards"></div></div>`;
    html += `<div class="card"><div class="ch"><div><h3>ความแม่นยำ</h3><div class="cap">ราย${per} · เฉพาะช่วงที่มีการเล่น</div></div></div><div class="chart" id="cAcc"></div></div>`;

    const hard = Object.entries(d.ws).filter(([id, v]) => v.w > 0 && BY_ID.has(id)).sort((a, b) => (b[1].w - a[1].w) || (a[1].c / a[1].s - b[1].c / b[1].s)).slice(0, 14);
    html += `<div class="card"><div class="ch"><div><h3>คำที่พลาดบ่อย</h3><div class="cap">ตัวเลข = จำนวนครั้งที่ผิด / ที่เจอทั้งหมด</div></div></div>
      ${hard.length ? `<div class="wchips">${hard.map(([id, v]) => { const w = BY_ID.get(id); return `<button class="wchip no" data-speak="${esc(id)}" title="${esc(w.py)} · ${esc(meaningText(w))}"><span class="hz">${esc(w.zh)}</span><small>${v.w}/${v.s}</small></button>`; }).join('')}</div><button class="btn soft block" id="stHard" style="margin-top:14px">${ic('play')}ฝึกคำเหล่านี้ (${hard.length} คำ)</button>` : '<div class="empty" style="padding:14px">ยังไม่มีคำที่ตอบผิด</div>'}</div>`;
    html += `<div class="card"><div class="ch"><div><h3>ช่วงเวลาที่เรียน</h3><div class="cap">นาทีรวมตามช่วงเวลาของวัน · ${rangeName}</div></div></div><div class="chart" id="cHours"></div></div>`;

    const recent = [...sess].sort((a, b) => b.ts - a.ts).slice(0, 30);
    html += `<div class="card span2"><div class="ch"><div><h3>ประวัติล่าสุด</h3><div class="cap">${rangeName} · แตะเพื่อดูคำในรอบนั้น</div></div></div>${recent.length ? recent.map(s => {
      const pct = s.total ? Math.round(s.correct / s.total * 100) : 0;
      const icn = s.mode === 'dict' ? 'brush' : s.kind === 'review' || s.kind === 'retry' ? 'repeat' : s.kind === 'stage' ? 'learn' : 'cards';
      const det = (s.words || []).map(([id, ok]) => { const w = BY_ID.get(id); return w ? `<span class="wchip ${ok ? 'ok' : 'no'}"><span class="hz">${esc(w.zh)}</span></span>` : ''; }).join('');
      return `<div class="sess"><button class="h"><span class="s-ic">${ic(icn)}</span><span class="m"><b>${esc(s.label)}${s.partial ? ' <span class="badge">ไม่จบรอบ</span>' : ''}${s.lg ? ' <span class="badge">เวอร์ชันเก่า</span>' : ''}</b><small>${fmtDate(s.ts)}${s.dur ? ' · ' + fmtClock(s.dur) : ''}</small></span>
        <span class="sc"><b>${s.correct}/${s.total}</b>${s.stars ? starsHTML(s.stars, 11) : `<small>${pct}%</small>`}</span></button><div class="det">${det || '<small class="muted">ไม่มีรายละเอียดคำ</small>'}</div></div>`;
    }).join('') : '<div class="empty" style="padding:14px">ไม่มีการเล่นในช่วงนี้</div>'}</div>`;
    html += '</div>';
    body.innerHTML = html;

    // ---- charts need real widths, so they are drawn after insertion
    this.heatmap($('#stHeat'), days);
    Charts.bars($('#cCards'), bk.map(b => ({ label: b.label, v: b.cards, tip: `${b.full} · ${b.cards} การ์ด` })), { h: 160 });
    Charts.lines($('#cAcc'), bk.map(b => ({ label: b.label, tip: b.cards ? `${b.full} · ${Math.round(b.correct / b.cards * 100)}% (${b.correct}/${b.cards})` : '' })), [{ color: 'var(--accent)', values: bk.map(b => b.cards ? Math.round(b.correct / b.cards * 100) : null) }], { h: 160, max: 100, suffix: '%', area: true });
    const hrs = [0, 0, 0, 0, 0, 0]; sess.filter(s => !s.lg).forEach(s => { hrs[Math.floor(new Date(s.ts).getHours() / 4)] += (s.dur || 0) / 60000; });
    const hl = ['00–04', '04–08', '08–12', '12–16', '16–20', '20–24'];
    Charts.bars($('#cHours'), hrs.map((v, i) => ({ label: hl[i], v: Math.round(v), tip: `${hl[i]} น. · ${Math.round(v)} นาที` })), { h: 130, color: 'var(--hsk5)' });
    this.drawProgress();
    const hb = $('#stHard'); if (hb) hb.onclick = () => Game.start({ words: hard.map(([id]) => BY_ID.get(id)), title: 'ฝึกคำที่พลาดบ่อย', kind: 'review', back: '/stats' });
    Fx.settle(body);
  },
  /** per-level progress over time: line = cumulative %, bars = words gained in each period */
  drawProgress() {
    const el = $('#cProg'), bk = this._bk; if (!el || !bk) return;
    segSet($('#stPmode'), this.pmode);
    const now = Date.now(), cuts = [bk[0].from - 1].concat(bk.map(b => Math.min(b.to - 1, now)));
    const tl = Stats.timeline(cuts), fin = tl[tl.length - 1];
    const lv = LEVELS.filter(l => levelWords(l).length && fin[l] > 0), vis = lv.filter(l => !this.hidden.has(l));
    const pct = (i, l) => tl[i][l] / levelWords(l).length * 100;
    $('#stPcap').textContent = this.pmode === 'line' ? 'สะสม · % ของคำทั้งระดับที่ผ่านแล้ว' : 'จำนวนคำที่ผ่านเพิ่มในแต่ละช่วง';
    $('#stPleg').innerHTML = lv.map(l => `<button class="${this.hidden.has(l) ? 'off' : ''}" data-lv="${l}" style="--c:${lvlColor(l)}"><i></i>HSK ${l} <b>${Math.round(pct(tl.length - 1, l))}%</b></button>`).join('');
    if (!lv.length) { el.innerHTML = '<div class="empty" style="padding:30px 10px">เล่นด่านในหน้าเรียนสักรอบ แล้วกราฟจะเริ่มขึ้นที่นี่</div>'; return; }
    if (this.pmode === 'line') {
      Charts.lines(el, bk.map((b, i) => ({ label: b.label, tip: `${b.full} · ` + (vis.map(l => `HSK ${l} ${Math.round(pct(i + 1, l))}%`).join(' · ') || '—') })),
        vis.map(l => ({ color: lvlColor(l), values: bk.map((_, i) => pct(i + 1, l)) })), { h: 190, max: 100, suffix: '%', dots: bk.length <= 16 });
    } else {
      const gain = (i, l) => Math.max(0, tl[i + 1][l] - tl[i][l]);
      Charts.stacked(el, bk.map((b, i) => { const parts = vis.filter(l => gain(i, l) > 0).map(l => `HSK ${l} +${gain(i, l)}`); return { label: b.label, tip: parts.length ? `${b.full} · ${parts.join(' · ')} คำ` : '' }; }),
        vis.map(l => ({ color: lvlColor(l), values: bk.map((_, i) => gain(i, l)) })), { h: 190 });
    }
  },
  heatmap(el, days) {
    const today = dayStart(), weeks = 26;
    const first = addDays(today, -((weeks - 1) * 7 + today.getDay()));
    let cells = '';
    for (let i = 0; i < weeks * 7; i++) {
      const dd = addDays(first, i);
      if (dd > today) { cells += '<i class="pad"></i>'; continue; }
      const k = ymd(dd), v = days[k], min = v ? v.ms / 60000 : 0, act = v && (v.sessions || v.cards);
      const lv = !act ? 0 : min < 5 ? 1 : min < 15 ? 2 : min < 30 ? 3 : 4;
      const tip = `${dd.getDate()} ${TH_MONTH[dd.getMonth()]} ${dd.getFullYear() + 543} · ${act ? `${Math.round(min)} นาที · ${v.cards} การ์ด` : 'ไม่ได้เรียน'}`;
      cells += `<i class="${lv ? 'l' + lv : ''} ${k === ymd(today) ? 'today' : ''}" data-tip="${tip}"></i>`;
    }
    const cell = clamp(Math.floor(((el.clientWidth || 400) - 25 * 3) / 26), 11, 16);
    el.innerHTML = `<div class="heat" style="--hc:${cell}px">${cells}</div>`;
    el.scrollLeft = el.scrollWidth;
  }
};

/* ---------- LIBRARY & BOOK READER ---------- */
const BOOK_COLOR = { green: '#2c8259', blue: '#2e6aa8', orange: '#c2631f', red: '#b0433a', purple: '#74489d', dark: '#3b4759' };
const SHELF = [
  { id: 'pinyin', tag: 'Phonetic', hz: '拼音', th: 'Pinyin ฐานเสียง', vol: '01', c: 'green' }, { tag: 'Writing', hz: '基本笔画', th: 'ลำดับการเขียน', vol: '02', c: 'orange' }, { tag: 'Origin', hz: '六书', th: 'อักษร 6 ประเภท', vol: '03', c: 'purple' },
  { tag: 'Radicals', hz: '部首查字', th: 'รากศัพท์ 214 ตัว', vol: '04', c: 'red' }, { id: 'pos', tag: 'Grammar', hz: '汉语词类', th: 'ชนิดของคำ 13 ชนิด', vol: '05', c: 'blue' }, { tag: 'Rules', hz: '语法手册', th: 'คู่มือไวยากรณ์จีน', vol: '06', c: 'dark' },
  { tag: 'Time', hz: '时间表达', th: 'การบอกเวลา', vol: '07', c: 'blue' }, { tag: 'HSK 4-6', hz: '高频词汇', th: 'ศัพท์ระดับกลาง-สูง', vol: '08', c: 'green' }, { tag: 'Idioms', hz: '成语大全', th: 'สำนวนจีน 4 ตัว', vol: '09', c: 'orange' },
  { tag: 'Measure', hz: '常用量词', th: 'ลักษณนามใช้บ่อย', vol: '10', c: 'red' }, { tag: 'Syntax', hz: '句型结构', th: 'รูปแบบโครงสร้างประโยค', vol: '11', c: 'purple' }, { tag: 'Synonym', hz: '近义词辨析', th: 'คำเหมือน/คำสับสน', vol: '12', c: 'dark' },
  { id: 'deep', tag: 'Pronunciation', hz: '发音进阶', th: 'Pinyin เจาะลึกการออกเสียง', vol: '13', c: 'green' }
];
const BOOK_META = {
  pinyin: { vol: 'VOL. 01 · Phonetic', title: '拼音 Pinyin ฐานเสียง', pages: () => BOOKS.py, labels: ['a', 'b', '1', '2', '3', '4'], toc: 1 },
  deep: { vol: 'VOL. 13 · Pronunciation', title: '发音进阶 เจาะลึกการออกเสียง', pages: () => BOOKS.deep, labels: ['a', 'b', '1', '2', '3', '4', '5', '6', '7', '8'], toc: 1 },
  pos: { vol: 'VOL. 05 · Grammar', title: '汉语词类 ชนิดของคำ', pages: () => [`<h3>ชนิดของคำในภาษาจีน</h3><p class="muted">ชนิดของคำในภาษาจีนมีทั้งหมด 13 ชนิด แตะเพื่อดูคำศัพท์ชนิดนั้นในคลังคำ</p>${BOOKS.pos}`], labels: ['1'], toc: null }
};
const Library = {
  show() {
    const ready = SHELF.filter(b => b.id), soon = SHELF.filter(b => !b.id);
    $('#shelf').innerHTML = ready.concat(soon).map((b, i) => b.id
      ? `<a class="bk" href="#/book/${b.id}" style="--c:${BOOK_COLOR[b.c]};--i:${i}" aria-label="${esc(b.th)}"><span class="bk-vol">VOL. ${b.vol}</span><span class="bk-hz hz">${b.hz}</span><span class="bk-th">${b.th}</span><span class="bk-tag">${b.tag}</span></a>`
      : `<button class="bk soon" data-soon style="--i:${i}" aria-label="${esc(b.th)} เร็ว ๆ นี้">${ic('lock', 'lk')}<span class="bk-vol">VOL. ${b.vol}</span><span class="bk-hz hz">${b.hz}</span><span class="bk-th">${b.th}</span><span class="bk-tag">เร็ว ๆ นี้</span></button>`).join('');
    $('#shelf').onclick = e => { if (e.target.closest('[data-soon]')) toast('เล่มนี้กำลังจัดทำเนื้อหา', { icon: 'lock' }); };
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
    $('#bkVol').textContent = pages.length > 1 ? `${m.vol} · หน้า ${m.labels[this.i] || this.i + 1} (${this.i + 1}/${pages.length})` : m.vol;
    $('#bkPrev').disabled = this.i === 0; $('#bkNext').disabled = this.i === pages.length - 1;
    $('.pager').hidden = pages.length < 2;
    $('#bkDots').innerHTML = pages.length > 1 ? pages.map((_, k) => `<button class="${k === this.i ? 'on' : ''}" data-p="${k}" aria-label="หน้า ${m.labels[k]}"></button>`).join('') : '';
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
const FONT_SLIDERS = [['hz', 'ตัวจีนบนการ์ด'], ['mean', 'พินอิน ความหมาย และตัวเลือก'], ['ex', 'ประโยคตัวอย่าง'], ['dict', 'รายการคำศัพท์']];
const Settings = {
  init() {
    const s = () => S();
    const sw = (id, key, after) => $(id).onchange = e => { s()[key] = e.target.checked; after && after(e); applySettings(); Store.save(); };
    const seg = (id, key) => $(id).addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; s()[key] = b.dataset.v; Store.save(); this.show(); });
    $('#sTheme').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; setTheme(b.dataset.v === 'auto' ? null : b.dataset.v, b); segSet($('#sTheme'), b.dataset.v); });
    sw('#sPinyin', 'showPinyin');
    sw('#sTh', 'showTh', e => { if (!e.target.checked && !s().showEn) { s().showEn = true; $('#sEn').checked = true; toast('ต้องแสดงอย่างน้อย 1 ภาษา จึงเปิดภาษาอังกฤษให้'); } });
    sw('#sEn', 'showEn', e => { if (!e.target.checked && !s().showTh) { s().showTh = true; $('#sTh').checked = true; toast('ต้องแสดงอย่างน้อย 1 ภาษา จึงเปิดภาษาไทยให้'); } });
    sw('#sSfx', 'sfx', e => { if (e.target.checked && !s().vol) { s().vol = 60; this.show(); } });
    sw('#sHaptic', 'haptic', e => { if (e.target.checked) buzz(20); });
    sw('#sAutoNext', 'autoNext'); sw('#sAutoSpeak', 'autoSpeak');
    seg('#sAsk', 'ask'); seg('#sQuiz', 'answer'); seg('#sTimer', 'timer');
    $('#sSec').innerHTML = SEC_CHOICES.map(n => `<button class="chip" data-n="${n}">${n} วิ</button>`).join('');
    $('#sSec').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; s().sec = +b.dataset.n; Store.save(); this.show(); });
    $('#sVol').oninput = e => { s().vol = +e.target.value; $('#sVolVal').textContent = s().vol + '%'; if (s().vol && !s().sfx) { s().sfx = true; $('#sSfx').checked = true; } applySettings(); Store.save(); };
    $('#sVol').onchange = () => sfx('correct', 2);
    $('#sVoice').onchange = e => { s().voiceURI = e.target.value; Store.save(); TTS.speak('你好'); };
    $('#sRate').oninput = e => { s().rate = +e.target.value; $('#sRateVal').textContent = rateTxt(s().rate); Store.save(); };
    $('#sTest').onclick = async () => { const ok = await TTS.speak('你好，欢迎来到 Library of Limu'); if (!ok && !TTS.voices.length) toast('ไม่พบเสียงภาษาจีนในเครื่องนี้', { icon: 'info' }); };
    $('#sGoal').oninput = e => { s().goal = +e.target.value; $('#sGoalVal').textContent = s().goal; Store.save(); };
    $('#fontSliders').innerHTML = FONT_SLIDERS.map(([k, n]) => `<div class="fs"><div class="row"><span>${n}</span><span class="val" id="fv-${k}">100%</span></div><input type="range" min="60" max="180" step="5" data-fk="${k}" aria-label="${n}"></div>`).join('');
    $('#fontSliders').addEventListener('input', e => { const k = e.target.dataset.fk; if (!k) return; s().scale[k] = +e.target.value; $('#fv-' + k).textContent = e.target.value + '%'; applySettings(); Store.save(); });
    $('#sFontReset').onclick = () => { s().scale = { ...DEFAULT_SETTINGS.scale }; applySettings(); Store.save(); this.show(); };
    $('#sExport').onclick = () => this.exportData();
    $('#sImport').onclick = () => $('#sImportFile').click();
    $('#sImportFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) this.importData(f); };
    $$('[data-reset]').forEach(b => b.onclick = () => this.reset(b.dataset.reset));
  },
  show() {
    const s = S();
    segSet($('#sTheme'), s.theme || 'auto'); segSet($('#sAsk'), s.ask); segSet($('#sQuiz'), s.answer); segSet($('#sTimer'), s.timer);
    $('#sPinyin').checked = s.showPinyin; $('#sTh').checked = s.showTh; $('#sEn').checked = s.showEn;
    $('#sSfx').checked = !!s.sfx; $('#sHaptic').checked = !!s.haptic; $('#sAutoNext').checked = !!s.autoNext; $('#sAutoSpeak').checked = !!s.autoSpeak;
    $$('#sSec .chip').forEach(b => b.classList.toggle('on', +b.dataset.n === +s.sec)); $('#sSec').hidden = s.timer !== 'countdown';
    $('#sVol').value = s.vol; $('#sVolVal').textContent = s.vol + '%';
    $('#sRate').value = s.rate; $('#sRateVal').textContent = rateTxt(s.rate);
    $('#sGoal').value = s.goal; $('#sGoalVal').textContent = s.goal;
    FONT_SLIDERS.forEach(([k]) => { const r = $(`[data-fk="${k}"]`); r.value = s.scale[k]; $('#fv-' + k).textContent = s.scale[k] + '%'; });
    $$('#v-settings input[type=range]').forEach(rangeFill);
    this.renderVoices();
  },
  renderVoices() {
    const sel = $('#sVoice'); if (!sel) return;
    const v = TTS.voices, auto = TTS.pick();
    sel.innerHTML = `<option value="">อัตโนมัติ${auto ? ` (${esc(auto.name)})` : ''}</option>` + v.map(x => `<option value="${esc(x.voiceURI)}">${esc(x.name)} · ${esc(x.lang)}</option>`).join('');
    sel.value = v.some(x => x.voiceURI === S().voiceURI) ? S().voiceURI : '';
    $('#sVoiceNote').textContent = !TTS.ok ? 'เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง' : v.length ? `พบเสียงภาษาจีน ${v.length} เสียง` : 'ไม่พบเสียงภาษาจีนในเครื่อง · Windows: Settings › Time & language › Language & region › เพิ่ม 中文(简体) พร้อม Text-to-speech หรือใช้ Microsoft Edge ซึ่งมีเสียงออนไลน์ในตัว';
  },
  exportData() {
    Store.flush();
    const blob = new Blob([JSON.stringify(Store.d, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `offy-backup-${ymd()}.json`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('ดาวน์โหลดไฟล์สำรองแล้ว', { icon: 'down' });
  },
  importData(file) {
    const r = new FileReader();
    r.onload = async () => {
      let d; try { d = JSON.parse(r.result); } catch (e) { toast('ไฟล์ไม่ถูกต้อง อ่าน JSON ไม่ได้', { icon: 'info' }); return; }
      if (!d || (d.v !== 1 && d.v !== 2) || !d.settings || !Array.isArray(d.sessions)) { toast('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ new offy', { icon: 'info' }); return; }
      if (!(await confirmDlg('นำเข้าข้อมูล?', `ข้อมูลปัจจุบันจะถูกแทนที่ด้วยไฟล์นี้ (${d.sessions.length} รอบการเล่น)`, 'นำเข้า', true))) return;
      Store.d = Store.normalize(d); Store.flush(); buildWords(); applySettings(); Custom.c = null;
      sfx('save'); toast('นำเข้าข้อมูลแล้ว', { icon: 'check' }); this.show();
    };
    r.readAsText(file);
  },
  async reset(kind) {
    const txt = { review: ['ล้างรายการทบทวน?', 'คำทั้งหมดในรายการคำที่ตอบผิดจะถูกลบ'], stats: ['ล้างสถิติและดาว?', 'ประวัติการเล่น ดาวทุกด่าน และสถานะการจำคำจะถูกลบ คำของฉันและการตั้งค่ายังอยู่'], mywords: ['ลบคำของฉันทั้งหมด?', 'คำศัพท์ที่เพิ่มเองจะถูกลบทั้งหมด'], all: ['ล้างข้อมูลทั้งหมด?', 'ทุกอย่างจะกลับเป็นค่าเริ่มต้น แนะนำให้สำรองข้อมูลก่อน'] }[kind];
    if (!(await confirmDlg(txt[0], txt[1] + ' · ย้อนกลับไม่ได้', 'ล้างข้อมูล', true))) return;
    const d = Store.d;
    if (kind === 'review') d.review = [];
    if (kind === 'stats' || kind === 'all') { d.sessions = []; d.ws = {}; d.stages = {}; d.review = []; d.legacy = { days: {} }; d.last = null; }
    if (kind === 'mywords') { const ids = d.customWords.map(w => `C:${w.zh}:${w.py}`); d.customWords = []; d.review = d.review.filter(id => !ids.includes(id)); ids.forEach(id => delete d.ws[id]); }
    if (kind === 'all') { Store.d = Store.defaults(); Store.d.settings.theme = d.settings.theme; }
    Store.flush(); buildWords(); applySettings(); Custom.c = null; this.show(); toast('ล้างข้อมูลแล้ว', { icon: 'check' });
  }
};

/* ---------- ROUTE TABLE ---------- */
const VIEWS = {
  home: { el: 'v-home', nav: 'home', show: () => Home.show() },
  learn: { el: 'v-learn', nav: 'learn', show: () => Learn.show(), title: 'เรียนตามระดับ' },
  level: { el: 'v-level', nav: 'learn', show: a => Level.show(a[0]), title: 'HSK' },
  practice: { el: 'v-practice', nav: 'practice', show: a => Custom.show(a[0]), title: 'จัดสำรับเอง' },
  play: { el: 'v-game', immersive: true, show: () => Game.onShow(), need: () => !!Game.s, title: 'แฟลชการ์ด' },
  dictation: { el: 'v-dictation', immersive: true, show: () => Dicta.onShow(), need: () => !!Dicta.s && !Dicta.s.done, title: '听写' },
  dsheet: { el: 'v-dsheet', immersive: true, show: () => DSheet.show(), need: () => !!Dicta.s && Dicta.s.done, title: 'ใบตรวจ 听写' },
  dict: { el: 'v-dict', nav: 'dict', show: () => Dict.show(), title: 'คลังคำศัพท์' },
  stats: { el: 'v-stats', nav: 'stats', show: () => StatsView.show(), title: 'สถิติ' },
  library: { el: 'v-library', nav: 'library', show: () => Library.show(), title: 'ชั้นหนังสือ' },
  book: { el: 'v-book', nav: 'library', show: a => Book.show(a[0]), title: 'Only Offy' },
  settings: { el: 'v-settings', nav: 'settings', show: () => Settings.show(), title: 'ตั้งค่า' }
};
const ROUTE_ALIAS = { levels: 'learn', custom: 'practice', dash: 'stats' };   // links from the previous version
let currentView = null;
function renderRoute(h) {
  const { name, args } = Router.parse(h);
  const v = VIEWS[ROUTE_ALIAS[name] || name] || VIEWS.home;
  if (v.need && !v.need()) { Router.replace('/home'); return; }
  Sheet.close(); Tip.hide();
  if (currentView !== v.el) { $$('.view').forEach(x => x.classList.toggle('active', x.id === v.el)); window.scrollTo(0, 0); }
  currentView = v.el;
  document.body.classList.toggle('immersive', !!v.immersive);
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === v.nav));
  document.title = v.title ? `${v.title} · Library of Limu` : 'Library of Limu';
  try { v.show(args); } catch (err) { console.error(err); toast('เกิดข้อผิดพลาด: ' + err.message, { icon: 'info' }); }
}
/* leaving an unfinished game / dictation / unsaved sheet asks first */
Router.guard = h => {
  const cur = Router.stack[Router.stack.length - 1];
  if (cur === '#/play' && h !== '#/play' && Game.s && !Game.s.finished) { Router.restore('#/play'); Game.pause(); return false; }
  if (cur === '#/dictation' && h !== '#/dictation' && h !== '#/dsheet' && Dicta.s && !Dicta.s.done) { Router.restore('#/dictation'); Dicta.quitAsk(); return false; }
  if (cur === '#/dsheet' && h !== '#/dsheet' && Dicta.s && Dicta.s.done && !Dicta.s.saved) { Router.restore('#/dsheet'); DSheet.discard(); return false; }
  if (cur === '#/play' && h !== '#/play' && Game.s && Game.s.finished) { Game.teardown(); Game.s = null; }
  return true;
};

/* ---------- BOOT ---------- */
function boot() {
  Store.load(); buildWords(); applySettings(); TTS.init();
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
    else if (currentView === 'v-dictation') Dicta.key(e);
    else if (currentView === 'v-book') Book.key(e);
    else if (e.key === '/' && currentView === 'v-dict') { e.preventDefault(); $('#qInput').focus(); }
  });
  addEventListener('resize', debounce(() => {
    if (currentView === 'v-game' && Game.s) Game.fit();
    if (currentView === 'v-dictation' && Dicta.s && Dicta.s.ans === 'draw') Pad.layout();
    if (currentView === 'v-stats') StatsView.show();
  }, 160));
  // the app is open in another tab and saved there: pick the newer data up instead of overwriting it later
  addEventListener('storage', e => {
    if (e.key !== Store.KEY || !e.newValue) return;
    try { Store.d = Store.normalize(JSON.parse(e.newValue)); } catch (err) { return; }
    buildWords(); applySettings(); Custom.c = null;
    if (!VIEWS[Router.parse(location.hash).name]?.immersive && !Sheet.isOpen() && !modalOpen()) renderRoute(location.hash);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && currentView === 'v-game' && Game.s && !Game.s.finished && !Game.s.paused && Game.s.phase === 'ask') Game.pause(); });

  // edge swipe from the left = back (for home-screen apps without a browser back gesture)
  let ex = null;
  document.addEventListener('touchstart', e => { const t = e.touches[0]; ex = t.clientX < 22 ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
  document.addEventListener('touchmove', e => { if (!ex) return; const t = e.touches[0], dx = t.clientX - ex.x; const el = $('#edgeL'); el.style.opacity = String(clamp(dx / 80, 0, 1)); el.style.transform = `translateX(${clamp(dx * .7, 0, 58)}px)`; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!ex) return; const t = e.changedTouches[0], dx = t.clientX - ex.x, dy = Math.abs(t.clientY - ex.y); ex = null;
    const el = $('#edgeL'); el.style.opacity = '0'; el.style.transform = '';
    if (dx > 80 && dy < 60) { if (modalOpen()) return; if (Sheet.isOpen()) { Sheet.close(); return; } const b = $('.view.active [data-up]'); if (b) b.click(); else if (currentView === 'v-game') Game.pause(); else if (currentView === 'v-dictation') Dicta.quitAsk(); else if (currentView !== 'v-home' && currentView !== 'v-dsheet') history.back(); }
  }, { passive: true });

  Router.start();
  if (Store.migrated) setTimeout(() => toast(Store.migrated === 'v1' ? 'นำความคืบหน้าจาก new offy v1 มาให้แล้ว' : 'นำความคืบหน้าจากเวอร์ชันเก่ามาให้แล้ว', { icon: 'check', ms: 3600 }), 700);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
}
boot();
