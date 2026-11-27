'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — VOL. 14 数字与计算 (js/numbook.js) · route #/book/numbers
   · Live number reader: any integer up to 16 digits, decimals, negatives → Chinese (with the 零 / 一十 / 两 rules) + pinyin,
     shown in 4-digit 万 groups next to the Thai place names (แสน / ล้าน trap for Thai speakers)
   · Phone / room numbers digit by digit (1 = 幺 yāo) · ordinals 第 · fractions 分之 · percent 百分之 · decimals 点
   · Arithmetic 加 减 乘 除以 等于 with a listen-and-answer trainer · money 块毛分 / 元角分 · approximations
   · Inputs are plain text fields, so Apple Pencil Scribble writes straight into them
   Pinyin keeps 一 / 不 in their original tones (project rule).
   ===================================================================== */
(function numbook() {
  const ID = 'numbers';
  const icn = (n, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}"><use href="#i-${n}"/></svg>`;
  const S = () => (typeof Store !== 'undefined' && Store.d && Store.d.settings) ? Store.d.settings : {};
  const save = () => { try { Store.save(); } catch (e) {} };
  const en = () => { const l = S().rbLang; return l ? l === 'en' : (typeof LANG !== 'undefined' && LANG === 'en'); };
  const L = (th, e) => (en() ? e : th);
  const say = t => { if (typeof TTS !== 'undefined') TTS.speak(t); };

  /* ---------- the reader ---------- */
  const D = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const PY = { 零: 'líng', 一: 'yī', 二: 'èr', 两: 'liǎng', 三: 'sān', 四: 'sì', 五: 'wǔ', 六: 'liù', 七: 'qī', 八: 'bā', 九: 'jiǔ',
    十: 'shí', 百: 'bǎi', 千: 'qiān', 万: 'wàn', 亿: 'yì', 点: 'diǎn', 负: 'fù', 幺: 'yāo', 分: 'fēn', 之: 'zhī', 第: 'dì', 块: 'kuài', 毛: 'máo', 元: 'yuán', 角: 'jiǎo' };
  const UNIT = new Set(['十', '百', '千', '万', '亿']);
  const NUMC = new Set([...'一二两三四五六七八九十百千万']);
  Object.assign(PY, { 加: 'jiā', 减: 'jiǎn', 乘: 'chéng', 以: 'yǐ', 除: 'chú', 等: 'děng', 于: 'yú', 多: 'duō', 少: 'shao', 半: 'bàn' });
  function pinyin(zh) {                                   // digit+unit joined (yībǎi), 零 apart
    const out = []; let prev = '';
    for (const c of zh) {
      const p = PY[c] || c;
      if (UNIT.has(c) && out.length && /[a-zÀ-ɏ]$/.test(out[out.length - 1]) && out[out.length - 1] !== 'líng' && NUMC.has(prev)) out[out.length - 1] += p;
      else out.push(p);
      prev = c;
    }
    return out.join(' ');
  }
  function group4(n, leading) {                            // 0 < n < 10000
    const ds = String(n).padStart(4, '0').split('').map(Number), pl = ['千', '百', '十', ''];
    let s = '', zero = false, started = false;
    ds.forEach((d, i) => {
      if (d === 0) { if (started) zero = true; return; }
      if (zero) { s += '零'; zero = false; }
      s += (pl[i] === '十' && d === 1 && leading && !started) ? '十' : D[d] + pl[i];
      started = true;
    });
    return s;
  }
  function intZh(str) {                                   // str: digits only
    str = str.replace(/^0+(?=\d)/, '');
    if (str === '0') return '零';
    const groups = []; for (let i = str.length; i > 0; i -= 4) groups.unshift(+str.slice(Math.max(0, i - 4), i));
    const names = ['', '万', '亿', '万亿'];
    let out = '', gap = false;
    groups.forEach((g, i) => {
      const unit = names[groups.length - 1 - i];
      if (g === 0) { if (out) gap = true; if (unit === '亿' && out && !out.endsWith('亿')) out += '亿'; return; }
      if (out && (gap || g < 1000)) out += '零';
      out += group4(g, !out) + unit; gap = false;
    });
    return out.replace(/零+/g, '零').replace(/零$/, '');
  }
  const liang = zh => zh.replace(/(^|零|万|亿)二(?=[千万亿])/g, '$1两').replace(/^二(?=百)/, '两');
  function readNum(raw) {
    const s = String(raw).trim().replace(/[,\s，]/g, '');
    const m = s.match(/^(-)?(\d{1,16})(?:\.(\d{1,8}))?$/); if (!m) return null;
    let zh = (m[1] ? '负' : '') + intZh(m[2]) + (m[3] ? '点' + [...m[3]].map(d => D[+d]).join('') : '');
    const common = liang(zh);
    return { zh, common, py: pinyin(zh), cpy: pinyin(common), int: m[2], neg: !!m[1], dec: m[3] };
  }
  window.ZhNum = { read: readNum, intZh, pinyin };

  /* ---------- state ---------- */
  const st = { tab: 'read', num: '123456789', phone: '13812345678', frac: [1, 3], pct: '50', money: '12.50', op: '+', prob: null, pr: null };

  function groupsHtml(int) {
    const groups = []; for (let i = int.length; i > 0; i -= 4) groups.unshift(int.slice(Math.max(0, i - 4), i));
    const names = ['', '万', '亿', '万亿'], th = [L('หน่วย–พัน', 'ones–thousands'), L('หมื่น–สิบล้าน', '×10,000'), L('ร้อยล้าน–แสนล้าน', '×100 million'), L('ล้านล้าน', '×10¹²')];
    return groups.map((g, i) => { const k = groups.length - 1 - i;
      return `<div class="nb-g"><b>${g}</b><span lang="zh-Hans">${names[k] || L('(หน่วย)', '(units)')}</span><small>${th[k]}</small></div>`; }).join('');
  }
  function row(zh, py, tag) {
    return `<div class="rb-expr"><span class="rb-expr-tag">${esc(tag)}</span><div class="rb-expr-main"><b lang="zh-Hans">${esc(zh)}</b><span class="pyx">${esc(py)}</span></div><button type="button" class="gx-say sm" data-nbsay="${esc(zh)}" aria-label="${L('ฟังเสียง', 'Listen')}">${icn('vol')}</button></div>`;
  }
  function readOut() {
    const r = readNum(st.num);
    if (!r) return `<p class="tb-note">${L('พิมพ์ตัวเลข เช่น 105, 2000, 30500, 1.25 หรือ -7 (สูงสุด 16 หลัก)', 'Type a number such as 105, 30500, 1.25 or -7')}</p>`;
    return `${row(r.zh, r.py, L('อ่านแบบมาตรฐาน', 'Standard'))}${r.common !== r.zh ? row(r.common, r.cpy, L('พูดทั่วไป (ใช้ 两)', 'Everyday (两)')) : ''}
      <div class="nb-groups">${groupsHtml(r.int)}</div>`;
  }

  function readTab() {
    const trap = [['1万', 'yīwàn', 'หนึ่งหมื่น', '10,000'], ['10万', 'shíwàn', 'หนึ่งแสน', '100,000'], ['100万', 'yībǎiwàn', 'หนึ่งล้าน', '1,000,000'],
      ['1000万', 'yīqiānwàn', 'สิบล้าน', '10,000,000'], ['1亿', 'yīyì', 'ร้อยล้าน', '100,000,000'], ['10亿', 'shíyì', 'พันล้าน', '1,000,000,000']];
    const rules = [
      ['零', L('ศูนย์ตรงกลางอ่าน 零 ครั้งเดียว ศูนย์ท้ายไม่อ่าน', 'Inner zeros → one 零; trailing zeros silent'), [['105', '一百零五'], ['1005', '一千零五'], ['1050', '一千零五十'], ['30500', '三万零五百']]],
      ['一十', L('10–19 ขึ้นต้นด้วย 十 · แต่ถ้าอยู่กลางเลขต้องมี 一: 110 = 一百一十', '10–19 start with 十, but mid-number keeps 一: 一百一十'), [['12', '十二'], ['110', '一百一十'], ['2010', '两千零一十']]],
      ['二 / 两', L('นับของ / หน้า 千 万 亿 ใช้ 两 · หลักหน่วย 12, 20, ลำดับที่ ใช้ 二 · หน้า 百 ใช้ได้ทั้งคู่', '两 for counting and before 千/万/亿; 二 in 12, 20, ordinals; both before 百'), [['2000', '两千'], ['22', '二十二'], ['200', '二百 / 两百'], ['第2', '第二']]],
      ['第', L('ลำดับที่: 第 + ตัวเลข (ไม่ใช้ 两)', 'Ordinals: 第 + number (never 两)'), [['ที่ 1', '第一'], ['ที่ 2', '第二'], ['ชั้น 3', '三楼'], ['บทที่ 5', '第五课']]]];
    return `<section class="tb-card nb-conv">
      <label class="tb-date"><span>${L('พิมพ์ตัวเลข (หรือเขียนด้วย Apple Pencil ลงช่องได้เลย)', 'Type a number (Apple Pencil Scribble works too)')}</span>
        <input type="text" inputmode="decimal" id="nbNum" value="${esc(st.num)}" autocomplete="off"></label>
      <div id="nbOut" class="tb-reads">${readOut()}</div></section>
    <section class="rb-sec"><p class="rb-k">${L('กับดักคนไทย: จีนนับทีละ 4 หลัก (万) ไม่ใช่ 3 หลัก', 'Chinese groups by 4 digits (万), not 3')}</p>
      <div class="nb-wrap"><table class="nb-tbl"><thead><tr><th>${L('จีน', 'Chinese')}</th><th>${L('พินอิน', 'Pinyin')}</th><th>${L('ไทย', 'Thai')}</th><th>${L('ตัวเลข', 'Digits')}</th></tr></thead>
      <tbody>${trap.map(t => `<tr><td><b lang="zh-Hans">${t[0]}</b></td><td>${t[1]}</td><td>${t[2]}</td><td>${t[3]}</td></tr>`).join('')}</tbody></table></div>
      <div class="rb-tip">${icn('bulb')}<span>${L('วิธีจำ: แบ่งเลขทีละ 4 หลักจากขวา · ก้อนแรก = 个 · ก้อนที่สอง = 万 · ก้อนที่สาม = 亿 · เช่น 1,2345,6789 = 一亿两千三百四十五万六千七百八十九', 'Split into 4-digit groups from the right: units · 万 · 亿')}</span></div></section>
    <section class="rb-sec"><p class="rb-k">${L('กฎที่ต้องรู้', 'Rules')}</p>
      ${rules.map(([k, t, ex]) => `<div class="tb-card"><div><b class="rb-expr-tag" lang="zh-Hans">${k}</b> ${t}</div>
        <div class="tb-words">${ex.map(([a, b]) => `<button type="button" class="tb-w" data-nbsay="${b.split(' / ')[0]}"><small>${a}</small><b lang="zh-Hans">${b}</b><span>${b.split(' / ').map(pinyin).join(' / ')}</span></button>`).join('')}</div></div>`).join('')}</section>
    <section class="rb-sec"><p class="rb-k">${L('เบอร์โทร / เลขห้อง / ปี: อ่านทีละตัว (1 = 幺 yāo)', 'Phone, room numbers, years: digit by digit (1 = 幺 yāo)')}</p>
      <div class="tb-card nb-conv"><input type="text" inputmode="numeric" id="nbPhone" value="${esc(st.phone)}" autocomplete="off">
        <div id="nbPhoneOut" class="tb-reads">${phoneOut()}</div></div></section>`;
  }
  function phoneOut() {
    const d = st.phone.replace(/\D/g, ''); if (!d) return '';
    const zh = [...d].map(c => c === '1' ? '幺' : D[+c]).join(''), zh2 = [...d].map(c => D[+c]).join('');
    return row(zh, [...zh].map(c => PY[c]).join(' '), L('เบอร์โทร / เลขห้อง (1 = 幺)', 'Phone / room (1 = 幺)')) + row(zh2, [...zh2].map(c => PY[c]).join(' '), L('ปี / ตัวเลขทั่วไปทีละตัว', 'Years / plain digits'));
  }

  /* ---------- arithmetic ---------- */
  const OPS = { '+': ['加', 'jiā', 'บวก'], '-': ['减', 'jiǎn', 'ลบ'], '×': ['乘以', 'chéngyǐ', 'คูณ'], '÷': ['除以', 'chúyǐ', 'หาร'] };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function newProb() {
    const op = st.op; let a, b;
    if (op === '+') { a = rnd(10, 99); b = rnd(10, 99); }
    if (op === '-') { a = rnd(30, 99); b = rnd(10, a); }
    if (op === '×') { a = rnd(2, 12); b = rnd(2, 12); }
    if (op === '÷') { b = rnd(2, 12); a = b * rnd(2, 12); }
    const ans = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b;
    st.prob = { a, b, op, ans, done: false };
  }
  const probZh = (p, withAns) => `${intZh(String(p.a))}${OPS[p.op][0]}${intZh(String(p.b))}等于${withAns ? intZh(String(p.ans)) : '多少'}`;
  function calcTab() {
    if (!st.prob || st.prob.op !== st.op) newProb();
    const p = st.prob;
    return `<section class="tb-card nb-calc">
      <div class="nb-ops" role="group">${Object.entries(OPS).map(([k, v]) => `<button type="button" data-nbop="${k}" class="${st.op === k ? 'on' : ''}">${k} <span lang="zh-Hans">${v[0]}</span></button>`).join('')}</div>
      <div class="nb-prob">${p.a} ${p.op} ${p.b} = ?</div>
      ${row(probZh(p, false) + '？', pinyin(probZh(p, false)).replace('děngyú', 'děngyú') + ' ?', L('ฟังโจทย์', 'Problem'))}
      <div class="tb-qrow"><input type="text" inputmode="numeric" id="nbAns" placeholder="${L('คำตอบ', 'Answer')}" autocomplete="off">
        <button type="button" class="btn primary" data-nbcheck="1">${L('ตรวจ', 'Check')}</button><button type="button" class="btn" data-nbnew="1">${L('ข้อใหม่', 'New')}</button></div>
      ${p.done ? `<div class="tb-res ${p.ok ? 'ok' : 'bad'}">${p.ok ? L('ถูกต้อง!', 'Correct!') : L('คำตอบคือ ', 'Answer: ') + p.ans}${row(probZh(p, true), pinyin(probZh(p, true)), L('อ่านเต็มประโยค', 'Full sentence'))}</div>` : ''}
    </section>
    <section class="rb-sec"><p class="rb-k">${L('คำศัพท์คำนวณ', 'Words')}</p>
      <div class="tb-words">${[['加', 'jiā', 'บวก (+)'], ['减', 'jiǎn', 'ลบ (−)'], ['乘以', 'chéngyǐ', 'คูณ (×)'], ['除以', 'chúyǐ', 'หาร (÷)'], ['等于', 'děngyú', 'เท่ากับ (=)'],
        ['多少', 'duōshao', 'เท่าไร'], ['大于', 'dàyú', 'มากกว่า (>)'], ['小于', 'xiǎoyú', 'น้อยกว่า (<)'], ['倍', 'bèi', 'เท่า (三倍 = 3 เท่า)'], ['平方', 'píngfāng', 'กำลังสอง']]
        .map(([z, py, t]) => `<button type="button" class="tb-w" data-nbsay="${z}"><b lang="zh-Hans">${z}</b><span>${py}</span><small>${t}</small></button>`).join('')}</div>
      <div class="rb-tip">${icn('bulb')}<span>${L('หาร: <b>12 除以 3</b> = 12 ÷ 3 (ตัวตั้งมาก่อน) · ถ้าใช้ 除 ตัวเดียว ลำดับกลับ: <b>3 除 12</b> = 12 ÷ 3 · ใช้ 除以 จะไม่สับสน', 'Division: <b>12 除以 3</b> = 12 ÷ 3; with bare 除 the order flips (3 除 12). Prefer 除以.')}</span></div></section>`;
  }

  /* ---------- fractions, percent, decimals, approximations ---------- */
  function fracTab() {
    const [a, b] = st.frac, fz = `${intZh(String(b))}分之${intZh(String(a))}`, p = readNum(st.pct), pz = p ? `百分之${p.zh}` : '';
    return `<section class="tb-card"><p class="rb-k">${L('เศษส่วน: ตัวส่วนมาก่อน (b 分之 a)', 'Fractions: denominator first (b 分之 a)')}</p>
      <div class="tb-qrow"><input type="text" inputmode="numeric" id="nbFa" value="${a}" aria-label="a"> / <input type="text" inputmode="numeric" id="nbFb" value="${b}" aria-label="b"></div>
      <div class="tb-reads">${row(fz, pinyin(fz), `${a}/${b}`)}${a * 2 === b ? row('一半', 'yībàn', L('ครึ่งหนึ่ง', 'half')) : ''}</div></section>
    <section class="tb-card"><p class="rb-k">${L('เปอร์เซ็นต์: 百分之 + ตัวเลข', 'Percent: 百分之 + number')}</p>
      <div class="tb-qrow"><input type="text" inputmode="decimal" id="nbPct" value="${esc(st.pct)}" aria-label="%"> %</div>
      <div class="tb-reads">${pz ? row(pz, pinyin(pz), `${st.pct}%`) : ''}</div></section>
    <section class="rb-sec"><p class="rb-k">${L('ทศนิยม: หลัง 点 อ่านทีละตัว', 'Decimals: digits after 点 one by one')}</p>
      <div class="tb-reads">${['3.14', '0.5', '10.05', '2.75'].map(x => { const r = readNum(x); return row(r.zh, r.py, x); }).join('')}</div></section>
    <section class="rb-sec"><p class="rb-k">${L('ตัวเลขประมาณ', 'Approximations')}</p>
      <div class="tb-words">${[['几个人', 'jǐ ge rén', 'ไม่กี่คน (น้อยกว่า 10)'], ['十几个', 'shí jǐ ge', 'สิบกว่า ๆ (11–19)'], ['几十个', 'jǐ shí ge', 'หลายสิบ'], ['十多个', 'shí duō ge', 'สิบกว่า'],
        ['一百多块', 'yībǎi duō kuài', 'ร้อยกว่าหยวน'], ['三点左右', 'sān diǎn zuǒyòu', 'ประมาณบ่ายสาม'], ['十来个', 'shí lái ge', 'ราวสิบ'], ['差不多', 'chàbuduō', 'เกือบ / พอ ๆ กัน'], ['三四个', 'sān sì ge', 'สามสี่อัน']]
        .map(([z, py, t]) => `<button type="button" class="tb-w" data-nbsay="${z}"><b lang="zh-Hans">${z}</b><span>${py}</span><small>${t}</small></button>`).join('')}</div>
      <div class="rb-tip">${icn('bulb')}<span>${L('多 วางหลังหลักเต็ม (十多 · 一百多) แต่ถ้าเลขลงท้ายด้วยหลักหน่วย ให้วางหลังลักษณนาม: 三块多 (สามหยวนกว่า)', '多 follows a round number (十多, 一百多); after a unit digit it follows the measure word: 三块多')}</span></div></section>
    <button type="button" class="rb-link" data-nbgo="/book/time">${L('เวลา วันที่ และปี (อ่านทีละตัว) อยู่ใน VOL. 07', 'Time, dates and years: VOL. 07')} →</button>`;
  }

  /* ---------- money & units ---------- */
  function moneyZh(v) {
    const m = String(v).match(/^(\d{1,9})(?:\.(\d)(\d)?)?$/); if (!m) return null;
    const y = +m[1], j = +(m[2] || 0), f = +(m[3] || 0), two = n => (n === 2 ? '两' : D[n]);
    let sp = '', wr = '';
    if (y) { sp += (y === 2 ? '两' : liang(intZh(String(y)))) + '块'; wr += intZh(String(y)) + '元'; }
    if (j) { const unitShown = f || !y; sp += (unitShown ? two(j) : D[j]) + (unitShown ? '毛' : ''); wr += D[j] + '角'; }   // 两毛 but 两块二
    if (f) { sp += (y && !j ? '零' : '') + two(f) + '分'; wr += (y && !j ? '零' : '') + D[f] + '分'; }
    if (!y && !j && !f) { sp = '零块'; wr = '零元'; }
    return { sp, wr };
  }
  function moneyTab() {
    const r = moneyZh(st.money);
    return `<section class="tb-card"><p class="rb-k">${L('เงิน: ภาษาพูด 块 · 毛 · 分 / ภาษาเขียน 元 · 角 · 分', 'Money: spoken 块 毛 分 / written 元 角 分')}</p>
      <div class="tb-qrow"><input type="text" inputmode="decimal" id="nbMoney" value="${esc(st.money)}" aria-label="¥"> ${L('หยวน', 'yuan')}</div>
      <div class="tb-reads" id="nbMoneyOut">${r ? row(r.sp, pinyin(r.sp), L('ภาษาพูด', 'Spoken')) + row(r.wr, pinyin(r.wr), L('ภาษาเขียน / ป้ายราคา', 'Written / price tags')) : ''}</div>
      <div class="rb-tip">${icn('bulb')}<span>${L('หน่วยสุดท้ายตัดได้: 三块五 = 3.50 (ไม่ต้องพูด 毛) · 2 หยวนพูด <b>两块</b> ไม่ใช่ 二块 · 1 毛 = 0.10 หยวน', 'The last unit can drop: 三块五 = 3.50 · ¥2 is <b>两块</b>')}</span></div></section>
    <section class="rb-sec"><p class="rb-k">${L('หน่วยวัดที่ใช้บ่อย', 'Common units')}</p>
      <div class="tb-words">${[['公斤', 'gōngjīn', 'กิโลกรัม'], ['斤', 'jīn', 'ชั่ง = 500 กรัม'], ['克', 'kè', 'กรัม'], ['米', 'mǐ', 'เมตร'], ['公里', 'gōnglǐ', 'กิโลเมตร'], ['厘米', 'límǐ', 'เซนติเมตร'],
        ['升', 'shēng', 'ลิตร'], ['度', 'dù', 'องศา'], ['岁', 'suì', 'ขวบ / ปี (อายุ)'], ['层 / 楼', 'céng / lóu', 'ชั้น']]
        .map(([z, py, t]) => `<button type="button" class="tb-w" data-nbsay="${z.split(' / ')[0]}"><b lang="zh-Hans">${z}</b><span>${py}</span><small>${t}</small></button>`).join('')}</div>
      <p class="tb-note">${L('ตัวเลข + ลักษณนาม + สิ่งของ (三本书) ดูเต็ม ๆ ในเล่ม VOL. 10 ลักษณนาม', 'Number + measure word + noun: see VOL. 10')}</p></section>`;
  }

  /* ---------- practice: listen and type ---------- */
  function newPr() {
    const kinds = [() => rnd(11, 99), () => rnd(101, 999), () => rnd(1001, 9999), () => rnd(1, 9) * 10000 + rnd(0, 9999), () => rnd(10, 99) * 10000, () => rnd(1, 9) * 100000000 + rnd(0, 9) * 10000];
    const n = kinds[rnd(0, kinds.length - 1)](); st.pr = { n, zh: liang(intZh(String(n))), done: false };
  }
  function practiceTab() {
    if (!st.pr) newPr();
    const p = st.pr;
    return `<section class="tb-card"><div class="tb-score">${L('คะแนน', 'Score')} <b>${st.ok || 0}</b> / ${st.tries || 0}</div>
      <p class="tb-q">${L('ฟังแล้วพิมพ์ตัวเลข (เขียนด้วย Apple Pencil ลงช่องได้)', 'Listen and type the number')}</p>
      <div class="tb-qrow"><button type="button" class="btn primary" data-nbsay="${esc(p.zh)}">${icn('vol')}${L('ฟัง', 'Play')}</button>
        <input type="text" inputmode="numeric" id="nbPr" autocomplete="off" style="width:200px">
        <button type="button" class="btn" data-nbprcheck="1">${L('ตรวจ', 'Check')}</button></div>
      ${p.done ? `<div class="tb-res ${p.ok ? 'ok' : 'bad'}">${p.ok ? L('ถูกต้อง!', 'Correct!') : L('คำตอบ: ', 'Answer: ') + p.n.toLocaleString('en')}
        ${row(p.zh, pinyin(p.zh), p.n.toLocaleString('en'))}<button type="button" class="btn sm" data-nbprnext="1">${L('ข้อต่อไป', 'Next')} →</button></div>` : ''}</section>`;
  }

  /* ---------- page ---------- */
  function draw() {
    const body = $('#bkBody'); if (!body || Book.id !== ID) return;
    const tabs = [['read', L('อ่านตัวเลข', 'Reading')], ['calc', L('คำนวณ', 'Arithmetic')], ['frac', L('เศษส่วน · % · ทศนิยม', 'Fractions · % · decimals')], ['money', L('เงินและหน่วย', 'Money & units')], ['practice', L('ฝึกฟัง', 'Practice')]];
    body.innerHTML = `<div class="rb tb">
      <header class="rb-hero"><div class="rb-hero-top"><div><h2><span lang="zh-Hans">数字与计算</span> ${L('ตัวเลขและการคำนวณ', 'Numbers & Arithmetic')}</h2>
        <p>${L('อ่านตัวเลขทุกขนาด · กับดัก 万 ของคนไทย · บวก ลบ คูณ หาร · เศษส่วน เปอร์เซ็นต์ · เงิน', 'Read any number · the 万 trap · + − × ÷ · fractions · money')}</p></div>
        <div class="sb-tools"><div class="gb-langs" role="group" aria-label="Language"><button type="button" class="gb-lg${en() ? '' : ' on'}" data-nblang="th">TH</button><button type="button" class="gb-lg${en() ? ' on' : ''}" data-nblang="en">EN</button></div></div></div>
        <nav class="rb-tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" class="rb-tab${st.tab === k ? ' on' : ''}" data-nbtab="${k}">${esc(l)}</button>`).join('')}</nav></header>
      <div class="rb-body">${st.tab === 'read' ? readTab() : st.tab === 'calc' ? calcTab() : st.tab === 'frac' ? fracTab() : st.tab === 'money' ? moneyTab() : practiceTab()}</div></div>`;
    const v = $('#bkVol'); if (v) v.textContent = `VOL. 14 · Numbers · ${L('ตัวเลขและการคำนวณ', 'Numbers & Arithmetic')}`;
    const live = (id, key, outId, fn) => { const el = $('#' + id, body); if (el) el.oninput = () => { st[key] = el.value; const o = $('#' + outId, body); if (o) o.innerHTML = fn(); }; };
    live('nbNum', 'num', 'nbOut', readOut); live('nbPhone', 'phone', 'nbPhoneOut', phoneOut);
    const fa = $('#nbFa', body), fb = $('#nbFb', body), pc = $('#nbPct', body), mo = $('#nbMoney', body);
    const redo = () => { const keep = document.activeElement && document.activeElement.id; draw(); const k = keep && $('#' + keep); if (k) { k.focus(); const n = k.value.length; try { k.setSelectionRange(n, n); } catch (x) {} } };
    if (fa) fa.onchange = () => { st.frac = [Math.max(1, +fa.value || 1), st.frac[1]]; redo(); };
    if (fb) fb.onchange = () => { st.frac = [st.frac[0], Math.max(1, +fb.value || 1)]; redo(); };
    if (pc) pc.onchange = () => { st.pct = pc.value; redo(); };
    if (mo) mo.oninput = () => { st.money = mo.value; const r = moneyZh(st.money), o = $('#nbMoneyOut', body); if (o) o.innerHTML = r ? row(r.sp, pinyin(r.sp), L('ภาษาพูด', 'Spoken')) + row(r.wr, pinyin(r.wr), L('ภาษาเขียน / ป้ายราคา', 'Written / price tags')) : ''; };
  }

  /* ---------- shelf + reader hooks ---------- */
  if (typeof SHELF !== 'undefined' && !SHELF.find(b => b.id === ID))
    SHELF.push({ id: ID, tag: 'Numbers', hz: '数字与计算', th: `${T('ตัวเลขและการคำนวณ')}`, vol: '14', c: 'orange' });
  if (typeof BOOK_META !== 'undefined')
    BOOK_META[ID] = { vol: 'VOL. 14 · Numbers', title: `数字与计算 ${T('ตัวเลขและการคำนวณ')}`, toc: null, pages: () => ['<div class="rb"></div>'], labels: ['1'] };
  Object.assign(window.OFFY_EN || {}, { 'ตัวเลขและการคำนวณ': 'Numbers & Arithmetic', 'เวลาและวันที่': 'Time & Dates' });

  const render0 = Book.render, go0 = Book.go;
  Book.render = function () { const r = render0.apply(this, arguments); if (this.id === ID) { $('#v-book').classList.add('rb-on'); draw(); } return r; };
  Book.go = function () { if (this.id === ID) return; return go0.apply(this, arguments); };

  $('#bkBody').addEventListener('click', e => {
    if (Book.id !== ID) return;
    const t = e.target.closest('[data-nbsay],[data-nbtab],[data-nblang],[data-nbop],[data-nbcheck],[data-nbnew],[data-nbprcheck],[data-nbprnext],[data-nbgo]');
    if (!t) return;
    e.stopPropagation();
    const ds = t.dataset, body = $('#bkBody');
    if (ds.nbsay) return say(ds.nbsay);
    if (typeof sfx === 'function') sfx('tap');
    if (ds.nbtab) { st.tab = ds.nbtab; return draw(); }
    if (ds.nblang) { S().rbLang = ds.nblang; save(); return draw(); }
    if (ds.nbop) { st.op = ds.nbop; newProb(); return draw(); }
    if (ds.nbnew) { newProb(); return draw(); }
    if (ds.nbgo) return Router.go(ds.nbgo);
    if (ds.nbcheck && st.prob && !st.prob.done) {
      const v = +(($('#nbAns', body) || {}).value || '').replace(/\D/g, ''); st.prob.done = true; st.prob.ok = v === st.prob.ans;
      if (typeof sfx === 'function') sfx(st.prob.ok ? 'ok' : 'bad'); return draw();
    }
    if (ds.nbprcheck && st.pr && !st.pr.done) {
      const v = +(($('#nbPr', body) || {}).value || '').replace(/\D/g, ''); st.pr.done = true; st.pr.ok = v === st.pr.n;
      st.tries = (st.tries || 0) + 1; if (st.pr.ok) st.ok = (st.ok || 0) + 1;
      if (typeof sfx === 'function') sfx(st.pr.ok ? 'ok' : 'bad'); return draw();
    }
    if (ds.nbprnext) { newPr(); return draw(); }
  }, true);
})();
