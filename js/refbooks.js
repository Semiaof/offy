'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — Unlocked Bookshelf Reference Volumes:
     VOL. 07 时间表达 (#/book/time)   — Interactive Clock, Calendar, Duration Traps & Mini-Check
     VOL. 11 句型结构 (#/book/syntax) — 1-Page Visual Sentence Blueprint Cheat Sheet → VOL. 06 links
   Hooks onto SHELF & BOOK_META before views.js boots.
   ===================================================================== */
(function refbooks() {
  const TIME_ID = 'time', SYNTAX_ID = 'syntax';
  const IDS = { [TIME_ID]: true, [SYNTAX_ID]: true };
  const icn = (n, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}"><use href="#i-${n}"/></svg>`;
  const S = () => (typeof Store !== 'undefined' && Store.d && Store.d.settings) ? Store.d.settings : {};
  const isEn = () => { const l = S().rbLang; return l ? l === 'en' : (typeof LANG !== 'undefined' && LANG === 'en'); };

  Object.assign(window.OFFY_EN || {}, {
    'การบอกเวลา': 'Time Expressions',
    'รูปแบบโครงสร้างประโยค': 'Sentence Blueprints',
    'นาฬิกา & ตัวแปลงสด': 'Interactive Clock',
    'ปฏิทิน & ช่วงเวลา': 'Calendar & Periods',
    'จุดเวลา vs ระยะเวลา': 'Point vs Duration',
    'ทดสอบเวลา': 'Time Quiz',
    'เวลาตอนนี้': 'Now',
    'สูตรลำดับคำทองคำ': 'Golden Word-Order Formula',
    'เจาะลึกใน VOL. 06': 'Deep-dive in VOL. 06',
    'ค้นหาโครงสร้าง เช่น 把, 被, 比, 补语, 虽然…': 'Search patterns e.g. 把, 被, 比, 补语, 虽然…'
  });

  /* ---------- Unlock VOL. 07 & VOL. 11 on SHELF & BOOK_META ---------- */
  if (typeof SHELF !== 'undefined') {
    const sTime = SHELF.find(b => b.hz === '时间表达');
    if (sTime) sTime.id = TIME_ID;
    const sSyn = SHELF.find(b => b.hz === '句型结构');
    if (sSyn) sSyn.id = SYNTAX_ID;
  }
  if (typeof BOOK_META !== 'undefined') {
    BOOK_META[TIME_ID] = {
      vol: 'VOL. 07 · Time',
      title: `时间表达 ${T('การบอกเวลา')}`,
      toc: null,
      pages: () => ['<div class="rb" id="rbRoot"></div>'],
      labels: ['1']
    };
    BOOK_META[SYNTAX_ID] = {
      vol: 'VOL. 11 · Syntax',
      title: `句型结构 ${T('รูปแบบโครงสร้างประโยค')}`,
      toc: null,
      pages: () => ['<div class="rb" id="rbRoot"></div>'],
      labels: ['1']
    };
  }

  /* ===================================================================
     PART 1: VOL. 07 时间表达 — INTERACTIVE CLOCK & TIME GUIDE
     =================================================================== */
  const NUM_ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const NUM_PY = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ', 'shí'];

  function numZh(n) {
    if (n <= 10) return NUM_ZH[n];
    if (n < 20) return '十' + (n % 10 ? NUM_ZH[n % 10] : '');
    return NUM_ZH[Math.floor(n / 10)] + '十' + (n % 10 ? NUM_ZH[n % 10] : '');
  }
  function numPy(n) {
    if (n <= 10) return NUM_PY[n];
    if (n < 20) return 'shí' + (n % 10 ? ' ' + NUM_PY[n % 10] : '');
    return NUM_PY[Math.floor(n / 10)] + 'shí' + (n % 10 ? ' ' + NUM_PY[n % 10] : '');
  }
  function hourZh(h12) { return h12 === 2 ? '两' : numZh(h12); }
  function hourPy(h12) { return h12 === 2 ? 'liǎng' : numPy(h12); }

  function periodOf(h24) {
    if (h24 < 5)  return { zh: '凌晨', py: 'língchén', th: 'ตี (เช้ามืด)', en: 'early morning' };
    if (h24 < 9)  return { zh: '早上', py: 'zǎoshang', th: 'ตอนเช้า', en: 'morning' };
    if (h24 < 12) return { zh: '上午', py: 'shàngwǔ',  th: 'ช่วงสาย', en: 'late morning' };
    if (h24 < 14) return { zh: '中午', py: 'zhōngwǔ',  th: 'ตอนเที่ยง', en: 'noon' };
    if (h24 < 18) return { zh: '下午', py: 'xiàwǔ',    th: 'ตอนบ่าย', en: 'afternoon' };
    return { zh: '晚上', py: 'wǎnshang', th: 'ตอนเย็น/ค่ำ', en: 'evening' };
  }

  function clockExpressions(h24, m) {
    const per = periodOf(h24);
    const h12 = h24 % 12 || 12;
    const hZ = hourZh(h12), hP = hourPy(h12);
    const out = [];

    if (m === 0) {
      out.push({ tag: ['แบบมาตรฐาน', 'Standard'], zh: `${per.zh}${hZ}点`, py: `${per.py} ${hP} diǎn` });
      out.push({ tag: ['เน้นตรงเป๊ะ', 'Exact'], zh: `${per.zh}${hZ}点整`, py: `${per.py} ${hP} diǎn zhěng` });
    } else if (m < 10) {
      out.push({ tag: ['ต้องอ่าน 零!', 'Must say 零!'], zh: `${per.zh}${hZ}点零${numZh(m)}分`, py: `${per.py} ${hP} diǎn líng ${numPy(m)} fēn` });
    } else {
      out.push({ tag: ['แบบตรงตัว', 'Direct'], zh: `${per.zh}${hZ}点${numZh(m)}分`, py: `${per.py} ${hP} diǎn ${numPy(m)} fēn` });
    }
    if (m === 15) {
      out.push({ tag: ['นิยมใช้ (15 นาที)', 'Common (quarter)'], zh: `${per.zh}${hZ}点一刻`, py: `${per.py} ${hP} diǎn yí kè` });
    }
    if (m === 30) {
      out.push({ tag: ['นิยมสุด (ครึ่ง)', 'Most common (half)'], zh: `${per.zh}${hZ}点半`, py: `${per.py} ${hP} diǎn bàn` });
    }
    if (m === 45) {
      out.push({ tag: ['แบบ 3 เค่อ', 'Three quarters'], zh: `${per.zh}${hZ}点三刻`, py: `${per.py} ${hP} diǎn sān kè` });
      const nh = (h12 % 12) + 1;
      out.push({ tag: ['อีก 15 นาที (差)', 'Quarter to'], zh: `差一刻${hourZh(nh)}点`, py: `chà yí kè ${hourPy(nh)} diǎn` });
    } else if (m >= 46) {
      const diff = 60 - m, nh = (h12 % 12) + 1;
      out.push({ tag: [`อีก ${diff} นาที (差)`, `${diff} min to`], zh: `差${numZh(diff)}分${hourZh(nh)}点`, py: `chà ${numPy(diff)} fēn ${hourPy(nh)} diǎn` });
    }
    return { per, h12, out };
  }

  function clockSvg(h24, m) {
    const mAng = m * 6;
    const hAng = ((h24 % 12) + m / 60) * 30;
    const ticks = Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30) * Math.PI / 180;
      const r1 = i % 3 === 0 ? 37 : 40, r2 = 44;
      return `<line x1="${50 + r1 * Math.sin(a)}" y1="${50 - r1 * Math.cos(a)}" x2="${50 + r2 * Math.sin(a)}" y2="${50 - r2 * Math.cos(a)}" stroke="currentColor" stroke-width="${i % 3 === 0 ? 2.2 : 1.1}" opacity="${i % 3 === 0 ? .65 : .35}"/>`;
    }).join('');
    return `<svg class="rb-svgclock" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="2"/>
      ${ticks}
      <line x1="50" y1="50" x2="${50 + 24 * Math.sin(hAng * Math.PI / 180)}" y2="${50 - 24 * Math.cos(hAng * Math.PI / 180)}" stroke="var(--ink)" stroke-width="3.6" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="${50 + 34 * Math.sin(mAng * Math.PI / 180)}" y2="${50 - 34 * Math.cos(mAng * Math.PI / 180)}" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="3.4" fill="var(--accent)"/>
    </svg>`;
  }

  function todayZh() {
    const now = new Date();
    const y = String(now.getFullYear()).split('').map(d => d === '0' ? '〇' : NUM_ZH[+d]).join('');
    const yPy = String(now.getFullYear()).split('').map(d => NUM_PY[+d]).join(' ');
    const mo = now.getMonth() + 1, da = now.getDate();
    const wDays = ['日', '一', '二', '三', '四', '五', '六'];
    const wPy = ['rì', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù'];
    const wd = now.getDay();
    return {
      zh: `${y}年${numZh(mo)}月${numZh(da)}号 星期${wDays[wd]}`,
      py: `${yPy} nián ${numPy(mo)} yuè ${numPy(da)} hào, xīngqī ${wPy[wd]}`,
      num: `${now.getFullYear()}/${String(mo).padStart(2, '0')}/${String(da).padStart(2, '0')}`
    };
  }

  const TIME_QUIZ = [
    { q: ['14:15 ในภาษาพูดจีนที่นิยมใช้คือข้อใด?', 'How is 14:15 commonly said in Mandarin?'], opts: ['下午二点十五分', '下午两点一刻', '下午两个一刻', '下午两刻一点'], a: 1, exp: ['2 โมงต้องใช้ 两 (ไม่ใช้ 二!) และ 15 นาทีคือ 一刻 → 下午两点一刻', '2 o’clock uses 两 (never 二) and :15 is 一刻 → 下午两点一刻'] },
    { q: ['“สามชั่วโมงครึ่ง” (ระยะเวลา) พูดอย่างไร?', 'How do you say “3.5 hours” (duration)?'], opts: ['三点半', '三点半小时', '三个半小时', '三小时半个'], a: 2, exp: ['ระยะเวลาใช้ ชั่วโมง (小时) + ลักษณนาม 个 และวาง 半 หลัง 个 → 三个半小时 (ส่วน 三点半 = ตีสามครึ่ง/บ่ายสามครึ่ง!)', 'Duration uses 小时 + 个 with 半 after 个 → 三个半小时 (三点半 means 3:30!)'] },
    { q: ['08:05 ต้องอ่านอย่างไร?', 'How do you say 08:05?'], opts: ['八点五分', '八点零五分', '八点差五分', '八个小时零五分'], a: 1, exp: ['นาทีที่ 01–09 ต้องออกเสียง 零 (líng) เสมอ → 八点零五分', 'Minutes 01–09 require 零 → 八点零五分'] },
    { q: ['“อีก 10 นาทีจะ 9 โมง” (08:50) พูดว่าอย่างไร?', 'How do you say “10 minutes to 9” (08:50)?'], opts: ['差十分九点', '差九点十分', '九点差十分钟', '差十分八点'], a: 0, exp: ['โครงสร้าง 差 + นาทีที่ขาด + ชั่วโมงถัดไป → 差十分九点', 'Pattern: 差 + minutes missing + next hour → 差十分九点'] },
    { q: ['ประโยค “ฉันกินข้าวตอน 12 โมง” ข้อใดเรียงถูก?', 'Which word order is correct for “I eat at 12:00”?'], opts: ['我吃饭十二点。', '我十二点吃饭。', '十二点吃饭我。', '我吃了十二点饭。'], a: 1, exp: ['จุดเวลา (เมื่อไหร่) วางหน้ากริยาเสมอ → 我十二点吃饭。', 'Time points always go BEFORE the verb → 我十二点吃饭。'] },
    { q: ['“ฉันเรียนภาษาจีนมา 2 ปีแล้ว (และตอนนี้ยังเรียนอยู่)” ข้อใดตรงที่สุด?', '“I have studied Chinese for 2 years (and still do)” — which one?'], opts: ['我学汉语两年。', '我学了两年汉语。', '我学汉语学了两年了。', '我两年学汉语了。'], a: 2, exp: ['ใช้ Double 了 (V + 了 + ระยะเวลา + 了) เพื่อบอกว่าทำต่อเนื่องมาจนถึงปัจจุบันและยังไม่หยุด!', 'Double 了 (V + 了 + duration + 了) means the action continues up to now!'] },
    { q: ['“ห้าเดือน” (ระยะเวลา) กับ “เดือนพฤษภาคม” ต่างกันอย่างไร?', 'What is the difference between “5 months” and “May”?'], opts: ['五月 = 5 เดือน · 五个月 = พ.ค.', '五个月 = 5 เดือน · 五月 = พ.ค.', 'ทั้งสองแบบแปลว่า พ.ค.', 'ต้องพูด 五月个'], a: 1, exp: ['ไม่มี 个 = ชื่อเดือน (五月 = พฤษภาคม) · มี 个 = จำนวนเดือน (五个月 = 5 เดือน)', 'No 个 = month name (五月 = May); with 个 = duration (五个月 = 5 months).'] },
    { q: ['ปี ค.ศ. 2026 อ่านออกเสียงทีละหลักว่าอย่างไร?', 'How is the year 2026 read in Chinese?'], opts: ['两千零二十六年', '二〇二六年', '二零二六号', '两〇两六年'], a: 1, exp: ['ปี ค.ศ. อ่านเรียงทีละตัวเลขและใช้ 二 (ไม่ใช้ 两) → 二〇二六年', 'Years are read digit-by-digit using 二 (never 两) → 二〇二六年'] }
  ];

  let tTab = 'clock';   // 'clock' | 'cal' | 'dur' | 'quiz'
  let tHour = 14, tMin = 30;
  let tQuiz = { i: 0, score: 0, picked: null };

  function rbToolsHtml() {
    const en = isEn(), pyOn = S().showPinyin !== false;
    return `<div class="sb-tools">
      <div class="gb-langs" role="group" aria-label="Language">
        <button type="button" class="gb-lg${!en ? ' on' : ''}" data-rblang="th">TH</button>
        <button type="button" class="gb-lg${en ? ' on' : ''}" data-rblang="en">EN</button>
      </div>
      <button type="button" class="gb-tbtn${pyOn ? '' : ' off'}" data-rbpy aria-label="${esc(T('แสดง/ซ่อนพินอิน'))}">${icn(pyOn ? 'eye' : 'eye-off')}</button>
    </div>`;
  }

  function renderTimeBook() {
    const en = isEn();
    const tabs = [
      ['clock', T('นาฬิกา & ตัวแปลงสด')],
      ['cal',   T('ปฏิทิน & ช่วงเวลา')],
      ['dur',   T('จุดเวลา vs ระยะเวลา')],
      ['quiz',  `${T('ทดสอบเวลา')} (${TIME_QUIZ.length})`]
    ];

    let panel = '';
    if (tTab === 'clock') {
      const { per, h12, out } = clockExpressions(tHour, tMin);
      const hh = String(tHour).padStart(2, '0'), mm = String(tMin).padStart(2, '0');
      const primary = out[out.length - 1];
      const trapNote = tMin === 30
        ? (en ? `Trap check: <b>${hourZh(h12)}点半</b> = ${h12}:30 (clock time) · <b>${hourZh(h12)}个半小时</b> = ${h12}.5 hours (duration)`
              : `ระวังสับสน: <b>${hourZh(h12)}点半</b> = ${h12}:30 น. (จุดเวลา) ≠ <b>${hourZh(h12)}个半小时</b> = ${h12} ชั่วโมงครึ่ง (ระยะเวลา)`)
        : (h12 === 2
          ? (en ? 'Remember: 2 o’clock is ALWAYS <b>两点</b> (liǎng diǎn), never 二点!'
                : 'จำให้แม่น: บ่ายสอง/ตีสอง ต้องใช้ <b>两点</b> (liǎng diǎn) ห้ามพูด 二点 เด็ดขาด!')
          : (tMin > 0 && tMin < 10
            ? (en ? 'Minutes 01–09 require <b>零 (líng)</b> before the minute number.'
                  : 'เศษนาที 01–09 ต้องเติมคำว่า <b>零 (líng)</b> เสมอ เช่น 八点零五分')
            : (tMin >= 45
              ? (en ? 'Past :45 you can also count backwards with <b>差 (chà)</b> to the next hour!'
                    : 'ตั้งแต่ :45 ขึ้นไป คนจีนนิยมใช้ <b>差 (chà)</b> นับถอยหลังก่อนถึงชั่วโมงถัดไปด้วย!')
              : (en ? 'Put the time-of-day word (早上/下午/晚上) BEFORE the hour.'
                    : 'ภาษาจีนวางช่วงเวลา (早上/下午/晚上) ไว้ <b>หน้า</b> ตัวเลขนาฬิกาเสมอ'))));

      panel = `<div class="rb-clock-card">
        <div class="rb-clock-vis" id="rbClockVis">
          ${clockSvg(tHour, tMin)}
          <div class="rb-clock-dig">
            <span class="rb-per-pill">${esc(per.zh)} · ${esc(en ? per.en : per.th)}</span>
            <div class="rb-hhmm">${hh}:${mm}</div>
            <button type="button" class="btn primary sm" data-rbsay="${esc(primary.zh)}">${icn('vol')}${en ? 'Listen' : 'ฟังเสียงอ่าน'}</button>
          </div>
        </div>
        <div class="rb-clock-ctrl">
          <div class="rb-sliders">
            <label><span>${en ? 'Hour' : 'ชั่วโมง'} (<b id="rbHLbl">${hh}</b>)</span><input type="range" min="0" max="23" value="${tHour}" id="rbHour"></label>
            <label><span>${en ? 'Minute' : 'นาที'} (<b id="rbMLbl">${mm}</b>)</span><input type="range" min="0" max="59" value="${tMin}" id="rbMin"></label>
          </div>
          <div class="rb-presets">
            <button type="button" class="rb-pre" data-rbset="now">${icn('clock')}${T('เวลาตอนนี้')}</button>
            ${[['08:00', 8, 0], ['09:05', 9, 5], ['14:15', 14, 15], ['14:30', 14, 30], ['17:45', 17, 45], ['20:50', 20, 50]].map(([lbl, h, m]) =>
              `<button type="button" class="rb-pre${tHour === h && tMin === m ? ' on' : ''}" data-rbset="${h}:${m}">${lbl}</button>`).join('')}
          </div>
        </div>
        <div class="rb-exprs" id="rbExprs">
          ${out.map(e => `<div class="rb-expr">
            <span class="rb-expr-tag">${esc(en ? e.tag[1] : e.tag[0])}</span>
            <div class="rb-expr-main"><b lang="zh-Hans">${esc(e.zh)}</b><span class="pyx">${esc(e.py)}</span></div>
            <button type="button" class="gx-say sm" data-rbsay="${esc(e.zh)}" aria-label="${esc(T('ฟังเสียง'))}">${icn('vol')}</button>
          </div>`).join('')}
        </div>
        <div class="rb-tip" id="rbTip">${icn('bulb')}<span>${trapNote}</span></div>
      </div>

      <section class="rb-sec">
        <h3 class="rb-k">${en ? '5 Clock Rules at a Glance' : '5 กฎบอกเวลาบนนาฬิกาที่ต้องรู้'}</h3>
        <div class="rb-cards2">
          ${[
            ['点 (diǎn) · โมงตรง', '八点 / 两点整', 'bā diǎn / liǎng diǎn zhěng', 'เลข 2 ใช้ 两 เสมอ (两点) ไม่ใช้ 二点 · เพิ่ม 整 เมื่อต้องการย้ำว่าตรงเป๊ะ', 'Always 两点 (never 二点); add 整 for “sharp”.'],
            ['零…分 · เศษ 1–9 นาที', '九点零五分', 'jiǔ diǎn líng wǔ fēn', 'นาที 01–09 ต้องใส่ 零 คั่นเสมอ (อ่านคล้าย “เก้าโมงศูนย์ห้านาที”)', 'Minutes 01–09 always insert 零 before the digit.'],
            ['半 (bàn) · ครึ่ง (30 นาที)', '十点半', 'shí diǎn bàn', 'วาง 半 หลัง 点 ได้เลย ไม่ต้องใส่ 分', 'Put 半 directly after 点 (no 分 needed).'],
            ['刻 (kè) · 15 นาที (1 เค่อ)', '三点一刻 / 三点三刻', 'sān diǎn yí kè / sān kè', '一刻 = 15 นาที · 三刻 = 45 นาที (นิยมใช้ในภาษาพูด)', '一刻 = :15 · 三刻 = :45.'],
            ['差 (chà) · อีก…จะถึง…โมง', '差十分九点 / 差一刻三点', 'chà shí fēn jiǔ diǎn', 'ใช้ตอนนาที 45–59 บอกเวลาที่ “ขาดอีกนิดจะถึงชั่วโมงถัดไป”', 'Used at :45–:59 to count minutes remaining to the next hour.']
          ].map(([h, zh, py, th, eng]) => `<article class="rb-mini">
            <div class="rb-mini-h"><b>${esc(h)}</b><button type="button" class="gx-say sm" data-rbsay="${esc(zh.split(' / ')[0])}">${icn('vol')}</button></div>
            <div class="rb-mini-zh" lang="zh-Hans">${esc(zh)}</div>
            <div class="pyx">${esc(py)}</div>
            <p>${esc(en ? eng : th)}</p>
          </article>`).join('')}
        </div>
        <div class="rb-links">
          <button type="button" class="rb-link" data-rbg="g3-1-070">${T('เจาะลึกใน VOL. 06')}: 钟点表示法 (g3-1-070) →</button>
        </div>
      </section>`;
    } else if (tTab === 'cal') {
      const td = todayZh();
      panel = `<div class="rb-today">
        <div>
          <span class="rb-expr-tag">${en ? 'Today in Chinese' : 'วันนี้ภาษาจีน'} · ${td.num}</span>
          <div class="rb-today-zh" lang="zh-Hans">${esc(td.zh)}</div>
          <div class="pyx">${esc(td.py)}</div>
        </div>
        <button type="button" class="btn primary sm" data-rbsay="${esc(td.zh)}">${icn('vol')}${en ? 'Listen' : 'ฟังเสียง'}</button>
      </div>

      <section class="rb-sec">
        <h3 class="rb-k">${en ? 'Golden Order: Biggest → Smallest' : 'กฎทองคำปฏิทิน: เรียงจาก ใหญ่ → เล็ก เสมอ!'}</h3>
        <div class="rb-chain">
          ${[['年', 'ปี (อ่านทีละหลัก)', 'Year'], ['月', 'เดือน (1–12)', 'Month'], ['号 / 日', 'วันที่ (พูด/เขียน)', 'Day'], ['星期', 'วันในสัปดาห์', 'Weekday'], ['时段', 'ช่วงวัน', 'Period'], ['点分', 'นาฬิกา', 'Clock']].map(([z, th, eg], i) =>
            `${i ? '<span class="rb-arr">→</span>' : ''}<div class="rb-slot"><b lang="zh-Hans">${z}</b><small>${en ? eg : th}</small></div>`).join('')}
        </div>
        <div class="rb-tip">${icn('bulb')}<span>${en ? 'Spoken Mandarin uses <b>号 (hào)</b> & <b>星期天</b>; written/formal uses <b>日 (rì)</b> & <b>星期日</b>. Years are read digit-by-digit: 2026年 = 二〇二六年!'
          : 'ภาษาพูดใช้ <b>号 (hào)</b> และ <b>星期天</b> · ภาษาเขียนใช้ <b>日 (rì)</b> และ <b>星期日</b> · ปี ค.ศ. อ่านทีละหลัก: 2026年 = 二〇二六年'}</span></div>
      </section>

      <section class="rb-sec">
        <h3 class="rb-k">${en ? 'Relative Time Grid (-2 → +2)' : 'ตารางเวลาสัมพัทธ์ (อดีต ← ปัจจุบัน → อนาคต)'}</h3>
        <div class="rb-tblwrap"><table class="rb-tbl">
          <thead><tr><th></th><th>-2</th><th>-1</th><th class="hi">0 (${en ? 'Now' : 'ปัจจุบัน'})</th><th>+1</th><th>+2</th></tr></thead>
          <tbody>
            ${[
              [en ? 'Year' : 'ปี', [['前年', 'qiánnián'], ['去年', 'qùnián'], ['今年', 'jīnnián'], ['明年', 'míngnián'], ['后年', 'hòunián']]],
              [en ? 'Month' : 'เดือน', [['上上个月', 'shàngshàng ge yuè'], ['上个月', 'shàng ge yuè'], ['这个月', 'zhège yuè'], ['下个月', 'xià ge yuè'], ['下下个月', 'xiàxià ge yuè']]],
              [en ? 'Week' : 'สัปดาห์', [['上上个星期', 'shàngshàng…'], ['上个星期', 'shàng ge xīngqī'], ['这个星期', 'zhège xīngqī'], ['下个星期', 'xià ge xīngqī'], ['下下个星期', 'xiàxià…']]],
              [en ? 'Day' : 'วัน', [['前天', 'qiántiān'], ['昨天', 'zuótiān'], ['今天', 'jīntiān'], ['明天', 'míngtiān'], ['后天', 'hòutiān']]]
            ].map(([lbl, cells]) => `<tr><th>${lbl}</th>${cells.map(([z, p], ci) =>
              `<td class="${ci === 2 ? 'hi' : ''}"><button type="button" class="rb-cellsay" data-rbsay="${esc(z)}"><b lang="zh-Hans">${esc(z)}</b><span class="pyx">${esc(p)}</span></button></td>`).join('')}</tr>`).join('')}
          </tbody>
        </table></div>
      </section>

      <section class="rb-sec">
        <h3 class="rb-k">${en ? '6 Periods of the Day' : '6 ช่วงเวลาของวัน (00:00 → 24:00)'}</h3>
        <div class="rb-periods">
          ${[
            ['凌晨', 'língchén', '00–05', 'ตี/เช้ามืด', 'Early AM', '#4c5b8c'],
            ['早上', 'zǎoshang', '05–09', 'ตอนเช้า', 'Morning', '#d97a2b'],
            ['上午', 'shàngwǔ', '09–12', 'ช่วงสาย', 'Late AM', '#c99316'],
            ['中午', 'zhōngwǔ', '12–14', 'ตอนเที่ยง', 'Noon', '#d6483b'],
            ['下午', 'xiàwǔ', '14–18', 'ตอนบ่าย', 'Afternoon', '#2f9a5a'],
            ['晚上', 'wǎnshang', '18–24', 'เย็น/ค่ำ', 'Evening', '#5c4b9e']
          ].map(([z, p, hr, th, eg, c]) => `<button type="button" class="rb-pcard" style="--pc:${c}" data-rbsay="${z}">
            <span class="rb-phr">${hr}</span>
            <b lang="zh-Hans">${z}</b>
            <span class="pyx">${p}</span>
            <small>${en ? eg : th}</small>
          </button>`).join('')}
        </div>
        <div class="rb-links">
          <button type="button" class="rb-link" data-rbg="g3-1-069">${T('เจาะลึกใน VOL. 06')}: วัน เดือน ปี (g3-1-069) →</button>
          <button type="button" class="rb-link is-syn" data-rbsyn="g18">VOL. 12: 早上 / 上午 / 白天 →</button>
          <button type="button" class="rb-link is-syn" data-rbsyn="g20">VOL. 12: 号 / 日 →</button>
        </div>
      </section>`;
    } else if (tTab === 'dur') {
      panel = `<section class="rb-sec">
        <h3 class="rb-k">${en ? '#1 Trap: Point in Time vs Duration' : 'กับดักอันดับ 1 ของคนไทย: จุดเวลา (เมื่อไหร่) vs ระยะเวลา (นานแค่ไหน)'}</h3>
        <div class="rb-duel-list">
          ${[
            ['两点', 'liǎng diǎn', 'ตี 2 / บ่าย 2 โมง', '2:00 o’clock', '两个小时', 'liǎng ge xiǎoshí', '2 ชั่วโมง (ระยะเวลา)', '2 hours'],
            ['三点半', 'sān diǎn bàn', 'ตี 3 ครึ่ง / บ่าย 3 ครึ่ง', '3:30', '三个半小时', 'sān ge bàn xiǎoshí', '3 ชั่วโมงครึ่ง (วาง 半 หลัง 个!)', '3.5 hours (半 after 个!)'],
            ['五月', 'wǔ yuè', 'เดือนพฤษภาคม', 'May', '五个月', 'wǔ ge yuè', '5 เดือน (ต้องใส่ 个!)', '5 months (needs 个!)'],
            ['星期三', 'xīngqīsān', 'วันพุธ', 'Wednesday', '三个星期', 'sān ge xīngqī', '3 สัปดาห์', '3 weeks'],
            ['半点 (ครึ่งชั่วโมง)', 'bàn diǎn ✗', 'ห้ามใช้บอกระยะเวลา!', 'Never for duration', '半个小时 / 半天 / 半年', 'bàn ge xiǎoshí / bàntiān', 'ครึ่งชม. / ครึ่งวัน / ครึ่งปี (天/年 ไม่ใส่ 个)', 'Half hr / half day / half yr']
          ].map(([z1, p1, t1, e1, z2, p2, t2, e2]) => `<div class="rb-duel">
            <div class="rb-duel-a">
              <span class="rb-duel-k">${en ? 'Time Point' : 'จุดเวลา'}</span>
              <div class="rb-duel-z"><b lang="zh-Hans">${esc(z1)}</b><button type="button" class="gx-say sm" data-rbsay="${esc(z1.replace(/（.*）|\(.*\)|✗/g, ''))}">${icn('vol')}</button></div>
              <span class="pyx">${esc(p1)}</span><small>${esc(en ? e1 : t1)}</small>
            </div>
            <div class="rb-duel-vs">vs</div>
            <div class="rb-duel-b">
              <span class="rb-duel-k">${en ? 'Duration' : 'ระยะเวลา'}</span>
              <div class="rb-duel-z"><b lang="zh-Hans">${esc(z2)}</b><button type="button" class="gx-say sm" data-rbsay="${esc(z2.split(' / ')[0])}">${icn('vol')}</button></div>
              <span class="pyx">${esc(p2)}</span><small>${esc(en ? e2 : t2)}</small>
            </div>
          </div>`).join('')}
        </div>
      </section>

      <section class="rb-sec">
        <h3 class="rb-k">${en ? 'Sentence Position & Double 了' : 'ตำแหน่งในประโยค & กฎ Double 了'}</h3>
        <div class="rb-cards2">
          <article class="rb-mini">
            <div class="rb-mini-h"><b>${en ? '1. Time Point → BEFORE Verb' : '1. จุดเวลา → วางหน้ากริยา'}</b><button type="button" class="gx-say sm" data-rbsay="我明天上午九点去学校。">${icn('vol')}</button></div>
            <div class="rb-mini-zh" lang="zh-Hans">我<b>明天上午九点</b>去学校。</div>
            <div class="pyx">Wǒ míngtiān shàngwǔ jiǔ diǎn qù xuéxiào.</div>
            <p>${en ? 'Never put time points at the end of a Chinese sentence!' : 'ห้ามวางจุดเวลาไว้ท้ายประโยคแบบภาษาไทย (✗ 我去学校九点)'}</p>
          </article>
          <article class="rb-mini">
            <div class="rb-mini-h"><b>${en ? '2. Duration → AFTER Verb' : '2. ระยะเวลา → วางหลังกริยา'}</b><button type="button" class="gx-say sm" data-rbsay="我昨天睡了八个小时。">${icn('vol')}</button></div>
            <div class="rb-mini-zh" lang="zh-Hans">我昨天睡了<b>八个小时</b>。</div>
            <div class="pyx">Wǒ zuótiān shuì le bā ge xiǎoshí.</div>
            <p>${en ? 'With an object: repeat the verb (学汉语学了两年) or put duration before O (学了两年汉语).' : 'ถ้ามีกรรม: ซ้ำกริยา (学汉语学了两年) หรือวางคั่น (学了两年汉语)'}</p>
          </article>
          <article class="rb-mini">
            <div class="rb-mini-h"><b>${en ? '3. Single 了 vs Double 了' : '3. 了 ตัวเดียว vs Double 了 (ยังทำอยู่!)'}</b><button type="button" class="gx-say sm" data-rbsay="我在北京住了三年了。">${icn('vol')}</button></div>
            <div class="rb-mini-zh" lang="zh-Hans">我在北京住<b>了</b>三年<b>了</b>。</div>
            <div class="pyx">Wǒ zài Běijīng zhù le sān nián le.</div>
            <p>${en ? 'Single 了 = lived for 3 yrs (now left). Double 了 = have lived for 3 yrs (AND still live here!).' : '了 ตัวเดียว = เคยอยู่ 3 ปี (ตอนนี้ย้ายแล้ว) · Double 了 = อยู่มา 3 ปีแล้ว (และตอนนี้ยังอยู่!)'}</p>
          </article>
          <article class="rb-mini">
            <div class="rb-mini-h"><b>${en ? '4. Before / After / When' : '4. ก่อน / หลัง / ตอนที่ (วางหน้าเสมอ!)'}</b><button type="button" class="gx-say sm" data-rbsay="吃饭以前要洗手。">${icn('vol')}</button></div>
            <div class="rb-mini-zh" lang="zh-Hans">吃饭<b>以前</b>要洗手。 / 下雨<b>的时候</b></div>
            <div class="pyx">Chīfàn yǐqián yào xǐshǒu. / Xiàyǔ de shíhou</div>
            <p>${en ? 'Chinese puts 以前 / 以后 / 的时候 AFTER the event (opposite to Thai/English!).' : 'กลับด้านกับไทย! จีนเอาเหตุการณ์ขึ้นก่อนแล้วปิดท้ายด้วย 以前 / 以后 / 的时候'}</p>
          </article>
        </div>
        <div class="rb-links">
          <button type="button" class="rb-link" data-rbg="g3-3-064">${T('เจาะลึกใน VOL. 06')}: 时量补语 (g3-3-064) →</button>
          <button type="button" class="rb-link" data-rbg="g3-3-050">${T('เจาะลึกใน VOL. 06')}: 以前 / 以后 (g3-3-050) →</button>
          <button type="button" class="rb-link is-syn" data-rbsyn="g17">VOL. 12: 时候 / 时间 →</button>
          <button type="button" class="rb-link is-syn" data-rbsyn="g21">VOL. 12: 前 / 先 →</button>
        </div>
      </section>`;
    } else {
      // Quiz tab
      const q = tQuiz, total = TIME_QUIZ.length;
      if (q.i >= total) {
        const pct = Math.round(q.score / total * 100);
        panel = `<div class="sb-qdone">
          <div class="sb-qscore">${q.score}<span>/${total}</span></div>
          <h3>${pct >= 80 ? (en ? 'Time Master!' : 'เป๊ะเรื่องเวลาแล้ว!') : (en ? 'Good try — review the tabs and retry!' : 'ลองทวนแท็บนาฬิกา & ระยะเวลาอีกนิดแล้วมาลองใหม่นะ!')}</h3>
          <p class="muted">${pct}%</p>
          <div class="sb-qacts"><button type="button" class="btn primary" data-rbqretry>${icn('retry')}${T('ทำอีกรอบ')}</button></div>
        </div>`;
      } else {
        const item = TIME_QUIZ[q.i];
        const done = q.picked !== null;
        panel = `<div class="sb-qbar"><i style="width:${q.i / total * 100}%"></i></div>
        <div class="sb-qcard">
          <div class="sb-qmeta"><span class="sb-badge">${q.i + 1} / ${total}</span><span class="sb-theme-tag">${T('ถูก')} ${q.score}</span></div>
          <h3 class="rb-qq">${esc(en ? item.q[1] : item.q[0])}</h3>
          <div class="rb-qopts">
            ${item.opts.map((o, oi) => {
              let cls = 'rb-qopt';
              if (done) {
                if (oi === item.a) cls += ' is-ok';
                else if (oi === q.picked) cls += ' is-no';
                else cls += ' dim';
              }
              return `<button type="button" class="${cls}" data-rbqans="${oi}" ${done ? 'disabled' : ''} lang="zh-Hans">${esc(o)}</button>`;
            }).join('')}
          </div>
          ${done ? `<div class="sb-qfb ${q.picked === item.a ? 'is-ok' : 'is-no'}">
            <div class="sb-qfb-h"><b>${q.picked === item.a ? '✓ ถูกต้อง!' : '✗ ยังไม่ใช่'}</b><button type="button" class="gx-say sm" data-rbsay="${esc(item.opts[item.a])}">${icn('vol')}</button></div>
            <p>${esc(en ? item.exp[1] : item.exp[0])}</p>
            <div class="sb-qfb-f"><span></span><button type="button" class="btn primary sm" data-rbqnext>${q.i + 1 < total ? T('ข้อต่อไป') : T('สรุปผลทดสอบ')} ${icn('chev-r')}</button></div>
          </div>` : ''}
        </div>`;
      }
    }

    return `<div class="rb rb-time">
      <header class="rb-hero">
        <div class="rb-hero-top">
          <div>
            <h2><span lang="zh-Hans">时间表达</span> ${T('การบอกเวลา')}</h2>
            <p>${en ? 'Interactive clock converter, calendar order, duration traps & quick quiz' : 'ตัวแปลงนาฬิกาจีนสด · กฎปฏิทินใหญ่→เล็ก · เทียบจุดเวลา vs ระยะเวลา'}</p>
          </div>
          ${rbToolsHtml()}
        </div>
        <nav class="rb-tabs" role="tablist">
          ${tabs.map(([k, lbl]) => `<button type="button" class="rb-tab${tTab === k ? ' on' : ''}" data-rbttab="${k}">${esc(lbl)}</button>`).join('')}
        </nav>
      </header>
      <div class="rb-body">${panel}</div>
    </div>`;
  }

  /* ===================================================================
     PART 2: VOL. 11 句型结构 — 1-PAGE VISUAL SENTENCE BLUEPRINT SHEET
     =================================================================== */
  const SYN_CATS = [
    ['all',     'ทั้งหมด',        'All'],
    ['basic',   'โครงสร้างพื้นฐาน', 'Core Word Order'],
    ['special', 'ประโยคพิเศษ',     'Special Patterns'],
    ['comp',    'บทเสริม 4 แบบ',   'Complements (补语)'],
    ['complex', 'ประโยคเชื่อมซ้อน', 'Complex Clauses']
  ];

  // Every gid is 100% verified in data/grammar/hsk1–4.js!
  const SYN_PATTERNS = [
    // BASIC
    { cat: 'basic', lv: 1, name: ['ลำดับคำทองคำ (SVO + เวลา/สถานที่)', 'Golden Word Order (S + T + P + V + O)'],
      slots: [['S', 's'], ['เวลา', 't'], ['สถานที่', 'p'], ['V', 'v'], ['O', 'o']],
      rule: ['เวลาและสถานที่วาง <b>หน้ากริยา</b> เสมอ (ตรงข้ามภาษาไทยที่วางท้าย!)', 'Time & Place ALWAYS precede the verb!'],
      trap: ['✗ 我看书在图书馆昨天', 'Never put time/place at the end'],
      ex: ['我昨天在图书馆看书。', 'Wǒ zuótiān zài túshūguǎn kàn shū.', 'เมื่อวานฉันอ่านหนังสือที่ห้องสมุด', 'I read at the library yesterday.'],
      gids: [['g3-1-042', '动词谓语句'], ['g3-1-021', '介词 在']] },
    { cat: 'basic', lv: 1, name: ['ประโยคคุณศัพท์ (ไม่ต้องมี 是!)', 'Adjective Predicate (No 是!)'],
      slots: [['S', 's'], ['很 / 非常 / 不', 'm'], ['Adj', 'v']],
      rule: ['คำคุณศัพท์ทำหน้าที่เป็นภาคแสดงได้เลย ใช้ <b>很</b> เชื่อมแทนความหมาย “เป็น/คือ”', 'Adjectives act as predicates directly; use 很 instead of 是!'],
      trap: ['✗ 她是很漂亮 → ✓ 她很漂亮', 'Never use 是 before a bare adjective'],
      ex: ['今天的天气很舒服。', 'Jīntiān de tiānqì hěn shūfu.', 'อากาศวันนี้สบายมาก', 'Today’s weather is very pleasant.'],
      gids: [['g3-1-043', '形容词谓语句'], ['g3-1-052', '是字句']] },
    { cat: 'basic', lv: 1, name: ['ประโยคแสดงการมีอยู่ / วางอยู่ (存现句)', 'Existential Sentence (存现句)'],
      slots: [['สถานที่', 'p'], ['有 / V着 / V了', 'v'], ['คน / สิ่งของ (ไม่ชี้เฉพาะ)', 'o']],
      rule: ['เอา <b>สถานที่ขึ้นต้นประโยค</b> เพื่อบอกว่า “ตรงนั้นมีอะไรอยู่ / วางอยู่ / โผล่มา”', 'Start with Place to state what exists, sits, or appears there.'],
      trap: ['ห้ามใส่ 在 หน้าสถานที่ (✗ 在桌子上有一本书)', 'Drop 在 before the starting place!'],
      ex: ['桌子上放着两杯咖啡。', 'Zhuōzi shàng fàngzhe liǎng bēi kāfēi.', 'บนโต๊ะมีกาแฟวางอยู่สองแก้ว', 'There are two cups of coffee on the table.'],
      gids: [['g3-1-054', '存现句 1'], ['g3-2-060', '存现句 2'], ['g3-3-078', '存现句 3']] },
    { cat: 'basic', lv: 1, name: ['ประโยคกริยาต่อเนื่อง (连动句)', 'Serial-Verb Sentence (连动句)'],
      slots: [['S', 's'], ['V1 + (O1) วิธี/เดินทาง', 'v'], ['V2 + (O2) จุดประสงค์', 'c']],
      rule: ['ประธานคนเดียวทำ <b>2 กริยาต่อกันตามลำดับเวลาจริง</b> (เช่น นั่งรถไฟ → ไปหาเพื่อน)', 'One subject performs two actions in chronological order.'],
      trap: ['ห้ามสลับลำดับกริยา (✗ 我去上海坐飞机)', 'Keep strict real-world sequence (method → destination)!'],
      ex: ['我坐地铁去机场接朋友。', 'Wǒ zuò dìtiě qù jīchǎng jiē péngyou.', 'ฉันนั่งรถไฟฟ้าไปสนามบินเพื่อรับเพื่อน', 'I take the subway to the airport to pick up a friend.'],
      gids: [['g3-1-056', '连动句 1'], ['g3-3-072', '连动句 2']] },
    { cat: 'basic', lv: 2, name: ['ประโยคคำควบ (兼语句: ให้/ชวน/ขอให้…ทำ)', 'Pivotal Sentence (兼语句)'],
      slots: [['S', 's'], ['请 / 让 / 叫', 'k'], ['O1 (ผู้รับคำสั่ง)', 'o'], ['V2 + (O2)', 'v']],
      rule: ['O1 เป็นทั้ง <b>กรรมของ V1</b> และ <b>ประธานของ V2</b> (ใช้บ่อยมากกับ 请, 让, 叫, 帮)', 'O1 serves as both object of V1 and subject of V2.'],
      trap: ['กริยาหลักต้องเป็นกลุ่มชวน/สั่ง/ขอ (请/让/叫/使)', 'First verb must be a causative/request verb.'],
      ex: ['老师让我回答这个问题。', 'Lǎoshī ràng wǒ huídá zhège wèntí.', 'คุณครูให้ฉันตอบคำถามข้อนี้', 'The teacher asked me to answer this question.'],
      gids: [['g3-2-066', '兼语句 1'], ['g3-4-060', '兼语句 2']] },
    { cat: 'basic', lv: 1, name: ['ประโยคกรรมสองตัว (双宾语句)', 'Double-Object Sentence (双宾语句)'],
      slots: [['S', 's'], ['给 / 送 / 教 / 问', 'v'], ['คน (O1)', 'o'], ['สิ่งของ/เรื่อง (O2)', 'c']],
      rule: ['วาง <b>ผู้รับ (คน)</b> ไว้หน้า <b>สิ่งของ</b> เสมอ (ตรงข้ามไทยบางคำที่พูด “ให้ของกับคน”)', 'Indirect object (person) ALWAYS precedes direct object (thing).'],
      trap: ['✗ 我送一本书他 → ✓ 我送他一本书', 'Person first, thing second!'],
      ex: ['朋友送了我一本词典。', 'Péngyou sòngle wǒ yì běn cídiǎn.', 'เพื่อนมอบพจนานุกรมให้ฉันหนึ่งเล่ม', 'My friend gave me a dictionary.'],
      gids: [['g3-1-058', '双宾语句 1'], ['g3-2-067', '双宾语句 2']] },
    { cat: 'basic', lv: 3, name: ['ประโยคซ้ำกริยา (重动句)', 'Verb-Copying Sentence (重动句)'],
      slots: [['S', 's'], ['V + O', 'v'], ['V (ซ้ำ)', 'k'], ['得… / ระยะเวลา', 'c']],
      rule: ['เมื่อกริยามี <b>ทั้งกรรม และบทเสริม (得/เวลา/จำนวน)</b> ต้องซ้ำกริยาอีกตัวก่อนใส่บทเสริม!', 'When a verb takes BOTH an object and a complement/duration, repeat the verb!'],
      trap: ['✗ 他说汉语得很好 → ✓ 他说汉语说得很好', 'Never squeeze O between V and 得!'],
      ex: ['他写汉字写得非常漂亮。', 'Tā xiě Hànzì xiě de fēicháng piàoliang.', 'เขาเขียนอักษรจีนได้สวยมาก', 'He writes Chinese characters beautifully.'],
      gids: [['g3-3-081', '重动句']] },

    // SPECIAL
    { cat: 'special', lv: 3, name: ['ประโยค 把 (จัดการของให้เกิดผล/ย้ายที่)', '把-Sentence (Disposal / Result)'],
      slots: [['S', 's'], ['把', 'k'], ['O (ชี้เฉพาะ)', 'o'], ['V', 'v'], ['在/到/给/ผล/了', 'c']],
      rule: ['ดึง <b>กรรมที่เจาะจง</b> มาไว้หน้ากริยาเพื่อย้ำว่า “จัดการมันจนเกิดผลลัพธ์/ย้ายที่”', 'Front a definite object with 把 to highlight how it is disposed of or changed.'],
      trap: ['ห้ามจบด้วยกริยาเปล่า ๆ! (✗ 把书看 → ✓ 把书看完)', 'Verb CANNOT stand bare; needs a result/place/了!'],
      ex: ['请把护照放到包里。', 'Qǐng bǎ hùzhào fàngdào bāo lǐ.', 'กรุณาเก็บพาสปอร์ตใส่ไว้ในกระเป๋า', 'Please put your passport into the bag.'],
      gids: [['g3-3-067', '把(1) วาง/ย้าย'], ['g3-3-068', '把(2) มอบให้'], ['g3-3-069', '把(3) บทเสริม'], ['g3-4-055', '把2 (HSK4)']] },
    { cat: 'special', lv: 3, name: ['ประโยคถูกกระทำ 被 / 叫 / 让 (被动句)', 'Passive Sentence (被 / 叫 / 让)'],
      slots: [['ผู้ถูกกระทำ', 's'], ['被 / 叫 / 让', 'k'], ['(ผู้กระทำ)', 'o'], ['V', 'v'], ['ผล / 了', 'c']],
      rule: ['บอกเรื่องที่ <b>ถูกกระทำ</b> (ละผู้กระทำได้เฉพาะกับ 被 เท่านั้น! ส่วน 叫/让 ต้องมีผู้กระทำเสมอ)', 'Passive voice; agent can be omitted after 被, but NOT after 叫/让.'],
      trap: ['คำปฏิเสธ (没/不) และกริยาช่วย (能/要) วางหน้า 被!', 'Put 没 / 不 / 能 BEFORE 被!'],
      ex: ['我的手机被弟弟拿走了。', 'Wǒ de shǒujī bèi dìdi názǒu le.', 'มือถือของฉันถูกน้องชายเอาไปแล้ว', 'My phone was taken away by my younger brother.'],
      gids: [['g3-3-070', '被(1) มีผู้กระทำ'], ['g3-3-071', '被(2) ละผู้กระทำ'], ['g3-4-059', '被动句 2']] },
    { cat: 'special', lv: 2, name: ['ประโยคเปรียบเทียบ 比 (比较句)', 'Comparison with 比 (比较句)'],
      slots: [['A', 's'], ['比', 'k'], ['B', 'o'], ['Adj', 'v'], ['(一点儿 / 得多 / ตัวเลข)', 'c']],
      rule: ['เทียบ A กับ B — ถ้าบอกความต่างให้วาง <b>ส่วนต่างไว้หลัง Adj</b> (ห้ามใส่ 很 หน้า Adj!)', 'Compare A > B; put exact degree/difference AFTER the adjective.'],
      trap: ['✗ 今天比昨天很热 → ✓ 今天比昨天热得多', 'NEVER put 很/非常 before Adj in a 比 sentence!'],
      ex: ['今天比昨天凉快多了。', 'Jīntiān bǐ zuótiān liángkuai duō le.', 'วันนี้เย็นสบายกว่าเมื่อวานเยอะเลย', 'Today is much cooler than yesterday.'],
      gids: [['g3-2-061', '比较句 1'], ['g3-2-062', '比较句 2']] },
    { cat: 'special', lv: 2, name: ['ประโยคเน้นย้ำ “是……的”', 'Focus Construction “是……的”'],
      slots: [['S', 's'], ['是', 'k'], ['เวลา / สถานที่ / วิธี / ผู้ทำ', 't'], ['V + (O)', 'v'], ['的', 'k']],
      rule: ['ใช้กับเหตุการณ์ <b>ที่เกิดไปแล้ว</b> เพื่อเน้นว่า “ทำเมื่อไหร่ / ที่ไหน / ด้วยวิธีไหน / ใครทำ”', 'Emphasizes when, where, how, or who did a PAST event.'],
      trap: ['เป็นเรื่องอดีตที่รู้กันอยู่แล้วว่าเกิดจริง ไม่ใช้เน้นอนาคต', 'For completed past events only!'],
      ex: ['我们是坐飞机来北京的。', 'Wǒmen shì zuò fēijī lái Běijīng de.', 'พวกเรานั่งเครื่องบินมาปักกิ่ง (เน้นวิธีเดินทาง)', 'It was by plane that we came to Beijing.'],
      gids: [['g3-2-065', '是……的 1'], ['g3-3-080', '是……的 2']] },
    { cat: 'special', lv: 1, name: ['3 ตัวช่วยกาลและสภาพ (了 / 着 / 过)', '3 Aspect Particles (了 / 着 / 过)'],
      slots: [['V + 了 (เสร็จแล้ว)', 'v'], ['V + 着 (ค้างอยู่)', 'c'], ['V + 过 (เคย…)', 'm']],
      rule: ['<b>了</b> = ทำเสร็จ/เกิดการเปลี่ยนแปลง · <b>着</b> = สภาพที่ค้างต่อเนื่อง · <b>过</b> = เคยมีประสบการณ์', '了 = completion/change · 着 = ongoing state · 过 = past experience.'],
      trap: ['ปฏิเสธ 了 และ 过 ใช้ 没 (และตัด 了 ทิ้ง แต่เก็บ 过 ไว้!)', 'Negate with 没: drop 了, KEEP 过 (没去过)!'],
      ex: ['我去过中国，还拍了很多照片。', 'Wǒ qùguo Zhōngguó, hái pāile hěn duō zhàopiàn.', 'ฉันเคยไปเมืองจีน และยังถ่ายรูปไว้เยอะมาก', 'I have been to China and took lots of photos.'],
      gids: [['g3-1-062', '完成态 了1'], ['g3-2-032', '持续态 着'], ['g3-2-031', '经历态 过']] },
    { cat: 'special', lv: 3, name: ['ส่วนขยายคำนามหลายชั้น (多项定语)', 'Multi-Layer Noun Modifiers (多项定语)'],
      slots: [['เจ้าของ/เวลา', 't'], ['จำนวน/ชี้เฉพาะ', 'm'], ['วลีกริยา', 'v'], ['คุณศัพท์', 'c'], ['นามหลัก', 's']],
      rule: ['ทุกส่วนขยายวาง <b>หน้าคำนามหลักทั้งหมด</b> เรียงจาก “ไกลตัว (เจ้าของ) → ใกล้ตัว (คุณสมบัติ)”', 'All modifiers sit BEFORE the head noun, from farthest (possessor) to closest (intrinsic type).'],
      trap: ['วลีจำนวน (那两本) สลับวางหลังวลีกริยาที่ยาวได้ (我买的那两本书)', 'Long verb clauses may precede 那两本 in natural speech.'],
      ex: ['我妈妈昨天买的那件红毛衣', 'Wǒ māma zuótiān mǎi de nà jiàn hóng máoyī', 'เสื้อไหมพรมสีแดงตัวนั้นที่แม่ฉันซื้อเมื่อวาน', 'that red sweater my mom bought yesterday'],
      gids: [['g3-3-056', '多项定语']] },

    // COMPLEMENTS (补语)
    { cat: 'comp', lv: 2, name: ['บทเสริมผลลัพธ์ (结果补语)', 'Resultative Complement (结果补语)'],
      slots: [['V (การกระทำ)', 'v'], ['完 / 好 / 见 / 到 / 懂 / 错', 'c'], ['(了 / O)', 'o']],
      rule: ['ติดหลังกริยาทันทีเพื่อบอกว่า <b>ทำแล้วได้ผลอย่างไร</b> (เช่น 看+见 = เห็น, 听+懂 = ฟังเข้าใจ)', 'Attaches directly to V to show the outcome of the action.'],
      trap: ['ปฏิเสธใช้ 没 (没看完) · ห้ามแทรก 了 ระหว่าง V กับผล!', 'Never split V and result with 了!'],
      ex: ['今天的作业我已经写完了。', 'Jīntiān de zuòyè wǒ yǐjīng xiěwán le.', 'การบ้านวันนี้ฉันเขียนเสร็จหมดแล้ว', 'I have already finished today’s homework.'],
      gids: [['g3-2-048', '结果补语 1'], ['g3-3-057', '结果补语 2']] },
    { cat: 'comp', lv: 2, name: ['บทเสริมทิศทาง (趋向补语)', 'Directional Complement (趋向补语)'],
      slots: [['V', 'v'], ['上/下/进/出/回/过/起', 'c'], ['来 (เข้าหาผู้พูด) / 去 (ออกห่าง)', 'k']],
      rule: ['บอกทิศทางการเคลื่อนที่ — <b>来</b> = เข้าหาผู้พูด · <b>去</b> = ห่างออกจากผู้พูด', 'Shows movement direction: 来 toward speaker, 去 away from speaker.'],
      trap: ['กรรมสถานที่ต้องวาง <b>หน้า 来/去</b> เสมอ! (走进教室来 ✓)', 'Place objects MUST go before 来/去!'],
      ex: ['请把椅子搬进房间来。', 'Qǐng bǎ yǐzi bānjìn fángjiān lái.', 'ช่วยยกเก้าอี้เข้ามาในห้องที', 'Please carry the chair into the room.'],
      gids: [['g3-2-049', '简单趋向 1'], ['g3-2-051', '复合趋向补语']] },
    { cat: 'comp', lv: 2, name: ['บทเสริมสภาพ/ระดับ (状态·程度补语)', 'State & Degree Complement (得)'],
      slots: [['S', 's'], ['V', 'v'], ['得', 'k'], ['很 + Adj / 极了 / 很', 'c']],
      rule: ['ประเมินว่าทำกริยานั้น <b>ได้ดี/เร็ว/ช้าแค่ไหน</b> (ต้องใช้ <b>得</b> ที่แปลว่า “ได้” เชื่อมเสมอ!)', 'Evaluates how well/fast an action is done using 得.'],
      trap: ['ระวัง 3 เตอะ: 的 (ขยายนาม) · 地 (ขยายกริยาข้างหน้า) · 得 (ประเมินผลข้างหลัง)', 'Don’t mix up 的, 地, and 得!'],
      ex: ['她唱歌唱得好极了！', 'Tā chànggē chàng de hǎo jí le!', 'เธอร้องเพลงได้เพราะสุด ๆ ไปเลย!', 'She sings wonderfully!'],
      gids: [['g3-2-052', '状态补语'], ['g3-3-062', '程度补语'], ['g3-2-030', '3 เตอะ 的/地/得']] },
    { cat: 'comp', lv: 3, name: ['บทเสริมความเป็นไปได้ (可能补语)', 'Potential Complement (V得/不…)'],
      slots: [['V', 'v'], ['得 (ไหว/ได้) / 不 (ไม่ไหว/ไม่ได้)', 'k'], ['ผล / ทิศทาง / 了 (liǎo)', 'c']],
      rule: ['แทรก <b>得 / 不</b> กลางบทเสริมผลหรือทิศทางเพื่อบอกว่า “ทำจนเกิดผลนั้นได้ไหม”', 'Insert 得 (can) or 不 (cannot) between V and its complement.'],
      trap: ['ห้ามใช้คู่กับ 能 ซ้ำซ้อน (✗ 不能看得懂 → ✓ 看不懂)', 'Don’t combine 能 with V得/不C!'],
      ex: ['字太小了，我看不清楚。', 'Zì tài xiǎo le, wǒ kàn bu qīngchu.', 'ตัวหนังสือเล็กเกินไป ฉันมองไม่ชัด', 'The text is too small — I can’t see clearly.'],
      gids: [['g3-3-061', '可能补语 1'], ['g3-4-052', '可能补语 2']] },
    { cat: 'comp', lv: 3, name: ['บทเสริมระยะเวลา & จำนวนครั้ง (数量补语)', 'Duration & Frequency Complement'],
      slots: [['S', 's'], ['V + (了)', 'v'], ['ระยะเวลา / จำนวนครั้ง', 't'], ['(O)', 'o']],
      rule: ['วาง <b>นานแค่ไหน (两个小时)</b> หรือ <b>กี่ครั้ง (两次)</b> ไว้หลังกริยาเสมอ', 'Place duration or frequency AFTER the verb.'],
      trap: ['ถ้ากรรมเป็นสรรพนามคน (他/你) ให้วาง <b>หน้าจำนวนครั้ง</b> (见过他两次 ✓)', 'Pronoun objects go BEFORE frequency (见过他两次)!'],
      ex: ['这部电影我看了两遍。', 'Zhè bù diànyǐng wǒ kànle liǎng biàn.', 'หนังเรื่องนี้ฉันดูไปสองรอบแล้ว', 'I watched this movie twice.'],
      gids: [['g3-3-064', '数量补语 3 (เวลา)'], ['g3-2-013', 'ลักษณนามกริยา 次']] },

    // COMPLEX (复句)
    { cat: 'complex', lv: 2, name: ['เหตุและผล (因为……，所以……)', 'Cause & Effect (因为……，所以……)'],
      slots: [['因为 + เหตุผล', 'k'], ['，', 'm'], ['所以 + ผลลัพธ์', 'k']],
      rule: ['ภาษาจีนใช้ <b>คู่กันทั้งสองตัวได้เลย</b> (ต่างจากอังกฤษที่ห้ามใช้ because + so พร้อมกัน!)', 'Unlike English, Chinese happily pairs 因为 and 所以 together!'],
      trap: ['ถ้ามีประธานคนเดียว วางประธานไว้หน้าหรือหลัง 因为 ก็ได้', 'Same subject can go before or after 因为.'],
      ex: ['因为下雨，所以我们没去公园。', 'Yīnwèi xiàyǔ, suǒyǐ wǒmen méi qù gōngyuán.', 'เพราะฝนตก พวกเราเลยไม่ได้ไปสวนสาธารณะ', 'Because it rained, we didn’t go to the park.'],
      gids: [['g3-2-070', '因果复句'], ['g3-2-029', '连词 因为…所以']] },
    { cat: 'complex', lv: 2, name: ['ขัดแย้ง (虽然……，但是/可是……)', 'Concession (虽然……，但是/可是……)'],
      slots: [['虽然 + ความจริง', 'k'], ['，', 'm'], ['但是 / 可是 + ข้อขัดแย้ง', 'k']],
      rule: ['ใช้ <b>虽然…但是…</b> คู่กันได้เสมอ (ห้ามแปลตรงจากอังกฤษแล้วตัดตัวใดตัวหนึ่งออกหากอยากเน้นชัด)', 'Pair 虽然 + 但是/可是 together (unlike English although + but!).'],
      trap: ['ถ้าประธาน 2 ฝั่งต่างกัน ต้องวางประธานไว้หลัง 虽然 และหลัง 但是', 'Different subjects each go AFTER the conjunctions.'],
      ex: ['虽然汉字有点儿难，但是很有意思。', 'Suīrán Hànzì yǒudiǎnr nán, dànshì hěn yǒu yìsi.', 'ถึงแม้อักษรจีนจะยากนิดหน่อย แต่น่าสนใจมาก', 'Although Chinese characters are a bit hard, they are fascinating.'],
      gids: [['g3-2-069', '转折复句'], ['g3-3-088', '虽然……，可是……']] },
    { cat: 'complex', lv: 3, name: ['เสริมระดับ (不但……，而且……)', 'Progressive (不但……，而且……)'],
      slots: [['不但 + ข้อ 1', 'k'], ['，', 'm'], ['而且 + ข้อ 2 (แรง/มากกว่า)', 'k']],
      rule: ['“ไม่เพียงแต่…แต่ยัง…” — ประธานเดียวกันวาง <b>หน้า 不但</b> · ประธานต่างกันวาง <b>หลัง 不但</b>', 'Same subject goes BEFORE 不但; different subjects go AFTER 不但!'],
      trap: ['✗ 不但他会汉语，而且会日语 → ✓ 他不但会汉语，而且会日语', 'Watch subject placement with 不但!'],
      ex: ['这家餐厅不但好吃，而且很便宜。', 'Zhè jiā cāntīng búdàn hǎochī, érqiě hěn piányi.', 'ร้านนี้ไม่เพียงแต่อร่อย แต่ยังถูกมากด้วย', 'This restaurant is not only tasty, but also cheap.'],
      gids: [['g3-3-087', '递进复句 不但…而且']] },
    { cat: 'complex', lv: 3, name: ['สมมติเงื่อนไข (如果 / 要是……，就……)', 'Conditional (如果 / 要是……，就……)'],
      slots: [['如果 / 要是 + เงื่อนไข', 'k'], ['，', 'm'], ['S + 就 + ผลลัพธ์', 'v']],
      rule: ['“ถ้าหาก…ก็…” — ภาษาพูดเติม <b>的话</b> ท้ายประโยคแรกได้ (ถ้ามี时间的话，就去吧)', '“If…then…” — optionally add 的话 at the end of the first clause.'],
      trap: ['就 ต้องวาง <b>หลังประธาน</b> เสมอ (✓ 你就去 | ✗ 就你去)', '就 always goes AFTER the subject of clause 2!'],
      ex: ['如果明天不下雨，我们就去爬山。', 'Rúguǒ míngtiān bú xiàyǔ, wǒmen jiù qù páshān.', 'ถ้าพรุ่งนี้ฝนไม่ตก พวกเราก็จะไปปีนเขา', 'If it doesn’t rain tomorrow, we’ll go hiking.'],
      gids: [['g3-3-089', '如果……，就……'], ['g3-3-090', '……的话，就……']] },
    { cat: 'complex', lv: 3, name: ['เงื่อนไขเพียงพอ vs จำเป็น (只要…就 vs 只有…才)', 'Sufficient vs Necessary (只要…就 vs 只有…才)'],
      slots: [['只要…就 (แค่…ก็พอ)', 'v'], ['vs', 'm'], ['只有…才 (ต้อง…เท่านั้นจึงจะ)', 'k']],
      rule: ['<b>只要…就</b> = เงื่อนไขง่าย แค่ทำข้อนี้ก็พอ · <b>只有…才</b> = เงื่อนไขเดียวที่ขาดไม่ได้!', '只要…就 = “as long as…then” · 只有…才 = “ONLY if…then”.'],
      trap: ['ห้ามสลับคู่! 只要 คู่ 就 · 只有 คู่ 才 เท่านั้น!', 'Never mix pairs: 只要→就 and 只有→才!'],
      ex: ['只有多练习，才能说得流利。', 'Zhǐyǒu duō liànxí, cái néng shuō de liúlì.', 'มีแต่ฝึกบ่อย ๆ เท่านั้น จึงจะพูดได้คล่อง', 'Only by practising more can you speak fluently.'],
      gids: [['g3-3-092', '只要……，就……'], ['g3-3-091', '只有……，才……']] },
    { cat: 'complex', lv: 3, name: ['ทำพร้อมกัน / ทันทีที่ / ยิ่ง…ยิ่ง…', 'Parallel & Immediate (一边 / 一…就 / 越…越)'],
      slots: [['一边 V1 一边 V2', 'v'], ['一 V1 就 V2', 'k'], ['越 A 越 B', 'c']],
      rule: ['3 โครงสร้างพูดคล่องแบบเจ้าของภาษา: <b>一边…一边</b> (ทำพร้อมกัน) · <b>一…就</b> (พอ…ก็ทันที) · <b>越…越</b> (ยิ่ง…ยิ่ง)', '3 high-frequency native connectors: simultaneous, immediate, progressive.'],
      trap: ['一…就 ใช้เชื่อมเหตุที่เกิดติดกันแทบไม่มีช่องว่างเวลา', '一…就 signals instant sequence.'],
      ex: ['我一回家就先洗个澡。', 'Wǒ yì huíjiā jiù xiān xǐ ge zǎo.', 'พอฉันถึงบ้านก็รีบอาบน้ำทันที', 'As soon as I get home, I take a shower first.'],
      gids: [['g3-3-086', '一边……一边……'], ['g3-2-071', '一……就……'], ['g3-3-049', '越……越……']] }
  ];

  let sCat = 'all', sLv = 0, sQ = '';

  function matchSyn(p) {
    if (sCat !== 'all' && p.cat !== sCat) return false;
    if (sLv && p.lv !== sLv) return false;
    if (!sQ) return true;
    const ql = sQ.toLowerCase();
    const hay = [
      p.name.join(' '), p.slots.map(x => x[0]).join(' '),
      p.rule.join(' '), p.trap.join(' '), p.ex.join(' '),
      p.gids.map(x => x.join(' ')).join(' '), 'hsk' + p.lv, 'hsk ' + p.lv
    ].join(' ').toLowerCase();
    return hay.includes(ql);
  }

  function renderSyntaxCards(list) {
    const en = isEn();
    if (!list.length) return `<p class="sb-empty muted">${T('ไม่พบหัวข้อที่ค้นหา')}</p>`;
    return list.map(p => `<article class="rb-scard" style="--c:var(--hsk${p.lv})">
      <div class="rb-scard-top">
        <span class="gb-lvpill">HSK ${p.lv}</span>
        <h4>${esc(en ? p.name[1] : p.name[0])}</h4>
      </div>
      <div class="rb-slots">
        ${p.slots.map(([lbl, role], i) => `${i ? '<span class="rb-plus">+</span>' : ''}<span class="rb-slot-b r-${role}" lang="zh-Hans">${esc(lbl)}</span>`).join('')}
      </div>
      <p class="rb-srule">${en ? p.rule[1] : p.rule[0]}</p>
      <div class="rb-strap"><span>⚠️ ${esc(en ? p.trap[1] : p.trap[0])}</span></div>
      <div class="rb-sex">
        <div class="rb-sex-z"><b lang="zh-Hans">${esc(p.ex[0])}</b><button type="button" class="gx-say sm" data-rbsay="${esc(p.ex[0])}" aria-label="${esc(T('ฟังเสียง'))}">${icn('vol')}</button></div>
        <div class="pyx">${esc(p.ex[1])}</div>
        <div class="rb-sex-tr">${esc(en ? p.ex[3] : p.ex[2])}</div>
      </div>
      <div class="rb-sfoot">
        ${p.gids.map(([gid, lbl]) => `<button type="button" class="rb-link" data-rbg="${gid}">${T('เจาะลึกใน VOL. 06')}: ${esc(lbl)} →</button>`).join('')}
      </div>
    </article>`).join('');
  }

  function renderSyntaxBook() {
    const en = isEn();
    const matched = SYN_PATTERNS.filter(matchSyn);
    return `<div class="rb rb-syntax">
      <header class="rb-hero">
        <div class="rb-hero-top">
          <div>
            <h2><span lang="zh-Hans">句型结构</span> ${T('รูปแบบโครงสร้างประโยค')}</h2>
            <p>${en ? '24 essential HSK 1–4 sentence blueprints on one screen — tap any card to jump into VOL. 06' : 'แผนผังโครงสร้างประโยคจีน HSK 1–4 ครบ 24 แบบในหน้าเดียว — แตะลิงก์เจาะลึกเข้า VOL. 06 ได้ทันที'}</p>
          </div>
          ${rbToolsHtml()}
        </div>
      </header>

      <section class="rb-golden">
        <div class="rb-golden-h">
          <b>${icn('star')} ${T('สูตรลำดับคำทองคำ')}</b>
          <button type="button" class="gx-say sm" data-rbsay="我昨天晚上在图书馆跟朋友看完了两本书。">${icn('vol')}</button>
        </div>
        <div class="rb-gslots">
          ${[
            ['s', 'ประธาน (S)', '我', 'wǒ'],
            ['t', 'เวลา (Time)', '昨天晚上', 'zuótiān wǎnshang'],
            ['p', 'สถานที่ (Place)', '在图书馆', 'zài túshūguǎn'],
            ['m', 'วิธี/กับใคร', '跟朋友', 'gēn péngyou'],
            ['v', 'กริยา (V)', '看', 'kàn'],
            ['c', 'บทเสริม', '完了', 'wán le'],
            ['o', 'กรรม (O)', '两本书。', 'liǎng běn shū']
          ].map(([r, k, z, py]) => `<div class="rb-gcell r-${r}">
            <small>${esc(k)}</small>
            <b lang="zh-Hans">${esc(z)}</b>
            <span class="pyx">${esc(py)}</span>
          </div>`).join('')}
        </div>
        <p class="rb-gtrans">${en ? '“Last night I finished reading two books with a friend at the library.”' : '“เมื่อคืนฉันอ่านหนังสือจบไปสองเล่มกับเพื่อนที่ห้องสมุด” (สังเกต: เวลา + สถานที่ + กับเพื่อน วางหน้ากริยาหมดเลย!)'}</p>
      </section>

      <div class="rb-sbar">
        <label class="gb-search sb-search">
          ${icn('search')}
          <input type="search" id="rbSQ" value="${esc(sQ)}" placeholder="${esc(T('ค้นหาโครงสร้าง เช่น 把, 被, 比, 补语, 虽然…'))}" autocomplete="off">
          <button type="button" class="gb-clr" id="rbSClr" ${sQ ? '' : 'hidden'}>${icn('x')}</button>
        </label>
        <div class="gb-uf" role="tablist">
          <button type="button" class="${sLv === 0 ? 'on' : ''}" data-rbslv="0">${T('ทั้งหมด')}</button>
          ${[1, 2, 3, 4].map(lv => `<button type="button" class="${sLv === lv ? 'on' : ''}" data-rbslv="${lv}">HSK ${lv}</button>`).join('')}
        </div>
      </div>

      <div class="sb-themes" role="tablist">
        ${SYN_CATS.map(([k, th, eg]) => {
          const cnt = k === 'all' ? SYN_PATTERNS.length : SYN_PATTERNS.filter(p => p.cat === k).length;
          return `<button type="button" class="sb-tchip${sCat === k ? ' on' : ''}" data-rbscat="${k}">${esc(en ? eg : th)} <small>${cnt}</small></button>`;
        }).join('')}
      </div>

      <div class="sb-statline">
        <span id="rbSCount">${T('พบ')} <b>${matched.length}</b> / ${SYN_PATTERNS.length} ${en ? 'patterns' : 'โครงสร้าง'}</span>
        ${(sCat !== 'all' || sLv || sQ) ? `<button type="button" class="sb-reset" data-rbsreset>${T('ล้างคำค้น')}</button>` : ''}
      </div>

      <div class="rb-sgrid" id="rbSGrid">${renderSyntaxCards(matched)}</div>
    </div>`;
  }

  /* ---------- LIVE CLOCK IN-PLACE UPDATE (smooth slider dragging) ---------- */
  function updateClockLive(body) {
    const en = isEn();
    const { per, h12, out } = clockExpressions(tHour, tMin);
    const hh = String(tHour).padStart(2, '0'), mm = String(tMin).padStart(2, '0');
    const primary = out[out.length - 1];
    const vis = $('#rbClockVis', body), exBox = $('#rbExprs', body), tip = $('#rbTip', body);
    const hLbl = $('#rbHLbl', body), mLbl = $('#rbMLbl', body);
    if (hLbl) hLbl.textContent = hh;
    if (mLbl) mLbl.textContent = mm;
    if (vis) {
      vis.innerHTML = `${clockSvg(tHour, tMin)}
        <div class="rb-clock-dig">
          <span class="rb-per-pill">${esc(per.zh)} · ${esc(en ? per.en : per.th)}</span>
          <div class="rb-hhmm">${hh}:${mm}</div>
          <button type="button" class="btn primary sm" data-rbsay="${esc(primary.zh)}">${icn('vol')}${en ? 'Listen' : 'ฟังเสียงอ่าน'}</button>
        </div>`;
    }
    if (exBox) {
      exBox.innerHTML = out.map(e => `<div class="rb-expr">
        <span class="rb-expr-tag">${esc(en ? e.tag[1] : e.tag[0])}</span>
        <div class="rb-expr-main"><b lang="zh-Hans">${esc(e.zh)}</b><span class="pyx">${esc(e.py)}</span></div>
        <button type="button" class="gx-say sm" data-rbsay="${esc(e.zh)}" aria-label="${esc(T('ฟังเสียง'))}">${icn('vol')}</button>
      </div>`).join('');
    }
    if (tip) {
      const trapNote = tMin === 30
        ? (en ? `Trap check: <b>${hourZh(h12)}点半</b> = ${h12}:30 (clock time) · <b>${hourZh(h12)}个半小时</b> = ${h12}.5 hours (duration)`
              : `ระวังสับสน: <b>${hourZh(h12)}点半</b> = ${h12}:30 น. (จุดเวลา) ≠ <b>${hourZh(h12)}个半小时</b> = ${h12} ชั่วโมงครึ่ง (ระยะเวลา)`)
        : (h12 === 2
          ? (en ? 'Remember: 2 o’clock is ALWAYS <b>两点</b> (liǎng diǎn), never 二点!'
                : 'จำให้แม่น: บ่ายสอง/ตีสอง ต้องใช้ <b>两点</b> (liǎng diǎn) ห้ามพูด 二点 เด็ดขาด!')
          : (tMin > 0 && tMin < 10
            ? (en ? 'Minutes 01–09 require <b>零 (líng)</b> before the minute number.'
                  : 'เศษนาที 01–09 ต้องเติมคำว่า <b>零 (líng)</b> เสมอ เช่น 八点零五分')
            : (tMin >= 45
              ? (en ? 'Past :45 you can also count backwards with <b>差 (chà)</b> to the next hour!'
                    : 'ตั้งแต่ :45 ขึ้นไป คนจีนนิยมใช้ <b>差 (chà)</b> นับถอยหลังก่อนถึงชั่วโมงถัดไปด้วย!')
              : (en ? 'Put the time-of-day word (早上/下午/晚上) BEFORE the hour.'
                    : 'ภาษาจีนวางช่วงเวลา (早上/下午/晚上) ไว้ <b>หน้า</b> ตัวเลขนาฬิกาเสมอ'))));
      tip.innerHTML = `${icn('bulb')}<span>${trapNote}</span>`;
    }
    $$('.rb-pre[data-rbset]', body).forEach(b => {
      b.classList.toggle('on', b.dataset.rbset === `${tHour}:${tMin}`);
    });
  }

  /* ---------- RENDER & HOOKS ---------- */
  function draw() {
    const body = $('#bkBody');
    if (Book.id === TIME_ID) {
      body.innerHTML = renderTimeBook();
      $('#bkVol').textContent = `VOL. 07 · Time · ${T('การบอกเวลา')}`;
      const hEl = $('#rbHour', body), mEl = $('#rbMin', body);
      if (hEl) hEl.oninput = () => { tHour = +hEl.value; updateClockLive(body); };
      if (mEl) mEl.oninput = () => { tMin = +mEl.value; updateClockLive(body); };
    } else if (Book.id === SYNTAX_ID) {
      body.innerHTML = renderSyntaxBook();
      $('#bkVol').textContent = `VOL. 11 · Syntax · ${SYN_PATTERNS.length} ${isEn() ? 'patterns' : 'โครงสร้าง'}`;
      const qIn = $('#rbSQ', body), qClr = $('#rbSClr', body);
      if (qIn) {
        qIn.addEventListener('input', () => {
          sQ = qIn.value;
          if (qClr) qClr.hidden = !sQ;
          const matched = SYN_PATTERNS.filter(matchSyn);
          const g = $('#rbSGrid', body), c = $('#rbSCount', body);
          if (g) g.innerHTML = renderSyntaxCards(matched);
          if (c) c.innerHTML = `${T('พบ')} <b>${matched.length}</b> / ${SYN_PATTERNS.length} ${isEn() ? 'patterns' : 'โครงสร้าง'}`;
        });
        if (qClr) qClr.onclick = () => { sQ = ''; qIn.value = ''; qClr.hidden = true; draw(); };
      }
    }
  }

  const show0 = Book.show, render0 = Book.render, go0 = Book.go;
  Book.show = function (id) {
    if (id === TIME_ID) {
      const now = new Date();
      tHour = now.getHours(); tMin = now.getMinutes();
    }
    return show0.apply(this, arguments);
  };
  Book.render = function () {
    const r = render0.apply(this, arguments);
    const on = !!IDS[this.id];
    $('#v-book').classList.toggle('rb-on', on);
    if (on) draw();
    return r;
  };
  Book.go = function () {
    if (IDS[this.id]) return;
    return go0.apply(this, arguments);
  };

  $('#bkBody').addEventListener('click', e => {
    if (!IDS[Book.id]) return;
    const t = e.target.closest('[data-rbsay],[data-rblang],[data-rbpy],[data-rbttab],[data-rbset],[data-rbg],[data-rbsyn],[data-rbqans],[data-rbqnext],[data-rbqretry],[data-rbscat],[data-rbslv],[data-rbsreset]');
    if (!t) return;
    const ds = t.dataset;

    if (ds.rbsay) { if (typeof TTS !== 'undefined') TTS.speak(ds.rbsay); return; }
    if (ds.rblang) { sfx('tap'); S().rbLang = ds.rblang; try { Store.save(); } catch (err) {} draw(); return; }
    if (ds.rbpy != null) {
      if (typeof togglePinyin === 'function') togglePinyin();
      const on = S().showPinyin !== false;
      t.classList.toggle('off', !on);
      const u = t.querySelector('use'); if (u) u.setAttribute('href', on ? '#i-eye' : '#i-eye-off');
      return;
    }
    if (ds.rbttab) { sfx('tap'); tTab = ds.rbttab; draw(); return; }
    if (ds.rbset) {
      sfx('tap');
      if (ds.rbset === 'now') { const d = new Date(); tHour = d.getHours(); tMin = d.getMinutes(); }
      else { const [h, m] = ds.rbset.split(':'); tHour = +h; tMin = +m; }
      draw(); return;
    }
    if (ds.rbg) { sfx('tap'); Router.go('/book/grammar/' + ds.rbg); return; }
    if (ds.rbsyn) { sfx('tap'); Router.go('/book/synonym/' + ds.rbsyn); return; }
    if (ds.rbqans != null && tQuiz.picked === null) {
      const pick = +ds.rbqans;
      tQuiz.picked = pick;
      if (pick === TIME_QUIZ[tQuiz.i].a) { tQuiz.score++; sfx('ok'); } else sfx('bad');
      draw(); return;
    }
    if (ds.rbqnext != null) { sfx('tap'); tQuiz.i++; tQuiz.picked = null; draw(); return; }
    if (ds.rbqretry != null) { sfx('tap'); tQuiz = { i: 0, score: 0, picked: null }; draw(); return; }
    if (ds.rbscat) { sfx('tap'); sCat = ds.rbscat; draw(); return; }
    if (ds.rbslv != null) { sfx('tap'); sLv = +ds.rbslv; draw(); return; }
    if (ds.rbsreset != null) { sfx('tap'); sCat = 'all'; sLv = 0; sQ = ''; draw(); return; }
  });
})();
