'use strict';
/* =====================================================================
   Library of Limu · new offy v2 — core
   utilities · pinyin · vocabulary · storage · stats / spaced review
   sound · speech · UI helpers · router · charts · effects
   © 2026 李牧飞 Aphisit Kaewnet
   ===================================================================== */

/* ---------- 1. tiny utilities ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC_MAP[c]);
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clone = o => JSON.parse(JSON.stringify(o));
const pad2 = n => String(n).padStart(2, '0');
const ymd = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dayStart = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const DAY = 864e5;
const fmtClock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600); return h ? `${h}:${pad2(Math.floor(s % 3600 / 60))}:${pad2(s % 60)}` : `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`; };
const fmtDur = ms => { const m = Math.round(ms / 60000); if (m < 1) return ms > 0 ? '< 1 นาที' : '0 นาที'; if (m < 60) return `${m} นาที`; return `${Math.floor(m / 60)} ชม. ${m % 60} นาที`; };
const fmtNum = n => Number(n || 0).toLocaleString('en-US');
const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_DAY = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const TH_DAY_FULL = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
const fmtDate = ts => { const d = new Date(ts); return `${d.getDate()} ${TH_MONTH[d.getMonth()]} ${d.getFullYear() + 543} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isWide = () => matchMedia('(min-width: 900px)').matches;
const ic = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const starsHTML = (n, size = 12, max = 3) => `<span class="stars" style="--sz:${size}px" aria-label="${n} ดาว">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
const rateTxt = r => (+r).toFixed(2).replace(/0$/, '') + '×';

/* ---------- 2. pinyin helpers ---------- */
const TONE_CHARS = {};
[['a', 'āáǎà'], ['e', 'ēéěè'], ['i', 'īíǐì'], ['o', 'ōóǒò'], ['u', 'ūúǔù'], ['v', 'ǖǘǚǜ']].forEach(([b, s]) => [...s].forEach((c, i) => { TONE_CHARS[c] = [b, i + 1]; }));
TONE_CHARS['ń'] = ['n', 2]; TONE_CHARS['ň'] = ['n', 3]; TONE_CHARS['ǹ'] = ['n', 4]; TONE_CHARS['ḿ'] = ['m', 2];
/** split a pinyin string into its letters (ü → v) and the ordered list of tones (neutral tone ignored). */
function pyParse(input) {
  const s = String(input || '').toLowerCase().normalize('NFC').replace(/u:/g, 'ü');
  let letters = ''; const tones = [];
  for (const ch of s) {
    if (TONE_CHARS[ch]) { letters += TONE_CHARS[ch][0]; tones.push(TONE_CHARS[ch][1]); }
    else if (ch >= '1' && ch <= '4') tones.push(+ch);
    else if (ch === 'ü' || ch === 'v') letters += 'v';
    else if (ch === 'ê') letters += 'e';
    else if (ch >= 'a' && ch <= 'z') letters += ch;
  }
  return { letters, tones };
}
const pyPlain = s => pyParse(s).letters.replace(/v/g, 'u');
/** compare a typed answer with the target pinyin. strict = tones must match too. */
function pyCompare(typed, target, strict) {
  const inp = pyParse(typed);
  if (!inp.letters) return { ok: false, letters: false };
  let lettersOk = false;
  for (const alt of String(target).split('/')) {
    const t = pyParse(alt);
    const same = inp.letters === t.letters || inp.letters === t.letters.replace(/([aeiouv])r$/, '$1er');
    if (!same) continue;
    lettersOk = true;
    if (!strict || (inp.tones.length === t.tones.length && inp.tones.every((x, i) => x === t.tones[i]))) return { ok: true, letters: true };
  }
  return { ok: false, letters: lettersOk };
}

/* ---------- 3. vocabulary ---------- */
const LEVELS = [1, 2, 3, 4, 5, 6];
const STAGE_SIZE = 10;
const POS_ABBR = { noun: 'N', verb: 'V', adjective: 'Adj', adverb: 'Adv', pronoun: 'Pron', number: 'Num', classifier: 'CL', preposition: 'Prep', conjunction: 'Conj', auxiliary: 'Aux', particle: 'Part', interjection: 'Int', phrase: 'Phr', prefix: 'Pref', suffix: 'Suf', custom: 'My' };
const POS_KEY = { noun: 'n', verb: 'v', adjective: 'adj', adverb: 'adv', pronoun: 'pron', number: 'num', classifier: 'm', preposition: 'prep', conjunction: 'conj', auxiliary: 'part', particle: 'part', interjection: 'int' };
const POS_NAME = { n: 'คำนาม', v: 'คำกริยา', adj: 'คุณศัพท์', adv: 'วิเศษณ์', pron: 'สรรพนาม', num: 'จำนวน', m: 'ลักษณนาม', prep: 'บุพบท', conj: 'สันธาน', part: 'คำช่วย', int: 'อุทาน', other: 'อื่น ๆ' };
const posParts = pos => String(pos || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const posKey = pos => POS_KEY[posParts(pos)[0]] || 'other';
const posBadge = w => w.pos ? `<span class="pos-b p-${posKey(w.pos)}" title="${esc(w.pos)}">${esc(posParts(w.pos).map(p => POS_ABBR[p] || p).join(' · '))}</span>` : '';
const lvlColor = l => `var(--hsk${l === 'C' ? 'C' : l})`;
const lvlName = l => l === 'C' ? 'คำของฉัน' : `HSK ${l}`;
const lvlBadge = l => `<span class="badge lvl-b" style="--c:${lvlColor(l)}">${esc(lvlName(l))}</span>`;

const RAW_WORDS = (window.OFFY_WORDS || []).map(r => ({ lvl: r[0], zh: r[1], py: r[2], pos: r[3], en: r[4], th: r[5], ex_zh: r[6], ex_py: r[7], ex_en: r[8], ex_th: r[9] }));
const BOOKS = window.OFFY_BOOKS || { py: [], deep: [], pos: '' };
let WORDS = [], BY_ID = new Map(), BY_LVL = {};
/* ids are identical to new offy v1 so that saved progress carries over */
(function assignIds() {
  const seen = {};
  RAW_WORDS.forEach(w => { const base = `${w.lvl}:${w.zh}:${w.py}`; seen[base] = (seen[base] || 0) + 1; w.id = seen[base] > 1 ? `${base}#${seen[base]}` : base; });
})();
function indexWord(w) {
  w._py = pyPlain(w.py); w._th = String(w.th || '').toLowerCase(); w._en = String(w.en || '').toLowerCase();
  w._pk = posKey(w.pos); w._len = Array.from(w.zh).length;
  return w;
}
function buildWords() {
  const custom = (Store.d.customWords || []).map(c => indexWord({ id: `C:${c.zh}:${c.py}`, lvl: 'C', zh: c.zh, py: c.py, th: c.th || '', en: c.en || '', pos: 'Custom', ex_zh: '', ex_py: '', ex_en: '', ex_th: '', custom: true }));
  WORDS = RAW_WORDS.map(indexWord).concat(custom);
  BY_ID = new Map(WORDS.map(w => [w.id, w]));
  BY_LVL = {};
  WORDS.forEach(w => { (BY_LVL[w.lvl] = BY_LVL[w.lvl] || []).push(w); });
}
const levelWords = l => BY_LVL[l] || [];
const stageCount = l => Math.ceil(levelWords(l).length / STAGE_SIZE);
const stageWords = (l, n) => levelWords(l).slice((n - 1) * STAGE_SIZE, n * STAGE_SIZE);
const meaningText = w => { const s = S(); if (s.showTh && w.th) return w.th; return w.en || w.th || ''; };
const meanHTML = w => `<span class="lang-th">${esc(w.th)}</span>${w.th && w.en ? '<span class="lang-th lang-en"> · </span>' : ''}<span class="lang-en">${esc(w.en)}</span>`;
function compactRange(nums) {
  const a = [...nums].sort((x, y) => x - y), out = []; let i = 0;
  while (i < a.length) { let j = i; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; out.push(j > i ? `${a[i]}–${a[j]}` : `${a[i]}`); i = j + 1; }
  return out.join(', ');
}

/* ---------- 4. storage ---------- */
const DEFAULT_SETTINGS = { theme: null, showPinyin: true, showTh: true, showEn: true, answer: 'quiz', ask: 'zh', timer: 'countdown', sec: 10, autoNext: true, autoSpeak: false, rate: 0.8, voiceURI: '', sfx: true, vol: 60, haptic: true, goal: 30, scale: { hz: 100, mean: 100, ex: 100, dict: 100 } };
const Store = {
  KEY: 'offy.v2', d: null, migrated: '',
  defaults() { return { v: 2, created: Date.now(), settings: clone(DEFAULT_SETTINGS), sessions: [], ws: {}, stages: {}, review: [], customWords: [], legacy: { days: {} }, last: null, customCfg: null }; },
  read(k) { try { const d = JSON.parse(localStorage.getItem(k) || 'null'); return d && typeof d === 'object' ? d : null; } catch (e) { return null; } },
  /** make any saved / imported object safe to use (also upgrades v1 data) */
  normalize(d) {
    d = Object.assign(this.defaults(), d); d.v = 2;
    d.settings = Object.assign(clone(DEFAULT_SETTINGS), d.settings || {});
    d.settings.scale = Object.assign({ ...DEFAULT_SETTINGS.scale }, d.settings.scale || {});
    ['sessions', 'review', 'customWords'].forEach(k => { if (!Array.isArray(d[k])) d[k] = []; });
    ['ws', 'stages'].forEach(k => { if (!d[k] || typeof d[k] !== 'object') d[k] = {}; });
    if (!d.legacy || typeof d.legacy !== 'object') d.legacy = { days: {} };
    if (!d.legacy.days) d.legacy.days = {};
    return d;
  },
  load() {
    let d = this.read(this.KEY);
    if (!d) { const v1 = this.read('offy.v1'); if (v1 && v1.settings && Array.isArray(v1.sessions)) { d = v1; this.migrated = 'v1'; } }
    const fresh = !d;
    this.d = this.normalize(d || {});
    if (fresh && this.migrateOld()) this.migrated = 'old';
    if (fresh || this.migrated) this.flush();
  },
  save() { clearTimeout(this._t); this._t = setTimeout(() => this.flush(), 150); },
  flush() {
    clearTimeout(this._t);
    try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); }
    catch (e) { if (!this._warned) { this._warned = true; toast('บันทึกข้อมูลไม่สำเร็จ พื้นที่เบราว์เซอร์อาจเต็ม ลองสำรองข้อมูลในหน้าตั้งค่า', { icon: 'info', ms: 5000 }); } }
  },
  /** import progress from the original single-file version (keys hskStats, hskForgotten, …). */
  migrateOld() {
    const get = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
    const d = this.d; let any = false;
    try {
      const theme = localStorage.getItem('limuTheme'); if (theme === 'dark' || theme === 'light') d.settings.theme = theme;
      if (localStorage.getItem('limuPinyinHidden') === '1') d.settings.showPinyin = false;
      const rate = parseFloat(localStorage.getItem('hskSpeechRate')); if (rate >= 0.5 && rate <= 1.2) d.settings.rate = rate;
      const fs = get('hskFontScale'); if (fs) d.settings.scale = { hz: +fs.fcFrontZh || 100, mean: +fs.fcBackTh || 100, ex: +fs.fcExZh || 100, dict: +fs.dictZh || 100 };
      const cw = get('userCustomWords'); if (Array.isArray(cw)) { cw.forEach(w => { if (w && w.zh && w.py && !d.customWords.some(x => x.zh === w.zh)) d.customWords.push({ zh: String(w.zh), py: String(w.py), th: String(w.th || ''), en: String(w.en || '') }); }); any = any || cw.length > 0; }
      const st = get('hskStats');
      if (st && typeof st === 'object') {
        Object.entries(st.levelProgress || {}).forEach(([k, v]) => {
          const m = /^lvl(\d+)_set(\d+)$/.exec(k);
          if (m && v) { const rec = { stars: clamp(+v.bestStars || 0, 0, 3), pct: clamp(+v.bestPct || 0, 0, 100), plays: 1, ts: 0 }; if (v.bestKnow !== undefined) rec.k = clamp(+v.bestKnow || 0, 0, STAGE_SIZE); d.stages[`${m[1]}-${m[2]}`] = rec; any = true; }
        });
        Object.entries(st.dailyStats || {}).forEach(([day, v]) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(day) && v) { d.legacy.days[day] = { ms: +v.timeMs || 0, sessions: +v.sessions || 0 }; any = true; }
        });
        (st.history || []).forEach(h => {
          const m = /^(\d+)\/(\d+)\/(\d{4}) (\d+):(\d+)/.exec(h.date || '');
          if (!m) return;
          const ts = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime();
          d.sessions.push({ id: 'lg' + ts, lg: 1, mode: 'flash', kind: 'legacy', label: String(h.name || 'เวอร์ชันเก่า'), ts, dur: 0, total: +h.total || 0, correct: +h.know || 0, stars: 0, words: [] });
          any = true;
        });
        d.sessions.sort((a, b) => a.ts - b.ts);
      }
      const fg = get('hskForgotten');
      if (Array.isArray(fg)) {
        fg.forEach(o => {
          if (!o || !o.zh) return;
          const w = RAW_WORDS.find(x => x.zh === o.zh && String(x.lvl) === String(o.lvl)) || RAW_WORDS.find(x => x.zh === o.zh);
          const cw2 = d.customWords.find(c => c.zh === o.zh);
          const id = w ? w.id : (cw2 ? `C:${cw2.zh}:${cw2.py}` : null);
          if (id && !d.review.includes(id)) { d.review.push(id); d.ws[id] = Object.assign({ s: 1, c: 0, w: 1, b: 0, t: 0 }, d.ws[id]); any = true; }
        });
      }
    } catch (e) { console.warn('migration skipped', e); }
    return any;
  }
};
const S = () => Store.d.settings;
addEventListener('pagehide', () => Store.flush());
document.addEventListener('visibilitychange', () => { if (document.hidden) Store.flush(); });

/* ---------- 5. stats model + spaced review ---------- */
const SRS_DAYS = [0, 1, 3, 7, 14, 30];        // days until a word comes back, by streak box
const Stats = {
  status(id) {
    if (Store.d.review.includes(id)) return 'review';
    const ws = Store.d.ws[id];
    if (!ws || !ws.s) return 'new';
    return ws.b >= 2 ? 'mastered' : 'learning';
  },
  dueAt(ws) { return ws.d || ((ws.t || 0) + SRS_DAYS[clamp(ws.b || 0, 0, 5)] * DAY); },
  /** words to revise now: everything answered wrong + remembered words whose interval has passed */
  reviewIds() {
    const d = Store.d, now = Date.now(), out = [], seen = new Set();
    d.review.forEach(id => { if (BY_ID.has(id) && !seen.has(id)) { seen.add(id); out.push(id); } });
    Object.entries(d.ws).forEach(([id, ws]) => { if (!seen.has(id) && ws.b >= 1 && ws.t && this.dueAt(ws) <= now && BY_ID.has(id)) { seen.add(id); out.push(id); } });
    return out;
  },
  /** apply one answer to the per-word memory + review bank */
  applyWord(id, ok, ts) {
    const d = Store.d;
    const ws = d.ws[id] || (d.ws[id] = { s: 0, c: 0, w: 0, b: 0, t: 0 });
    ws.s++; ws.t = ts;
    if (ok) { ws.c++; ws.b = Math.min(5, (ws.b || 0) + 1); ws.d = ts + SRS_DAYS[ws.b] * DAY; d.review = d.review.filter(x => x !== id); }
    else { ws.w++; ws.b = 0; ws.d = ts; if (!d.review.includes(id)) d.review.push(id); }
  },
  record(sess) {
    const d = Store.d;
    sess.id = sess.id || ('s' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    sess.words.forEach(([id, ok]) => { if (ok !== null && ok !== undefined) this.applyWord(id, !!ok, sess.ts); });
    d.sessions.push(sess);
    if (d.sessions.length > 1500) d.sessions.splice(0, d.sessions.length - 1500);
    let best = null;
    if (sess.kind === 'stage' && !sess.partial) {
      const key = `${sess.lvl}-${sess.stage}`;
      const prev = d.stages[key] || { stars: 0, pct: 0, plays: 0 };
      const pct = sess.total ? Math.round(sess.correct / sess.total * 100) : 0;
      best = { improved: pct > prev.pct || sess.stars > prev.stars, first: !prev.plays, prevPct: prev.pct, prevStars: prev.stars };
      d.stages[key] = { stars: Math.max(prev.stars, sess.stars), pct: Math.max(prev.pct, pct), plays: (prev.plays || 0) + 1, ts: sess.ts, k: Math.max(this.stageBest(sess.lvl, sess.stage), sess.correct) };
      d.last = { lvl: sess.lvl, stage: sess.stage };
    }
    Store.save();
    return best;
  },
  starsFor(correct, total) { if (!total) return 0; const p = correct / total * 100; return p >= 100 ? 3 : p >= 70 ? 2 : p >= 30 ? 1 : 0; },
  stage(l, n) { return Store.d.stages[`${l}-${n}`] || null; },
  /** best number of correct answers ever scored on a stage */
  stageBest(l, n) {
    const s = this.stage(l, n); if (!s) return 0;
    const size = stageWords(l, n).length;
    return Math.min(size, s.k !== undefined ? s.k : Math.round((s.pct || 0) / 100 * size));
  },
  suggestStage(l) {
    const n = stageCount(l);
    for (let i = 1; i <= n; i++) { const s = this.stage(l, i); if (!s || !s.plays) return i; }
    for (let i = 1; i <= n; i++) { const s = this.stage(l, i); if (s.stars < 3) return i; }
    return 1;
  },
  levelSummary(l) {
    const words = levelWords(l), n = l === 'C' ? 0 : stageCount(l);
    let stars = 0, cleared = 0, known = 0, mastered = 0, learning = 0, review = 0;
    for (let i = 1; i <= n; i++) { const s = this.stage(l, i); if (s) { stars += s.stars; if (s.plays) cleared++; known += this.stageBest(l, i); } }
    words.forEach(w => { const st = this.status(w.id); if (st === 'mastered') mastered++; else if (st === 'review') review++; else if (st !== 'new') learning++; });
    return { words: words.length, stages: n, stars, maxStars: n * 3, cleared, known, pct: words.length ? Math.round(known / words.length * 100) : 0, mastered, learning, review };
  },
  /** all activity days (sessions + legacy) as map ymd -> {ms, cards, correct, sessions} */
  days() {
    const map = {};
    const get = k => map[k] || (map[k] = { ms: 0, cards: 0, correct: 0, sessions: 0 });
    Object.entries(Store.d.legacy.days || {}).forEach(([k, v]) => { const o = get(k); o.ms += v.ms || 0; o.sessions += v.sessions || 0; });
    Store.d.sessions.forEach(s => { const o = get(ymd(new Date(s.ts))); o.cards += s.total || 0; o.correct += s.correct || 0; if (!s.lg) { o.ms += s.dur || 0; o.sessions++; } });
    return map;
  },
  streak(days = this.days()) {
    const active = k => days[k] && (days[k].sessions > 0 || days[k].cards > 0);
    let cur = 0; let d = dayStart();
    if (!active(ymd(d))) d = addDays(d, -1);
    while (active(ymd(d))) { cur++; d = addDays(d, -1); }
    const keys = Object.keys(days).filter(active).sort();
    let best = 0, run = 0, prev = null;
    keys.forEach(k => { const t = new Date(k + 'T00:00:00'); run = prev && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; });
    return { cur, best: Math.max(best, cur), today: active(ymd()) };
  },
  /** cumulative "words passed" per level at each cut-off time (ascending). Progress imported from
      older versions has no date, so it is treated as already there from the start. */
  timeline(cuts) {
    const lv = LEVELS.filter(l => levelWords(l).length);
    const evs = Store.d.sessions.filter(s => s.kind === 'stage' && !s.partial && !s.lg && s.lvl && s.stage && lv.includes(+s.lvl)).sort((a, b) => a.ts - b.ts);
    const fin = {}; evs.forEach(s => { const k = `${s.lvl}-${s.stage}`; fin[k] = Math.max(fin[k] || 0, s.correct || 0); });
    const tot = {}; lv.forEach(l => { tot[l] = 0; });
    Object.keys(Store.d.stages).forEach(key => { const [l, n] = key.split('-').map(Number); if (!(l in tot)) return; const b = this.stageBest(l, n); tot[l] += Math.max(0, b - Math.min(b, fin[key] || 0)); });
    const cur = {}; let i = 0;
    return cuts.map(cut => {
      while (i < evs.length && evs[i].ts <= cut) {
        const s = evs[i++], key = `${s.lvl}-${s.stage}`, k = Math.min(stageWords(+s.lvl, +s.stage).length, s.correct || 0), prev = cur[key] || 0;
        if (k > prev) { tot[s.lvl] += k - prev; cur[key] = k; }
      }
      return { ...tot };
    });
  }
};

/* ---------- 6. sound effects (synthesised with Web Audio — no audio files) ---------- */
const Sfx = {
  ctx: null, out: null, _nb: null,
  enabled() { const s = S(); return s.sfx !== false && s.vol > 0; },
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { return false; }
      this.out = this.ctx.createGain();
      const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .18;
      this.out.connect(comp); comp.connect(this.ctx.destination);
      this.setVol();
    }
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => { });
    return true;
  },
  setVol() { if (this.out) this.out.gain.value = Math.pow(clamp(S().vol, 0, 100) / 100, 1.5) * 0.95; },
  tone(f, o = {}) {
    const c = this.ctx, t0 = c.currentTime + (o.t || 0) + 0.006, dur = o.dur || .18, peak = o.gain ?? .18;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack || .006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(this.out); osc.start(t0); osc.stop(t0 + dur + .04);
  },
  /** soft mallet / bell: fundamental + two quiet partials */
  bell(f, o = {}) {
    const g = o.gain ?? .16, d = o.dur || .4;
    this.tone(f, { ...o, gain: g, dur: d });
    this.tone(f * 2, { ...o, gain: g * .32, dur: d * .55 });
    this.tone(f * 3.01, { ...o, gain: g * .1, dur: d * .3 });
  },
  noise(o = {}) {
    const c = this.ctx, t0 = c.currentTime + (o.t || 0) + 0.006, dur = o.dur || .12;
    if (!this._nb) { const len = c.sampleRate; const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this._nb = b; }
    const src = c.createBufferSource(); src.buffer = this._nb;
    const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q ?? .9;
    f.frequency.setValueAtTime(o.from || 1800, t0); f.frequency.exponentialRampToValueAtTime(o.to || 500, t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain ?? .1, t0 + (o.attack || .012)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.out); src.start(t0, Math.random() * .6, dur + .05);
  },
  play(name, arg) { if (!this.enabled() || !this.ensure()) return; try { this.lib[name].call(this, arg); } catch (e) { } },
  lib: {
    tap() { this.tone(740, { dur: .05, gain: .05, type: 'triangle' }); },
    pop() { this.tone(520, { to: 780, dur: .07, gain: .07 }); },
    on() { this.tone(587, { dur: .07, gain: .07 }); this.tone(880, { t: .06, dur: .1, gain: .07 }); },
    off() { this.tone(660, { dur: .07, gain: .06 }); this.tone(440, { t: .06, dur: .1, gain: .06 }); },
    open() { this.noise({ from: 500, to: 1600, dur: .16, gain: .035, q: .6 }); },
    deal() { this.noise({ from: 3200, to: 1300, dur: .07, gain: .06, q: 1.2 }); },
    flip() { this.noise({ from: 2600, to: 520, dur: .17, gain: .09 }); this.tone(170, { t: .1, to: 110, dur: .09, gain: .07 }); },
    swoosh() { this.noise({ from: 600, to: 2800, dur: .2, gain: .06, q: .7 }); },
    correct(combo = 1) {
      const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5], f = scale[clamp(combo - 1, 0, 5)];
      this.bell(f, { dur: .3, gain: .15 }); this.bell(f * 1.5, { t: .09, dur: .5, gain: .15 });
    },
    wrong() { this.tone(233, { to: 155, dur: .24, gain: .14, type: 'triangle' }); this.tone(174, { t: .03, to: 110, dur: .3, gain: .1 }); },
    tick() { this.tone(1050, { dur: .04, gain: .06 }); },
    timeout() { this.tone(392, { dur: .14, gain: .1, type: 'triangle' }); this.tone(294, { t: .13, dur: .26, gain: .1, type: 'triangle' }); },
    star(i = 0) { this.bell([783.99, 987.77, 1318.5][clamp(i, 0, 2)], { dur: .7, gain: .13 }); },
    complete() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.bell(f, { t: i * .09, dur: i === 3 ? 1.1 : .45, gain: .12 })); this.noise({ t: .3, from: 5000, to: 9000, dur: .5, gain: .018, type: 'highpass' }); },
    fail() { this.tone(392, { dur: .2, gain: .1, type: 'triangle' }); this.tone(330, { t: .18, dur: .34, gain: .1, type: 'triangle' }); },
    save() { this.bell(659.25, { dur: .25, gain: .12 }); this.bell(880, { t: .1, dur: .5, gain: .12 }); }
  }
};
const sfx = (name, arg) => Sfx.play(name, arg);
const buzz = p => { if (!S().haptic || !navigator.vibrate || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; try { navigator.vibrate(p); } catch (e) { } };

/* ---------- 7. speech (Web Speech API) ---------- */
const TTS = {
  ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
  voices: [], loaded: false, _tok: 0, _unlocked: false,
  init() {
    if (!this.ok) { this.loaded = true; return; }
    const load = () => {
      const all = speechSynthesis.getVoices() || [];
      this.voices = all.filter(v => /^(zh|cmn)([-_]|$)/i.test(v.lang) && !/(HK|TW|yue)/i.test(v.lang)).concat(all.filter(v => /^(zh|cmn)/i.test(v.lang) && /(HK|TW|yue)/i.test(v.lang)));
      if (all.length) this.loaded = true;
      if (typeof Settings !== 'undefined' && Settings.renderVoices) Settings.renderVoices();
    };
    load();
    if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', load);
    else speechSynthesis.onvoiceschanged = load;
    setTimeout(() => { this.loaded = true; }, 1500);
  },
  /** iOS only lets speech start from a user gesture — prime it on the first touch */
  unlock() {
    if (!this.ok || this._unlocked) return; this._unlocked = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'zh-CN'; speechSynthesis.speak(u); } catch (e) { }
  },
  pick() {
    const uri = S().voiceURI, v = this.voices;
    return (uri && v.find(x => x.voiceURI === uri)) || v.find(x => /zh[-_]CN/i.test(x.lang) && /natural|online|premium|enhanced/i.test(x.name)) || v.find(x => /zh[-_]CN/i.test(x.lang)) || v[0] || null;
  },
  stop() { this._tok++; if (this.ok) try { speechSynthesis.cancel(); } catch (e) { } },
  /** speak text; resolves true when finished, false on error / cancel. */
  speak(text, rate) {
    return new Promise(res => {
      if (!this.ok || !text) { res(false); return; }
      const tok = ++this._tok;
      try { speechSynthesis.cancel(); } catch (e) { }
      const u = new SpeechSynthesisUtterance(text);
      const v = this.pick(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'zh-CN';
      u.rate = clamp(rate || S().rate || 0.8, 0.3, 1.5);
      let done = false;
      const fin = ok => { if (done) return; done = true; clearTimeout(guard); res(ok && tok === this._tok); };
      u.onend = () => fin(true); u.onerror = () => fin(false);
      const guard = setTimeout(() => fin(false), 3000 + Array.from(text).length * 900 / u.rate);
      setTimeout(() => { if (tok !== this._tok) { fin(false); return; } try { speechSynthesis.speak(u); } catch (e) { fin(false); } }, 60);
    });
  }
};
function speakWord(w, rate) { if (w) return TTS.speak(w.zh, rate); return Promise.resolve(false); }

/* ---------- 8. UI helpers: toast / modal / sheet / tooltip ---------- */
function toast(msg, { icon = '', ms = 2600 } = {}) {
  const host = $('#toasts'); if (!host) return;
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = (icon ? ic(icon) : '') + `<span>${esc(msg)}</span>`; host.appendChild(el);
  while (host.children.length > 3) host.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
}
let modalResolve = null;
function modal({ title, msg = '', html = '', buttons = [{ label: 'ตกลง', cls: 'primary', value: true }], dismiss = null }) {
  if (modalResolve) { modalResolve(dismiss); modalResolve = null; }
  $('#mTitle').textContent = title; const m = $('#mMsg');
  if (html) m.innerHTML = html; else m.textContent = msg;
  m.style.display = (msg || html) ? '' : 'none';
  $('#mActs').innerHTML = buttons.map((b, i) => `<button class="btn ${b.cls || ''} block" data-i="${i}">${b.icon ? ic(b.icon) : ''}${esc(b.label)}</button>`).join('');
  const wrap = $('#modalWrap'); wrap.classList.add('show');
  return new Promise(res => {
    modalResolve = v => { wrap.classList.remove('show'); res(v); };
    $$('#mActs button').forEach(btn => btn.onclick = () => { const r = modalResolve; modalResolve = null; sfx('tap'); r && r(buttons[+btn.dataset.i].value); });
    wrap.onclick = e => { if (e.target === wrap && dismiss !== undefined) { const r = modalResolve; modalResolve = null; r && r(dismiss); } };
    setTimeout(() => { const b = $('#mActs .btn.primary') || $('#mActs .btn'); b && b.focus({ preventScroll: true }); }, 30);
  });
}
const confirmDlg = (title, msg, ok = 'ยืนยัน', danger = false) => modal({ title, msg, buttons: [{ label: ok, cls: danger ? 'bad' : 'primary', value: true }, { label: 'ยกเลิก', cls: 'ghost', value: false }], dismiss: false });
const modalOpen = () => $('#modalWrap').classList.contains('show');

/* bottom sheet on phones / iPad portrait, side drawer on wide screens */
const Sheet = {
  onClose: null,
  open(body, foot = '', onClose = null) {
    const sh = $('#sheet');
    $('#sheetBody').innerHTML = body; $('#sheetFoot').innerHTML = foot;
    $('#sheetBody').onclick = null; $('#sheetFoot').onclick = null;
    $('#sheetBody').scrollTop = 0; sh.style.transform = '';
    if (!sh.classList.contains('show')) sfx('open');
    sh.classList.add('show'); $('#scrim').classList.add('show'); this.onClose = onClose;
  },
  close() {
    const sh = $('#sheet'); if (!sh.classList.contains('show')) return;
    sh.style.transform = ''; sh.classList.remove('show', 'dragging'); $('#scrim').classList.remove('show');
    const f = this.onClose; this.onClose = null; f && f();
  },
  isOpen() { return $('#sheet').classList.contains('show'); },
  init() {
    $('#scrim').onclick = () => this.close();
    $('#sheetX').onclick = () => this.close();
    // drag the handle down to dismiss
    const sh = $('#sheet'), grab = $('#sheetGrab'); let st = null;
    grab.addEventListener('pointerdown', e => { st = { y: e.clientY, t: performance.now(), id: e.pointerId, dy: 0 }; try { grab.setPointerCapture(e.pointerId); } catch (er) { } sh.classList.add('dragging'); });
    grab.addEventListener('pointermove', e => { if (!st || e.pointerId !== st.id) return; st.dy = Math.max(0, e.clientY - st.y); sh.style.transform = `translateY(${st.dy}px)`; });
    const end = e => {
      if (!st || e.pointerId !== st.id) return;
      const v = st.dy / Math.max(1, performance.now() - st.t), dy = st.dy; st = null; sh.classList.remove('dragging');
      if (dy > 120 || (dy > 30 && v > .6)) this.close(); else sh.style.transform = '';
    };
    grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
  }
};

const Tip = {
  show(text, x, y, right = false) {
    const t = $('#tip'); t.textContent = text; t.classList.toggle('right', right);
    const half = t.offsetWidth / 2 + 8;
    t.style.left = (right ? x : clamp(x, half, Math.max(half, innerWidth - half))) + 'px'; t.style.top = Math.max(t.offsetHeight + 14, y) + 'px'; t.classList.add('show');
  },
  hide() { $('#tip').classList.remove('show'); },
  at(el) { const r = el.getBoundingClientRect(); if (el.closest('.nav')) this.show(el.dataset.tip, r.right, r.top + r.height / 2, true); else this.show(el.dataset.tip, r.left + r.width / 2, r.top); },
  init() {
    document.addEventListener('pointerover', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el && e.pointerType === 'mouse') this.at(el); });
    document.addEventListener('pointerout', e => { if (e.target.closest && e.target.closest('[data-tip]')) this.hide(); });
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-tip]');
      if (el && !el.closest('.nav')) { this.at(el); clearTimeout(this._t); this._t = setTimeout(() => this.hide(), 2200); }
    });
    addEventListener('scroll', () => this.hide(), { passive: true });
  }
};

/** segmented control with a sliding thumb */
function segSet(el, value) {
  if (!el) return;
  const btns = $$('button', el); let idx = -1;
  btns.forEach((b, i) => { const on = b.dataset.v === String(value) || b.dataset.r === String(value); b.classList.toggle('on', on); if (on) idx = i; });
  el.style.setProperty('--n', btns.length); el.style.setProperty('--i', Math.max(0, idx)); el.style.setProperty('--has', idx < 0 ? 0 : 1);
}
function rangeFill(inp) { const min = +inp.min || 0, max = +inp.max || 100; inp.style.setProperty('--fill', ((+inp.value - min) / (max - min) * 100) + '%'); }

/* ---------- 9. router ---------- */
const Router = {
  stack: [], guard: null, _replacing: false,
  parse(h) { const p = String(h || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } }); return { name: p[0] || 'home', args: p.slice(1) }; },
  start() { addEventListener('hashchange', () => this.onChange()); if (!location.hash) history.replaceState(null, '', '#/home'); this.onChange(); },
  onChange() {
    const h = location.hash || '#/home';
    if (this.guard && this.guard(h) === false) return;
    const s = this.stack;
    if (this._replacing) { this._replacing = false; if (s.length) s[s.length - 1] = h; else s.push(h); }
    else if (s.length > 1 && s[s.length - 2] === h) s.pop();
    else if (s[s.length - 1] !== h) s.push(h);
    if (s.length > 60) s.splice(0, s.length - 60);
    renderRoute(h);
  },
  go(path) { const h = '#' + path; if (location.hash === h) renderRoute(h); else location.hash = h; },
  replace(path) { const h = '#' + path; if (location.hash === h) { renderRoute(h); return; } this._replacing = true; location.replace(h); },
  up(path) { const h = '#' + path; const s = this.stack; if (s.length > 1 && s[s.length - 2] === h) history.back(); else this.replace(path); },
  /** re-insert current hash after the browser already moved away (used by guards) */
  restore(h) { history.pushState(null, '', h); }
};

/* ---------- 10. charts (plain SVG) ---------- */
const Charts = {
  nice(max) { if (max <= 5) return 5; const p = Math.pow(10, Math.floor(Math.log10(max))); const n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; },
  frame(el, labels, h, max, suffix = '') {
    const W = Math.max(240, el.clientWidth || 300), padL = suffix ? 38 : 30, padB = 22, padT = 8, iw = W - padL - 4, ih = h - padB - padT, n = labels.length;
    const step = iw / n;
    let g = '';
    [0, .5, 1].forEach(f => { const y = padT + ih - f * ih; g += `<line class="gl" x1="${padL}" x2="${W - 4}" y1="${y}" y2="${y}"/><text class="ax" x="${padL - 7}" y="${y + 3.5}" text-anchor="end">${Math.round(max * f)}${suffix}</text>`; });
    const every = Math.ceil(n / Math.max(1, Math.floor(iw / 44)));
    labels.forEach((t, i) => { if ((n - 1 - i) % every === 0) g += `<text class="ax" x="${padL + step * i + step / 2}" y="${h - 5}" text-anchor="middle">${esc(t)}</text>`; });
    return { W, padL, padT, iw, ih, step, g, y: v => padT + ih - v / max * ih, x: i => padL + step * i + step / 2 };
  },
  hits(f, tips) { return tips.map((t, i) => t ? `<rect class="hit" x="${f.padL + f.step * i}" y="${f.padT}" width="${f.step}" height="${f.ih}" rx="6" data-tip="${esc(t)}"/>` : '').join(''); },
  rbar(x, y, w, h, r, base) { r = Math.min(r, w / 2, h); return `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${base} Z`; },
  /** data: [{label, v, tip}] */
  bars(el, data, { h = 150, color = '' } = {}) {
    const max = this.nice(Math.max(1, ...data.map(d => d.v)));
    const f = this.frame(el, data.map(d => d.label), h, max);
    const bw = Math.max(2, Math.min(30, f.step * .68)), base = f.padT + f.ih;
    let b = '';
    data.forEach((d, i) => { if (!d.v) return; const bh = Math.max(3, d.v / max * f.ih); b += `<path class="barm" style="--i:${i}${color ? `;--c:${color}` : ''}" d="${this.rbar(f.x(i) - bw / 2, base - bh, bw, bh, 5, base)}"/>`; });
    el.innerHTML = `<svg viewBox="0 0 ${f.W} ${h}" height="${h}" role="img">${f.g}${b}${this.hits(f, data.map(d => d.tip))}</svg>`;
  },
  /** buckets: [{label, tip}], series: [{color, values[]}] — stacked columns */
  stacked(el, buckets, series, { h = 170 } = {}) {
    const sums = buckets.map((_, i) => series.reduce((a, s) => a + (s.values[i] || 0), 0));
    const max = this.nice(Math.max(1, ...sums));
    const f = this.frame(el, buckets.map(b => b.label), h, max);
    const bw = Math.max(2, Math.min(30, f.step * .68)), base = f.padT + f.ih;
    let b = '';
    buckets.forEach((_, i) => {
      let acc = 0;
      series.forEach(s => { const v = s.values[i] || 0; if (!v) return; const y0 = f.y(acc), y1 = f.y(acc + v); acc += v; const top = acc === sums[i];
        b += top ? `<path class="barm" style="--i:${i};--c:${s.color}" d="${this.rbar(f.x(i) - bw / 2, y1, bw, y0 - y1, 5, y0)}"/>` : `<rect class="barm" style="--i:${i};--c:${s.color}" x="${f.x(i) - bw / 2}" y="${y1}" width="${bw}" height="${y0 - y1}"/>`; });
    });
    el.innerHTML = `<svg viewBox="0 0 ${f.W} ${h}" height="${h}" role="img">${f.g}${b}${this.hits(f, buckets.map(x => x.tip))}</svg>`;
  },
  path(pts) {
    let d = '', pen = false;
    pts.forEach(p => { if (!p) { pen = false; return; } d += `${pen ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)} `; pen = true; });
    return d;
  },
  /** buckets: [{label, tip}], series: [{color, values[] (null = gap)}] */
  lines(el, buckets, series, { h = 170, max = 100, suffix = '', area = false, dots = true } = {}) {
    const f = this.frame(el, buckets.map(b => b.label), h, max, suffix);
    let p = '';
    series.forEach(s => {
      const pts = s.values.map((v, i) => v === null || v === undefined ? null : [f.x(i), f.y(Math.min(v, max))]);
      const real = pts.filter(Boolean); if (!real.length) return;
      const c = `style="--c:${s.color}"`;
      if (area && real.length > 1) p += `<path class="area" ${c} d="${this.path(real)}L${real[real.length - 1][0]},${f.padT + f.ih} L${real[0][0]},${f.padT + f.ih} Z"/>`;
      // split at gaps so every run draws itself
      let run = [];
      const flush = () => { if (run.length > 1) p += `<path class="ln" ${c} pathLength="1" d="${this.path(run)}"/>`; run = []; };
      pts.forEach(q => { if (q) run.push(q); else flush(); }); flush();
      if (dots) pts.forEach((q, i) => { if (q && (pts.length <= 16 || i === pts.length - 1 || !pts[i - 1] || !pts[i + 1])) p += `<circle class="dotm" ${c} cx="${q[0]}" cy="${q[1]}" r="3.6"/>`; });
    });
    if (!series.some(s => s.values.some(v => v !== null && v !== undefined))) p += `<text class="ax" x="${f.W / 2}" y="${h / 2}" text-anchor="middle">ยังไม่มีข้อมูลในช่วงนี้</text>`;
    el.innerHTML = `<svg viewBox="0 0 ${f.W} ${h}" height="${h}" role="img">${f.g}${p}${this.hits(f, buckets.map(x => x.tip))}</svg>`;
  }
};

/* ---------- 11. effects ---------- */
const Fx = {
  /** after HTML is inserted: grow bars / rings / counters from zero to their target */
  settle(root = document) {
    const run = () => {
      $$('[data-w]', root).forEach(e => { e.style.width = e.dataset.w; });
      $$('[data-h]', root).forEach(e => { e.style.height = e.dataset.h; });
      $$('[data-off]', root).forEach(e => { e.style.strokeDashoffset = e.dataset.off; });
      $$('[data-flex]', root).forEach(e => { e.style.flexGrow = e.dataset.flex; });
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
    $$('[data-count]', root).forEach(e => this.count(e, +e.dataset.count));
  },
  count(el, to, dur = 800) {
    if (reducedMotion() || !isFinite(to) || to === 0) { el.textContent = fmtNum(to); return; }
    const t0 = performance.now();
    const step = now => { const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4); el.textContent = fmtNum(Math.round(to * e)); if (k < 1 && el.isConnected) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  },
  ring(pct, r = 13, size = 34) { const c = 2 * Math.PI * r; return `<svg class="ring" viewBox="0 0 ${size} ${size}"><circle class="trk" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="arc" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}" data-off="${(c * (1 - clamp(pct, 0, 1))).toFixed(1)}"/></svg>`; },
  /** paper confetti burst */
  confetti(n = 110) {
    if (reducedMotion()) return;
    const cv = $('#confetti'), ctx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.display = 'block'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#1f6f54', '#5ec69b', '#d6981b', '#f3c65a', '#cf4a35', '#2f7fd6', '#fffdf8'];
    const ps = Array.from({ length: n }, (_, i) => { const left = i % 2 === 0, a = (left ? -Math.PI / 3 : -Math.PI * 2 / 3) + (Math.random() - .5) * .9, sp = 9 + Math.random() * 11;
      return { x: left ? -10 : W + 10, y: H * .72, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w: 6 + Math.random() * 6, h: 9 + Math.random() * 8, r: Math.random() * 6.28, vr: (Math.random() - .5) * .35, c: colors[i % colors.length], life: 1 }; });
    const tok = (this._ctok = (this._ctok || 0) + 1); let last = performance.now();
    const step = now => {
      if (tok !== this._ctok) return;
      const dt = Math.min(34, now - last) / 16.67; last = now; ctx.clearRect(0, 0, W, H); let alive = 0;
      ps.forEach(p => {
        p.vy += .34 * dt; p.vx *= Math.pow(.985, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.vy > 0) p.life -= .009 * dt;
        if (p.life <= 0 || p.y > H + 30) return; alive++;
        ctx.save(); ctx.globalAlpha = clamp(p.life * 1.6, 0, 1); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.r * 1.7)); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (alive) requestAnimationFrame(step); else { ctx.clearRect(0, 0, W, H); cv.style.display = 'none'; }
    };
    requestAnimationFrame(step);
  },
  /** load a script once (used for the optional stroke-order animation) */
  script(src) {
    this._js = this._js || {};
    return this._js[src] || (this._js[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete this._js[src]; rej(new Error('load failed')); }; document.head.appendChild(s); }));
  }
};
