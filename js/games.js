'use strict';
/* =====================================================================
   Library of Limu · new offy v4 — mini-games
   duel (ดวลบัณฑิต) · chain (ต่อคำลูกโซ่) · merge (หลอมอักษร) · match (ไพ่ความจำ) · order (เรียงประโยค)
   cloze (เติมช่องว่าง) · tone (ล่าวรรณยุกต์) · rain (โคมลอย) · listen (ระฆัง)
   Every game saves an ordinary round (mode = the game's id), so stars, XP, quests and
   the insights pages count it like flashcards: one entry per word, right on the first try or not.
   ===================================================================== */

/** the games you can pick for a stage or a free-play deck, in the order they are shown */
const GAME_LIST = [
  { id: 'flash', icon: 'cards', name: L('แฟลชการ์ด', 'Flashcards'), sub: L('พลิกการ์ด 4 ตัวเลือก', 'Flip, 4 choices') },
  { id: 'tingxie', icon: 'pen', name: '听写', sub: L('เขียนตามคำบอก', 'Dictation') },
  { id: 'duel', icon: 'g-duel', name: L('ดวลบัณฑิต', 'Scholar duel'), sub: L('ทิ้งไพ่โจมตีบอส', 'Throw cards at the boss') },
  { id: 'chain', icon: 'g-chain', name: L('โดมิโนคำ', 'Word dominoes'), sub: L('ต่อคำที่ขึ้นต้นด้วยตัวท้าย', 'Chain words end to start') },
  { id: 'merge', icon: 'g-merge', name: L('หลอมอักษร', 'Character forge'), sub: L('รวมอักษรให้เป็นคำ', 'Forge characters into words') },
  { id: 'match', icon: 'g-match', name: L('หน้าต่างความจำ', 'Memory windows'), sub: L('เปิดหน้าต่างหาคู่', 'Open windows, find pairs') },
  { id: 'order', icon: 'g-order', name: L('เรียงประโยค', 'Word order'), sub: L('วางบล็อกเรียงประโยค', 'Stack the blocks in order') },
  { id: 'cloze', icon: 'g-gap', name: L('ป้ายร้านทอง', 'Golden sign'), sub: L('เติมคำทองลงป้ายร้าน', 'Fill the missing gold word') },
  { id: 'tone', icon: 'g-tone', name: L('ล่าวรรณยุกต์', 'Tone hunt'), sub: L('วาดเส้นเสียงด้วยนิ้ว', 'Draw the tones') },
  { id: 'rain', icon: 'g-rain', name: L('โคมลอย', 'Sky lanterns'), sub: L('ตอบก่อนโคมลอยพ้นฟ้า', 'Answer before they float away') }
  /* --- Disabled for now (after Sky lanterns) ---
  { id: 'listen', icon: 'ear', name: L('ระฆังฟังเสียง', 'Bells'), sub: L('ฟังแล้วตีระฆังให้ถูก', 'Hear it, ring the right bell') },
  { id: 'runner', icon: 'g-runner', name: L('วิ่งหนีหินยักษ์', 'Boulder runner'), sub: L('ปัดซ้าย-ขวาเข้าทางแยก & โดดหลบ', '3-lane signpost runner & dodge') },
  { id: 'parkour', icon: 'g-parkour', name: L('ไต่หอคอยหนีไฟ', 'Tower climb'), sub: L('กระโดดดีดกำแพงไต่หอคอยหนีไฟนรก', 'Wall-jump up the tower above rising hellfire') },
  { id: 'kunai', icon: 'g-kunai', name: L('มีดบินสังหารเงา', 'Shadow kunai'), sub: L('ปามีดสั้นสกัดมือสังหารเงา', 'Throw kunai at shadow assassins') },
  { id: 'bomb', icon: 'g-bomb', name: L('กู้ระเบิดดินปืน', 'Fuse defusal'), sub: L('ตัดสายชนวนคำแปลก่อนระเบิด', 'Cut the right fuse wire in time') },
  { id: 'siege', icon: 'g-siege', name: L('ปืนกลยันต์เพลิง', 'Talisman siege'), sub: L('รัวยันต์ไฟปราบฝูงผีดิบเจียงซี', 'Rapid-fire talismans vs Jiangshi') },
  { id: 'forge', icon: 'g-forge', name: L('ตีดาบเหล็กไหล', 'Hellfire forge'), sub: L('ทุบค้อนหลอมอักษรลงใบดาบศึก', 'Hammer red-hot characters into a blade') },
  { id: 'jade', icon: 'g-jade', name: L('ด่านตรวจป้ายหยก', 'Jade inspector'), sub: L('สายฟ้าฟาดป้ายหยกที่แปลปลอม', 'Strike the fake jade plaque') },
  { id: 'slice', icon: 'g-slice', name: L('คมดาบพู่กัน', 'Brush-blade slash'), sub: L('ฟันป้ายไม้คำศัพท์กลางอากาศ', 'Slice airborne word plaques in half') },
  { id: 'cipher', icon: 'g-cipher', name: L('กุญแจกลไกราชวงศ์', 'Royal lockbox'), sub: L('หมุนล้อพินอินปลดสลักหีบสมบัติ', 'Dial brass pinyin wheels to unlock') },
  { id: 'dimsum', icon: 'g-dimsum', name: L('สายพานเข่งติ่มซำ', 'Dim sum belt'), sub: L('ตัดสินไว รับเสิร์ฟหรือส่งคืนครัว', 'Speed-sort true or fake pairings') },
  { id: 'lanternfog', icon: 'g-lanternfog', name: L('ตะเกียงส่องหมอก', 'Lantern fog'), sub: L('ส่องตะเกียงเชื่อมคำในม่านหมอก', 'Light up characters hidden in mist') }
  */
];
const GAME_BY_ID = Object.fromEntries(GAME_LIST.map(g => [g.id, g]));
GAME_BY_ID.judge = { id: 'judge', icon: 'target', name: L('จับผิดประโยค', 'Spot mistake'), sub: L('ตัดสินว่าประโยคนี้ถูกหรือผิดไวยากรณ์', 'Judge whether the sentence is right or wrong') };
const gameName = id => (GAME_BY_ID[id] || GAME_BY_ID.flash).name;

/** start any game (flashcards and 听写 keep their own screens) */
function playGame(id, cfg) {
  if (!GAME_BY_ID[id]) id = 'flash';
  if (id === 'tingxie') {
    const c = Store.d.customCfg || {};
    Dicta.start({ ans: c.ans || 'draw', repeat: +c.repeat || 2, rate: +c.rate || S().rate, meanHint: c.meanHint !== false, strict: c.strict !== false, ...cfg, title: cfg.title && !/^听写/.test(cfg.title) ? `听写 · ${cfg.title}` : cfg.title });
  } else if (!MG[id]) Game.start(cfg);
  else Mini.start({ ...cfg, game: id });
}

/** a row of game tiles; `on` is the chosen id */
function gamePickerHTML(on, ids = GAME_LIST.map(g => g.id)) {
  return `<div class="gpick" role="radiogroup">${ids.map(id => { const g = GAME_BY_ID[id]; return `<button type="button" class="gp ${id === on ? 'on' : ''}" data-game="${id}" role="radio" aria-checked="${id === on}">
    <span class="gp-ic">${ic(g.icon)}</span><b>${g.id === 'tingxie' ? `<span class="hz">听写</span>` : esc(g.name)}</b><small>${esc(g.sub)}</small></button>`; }).join('')}</div>`;
}

/* ---------- pinyin syllables (for the tone game and for "sounds alike") ---------- */
const PY_SYL = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(iang|iong|uang|ueng|uai|uan|van|ian|iao|ang|eng|ing|ong|ai|ei|ao|ou|an|en|in|un|vn|ia|ie|iu|ua|uo|ui|ve|ue|er|a|o|e|i|u|v)r?$/;
/** split pinyin into exactly n syllables, each {plain, mark, tone}; null when it can't be done */
function sylSplit(py, n) {
  const seq = [], bounds = new Set();
  String(py || '').toLowerCase().normalize('NFC').replace(/u:/g, 'ü').split(/[\s'’\-·]+/).filter(Boolean).forEach(p => {
    for (const ch of p) {
      if (TONE_CHARS[ch]) seq.push({ l: TONE_CHARS[ch][0], t: TONE_CHARS[ch][1], o: ch });
      else if (ch === 'ü' || ch === 'v') seq.push({ l: 'v', t: 0, o: 'ü' });
      else if (ch >= 'a' && ch <= 'z') seq.push({ l: ch, t: 0, o: ch });
    }
    bounds.add(seq.length);
  });
  const Ls = seq.map(x => x.l).join(''), memo = new Map();
  const go = (i, k) => {
    if (i === Ls.length) return k === 0 ? [] : null;
    if (k <= 0) return null;
    const key = i * 64 + k; if (memo.has(key)) return memo.get(key);
    let res = null;
    for (let j = Math.min(Ls.length, i + 7); j > i && !res; j--) {
      let cross = false; for (const b of bounds) if (b > i && b < j) { cross = true; break; }
      if (cross || !PY_SYL.test(Ls.slice(i, j))) continue;
      const rest = go(j, k - 1); if (rest) res = [[i, j], ...rest];
    }
    memo.set(key, res); return res;
  };
  const sp = n > 0 && go(0, n); if (!sp) return null;
  return sp.map(([i, j]) => { const seg = seq.slice(i, j), t = (seg.find(x => x.t) || {}).t || 5; return { plain: seg.map(x => x.l === 'v' ? 'ü' : x.l).join(''), mark: seg.map(x => x.o).join(''), tone: t }; });
}
/** syllables of a word (cached); erhua 儿 may have no syllable of its own */
function wordSyl(w) {
  if (w._syl !== undefined) return w._syl;
  const n = Array.from(w.zh).filter(c => /[㐀-鿿]/.test(c)).length, py = String(w.py).split('/')[0];
  // 一点儿 yìdiǎnr / 哪儿 nǎr: the 儿 is only an r on the syllable before it
  const erhua = /儿$/.test(w.zh) && w.zh.length > 1 && /r$/.test(pyPlain(py)) && !/(^|[\s'’])[eéèěē]r$/i.test(py.trim());   // 女儿 nǚ'ér keeps its own ér
  let r = n ? sylSplit(py, erhua ? n - 1 : n) : null;
  if (!r && n > 1) r = sylSplit(py, erhua ? n : n - 1);
  return (w._syl = r);
}

/* ---------- sentence pieces (for word order) ---------- */
let ZH_SET = null;
const PUNCT = /[。！？!?．.，,、；;：:“”"'‘’（）()…—\s]/;      // a piece made of these sticks to the piece before it
const PUNCT_ALL = /[。！？!?．.，,、；;：:“”"'‘’（）()…—\s]/g;
function sentenceTokens(w) {
  if (w._tok !== undefined) return w._tok;
  const sent = String(w.ex_zh || '').trim();
  if (!sent || !/[㐀-鿿]/.test(sent)) return (w._tok = null);
  if (!ZH_SET) { ZH_SET = new Set(); RAW_WORDS.forEach(x => { if (x.zh.length <= 4) ZH_SET.add(x.zh); }); }
  const seg = str => {          // longest known word first, otherwise one character
    const out = [], a = Array.from(str);
    for (let i = 0; i < a.length;) {
      let took = 1;
      for (let k = Math.min(4, a.length - i); k > 1; k--) if (ZH_SET.has(a.slice(i, i + k).join(''))) { took = k; break; }
      out.push(a.slice(i, i + took).join('')); i += took;
    }
    return out;
  };
  // punctuation inside the sentence sticks to the piece before it; the final mark is shown after solving
  const body = sent.replace(/[。！？!?．.]+$/, ''), end = sent.slice(body.length);
  let toks = [];
  body.split(/([，,、；;：:“”"‘’（）()…—\s！!？?。.]+)/).forEach(part => {
    if (!part) return;
    if (PUNCT.test(part[0])) { const p = part.replace(/\s+/g, ''); if (p && toks.length) toks[toks.length - 1] += p; return; }
    const at = part.indexOf(w.zh);
    if (w.zh && at >= 0) toks.push(...seg(part.slice(0, at)), w.zh, ...seg(part.slice(at + w.zh.length)));
    else toks.push(...seg(part));
  });
  toks = toks.filter(Boolean);
  // short sentences (吃早饭): break the longest piece that isn't the word itself into single characters
  for (let guard = 0; toks.length < 3 && guard < 3; guard++) {
    let k = -1; toks.forEach((t, i) => { const n = Array.from(t.replace(PUNCT_ALL, '')).length; if (t !== w.zh && n > 1 && (k < 0 || n > Array.from(toks[k]).length)) k = i; });
    if (k < 0) break;
    const chars = Array.from(toks[k]), out = []; chars.forEach(c => { if (PUNCT.test(c) && out.length) out[out.length - 1] += c; else out.push(c); });
    toks.splice(k, 1, ...out);
  }
  while (toks.length > 8) {     // long sentences: glue the shortest neighbours so the tray stays manageable
    let best = 0; for (let i = 1; i < toks.length - 1; i++) if (toks[i].length + toks[i + 1].length < toks[best].length + toks[best + 1].length) best = i;
    toks.splice(best, 2, toks[best] + toks[best + 1]);
  }
  return (w._tok = toks.length >= 3 && new Set(toks).size >= 2 ? { toks, end } : null);
}

/* ---------- picking wrong answers ---------- */
function distractors(w, n, { avoid = '', sound = false } = {}) {
  const used = new Set([w.zh]), out = [];
  const meaning = x => meaningText(x).toLowerCase(), wm = meaning(w);
  const fine = x => x && !used.has(x.zh) && meaning(x) !== wm && !(avoid && avoid.includes(x.zh)) && (!x.custom || w.custom);
  let pool;
  if (sound) {
    const ws = wordSyl(w) || [], first = ws[0] && ws[0].plain, last = ws.length && ws[ws.length - 1].plain;
    const key = x => String(x.py).toLowerCase().normalize('NFC').replace(/[\s'’·-]/g, ''), wk = key(w);
    pool = WORDS.map(x => {
      if (!fine(x) || key(x) === wk) return null;           // exactly the same sound (是 / 事 / 市) can't be told apart by ear
      let sc = Math.random() * 6;
      if (x._py === w._py) sc += 100;                                        // same sounds, other tones (买 / 卖)
      const xs = wordSyl(x);
      if (xs && ws.length) {
        if (xs.length === ws.length) sc += 15;
        if (first && xs[0] && xs[0].plain === first) sc += 40;
        if (last && xs[xs.length - 1] && xs[xs.length - 1].plain === last) sc += 25;
        if (first && xs[0] && xs[0].plain[0] === first[0]) sc += 6;
      }
      if (x.lvl === w.lvl) sc += 4;
      return [sc, x];
    }).filter(Boolean).sort((a, b) => b[0] - a[0]).slice(0, 14).map(p => p[1]);
    const twins = pool.filter(x => x._py === w._py);                      // same sounds, other tones: always offered first
    pool = shuffle(twins).concat(shuffle(pool.filter(x => x._py !== w._py).slice(0, 7)), pool);
  } else {
    const same = WORDS.filter(x => fine(x) && x._pk === w._pk && x.lvl === w.lvl);
    const near = WORDS.filter(x => fine(x) && x._pk === w._pk && x._len === w._len);
    pool = shuffle(same).concat(shuffle(near), shuffle(WORDS.filter(fine)).slice(0, 40));
  }
  // no two options may read the same (没关系 and 不客气 are both "ไม่เป็นไร")
  const seen = new Set([wm]);
  for (const x of pool) { if (out.length >= n) break; if (fine(x) && (sound || !seen.has(meaning(x)))) { out.push(x); used.add(x.zh); seen.add(meaning(x)); } }
  return out;
}

/* =====================================================================
   the shared frame: header, combo, XP, clock, pause, saving, result panel
   ===================================================================== */
const Mini = {
  s: null,
  start(cfg) {
    const G = MG[cfg.game]; if (!G) { Game.start(cfg); return; }
    const all = (cfg.words || []).filter(Boolean), words = all.filter(w => !G.ok || G.ok(w));
    if (!words.length) { toast(G.none || L('คำชุดนี้เล่นเกมนี้ไม่ได้', 'These words don\'t work with this game'), { icon: 'info', ms: 3200 }); return; }
    if (words.length < all.length) setTimeout(() => toast(L(`ข้าม ${all.length - words.length} คำที่ใช้กับเกมนี้ไม่ได้`, `Skipped ${all.length - words.length} words this game can't use`), { icon: 'info' }), 600);
    this.teardown();
    this.s = { cfg: { ...cfg }, game: cfg.game, G, words: shuffle(words), title: cfg.title || gameName(cfg.game), kind: cfg.kind || 'custom', back: cfg.back || '/home',
      results: [], combo: 0, bestCombo: 0, xp: 0, ts: Date.now(), t0: performance.now(), pausedAt: 0, pausedMs: 0, paused: false, finished: false, saved: false, mounted: false, timers: new Set() };
    if (location.hash === '#/mini') this.mount(); else Router.go('/mini');
  },
  alive(s) { return !!s && this.s === s; },
  onShow() { if (!this.s) { Router.replace('/home'); return; } if (!this.s.mounted) this.mount(); },
  mount() {
    const s = this.s; s.mounted = true;
    $('#mgTitle').textContent = s.title === gameName(s.game) ? s.title : `${gameName(s.game)} · ${s.title}`;
    const r = $('#mgResult'); r.hidden = true; r.innerHTML = '';
    $('#mgCombo').className = 'combo'; $('#mgQuit use').setAttribute('href', '#i-x');
    const st = $('#mgStage'); st.className = `mstage g-${s.game} scroll-unfurl`; delete st.dataset.comboTier; st.innerHTML = ''; st.onclick = null; st.onpointerdown = null;
    setTimeout(() => st.classList.remove('scroll-unfurl'), 560);
    this.header();
    clearInterval(s.clockT);
    s.clockT = setInterval(() => { if (this.alive(s) && !s.paused && !s.finished) $('#mgClock').textContent = fmtClock(this.elapsed()); }, 250);
    $('#mgClock').textContent = '00:00';
    s.G.mount(s, st);
  },
  teardown() {
    const s = this.s; TTS.stop();
    if (!s) return;
    clearInterval(s.clockT); s.timers.forEach(t => clearTimeout(t)); s.timers.clear();
    cancelAnimationFrame(s.raf);
    if (s.G.stop) s.G.stop(s);
  },
  /** setTimeout that dies with the round */
  later(fn, ms) { const s = this.s, t = setTimeout(() => { s.timers.delete(t); if (this.alive(s) && !s.finished) fn(); }, ms); s.timers.add(t); return t; },
  elapsed() { const s = this.s; return (s.pausedAt || performance.now()) - s.t0 - s.pausedMs; },
  total() { const s = this.s; return s.G.total ? s.G.total(s) : s.words.length; },
  header() {
    const s = this.s; if (!s) return;
    const n = s.results.length, total = this.total();
    $('#mgProg').textContent = `${Math.min(n + (s.finished ? 0 : 1), total)} / ${total}`;
    $('#mgBar').style.width = (total ? n / total * 100 : 0) + '%';
  },
  setCombo(n) {
    const s = this.s, el = $('#mgCombo'), st = $('#mgStage');
    s.combo = n; s.bestCombo = Math.max(s.bestCombo, n);
    const tier = n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0;
    if (st) {
      if (tier > 0) { st.dataset.comboTier = String(tier); GX.embers(st, tier); }
      else delete st.dataset.comboTier;
    }
    if (n >= 2) {
      const iconHtml = tier === 3 ? ic('star') : tier >= 1 ? ic('flame') : '';
      el.innerHTML = `${iconHtml}${T('ต่อเนื่อง')} ×${n}`;
      el.className = `combo show bump${tier ? ' combo-t' + tier : ''}`;
      void el.offsetWidth;
    } else {
      el.className = 'combo';
    }
  },
  /** one word is settled: ok = right on the first try */
  mark(w, ok, ms, at) {
    const s = this.s; if (!s || s.results.some(r => r.id === w.id)) return;
    s.results.push({ id: w.id, ok: !!ok, ms: Math.round(ms || 0) });
    if (ok) { this.setCombo(s.combo + 1); sfx('correct', s.combo); buzz(14); const gain = 10 + Math.min(10, (s.combo - 1) * 2); s.xp += gain; this.xpFloat(gain, at); }
    else { this.setCombo(0); sfx('wrong'); buzz([24, 50, 24]); }
    this.header();
  },
  /** a slip that doesn't settle a word yet (wrong pair, wrong drop) */
  slip() { this.setCombo(0); sfx('wrong'); buzz([20, 40, 20]); },
  xpFloat(n, at) {
    const st = $('#mgStage'), el = document.createElement('div'); el.className = 'xp-float'; el.textContent = `+${n} XP`;
    if (at && at.getBoundingClientRect) { const a = at.getBoundingClientRect(), b = st.getBoundingClientRect(); el.style.left = (a.left - b.left + a.width / 2) + 'px'; el.style.top = (a.top - b.top) + 'px'; el.style.right = 'auto'; }
    st.appendChild(el); setTimeout(() => el.remove(), 1150);
  },
  /** after an answer: move on by itself or wait for "next", following the settings for right / wrong answers */
  advance(ok, host, fn) {
    const s = this.s, mode = ok ? S().afterOk : S().afterBad, ms = mode === 'auto' ? 1300 : (+mode > 0 ? +mode * 1000 : 0);
    host.innerHTML = `<button class="btn primary lg m-next" data-a="next">${T('ถัดไป')}${ic('arrow-r')}</button>`;
    const b = host.querySelector('.m-next'); let gone = false;
    const go = () => { if (gone || !this.alive(s)) return; gone = true; clearTimeout(s.adv); fn(); };
    b.onclick = go; s.nextBtn = b;
    if (ms) { b.style.setProperty('--wait', ms + 'ms'); b.classList.add('count'); clearTimeout(s.adv); s.adv = this.later(go, ms); }
    if (!ok) b.focus({ preventScroll: true });
    requestAnimationFrame(() => b.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }));     // short screens: bring "next" into view
  },
  holdAdvance() { const s = this.s; if (s && s.adv) { clearTimeout(s.adv); s.timers.delete(s.adv); s.adv = 0; if (s.nextBtn) s.nextBtn.classList.remove('count'); } },
  key(e) {
    const s = this.s; if (!s) return;
    if (e.key === 'Escape') { e.preventDefault(); this.quitAsk(); return; }
    if (s.finished || s.paused) return;
    if ((e.key === 'Enter' || e.key === ' ') && s.nextBtn && s.nextBtn.isConnected) { e.preventDefault(); s.nextBtn.click(); return; }
    if (s.G.key) s.G.key(s, e);
  },
  pause() { const s = this.s; if (!s || s.paused) return; s.paused = true; s.pausedAt = performance.now(); TTS.stop(); },
  resume() { const s = this.s; if (!s || !s.paused) return; s.pausedMs += performance.now() - s.pausedAt; s.pausedAt = 0; s.paused = false; if (s.G.resume) s.G.resume(s); },
  async quitAsk() {
    const s = this.s; if (!s) return;
    if (s.finished) { this.leave(s.back); return; }
    this.pause();
    const btns = [{ label: `${T('เล่นต่อ')}`, cls: 'primary', icon: 'play', value: 'resume' }, { label: `${T('เริ่มรอบนี้ใหม่')}`, icon: 'retry', value: 'restart' }];
    if (s.results.length) btns.push({ label: L(`บันทึก ${s.results.length} คำที่ทำแล้ว และออก`, `Save ${s.results.length} words and leave`), icon: 'down', value: 'save' });
    btns.push({ label: `${T('ออกโดยไม่บันทึก')}`, cls: 'danger', value: 'quit' });
    const v = await modal({ title: `${T('พักเกม')}`, msg: `${gameName(s.game)} · ${L('ทำไปแล้ว', 'done')} ${s.results.length}/${this.total()} · ${L('เวลาหยุดเดินอยู่', 'the clock is stopped')}`, buttons: btns, dismiss: 'resume' });
    if (!this.alive(s)) return;
    if (v === 'restart') this.start(s.cfg);
    else if (v === 'save') { this.save(true); toast(`${T('บันทึกผลแล้ว')}`, { icon: 'check' }); this.leave(s.back); }
    else if (v === 'quit') this.leave(s.back);
    else this.resume();
  },
  leave(back) { this.teardown(); this.s = null; Router.up(back || '/home'); },
  save(partial) {
    const s = this.s; if (s.saved || !s.results.length) return null;
    const total = s.results.length, correct = s.results.filter(r => r.ok).length;
    const sess = { mode: s.game, kind: s.kind, label: s.title, lvl: s.cfg.lvl, stage: s.cfg.stage, ts: s.ts, dur: Math.round(this.elapsed()), total, correct, stars: Stats.starsFor(correct, total), words: s.results.map(r => [r.id, r.ok, r.ms]), mc: s.bestCombo, xp: s.xp };
    if (partial) sess.partial = true;
    s.saved = true;
    const best = Stats.record(sess); s.gain = Gami.onSession(sess);
    return best;
  },
  finish() {
    const s = this.s; if (!s || s.finished) return;
    s.finished = true; this.header(); this.setCombo(0); clearInterval(s.clockT); cancelAnimationFrame(s.raf);
    s.dur = this.elapsed(); $('#mgClock').textContent = fmtClock(s.dur);
    const best = this.save(false);
    setTimeout(() => { if (this.alive(s)) this.showResult(best); }, 380);
  },
  showResult(best) {
    const s = this.s, total = s.results.length, correct = s.results.filter(r => r.ok).length, wrong = total - correct;
    const p = total ? Math.round(correct / total * 100) : 0, stars = Stats.starsFor(correct, total);
    const head = p === 100 ? `${T('สมบูรณ์แบบ')}` : p >= 70 ? `${T('เก่งมาก')}` : p >= 30 ? `${T('สู้ต่อไป')}` : `${T('ลองอีกครั้งนะ')}`;
    const nextStage = s.kind === 'stage' && s.cfg.stage < stageCount(s.cfg.lvl) ? s.cfg.stage + 1 : null;
    let bestTag = '';
    if (best && best.first) bestTag = `<span class="newbest">${T('ผ่านด่านนี้ครั้งแรก')}</span>`;
    else if (best && best.improved) bestTag = `<span class="newbest">${T('สถิติใหม่ · เดิม')} ${best.prevPct}%</span>`;
    const avg = total ? (s.results.reduce((a, r) => a + r.ms, 0) / total / 1000).toFixed(1) : '0';
    const byId = id => BY_ID.get(id) || s.words.find(x => x.id === id);
    const words = s.results.map(r => {
      const w = byId(r.id); if (!w) return '';
      if (w._pk === 'g') return `<button class="wchip ${r.ok ? 'ok' : 'no'}" data-speak="${esc(w.id)}" title="${esc(w.ex_py || '')}${exMean(w) ? ' · ' + esc(exMean(w)) : ''}"><span class="hz">${esc(w.ex_zh || w.zh)}</span></button>`;
      return `<button class="wchip ${r.ok ? 'ok' : 'no'}" data-speak="${esc(w.id)}" title="${esc(w.py)} · ${esc(meaningText(w))}"><span class="hz">${esc(w.zh)}</span><small class="pyx">${esc(w.py)}</small></button>`;
    }).join('');
    const toMap = s.kind === 'stage' || String(s.back).startsWith('/level');
    $('#mgQuit use').setAttribute('href', '#i-x');
    const res = $('#mgResult');
    res.innerHTML = `<div class="panel" role="dialog" aria-label="${T('ผลการเล่น')}">
      <div class="res-stars">${[0, 1, 2].map(i => `<i class="${i < stars ? 'on' : ''}" style="--i:${i}"></i>`).join('')}</div>
      ${bestTag}
      <div class="res-title">${head}</div>
      <div class="res-sub">${esc(gameName(s.game))} · ${esc(s.title)}${s.bestCombo >= 3 ? ` · ${T('ต่อเนื่องสูงสุด')} ×${s.bestCombo}` : ''}</div>
      <div class="res-stats">
        <div><b style="color:var(--good)">${correct}</b><span>${L('ถูกครั้งแรก', 'first try')}</span></div>
        <div><b style="color:var(--bad)">${wrong}</b><span>${L('พลาด', 'missed')}</span></div>
        <div><b>${p}%</b><span>${T('แม่นยำ')}</span></div>
        <div><b>${fmtClock(s.dur)}</b><span>${avg} ${L('วิ/คำ', 's/word')}</span></div>
      </div>
      ${Gami.resultHTML(s.gain)}
      <div class="wchips">${words}</div>
      <div class="res-acts">
        ${nextStage ? `<button class="btn primary wide lg" data-r="next">${T('ด่านถัดไป')} (${nextStage})${ic('arrow-r')}</button>` : ''}
        ${wrong ? `<button class="btn ${nextStage ? '' : 'primary'}" data-r="wrong">${ic('repeat')}${T('ฝึกคำที่ผิด')} (${wrong})</button>` : ''}
        <button class="btn" data-r="again">${ic('retry')}${T('เล่นอีกครั้ง')}</button>
        <button class="btn" data-r="back">${toMap ? `${T('กลับแผนที่ด่าน')}` : `${T('กลับ')}`}</button>
        <button class="btn ghost" data-r="home">${T('หน้าแรก')}</button>
      </div></div>`;
    res.hidden = false; Fx.settle(res); Gami.celebrate(s.gain, 1500);
    for (let i = 0; i < stars; i++) setTimeout(() => { if (this.alive(s)) sfx('star', i); }, 380 + i * 220);
    setTimeout(() => { if (!this.alive(s)) return; if (stars === 3) { sfx('complete'); Fx.confetti(); buzz([18, 40, 18, 40, 30]); } else if (stars === 0) sfx('fail'); }, 380 + stars * 220 + 80);
    res.onclick = e => {
      const sp = e.target.closest('[data-speak]'); if (sp) { const w = byId(sp.dataset.speak); if (w) { if (w._pk === 'g' && w.ex_zh) TTS.speak(w.ex_zh); else speakWord(w); } return; }
      const b = e.target.closest('[data-r]'); if (!b) return;
      const r = b.dataset.r, cfg = s.cfg;
      if (r === 'wrong') this.start({ ...cfg, words: s.results.filter(x => !x.ok).map(x => byId(x.id)).filter(Boolean), base: cfg.base || s.title, title: `${T('ฝึกคำที่ผิด')} · ` + (cfg.base || s.title), kind: 'retry', lvl: undefined, stage: undefined });
      else if (r === 'again') this.start(cfg);
      else if (r === 'next') { this.teardown(); this.s = null; Level.play(cfg.lvl, nextStage, s.game); }
      else if (r === 'back') this.leave(s.back);
      else if (r === 'home') this.leave('/home');
    };
  }
};

/* a choice button with a hidden pinyin line that appears once answered */
const optHTML = (x, i, { hz = false } = {}) => `<button class="choice" data-o="${i}"><kbd>${i + 1}</kbd>${hz
  ? `<span class="hz">${esc(x.zh)}</span><small class="pyx o-py">${esc(x.py)}</small>`
  : `<span>${esc(meaningText(x))}</span>${S().showTh && x.th && S().showEn && x.en ? `<small>${esc(x.en)}</small>` : ''}`}</button>`;
const exMean = w => w._tr || (S().showTh && w.ex_th ? w.ex_th : (w.ex_en || w.ex_th || ''));

/* =====================================================================
   effects shared by the games: particles, floating text, shakes, flashes, a big seal
   ===================================================================== */
const GX = {
  at(el, host) { const a = el.getBoundingClientRect(), b = host.getBoundingClientRect(); return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2]; },
  burst(host, x, y, { n = 16, color = '#e6b54e', dist = 64, size = 7 } = {}) {
    if (reducedMotion()) return;
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i'); d.className = 'gx-pt';
      d.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color}`; host.appendChild(d);
      const a = Math.random() * Math.PI * 2, r = dist * (.45 + Math.random() * .7);
      d.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r}px)) scale(.15)`, opacity: 0 }], { duration: 550 + Math.random() * 350, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }).onfinish = () => d.remove();
    }
  },
  text(host, x, y, text, cls = '') {
    const d = document.createElement('b'); d.className = 'gx-ft ' + cls; d.textContent = text; d.style.left = x + 'px'; d.style.top = y + 'px'; host.appendChild(d);
    d.animate([{ transform: 'translate(-50%,0) scale(.5)', opacity: 0 }, { transform: 'translate(-50%,-14px) scale(1.2)', opacity: 1, offset: .22 }, { transform: 'translate(-50%,-50px) scale(1)', opacity: 0 }], { duration: 1150, easing: 'ease-out', fill: 'forwards' }).onfinish = () => d.remove();
  },
  shake(el, m = 8, ms = 420) { if (el && el.animate) el.animate([0, -m, m * .8, -m * .6, m * .4, 0].map(x => ({ translate: `${x}px 0` })), { duration: ms }); },
  quake(el, m = 6) { if (!reducedMotion() && el && el.animate) el.animate([[-m, m / 2], [m, -m / 2], [-m * .7, -m / 2], [m * .5, m / 2], [0, 0]].map(([x, y]) => ({ translate: `${x}px ${y}px` })), { duration: 360 }); },
  pop(el, s = 1.18, ms = 340) { if (el && el.animate) el.animate([{ scale: 1 }, { scale: s }, { scale: 1 }], { duration: ms, easing: 'ease-out' }); },
  flash(host, color = 'rgba(255,255,255,.5)', ms = 260) { const f = document.createElement('div'); f.className = 'gx-flash'; f.style.background = color; host.appendChild(f); f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'forwards' }).onfinish = () => f.remove(); },
  ripple(host, x, y, { n = 3, color = 'rgba(255,255,255,.6)', w = 130 } = {}) {
    for (let k = 0; k < n; k++) { const r = document.createElement('i'); r.className = 'gx-ripple'; r.style.cssText = `left:${x}px;top:${y}px;border-color:${color}`; host.appendChild(r); r.animate([{ width: '20px', height: '8px', opacity: 1 }, { width: w + 'px', height: w * .3 + 'px', opacity: 0 }], { duration: 900, delay: k * 150, fill: 'forwards' }).onfinish = () => r.remove(); }
  },
  /** the big seal that ends a round (勝 / 敗 / 及第) */
  seal(host, text, color = 'var(--seal)') {
    const s = document.createElement('div'); s.className = 'gx-seal'; s.style.background = color; s.textContent = text; host.appendChild(s);
    s.animate([{ transform: 'translate(-50%,-50%) rotate(-24deg) scale(2.6)', opacity: 0 }, { transform: 'translate(-50%,-50%) rotate(-8deg) scale(.92)', opacity: 1, offset: .55 }, { transform: 'translate(-50%,-50%) rotate(-8deg) scale(1)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.3,0,.3,1)', fill: 'forwards' });
    this.quake(host, 5); return s;
  },
  /** FLIP: make `el` (already in its new place) appear to travel there from `from` (a rect) */
  fly(el, from, { ms = 380, easing = 'cubic-bezier(.3,1.35,.5,1)' } = {}) {
    const to = el.getBoundingClientRect(), dx = from.left + from.width / 2 - (to.left + to.width / 2), dy = from.top + from.height / 2 - (to.top + to.height / 2);
    return el.animate([{ translate: `${dx}px ${dy}px`, scale: .9 }, { translate: '0 0', scale: 1 }], { duration: ms, easing });
  },
  /** Hit-Stop + Shockwave Ring: 48ms high-contrast impact freeze followed by an expanding golden/crimson shockwave ring */
  hitStop(host, x, y, { color = '#ffd27a', ms = 48 } = {}) {
    if (reducedMotion() || !host) return;
    host.classList.add('gx-hitstop');
    setTimeout(() => host.classList.remove('gx-hitstop'), ms);
    const ring = document.createElement('i');
    ring.className = 'gx-shock';
    ring.style.cssText = `left:${x}px;top:${y}px;border-color:${color};box-shadow:0 0 18px ${color}`;
    host.appendChild(ring);
    ring.animate([
      { width: '12px', height: '12px', opacity: 1, borderWidth: '4px' },
      { width: '160px', height: '160px', opacity: 0, borderWidth: '1px' }
    ], { duration: 420, easing: 'cubic-bezier(.16,.84,.3,1)', fill: 'forwards' }).onfinish = () => ring.remove();
  },
  /** Rising brush-fire embers for Combo Aura (tier 1..3) */
  embers(host, tier = 1) {
    if (reducedMotion() || !host) return;
    const count = tier * 5, colors = ['#ffd27a', '#ff922b', '#ff4d3b'];
    for (let i = 0; i < count; i++) {
      const e = document.createElement('i');
      e.className = 'gx-ember';
      const lx = 6 + Math.random() * 88, sz = 5 + Math.random() * (tier * 3);
      e.style.cssText = `left:${lx}%;bottom:4px;width:${sz}px;height:${sz}px;background:${colors[i % colors.length]}`;
      host.appendChild(e);
      const dx = (Math.random() - .5) * 44, dy = -(65 + Math.random() * 95);
      e.animate([
        { transform: 'translate(0,0) scale(1)', opacity: .95 },
        { transform: `translate(${dx}px,${dy}px) scale(.15)`, opacity: 0 }
      ], { duration: 680 + Math.random() * 420, easing: 'ease-out', fill: 'forwards' }).onfinish = () => e.remove();
    }
  }
};
const isHan = c => /[㐀-鿿]/.test(c);
const chunkRounds = (list, per) => { const out = []; for (let i = 0; i < list.length; i += per) out.push(list.slice(i, i + per)); if (out.length > 1 && out[out.length - 1].length < 2) { const t = out.pop(); out[out.length - 1].push(...t); } return out; };

/* =====================================================================
   the games
   ===================================================================== */
const MG = {

  /* ---------- ดวลบัณฑิต: throw the right card at the boss before its timer runs out ---------- */
  duel: {
    mount(s, el) {
      const n = s.words.length, lvl = +s.cfg.lvl || 1, bosses = ['妖', '鬼', '虎', '龍', '王', '魔'];
      s.d = { i: -1, hp: Math.max(10, Math.round(n * .7) * 10), max: Math.max(10, Math.round(n * .7) * 10), lives: 3, face: bosses[(lvl - 1) % bosses.length], down: false, lock: true, left: 0, dur: 9000, last: 0 };
      el.innerHTML = `<div class="m-table du-field" id="duF">
          <div class="du-lives" id="duLives">${'<i class="du-life">我</i>'.repeat(3)}</div>
          <div class="du-boss" id="duBoss"><svg class="du-ring" viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="54"/><circle class="hp" cx="60" cy="60" r="54"/></svg><div class="du-face">${s.d.face}</div></div>
          <div class="du-timer"><i id="duTime"></i></div>
          <div class="du-q" id="duQ"></div>
        </div>
        <div class="m-panel du-panel"><div class="du-hand" id="duHand"></div></div>`;
      el.onclick = e => {
        if (e.target.closest('[data-a="say"]')) { speakWord(s.words[s.d.i]); return; }
        const c = e.target.closest('.du-card'); if (c) this.play(s, +c.dataset.i);
      };
      this.ring(s);
      s.d.last = performance.now();
      const loop = now => { if (!Mini.alive(s) || s.finished) return; s.raf = requestAnimationFrame(loop); this.tick(s, now); };
      s.raf = requestAnimationFrame(loop);
      Mini.later(() => this.next(s), 400);
    },
    stop(s) { cancelAnimationFrame(s.raf); },
    resume(s) { s.d.last = performance.now(); },
    ring(s) { const c = $('#duBoss .hp'); if (c) c.style.strokeDashoffset = String(339.3 * (1 - Math.max(0, s.d.hp) / s.d.max)); },
    tick(s, now) {
      const d = s.d, dt = clamp(now - d.last, 0, 80); d.last = now;
      if (s.paused || d.lock || document.hidden) return;
      d.left -= dt; const bar = $('#duTime'); if (bar) { bar.style.transform = `scaleX(${Math.max(0, d.left / d.dur)})`; bar.classList.toggle('low', d.left < 2500); }
      if (d.left <= 0) this.play(s, -1);           // too slow: the boss strikes first
    },
    next(s) {
      const d = s.d; d.i++;
      if (d.i >= s.words.length || d.lives <= 0) { this.end(s); return; }
      const w = s.words[d.i], kinds = TTS.ok ? ['mean', 'listen', 'mean', 'py'] : ['mean', 'py', 'mean'], kind = kinds[d.i % kinds.length];
      d.cards = shuffle([w, ...distractors(w, 3, { sound: kind !== 'mean' })]); d.t = performance.now();
      d.dur = Math.max(5500, 9500 - Math.min(3000, s.combo * 450)); d.left = d.dur;
      $('#duQ').innerHTML = kind === 'mean' ? `${L('ทิ้งไพ่ที่แปลว่า', 'Throw the card meaning')} <b>${esc(meaningText(w))}</b>`
        : kind === 'py' ? `${L('ทิ้งไพ่ที่อ่านว่า', 'Throw the card read')} <b class="pyx">${esc(w.py)}</b>`
        : `<button class="ibtn sm" data-a="say" aria-label="${T('ฟังอีกครั้ง')}">${ic('vol')}</button> ${L('ฟังแล้วทิ้งไพ่ให้ตรง', 'Listen, then throw the right card')}`;
      if (kind === 'listen') setTimeout(() => { if (Mini.alive(s) && d.i === s.words.indexOf(w)) speakWord(w); }, 250);
      const n = d.cards.length;
      $('#duHand').innerHTML = d.cards.map((c, i) => `<button class="du-card${c._len >= 4 ? ' xl' : c._len === 3 ? ' long' : ''}" data-i="${i}" style="--r:${((i - (n - 1) / 2) * 9).toFixed(1)}deg;--y:${(Math.abs(i - (n - 1) / 2) * 7).toFixed(0)}px;--d:${i * 70}ms"><kbd>${i + 1}</kbd><span class="hz">${esc(c.zh)}</span></button>`).join('');
      sfx('swoosh'); d.lock = false;
    },
    async play(s, i) {
      const d = s.d; if (d.lock || s.paused) return; d.lock = true;
      const w = s.words[d.i], field = $('#duF'), boss = $('#duBoss'), cards = $$('#duHand .du-card'), ms = performance.now() - d.t;
      const card = i >= 0 ? cards[i] : null, ok = i >= 0 && d.cards[i] === w;
      if (ok) {
        card.classList.add('thrown');
        const [bx, by] = GX.at(boss, field), r = card.getBoundingClientRect(), f = field.getBoundingClientRect();
        const cx = r.left - f.left + r.width / 2, cy = r.top - f.top + r.height / 2;
        sfx('swoosh');
        await card.animate([{ translate: '0 0', rotate: '0deg', scale: 1 }, { translate: `${bx - cx}px ${by - cy}px`, rotate: '540deg', scale: .45 }], { duration: 420, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' }).finished.catch(() => { });
        if (!Mini.alive(s)) return;
        card.style.visibility = 'hidden';
        const crit = s.combo >= 2, dmg = crit ? 15 : 10;
        Mini.mark(w, true, ms, boss);
        GX.burst(field, bx, by, { n: crit ? 34 : 20, dist: crit ? 120 : 80, color: crit ? '#fff1b8' : '#c9a7ff' }); GX.flash(field, crit ? 'rgba(255,240,200,.55)' : 'rgba(255,255,255,.35)');
        GX.shake(boss, crit ? 14 : 9); if (crit) GX.quake(field, 7);
        GX.text(field, bx, by - 54, crit ? `會心 -${dmg}` : `-${dmg}`, crit ? 'big' : '');
        if (!d.down) { d.hp -= dmg; this.ring(s); if (d.hp <= 0) this.defeat(s); }
      } else {
        if (card) { card.classList.add('burnt'); const host = $('#mgStage'); GX.burst(host, ...GX.at(card, host), { n: 14, color: '#555', dist: 46 }); }
        const good = cards[d.cards.indexOf(w)]; if (good) good.classList.add('was');
        boss.animate([{ scale: 1, translate: '0 0' }, { scale: 1.35, translate: '0 40px', offset: .4 }, { scale: 1, translate: '0 0' }], { duration: 520, easing: 'cubic-bezier(.5,0,.3,1)' });
        Mini.mark(w, false, ms, good || boss);
        setTimeout(() => { if (!Mini.alive(s)) return; GX.flash(field, 'rgba(220,50,30,.38)', 380); GX.quake(field, 6); d.lives--; const lv = $$('#duLives .du-life')[d.lives]; if (lv) { lv.classList.add('lost'); GX.burst(field, ...GX.at(lv, field), { color: '#c23b22', n: 12, dist: 40 }); } }, 230);
        if (i < 0) GX.text(field, field.clientWidth / 2, 120, L('ช้าไป!', 'Too slow!'), 'bad');
      }
      Mini.later(() => this.next(s), ok ? 650 : 1300);
    },
    defeat(s) {
      const d = s.d, field = $('#duF'), boss = $('#duBoss'); d.down = true;
      boss.classList.add('down'); GX.burst(field, ...GX.at(boss, field), { n: 44, dist: 150, color: '#c9a7ff' }); GX.flash(field, 'rgba(255,240,200,.6)', 400);
      GX.text(field, field.clientWidth / 2, 70, L('ปราบบอสแล้ว! เก็บคำที่เหลือ', 'Boss down! Clear the rest'), 'big'); sfx('complete');
    },
    end(s) {
      const d = s.d, field = $('#duF'); d.lock = true; $('#duHand').innerHTML = ''; $('#duQ').textContent = '';
      const win = d.down;
      GX.seal(field, win ? '勝' : '敗', win ? 'var(--seal)' : '#55606e'); if (!win) sfx('fail');
      Mini.later(() => Mini.finish(), 1300);
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 4) { e.preventDefault(); this.play(s, n - 1); } else if (e.key === 'r' || e.key === 'R') speakWord(s.words[s.d.i]); }
  },

  /* ---------- ต่อคำลูกโซ่ (โดมิโน): the domino you lay must start with the character the last one ends with ---------- */
  chain: {
    ok: w => Array.from(w.zh).some(isHan),
    mount(s, el) {
      s.c = { used: new Set(), deck: new Set(s.words.map(w => w.zh)), step: 0, cur: null, lock: true, maxLvl: Math.max(...s.words.map(w => +w.lvl || 6)) };
      el.innerHTML = `<div class="m-table felt dm-table" id="dmT"><div class="dm-need" id="dmNeed"></div><div class="dm-line" id="dmLine"></div><div class="dm-info" id="dmInfo"></div></div>
        <div class="m-panel"><div class="m-hint">${L('เลือกโดมิโนที่ต่อได้', 'Pick the domino that fits')}</div><div class="dm-cands" id="dmCands"></div></div>`;
      el.onclick = e => { const b = e.target.closest('.dm-cand'); if (b) this.pick(s, +b.dataset.i); };
      this.restart(s, true);
    },
    nexts(s, w) {
      const last = Array.from(w.zh).filter(isHan).pop(); if (!last) return [];
      const c = s.c, all = WORDS.filter(x => !x.custom && x.zh !== w.zh && x.zh[0] === last && !c.used.has(x.zh) && x._len >= 2);
      return all.sort((a, b) => (c.deck.has(b.zh) - c.deck.has(a.zh)) || ((+a.lvl <= c.maxLvl ? 0 : 1) - (+b.lvl <= c.maxLvl ? 0 : 1)) || (+a.lvl - +b.lvl) || Math.random() - .5);
    },
    /** a domino: first character | the rest (a one-character word shows a blank pip on the left) */
    dom(w, cls = '') {
      const a = Array.from(w.zh), left = a.length > 1 ? a[0] : '', right = a.length > 1 ? a.slice(1).join('') : a[0];
      return `<span class="dm2 ${cls}"><span class="hz l">${left ? esc(left) : '<i class="pip"></i>'}</span><i class="mid"></i><span class="hz r ${right.length > 2 ? 'xs' : right.length > 1 ? 'sm' : ''}">${esc(right)}</span></span>`;
    },
    lay(s, w, from) {
      const line = $('#dmLine'); line.insertAdjacentHTML('beforeend', this.dom(w, 'laid'));
      const d = line.lastElementChild; line.scrollTo({ left: line.scrollWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
      if (from) GX.fly(d, from, { ms: 460, easing: 'cubic-bezier(.3,1.3,.5,1)' }); else d.animate([{ transform: 'translateY(-60px) rotate(-20deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.3,1.3,.5,1)' });
      return d;
    },
    async topple(s) {
      const ds = $$('#dmLine .dm2'); sfx('swoosh');
      ds.forEach((d, i) => d.animate([{ transform: 'none' }, { transform: 'rotate(80deg) translateY(12px)', opacity: .35 }], { duration: 260, delay: i * 90, easing: 'ease-in', fill: 'forwards' }));
      await new Promise(r => setTimeout(r, 260 + ds.length * 90));
    },
    async restart(s, first) {
      const c = s.c; c.lock = true;
      if (!first) { GX.text($('#dmT'), $('#dmT').clientWidth / 2, 70, L('สายขาด เริ่มสายใหม่', 'Dead end — new chain'), 'bad'); await this.topple(s); if (!Mini.alive(s)) return; $('#dmLine').innerHTML = ''; }
      const start = shuffle(s.words).find(w => !c.used.has(w.zh) && this.nexts(s, w).length) || shuffle(WORDS).find(w => !c.used.has(w.zh) && w._len >= 2 && this.nexts(s, w).length);
      c.used.add(start.zh); c.cur = start; this.lay(s, start); this.showCur(s);
      Mini.later(() => this.step(s), first ? 350 : 700);
    },
    showCur(s) {
      const w = s.c.cur, last = Array.from(w.zh).filter(isHan).pop();
      $$('#dmLine .r').forEach(x => x.classList.remove('lit'));
      const ds = $$('#dmLine .dm2'); const lastD = ds[ds.length - 1]; if (lastD) lastD.querySelector('.r').classList.add('lit');
      $('#dmInfo').innerHTML = `<span class="hz">${esc(w.zh)}</span> <span class="pyx">${esc(w.py)}</span> · ${esc(meaningText(w))}`;
      $('#dmNeed').innerHTML = `${L('ต่อด้วยคำที่ขึ้นต้นด้วย', 'Next word starts with')} <span class="hz">${esc(last)}</span>`;
    },
    step(s) {
      const c = s.c; if (c.step >= s.words.length) { this.end(s); return; }
      const opts = this.nexts(s, c.cur); if (!opts.length) { this.restart(s); return; }
      const target = opts[0], last = target.zh[0];
      const trap = shuffle(WORDS.filter(x => !x.custom && x.zh !== target.zh && x.zh[0] !== last && x.zh.includes(last) && !c.used.has(x.zh) && x._len >= 2))[0];
      const decoys = [trap, ...distractors(target, 4).filter(x => x.zh[0] !== last && x !== trap)].filter(Boolean).slice(0, 2);
      c.target = target; c.t = performance.now(); c.cands = shuffle([target, ...decoys]);
      $('#dmCands').innerHTML = c.cands.map((w, i) => `<button class="dm-cand" data-i="${i}" style="--d:${i * 70}ms"><kbd>${i + 1}</kbd>${this.dom(w)}</button>`).join('');
      c.lock = false;
    },
    async pick(s, i) {
      const c = s.c; if (c.lock || s.paused || !c.cands[i]) return; c.lock = true;
      const btns = $$('#dmCands .dm-cand'), ok = c.cands[i] === c.target, good = btns[c.cands.indexOf(c.target)], ms = performance.now() - c.t;
      if (!ok) {
        const bad = btns[i]; bad.classList.add('bad'); GX.shake(bad, 8); good.classList.add('hint');
        Mini.mark(c.target, false, ms, good);
        bad.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(40px) rotate(25deg)', opacity: 0 }], { duration: 520, delay: 300, easing: 'ease-in', fill: 'forwards' });
        await new Promise(r => Mini.later(r, 950)); if (!Mini.alive(s)) return;
      }
      const from = good.querySelector('.dm2').getBoundingClientRect();
      good.style.visibility = 'hidden'; sfx('tap');
      const d = this.lay(s, c.target, from), host = $('#mgStage'), prev = d.previousElementSibling;
      setTimeout(() => {
        if (!Mini.alive(s)) return;
        if (prev && prev.animate) prev.animate([{ transform: 'none' }, { transform: 'translateX(-6px) rotate(-2deg)', offset: .35 }, { transform: 'none' }], { duration: 240, easing: 'ease-out' });
        GX.burst(host, ...GX.at(d.querySelector('.l'), host), { n: ok ? 16 : 6, dist: 48, color: ok ? '#e6b54e' : '#aaa' }); d.querySelector('.l').classList.add('lit'); GX.pop(d, 1.12);
      }, 430);
      if (ok) Mini.mark(c.target, true, ms, d);
      c.cur = c.target; c.used.add(c.target.zh); c.step++;
      setTimeout(() => { if (Mini.alive(s)) this.showCur(s); }, 460);
      $$('#dmCands .dm-cand').forEach(b => { if (b !== good) b.style.opacity = 0; });
      Mini.later(() => this.step(s), 760);
    },
    async end(s) { await this.topple(s); if (Mini.alive(s)) Mini.later(() => Mini.finish(), 300); },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 3) { e.preventDefault(); this.pick(s, n - 1); } }
  },


  /* ---------- หลอมอักษร: tap characters into the ink-stone, in order, to forge the words on the recipe ---------- */
  merge: {
    ok: w => { const a = Array.from(w.zh); return a.length >= 2 && a.length <= 4 && a.every(isHan); },
    none: L('คำชุดนี้เป็นคำตัวเดียวเกือบทั้งหมด หลอมไม่ได้ ลองเกมอื่นนะ', 'These are nearly all one-character words, so there is nothing to forge'),
    mount(s, el) {
      s.f = { rounds: chunkRounds(s.words, 3), r: -1, built: [], held: [], clock: 0, last: performance.now(), lock: false };
      el.innerHTML = `<div class="m-table fu-field" id="fuF"><button class="fu-pot" id="fuPot" aria-label="${L('เทออก', 'Empty')}"><span class="fu-slots" id="fuSlots"></span></button><div class="fu-born" id="fuBorn"><b class="hz"></b><small></small></div></div>
        <div class="m-panel"><div class="m-hint">${L('สูตรที่ต้องหลอม', 'Recipes to forge')}</div><div class="fu-recipes" id="fuR"></div>
          <div class="m-hint">${L('แตะหรือลากตัวอักษรเข้าแท่นหมึกให้ครบคำ (ลำดับไม่สำคัญ) · แตะตัวในแท่นเพื่อเอาออก · แตะแท่นหมึกเพื่อเทออก', 'Tap or drag characters into the ink-stone to complete a word (any order) · tap one inside to take it out · tap the ink-stone to empty it')}</div></div>`;
      el.onclick = e => { if (e.target.closest('.fu-orb')) return; if (e.target.closest('#fuPot')) { if (s.f.ready) this.advance(s); else this.empty(s, true); } };
      el.onpointerdown = e => this.grab(s, e);
      const loop = now => { if (!Mini.alive(s) || s.finished) return; s.raf = requestAnimationFrame(loop); this.spin(s, now); };
      s.raf = requestAnimationFrame(loop);
      this.next(s);
    },
    stop(s) { cancelAnimationFrame(s.raf); if (s.f) clearTimeout(s.f.adv); },
    resume(s) { s.f.last = performance.now(); },
    next(s) {
      const f = s.f; clearTimeout(f.adv); f.ready = false; f.lock = false;
      const pot = $('#fuPot'); if (pot) pot.classList.remove('ready');
      f.r++;
      if (f.r >= f.rounds.length) { Mini.finish(); return; }
      f.targets = f.rounds[f.r].slice(); f.done = new Set(); f.err = false; f.t = performance.now();
      const need = f.targets.flatMap(w => Array.from(w.zh)), have = new Set(need);
      const extra = shuffle(distractors(f.targets[0], 6).flatMap(w => Array.from(w.zh)).filter(c => isHan(c) && !have.has(c))).slice(0, clamp(10 - need.length, 1, 3));      // a few decoys, never a crowd
      $$('#fuF .fu-orb').forEach(o => o.remove());
      f.orbs = shuffle(need.concat(extra)).map((ch, i) => { const o = document.createElement('button'); o.className = 'fu-orb hz'; o.textContent = ch; o.ch = ch; $('#fuF').appendChild(o); o.animate([{ scale: 0, opacity: 0 }, { scale: 1, opacity: 1 }], { duration: 360, delay: i * 50, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' }); return o; });
      this.recipes(s); this.empty(s);
    },
    recipes(s) {
      const f = s.f;
      $('#fuR').innerHTML = f.targets.map(w => f.done.has(w.id) ? `<span class="fu-rc done" data-wid="${esc(w.id)}"><b class="hz">${esc(w.zh)}</b><em class="pyx">${esc(w.py || '')}</em>${esc(meaningText(w))}</span>` : `<span class="fu-rc" data-wid="${esc(w.id)}">${'<i>?</i>'.repeat(w._len)} ${esc(meaningText(w))}</span>`).join('');
    },
    pos(o, x, y) { o.x = x; o.y = y; o.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%)`; },
    spin(s, now) {
      const f = s.f, F = $('#fuF'); if (!F) return;
      const dt = clamp(now - f.last, 0, 80); f.last = now; if (!s.paused) f.clock += dt;
      const W = F.clientWidth, H = F.clientHeight, n = f.orbs.length;
      f.orbs.forEach((o, i) => {
        if (o.held || o.gone || o.drag) return;
        const a = f.clock / 1000 * .42 + i / n * Math.PI * 2;
        this.pos(o, W / 2 + Math.cos(a) * W * .38, H / 2 + Math.sin(a) * H * .38);
      });
    },
    /* pointer: a short press = tap, moving past a few px = drag; drop it on the ink-stone to add it */
    grab(s, e) {
      const f = s.f, o = e.target.closest('.fu-orb');
      if (!o || o.gone || f.lock || s.paused || (e.button != null && e.button > 0)) return;
      e.preventDefault();
      const F = $('#fuF'), pot = $('#fuPot'), d = { x0: e.clientX, y0: e.clientY, moved: false };
      try { o.setPointerCapture(e.pointerId); } catch (_) {}
      const overPot = ev => { const r = pot.getBoundingClientRect(); return Math.hypot(ev.clientX - (r.left + r.width / 2), ev.clientY - (r.top + r.height / 2)) < r.width * .66; };
      const move = ev => {
        if (ev.pointerId !== e.pointerId) return;
        if (!d.moved) { if (o.held || Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) < 8) return; d.moved = true; o.drag = true; o.classList.add('drag'); }
        const r = F.getBoundingClientRect(), cx = r.width / 2, cy = r.height / 2, pr = pot.offsetWidth * .92;
        let x = clamp(ev.clientX - r.left, 0, r.width), y = clamp(ev.clientY - r.top, 0, r.height);
        const dist = Math.hypot(cx - x, cy - y);
        if (dist < pr) { const pull = Math.pow(1 - dist / pr, 1.35) * .38; x += (cx - x) * pull; y += (cy - y) * pull; }
        this.pos(o, x, y);
        pot.classList.toggle('near', overPot(ev));
      };
      const up = ev => {
        if (ev.pointerId !== e.pointerId) return;
        o.removeEventListener('pointermove', move); o.removeEventListener('pointerup', up); o.removeEventListener('pointercancel', up);
        pot.classList.remove('near');
        if (!Mini.alive(s) || o.gone) return;
        if (!d.moved) { if (o.held) this.drop(s, o); else this.take(s, o); return; }
        o.drag = false; o.classList.remove('drag');
        if (ev.type === 'pointerup' && overPot(ev) && !f.lock && !s.paused) { this.take(s, o); return; }
        o.classList.add('back'); setTimeout(() => o.classList.remove('back'), 320);      // glide back into orbit
      };
      o.addEventListener('pointermove', move); o.addEventListener('pointerup', up); o.addEventListener('pointercancel', up);
    },
    layout(s) {      // rows of up to 4, centred in the stone
      const f = s.f, F = $('#fuF'), n = f.built.length, rows = Math.ceil(n / 4);
      f.built.forEach((o, k) => {
        const row = Math.floor(k / 4), inRow = Math.min(4, n - row * 4), col = k % 4, step = o.offsetWidth * .72;
        this.pos(o, F.clientWidth / 2 + (col - (inRow - 1) / 2) * step, F.clientHeight / 2 + (row - (rows - 1) / 2) * o.offsetHeight * .85);
      });
    },
    drop(s, o) {      // tap a character already in the ink-stone to send it back out
      const f = s.f; if (f.lock || s.paused) return;
      f.built = f.built.filter(x => x !== o); o.held = false; o.classList.remove('in'); sfx('pop'); this.layout(s);
    },
    take(s, o) {
      const f = s.f; if (f.lock || s.paused || o.held || o.gone) return;
      o.held = true; f.built.push(o); sfx('pop');
      o.classList.add('in'); this.layout(s);
      // order doesn't matter: the characters in the stone just have to be part of (or all of) some unfinished word
      const chars = f.built.map(x => x.ch);
      const within = w => { const left = Array.from(w.zh); return chars.every(c => { const i = left.indexOf(c); if (i < 0) return false; left.splice(i, 1); return true; }); };
      const fits = f.targets.filter(w => !f.done.has(w.id) && within(w));
      if (!fits.length) { f.lock = true; setTimeout(() => this.smoke(s), 280); return; }
      const hit = fits.find(w => Array.from(w.zh).length === chars.length); if (hit) { f.lock = true; setTimeout(() => this.forge(s, hit, f.built.slice()), 300); }
    },
    smoke(s) {      // a puff of smoke and the stone empties - no red "wrong" label
      const f = s.f, F = $('#fuF'), [x, y] = [F.clientWidth / 2, F.clientHeight / 2];
      for (let k = 0; k < 9; k++) { const p = document.createElement('i'); p.className = 'gx-pt'; p.style.cssText = `left:${x}px;top:${y}px;width:22px;height:22px;background:rgba(190,190,200,.45)`; F.appendChild(p); p.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: .9 }, { transform: `translate(calc(-50% + ${Math.random() * 80 - 40}px), calc(-50% - ${50 + Math.random() * 60}px)) scale(2.2)`, opacity: 0 }], { duration: 900, fill: 'forwards' }).onfinish = () => p.remove(); }
      GX.shake($('#fuPot'), 7); f.err = true; Mini.slip();
      setTimeout(() => { if (!Mini.alive(s)) return; this.empty(s); f.lock = false; }, 420);
    },
    forge(s, w, use) {
      const f = s.f, F = $('#fuF'), pot = $('#fuPot'), born = $('#fuBorn'), [x, y] = [F.clientWidth / 2, F.clientHeight / 2];
      use.forEach(o => { o.gone = true; o.classList.remove('in'); o.animate([{ scale: 1, opacity: 1 }, { scale: .2, opacity: 0 }], { duration: 260, fill: 'forwards' }); });
      f.built = f.built.filter(o => !use.includes(o)); this.layout(s);
      pot.classList.add('hot'); GX.flash(F, 'rgba(255,230,160,.4)'); GX.burst(F, x, y, { n: 30, dist: 120 });
      born.querySelector('b').textContent = w.zh; born.querySelector('small').textContent = `${w.py} · ${meaningText(w)}`;
      born.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-115%) scale(1.15)', opacity: 1, offset: .45 }, { transform: 'translate(-50%,-125%) scale(1)', opacity: 1, offset: .8 }, { transform: 'translate(-50%,-140%) scale(1)', opacity: 0 }], { duration: 1500, easing: 'cubic-bezier(.3,1.2,.5,1)' });
      if (S().autoSpeak) speakWord(w);
      Mini.mark(w, !f.err, performance.now() - f.t, pot); f.err = false; f.t = performance.now(); f.done.add(w.id); this.recipes(s);
      const rc = $(`#fuR .fu-rc[data-wid="${CSS.escape ? CSS.escape(w.id) : w.id}"]`);
      if (rc && rc.animate && !reducedMotion()) {
        const a = pot.getBoundingClientRect(), b = rc.getBoundingClientRect(), sp = document.createElement('i');
        sp.className = 'gx-pt'; sp.style.cssText = 'position:fixed;left:0;top:0;width:16px;height:16px;background:radial-gradient(circle,#fff,#e6b54e 70%);box-shadow:0 0 18px 4px rgba(230,181,78,.85);z-index:80';
        document.body.appendChild(sp);
        const ax = a.left + a.width / 2, ay = a.top + a.height / 2, bx = b.left + b.width / 2, by = b.top + b.height / 2;
        sp.animate([{ transform: `translate3d(${ax}px,${ay}px,0) translate(-50%,-50%) scale(1.2)`, opacity: 1 }, { transform: `translate3d(${(ax + bx) / 2}px,${Math.min(ay, by) - 44}px,0) translate(-50%,-50%) scale(1.5)`, opacity: 1, offset: .5 }, { transform: `translate3d(${bx}px,${by}px,0) translate(-50%,-50%) scale(.4)`, opacity: 0 }], { duration: 480, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = () => { sp.remove(); GX.pop(rc, 1.14); };
      }
      setTimeout(() => { if (!Mini.alive(s)) return; pot.classList.remove('hot'); if (f.done.size >= f.targets.length) this.ready(s); else f.lock = false; }, 900);
    },
    /* all words forged: the stone turns white and glows; tap it to move on, or it moves on by itself after 8 s */
    ready(s) {
      const f = s.f, pot = $('#fuPot'); f.ready = true; f.lock = true;
      f.built.forEach(o => { o.held = false; o.classList.remove('in'); }); f.built = [];      // leftover decoys float back out
      pot.classList.add('ready'); pot.setAttribute('aria-label', L('ไปต่อ', 'Next'));
      const wait = ms => { f.adv = Mini.later(() => { if (s.paused) wait(500); else this.advance(s); }, ms); };
      wait(8000);
    },
    advance(s) {
      const f = s.f; if (!f.ready) return;
      f.ready = false; clearTimeout(f.adv);
      const pot = $('#fuPot'); pot.classList.remove('ready'); pot.setAttribute('aria-label', L('เทออก', 'Empty'));
      f.lock = false; this.next(s);
    },
    empty(s, tapped) {
      const f = s.f; if (tapped && f.lock) return;
      f.built.forEach(o => { o.held = false; o.classList.remove('in'); }); f.built = [];
    }
  },

  /* ---------- ไพ่ความจำ (หน้าต่างลายจีน): open two windows at a time; a 字 and its meaning are a pair ---------- */
  match: {
    mount(s, el) {
      const small = innerWidth < 560 || innerHeight < 560;
      s.m = { rounds: chunkRounds(s.words, small ? 3 : 6), r: -1 };
      el.innerHTML = `<div class="m-table wood mw-table"><div class="mw-grid" id="mwGrid"></div></div>
        <div class="m-panel"><div class="m-hint" id="mwHint"></div><div class="mw-found" id="mwFound"></div></div>`;
      el.onclick = e => { const c = e.target.closest('.mw'); if (c) this.flip(s, c); };
      this.next(s);
    },
    next(s) {
      const m = s.m; m.r++;
      if (m.r >= m.rounds.length) { Mini.finish(); return; }
      const ws = m.rounds[m.r];
      Object.assign(m, { cards: shuffle(ws.flatMap(w => [{ w, k: 'zh' }, { w, k: 'm' }])), open: [], seen: new Set(), missed: new Set(), left: ws.length, lock: false, t: performance.now() });
      const n = m.cards.length, land = innerWidth > innerHeight, cols = n <= 6 ? 3 : (land ? 4 : (innerWidth < 560 ? 3 : 4)), g = $('#mwGrid');
      g.style.setProperty('--cols', cols); g.style.setProperty('--rows', Math.ceil(n / cols));
      g.innerHTML = m.cards.map((c, i) => `<button class="mw" data-i="${i}" style="--d:${i * 45}ms"><span class="mw-in ${c.k}${c.k === 'zh' && c.w._len >= 3 ? ' l' + Math.min(4, c.w._len) : ''}">${c.k === 'zh' ? `<b class="hz">${esc(c.w.zh)}</b>` : `<b>${esc(meaningText(c.w))}</b>`}</span><i class="sh l"></i><i class="sh r"></i></button>`).join('');
      $('#mwFound').innerHTML = ''; this.hint(s); sfx('gather', 0);
    },
    hint(s) { $('#mwHint').textContent = L(`เปิดหน้าต่างทีละสองบาน · เหลือ ${s.m.left} คู่`, `Open two windows at a time · ${s.m.left} pairs left`); },
    partner(m, i) { return m.cards.findIndex((c, j) => j !== i && c.k !== m.cards[i].k && c.w === m.cards[i].w); },
    flip(s, el) {
      const m = s.m, i = +el.dataset.i, c = m.cards[i];
      if (s.paused || m.lock || el.classList.contains('open') || el.classList.contains('got')) return;
      el.classList.add('open'); sfx('flip'); if (c.k === 'zh' && S().autoSpeak) speakWord(c.w);
      m.open.push(i); if (m.open.length < 2) return;
      const [a, b] = m.open; m.open = []; m.lock = true;
      const A = m.cards[a], B = m.cards[b], els = $$('#mwGrid .mw'), zt = A.k === 'zh' ? A : B, mt = A.k === 'zh' ? B : A;
      const pair = A.k !== B.k && (zt.w === mt.w || meaningText(zt.w) === meaningText(mt.w));
      if (pair) {
        if (zt.w !== mt.w) { const other = mt.w, twin = m.cards.find(x => x.k === 'm' && x !== mt && x.w === zt.w); if (twin) twin.w = other; mt.w = zt.w; }
        Mini.later(() => {
          const now = performance.now(); [els[a], els[b]].forEach(x => x.classList.add('got'));
          const host = $('#mgStage'); GX.burst(host, ...GX.at(els[b], host), { n: 16, color: '#c23b22' }); GX.burst(host, ...GX.at(els[a], host), { n: 10 });
          Mini.mark(zt.w, !m.missed.has(zt.w.id), now - m.t, els[b]); m.t = now; m.seen.add(a); m.seen.add(b); m.lock = false;
          $('#mwFound').insertAdjacentHTML('beforeend', `<span class="mw-chip"><b class="hz">${esc(zt.w.zh)}</b>${esc(meaningText(zt.w))}</span>`); GX.pop($('#mwFound').lastElementChild, 1.2);
          m.left--; this.hint(s); if (m.left === 0) Mini.later(() => this.next(s), 900);
        }, 420);
      } else {
        let slip = false; [a, b].forEach(x => { const p = this.partner(m, x); if (p >= 0 && m.seen.has(p)) { slip = true; m.missed.add(m.cards[x].w.id); } });
        m.seen.add(a); m.seen.add(b);
        Mini.later(() => { [els[a], els[b]].forEach(x => GX.shake(x, 6)); if (slip) Mini.slip(); Mini.later(() => { els[a].classList.remove('open'); els[b].classList.remove('open'); m.lock = false; }, 420); }, 700);
      }
    }
  },

  /* ---------- เรียงประโยค: wooden blocks onto a paper scroll ---------- */
  order: {
    ok: w => !!sentenceTokens(w),
    none: L('คำชุดนี้ไม่มีประโยคตัวอย่างให้เรียง', 'These words have no example sentences'),
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table felt o-table"><div class="o-scroll" id="oScroll"><div class="o-top"><button class="ibtn sm" data-a="say" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button><div class="o-mean" id="oMean"></div></div>
        <div class="o-line" id="oLine"></div><div class="o-py pyx" id="oPy"></div><div class="o-fix" id="oFix"></div></div></div>
        <div class="m-panel"><div class="o-tray" id="oTray"></div><div class="m-foot" id="oFoot"></div></div>`;
      el.onclick = e => {
        const a = e.target.closest('[data-a]'); if (a && a.dataset.a === 'say') { TTS.speak(s.words[s.i].ex_zh); return; }
        if (a && a.dataset.a === 'undo') { this.undo(s); return; }
        const t = e.target.closest('.tok'); if (t) this.move(s, t);
      };
      this.next(s);
    },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], tk = sentenceTokens(w);
      s.o = { w, toks: tk.toks, end: tk.end, placed: [], t: performance.now(), done: false };
      let order = shuffle(tk.toks.map((x, i) => i)); for (let k = 0; k < 4 && order.every((x, i) => tk.toks[x] === tk.toks[i]); k++) order = shuffle(order);
      $('#oMean').textContent = exMean(w);
      const sc = $('#oScroll'); sc.classList.remove('ok', 'no'); sc.animate([{ transform: 'scaleX(.06)' }, { transform: 'scaleX(1)' }], { duration: 480, easing: 'cubic-bezier(.3,1.2,.5,1)' });
      $('#oLine').innerHTML = `<span class="o-ph">${L('แตะบล็อกด้านล่างเรียงจากซ้ายไปขวา', 'Tap the blocks below, left to right')}</span>`;
      $('#oPy').textContent = ''; $('#oPy').style.clipPath = ''; $('#oFix').innerHTML = '';
      $('#oTray').innerHTML = order.map((x, k) => `<button class="tok hz" data-t="${x}" style="--d:${k * 55}ms">${esc(tk.toks[x])}</button>`).join('');
      $('#oFoot').innerHTML = `<button class="btn ghost" data-a="undo">${ic('undo')}${L('ถอยคำล่าสุด', 'Undo')}</button>`;
      if (S().autoSpeak) TTS.speak(w.ex_zh);
    },
    move(s, t) {
      const o = s.o; if (o.done || s.paused) return;
      const line = $('#oLine'), from = t.getBoundingClientRect();
      if (t.parentElement.id === 'oLine') {
        o.placed.splice(o.placed.indexOf(+t.dataset.t), 1);
        const back = $(`#oTray .tok[data-t="${t.dataset.t}"]`); back.classList.remove('used'); GX.fly(back, from, { ms: 300 });
        t.remove(); if (!o.placed.length) line.innerHTML = `<span class="o-ph"></span>`; sfx('tap'); return;
      }
      if (t.classList.contains('used')) return;
      if (!o.placed.length) line.innerHTML = '';
      t.classList.add('used'); o.placed.push(+t.dataset.t);
      line.insertAdjacentHTML('beforeend', `<button class="tok hz in" data-t="${t.dataset.t}">${esc(o.toks[+t.dataset.t])}</button>`);
      const nt = line.lastElementChild;
      GX.fly(nt, from).finished.then(() => { if (!Mini.alive(s)) return; sfx('tap'); const host = $('#mgStage'); const [x, y] = GX.at(nt, host); GX.burst(host, x, y + 20, { n: 6, color: '#b98345', dist: 26, size: 5 }); GX.shake($('#oScroll'), 2, 160); }).catch(() => { });
      if (o.placed.length === o.toks.length) setTimeout(() => { if (Mini.alive(s) && s.o === o) this.check(s); }, 400);
    },
    undo(s) { const o = s.o; if (o.done || !o.placed.length) return; const last = $('#oLine .tok:last-child'); if (last) this.move(s, last); },
    check(s) {
      const o = s.o; o.done = true;
      const got = o.placed.map(i => o.toks[i]).join(''), want = o.toks.join(''), alts = o.w._alts || [], ok = got === want || alts.includes(got), sc = $('#oScroll'), line = $('#oLine'), host = $('#mgStage');
      sc.classList.add(ok ? 'ok' : 'no');
      if (ok) { line.insertAdjacentHTML('beforeend', `<span class="o-end hz">${esc(o.end)}</span>`); GX.burst(host, ...GX.at(line, host), { n: 22, dist: 110 }); }
      else { GX.shake(line, 9); $('#oFix').innerHTML = `<span class="k">${L('ที่ถูก', 'Correct')}</span><span class="hz">${esc(want + o.end)}</span>`; }
      const py = $('#oPy'); py.textContent = o.w.ex_py || ''; py.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 800, easing: 'ease-out', fill: 'forwards' });
      Mini.mark(o.w, ok, performance.now() - o.t, line);
      if (ok || S().autoSpeak) TTS.speak(ok ? got + o.end : o.w.ex_zh);
      Mini.advance(ok, $('#oFoot'), () => this.next(s));
    },
    key(s, e) { if (e.key === 'Backspace') { e.preventDefault(); this.undo(s); } }
  },

  /* ---------- เติมช่องว่าง (ป้ายร้านทอง): the sentence is a shop sign; the missing gold character flies into its slot ---------- */
  cloze: {
    ok: w => !!(w.ex_zh && w.zh && w.ex_zh.includes(w.zh)),
    none: L('คำชุดนี้ไม่มีประโยคตัวอย่างให้เติม', 'These words have no example sentences'),
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table dusk sg-table" id="cCard"><i class="sg-roof"></i><i class="sg-lamp l"></i><i class="sg-lamp r"></i>
          <div class="sign2" id="cSign"><div class="sg-txt hz" id="cSent"></div><i class="shine"></i></div>
          <div class="sg-py pyx" id="cPy"></div><div class="sg-mean" id="cMean"></div>
          <button class="ibtn sm c-say" data-a="say" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></div>
        <div class="m-panel"><div class="choices" id="cOpts"></div><div class="m-foot" id="cFoot"></div></div>`;
      el.onclick = e => {
        if (e.target.closest('[data-a="say"]')) { TTS.speak(s.words[s.i].ex_zh); return; }
        const b = e.target.closest('.choice'); if (b) this.choose(s, +b.dataset.o);
      };
      this.next(s);
    },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], at = w.ex_zh.indexOf(w.zh), n = Array.from(w.ex_zh).length;
      const own = w._opts && w._opts.map(z => ({ zh: z, py: '', th: '', en: '', _fake: true }));     // grammar practice brings its own choices
      s.c = { w, opts: shuffle([w, ...(own || distractors(w, 3, { avoid: w.ex_zh }))]), t: performance.now(), done: false };
      const sign = $('#cSign'); sign.className = 'sign2'; sign.style.setProperty('--fs', n > 16 ? .62 : n > 11 ? .78 : 1);
      $$('#cCard .sg-lamp').forEach(l => l.classList.remove('on'));
      const gapN = w._pk === 'g' ? clamp(Math.max(...s.c.opts.map(x => Array.from(x.zh).length)), 1, 4) : w._len;
      $('#cSent').innerHTML = `${esc(w.ex_zh.slice(0, at))}<b class="sg-gap" style="--n:${gapN}"></b>${esc(w.ex_zh.slice(at + w.zh.length))}`;
      sign.animate([{ transform: 'translateY(-26px) rotate(-2deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.3,1.3,.5,1)' });
      $('#cPy').textContent = ''; $('#cMean').textContent = exMean(w);
      $('#cOpts').innerHTML = s.c.opts.map((x, i) => optHTML(x, i, { hz: true })).join('');
      $('#cFoot').innerHTML = '';
    },
    /** a character flies (position: fixed, so scrolling never throws it off) from one element to another */
    fly(text, from, to, cls) {
      const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), f = document.createElement('b');
      f.className = 'sg-fly hz ' + cls; f.textContent = text; document.body.appendChild(f);
      const ax = a.left + a.width / 2, ay = a.top + a.height / 2, bx = b.left + b.width / 2, by = b.top + b.height / 2;
      return f.animate([{ left: ax + 'px', top: ay + 'px', rotate: '0deg', scale: 1 }, { left: (ax + bx) / 2 + 'px', top: Math.min(ay, by) - 50 + 'px', rotate: '180deg', scale: 1.3, offset: .5 }, { left: bx + 'px', top: by + 'px', rotate: '360deg', scale: 1 }], { duration: 560, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }).finished.then(() => f).catch(() => f);
    },
    async choose(s, i) {
      const c = s.c; if (c.done || s.paused) return; c.done = true;
      const pick = c.opts[i], ok = pick === c.w, gap = $('#cSent .sg-gap'), sign = $('#cSign'), card = $('#cCard'), btns = $$('#cOpts .choice');
      btns.forEach((b, k) => { b.disabled = true; b.classList.add(c.opts[k] === c.w ? 'correct' : k === i ? 'wrong' : 'dim'); });
      sfx('swoosh');
      if (!ok) {
        const f = await this.fly(pick.zh, btns[i], gap, 'dull'); if (!Mini.alive(s)) { f.remove(); return; }
        GX.shake(sign, 7); f.animate([{ translate: '-50% -50%', opacity: 1 }, { translate: '-50% 80px', opacity: 0, rotate: '200deg' }], { duration: 520, easing: 'ease-in', fill: 'forwards' }).onfinish = () => f.remove();
        await new Promise(r => setTimeout(r, 360)); if (!Mini.alive(s)) return;
      }
      const g = await this.fly(c.w.zh, btns[c.opts.indexOf(c.w)], gap, 'gold'); g.remove(); if (!Mini.alive(s)) return;
      gap.textContent = c.w.zh; gap.classList.add(ok ? 'on' : 'no');
      const [gx, gy] = GX.at(gap, card);
      if (ok) {
        sign.classList.add('lit'); $$('#cCard .sg-lamp').forEach(l => l.classList.add('on'));
        sign.querySelector('.shine').animate([{ left: '-30%' }, { left: '130%' }], { duration: 900, easing: 'ease-in-out' });
        GX.burst(card, gx, gy, { n: 24, color: '#ffd27a', dist: 80 }); GX.quake(card, 3);
      } else { sign.classList.add('half'); GX.burst(card, gx, gy, { n: 8, color: '#c9a65a', dist: 40 }); }
      $('#cPy').textContent = c.w.ex_py || '';
      Mini.mark(c.w, ok, performance.now() - c.t, gap);
      if (S().autoSpeak) TTS.speak(c.w.ex_zh);
      Mini.advance(ok, $('#cFoot'), () => this.next(s));
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 4) { e.preventDefault(); const b = $(`#cOpts .choice[data-o="${n - 1}"]`); if (b && !b.disabled) b.click(); } }
  },

  /* ---------- จับผิดประโยค (grammar only): judge whether a Chinese sentence is grammatically right or wrong ---------- */
  judge: {
    ok: w => typeof w._ok === 'boolean' && !!w.zh,
    none: L('บทเรียนนี้ยังไม่มีตัวอย่างสำหรับจับผิดประโยค', 'This lesson has no mistake-check items yet'),
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table felt jg-table">
          <div class="jg-lesson" id="jLesson"></div>
          <div class="jg-card" id="jCard">
            <button class="ibtn sm jg-say" id="jSay" data-a="say" hidden aria-label="${T('ฟังเสียง')}">${ic('vol')}</button>
            <div class="jg-sent" id="jSent" lang="zh-Hans"></div>
            <div class="jg-fix" id="jFix"></div>
          </div>
        </div>
        <div class="m-panel">
          <div class="jg-acts" id="jActs">
            <button class="jg-btn yes" data-j="1"><kbd>1</kbd>${ic('check')}${L('ถูกต้อง', 'Correct')}</button>
            <button class="jg-btn no" data-j="0"><kbd>2</kbd>${ic('x')}${L('ผิดไวยากรณ์', 'Incorrect')}</button>
          </div>
          <div class="m-foot" id="jFoot"></div>
        </div>`;
      el.onclick = e => {
        if (e.target.closest('[data-a="say"]')) { const w = s.words[s.i]; if (w) TTS.speak(w._right || w.ex_zh); return; }
        const b = e.target.closest('[data-j]'); if (b) this.choose(s, b.dataset.j === '1');
      };
      this.next(s);
    },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i];
      s.j = { w, t: performance.now(), done: false };
      const card = $('#jCard'); card.className = 'jg-card';
      card.animate([{ transform: 'translateY(16px) scale(.97)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.22,.8,.28,1)' });
      const ls = $('#jLesson'); ls.textContent = w._lesson || ''; ls.hidden = !w._lesson;
      $('#jSent').textContent = w.zh;
      $('#jFix').innerHTML = ''; $('#jSay').hidden = true; $('#jFoot').innerHTML = '';
      $$('#jActs .jg-btn').forEach(b => { b.disabled = false; b.classList.remove('correct', 'wrong', 'dim'); });
    },
    choose(s, guessOk) {
      const j = s.j; if (!j || j.done || s.paused) return; j.done = true;
      const w = j.w, ok = guessOk === w._ok, card = $('#jCard'), host = $('#mgStage');
      card.classList.add(ok ? 'ok' : 'no');
      $$('#jActs .jg-btn').forEach(b => {
        const val = b.dataset.j === '1'; b.disabled = true;
        b.classList.add(val === w._ok ? 'correct' : val === guessOk ? 'wrong' : 'dim');
      });
      if (ok) GX.burst(host, ...GX.at(card, host), { n: 20, dist: 100 });
      else GX.shake(card, 8);
      const badge = w._ok
        ? `<div class="jg-badge ok">${ic('check')}${L('ประโยคนี้ถูกต้อง', 'Grammatically correct')}</div>`
        : `<div class="jg-badge no">${ic('x')}${L('ประโยคนี้ผิดไวยากรณ์', 'Grammatical mistake')}</div>`;
      const diff = w._ok ? '' : `<div class="jg-diff"><s lang="zh-Hans">${esc(w._wrong)}</s><span>→</span><b lang="zh-Hans">${esc(w._right)}</b></div>`;
      const py = w.ex_py ? `<div class="jg-py pyx">${esc(w.ex_py)}</div>` : '';
      const note = w._note ? `<div class="jg-note"${w._noteLang ? ` lang="${w._noteLang}"` : ''}>${esc(w._note)}</div>` : '';
      $('#jFix').innerHTML = badge + diff + py + note;
      $('#jSay').hidden = false;
      Mini.mark(w, ok, performance.now() - j.t, card);
      if (ok || S().autoSpeak) TTS.speak(w._right || w.ex_zh);
      Mini.advance(ok, $('#jFoot'), () => this.next(s));
    },
    key(s, e) {
      if (e.key === '1' || e.key === 'ArrowLeft') { e.preventDefault(); const b = $('#jActs .jg-btn[data-j="1"]'); if (b && !b.disabled) b.click(); }
      else if (e.key === '2' || e.key === 'ArrowRight') { e.preventDefault(); const b = $('#jActs .jg-btn[data-j="0"]'); if (b && !b.disabled) b.click(); }
    }
  },

  /* ---------- ล่าวรรณยุกต์: draw each syllable's pitch with a finger (keys 1–5 still work) ---------- */
  tone: {
    ok: w => !!wordSyl(w) && wordSyl(w).length <= 4,
    none: L('อ่านพินอินของคำชุดนี้ไม่ได้', 'Couldn\'t read the pinyin of these words'),
    GHOST: { 1: 'M30 34 L270 34', 2: 'M30 116 L270 30', 3: 'M30 66 Q 120 150 175 124 T 270 34', 4: 'M30 28 L270 120', 5: 'M146 75 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0' },
    mount(s, el) {
      s.i = -1;
      const glyph = t => `<svg viewBox="0 0 40 24" class="tg">${['', '<path d="M6 6h28"/>', '<path d="M6 19 34 5"/>', '<path d="M6 8 18 19 34 5"/>', '<path d="M6 5l28 14"/>', '<circle cx="20" cy="12" r="3.200" fill="currentColor"/>'][t]}</svg>`;
      el.innerHTML = `<div class="m-table felt t-table"><div class="t-card"><button class="ibtn t-say" data-a="say" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button>
          <div class="t-zh hz" id="tZh"></div><div class="t-syls" id="tSyls"></div><div class="t-mean" id="tMean"></div></div></div>
        <div class="m-panel"><div class="t-pad" id="tPad"><svg viewBox="0 0 300 150" preserveAspectRatio="none"><g class="t-grid">${[1, 2, 3, 4, 5].map(v => `<line x1="0" x2="300" y1="${150 - v * 25}" y2="${150 - v * 25}"/>`).join('')}</g><path class="t-ghost" id="tGhost" d=""/><path class="t-ink" id="tInk" d=""/></svg>
          <span class="t-padhint">${L('ลากนิ้ววาดเสียงของพยางค์ที่ไฮไลต์ · แตะเบา ๆ = เสียงเบา', 'Draw the pitch of the highlighted syllable · a tap = neutral tone')}</span></div>
        <div class="t-keys" id="tKeys">${[1, 2, 3, 4, 5].map(t => `<button class="tkey" data-t="${t}"><kbd>${t}</kbd>${glyph(t)}</button>`).join('')}</div>
        <div class="m-foot" id="tFoot"></div></div>`;
      el.onclick = e => {
        if (e.target.closest('[data-a="say"]')) { speakWord(s.words[s.i]); return; }
        const k = e.target.closest('.tkey'); if (k) this.pick(s, +k.dataset.t);
      };
      this.bindPad(s);
      this.next(s);
    },
    bindPad(s) {
      const pad = $('#tPad'), ink = $('#tInk'); let pts = null, id = null;
      const pt = e => { const r = pad.getBoundingClientRect(); return [clamp((e.clientX - r.left) / r.width * 300, 0, 300), clamp((e.clientY - r.top) / r.height * 150, 0, 150)]; };
      const draw = () => ink.setAttribute('d', pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '));
      pad.addEventListener('pointerdown', e => { if (!s.t || s.t.done || s.paused) return; id = e.pointerId; try { pad.setPointerCapture(id); } catch (x) { } pts = [pt(e)]; ink.classList.remove('ok', 'no'); $('#tGhost').setAttribute('d', ''); draw(); e.preventDefault(); });
      pad.addEventListener('pointermove', e => { if (!pts || e.pointerId !== id) return; const p = pt(e), q = pts[pts.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 2.5) { pts.push(p); draw(); } });
      const up = e => { if (!pts || e.pointerId !== id) return; const t = this.classify(pts); pts = null; this.pick(s, t, true); };
      pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', () => { pts = null; ink.setAttribute('d', ''); });
    },
    /** which tone a drawn line looks like (y grows downwards: a smaller y is a higher pitch) */
    classify(pts) {
      let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (pts.length < 4 || len < 24) return 5;
      const ys = pts.map(p => p[1]), y0 = ys[0], y1 = ys[ys.length - 1], lo = Math.max(...ys), hi = Math.min(...ys), at = ys.indexOf(lo) / (ys.length - 1);
      if (lo - hi < 24) return 1;
      if (lo > y0 + 14 && lo > y1 + 14 && at > .15 && at < .9) return 3;
      return y1 < y0 ? 2 : 4;
    },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], syl = wordSyl(w);
      s.t = { w, syl, at: 0, ok: true, t: performance.now(), done: false };
      $('#tZh').textContent = w.zh; $('#tMean').textContent = ''; $('#tFoot').innerHTML = '';
      $('#tInk').setAttribute('d', ''); $('#tGhost').setAttribute('d', '');
      $('#tSyls').innerHTML = syl.map((x, i) => `<span class="ts ${i === 0 ? 'cur' : ''}"><b class="pyx">${esc(x.plain)}</b><i>?</i></span>`).join('');
      $$('#tKeys .tkey').forEach(b => { b.disabled = false; b.classList.remove('good', 'bad'); });
      GX.pop($('#tZh'), 1.12);
      if (TTS.ok) setTimeout(() => { if (Mini.alive(s) && s.t.w === w) speakWord(w); }, 250);
    },
    pick(s, t, drawn) {
      const st = s.t; if (!st || st.done || s.paused) return;
      const x = st.syl[st.at], cell = $$('#tSyls .ts')[st.at], good = x.tone === t, ink = $('#tInk'), host = $('#mgStage');
      cell.classList.remove('cur'); cell.classList.add(good ? 'ok' : 'no');
      cell.innerHTML = `<b class="pyx">${esc(x.mark)}</b><i>${x.tone === 5 ? '·' : x.tone}</i>`; GX.pop(cell, 1.2);
      const btn = $(`#tKeys .tkey[data-t="${t}"]`); if (btn) { btn.classList.remove('good', 'bad'); void btn.offsetWidth; btn.classList.add(good ? 'good' : 'bad'); }
      if (drawn) ink.classList.add(good ? 'ok' : 'no');
      if (good) GX.burst(host, ...GX.at(cell, host), { n: 10, color: '#56c592', dist: 40 });
      else { $('#tGhost').setAttribute('d', this.GHOST[x.tone]); GX.shake(cell, 6); st.ok = false; }
      if (good && st.at < st.syl.length - 1) sfx('tick');
      st.at++;
      if (st.at < st.syl.length) { setTimeout(() => { if (s.t !== st) return; $$('#tSyls .ts')[st.at].classList.add('cur'); ink.setAttribute('d', ''); ink.classList.remove('ok', 'no'); $('#tGhost').setAttribute('d', ''); }, good ? 380 : 900); return; }
      st.done = true; $$('#tKeys .tkey').forEach(b => b.disabled = true);
      $('#tMean').textContent = meaningText(st.w);
      Mini.mark(st.w, st.ok, performance.now() - st.t, $('#tSyls'));
      if (!st.ok) speakWord(st.w);
      Mini.advance(st.ok, $('#tFoot'), () => this.next(s));
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 5) { e.preventDefault(); const b = $(`#tKeys .tkey[data-t="${n}"]`); if (b && !b.disabled) b.click(); } }
  },

  /* ---------- ฝนคำศัพท์ (โคมลอย): lanterns drift up the night sky; answer the highest one before it is gone ---------- */
  rain: {
    mount(s, el) {
      s.r = { queue: [...s.words], drops: [], gt: 0, last: 0, spawnAt: 0, target: null, id: 0 };
      el.innerHTML = `<div class="m-table r-field r-night" id="rField">${Array.from({ length: 30 }, () => `<i class="r-star" style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 80).toFixed(1)}%;--tw:${(1.5 + Math.random() * 3).toFixed(1)}s"></i>`).join('')}</div><div class="m-panel"><div class="choices r-opts" id="rOpts"></div></div>`;
      el.onclick = e => {
        const d = e.target.closest('.lantern'); if (d) { const x = s.r.drops.find(q => q.id === +d.dataset.id); if (x && !x.gone) this.aim(s, x); return; }
        const b = e.target.closest('.choice'); if (b) this.choose(s, +b.dataset.o, b);
      };
      s.r.last = performance.now();
      const loop = now => { if (!Mini.alive(s) || s.finished) return; s.raf = requestAnimationFrame(loop); this.step(s, now); };
      s.raf = requestAnimationFrame(loop);
    },
    resume(s) { s.r.last = performance.now(); },
    stop(s) { cancelAnimationFrame(s.raf); },
    speed(s) { const done = s.results.length / s.words.length; return 9500 - 3200 * done - Math.min(1600, s.combo * 160); },
    step(s, now) {
      const r = s.r, dt = clamp(now - r.last, 0, 80); r.last = Math.max(r.last, now);
      if (s.paused || document.hidden) return;
      const field = $('#rField'), H = field.clientHeight, W = field.clientWidth;
      if (H < 120) return;
      r.gt += dt;
      const live = r.drops.filter(d => !d.gone);
      if (r.queue.length && (!live.length || (live.length < 3 && r.gt >= r.spawnAt))) {
        const w = r.queue.shift(), d = { id: ++r.id, w, born: r.gt, dur: this.speed(s), p: 0, missed: false, gone: false, ph: Math.random() * 6.28, amp: 6 + Math.random() * 6 };
        const el = document.createElement('button'); el.className = 'lantern'; el.dataset.id = d.id; el.innerHTML = `<span class="lt-body hz">${esc(w.zh)}</span>`;
        field.appendChild(el); d.el = el; el.style.left = (18 + Math.random() * Math.max(0, W - el.offsetWidth - 36)) + 'px';
        r.drops.push(d); r.spawnAt = r.gt + Math.max(1400, d.dur * .42);
        if (!r.target) this.aim(s, d);
      }
      for (const d of r.drops) {
        if (d.gone) continue;
        d.p = (r.gt - d.born) / d.dur;
        const sx = Math.sin(r.gt / 680 + d.ph) * d.amp, sy = H + 10 - d.p * (H + 100);
        d.el.style.transform = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`;
        if (d.p >= 1) this.escape(s, d);
      }
      if (r.target && !r.target.gone) { const hi = live.filter(d => !d.gone).sort((a, b) => b.p - a.p)[0]; if (hi && hi !== r.target && hi.p - r.target.p > .25) this.aim(s, hi); }
      if (!r.queue.length && r.drops.every(d => d.gone)) { r.drops = []; Mini.finish(); }
    },
    aim(s, d) {
      const r = s.r; r.target = d;
      r.drops.forEach(x => x.el.classList.toggle('aim', x === d));
      r.opts = shuffle([d.w, ...distractors(d.w, 3)]);
      $('#rOpts').innerHTML = r.opts.map((x, i) => optHTML(x, i)).join('');
    },
    retarget(s) { const live = s.r.drops.filter(d => !d.gone).sort((a, b) => b.p - a.p); if (live.length) this.aim(s, live[0]); else { s.r.target = null; $('#rOpts').innerHTML = ''; } },
    escape(s, d) {
      d.gone = true; d.el.classList.add('away'); setTimeout(() => d.el.remove(), 700);
      Mini.mark(d.w, false, d.dur, d.el);
      if (s.r.target === d) this.retarget(s);
    },
    choose(s, i, b) {
      const r = s.r, d = r.target; if (!d || d.gone || s.paused) return;
      if (r.opts[i] === d.w) {
        d.gone = true; const field = $('#rField'), [x, y] = GX.at(d.el, field);
        d.el.classList.add('boom'); setTimeout(() => d.el.remove(), 450);
        GX.burst(field, x, y, { n: 30, dist: 110, color: '#ffd27a' }); GX.burst(field, x, y, { n: 14, dist: 60, color: '#ff8a5c' });
        if (S().autoSpeak) speakWord(d.w);
        Mini.mark(d.w, !d.missed, r.gt - d.born, d.el);
        this.retarget(s);
      } else {
        d.missed = true; b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); b.disabled = true;
        Mini.slip();
      }
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 4) { e.preventDefault(); const b = $(`#rOpts .choice[data-o="${n - 1}"]`); if (b && !b.disabled) b.click(); } }
  },

  /* ---------- ฟังแล้วเลือก (ระฆัง): hear the word, ring the bell that carries it ---------- */
  listen: {
    mount(s, el) {
      s.i = -1;
      if (!TTS.ok) toast(L('เบราว์เซอร์นี้อ่านออกเสียงไม่ได้ จะแสดงพินอินแทนเสียง', 'This browser can\'t speak, so the pinyin is shown instead'), { icon: 'info', ms: 3600 });
      el.innerHTML = `<div class="m-table l-hall" id="lHall"><button class="l-spk" data-a="say" aria-label="${T('ฟังอีกครั้ง')}">${ic('vol')}</button>
          <div class="l-beam"></div><div class="l-bells" id="lBells"></div></div>
        <div class="m-panel l-panel"><div class="l-py pyx" id="lPy"></div><div class="l-mean" id="lMean"></div>
          <button class="btn ghost l-slow" data-a="slow">${ic('vol')}${L('ฟังช้า ๆ', 'Slower')}</button><div class="m-foot" id="lFoot"></div></div>`;
      el.onclick = e => {
        const a = e.target.closest('[data-a]'); if (a) { this.say(s, a.dataset.a === 'slow'); return; }
        const b = e.target.closest('.l-bell'); if (b) this.choose(s, +b.dataset.o);
      };
      this.next(s);
    },
    say(s, slow) {
      const w = s.words[s.i]; if (!w) return;
      const b = $('.l-spk'), hall = $('#lHall'); b.classList.add('talking');
      const [wx, wy] = GX.at(b, hall);
      for (let k = 0; k < 3; k++) { const r = document.createElement('i'); r.className = 'l-wave'; r.style.left = wx + 'px'; r.style.top = wy + 'px'; hall.appendChild(r); r.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: .9 }, { transform: 'translate(-50%,-50%) scale(3)', opacity: 0 }], { duration: 1100, delay: k * 220, fill: 'forwards' }).onfinish = () => r.remove(); }
      speakWord(w, slow ? Math.max(.45, S().rate * .65) : undefined).finally(() => b.classList.remove('talking'));
    },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i];
      s.l = { w, opts: shuffle([w, ...distractors(w, 3, { sound: true })]), t: performance.now(), done: false };
      $('#lPy').textContent = TTS.ok ? '' : w.py; $('#lMean').textContent = L('ฟังเสียง แล้วแตะระฆังที่ใช่', 'Listen, then ring the right bell'); $('#lFoot').innerHTML = '';
      $('#lBells').innerHTML = s.l.opts.map((x, i) => `<button class="l-bell" data-o="${i}" style="--d:${i * 70}ms"><i class="l-str"></i><span class="l-cup hz">${esc(x.zh)}</span><small class="pyx">${esc(x.py)}</small><kbd>${i + 1}</kbd></button>`).join('');
      setTimeout(() => { if (Mini.alive(s) && s.l.w === w) this.say(s); }, 350);
    },
    choose(s, i) {
      const l = s.l; if (l.done || s.paused) return; l.done = true;
      const ok = l.opts[i] === l.w, bells = $$('#lBells .l-bell'), hall = $('#lHall'), good = bells[l.opts.indexOf(l.w)];
      bells[i].classList.add('ring'); sfx('star', ok ? 2 : 0);
      setTimeout(() => {
        if (!Mini.alive(s)) return;
        bells.forEach((b, k) => b.classList.add(b === good ? 'ok' : k === i ? 'no' : 'dim'));
        const host = $('#mgStage'); if (ok) GX.burst(host, ...GX.at(good, host), { n: 22, dist: 80 }); else GX.shake(bells[i], 7);
        $('#lPy').textContent = l.w.py; $('#lMean').textContent = meaningText(l.w);
        Mini.mark(l.w, ok, performance.now() - l.t, good);
        Mini.advance(ok, $('#lFoot'), () => this.next(s));
      }, 380);
    },
    key(s, e) {
      if (e.key === 'r' || e.key === 'R') { this.say(s); return; }
      const n = +e.key; if (n >= 1 && n <= 4) { e.preventDefault(); this.choose(s, n - 1); }
    }
  },

  /* ---------- R1 · วิ่งหนีหินยักษ์ (3-Lane 3D Signpost Runner & Approaching Traps — 100% Showcase Faithful) ---------- */
  runner: {
    mount(s, el) {
      s.i = -1; s.lane = 1; s.act = 'run'; s.dist = 80;
      el.innerHTML = `<div class="m-table rn-arena" id="rnArena">
          <div class="rn-top"><span class="rn-goal" id="rnGoal"></span><span class="rn-dist" id="rnDist">${ic('boulder')} 80m</span></div>
          <div class="rn-persp"><div class="rn-road"><i data-l="0"></i><i data-l="1"></i><i data-l="2"></i></div></div>
          <div class="rn-entities" id="rnEnts"></div>
          <div class="rn-hero" id="rnHero" style="left:50%"><div class="rn-rope"></div><div class="rn-body hz">侠</div><small id="rnState">เลนกลาง</small></div>
          <div class="rn-boulder" id="rnBoulder">${ic('boulder')} ${L('หินเพลิงยักษ์กำลังกลิ้งไล่บี้!', 'Giant fire boulder chasing!')}</div>
        </div>
        <div class="m-panel rn-panel">
          <div class="rn-ctrl">
            <button class="btn" data-rn="L">${ic('chev-l')}${L('ซ้าย', 'Left')} (A/←)</button>
            <button class="btn" data-rn="R">${ic('chev-r')}${L('ขวา', 'Right')} (D/→)</button>
            <button class="btn" data-rn="J">${ic('up')}${L('โดดข้ามหนาม', 'Jump')} (W/↑)</button>
            <button class="btn" data-rn="S">${ic('down')}${L('สไลด์ลอดคาน', 'Slide')} (S/↓)</button>
            <button class="btn" data-rn="G">${ic('grapple')}${L('โหนสลิง', 'Grapple')} (E)</button>
          </div>
          <div class="m-foot" id="rnFoot"></div>
        </div>`;
      const arena = $('#rnArena');
      let sx = 0, sy = 0;
      arena.onpointerdown = e => { sx = e.clientX; sy = e.clientY; };
      arena.onpointerup = e => {
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.hypot(dx, dy) >= 22) {
          if (Math.abs(dx) > Math.abs(dy)) this.steer(s, s.lane + (dx > 0 ? 1 : -1), false);
          else this.doAct(s, dy < 0 ? (s.rn && s.rn.mode === 'hazard' && s.rn.trap === 'rope' ? 'rope' : 'jump') : 'slide');
        }
      };
      el.onclick = e => {
        const g = e.target.closest('.rn-sign'); if (g) { this.steer(s, +g.dataset.l, true); return; }
        const ln = e.target.closest('[data-l]'); if (ln) { this.steer(s, +ln.dataset.l, false); return; }
        const hz = e.target.closest('.rn-hazard'); if (hz) { this.doAct(s, hz.dataset.kind || 'jump'); return; }
        const b = e.target.closest('[data-rn]'); if (!b) return;
        const k = b.dataset.rn;
        if (k === 'L') this.steer(s, s.lane - 1, false);
        else if (k === 'R') this.steer(s, s.lane + 1, false);
        else if (k === 'J') this.doAct(s, 'jump');
        else if (k === 'S') this.doAct(s, 'slide');
        else if (k === 'G') this.doAct(s, 'rope');
      };
      this.next(s);
      s.rnLast = performance.now();
      const loop = now => { if (!Mini.alive(s) || s.finished) return; s.raf = requestAnimationFrame(loop); this.step(s, now); };
      s.raf = requestAnimationFrame(loop);
    },
    stop(s) { cancelAnimationFrame(s.raf); },
    steer(s, l, dash) {
      if (!s.rn || s.rn.done || s.paused) return;
      s.lane = clamp(l, 0, 2);
      const hero = $('#rnHero'); if (hero) hero.style.left = [24, 50, 76][s.lane] + '%';
      const st = $('#rnState'); if (st) st.textContent = [L('เลนซ้าย', 'Left'), L('เลนกลาง', 'Center'), L('เลนขวา', 'Right')][s.lane];
      if (dash && s.rn.mode === 'fork') {
        s.rn.p = Math.max(s.rn.p, 0.88);
        Mini.later(() => { if (s.rn && !s.rn.done && s.rn.mode === 'fork') this.resolve(s); }, 140);
      }
    },
    doAct(s, kind) {
      if (!s.rn || s.paused) return;
      s.act = kind;
      const hero = $('#rnHero'), st = $('#rnState'), rope = $('#rnHero .rn-rope');
      if (hero) { hero.classList.remove('jump', 'slide', 'rope'); void hero.offsetWidth; hero.classList.add(kind); }
      if (rope) rope.classList.toggle('on', kind === 'rope');
      if (st) st.textContent = kind === 'jump' ? L('โดด!', 'Jump!') : kind === 'slide' ? L('สไลด์!', 'Slide!') : L('โหนสลิง!', 'Grapple!');
      if (s.rn.mode === 'hazard') s.rn.p = Math.max(s.rn.p, 0.87);
      Mini.later(() => { s.act = 'run'; if (hero) hero.classList.remove('jump', 'slide', 'rope'); if (rope) rope.classList.remove('on'); }, 620);
    },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], bad = distractors(w, 2), okLane = Math.floor(Math.random() * 3);
      const opts = []; let bi = 0;
      for (let i = 0; i < 3; i++) opts.push(i === okLane ? w : bad[bi++]);
      const trapKinds = ['jump', 'slide', 'rope'];
      const hasTrap = s.i > 0 && s.i % 2 === 1, trap = trapKinds[(s.i >> 1) % 3];
      s.rn = { w, opts, okLane, p: 0, ok: true, t: performance.now(), done: false, mode: hasTrap ? 'hazard' : 'fork', trap };
      this.spawnEnts(s);
    },
    spawnEnts(s) {
      const rn = s.rn, box = $('#rnEnts'); if (!box || !rn) return;
      box.innerHTML = ''; $('#rnFoot').innerHTML = '';
      if (rn.mode === 'hazard') {
        const labels = {
          jump: `${ic('alert')} ${L('กับดักหนามเหล็ก! กด [↑ โดด] หรือแตะเพื่อตีลังกาข้าม', 'Iron Spikes! Tap or press [↑ Jump]')}`,
          slide: `${ic('gear')} ${L('คานใบมีดไฟต่ำ! กด [↓ สไลด์] หรือแตะเพื่อสไลด์ลอด', 'Low Blade Beam! Tap or press [↓ Slide]')}`,
          rope: `${ic('flame')} ${L('เหวลาวาขาด! กด [โหนสลิง] หรือแตะเพื่อเหินข้ามเหว', 'Lava Chasm! Tap or press [Grapple]')}`
        };
        $('#rnGoal').innerHTML = labels[rn.trap];
        const h = document.createElement('div');
        h.className = 'rn-hazard ' + rn.trap; h.dataset.kind = rn.trap;
        h.innerHTML = labels[rn.trap];
        box.appendChild(h);
        rn.hzEl = h;
      } else {
        $('#rnGoal').innerHTML = `${L('ทางแยกข้างหน้า! ปัดเข้าช่อง:', 'Fork ahead! Steer into:')} <b>${esc(meaningText(rn.w))}</b>`;
        rn.els = rn.opts.map((x, i) => {
          const g = document.createElement('button');
          g.type = 'button'; g.className = 'rn-sign'; g.dataset.l = i;
          g.innerHTML = `<b class="hz">${esc(x.zh)}</b><small class="pyx">${esc(x.py)}</small><i>${['ซ้าย 左', 'กลาง 中', 'ขวา 右'][i]}</i>`;
          box.appendChild(g);
          return g;
        });
      }
    },
    step(s, now) {
      const dt = Math.min((now - (s.rnLast || now)) / 1000, 0.1); s.rnLast = now;
      const rn = s.rn; if (!rn || rn.done || s.paused || document.hidden) return;
      rn.p += dt * 0.40;
      const p = Math.min(rn.p, 1.1), y = 74 + p * 165, sc = 0.54 + p * 0.54;
      if (rn.mode === 'fork' && rn.els) {
        rn.els.forEach((el, i) => {
          const spread = (i - 1) * (17 + p * 16);
          el.style.left = (50 + spread) + '%';
          el.style.top = y + 'px';
          el.style.transform = `translate(-50%,-50%) scale(${sc.toFixed(2)})`;
        });
        if (rn.p >= 0.90) this.resolve(s);
      } else if (rn.mode === 'hazard' && rn.hzEl) {
        rn.hzEl.style.top = y + 'px';
        rn.hzEl.style.transform = `translate(-50%,-50%) scale(${sc.toFixed(2)})`;
        if (rn.p >= 0.88) {
          const arena = $('#rnArena'), hero = $('#rnHero'), [hx, hy] = GX.at(hero, arena);
          const good = s.act === rn.trap || (rn.trap === 'rope' && s.act === 'jump');
          if (good) {
            GX.burst(arena, hx, hy - 24, { n: 22, color: '#63e6be', dist: 80 });
            GX.text(arena, hx, hy - 48, rn.trap === 'jump' ? 'ตีลังกาข้ามหนาม!' : rn.trap === 'slide' ? 'สไลด์ลอดใบมีด!' : 'โหนสลิงข้ามเหว!', 'big');
          } else {
            s.dist = Math.max(10, s.dist - 15); $('#rnDist').innerHTML = `${ic('boulder')} ${s.dist}m`;
            GX.flash(arena, 'rgba(255,50,35,.35)', 180); GX.quake(arena, 7);
          }
          rn.mode = 'fork'; rn.p = 0; this.spawnEnts(s);
        }
      }
    },
    resolve(s) {
      const rn = s.rn; if (!rn || rn.done) return;
      const arena = $('#rnArena'), hero = $('#rnHero');
      const [hx, hy] = GX.at(hero, arena);
      if (s.lane === rn.okLane) {
        rn.done = true;
        if (rn.els && rn.els[s.lane]) rn.els[s.lane].classList.add('ok');
        s.dist = Math.min(120, s.dist + 12); $('#rnDist').innerHTML = `${ic('boulder')} ${s.dist}m`;
        GX.hitStop(arena, hx, hy - 18, { color: '#63e6be' });
        GX.burst(arena, hx, hy - 18, { n: 26, color: '#ffd27a', dist: 90 });
        GX.text(arena, hx, hy - 48, `${rn.w.zh} · ทะลุด่าน! +เร่งสปีด`, 'big');
        if (S().autoSpeak) speakWord(rn.w);
        Mini.mark(rn.w, rn.ok, performance.now() - rn.t, rn.els ? rn.els[s.lane] : hero);
        Mini.later(() => this.next(s), 520);
      } else {
        rn.ok = false; rn.p = 0.08;
        if (rn.els && rn.els[s.lane]) rn.els[s.lane].classList.add('no');
        s.dist = Math.max(10, s.dist - 20); $('#rnDist').innerHTML = `${ic('boulder')} ${s.dist}m`;
        GX.flash(arena, 'rgba(255,50,35,.38)', 220); GX.quake(arena, 8);
        GX.text(arena, hx, hy - 44, L('ผิดช่อง! ปัดเปลี่ยนเลนใหม่', 'Wrong lane!'), 'bad');
        Mini.slip();
      }
    },
    key(s, e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === '1') { e.preventDefault(); this.steer(s, e.key === '1' ? 0 : s.lane - 1, e.key === '1'); }
      else if (e.key === '2') { e.preventDefault(); this.steer(s, 1, true); }
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === '3') { e.preventDefault(); this.steer(s, e.key === '3' ? 2 : s.lane + 1, e.key === '3'); }
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); this.doAct(s, 'jump'); }
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); this.doAct(s, 'slide'); }
      else if (e.key === 'e' || e.key === 'E') { e.preventDefault(); this.doAct(s, 'rope'); }
    }
  },

  /* ---------- P2 · ไต่หอคอยหนีไฟนรก (Vertical Wuxia Tower Wall-Jump — 100% Distinct from Runner) ---------- */
  parkour: {
    mount(s, el) {
      s.i = -1; s.alt = 10; s.wallPos = 0;
      el.innerHTML = `<div class="m-table pk-arena pk-tower" id="pkArena">
          <div class="rn-top"><span class="rn-goal" id="pkGoal"></span><span class="rn-dist" id="pkAlt">${ic('tower')} 10m</span></div>
          <div class="pk-wall L" id="pkWallL"></div>
          <div class="pk-wall R" id="pkWallR"></div>
          <div class="pk-beams" id="pkBeams"></div>
          <svg class="pk-rope-svg" id="pkSvg" viewBox="0 0 100 100" preserveAspectRatio="none"><line id="pkLine" x1="50" y1="74" x2="50" y2="74" stroke="#ffd27a" stroke-width="1.5" stroke-dasharray="3 1.5" opacity="0"/></svg>
          <div class="pk-hero" id="pkHero"><span class="hz">侠</span></div>
          <div class="pk-lava-rise" id="pkLava">${ic('flame')} ${L('ทะเลเพลิงนรกกำลังไล่ขึ้นมา!', 'Rising Hellfire! Grapple up fast!')}</div>
        </div>
        <div class="m-panel"><div class="m-foot" id="pkFoot"></div></div>`;
      el.onclick = e => { const b = e.target.closest('.pk-beam'); if (b) this.hook(s, +b.dataset.o, b); };
      this.next(s);
      s.pkLast = performance.now();
      const loop = now => { if (!Mini.alive(s) || s.finished) return; s.raf = requestAnimationFrame(loop); this.step(s, now); };
      s.raf = requestAnimationFrame(loop);
    },
    stop(s) { cancelAnimationFrame(s.raf); },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], opts = shuffle([w, ...distractors(w, 2)]);
      s.pk = { w, opts, fire: 14, ok: true, t: performance.now(), done: false };
      $('#pkGoal').innerHTML = `${L('ดีดตัวไต่หอคอยขึ้นสู่คานคำว่า:', 'Wall-jump up to ledge:')} <b>${esc(meaningText(w))}</b>`;
      $('#pkFoot').innerHTML = '';
      const hero = $('#pkHero'), line = $('#pkLine'), lava = $('#pkLava');
      if (hero) { hero.getAnimations().forEach(a => a.cancel()); hero.style.left = (s.lastHeroX || 50) + '%'; hero.style.bottom = '58px'; hero.style.transform = 'translate(-50%,0)'; }
      if (line) line.setAttribute('opacity', '0');
      if (lava) lava.style.height = '14%';
      $('#pkBeams').innerHTML = opts.map((x, i) => `<button type="button" class="pk-beam" data-o="${i}"><i>${ic('grapple')}<kbd>${i + 1}</kbd></i><b class="hz">${esc(x.zh)}</b><small class="pyx">${esc(x.py)}</small></button>`).join('');
    },
    step(s, now) {
      const dt = Math.min((now - (s.pkLast || now)) / 1000, 0.1); s.pkLast = now;
      const pk = s.pk; if (!pk || pk.done || s.paused || document.hidden) return;
      pk.fire = Math.min(72, pk.fire + dt * 9.5);
      const lava = $('#pkLava');
      if (lava) lava.style.height = pk.fire.toFixed(1) + '%';
      if (pk.fire >= 68) {
        pk.fire = 18; pk.ok = false;
        const arena = $('#pkArena');
        GX.flash(arena, 'rgba(255,60,20,.5)', 240); GX.quake(arena, 9);
        GX.text(arena, arena.clientWidth / 2, arena.clientHeight - 90, L('ไฟนรกลวก! รีบทะยานขึ้นข้างบน!', 'Burned by rising fire!'), 'bad');
        Mini.slip();
      }
    },
    hook(s, i, btn) {
      const pk = s.pk; if (!pk || pk.done || s.paused) return;
      const arena = $('#pkArena'), hero = $('#pkHero'), line = $('#pkLine');
      const [bx, by] = GX.at(btn, arena), [hx, hy] = GX.at(hero, arena);
      const W = arena.clientWidth || 1, H = arena.clientHeight || 1;
      line.setAttribute('x1', (hx / W * 100).toFixed(1)); line.setAttribute('y1', (hy / H * 100).toFixed(1));
      line.setAttribute('x2', (bx / W * 100).toFixed(1)); line.setAttribute('y2', (by / H * 100).toFixed(1));
      line.setAttribute('opacity', '1');
      if (pk.opts[i] === pk.w) {
        pk.done = true; btn.classList.add('ok');
        const targetX = (bx / W * 100).toFixed(1);
        s.lastHeroX = targetX;
        s.alt += 15; $('#pkAlt').innerHTML = `${ic('tower')} ${s.alt}m`;
        s.wallPos = (s.wallPos || 0) + 120;
        $$('.pk-wall', arena).forEach(w => { w.style.backgroundPositionY = s.wallPos + 'px'; });
        GX.hitStop(arena, bx, by, { color: '#ffd27a' });
        hero.animate([
          { left: (hx / W * 100).toFixed(1) + '%', bottom: '58px', transform: 'translate(-50%,0) rotate(0deg) scale(1)' },
          { left: (i === 0 ? 12 : i === 2 ? 88 : 50) + '%', bottom: '130px', transform: `translate(-50%,0) rotate(${i === 0 ? -28 : 28}deg) scale(1.25)`, offset: 0.45 },
          { left: targetX + '%', bottom: '175px', transform: 'translate(-50%,0) rotate(0deg) scale(1.08)' }
        ], { duration: 480, easing: 'cubic-bezier(.2,.85,.35,1)', fill: 'forwards' });
        GX.burst(arena, bx, by + 18, { n: 28, color: '#ffd27a', dist: 95 });
        GX.text(arena, bx, by + 12, `飞檐走壁! ไต่ขึ้นชั้น ${s.alt}m`, 'big');
        if (S().autoSpeak) speakWord(pk.w);
        Mini.mark(pk.w, pk.ok, performance.now() - pk.t, btn);
        Mini.later(() => this.next(s), 520);
      } else {
        pk.ok = false; pk.fire = Math.min(64, pk.fire + 12);
        btn.classList.add('no'); btn.disabled = true;
        GX.shake(btn, 7); GX.burst(arena, bx, by, { n: 14, color: '#ff5a4d', dist: 50 });
        setTimeout(() => line.setAttribute('opacity', '0'), 240);
        Mini.slip();
      }
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 3) { e.preventDefault(); const b = $(`#pkBeams .pk-beam[data-o="${n - 1}"]`); if (b && !b.disabled) b.click(); } }
  },

  /* ---------- W3 · มีดบินสังหารเงา (Flying Kunai vs Live Charging Shadow Assassins) ---------- */
  kunai: {
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table kn-arena" id="knArena">
          <div class="pk-goal" id="knGoal"></div>
          <div class="kn-stage" id="knFoes"></div>
          <svg class="sl-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="knSlash" vector-effect="non-scaling-stroke" d="M12 18 L 88 84" fill="none" stroke="#ff2b2b" stroke-width="7" stroke-linecap="round" opacity="0" style="filter:drop-shadow(0 0 14px #ff0000)"/></svg>
          <div class="kn-hand">${ic('g-kunai')} ${L('ปามีดสกัดก่อนเกจดาบเต็ม! ถ้าเกจเต็มนักฆ่าจะพุ่งฟันสวนทันที', 'Throw kunai before their strike gauge fills up!')}</div>
        </div>
        <div class="m-panel"><div class="m-foot" id="knFoot"></div></div>`;
      el.onclick = e => { const b = e.target.closest('.kn-foe'); if (b) this.throwKunai(s, +b.dataset.o, b); };
      this.next(s);
      s.knLast = performance.now();
      const loop = now => { if (!Mini.alive(s) || s.finished) return; s.raf = requestAnimationFrame(loop); this.step(s, now); };
      s.raf = requestAnimationFrame(loop);
    },
    stop(s) { cancelAnimationFrame(s.raf); },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], opts = shuffle([w, ...distractors(w, 2)]);
      const pos = [[22, 52], [50, 44], [78, 54]];
      s.kn = { w, opts, charge: 0, ok: true, t: performance.now(), done: false };
      $('#knGoal').innerHTML = `${L('ปามีดบินสกัดนักฆ่าที่ถือคำว่า:', 'Throw kunai at assassin holding:')} <b>${esc(meaningText(w))}</b>`;
      $('#knFoot').innerHTML = '';
      $('#knFoes').innerHTML = opts.map((x, i) => `<button type="button" class="kn-foe" data-o="${i}" style="left:${pos[i][0]}%;top:${pos[i][1]}%"><kbd>${i + 1}</kbd><b class="hz">${esc(x.zh)}</b><small class="pyx">${esc(x.py)}</small><span class="kn-warn"><em>${L('ง้างดาบ', 'Charge')} 0%</em><i style="width:0%"></i></span></button>`).join('');
    },
    step(s, now) {
      const dt = Math.min((now - (s.knLast || now)) / 1000, 0.1); s.knLast = now;
      const kn = s.kn; if (!kn || kn.done || s.paused || document.hidden) return;
      kn.charge = Math.min(1, kn.charge + dt / 6.2);
      const pct = Math.round(kn.charge * 100);
      $$('#knFoes .kn-foe:not(.no)').forEach(b => {
        const bar = b.querySelector('.kn-warn i'), em = b.querySelector('.kn-warn em');
        if (bar) bar.style.width = pct + '%';
        if (em) em.textContent = `${L('ง้างดาบ', 'Charge')} ${pct}%`;
        b.style.transform = `translate(-50%, 0) scale(${(1 + kn.charge * 0.14).toFixed(2)})`;
      });
      if (kn.charge >= 1) {
        kn.charge = 0; kn.ok = false;
        const arena = $('#knArena'), slash = $('#knSlash');
        if (slash) slash.animate([{ opacity: 1, strokeDasharray: '140', strokeDashoffset: '140' }, { opacity: 1, strokeDashoffset: '0', offset: 0.3 }, { opacity: 0, strokeDashoffset: '0' }], { duration: 420 });
        GX.flash(arena, 'rgba(255,25,25,.58)', 280); GX.quake(arena, 11);
        GX.text(arena, arena.clientWidth / 2, arena.clientHeight / 2, L('ฉัวะ! โดนมือสังหารฟันสวน!', 'Slashed by assassin!'), 'bad');
        Mini.slip();
      }
    },
    throwKunai(s, i, btn) {
      const kn = s.kn; if (!kn || kn.done || s.paused) return;
      const arena = $('#knArena'), [tx, ty] = GX.at(btn, arena);
      const blade = document.createElement('div'); blade.className = 'kn-blade'; arena.appendChild(blade);
      blade.animate([
        { left: '50%', top: '94%', transform: 'translate(-50%,-50%) rotate(18deg) scale(1.35)' },
        { left: tx + 'px', top: ty + 'px', transform: 'translate(-50%,-50%) rotate(18deg) scale(.9)' }
      ], { duration: 210, easing: 'ease-in', fill: 'forwards' }).onfinish = () => blade.remove();
      if (kn.opts[i] === kn.w) {
        kn.done = true;
        setTimeout(() => {
          if (!Mini.alive(s)) return;
          btn.classList.add('ok');
          btn.animate([
            { transform: 'translate(-50%,-50%) scale(1.18)', filter: 'brightness(2.4)' },
            { transform: 'translate(-50%, 36px) rotate(22deg) scale(.35)', opacity: 0.15 }
          ], { duration: 420, fill: 'forwards' });
          GX.hitStop(arena, tx, ty, { color: '#ff4d3b', ms: 55 });
          GX.flash(arena, 'rgba(255,50,40,.45)', 200); GX.quake(arena, 8);
          GX.burst(arena, tx, ty, { n: 28, color: '#ff4d3b', dist: 95 });
          GX.burst(arena, tx, ty, { n: 14, color: '#ffd27a', dist: 55 });
          GX.text(arena, tx, ty - 38, 'ปักทะลุเกราะ! +25', 'big');
          if (S().autoSpeak) speakWord(kn.w);
          Mini.mark(kn.w, kn.ok, performance.now() - kn.t, btn);
          Mini.advance(kn.ok, $('#knFoot'), () => this.next(s));
        }, 190);
      } else {
        kn.ok = false; kn.charge = Math.min(0.92, kn.charge + 0.25);
        btn.classList.add('no'); btn.disabled = true;
        GX.shake(btn, 7); Mini.slip();
      }
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 3) { e.preventDefault(); const b = $(`#knFoes .kn-foe[data-o="${n - 1}"]`); if (b && !b.disabled) b.click(); } }
  },

  /* ---------- Y3 · กู้ระเบิดดินปืน (Black Powder Fuse Cut — 100% Showcase Faithful) ---------- */
  bomb: {
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table bm-arena" id="bmArena">
          <div class="pk-goal" id="bmGoal"></div>
          <div class="bm-stage">
            <div class="bm-fuses" id="bmFuses"></div>
            <div class="bm-spark-orb" id="bmSpark"></div>
            <div class="bm-core" id="bmCore"><b class="hz" id="bmZh"></b><small class="pyx" id="bmPy"></small><em id="bmTimer">08.0s</em></div>
          </div>
          <div class="bm-wires" id="bmWires"></div>
        </div>
        <div class="m-panel"><div class="m-foot" id="bmFoot"></div></div>`;
      el.onclick = e => { const b = e.target.closest('.bm-wire,[data-o]'); if (b) this.cut(s, +b.dataset.o); };
      this.next(s);
      s.bmLast = performance.now();
      const loop = now => { if (!Mini.alive(s) || s.finished) return; s.raf = requestAnimationFrame(loop); this.step(s, now); };
      s.raf = requestAnimationFrame(loop);
    },
    stop(s) { cancelAnimationFrame(s.raf); },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], opts = shuffle([w, ...distractors(w, 2)]);
      s.bm = { w, opts, rem: 8.0, ok: true, t: performance.now(), done: false };
      $('#bmGoal').innerHTML = `${L('ตัดสายชนวนที่แปลตรงกับคำบนลูกระเบิดเหล็กก่อนระเบิด!', 'Cut the fuse wire matching the bomb word before detonation!')}`;
      $('#bmZh').textContent = w.zh; $('#bmPy').textContent = w.py; $('#bmTimer').textContent = '08.0s'; $('#bmFoot').innerHTML = '';
      $('#bmCore').className = 'bm-core';
      $('#bmSpark').hidden = false;
      $('#bmFuses').innerHTML = opts.map((_, i) => `<div class="bm-fuse-arc f${i}" data-o="${i}"></div>`).join('');
      $('#bmWires').innerHTML = opts.map((x, i) => `<button type="button" class="bm-wire" data-o="${i}"><kbd>${i + 1}</kbd><span>${ic('scissors')} ${esc(meaningText(x))}</span></button>`).join('');
    },
    step(s, now) {
      const dt = Math.min((now - (s.bmLast || now)) / 1000, 0.1); s.bmLast = now;
      const bm = s.bm; if (!bm || bm.done || s.paused || document.hidden) return;
      bm.rem = Math.max(0, bm.rem - dt);
      const tEl = $('#bmTimer'), spk = $('#bmSpark');
      if (tEl) tEl.textContent = bm.rem.toFixed(1) + 's';
      if (spk) {
        const p = 1 - bm.rem / 8.0;
        spk.style.top = (14 + p * 42) + 'px';
      }
      if (bm.rem <= 0) {
        bm.rem = 8.0; bm.ok = false;
        const arena = $('#bmArena');
        GX.flash(arena, 'rgba(255,80,20,.55)', 260); GX.quake(arena, 10);
        Mini.slip();
      }
    },
    cut(s, i) {
      const bm = s.bm; if (!bm || bm.done || s.paused) return;
      const btn = $(`#bmWires .bm-wire[data-o="${i}"]`), arc = $(`#bmFuses .bm-fuse-arc[data-o="${i}"]`);
      if (!btn || btn.disabled) return;
      const arena = $('#bmArena'), core = $('#bmCore'), [bx, by] = GX.at(core, arena);
      if (bm.opts[i] === bm.w) {
        bm.done = true; btn.classList.add('ok'); if (arc) arc.classList.add('severed');
        core.classList.add('safe'); $('#bmSpark').hidden = true;
        GX.hitStop(arena, bx, by - 30, { color: '#63e6be' });
        GX.pop(core, 1.12);
        GX.burst(arena, bx, by - 45, { n: 26, color: '#56c592', dist: 85 });
        GX.text(arena, bx, by - 55, 'ตัดชนวนทันเวลา! +25', 'big');
        if (S().autoSpeak) speakWord(bm.w);
        Mini.mark(bm.w, bm.ok, performance.now() - bm.t, btn);
        Mini.advance(bm.ok, $('#bmFoot'), () => this.next(s));
      } else {
        bm.ok = false; btn.classList.add('no'); btn.disabled = true; if (arc) arc.classList.add('severed');
        GX.flash(arena, 'rgba(255,80,20,.45)', 240); GX.quake(arena, 9);
        GX.burst(arena, bx, by, { n: 20, color: '#ff5a36', dist: 75 });
        Mini.slip();
      }
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 3) { e.preventDefault(); this.cut(s, n - 1); } }
  },

  /* ---------- Z1 · ปืนกลยันต์เพลิงปราบผีดิบ (Real-Time Advancing Jiangshi Tower Defense) ---------- */
  siege: {
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table sg-arena" id="sgArena">
          <div class="rn-top"><span class="rn-goal">${L('ฝูงผีดิบเจียงซีกำลังกระโดดบุกเข้ามา! ยิงยันต์ปราบตัวหน้าสุด (กรอบทอง)', 'Jiangshi horde advancing! Shoot talisman at the front zombie!')}</span><span class="rn-dist" id="sgDist">${ic('g-siege')} 10.0m</span></div>
          <div class="sg-lane" id="sgHorde"></div>
          <div class="bm-wires" id="sgOpts"></div>
        </div>
        <div class="m-panel"><div class="m-foot" id="sgFoot"></div></div>`;
      el.onclick = e => {
        const b = e.target.closest('.sg-opt'); if (b) { this.fire(s, +b.dataset.o, b); return; }
        const m = e.target.closest('.sg-mob'); if (m && m.classList.contains('front')) {
          const idx = s.sg.opts.indexOf(s.sg.w), ob = $(`#sgOpts .sg-opt[data-o="${idx}"]`);
          if (ob) this.fire(s, idx, ob);
        }
      };
      this.next(s);
      s.sgLast = performance.now();
      const loop = now => { if (!Mini.alive(s) || s.finished) return; s.raf = requestAnimationFrame(loop); this.step(s, now); };
      s.raf = requestAnimationFrame(loop);
    },
    stop(s) { cancelAnimationFrame(s.raf); },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], decoys = distractors(w, 2), opts = shuffle([w, ...decoys]);
      const mobs = [decoys[0] || w, w, decoys[1] || w];
      s.sg = { w, opts, march: 0, ok: true, t: performance.now(), done: false };
      $('#sgFoot').innerHTML = ''; $('#sgDist').innerHTML = `${ic('g-siege')} 10.0m`;
      $('#sgHorde').innerHTML = mobs.map((x, idx) => `<div class="sg-mob ${idx === 1 ? 'front' : ''}" id="sgM${idx}"><span class="sg-tal">敕</span><b class="hz">${esc(x.zh)}</b><small class="pyx">${esc(x.py)}</small></div>`).join('');
      $('#sgOpts').innerHTML = opts.map((x, i) => `<button type="button" class="bm-wire sg-opt" data-o="${i}"><kbd>${i + 1}</kbd><span>${ic('flame')} 敕 · ${esc(meaningText(x))}</span></button>`).join('');
    },
    step(s, now) {
      const dt = Math.min((now - (s.sgLast || now)) / 1000, 0.1); s.sgLast = now;
      const sg = s.sg; if (!sg || sg.done || s.paused || document.hidden) return;
      sg.march = Math.min(1, sg.march + dt / 6.8);
      const remM = Math.max(0, 10 * (1 - sg.march)).toFixed(1);
      const dEl = $('#sgDist'); if (dEl) dEl.innerHTML = `${ic('g-siege')} ${remM}m`;
      const hop = Math.abs(Math.sin(now / 150)) * -18;
      [0, 1, 2].forEach(idx => {
        const m = $(`#sgM${idx}`); if (!m) return;
        const isFront = idx === 1;
        const yOff = (isFront ? sg.march * 56 : sg.march * 28) + (isFront ? hop : hop * 0.6);
        const sc = isFront ? 0.88 + sg.march * 0.42 : 0.78 + sg.march * 0.18;
        m.style.transform = `translateY(${yOff.toFixed(1)}px) scale(${sc.toFixed(2)})`;
      });
      if (sg.march >= 1) {
        sg.march = 0.18; sg.ok = false;
        const arena = $('#sgArena');
        GX.flash(arena, 'rgba(180,30,255,.48)', 260); GX.quake(arena, 10);
        GX.text(arena, arena.clientWidth / 2, arena.clientHeight / 2, L('ผีดิบประชิดป้อม! รีบยิงยันต์สกัด!', 'Jiangshi breached the barrier!'), 'bad');
        Mini.slip();
      }
    },
    fire(s, i, btn) {
      const sg = s.sg; if (!sg || sg.done || s.paused) return;
      const arena = $('#sgArena'), front = $('#sgM1'), [jx, jy] = GX.at(front, arena), [bx, by] = GX.at(btn, arena);
      const tal = document.createElement('div'); tal.className = 'sg-fireball'; arena.appendChild(tal);
      tal.animate([{ left: bx + 'px', top: by + 'px' }, { left: jx + 'px', top: jy + 'px' }], { duration: 200, fill: 'forwards' }).onfinish = () => tal.remove();
      if (sg.opts[i] === sg.w) {
        sg.done = true; btn.classList.add('ok');
        setTimeout(() => {
          if (!Mini.alive(s)) return;
          GX.hitStop(arena, jx, jy, { color: '#ff922b', ms: 55 });
          GX.flash(arena, 'rgba(255,160,40,.5)', 240); GX.quake(arena, 8);
          front.animate([{ transform: 'scale(1.35)', filter: 'brightness(2.5)' }, { transform: 'scale(.15)', opacity: 0 }], { duration: 360, fill: 'forwards' });
          GX.burst(arena, jx, jy, { n: 32, color: '#ffd27a', dist: 100 });
          GX.text(arena, jx, jy - 36, 'ปราบผีดิบ! +25', 'big');
          if (S().autoSpeak) speakWord(sg.w);
          Mini.mark(sg.w, sg.ok, performance.now() - sg.t, btn);
          Mini.advance(sg.ok, $('#sgFoot'), () => this.next(s));
        }, 190);
      } else {
        sg.ok = false; sg.march = Math.min(0.92, sg.march + 0.22);
        btn.classList.add('no'); btn.disabled = true;
        GX.shake(btn, 7); Mini.slip();
      }
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 3) { e.preventDefault(); const b = $(`#sgOpts .sg-opt[data-o="${n - 1}"]`); if (b && !b.disabled) b.click(); } }
  },

  /* ---------- V2 · ตีดาบเหล็กไหลไฟนรก (Hellfire Sword Forge — 100% Showcase Faithful) ---------- */
  forge: {
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table fg-arena" id="fgArena">
          <div class="pk-goal" id="fgGoal"></div>
          <div class="fg-anvil">
            <div class="fg-sword" id="fgBlade"></div>
            <div class="fg-hammer" id="fgHam">${ic('g-forge')}</div>
          </div>
          <div class="fg-ingots" id="fgIngots"></div>
        </div>
        <div class="m-panel"><div class="m-foot" id="fgFoot"></div></div>`;
      el.onclick = e => { const b = e.target.closest('.fg-ingot'); if (b) this.strike(s, +b.dataset.i, b); };
      this.next(s);
    },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], chars = Array.from(w.zh).filter(c => /[㐀-鿿]/.test(c));
      const extra = [];
      for (const d of distractors(w, 4)) for (const c of Array.from(d.zh)) if (!chars.includes(c) && !extra.includes(c) && extra.length < Math.max(3, 5 - chars.length)) extra.push(c);
      const pool = shuffle([...chars, ...extra]);
      s.fg = { w, chars, pool, at: 0, ok: true, t: performance.now(), done: false };
      $('#fgGoal').innerHTML = `${L('ตีดาบเหล็กไหลคำว่า:', 'Forge the war-blade for:')} <b>${esc(meaningText(w))}</b> <small class="pyx">(${esc(w.py)})</small>`;
      $('#fgFoot').innerHTML = '';
      $('#fgBlade').innerHTML = chars.map((_, i) => `<b class="fg-ch hz" data-s="${i}">?</b>`).join('');
      $('#fgIngots').innerHTML = pool.map((c, i) => `<button type="button" class="fg-ingot hz" data-i="${i}"><kbd>${i + 1}</kbd>${esc(c)}</button>`).join('');
    },
    strike(s, idx, btn) {
      const fg = s.fg; if (!fg || fg.done || s.paused || btn.disabled) return;
      const want = fg.chars[fg.at], got = fg.pool[idx], arena = $('#fgArena'), ham = $('#fgHam'), slots = $$('#fgBlade .fg-ch');
      ham.animate([{ transform: 'rotate(0deg) scale(1)' }, { transform: 'translate(-22px, 14px) rotate(-55deg) scale(1.35)', offset: 0.45 }, { transform: 'rotate(0deg) scale(1)' }], { duration: 240 });
      if (got === want) {
        btn.disabled = true; btn.classList.add('used');
        const slot = slots[fg.at]; slot.textContent = got; slot.classList.add('forged');
        const [sx, sy] = GX.at(slot, arena);
        GX.hitStop(arena, sx, sy, { color: '#ff922b', ms: 55 });
        GX.flash(arena, 'rgba(255,160,40,.55)', 220); GX.quake(arena, 9);
        GX.burst(arena, sx, sy, { n: 36, color: '#ffd27a', dist: 115, size: 7 });
        GX.burst(arena, sx, sy, { n: 18, color: '#ff6b35', dist: 70, size: 6 });
        fg.at++;
        if (fg.at >= fg.chars.length) {
          fg.done = true;
          GX.text(arena, arena.clientWidth / 2, sy - 42, `ตีดาบสำเร็จ! ${fg.w.zh} (${meaningText(fg.w)}) +25`, 'big');
          if (S().autoSpeak) speakWord(fg.w);
          Mini.mark(fg.w, fg.ok, performance.now() - fg.t, $('#fgBlade'));
          Mini.advance(fg.ok, $('#fgFoot'), () => this.next(s));
        }
      } else {
        fg.ok = false; GX.shake(btn, 7); Mini.slip();
      }
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 6) { e.preventDefault(); const b = $(`#fgIngots .fg-ingot[data-i="${n - 1}"]`); if (b && !b.disabled) b.click(); } }
  },

  /* ---------- J2 · ด่านตรวจป้ายหยก (Jade Plaque Odd-One-Out — 100% Showcase Faithful) ---------- */
  jade: {
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table jd-arena" id="jdArena">
          <div class="pk-goal">${L('ด่านตรวจป้ายหยก: แตะสกัด "ป้ายหยกที่แปลปลอม" (1 ชิ้น) ให้สายฟ้าฟาดแตก!', 'Jade Gate: Tap the 1 FAKE jade plaque to shatter it with lightning!')}</div>
          <div class="jd-row" id="jdRow"></div>
          <div class="jd-reveal" id="jdRev"></div>
        </div>
        <div class="m-panel"><div class="m-foot" id="jdFoot"></div></div>`;
      el.onclick = e => { const b = e.target.closest('.jd-plaque'); if (b) this.inspect(s, +b.dataset.o, b); };
      this.next(s);
    },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], others = distractors(w, 4);
      const fakeMean = meaningText(others[0] || w);
      const cards = shuffle([
        { w, zh: w.zh, py: w.py, m: fakeMean, fake: true },
        ...others.slice(1, 4).map(x => ({ w: x, zh: x.zh, py: x.py, m: meaningText(x), fake: false }))
      ]);
      s.jd = { w, cards, ok: true, t: performance.now(), done: false };
      $('#jdRev').textContent = ''; $('#jdFoot').innerHTML = '';
      $('#jdRow').innerHTML = cards.map((c, i) => `<button type="button" class="jd-plaque" data-o="${i}"><kbd>${i + 1}</kbd><b class="hz">${esc(c.zh)}</b><small class="pyx">${esc(c.py)}</small><span>${esc(c.m)}</span></button>`).join('');
    },
    inspect(s, i, btn) {
      const jd = s.jd; if (!jd || jd.done || s.paused) return;
      const arena = $('#jdArena'), c = jd.cards[i], [x, y] = GX.at(btn, arena);
      if (c.fake) {
        jd.done = true;
        const W = arena.clientWidth || 1, H = arena.clientHeight || 1, px = (x / W * 100).toFixed(1), py = (y / H * 100).toFixed(1);
        const bolt = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        bolt.setAttribute('viewBox', '0 0 100 100'); bolt.setAttribute('preserveAspectRatio', 'none');
        bolt.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:30;pointer-events:none';
        bolt.innerHTML = `<polyline points="${px},0 ${+px - 4},35 ${+px + 5},42 ${px},${py}" fill="none" stroke="#fff" stroke-width="2.2" style="filter:drop-shadow(0 0 10px #80e5be)"/>`;
        arena.appendChild(bolt); setTimeout(() => bolt.remove(), 320);
        GX.hitStop(arena, x, y, { color: '#80e5be', ms: 52 });
        GX.flash(arena, 'rgba(255,100,80,.38)', 260); GX.quake(arena, 8);
        btn.animate([{ transform: 'scale(1.08)', filter: 'brightness(2)' }, { transform: 'translateY(110px) rotate(-22deg) scale(.5)', opacity: 0 }], { duration: 480, fill: 'forwards' });
        GX.burst(arena, x, y, { n: 26, color: '#80e5be', dist: 85 });
        GX.text(arena, x, y - 30, 'สกัดสำเร็จ! +15', 'big');
        $('#jdRev').innerHTML = `${L('คำแปลจริงของ', 'True meaning of')} <b class="hz">${esc(jd.w.zh)}</b> (${esc(jd.w.py)}) = <b>${esc(meaningText(jd.w))}</b>`;
        if (S().autoSpeak) speakWord(jd.w);
        Mini.mark(jd.w, jd.ok, performance.now() - jd.t, btn);
        Mini.advance(jd.ok, $('#jdFoot'), () => this.next(s));
      } else {
        jd.ok = false; btn.classList.add('real'); btn.disabled = true;
        GX.shake(btn, 6); GX.text(arena, x, y - 24, 'ป้ายนี้แปลถูกอยู่แล้ว!', 'bad');
        Mini.slip();
      }
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 4) { e.preventDefault(); const b = $(`#jdRow .jd-plaque[data-o="${n - 1}"]`); if (b && !b.disabled) b.click(); } }
  },

  /* ---------- K1 · คมดาบพู่กัน (Real-Time Gravity Arc + Swipe/Tap Brush-Blade Slash) ---------- */
  slice: {
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table sl-arena" id="slArena">
          <div class="pk-goal" id="slGoal"></div>
          <svg class="sl-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="slPath" vector-effect="non-scaling-stroke" d="M18 72 Q 50 32, 86 24" fill="none" stroke="#ffe599" stroke-width="5" stroke-linecap="round" stroke-dasharray="140" stroke-dashoffset="140" style="filter:drop-shadow(0 0 10px #ffd27a)"/></svg>
          <div class="sl-sky" id="slSky"></div>
        </div>
        <div class="m-panel"><div class="m-foot" id="slFoot"></div></div>`;
      const arena = $('#slArena');
      let swiping = false, sx = 0, sy = 0;
      arena.onpointerdown = e => { swiping = true; sx = e.clientX; sy = e.clientY; };
      arena.onpointerup = () => { swiping = false; };
      arena.onpointermove = e => {
        if (!swiping || !s.sl || s.sl.done) return;
        const r = arena.getBoundingClientRect(), path = $('#slPath');
        if (path && r.width && r.height) {
          const x1 = ((sx - r.left) / r.width * 100).toFixed(1), y1 = ((sy - r.top) / r.height * 100).toFixed(1);
          const x2 = ((e.clientX - r.left) / r.width * 100).toFixed(1), y2 = ((e.clientY - r.top) / r.height * 100).toFixed(1);
          path.setAttribute('d', `M${x1} ${y1} L ${x2} ${y2}`);
          path.style.strokeDashoffset = '0';
        }
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const b = hit && hit.closest && hit.closest('.sl-plaque');
        if (b && !b.disabled) this.slash(s, +b.dataset.o, b);
      };
      el.onclick = e => { const b = e.target.closest('.sl-plaque'); if (b) this.slash(s, +b.dataset.o, b); };
      this.next(s);
      s.slLast = performance.now();
      const loop = now => { if (!Mini.alive(s) || s.finished) return; s.raf = requestAnimationFrame(loop); this.step(s, now); };
      s.raf = requestAnimationFrame(loop);
    },
    stop(s) { cancelAnimationFrame(s.raf); },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], opts = shuffle([w, ...distractors(w, 2)]);
      s.sl = { w, opts, ok: true, t: performance.now(), done: false };
      $('#slGoal').innerHTML = `${L('คมดาบพู่กัน · ลากนิ้วฟันป้ายไม้ก่อนร่วงตกพื้น:', 'Swipe or tap to slice before it falls:')} <b>${esc(meaningText(w))}</b>`;
      $('#slFoot').innerHTML = '';
      this.tossWave(s);
    },
    tossWave(s) {
      const sl = s.sl; if (!sl) return;
      const path = $('#slPath'); if (path) { path.setAttribute('d', 'M18 72 Q 50 32, 86 24'); path.style.strokeDashoffset = '140'; }
      const sky = $('#slSky'); if (!sky) return;
      const startX = [22, 50, 78];
      sky.innerHTML = sl.opts.map((x, i) => `<button type="button" class="sl-plaque" data-o="${i}" style="left:${startX[i]}%;top:96%"><kbd>${i + 1}</kbd><b class="hz">${esc(x.zh)}</b><small class="pyx">${esc(x.py)}</small></button>`).join('');
      const els = $$('.sl-plaque', sky);
      sl.bodies = els.map((el, i) => ({
        el, x: startX[i], y: 98,
        vx: (i === 0 ? 3.2 : i === 2 ? -3.2 : 0),
        vy: -(52 + (i === 1 ? 6 : 0)),
        rot: (i - 1) * 8, vrot: (i === 0 ? 12 : -12)
      }));
    },
    step(s, now) {
      const dt = Math.min((now - (s.slLast || now)) / 1000, 0.08); s.slLast = now;
      const sl = s.sl; if (!sl || sl.done || !sl.bodies || s.paused || document.hidden) return;
      const g = 24; // gravity %/s^2 -> ~4.2s hang time arc!
      let allFallen = true;
      sl.bodies.forEach(b => {
        b.vy += g * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += b.vrot * dt;
        if (b.y < 112) allFallen = false;
        b.el.style.left = b.x.toFixed(1) + '%';
        b.el.style.top = b.y.toFixed(1) + '%';
        b.el.style.transform = `translate(-50%, -50%) rotate(${b.rot.toFixed(1)}deg)`;
      });
      if (allFallen) {
        sl.ok = false;
        const arena = $('#slArena');
        GX.flash(arena, 'rgba(255,60,40,.38)', 220); GX.quake(arena, 7);
        GX.text(arena, arena.clientWidth / 2, arena.clientHeight - 70, L('ป้ายตกพื้น! โยนชุดใหม่อีกครั้ง', 'Dropped! Tossing again!'), 'bad');
        Mini.slip();
        this.tossWave(s);
      }
    },
    slash(s, i, btn) {
      const sl = s.sl; if (!sl || sl.done || s.paused) return;
      const arena = $('#slArena'), [x, y] = GX.at(btn, arena), path = $('#slPath');
      if (sl.opts[i] === sl.w) {
        sl.done = true;
        if (path) path.animate([{ strokeDashoffset: 140 }, { strokeDashoffset: 0 }], { duration: 190, fill: 'forwards' });
        const chars = Array.from(sl.w.zh), leftCh = chars[0] || sl.w.zh, rightCh = chars.slice(1).join('') || sl.w.zh;
        btn.style.opacity = '0'; btn.style.pointerEvents = 'none';
        [-38, 38].forEach((dx, k) => {
          const h = document.createElement('div'); h.className = 'sl-half hz';
          h.style.left = (x - 22 + (k ? 22 : -22)) + 'px'; h.style.top = (y - 48) + 'px';
          h.textContent = k ? rightCh : leftCh;
          arena.appendChild(h);
          h.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, 84px) rotate(${k ? 32 : -32}deg)`, opacity: 0 }], { duration: 600, fill: 'forwards' }).onfinish = () => h.remove();
        });
        GX.hitStop(arena, x, y, { color: '#ffe599', ms: 52 });
        GX.flash(arena, 'rgba(255,225,130,.38)', 190); GX.quake(arena, 7);
        GX.burst(arena, x, y, { n: 28, color: '#ffe599', dist: 95 });
        GX.text(arena, x, y - 32, 'ผ่ากลางอากาศ! +25', 'big');
        if (S().autoSpeak) speakWord(sl.w);
        Mini.mark(sl.w, sl.ok, performance.now() - sl.t, btn);
        Mini.advance(sl.ok, $('#slFoot'), () => this.next(s));
      } else {
        sl.ok = false; btn.classList.add('no'); btn.disabled = true;
        GX.shake(btn, 7); Mini.slip();
      }
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 3) { e.preventDefault(); const b = $(`#slSky .sl-plaque[data-o="${n - 1}"]`); if (b && !b.disabled) b.click(); } }
  },

  /* ---------- L1 · กุญแจกลไกราชวงศ์ (Royal Brass Pinyin Lockbox — 100% Showcase Faithful) ---------- */
  cipher: {
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table cp-arena" id="cpArena">
          <div class="pk-goal" id="cpGoal"></div>
          <div class="cp-chest" id="cpChest">
            <div class="cp-word"><b class="hz" id="cpZh"></b></div>
            <div class="cp-wheels" id="cpWheels"></div>
          </div>
          <div class="cp-keys" id="cpKeys"></div>
        </div>
        <div class="m-panel"><div class="m-foot" id="cpFoot"></div></div>`;
      el.onclick = e => { const b = e.target.closest('.cp-key'); if (b) this.dial(s, +b.dataset.i, b); };
      this.next(s);
    },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], syls = (wordSyl(w) || [{ mark: w.py }]).map(x => x.mark);
      const extra = [];
      for (const d of distractors(w, 4, { sound: true })) {
        const ds = (wordSyl(d) || [{ mark: d.py }]).map(x => x.mark);
        for (const m of ds) if (!syls.includes(m) && !extra.includes(m) && extra.length < Math.max(3, 6 - syls.length)) extra.push(m);
      }
      const pool = shuffle([...syls, ...extra]);
      s.cp = { w, syls, pool, at: 0, ok: true, t: performance.now(), done: false };
      $('#cpGoal').innerHTML = `${L('หมุนรหัสพินอินเพื่อเปิดหีบคำว่า:', 'Dial pinyin wheels to unlock:')} <b>${esc(meaningText(w))}</b>`;
      $('#cpZh').textContent = w.zh; $('#cpFoot').innerHTML = '';
      $('#cpChest').className = 'cp-chest';
      $('#cpWheels').innerHTML = syls.map((_, i) => `<span class="cp-wheel pyx" data-w="${i}">?</span>`).join('');
      $('#cpKeys').innerHTML = pool.map((p, i) => `<button type="button" class="cp-key pyx" data-i="${i}"><kbd>${i + 1}</kbd>${esc(p)}</button>`).join('');
    },
    dial(s, idx, btn) {
      const cp = s.cp; if (!cp || cp.done || s.paused || btn.disabled) return;
      const want = cp.syls[cp.at], got = cp.pool[idx], arena = $('#cpArena'), wheels = $$('#cpWheels .cp-wheel');
      if (got === want) {
        btn.disabled = true; btn.classList.add('used');
        const wh = wheels[cp.at]; wh.textContent = got; wh.classList.add('locked');
        wh.animate([{ transform: 'rotateX(-85deg)' }, { transform: 'rotateX(0deg)' }], { duration: 260, easing: 'cubic-bezier(.2,1.2,.4,1)' });
        cp.at++;
        if (cp.at >= cp.syls.length) {
          cp.done = true;
          const chest = $('#cpChest'); chest.classList.add('open');
          GX.flash(arena, 'rgba(255,225,130,.4)', 280); GX.pop(chest, 1.08);
          const [cx, cy] = GX.at(chest, arena);
          GX.burst(arena, cx, cy, { n: 30, color: '#ffd27a', dist: 110 });
          GX.text(arena, cx, cy - 40, `ปลดล็อก! ${cp.w.py}`, 'big');
          if (S().autoSpeak) speakWord(cp.w);
          Mini.mark(cp.w, cp.ok, performance.now() - cp.t, chest);
          Mini.advance(cp.ok, $('#cpFoot'), () => this.next(s));
        }
      } else {
        cp.ok = false; GX.shake(btn, 7); Mini.slip();
      }
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 6) { e.preventDefault(); const b = $(`#cpKeys .cp-key[data-i="${n - 1}"]`); if (b && !b.disabled) b.click(); } }
  },

  /* ---------- M1 · สายพานเข่งติ่มซำ (Dim Sum Conveyor Speed Sort — 100% Showcase Faithful) ---------- */
  dimsum: {
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table ds-arena" id="dsArena">
          <div class="pk-goal">${L('เข่งติ่มซำกำลังไหลไปตามสายพาน! รีบตัดสินก่อนตกขอบโต๊ะ', 'Dim sum steamer is gliding along the belt! Judge before it falls off!')}</div>
          <div class="ds-belt"><div class="ds-steamer" id="dsStm" style="left:15%"><b class="hz" id="dsZh"></b><small class="pyx" id="dsPy"></small><span id="dsTag"></span></div></div>
          <div class="ds-reveal" id="dsRev"></div>
        </div>
        <div class="m-panel">
          <div class="ds-acts" id="dsActs">
            <button class="btn danger lg" data-ds="0">✗ ${L('ส่งคืนครัว (แปลหลอก)', 'Reject (Fake)')} (1/←)</button>
            <button class="btn good lg" data-ds="1">✓ ${L('รับเสิร์ฟ (แปลตรง)', 'Serve (True)')} (2/→)</button>
          </div>
          <div class="m-foot" id="dsFoot"></div>
        </div>`;
      el.onclick = e => { const b = e.target.closest('[data-ds]'); if (b) this.judge(s, b.dataset.ds === '1'); };
      this.next(s);
      s.dsLast = performance.now();
      const loop = now => { if (!Mini.alive(s) || s.finished) return; s.raf = requestAnimationFrame(loop); this.step(s, now); };
      s.raf = requestAnimationFrame(loop);
    },
    stop(s) { cancelAnimationFrame(s.raf); },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], isTrue = Math.random() < 0.5, bad = distractors(w, 1)[0];
      const shownMean = isTrue || !bad ? meaningText(w) : meaningText(bad);
      s.ds = { w, isTrue: isTrue || !bad, shownMean, p: 0.14, ok: true, t: performance.now(), done: false };
      $('#dsZh').textContent = w.zh; $('#dsPy').textContent = w.py; $('#dsTag').textContent = shownMean;
      $('#dsRev').textContent = ''; $('#dsFoot').innerHTML = '';
      const stm = $('#dsStm'); stm.className = 'ds-steamer'; stm.style.left = '14%';
    },
    step(s, now) {
      const dt = Math.min((now - (s.dsLast || now)) / 1000, 0.1); s.dsLast = now;
      const ds = s.ds; if (!ds || ds.done || s.paused || document.hidden) return;
      ds.p += dt * 0.13;
      const stm = $('#dsStm');
      if (stm) stm.style.left = (ds.p * 100).toFixed(1) + '%';
      if (ds.p >= 0.88) {
        ds.p = 0.14; ds.ok = false;
        GX.shake(stm, 7); Mini.slip();
      }
    },
    judge(s, pickTrue) {
      const ds = s.ds; if (!ds || ds.done || s.paused) return;
      const arena = $('#dsArena'), stm = $('#dsStm'), [x, y] = GX.at(stm, arena);
      if (pickTrue === ds.isTrue) {
        ds.done = true; stm.classList.add('ok');
        GX.burst(arena, x, y, { n: 24, color: '#ffd27a', dist: 80 });
        GX.text(arena, x, y - 34, 'เสิร์ฟไว! +15', 'big');
        $('#dsRev').innerHTML = `<b class="hz">${esc(ds.w.zh)}</b> (${esc(ds.w.py)}) = <b>${esc(meaningText(ds.w))}</b>`;
        if (S().autoSpeak) speakWord(ds.w);
        Mini.mark(ds.w, ds.ok, performance.now() - ds.t, stm);
        Mini.advance(ds.ok, $('#dsFoot'), () => this.next(s));
      } else {
        ds.ok = false; GX.shake(stm, 8); Mini.slip();
      }
    },
    key(s, e) {
      if (e.key === '1' || e.key === 'ArrowLeft') { e.preventDefault(); this.judge(s, false); }
      else if (e.key === '2' || e.key === 'ArrowRight') { e.preventDefault(); this.judge(s, true); }
    }
  },

  /* ---------- N2 · ตะเกียงส่องหมอก (Lantern Fog Word Explorer — 100% Showcase Faithful) ---------- */
  lanternfog: {
    mount(s, el) {
      s.i = -1;
      el.innerHTML = `<div class="m-table lf-arena" id="lfArena">
          <div class="pk-goal" id="lfGoal"></div>
          <div class="lf-aura" id="lfAura"></div>
          <div class="lf-grid" id="lfGrid"></div>
        </div>
        <div class="m-panel"><div class="m-foot" id="lfFoot"></div></div>`;
      const arena = $('#lfArena'), aura = $('#lfAura');
      arena.onpointermove = e => {
        const r = arena.getBoundingClientRect();
        aura.style.left = (e.clientX - r.left) + 'px';
        aura.style.top = (e.clientY - r.top) + 'px';
      };
      el.onclick = e => { const b = e.target.closest('.lf-cell'); if (b) this.light(s, +b.dataset.i, b); };
      this.next(s);
    },
    next(s) {
      s.i++; if (s.i >= s.words.length) { Mini.finish(); return; }
      const w = s.words[s.i], chars = Array.from(w.zh).filter(c => /[㐀-鿿]/.test(c));
      const extra = [];
      for (const d of distractors(w, 5)) for (const c of Array.from(d.zh)) if (!chars.includes(c) && !extra.includes(c) && extra.length < 6 - chars.length) extra.push(c);
      const pool = shuffle([...chars, ...extra]).slice(0, 6);
      s.lf = { w, chars, pool, at: 0, ok: true, t: performance.now(), done: false };
      $('#lfGoal').innerHTML = `${ic('g-lanternfog')} ${L('ส่องตะเกียงค้นหาคำว่า:', 'Shine lantern to find:')} <b>${esc(meaningText(w))}</b> <small class="pyx">(${esc(w.py)})</small>`;
      $('#lfFoot').innerHTML = '';
      $('#lfGrid').innerHTML = pool.map((c, i) => `<button type="button" class="lf-cell hz" data-i="${i}"><kbd>${i + 1}</kbd>${esc(c)}</button>`).join('');
    },
    light(s, idx, btn) {
      const lf = s.lf; if (!lf || lf.done || s.paused || btn.classList.contains('lit')) return;
      const want = lf.chars[lf.at], got = lf.pool[idx], arena = $('#lfArena'), [x, y] = GX.at(btn, arena);
      if (got === want) {
        btn.classList.add('lit');
        GX.burst(arena, x, y, { n: 20, color: '#ffd27a', dist: 65 });
        lf.at++;
        if (lf.at >= lf.chars.length) {
          lf.done = true;
          GX.text(arena, x, y - 30, `${lf.w.zh} · ${lf.w.py} +20`, 'big');
          if (S().autoSpeak) speakWord(lf.w);
          Mini.mark(lf.w, lf.ok, performance.now() - lf.t, btn);
          Mini.advance(lf.ok, $('#lfFoot'), () => this.next(s));
        }
      } else {
        lf.ok = false; GX.shake(btn, 7); Mini.slip();
      }
    },
    key(s, e) { const n = +e.key; if (n >= 1 && n <= 6) { e.preventDefault(); const b = $(`#lfGrid .lf-cell[data-i="${n - 1}"]`); if (b) b.click(); } }
  }
};
