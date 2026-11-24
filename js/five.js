'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — คลังคำศัพท์ (the word library) in 5 languages
   Data: data/hsk.js (window.OFFY_DATA), made by แปล HSK1 5ภาษา/tools/export_offy.py:
   words → senses (th en zh vi ja + word classes + a sentence each) → characters → cross-language notes.
   Only the library changes; the rest of the app is v5 as it was. The 50 words also give the app their
   new Thai / English meanings and example sentence (games, quizzes), under the same ids as before.

   In the library:
   - a language panel under the search: ภาษาหลัก (large) · ภาษาเสริม (quiet lines) · ภาษาของคำอธิบาย
   - list rows in those languages; search in every language (no tone marks needed)
   - the word panel: 3 tabs — ความหมาย · ตัวอักษร (stroke order, radical, structure, 六书 …) · ข้ามภาษา
   ===================================================================== */

const FIVE = (() => {
  const D = window.OFFY_DATA || { words: [], chars: {}, labels: {}, packs: {} };
  const metaMap = new Map(D.words.filter(w => w.app).map(w => [w.app, w]));
  const fullMap = new Map(D.words.filter(w => w.app && w.senses).map(w => [w.app, w]));
  const CH = D.chars || (D.chars = {});
  const loaded = new Set(), loading = {};
  const registerPack = (lv, pack) => {
    const k = String(lv);
    if (pack && Array.isArray(pack.words)) {
      pack.words.forEach(w => { if (w && w.app) fullMap.set(w.app, w); });
    }
    if (pack && pack.chars) Object.assign(CH, pack.chars);
    loaded.add(k);
  };
  window.OFFY_VOCAB_PACK = registerPack;
  if (window._OFFY_VP) {
    Object.entries(window._OFFY_VP).forEach(([k, p]) => registerPack(k, p));
    delete window._OFFY_VP;
  }
  const ensurePack = lv => {
    const k = String(lv);
    if (loaded.has(k) || !D.packs || !D.packs[k]) return Promise.resolve();
    if (loading[k]) return loading[k];
    loading[k] = Fx.script(D.packs[k])
      .then(() => { loading[k] = null; })
      .catch(err => { loading[k] = null; throw err; });
    return loading[k];
  };
  return {
    D, byApp: fullMap, metaMap, CH, loaded, ensurePack,
    L5: ['th', 'en', 'zh', 'vi', 'ja'],
    SHOW: ['th', 'en', 'vi', 'ja'],                                  // Chinese is the core, always on
    NAME: { th: 'ไทย', en: 'English', zh: '中文', vi: 'Tiếng Việt', ja: '日本語' },
    SHORT: { th: 'TH', en: 'EN', zh: '中', vi: 'VI', ja: 'JA' },
    HL: { th: 'th', en: 'en', zh: 'zh-Hans', vi: 'vi', ja: 'ja' },
    get: id => fullMap.get(id), meta: id => metaMap.get(id), has: id => metaMap.has(id), count: metaMap.size
  };
})();

/* English for the new library text (the app shows Thai, or English when the menu is English) */
Object.assign(window.OFFY_EN || {}, {
  'ภาษา': 'Languages', 'ภาษาหลัก': 'Main language', 'ความหมายตัวใหญ่ และภาษาของคำอธิบาย': 'Large meanings, and the language of explanations',
  'ภาษาเสริม': 'Also show', 'แสดงบรรทัดเล็กใต้ความหมาย · เลือกได้หลายภาษา หรือไม่เลือกเลยก็ได้': 'Small lines under the meaning · any number, or none',
  'คำอธิบายเป็น': 'Explain in', 'ชนิดคำ หมายเหตุ และเกร็ดข้ามภาษา': 'Word classes, notes and cross-language tips', 'ตามภาษาหลัก': 'Main language',
  'ความหมาย': 'Meaning', 'ตัวอักษร': 'Characters', 'ข้ามภาษา': 'Across languages', 'ตัวเต็ม (ไต้หวัน)': 'Traditional (Taiwan)',
  'ประโยคหลักของคำ': 'Main sentence of the word', 'แปลภาษาอื่น': 'Other languages', 'ชนิดคำทั้ง 5 ภาษา': 'Word class in all 5 languages',
  'แหล่งอ้างอิงเห็นไม่ตรงกัน': 'Sources disagree', 'จำนวนขีด': 'Strokes', 'หมวดอักษร (部首)': 'Radical (部首)', 'ลำดับคังซีที่': 'Kangxi no.',
  'โครงสร้าง': 'Structure', 'ประเภทการสร้างอักษร (六书)': 'Formation (六书)', 'ส่วนประกอบ': 'Components', 'ส่วนบอกความหมาย / เสียง': 'Meaning / sound parts',
  'บอกความหมาย': 'meaning', 'บอกเสียง': 'sound', 'ตัวเต็ม': 'Traditional', 'เหมือนตัวย่อ': 'same as simplified', 'อ่านแบบ Hán Việt': 'Hán Việt reading',
  'รูปในภาษาญี่ปุ่น': 'Japanese form', 'อนโยมิ (音読み)': 'On reading (音読み)', 'คุนโยมิ (訓読み)': 'Kun reading (訓読み)', 'มีในคำ': 'Also in',
  'ลองเขียน': 'Try writing', 'โหลดข้อมูลลำดับขีดไม่ได้ (ต้องต่ออินเทอร์เน็ต)': 'Stroke data could not load (needs internet)', 'เขียนครบแล้ว': 'Well written',
  'คำที่เขียนเหมือนกัน': 'same written form', 'คำนี้มีในภาษาญี่ปุ่น แต่ไม่ค่อยใช้ในชีวิตประจำวัน': 'Exists in Japanese, but is not an everyday word',
  'คำนี้ยังไม่มีเกร็ดข้ามภาษา': 'No cross-language notes for this word yet', '5 ภาษา': '5 languages', 'คำก่อนหน้า': 'Previous word', 'คำถัดไป': 'Next word',
  'ข้อมูล 5 ภาษา': '5-language data', 'ลักษณนาม (量词)': 'Measure words (量词)', 'ไต้หวัน: ตัวเต็ม · เสียงอ่าน': 'Taiwan: traditional form · reading', 'เสียงอ่านแบบไต้หวัน': 'Taiwan reading', 'ค้นหา ตัวจีน · พินอิน · ไทย · English · Tiếng Việt · 日本語': 'Search: characters · pinyin · English · ไทย · Tiếng Việt · 日本語',
  'กำลังโหลดข้อมูล 5 ภาษา…': 'Loading 5-language data…', 'โหลดข้อมูล 5 ภาษาไม่ได้': 'Could not load 5-language data',
  'คำที่ใช้คู่กัน (搭配)': 'Collocations (搭配)', 'จุดที่มักพลาด': 'Common mistakes', 'คำใกล้เคียง / ระวังสับสน': 'Confusable words',
  'เปิดเทียบเต็มใน VOL. 12': 'Compare in VOL. 12', 'หมวดหัวข้อ HSK 3.0 (话题)': 'HSK 3.0 Topics (话题)', 'ทุกหัวข้อ (话题)': 'All topics (话题)'
});

const F5TOPIC_L1 = {
  '基本信息': ['ข้อมูลพื้นฐาน', 'Basic info'],
  '日常生活': ['ชีวิตประจำวัน', 'Daily life'],
  '教育情况': ['การศึกษา', 'Education'],
  '职场生活': ['การทำงาน', 'Work & career'],
  '文化与传统': ['วัฒนธรรมและประเพณี', 'Culture & tradition'],
  '当代社会': ['สังคมร่วมสมัย', 'Modern society'],
  '自然与环境': ['ธรรมชาติและสิ่งแวดล้อม', 'Nature & environment']
};
const f5topicName = zh => { const pair = F5TOPIC_L1[zh]; return pair ? (LANG === 'en' ? pair[1] : pair[0]) : zh; };

/* 5-language names of the character terms — key = the Chinese term as the data gives it */
const F5TERMS = {
  struct: {
    '独体': ['ตัวเดี่ยว', 'single component', '独体字', 'chữ độc thể', '単体'], '左中右': ['ซ้าย–กลาง–ขวา', 'left–middle–right', '左中右结构', 'trái – giữa – phải', '左中右'],
    '上中下': ['บน–กลาง–ล่าง', 'top–middle–bottom', '上中下结构', 'trên – giữa – dưới', '上中下'], '左右': ['ซ้าย–ขวา', 'left–right', '左右结构', 'trái – phải', '左右（へん・つくり）'],
    '上下': ['บน–ล่าง', 'top–bottom', '上下结构', 'trên – dưới', '上下（かんむり・あし）'], '左上包围': ['ล้อมซ้าย–บน', 'upper-left enclosure', '左上包围结构', 'bao trái – trên', '左上囲み（たれ）'],
    '右上包围': ['ล้อมขวา–บน', 'upper-right enclosure', '右上包围结构', 'bao phải – trên', '右上囲み'], '左下包围': ['ล้อมซ้าย–ล่าง', 'lower-left enclosure', '左下包围结构', 'bao trái – dưới', '左下囲み（にょう）'],
    '上三包围': ['ล้อมสามด้านจากบน', 'three-sided enclosure (open below)', '上三包围结构', 'bao ba mặt (hở dưới)', '三方囲み（下が開く）'],
    '下三包围': ['ล้อมสามด้านจากล่าง', 'three-sided enclosure (open above)', '下三包围结构', 'bao ba mặt (hở trên)', '三方囲み（上が開く）'],
    '左三包围': ['ล้อมสามด้านจากซ้าย', 'three-sided enclosure (open right)', '左三包围结构', 'bao ba mặt (hở phải)', '三方囲み（右が開く）'],
    '半包围': ['ล้อมครึ่งหนึ่ง', 'half enclosure', '半包围结构', 'nửa bao quanh', '半囲み'], '全包围': ['ล้อมรอบ', 'full enclosure', '全包围结构', 'bao quanh toàn bộ', '囲み（くにがまえ）'],
    '镶嵌': ['ฝังอยู่ตรงกลาง', 'inlaid', '镶嵌结构', 'lồng ghép', 'はめ込み'], '品字': ['ทรงสามส่วนแบบ 品', 'three-part 品 shape', '品字结构', 'hình chữ 品', '品字形']
  },
  six: {
    '会意兼形声': ['ผสมความหมาย และบอกเสียงด้วย', 'compound ideograph that also gives the sound', '会意兼形声', 'hội ý kiêm hình thanh', '会意兼形声'],
    '形声': ['อักษรผสม ส่วนหนึ่งบอกความหมาย ส่วนหนึ่งบอกเสียง', 'phono-semantic compound', '形声', 'hình thanh', '形声'], '象形': ['อักษรภาพ', 'pictograph', '象形', 'tượng hình', '象形'],
    '会意': ['อักษรผสมความหมาย', 'compound ideograph', '会意', 'hội ý', '会意'], '指事': ['อักษรชี้บอก', 'indicative', '指事', 'chỉ sự', '指事'],
    '转注': ['อักษรอธิบายกันเอง', 'derivative cognate', '转注', 'chuyển chú', '転注'], '假借': ['อักษรยืมเสียง', 'phonetic loan', '假借', 'giả tá', '仮借']
  }
};

/** HSK 3.0 词性 → the app's word-class names (core.js POS_ABBR / POS_KEY) */
const F5POS = { '名': 'noun', '动': 'verb', '形': 'adjective', '副': 'adverb', '代': 'pronoun', '数': 'number', '量': 'classifier', '介': 'preposition',
  '连': 'conjunction', '助': 'particle', '叹': 'interjection', '拟声': 'interjection', '前缀': 'prefix', '后缀': 'suffix', '—': 'phrase' };

/** fold for search: lower case, no tone marks / diacritics (Vietnamese đ → d), so "yeu" finds yêu */
function fold5(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd'); }

/* Every HSK 3.0 5-language word updates its matching RAW_WORDS entry (preserving ids & saved progress),
   AND words missing from legacy data/words.js (e.g. 红茶 and future HSK 5–6 words) are automatically synthesized into RAW_WORDS! */
(function adoptNewData() {
  const rawById = new Map(RAW_WORDS.map(w => [w.id, w]));
  FIVE.D.words.forEach(f => {
    if (!f || !f.app) return;
    const isSlim = !f.senses && !!f.m;
    const th = isSlim ? (f.m.th || '') : f.senses.slice(0, 2).map(m => m.th).join(' · ');
    const en = isSlim ? (f.m.en || '') : f.senses.slice(0, 2).map(m => m.en).join(' · ');
    const posCodes = isSlim ? (f.p || []) : [...new Set(f.senses.flatMap(m => m.cls.zh.map(([c]) => c.slice(3))))];
    const pos = [...new Set(posCodes.map(c => F5POS[c]).filter(Boolean))].join(', ');
    const sent = isSlim ? (f.s ? { zh: f.s[0], py: f.s[1], th: f.s[2], en: f.s[3] } : null) : f.sent;
    let w = rawById.get(f.app);
    if (!w) {
      w = { id: f.app, lvl: f.lvl, zh: f.zh, py: f.py, pos: pos || 'phrase', th, en, ex_zh: '', ex_py: '', ex_th: '', ex_en: '', _from5: true };
      RAW_WORDS.push(w);
      rawById.set(w.id, w);
    } else {
      w.th = th; w.en = en;
      if (pos) w.pos = pos;
    }
    w._f5 = true;
    if (sent) Object.assign(w, { ex_zh: sent.zh || '', ex_py: sent.py || '', ex_th: sent.th || '', ex_en: sent.en || '' });
    indexWord(w);
    const all = isSlim
      ? [f.m.th, f.m.en, f.m.vi, f.m.ja, f.x].filter(Boolean).join(' ').toLowerCase()
      : f.senses.map(m => [m.th, m.en, m.vi, m.ja.w, m.ja.k, m.ja.r].join(' ')).join(' ').toLowerCase();
    w._x = all; w._xf = fold5(all);
    const tIds = f.t || f.topics || [];
    const tDict = FIVE.D.topics || {};
    w._topics = tIds;
    w._t1 = [...new Set(tIds.map(tid => tDict[tid] && tDict[tid][1]).filter(Boolean))];
    w._quiz = f.q || (f.senses ? [...new Set(f.senses.flatMap(m => m.quiz || []))] : []);
  });
  if (typeof WORDS !== 'undefined' && WORDS.length && typeof Store !== 'undefined' && Store.d) buildWords();
})();

/* ---------- library settings (kept in Store.d.settings, so they travel with backups) ---------- */
function fiveS() {
  const s = S();
  if (!FIVE.SHOW.includes(s.lMain)) { s.lMain = s.lang === 'en' ? 'en' : 'th'; s.lExtra = FIVE.SHOW.filter(l => l !== s.lMain); }
  if (!Array.isArray(s.lExtra)) s.lExtra = [];
  s.lExtra = FIVE.SHOW.filter(l => l !== s.lMain && s.lExtra.includes(l));
  if (s.explain !== 'main' && !FIVE.L5.includes(s.explain)) s.explain = 'main';
  return s;
}
const f5main = () => fiveS().lMain;
const f5extra = () => fiveS().lExtra;
const f5shown = () => [f5main(), ...f5extra()];
const f5explain = () => { const s = fiveS(); return s.explain === 'main' ? s.lMain : s.explain; };

/* ---------- text helpers ---------- */
const f5L = l => `lang="${FIVE.HL[l]}"`;
const f5x = () => FIVE.L5.indexOf(f5explain());
const f5lab = code => { const n = FIVE.D.labels[code]; return n ? n[f5x()] : String(code).split(':').slice(1).join(':'); };
const f5tx = d => d ? (d[f5explain()] || d.th || '') : '';
function f5text(x, l, reading = true) {
  if (l !== 'ja') return esc(x[l] || '');
  const j = x.ja; if (!j) return '';
  return `${esc(j.w)}${reading ? `<small class="f-rd">${j.k !== j.w ? esc(j.k) + ' · ' : ''}${esc(j.r)}</small>` : ''}`;
}
const f5cls = tags => (tags || []).map(([c, sub]) => `${esc(f5lab(c))}${sub ? ` <span class="f-sub">${esc(f5lab(sub))}</span>` : ''}`).join(' / ');
function f5term(group, raw) {
  if (!raw) return '';
  const base = Object.keys(F5TERMS[group]).sort((a, b) => b.length - a.length).find(k => raw.startsWith(k));
  return base ? `${esc(F5TERMS[group][base][f5x()])} <span class="f-zt" lang="zh-Hans">${esc(raw)}</span>` : `<span lang="zh-Hans">${esc(raw)}</span>`;
}

/* ---------- speech in other languages (device voices; Chinese keeps the app's own voice setting) ---------- */
const Speak5 = {
  voice(l) {
    if (!TTS.ok) return null;
    const re = new RegExp(`^${l}([-_]|$)`, 'i'), vs = (speechSynthesis.getVoices() || []).filter(v => re.test(v.lang));
    return vs.find(v => /natural|online|premium|enhanced/i.test(v.name)) || vs[0] || null;
  },
  can(l) { return l === 'zh' ? TTS.ok : !!this.voice(l); },
  say(l, text) {
    if (!text) return;
    if (l === 'zh') { TTS.speak(text); return; }
    const v = this.voice(l); if (!v) return;
    TTS.stop();
    const u = new SpeechSynthesisUtterance(text); u.voice = v; u.lang = v.lang; u.rate = 0.92;
    setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) { } }, 60);
  }
};
const f5say = (l, text, cls = '') => Speak5.can(l) && text ? `<button class="f-say ${cls}" data-say5="${l}" data-t="${esc(text)}" aria-label="${T('ฟัง')} ${FIVE.NAME[l]}">${ic('vol')}</button>` : '';

/* ---------- language panel (folded under the library search) ---------- */
function f5panel(open) {
  const s = fiveS(), main = s.lMain;
  const sample = FIVE.D.sample || (FIVE.D.words[0] && (FIVE.D.words[0].m || (FIVE.D.words[0].senses && FIVE.D.words[0].senses[0])));
  const ex = l => sample ? (l === 'ja' ? (typeof sample.ja === 'object' ? sample.ja.w : sample.ja) : sample[l]) : FIVE.NAME[l];
  return `<details class="f-lp"${open ? ' open' : ''} data-lp>
    <summary><span class="f-lp-k">${ic('sliders')}${T('ภาษา')}</span><span class="f-lp-v"><b lang="zh-Hans">中文</b><span class="f-plus">+</span><b>${FIVE.NAME[main]}</b>${s.lExtra.length ? `<span class="f-lp-x">${s.lExtra.map(l => FIVE.SHORT[l]).join(' · ')}</span>` : ''}</span>${ic('chev-d')}</summary>
    <div class="f-lp-b">
      <div class="f-q"><div class="f-ql"><b>${T('ภาษาหลัก')}</b><small>${T('ความหมายตัวใหญ่ และภาษาของคำอธิบาย')}</small></div>
        <div class="f-opts" role="radiogroup" aria-label="${T('ภาษาหลัก')}">${FIVE.SHOW.map(l => `<button class="f-opt${l === main ? ' on' : ''}" role="radio" aria-checked="${l === main}" data-main5="${l}"><b>${FIVE.NAME[l]}</b><span ${f5L(l)}>${esc(ex(l))}</span></button>`).join('')}</div></div>
      <div class="f-q"><div class="f-ql"><b>${T('ภาษาเสริม')}</b><small>${T('แสดงบรรทัดเล็กใต้ความหมาย · เลือกได้หลายภาษา หรือไม่เลือกเลยก็ได้')}</small></div>
        <div class="f-opts">${FIVE.SHOW.filter(l => l !== main).map(l => { const on = s.lExtra.includes(l); return `<button class="f-opt f-chk${on ? ' on' : ''}" aria-pressed="${on}" data-x5l="${l}"><i>${ic('check')}</i><b>${FIVE.NAME[l]}</b><span ${f5L(l)}>${esc(ex(l))}</span></button>`; }).join('')}</div></div>
      <div class="f-q f-q2"><div class="f-ql"><b>${T('คำอธิบายเป็น')}</b><small>${T('ชนิดคำ หมายเหตุ และเกร็ดข้ามภาษา')}</small></div>
        <select class="f-sel" data-x5 aria-label="${T('คำอธิบายเป็น')}"><option value="main"${s.explain === 'main' ? ' selected' : ''}>${T('ตามภาษาหลัก')} (${FIVE.NAME[main]})</option>${FIVE.L5.map(l => `<option value="${l}"${s.explain === l ? ' selected' : ''}>${FIVE.NAME[l]}</option>`).join('')}</select></div>
    </div></details>`;
}
/** language choices: one handler for the panel wherever it is */
function f5langClick(e) {
  const mb = e.target.closest('[data-main5]');
  if (mb) { const s = fiveS(), l = mb.dataset.main5; if (l !== s.lMain) { s.lExtra = s.lExtra.filter(x => x !== l).concat(s.lMain); s.lMain = l; } return true; }
  const xb = e.target.closest('[data-x5l]');
  if (xb) { const s = fiveS(), l = xb.dataset.x5l; s.lExtra = s.lExtra.includes(l) ? s.lExtra.filter(x => x !== l) : s.lExtra.concat(l); return true; }
  return false;
}

/* ---------- word panel ---------- */
const F5UI = { tab: 'mean', panelOpen: false };

function f5sentence(sn, tag) {
  if (!sn) return '';
  const main = f5main(), extra = f5extra().filter(l => sn[l]);
  const mainText = main === 'ja' ? sn.ja && sn.ja.w : sn[main];
  const tw = sn.tw && sn.tw !== sn.zh;
  return `<figure class="f-ex">${tag ? `<figcaption>${tag}</figcaption>` : ''}
    <div class="f-exz"><div><p class="f-exzh" lang="zh-Hans">${esc(sn.zh)}</p><p class="f-expy pyx">${esc(sn.py)}</p></div>${f5say('zh', sn.zh, 'big')}</div>
    ${mainText ? `<p class="f-exm" ${f5L(main)}>${f5text(sn, main)}${f5say(main, mainText)}</p>` : ''}
    ${extra.length || tw ? `<details class="f-fold"><summary>${T('แปลภาษาอื่น')}</summary>
      ${extra.map(l => `<p class="f-sl" ${f5L(l)}><b>${FIVE.SHORT[l]}</b><span>${f5text(sn, l)}</span></p>`).join('')}
      ${tw ? `<p class="f-sl" lang="zh-Hant"><b>繁</b><span>${esc(sn.tw)}</span></p>` : ''}</details>` : ''}
  </figure>`;
}
/** the sense the measure words belong to: the first noun sense (none → not shown) */
const f5noun = f => f.senses.findIndex(m => m.cls.zh.some(([c]) => c === 'zh:名'));
/** 量词 from CC-CEDICT; a tap says 一个杯子 */
function f5measure(f) {
  if (!f.cl || !f.cl.length) return '';
  return `<div class="f-mw"><span class="f-mwk">${T('ลักษณนาม (量词)')}</span><div class="f-mwl">${f.cl.map(([c, py, note]) =>
    `<button class="f-mwc" data-say5="zh" data-t="一${esc(c)}${esc(f.zh)}" aria-label="一${esc(c)}${esc(f.zh)}"><b lang="zh-Hans">${esc(c)}</b><span class="pyx">${esc(py)}</span>${note ? `<small lang="en">${esc(note)}</small>` : ''}</button>`).join('')}</div>
    <span class="f-src">CC-CEDICT</span></div>`;
}
function f5coll(f) {
  const list = f.coll || []; if (!list.length) return '';
  const main = f5main(), ex = f5extra()[0];
  return `<section class="f-sec"><h4 class="f-sec-h"><span>${T('คำที่ใช้คู่กัน (搭配)')}</span><small>${list.length}</small></h4>
    <div class="f-colls">${list.map(c => `<div class="f-coll">
      <div class="f-coll-b">
        <div class="f-coll-zh" lang="zh-Hans">${esc(c.zh)}</div>
        ${c.pinyin ? `<div class="f-coll-py">${esc(c.pinyin)}</div>` : ''}
        ${c[main] ? `<div class="f-coll-m" ${f5L(main)}>${esc(c[main])}</div>` : ''}
        ${ex && c[ex] ? `<div class="f-coll-x" ${f5L(ex)}>${esc(c[ex])}</div>` : ''}
      </div>
      ${f5say('zh', c.zh)}
    </div>`).join('')}</div></section>`;
}
function f5errs(f) {
  const list = f.errs || []; if (!list.length) return '';
  return `<section class="f-sec"><h4 class="f-sec-h"><span>${T('จุดที่มักพลาด')}</span><small>${list.length}</small></h4>
    <div class="f-errs">${list.map(e => `<div class="f-err">
      <div class="f-err-row f-err-bad"><span class="f-err-mk">✗</span><span lang="zh-Hans">${esc(e.bad)}</span></div>
      <div class="f-err-row f-err-ok"><span class="f-err-mk">✓</span><span lang="zh-Hans">${esc(e.good)}</span>${f5say('zh', e.good)}</div>
      ${e.why ? `<p class="f-err-why">${esc(f5tx(e.why))}</p>` : ''}
    </div>`).join('')}</div></section>`;
}
function f5groups(f) {
  const ids = f.groups || [], gmap = FIVE.D.groups || {};
  const items = ids.map(gid => [gid, gmap[gid]]).filter(([, g]) => !!g);
  if (!items.length) return '';
  const byZh = new Map();
  FIVE.D.words.forEach(w => { if (w && w.zh && w.app && !byZh.has(w.zh)) byZh.set(w.zh, w.app); });
  return `<section class="f-sec"><h4 class="f-sec-h"><span>${T('คำใกล้เคียง / ระวังสับสน')}</span><small>${items.length}</small></h4>
    <div class="f-grps">${items.map(([gid, g]) => {
      const [title, ws, rTh, rEn] = g;
      const rule = LANG === 'en' ? (rEn || rTh) : (rTh || rEn);
      return `<div class="f-grp">
        <div class="f-grp-t" lang="zh-Hans">${esc(title)}</div>
        ${rule ? `<p class="f-grp-r">${esc(rule)}</p>` : ''}
        <div class="f-grp-f">
          <div class="f-grp-ws">${(ws || []).map(wzh => {
            const aid = byZh.get(wzh);
            return aid ? `<button type="button" class="${wzh === f.zh ? 'cur' : ''}" data-open5="${esc(aid)}" lang="zh-Hans">${esc(wzh)}</button>` : `<span class="f-tag" lang="zh-Hans">${esc(wzh)}</span>`;
          }).join('')}</div>
          <button type="button" class="f-grp-book" data-openg="synonym/${esc(gid)}">${T('เปิดเทียบเต็มใน VOL. 12')} →</button>
        </div>
      </div>`;
    }).join('')}</div></section>`;
}
function f5topics(f) {
  const tids = f.topics || [], tmap = FIVE.D.topics || {};
  const seen = new Set(), items = [];
  tids.forEach(tid => {
    const t = tmap[tid]; if (!t) return;
    const key = t[1] + '|' + t[2];
    if (seen.has(key)) return;
    seen.add(key); items.push(t);
  });
  if (!items.length) return '';
  return `<section class="f-sec"><h4 class="f-sec-h"><span>${T('หมวดหัวข้อ HSK 3.0 (话题)')}</span><small>${items.length}</small></h4>
    <div class="f-tops">${items.map(t => `<button type="button" class="f-top" data-topic5="${esc(t[1])}">
      <b>${esc(f5topicName(t[1]))}</b><small lang="zh-Hans">${esc(t[2] || t[1])}</small>
    </button>`).join('')}</div></section>`;
}
function f5meaning(f) {
  const s = fiveS(), many = f.senses.length > 1, ex = f5explain();
  return `<div class="f-senses">${f.senses.map((m, i) => {
    const sn = m.sent === 'word' ? f.sent : m.sent;
    const alts = s.lExtra.map(l => `<div><dt>${FIVE.SHORT[l]}</dt><dd ${f5L(l)}>${f5text(m, l)}</dd></div>`).join('');
    return `<article class="f-sense" style="--i:${i}">
      <div class="f-sh">${many ? `<span class="f-n">${i + 1}</span>` : ''}<span class="f-pos">${f5cls(m.cls.zh)}</span>${m.lvl !== f.lvl ? `<span class="f-lv">HSK ${esc(m.lvl)}</span>` : ''}</div>
      <p class="f-main" ${f5L(s.lMain)}>${f5text(m, s.lMain)}</p>
      ${ex === 'zh' ? `<p class="f-def" lang="zh-Hans">${esc(m.zh)}</p>` : ''}
      ${alts ? `<dl class="f-alt">${alts}</dl>` : ''}
      ${i === f5noun(f) ? f5measure(f) : ''}
      ${f5sentence(sn, m.sent === 'word' && many ? T('ประโยคหลักของคำ') : '')}
      <details class="f-fold f-more"><summary>${T('ชนิดคำทั้ง 5 ภาษา')}</summary>
        <table class="f-ct">${FIVE.L5.map(l => `<tr><th>${FIVE.NAME[l]}</th><td>${f5cls(m.cls[l])}</td></tr>`).join('')}</table>
        ${ex !== 'zh' ? `<p class="f-def"><b lang="zh-Hans">释义</b> <span lang="zh-Hans">${esc(m.zh)}</span></p>` : ''}
        ${m.clsNote ? `<p class="f-note">${esc(f5tx(m.clsNote))}</p>` : ''}
      </details>
    </article>`;
  }).join('')}</div>${f5coll(f)}${f5errs(f)}${f5groups(f)}${f5topics(f)}`;
}
/** ⿰又寸 → 又 + 寸 (the ⿰⿱… layout signs have no glyph in most Chinese fonts; the structure line says the layout) */
const f5parts = ids => { const p = Array.from(ids || '').filter(x => !/[⿰-⿿]/.test(x)); return p.length > 1 ? `<span class="f-ids" lang="zh-Hans">${p.map(esc).join('<i>+</i>')}</span>` : ''; };
/** KANJIDIC kun reading: "こた.える" → こた + dimmed okurigana える */
const f5kun = k => { const [a, b] = k.split('.'); return `${esc(a)}${b ? `<span class="f-okuri">${esc(b)}</span>` : ''}`; };
function f5chars(f) {
  const fact = (k, v) => v ? `<div class="f-fact"><dt>${T(k)}</dt><dd>${v}</dd></div>` : '';
  const srcs = (g, x) => !x ? '' : `${f5term(g, (x.v.find(v => v[1]) || [])[1])}${!x.same ? `<details class="f-fold f-srcs"><summary>${T('แหล่งอ้างอิงเห็นไม่ตรงกัน')}</summary>${x.v.filter(v => v[1]).map(([n, v]) => `<p><b>${esc(n)}</b> ${f5term(g, v)}</p>`).join('')}</details>` : ''}`;
  return `<div class="f-chars">${f.chars.map((c, i) => {
    const ch = FIVE.CH[c]; if (!ch) return '';
    const others = FIVE.D.words.filter(x => x.zh.includes(c) && x.id !== f.id && x.app).slice(0, 8);
    return `<section class="f-char" id="f5ch-${i}" style="--i:${i}">
      <div class="f-stroke"><div class="f-sbox" data-writer="${esc(c)}" lang="zh-Hans"><span>${esc(c)}</span></div>
        <div class="f-sbtns"><button class="btn sm" data-anim5="${esc(c)}">${ic('brush')}${T('ลำดับขีด')}</button><button class="btn sm" data-quiz5="${esc(c)}">${ic('pen')}${T('ลองเขียน')}</button></div></div>
      <div><dl class="f-facts">
        ${fact('จำนวนขีด', ch.strokes ? `<b class="f-num">${ch.strokes}</b>` : '')}
        ${fact('หมวดอักษร (部首)', ch.rad ? `<span class="f-big" lang="zh-Hans">${esc(ch.rad[0])}</span> <small>${T('ลำดับคังซีที่')} ${ch.rad[1]}</small>` : '')}
        ${fact('โครงสร้าง', srcs('struct', ch.struct))}
        ${fact('ประเภทการสร้างอักษร (六书)', srcs('six', ch.six))}
        ${fact('ส่วนประกอบ', f5parts(ch.ids))}
        ${fact('ส่วนบอกความหมาย / เสียง', ch.sem || ch.pho ? `${ch.sem ? `<span class="f-pp"><small>${T('บอกความหมาย')}</small><b lang="zh-Hans">${esc(ch.sem)}</b></span>` : ''}${ch.pho ? `<span class="f-pp"><small>${T('บอกเสียง')}</small><b lang="zh-Hans">${esc(ch.pho)}</b></span>` : ''}` : '')}
      </dl><dl class="f-facts f-facts2">
        ${fact('ตัวเต็ม', ch.tw.length ? `<span class="f-big" lang="zh-Hant">${esc(ch.tw.join(' '))}</span>${ch.tw.length === 1 && ch.tw[0] === c ? ` <small>${T('เหมือนตัวย่อ')}</small>` : ''}` : '')}
        ${fact('อ่านแบบ Hán Việt', ch.hv ? `<span lang="vi">${esc(ch.hv)}</span>` : '')}
        ${fact('รูปในภาษาญี่ปุ่น', ch.jp ? `<span class="f-big" lang="ja">${esc(ch.jp)}</span>${ch.jp === c ? ` <small>${T('เหมือนตัวย่อ')}</small>` : ''}` : '')}
        ${fact('อนโยมิ (音読み)', ch.on.length ? `<span lang="ja">${esc(ch.on.join('、'))}</span>` : '')}
        ${fact('คุนโยมิ (訓読み)', ch.kun.length ? `<span lang="ja">${ch.kun.map(f5kun).join('、')}</span>` : '')}
      </dl>
      ${others.length ? `<p class="f-also">${T('มีในคำ')} ${others.map(x => `<button data-open5="${esc(x.app)}" lang="zh-Hans">${esc(x.zh)}</button>`).join('')}</p>` : ''}</div>
    </section>`;
  }).join('')}</div>`;
}
const f5crossN = f => (f.hv && f.hv.read ? 1 : 0) + (f.jp ? 1 : 0) + f.notes.length;
function f5cross(f) {
  const out = [];
  if (f.hv && f.hv.read) out.push(`<section class="f-x f-x-vi"><div class="f-xh"><span class="f-xk">Tiếng Việt · Hán Việt</span><span class="f-tag t-${esc(f.hv.use)}">${esc(f5lab('hánviệt:' + f.hv.use))}</span></div>
    <p class="f-xw" lang="vi">${esc(f.hv.read)}</p><p class="f-xt">${esc(f5tx(f.hv.note))}</p></section>`);
  if (f.jp) out.push(`<section class="f-x f-x-ja"><div class="f-xh"><span class="f-xk">日本語 · ${T('คำที่เขียนเหมือนกัน')}</span><span class="f-tag t-${esc(f.jp.cmp)}">${esc(f5lab('เทียบจีน:' + f.jp.cmp))}</span></div>
    <p class="f-xw" lang="ja">${esc(f.jp.w)}<small>${esc(f.jp.k)}</small></p>${f.jp.common === false ? `<p class="f-xn">${T('คำนี้มีในภาษาญี่ปุ่น แต่ไม่ค่อยใช้ในชีวิตประจำวัน')}</p>` : ''}<p class="f-xt">${esc(f5tx(f.jp.note))}</p></section>`);
  f.notes.forEach(n => out.push(`<section class="f-x f-x-${esc(n.about)}"><div class="f-xh"><span class="f-xk">${FIVE.NAME[n.about]}</span></div><p class="f-xt">${esc(f5tx(n.text))}</p></section>`));
  return out.length ? `<div class="f-xs">${out.join('')}</div>` : `<p class="f-empty">${T('คำนี้ยังไม่มีเกร็ดข้ามภาษา')}</p>`;
}
/** prev / next among the five-language words of the current library list */
function f5neighbours(id) {
  const list = (Dict.res || WORDS).filter(w => FIVE.has(w.id)).map(w => w.id);
  const ids = list.includes(id) ? list : FIVE.D.words.map(w => w.app).filter(Boolean);
  const i = ids.indexOf(id);
  return { i, n: ids.length, prev: ids[i - 1], next: ids[i + 1] };
}
function f5word(f, id) {
  const nb = f5neighbours(id), tabs = [['mean', 'ความหมาย', f.senses.length], ['char', 'ตัวอักษร', f.chars.length], ['cross', 'ข้ามภาษา', f5crossN(f)]];
  return `<div class="f-nav"><button class="ibtn sm" data-go5="${esc(nb.prev || '')}" ${nb.prev ? '' : 'disabled'} aria-label="${T('คำก่อนหน้า')}">${ic('chev-l')}</button>
      <span>${nb.i + 1} / ${nb.n}</span><button class="ibtn sm" data-go5="${esc(nb.next || '')}" ${nb.next ? '' : 'disabled'} aria-label="${T('คำถัดไป')}">${ic('chev-r')}</button></div>
    <div class="f-tabs" role="tablist">${tabs.map(([k, n, c]) => `<button role="tab" aria-selected="${F5UI.tab === k}" data-tab5="${k}">${T(n)}${c ? `<small>${c}</small>` : ''}</button>`).join('')}</div>
    <div class="f-tabp" role="tabpanel">${F5UI.tab === 'char' ? f5chars(f) : F5UI.tab === 'cross' ? f5cross(f) : f5meaning(f)}</div>`;
}

/* ---------- stroke order (hanzi-writer, loaded on first use) ---------- */
async function f5strokes(box, c, quiz) {
  try { await Fx.script('https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js'); } catch (e) { }
  if (!window.HanziWriter) { toast(`${T('โหลดข้อมูลลำดับขีดไม่ได้ (ต้องต่ออินเทอร์เน็ต)')}`, { icon: 'info' }); return; }
  const dark = currentTheme() === 'dark', size = box.clientWidth || 170;
  box.innerHTML = ''; box.classList.add('live');
  const hw = HanziWriter.create(box, c, { width: size, height: size, padding: 10, showOutline: true, showCharacter: false, strokeAnimationSpeed: 1.1, delayBetweenStrokes: 220,
    strokeColor: dark ? '#ebeee8' : '#1b1d1a', outlineColor: dark ? '#2f342f' : '#e7e3d9', radicalColor: dark ? '#5ec69b' : '#1f6f54', drawingColor: dark ? '#5ec69b' : '#1f6f54',
    onLoadCharDataError: () => toast(`${T('โหลดข้อมูลลำดับขีดไม่ได้ (ต้องต่ออินเทอร์เน็ต)')}`, { icon: 'info' }) });
  if (quiz) hw.quiz({ onComplete: () => { sfx('complete'); toast(`${T('เขียนครบแล้ว')}`, { icon: 'check' }); } }); else hw.animateCharacter();
}

/* ---------- the word panel of the library (Dict.detail) ---------- */
(function patchSheet() {
  const open = Sheet.open;
  Sheet.open = function (...a) { $('#sheet').classList.remove('f-wide'); return open.apply(this, a); };
})();
(function patchDetail() {
  const base = Dict.detail;
  let detailTok = 0;
  function mountFull(f, id, body, box) {
    const head = $('.d-head', body); if (!head) return;
    $$('.d-th, .d-en, .d-tw', head).forEach(e => e.remove());
    const norm = p => String(p || '').toLowerCase().replace(/[\s'-]/g, ''), twRd = (f.twPy || []).find(p => norm(p) !== norm(f.py));
    if ((f.tw && f.tw !== f.zh) || twRd) $('.d-py', head).insertAdjacentHTML('afterend', `<div class="d-tw">${f.tw && f.tw !== f.zh ? `<span lang="zh-Hant">${esc(f.tw)}</span>` : ''}${twRd ? `<span class="pyx">${esc(twRd)}</span>` : ''}<small>${T(!twRd ? 'ตัวเต็ม (ไต้หวัน)' : f.tw && f.tw !== f.zh ? 'ไต้หวัน: ตัวเต็ม · เสียงอ่าน' : 'เสียงอ่านแบบไต้หวัน')}</small></div>`);
    const ex = $('.ex-card', body); if (ex) ex.remove();
    const strokesBtn = $('[data-say="strokes"]', body); if (strokesBtn) strokesBtn.remove();
    const paint = () => { box.innerHTML = f5word(f, id); };
    paint();
    box.onclick = e => {
      const b = e.target.closest('[data-tab5],[data-go5],[data-open5],[data-anim5],[data-quiz5],[data-say5],[data-topic5],[data-openg]'); if (!b) return;
      const d = b.dataset;
      if (d.tab5) { F5UI.tab = d.tab5; sfx('tap'); paint(); return; }
      if (d.go5) { Dict.detail(d.go5); return; }
      if (d.open5) { Dict.detail(d.open5); return; }
      if (d.anim5 || d.quiz5) { const c = d.anim5 || d.quiz5; f5strokes(b.closest('.f-char').querySelector('.f-sbox'), c, !!d.quiz5); return; }
      if (d.say5) { Speak5.say(d.say5, d.t); return; }
      if (d.topic5) {
        sfx('tap'); Sheet.close();
        Dict.preset = { lvl: 'all', topic: d.topic5, _five: true };
        if (currentView === 'v-dict') Dict.show(); else Router.go('/dict');
        return;
      }
      if (d.openg) { sfx('tap'); Sheet.close(); Router.go('/book/' + d.openg); }
    };
    const hz = $('.d-hz', head);
    if (hz) { hz.innerHTML = Array.from(f.zh).map((c, i) => `<button class="f-hc" data-ci="${i}" aria-label="${esc(c)} · ${T('ตัวอักษร')}">${esc(c)}</button>`).join(''); hz.onclick = e => {
      const b = e.target.closest('[data-ci]'); if (!b) return; const c = Array.from(f.zh)[+b.dataset.ci], k = f.chars.indexOf(c);
      F5UI.tab = 'char'; paint(); const sec = $('#f5ch-' + k, box); if (sec) { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => f5strokes($('.f-sbox', sec), c), 380); } }; }
  }
  Dict.detail = function (id) {
    base.call(this, id);
    const meta = FIVE.meta(id), body = $('#sheetBody'); if (!meta || !body) return;
    const head = $('.d-head', body); if (!head) return;
    $('#sheet').classList.add('f-wide');
    const box = document.createElement('div'); box.className = 'f5';
    ($('#dStrokes', body) || head).after(box);
    const f = FIVE.get(id);
    if (f) { mountFull(f, id, body, box); return; }
    const tok = ++detailTok;
    box.innerHTML = `<p class="muted b5-loading">${T('กำลังโหลดข้อมูล 5 ภาษา…')}</p>`;
    FIVE.ensurePack(meta.lvl).then(() => {
      if (tok !== detailTok || !box.isConnected) return;
      const loaded = FIVE.get(id);
      if (loaded) mountFull(loaded, id, body, box);
      else box.innerHTML = `<p class="muted">${T('โหลดข้อมูล 5 ภาษาไม่ได้')}</p>`;
    }).catch(() => {
      if (tok === detailTok && box.isConnected) box.innerHTML = `<p class="muted">${T('โหลดข้อมูล 5 ภาษาไม่ได้')}</p>`;
    });
  };
})();

/* ---------- the library list ---------- */
/** list rows of the 5-language words: the main language, then the first extra language, quieter (used by core meanHTML) */
function f5rowMean(w) {
  const f = FIVE.meta(w.id); if (!f) return '';
  const main = f5main(), x = f5extra()[0];
  const pick = l => f.m ? (f.m[l] || '') : f.senses.slice(0, 2).map(m => l === 'ja' ? m.ja.w : m[l]).join(' · ');
  return `<span class="f-rm" ${f5L(main)}>${esc(pick(main))}</span>${x ? `<span class="f-rx" ${f5L(x)}> · ${esc(pick(x))}</span>` : ''}`;
}
(function patchDict() {
  const show = Dict.show, render = Dict.render, search = Dict.search;
  const keep = () => { if (Dict.st.lvl === 'five') { Dict.st._five = true; Dict.st.lvl = 'all'; } };
  const host = document.createElement('div'); host.id = 'f5lang';
  $('#v-dict .q-bar').appendChild(host);
  const paint = () => { if (typeof Store !== 'undefined' && Store.d) host.innerHTML = f5panel(F5UI.panelOpen); };
  const topicSel = $('#qTopic');
  function fillTopics() {
    if (!topicSel) return;
    const cnt = {};
    WORDS.forEach(w => { (w._t1 || []).forEach(t => { cnt[t] = (cnt[t] || 0) + 1; }); });
    const keys = Object.keys(F5TOPIC_L1).filter(k => cnt[k]).concat(Object.keys(cnt).filter(k => !F5TOPIC_L1[k]));
    topicSel.innerHTML = `<option value="">${T('ทุกหัวข้อ (话题)')}</option>` + keys.map(k => `<option value="${esc(k)}">${esc(f5topicName(k))} ${esc(k)} (${cnt[k]})</option>`).join('');
    topicSel.value = Dict.st.topic || '';
  }
  if (topicSel) {
    topicSel.onchange = e => { Dict.st.topic = e.target.value; Dict.st.limit = 120; Dict.render(); };
  }
  Dict.search = function (q, pool) {
    const res = search.call(this, q, pool), raw = q.trim().toLowerCase(); if (!raw) return res;
    const fq = fold5(raw); if (fq.length < 2) return res;
    const have = new Set(res), rest = pool.filter(w => w._x && !have.has(w));
    const exact = rest.filter(w => w._x.includes(raw)), loose = rest.filter(w => !w._x.includes(raw) && w._xf.includes(fq));
    return res.concat(exact, loose);                              // typed with marks → those first, then "yeu" ≈ yêu
  };
  Dict.show = function () {
    let wantFive = null, wantTopic = null;
    if (this.preset) {
      if (this.preset.lvl === 'five') { wantFive = true; this.preset.lvl = 'all'; }
      else if (this.preset._five !== undefined) wantFive = !!this.preset._five;
      if (this.preset.topic !== undefined) wantTopic = this.preset.topic;
    }
    keep(); show.call(this);
    if (wantFive !== null) this.st._five = wantFive;
    if (wantTopic !== null) this.st.topic = wantTopic;
    $('#qLevels').insertAdjacentHTML('afterbegin', `<button class="chip f-chip" data-l="five"><span class="dot"></span>${T('5 ภาษา')} <small>${FIVE.count}</small></button>`);
    fillTopics();
    paint();
    this.render();
  };
  Dict.render = function () {
    keep();
    const st = this.st, five = !!st._five, topic = st.topic || '';
    if (topicSel && topicSel.value !== topic) topicSel.value = topic;
    if (!five && !topic) {
      render.call(this);
      $$('#qLevels .f-chip').forEach(b => b.classList.remove('on'));
      return;
    }
    const origW = WORDS, origBy = BY_LVL;
    WORDS = origW.filter(w => (!five || FIVE.has(w.id)) && (!topic || (w._t1 && w._t1.includes(topic))));
    BY_LVL = {};
    WORDS.forEach(w => { (BY_LVL[w.lvl] = BY_LVL[w.lvl] || []).push(w); });
    try { render.call(this); } finally { WORDS = origW; BY_LVL = origBy; }
    $$('#qLevels .f-chip').forEach(b => b.classList.toggle('on', five));
    $$('#qLevels .chip:not(.f-chip)').forEach(b => b.classList.toggle('on', b.dataset.l === st.lvl));
  };
  $('#qLevels').addEventListener('click', e => {
    const b = e.target.closest('[data-l]'); if (!b) return;
    const lv = b.dataset.l;
    if (lv === 'five') {
      e.stopImmediatePropagation();
      Dict.st._five = !Dict.st._five;
      // If turning 5-lang ON while viewing a level that has no 5-lang entries yet, switch level to 'all'
      if (Dict.st._five && Dict.st.lvl !== 'all') {
        const curPool = levelWords(Dict.st.lvl === 'C' ? 'C' : +Dict.st.lvl);
        if (!curPool.some(w => FIVE.has(w.id))) Dict.st.lvl = 'all';
      }
      Dict.st.limit = 120;
      Dict.render();
      return;
    }
    // Switching to another level: keep _five ON if that level has 5-lang words, else auto-clear _five so user never hits 0 words
    if (Dict.st._five && lv !== 'all') {
      const nextPool = levelWords(lv === 'C' ? 'C' : +lv);
      if (!nextPool.some(w => FIVE.has(w.id))) Dict.st._five = false;
    }
  }, true);
  $('#qInput').placeholder = `${T('ค้นหา ตัวจีน · พินอิน · ไทย · English · Tiếng Việt · 日本語')}`;
  paint();
  host.addEventListener('toggle', e => { if (e.target.matches('[data-lp]')) F5UI.panelOpen = e.target.open; }, true);
  host.addEventListener('click', e => { if (f5langClick(e)) { Store.save(); sfx('tap'); paint(); Dict.render(); } });
  host.addEventListener('change', e => { if (e.target.matches('[data-x5]')) { fiveS().explain = e.target.value; Store.save(); paint(); } });
})();

/* if loaded after boot already drew the library, redraw it */
if (typeof currentView !== 'undefined' && currentView === 'v-dict') Dict.show();
