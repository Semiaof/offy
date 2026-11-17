'use strict';
/* =====================================================================
   Library of Limu · new offy v4 — the scholar's road
   XP and imperial-exam ranks · seals (achievements) · daily quests
   plus the plucked-string sound set
   ===================================================================== */

/* ---------- ranks: the old examination ladder, 童生 → 状元 ---------- */
const RANKS = [
  { zh: '童生', th: 'ถงเซิง · ผู้เริ่มเรียน', en: 'Tongsheng · novice', xp: 0 },
  { zh: '秀才', th: 'ซิ่วไฉ · บัณฑิตอำเภอ', en: 'Xiucai · county scholar', xp: 600 },
  { zh: '举人', th: 'จวี่เหริน · บัณฑิตมณฑล', en: 'Juren · provincial graduate', xp: 2500 },
  { zh: '贡士', th: 'ก้งซื่อ · บัณฑิตเมืองหลวง', en: 'Gongshi · metropolitan graduate', xp: 6000 },
  { zh: '进士', th: 'จิ้นซื่อ · บัณฑิตหลวง', en: 'Jinshi · palace graduate', xp: 12000 },
  { zh: '探花', th: 'ทั่นฮวา · อันดับสาม', en: 'Tanhua · third in the realm', xp: 20000 },
  { zh: '榜眼', th: 'ป่างเหยี่ยน · อันดับสอง', en: 'Bangyan · second in the realm', xp: 32000 },
  { zh: '状元', th: 'จอหงวน · อันดับหนึ่ง', en: 'Zhuangyuan · top scholar', xp: 50000 }
];

/* ---------- seals: [id, hanzi, name th/en, how to earn th/en, test(ctx)] ---------- */
const SEALS = [
  ['first', '初学', 'ก้าวแรก', 'First steps', 'จบการเล่นรอบแรก', 'Finish your first round', c => c.sessions >= 1],
  ['s3', '三日', 'สามวันติด', 'Three days', 'เรียนติดต่อกัน 3 วัน', 'Study 3 days in a row', c => c.streak >= 3],
  ['s7', '七日', 'เจ็ดวันติด', 'One week', 'เรียนติดต่อกัน 7 วัน', 'Study 7 days in a row', c => c.streak >= 7],
  ['s30', '满月', 'ครบเดือน', 'Full moon', 'เรียนติดต่อกัน 30 วัน', 'Study 30 days in a row', c => c.streak >= 30],
  ['c100', '百卡', 'ร้อยใบ', 'Hundred cards', 'ตอบการ์ดครบ 100 ใบ', 'Answer 100 cards', c => c.cards >= 100],
  ['c1000', '千卡', 'พันใบ', 'Thousand cards', 'ตอบการ์ดครบ 1,000 ใบ', 'Answer 1,000 cards', c => c.cards >= 1000],
  ['c5000', '万卷', 'หมื่นม้วน', 'Ten thousand scrolls', 'ตอบการ์ดครบ 5,000 ใบ', 'Answer 5,000 cards', c => c.cards >= 5000],
  ['w100', '百词', 'ร้อยคำ', 'Hundred words', 'จำแม่น 100 คำ', 'Master 100 words', c => c.mastered >= 100],
  ['w500', '博学', 'รอบรู้', 'Well read', 'จำแม่น 500 คำ', 'Master 500 words', c => c.mastered >= 500],
  ['w1000', '千词', 'พันคำ', 'Thousand words', 'จำแม่น 1,000 คำ', 'Master 1,000 words', c => c.mastered >= 1000],
  ['p1', '满分', 'เต็มสิบ', 'Full marks', 'ได้ 3 ดาวในด่านใดก็ได้', 'Get 3 stars on any stage', c => c.perfect >= 1],
  ['p10', '十全', 'สิบสมบูรณ์', 'Ten perfect', 'ได้ 3 ดาวครบ 10 ด่าน', 'Get 3 stars on 10 stages', c => c.perfect >= 10],
  ['p50', '百炼', 'ร้อยหลอม', 'Tempered', 'ได้ 3 ดาวครบ 50 ด่าน', 'Get 3 stars on 50 stages', c => c.perfect >= 50],
  ['k10', '连珠', 'ร้อยไข่มุก', 'String of pearls', 'ตอบถูกติดกัน 10 ครั้งในรอบเดียว', 'Answer 10 in a row in one round', c => c.combo >= 10],
  ['k20', '破竹', 'ผ่าไม้ไผ่', 'Splitting bamboo', 'ตอบถูกติดกัน 20 ครั้งในรอบเดียว', 'Answer 20 in a row in one round', c => c.combo >= 20],
  ['d1', '听写', 'เขียนตามคำบอก', 'Dictation', 'บันทึกผล 听写 ครั้งแรก', 'Save your first dictation', c => c.dictSessions >= 1],
  ['d100', '笔耕', 'ไถนาด้วยพู่กัน', 'Ploughing with the brush', 'เขียน 听写 ถูก 100 คำ', 'Get 100 dictation words right', c => c.dictOk >= 100],
  ['night', '夜读', 'อ่านยามค่ำ', 'Night reading', 'เรียนหลัง 4 ทุ่ม', 'Study after 10 pm', c => c.night],
  ['dawn', '晨读', 'อ่านยามเช้า', 'Dawn reading', 'เรียนก่อน 7 โมงเช้า', 'Study before 7 am', c => c.dawn],
  ['lv1', '一级', 'จบระดับ 1', 'Level one', 'ผ่านทุกด่านของ HSK 1', 'Clear every stage of HSK 1', c => c.lvDone >= 1]
];

/* ---------- daily quests: [id, sizes, text th, text en, value from today's totals] ---------- */
const QUEST_POOL = [
  ['cards', [20, 30, 40], n => `ทำการ์ด ${n} ใบ`, n => `Answer ${n} cards`, t => t.cards],
  ['right', [15, 25, 35], n => `ตอบถูก ${n} ครั้ง`, n => `Get ${n} answers right`, t => t.correct],
  ['combo', [5, 8, 10], n => `ตอบถูกติดกัน ${n} ครั้งในรอบเดียว`, n => `${n} right in a row in one round`, t => t.combo],
  ['stage', [1, 2], n => `ผ่าน ${n} ด่านด้วย 2 ดาวขึ้นไป`, n => `Clear ${n} stage${n > 1 ? 's' : ''} with 2+ stars`, t => t.stages],
  ['review', [8, 12], n => `ทบทวนคำที่ค้าง ${n} คำ`, n => `Review ${n} due words`, t => t.review],
  ['dict', [5, 8], n => `听写 ${n} คำ`, n => `Dictate ${n} words`, t => t.dict],
  ['mins', [5, 10], n => `เรียนรวม ${n} นาที`, n => `Study for ${n} minutes`, t => t.mins]
];

const Gami = {
  rank(xp = Store.d.xp || 0) {
    let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
    const cur = RANKS[i], next = RANKS[i + 1] || null;
    return { i, cur, next, pct: next ? clamp(Math.round((xp - cur.xp) / (next.xp - cur.xp) * 100), 0, 100) : 100 };
  },
  /** three quests for the day, the same all day */
  pick(day) {
    let seed = [...day].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
    const due = Stats.reviewIds().length, pool = QUEST_POOL.filter(q => q[0] !== 'review' || due >= 8), out = [];
    const first = pool[rnd(2)]; out.push(first);
    while (out.length < 3) { const q = pool[2 + rnd(pool.length - 2)]; if (!out.includes(q)) out.push(q); }
    return out.map(q => ({ id: q[0], n: q[1][rnd(q[1].length)] }));
  },
  /** today's totals, straight from today's saved rounds */
  today() {
    const k = ymd(), t = { cards: 0, correct: 0, combo: 0, stages: 0, review: 0, dict: 0, mins: 0 };
    Store.d.sessions.forEach(s => {
      if (s.lg || ymd(new Date(s.ts)) !== k) return;
      t.cards += s.total || 0; t.correct += s.correct || 0; t.combo = Math.max(t.combo, s.mc || 0); t.mins += (s.dur || 0) / 60000;
      if (s.kind === 'stage' && !s.partial && s.stars >= 2) t.stages++;
      if (s.kind === 'review' || s.kind === 'retry') t.review += s.total || 0;
      if (s.mode === 'dict') t.dict += s.total || 0;
    });
    t.mins = Math.floor(t.mins); return t;
  },
  quests() {
    const d = Store.d, t = this.today();
    return (d.quests.list || []).map(q => { const def = QUEST_POOL.find(x => x[0] === q.id); if (!def) return null; const v = Math.min(q.n, def[4](t)); return { id: q.id, n: q.n, v, text: L(def[2](q.n), def[3](q.n)), done: !!d.quests.done[q.id] || v >= q.n }; }).filter(Boolean);
  },
  /** everything the seal tests look at */
  ctx() {
    const d = Store.d, real = d.sessions.filter(s => !s.lg), days = Stats.days();
    const hours = real.map(s => new Date(s.ts).getHours());
    let lvDone = 0; LEVELS.forEach(l => { const n = stageCount(l); if (n && Array.from({ length: n }, (_, i) => Stats.stage(l, i + 1)).every(s => s && s.plays)) lvDone++; });
    return {
      sessions: real.length, cards: d.sessions.reduce((a, s) => a + (s.total || 0), 0), streak: Stats.streak(days).best,
      mastered: Object.values(d.ws).filter(w => w.b >= 2).length, perfect: Object.values(d.stages).filter(s => s.stars === 3).length,
      combo: real.reduce((a, s) => Math.max(a, s.mc || 0), 0), dictSessions: real.filter(s => s.mode === 'dict').length,
      dictOk: real.reduce((a, s) => a + (s.mode === 'dict' ? s.correct || 0 : 0), 0), night: hours.some(h => h >= 22), dawn: hours.some(h => h >= 4 && h < 7), lvDone
    };
  },
  checkSeals() {
    const d = Store.d, c = this.ctx(), fresh = [];
    SEALS.forEach(s => { if (!d.seals[s[0]] && s[6](c)) { d.seals[s[0]] = Date.now(); fresh.push(s); } });
    return fresh;
  },
  /** called on load and whenever the day may have changed */
  ensure(keepSeals) {
    const d = Store.d; let dirty = false;
    if (typeof d.xp !== 'number') { d.xp = d.sessions.reduce((a, s) => a + (s.correct || 0) * 10, 0) + Object.values(d.stages).reduce((a, s) => a + (s.stars === 3 ? 50 : 0), 0); dirty = true; }
    if (!d.seals || typeof d.seals !== 'object') { d.seals = {}; dirty = true; }
    const day = ymd();
    if (!d.quests || d.quests.day !== day) { d.quests = { day, list: this.pick(day), done: {} }; dirty = true; }
    if (!keepSeals && this.checkSeals().length) dirty = true;      // history brought from an older version earns its seals quietly
    if (dirty) Store.save();
  },
  /** XP, quests and seals earned by one saved round */
  onSession(sess) {
    this.ensure(true);                  // the round is already in the history: its seals are announced below, not swallowed here
    const d = Store.d, before = d.xp, r0 = this.rank(before).i, items = [];
    const base = typeof sess.xp === 'number' ? sess.xp : (sess.correct || 0) * (sess.mode === 'dict' ? 15 : 10);
    if (base) items.push([L('คำตอบที่ถูก', 'Right answers'), base]);
    if (sess.kind === 'stage' && !sess.partial && sess.stars >= 2) items.push([sess.stars === 3 ? L('ด่านสมบูรณ์แบบ', 'Perfect stage') : L('ผ่านด่าน 2 ดาว', 'Two-star stage'), sess.stars === 3 ? 50 : 20]);
    const t = this.today(), doneQ = [];
    (d.quests.list || []).forEach(q => { const def = QUEST_POOL.find(x => x[0] === q.id); if (def && !d.quests.done[q.id] && def[4](t) >= q.n) { d.quests.done[q.id] = true; doneQ.push(L(def[2](q.n), def[3](q.n))); } });
    if (doneQ.length) items.push([L('ภารกิจประจำวัน', 'Daily quest') + (doneQ.length > 1 ? ` ×${doneQ.length}` : ''), 60 * doneQ.length]);
    if (!d.quests.goal && t.cards >= (S().goal || 30)) { d.quests.goal = true; items.push([L('ครบเป้าหมายวันนี้', 'Daily goal reached'), 40]); }
    const gain = items.reduce((a, x) => a + x[1], 0); d.xp = before + gain;
    const seals = this.checkSeals(), r1 = this.rank(d.xp);
    Store.save();
    return { gain, items, before, after: d.xp, rank: r1, rankUp: r1.i > r0, seals, quests: doneQ };
  },
  sealHTML(s, size = 58, cls = '') { return `<span class="sealx ${cls}" style="--sz:${size}px;--rot:${(s[0].charCodeAt(0) % 7) - 3}deg">${s[1]}</span>`; },
  /** the block shown on the result panel */
  resultHTML(g) {
    if (!g) return '';
    const r = g.rank, from = this.rank(g.before), start = g.rankUp ? 0 : from.pct;
    return `<div class="gain"><span class="sealx fill" style="--sz:50px">${r.cur.zh}</span><div class="gain-m">
        <div class="gain-h"><b>+${fmtNum(g.gain)} XP</b><small>${r.next ? `${fmtNum(g.after)} / ${fmtNum(r.next.xp)} · ${L('ถัดไป', 'next')} ${r.next.zh}` : `${fmtNum(g.after)} XP`}</small></div>
        <span class="xpbar"><i style="width:${start}%" data-w="${r.pct}%"></i></span></div></div>
      ${g.items.length > 1 || g.seals.length ? `<div class="gain-list">${g.items.slice(1).map(([n, v]) => `<span class="gchip">${esc(n)} <b>+${v}</b></span>`).join('')}${g.seals.map(s => `<span class="gchip seal">${this.sealHTML(s, 30, 'stampin')}${esc(L(s[2], s[3]))}</span>`).join('')}</div>` : ''}`;
  },
  /** toasts / rank-up dialog after a round */
  celebrate(g, delay = 900) {
    if (!g) return;
    g.quests.forEach((q, i) => setTimeout(() => { sfx('quest'); toast(L('ภารกิจสำเร็จ: ', 'Quest done: ') + q, { icon: 'check', ms: 3200 }); }, delay + i * 700));
    g.seals.forEach((s, i) => setTimeout(() => { sfx('seal'); toast(L('ได้ตราประทับ ', 'New seal ') + `${s[1]} · ${L(s[2], s[3])}`, { icon: 'mastered', ms: 3600 }); }, delay + 400 + (g.quests.length + i) * 700));
    if (g.rankUp) setTimeout(() => {
      sfx('rank'); Fx.confetti(140);
      modal({ title: L('เลื่อนขั้นแล้ว', 'Rank up'), html: `<div class="rankup"><span class="sealx fill stampin" style="--sz:112px">${g.rank.cur.zh}</span><b>${esc(L(g.rank.cur.th, g.rank.cur.en))}</b><span>${fmtNum(g.after)} XP</span></div>`, buttons: [{ label: L('ไปต่อ', 'Onward'), cls: 'primary', value: true }], dismiss: true });
    }, delay + 600 + (g.quests.length + g.seals.length) * 700);
  },
  /** sheet with every seal */
  openSeals() {
    const d = Store.d, got = SEALS.filter(s => d.seals[s[0]]).length;
    Sheet.open(`<div class="sheet-h"><div><h3>${L('ตราประทับ', 'Seals')}</h3><p>${L(`สะสมแล้ว ${got} จาก ${SEALS.length} ดวง`, `${got} of ${SEALS.length} collected`)}</p></div></div>
      <div class="seal-grid">${SEALS.map(s => { const ts = d.seals[s[0]]; return `<div class="seal-it ${ts ? '' : 'off'}">${this.sealHTML(s, 64, ts ? '' : 'off')}<b>${esc(L(s[2], s[3]))}</b><small>${esc(ts ? fmtDate(ts).split(' · ')[0] : L(s[4], s[5]))}</small></div>`; }).join('')}</div>`);
  },
  /** sheet with the rank ladder */
  openRanks() {
    const xp = Store.d.xp || 0, r = this.rank(xp);
    Sheet.open(`<div class="sheet-h"><div><h3>${L('เส้นทางบัณฑิต', 'The scholar\'s road')}</h3><p>${fmtNum(xp)} XP · ${L('ตอบถูก ผ่านด่าน และทำภารกิจเพื่อเก็บ XP', 'earn XP from right answers, stages and quests')}</p></div></div>
      <div class="ladder">${RANKS.map((k, i) => `<div class="rung ${i < r.i ? 'done' : i === r.i ? 'cur' : ''}"><span class="sealx ${i <= r.i ? 'fill' : 'off'}" style="--sz:52px">${k.zh}</span><div><b>${esc(L(k.th, k.en))}</b><small>${fmtNum(k.xp)} XP</small>${i === r.i && r.next ? `<span class="xpbar"><i style="width:${r.pct}%"></i></span>` : ''}</div></div>`).join('')}</div>`);
  }
};

/* ---------- sound: a plucked string (Karplus–Strong) gives the app its own voice ---------- */
Sfx.pluck = function (f, o = {}) {
  const c = this.ctx, key = Math.round(f * 10); this._pl = this._pl || {};
  let buf = this._pl[key];
  if (!buf) {
    const sr = c.sampleRate, N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * 1.7), d = new Float32Array(len), ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    for (let k = 0; k < 3; k++) for (let i = 1; i < N; i++) ring[i] = (ring[i] + ring[i - 1]) / 2;      // round off the attack
    let p = 0, peak = 0;
    for (let i = 0; i < len; i++) { const n = (p + 1) % N; d[i] = ring[p]; ring[p] = (ring[p] + ring[n]) * .4982; p = n; peak = Math.max(peak, Math.abs(d[i])); }
    if (peak > 0) for (let i = 0; i < len; i++) d[i] /= peak;
    buf = c.createBuffer(1, len, sr); buf.getChannelData(0).set(d); this._pl[key] = buf;
  }
  const src = c.createBufferSource(), g = c.createGain(), t0 = c.currentTime + (o.t || 0) + .006, dur = o.dur || 1.3;
  src.buffer = buf; g.gain.setValueAtTime(o.gain ?? .3, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  src.connect(g); g.connect(this.out); src.start(t0); src.stop(t0 + dur + .05);
};
const GONG = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];      // 宫商角徵羽 — the pentatonic scale
Object.assign(Sfx.lib, {
  correct(combo = 1) { const i = clamp(combo - 1, 0, 6); this.pluck(GONG[i], { gain: .3 }); this.pluck(GONG[i + 2], { t: .08, gain: .24 }); this.tone(GONG[i + 2] * 2, { t: .08, dur: .3, gain: .03 }); },
  wrong() { this.pluck(123.47, { gain: .3, dur: .5 }); this.pluck(116.54, { t: .03, gain: .24, dur: .45 }); this.tone(92, { to: 70, dur: .16, gain: .1 }); },
  timeout() { this.pluck(196, { gain: .26, dur: .5 }); this.pluck(146.83, { t: .14, gain: .26, dur: .7 }); },
  tick() { this.tone(900, { dur: .03, gain: .07, type: 'triangle' }); this.tone(450, { dur: .05, gain: .05 }); },
  star(i = 0) { this.pluck(GONG[5 + clamp(i, 0, 2)], { gain: .26, dur: 1 }); this.tone(GONG[5 + clamp(i, 0, 2)] * 2, { dur: .5, gain: .04 }); },
  complete() { [0, 2, 3, 5, 7].forEach((n, i) => this.pluck(GONG[n], { t: i * .1, gain: .26, dur: i === 4 ? 1.6 : .9 })); this.tone(GONG[7] * 2, { t: .4, dur: .9, gain: .035 }); },
  fail() { this.pluck(196, { gain: .24, dur: .6 }); this.pluck(164.81, { t: .2, gain: .24, dur: .9 }); },
  save() { this.pluck(GONG[3], { gain: .26 }); this.pluck(GONG[5], { t: .1, gain: .26 }); },
  seal() { this.tone(130, { to: 55, dur: .16, gain: .3 }); this.noise({ from: 900, to: 180, dur: .1, gain: .13, q: .7 }); },
  quest() { this.pluck(GONG[4], { gain: .26 }); this.pluck(GONG[6], { t: .09, gain: .26 }); this.pluck(GONG[8], { t: .18, gain: .22 }); },
  rank() { [0, 2, 3, 5, 7, 8, 9].forEach((n, i) => this.pluck(GONG[n], { t: i * .085, gain: .26, dur: i === 6 ? 1.7 : .9 })); this.tone(GONG[9] * 2, { t: .55, dur: 1.1, gain: .04 }); },
  on() { this.pluck(GONG[4], { gain: .16, dur: .5 }); this.pluck(GONG[6], { t: .06, gain: .16, dur: .6 }); },
  off() { this.pluck(GONG[6], { gain: .16, dur: .5 }); this.pluck(GONG[4], { t: .06, gain: .16, dur: .6 }); }
});
