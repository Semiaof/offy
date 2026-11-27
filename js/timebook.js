'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — VOL. 07 时间与日期 (js/timebook.js) · replaces the old clock page of refbooks.js
   · 3-hand clock (时 分 秒): drag any hand with finger, mouse or Apple Pencil; minute hand carries the hour, second hand
     carries the minute, like a real clock. Pencil hover lights up the hand you are about to grab.
   · 12-hour (Chinese day periods 凌晨…晚上) / 24-hour reading switch, remembered per device
   · Dates: year digit by digit, 月, 日/号, 星期/周/礼拜 · point in time vs duration · quizzes incl. listen-and-set-the-clock
     and Apple Pencil handwriting answers (HandPad)
   · Number rules live in VOL. 14 数字与计算 (js/numbook.js) and are linked, not repeated
   Pinyin keeps 一 / 不 in their original tones (project rule).
   ===================================================================== */
(function timebook() {
  const ID = 'time';
  const icn = (n, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}"><use href="#i-${n}"/></svg>`;
  const S = () => (typeof Store !== 'undefined' && Store.d && Store.d.settings) ? Store.d.settings : {};
  const save = () => { try { Store.save(); } catch (e) {} };
  const en = () => { const l = S().rbLang; return l ? l === 'en' : (typeof LANG !== 'undefined' && LANG === 'en'); };
  const L = (th, e) => (en() ? e : th);
  const say = t => { if (typeof TTS !== 'undefined') TTS.speak(t); };

  /* ---------- numbers (shared with numbook.js through window.ZhNum when present) ---------- */
  const D = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const DP = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'];
  const n99 = n => n < 10 ? D[n] : (n < 20 ? '十' + (n % 10 ? D[n % 10] : '') : D[n / 10 | 0] + '十' + (n % 10 ? D[n % 10] : ''));
  const n99p = n => n < 10 ? DP[n] : (n < 20 ? 'shí' + (n % 10 ? ' ' + DP[n % 10] : '') : DP[n / 10 | 0] + 'shí' + (n % 10 ? ' ' + DP[n % 10] : ''));
  const hourZ = h => h === 2 ? '两' : n99(h);
  const hourP = h => h === 2 ? 'liǎng' : n99p(h);

  const PERIODS = [
    [0, 5, '凌晨', 'língchén', 'ตี (เช้ามืด)', 'small hours'], [5, 8, '早上', 'zǎoshang', 'ตอนเช้า', 'morning'],
    [8, 11, '上午', 'shàngwǔ', 'ช่วงสาย', 'late morning'], [11, 13, '中午', 'zhōngwǔ', 'เที่ยง', 'noon'],
    [13, 18, '下午', 'xiàwǔ', 'บ่าย', 'afternoon'], [18, 24, '晚上', 'wǎnshang', 'ค่ำ / กลางคืน', 'evening / night']];
  const period = h => { const p = PERIODS.find(x => h >= x[0] && h < x[1]); return { zh: p[2], py: p[3], th: p[4], en: p[5] }; };

  /* every way to read h:m:s, most common first */
  function readings(h, m, s, h24) {
    const out = [], sec = s ? (s < 10 ? `零${D[s]}秒` : `${n99(s)}秒`) : '', secP = s ? (s < 10 ? ` líng ${DP[s]} miǎo` : ` ${n99p(s)} miǎo`) : '';
    if (h24) {
      const hz = h === 2 ? '两' : n99(h), hp = h === 2 ? 'liǎng' : n99p(h);
      const mz = m === 0 ? '' : (m < 10 ? `零${D[m]}分` : `${n99(m)}分`), mp = m === 0 ? '' : (m < 10 ? ` líng ${DP[m]} fēn` : ` ${n99p(m)} fēn`);
      out.push({ tag: L('แบบ 24 ชั่วโมง (ประกาศ / ตารางเวลา)', '24-hour (announcements, timetables)'), zh: `${hz}点${mz}${sec}`, py: `${hp} diǎn${mp}${secP}` });
    }
    const p = period(h), h12 = h % 12 || 12, hz = hourZ(h12), hp = hourP(h12), pre = `${p.zh}`, preP = `${p.py} `;
    if (m === 0 && !s) {
      out.push({ tag: L('ตรงชั่วโมง', 'On the hour'), zh: `${pre}${hz}点`, py: `${preP}${hp} diǎn` });
      out.push({ tag: L('ย้ำว่าตรงเป๊ะ (整)', 'Exactly (整)'), zh: `${pre}${hz}点整`, py: `${preP}${hp} diǎn zhěng` });
    } else {
      const mz = m === 0 ? '' : (m < 10 ? `零${D[m]}分` : `${n99(m)}分`), mp = m === 0 ? '' : (m < 10 ? ` líng ${DP[m]} fēn` : ` ${n99p(m)} fēn`);
      out.push({ tag: m > 0 && m < 10 ? L('นาที 1–9 ต้องมี 零', 'Minutes 1–9 need 零') : L('อ่านตรงตัว', 'Plain'), zh: `${pre}${hz}点${mz}${sec}`, py: `${preP}${hp} diǎn${mp}${secP}` });
      if (!s && m >= 10 && m % 15) out.push({ tag: L('ตัด 分 ได้ (นาที 10 ขึ้นไป)', 'Drop 分 (10+ min)'), zh: `${pre}${hz}点${n99(m)}`, py: `${preP}${hp} diǎn ${n99p(m)}` });
    }
    if (!s && m === 15) out.push({ tag: L('一刻 = 15 นาที', '一刻 = quarter'), zh: `${pre}${hz}点一刻`, py: `${preP}${hp} diǎn yī kè` });
    if (!s && m === 30) out.push({ tag: L('半 = ครึ่ง (นิยมที่สุด)', '半 = half (most common)'), zh: `${pre}${hz}点半`, py: `${preP}${hp} diǎn bàn` });
    if (!s && m === 45) out.push({ tag: L('三刻 = 45 นาที', '三刻 = three quarters'), zh: `${pre}${hz}点三刻`, py: `${preP}${hp} diǎn sān kè` });
    if (!s && m >= 45) {
      const nh = h12 % 12 + 1, d = 60 - m;
      out.push({ tag: L(`差 = อีก ${d} นาทีจะถึง`, `差 = ${d} to`), zh: `${pre}差${d === 15 ? '一刻' : n99(d) + '分'}${hourZ(nh)}点`, py: `${preP}chà ${d === 15 ? 'yī kè' : n99p(d) + ' fēn'} ${hourP(nh)} diǎn` });
    }
    return out;
  }

  /* ---------- state ---------- */
  const st = { h: 8, m: 30, s: 0, tab: 'clock', grab: null, hover: null, date: null, quiz: null };
  const h24 = () => !!S().tb24;

  /* ---------- clock SVG (viewBox 0..200) ---------- */
  const R = 100, polar = (deg, r) => [R + r * Math.sin(deg * Math.PI / 180), R - r * Math.cos(deg * Math.PI / 180)];
  function face() {
    let t = '';
    for (let i = 0; i < 60; i++) {
      const big = i % 5 === 0, [x1, y1] = polar(i * 6, big ? 80 : 84), [x2, y2] = polar(i * 6, 89);
      t += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${big ? 'tk tk5' : 'tk'}"/>`;
    }
    for (let i = 1; i <= 12; i++) {
      const [x, y] = polar(i * 30, 70);
      t += `<text x="${x}" y="${y}" class="nm">${i}</text>`;
      if (h24()) { const [a, b] = polar(i * 30, 52); t += `<text x="${a}" y="${b}" class="nm24">${i === 12 ? '0' : i + 12}</text>`; }
    }
    return t;
  }
  function clockSvg() {
    const sA = st.s * 6, mA = (st.m + st.s / 60) * 6, hA = ((st.h % 12) + st.m / 60) * 30;
    const hand = (k, a, len, w) => { const [x, y] = polar(a, len), [bx, by] = polar(a + 180, len * .16);
      return `<line class="hd hd-${k}${st.grab === k ? ' grab' : ''}${st.hover === k ? ' hov' : ''}" x1="${bx}" y1="${by}" x2="${x}" y2="${y}" stroke-width="${w}"/>`; };
    return `<svg class="tb-clock" id="tbClock" viewBox="0 0 200 200" role="img" aria-label="${L('นาฬิกา ลากเข็มได้', 'Clock with draggable hands')}">
      <circle cx="100" cy="100" r="95" class="fc"/><circle cx="100" cy="100" r="95" class="fc-ring"/>${face()}
      ${hand('h', hA, 46, 7)}${hand('m', mA, 70, 4.5)}${hand('s', sA, 80, 1.8)}
      <circle cx="100" cy="100" r="5" class="pin"/></svg>`;
  }

  /* ---------- drag / Pencil hover on the clock ---------- */
  const angleAt = (svg, e) => { const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 200 - R, y = (e.clientY - r.top) / r.height * 200 - R;
    return { a: (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360, d: Math.hypot(x, y) }; };
  function nearest(a, d) {
    const hands = [['s', st.s * 6, 80], ['m', (st.m + st.s / 60) * 6, 70], ['h', ((st.h % 12) + st.m / 60) * 30, 46]];
    let best = null, bd = 1e9;
    for (const [k, ang, len] of hands) {
      const da = Math.min(Math.abs(a - ang), 360 - Math.abs(a - ang)), radial = d > len + 12 ? 999 : 0;
      const score = da + radial + (k === 's' ? 6 : 0);   // second hand is thin: slight penalty so it is not grabbed by accident
      if (score < bd) { bd = score; best = k; }
    }
    return bd < 40 ? best : null;
  }
  function setFromAngle(k, a) {
    if (k === 's') { const ns = Math.round(a / 6) % 60, ds = ns - st.s; if (ds < -30) bump('m', 1); else if (ds > 30) bump('m', -1); st.s = ns; }
    if (k === 'm') { const nm = Math.round(a / 6) % 60, dm = nm - st.m; if (dm < -30) bump('h', 1); else if (dm > 30) bump('h', -1); st.m = nm; }
    if (k === 'h') { const nh = Math.round(a / 30) % 12, cur = st.h % 12, dh = nh - cur; let base = st.h - cur;
      if (dh < -6) base += 12; else if (dh > 6) base -= 12; st.h = ((base + nh) % 24 + 24) % 24; }
  }
  function bump(k, by) {
    if (k === 'm') { st.m += by; if (st.m > 59) { st.m = 0; bump('h', 1); } if (st.m < 0) { st.m = 59; bump('h', -1); } }
    if (k === 'h') st.h = ((st.h + by) % 24 + 24) % 24;
  }
  function bindClock(body) {
    const svg = $('#tbClock', body); if (!svg || svg.dataset.bound) return; svg.dataset.bound = '1';
    const end = e => { if (st.grab) { st.grab = null; try { svg.releasePointerCapture(e.pointerId); } catch (x) {} refresh(body); } };
    svg.addEventListener('pointerdown', e => {
      e.stopPropagation();                        // keep BookInk (Pencil notes) from treating this as ink
      const { a, d } = angleAt(svg, e), k = nearest(a, d); if (!k) return;
      e.preventDefault(); live.stop(); st.grab = k; try { svg.setPointerCapture(e.pointerId); } catch (x) {} setFromAngle(k, a); refresh(body);
      if (typeof sfx === 'function') sfx('tap');
    });
    svg.addEventListener('pointermove', e => {
      const { a, d } = angleAt(svg, e);
      if (st.grab) { e.preventDefault(); setFromAngle(st.grab, a); refresh(body, true); return; }
      if (e.pointerType === 'pen' || e.pointerType === 'mouse') {           // Pencil hover (M2+ iPad) / mouse hover
        const k = nearest(a, d); if (k !== st.hover) { st.hover = k; refresh(body, true); }
      }
    });
    svg.addEventListener('pointerleave', () => { if (st.hover) { st.hover = null; refresh(body, true); } });
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  }

  /* ---------- live mode: the "Now" button makes the clock follow real time; touching a hand / step / preset stops it ---------- */
  const live = {
    on: false, id: 0,
    tick() {
      const body = $('#bkBody');
      if (Book.id !== ID || st.tab !== 'clock' || !body || !$('#tbClock', body)) return live.stop();
      const n = new Date(); st.h = n.getHours(); st.m = n.getMinutes(); st.s = n.getSeconds(); refresh(body);
    },
    start() { live.on = true; live.tick(); clearInterval(live.id); live.id = setInterval(live.tick, 1000); live.mark(); },
    stop() { if (!live.on) return; live.on = false; clearInterval(live.id); live.mark(); },
    mark() { const b = document.querySelector('#bkBody [data-tbset="now"]'); if (!b) return;
      b.classList.toggle('on', live.on); b.setAttribute('aria-pressed', String(live.on));
      b.innerHTML = `${icn('clock')}${live.on ? L('เดินตามเวลาจริง · แตะเพื่อหยุด', 'Live · tap to stop') : L('เวลาตอนนี้ (เดินตามจริง)', 'Now (live)')}`; }
  };

  /* ---------- views ---------- */
  const pad = n => String(n).padStart(2, '0');
  function digital() {
    const p = period(st.h);
    if (h24()) return `<span class="tb-dig">${pad(st.h)}:${pad(st.m)}<small>:${pad(st.s)}</small></span>`;
    return `<span class="tb-dig">${st.h % 12 || 12}:${pad(st.m)}<small>:${pad(st.s)} ${st.h < 12 ? 'AM' : 'PM'}</small></span><span class="tb-per" lang="zh-Hans">${p.zh} · ${en() ? p.en : p.th}</span>`;
  }
  function readingsHtml() {
    return readings(st.h, st.m, st.s, h24()).map(r => `<div class="rb-expr"><span class="rb-expr-tag">${esc(r.tag)}</span>
      <div class="rb-expr-main"><b lang="zh-Hans">${esc(r.zh)}</b><span class="pyx">${esc(r.py)}</span></div>
      <button type="button" class="gx-say sm" data-tbsay="${esc(r.zh)}" aria-label="${L('ฟังเสียง', 'Listen')}">${icn('vol')}</button></div>`).join('');
  }
  function tipHtml() {
    const m = st.m, h12 = st.h % 12 || 12;
    let t = L('ช่วงเวลา (早上 / 下午 / 晚上) วาง<b>หน้า</b>ตัวเลขเสมอ: 下午三点 = บ่ายสาม', 'The day period goes BEFORE the hour: 下午三点 = 3 pm');
    if (h12 === 2) t = L('2 โมง ใช้ <b>两点</b> เสมอ ไม่ใช้ 二点 · แต่ 12 โมงใช้ 十二点', '2 o’clock is always <b>两点</b>, never 二点 · 12 is 十二点');
    else if (m > 0 && m < 10) t = L('นาที 1–9 ต้องมี <b>零</b> ข้างหน้า: 八点零五分', 'Minutes 1–9 need <b>零</b>: 八点零五分');
    else if (m === 15 || m === 45) t = L('<b>刻</b> = 15 นาที: 一刻 = 15 · 三刻 = 45 · <b>ไม่มี 两刻</b> (30 นาทีใช้ 半)', '<b>刻</b> = 15 min: 一刻, 三刻 · <b>no 两刻</b> (use 半)');
    else if (m === 30) t = L('<b>两点半</b> = 2:30 (จุดเวลา) ≠ <b>两个半小时</b> = 2 ชั่วโมงครึ่ง (ระยะเวลา)', '<b>两点半</b> = 2:30 ≠ <b>两个半小时</b> = 2.5 hours');
    else if (m > 45) t = L('ใกล้ชั่วโมงถัดไป นิยมนับถอยด้วย <b>差</b>: 差五分三点 = อีก 5 นาทีสามโมง', 'Near the hour, count back with <b>差</b>: 差五分三点');
    return `${icn('bulb')}<span>${t}</span>`;
  }
  /* move the hands in place: re-creating the SVG mid-drag would drop the captured Pencil / finger pointer */
  function updateHands(svg) {
    const set = (k, a, len) => { const el = svg.querySelector('.hd-' + k); if (!el) return;
      const [x, y] = polar(a, len), [bx, by] = polar(a + 180, len * .16);
      el.setAttribute('x1', bx); el.setAttribute('y1', by); el.setAttribute('x2', x); el.setAttribute('y2', y);
      el.classList.toggle('grab', st.grab === k); el.classList.toggle('hov', st.hover === k); };
    set('h', ((st.h % 12) + st.m / 60) * 30, 46); set('m', (st.m + st.s / 60) * 6, 70); set('s', st.s * 6, 80);
  }
  function refresh(body, light) {
    const svg = $('#tbClock', body); if (svg) updateHands(svg);
    const g = $('#tbDigital', body); if (g) g.innerHTML = digital();
    if (light && st.grab) return;                                            // keep dragging smooth: text updates on release / hover end
    const r = $('#tbReads', body); if (r) r.innerHTML = readingsHtml();
    const tp = $('#tbTip', body); if (tp) tp.innerHTML = tipHtml();
  }

  function clockTab() {
    const pre = [['08:00:00', '8:00'], ['09:05:00', '9:05'], ['14:15:00', '14:15'], ['14:30:00', '14:30'], ['17:45:00', '17:45'], ['20:50:00', '20:50'], ['00:30:00', '0:30'], ['12:00:00', '12:00']];
    return `<section class="tb-card">
      <div class="tb-clock-row">
        <div class="tb-clock-wrap" id="tbClockWrap">${clockSvg()}</div>
        <div class="tb-side">
          <div id="tbDigital" class="tb-digital">${digital()}</div>
          <div class="tb-seg" role="group" aria-label="12/24">
            <button type="button" data-tb24="0" class="${h24() ? '' : 'on'}">12 ${L('ชม.', 'h')} AM/PM</button>
            <button type="button" data-tb24="1" class="${h24() ? 'on' : ''}">24 ${L('ชม.', 'h')}</button></div>
          <div class="tb-step">
            ${[['h', L('ชั่วโมง', 'Hour')], ['m', L('นาที', 'Min')], ['s', L('วินาที', 'Sec')]].map(([k, l]) =>
              `<div><span>${l}</span><button type="button" data-tbstep="${k}:-1" aria-label="−">−</button><button type="button" data-tbstep="${k}:1" aria-label="+">+</button></div>`).join('')}</div>
          <p class="tb-hint">${L('ลากเข็มด้วยนิ้วหรือ Apple Pencil · Pencil ชี้ลอยเหนือเข็มเพื่อดูว่าจะจับเข็มไหน', 'Drag any hand with finger or Apple Pencil · hover the Pencil to see which hand you will grab')}</p>
        </div>
      </div>
      <div class="rb-presets"><button type="button" class="rb-pre" data-tbset="now">${icn('clock')}${L('เวลาตอนนี้', 'Now')}</button>
        ${pre.map(([v, l]) => `<button type="button" class="rb-pre" data-tbset="${v}">${l}</button>`).join('')}</div>
      <div class="tb-reads" id="tbReads">${readingsHtml()}</div>
      <div class="rb-tip" id="tbTip">${tipHtml()}</div>
    </section>
    <section class="rb-sec"><p class="rb-k">${L('คำบอกเวลาที่ต้องรู้', 'Words you need')}</p>
      <div class="tb-words">${[
        ['点', 'diǎn', 'โมง / นาฬิกา', 'o’clock'], ['分', 'fēn', 'นาที', 'minute'], ['秒', 'miǎo', 'วินาที', 'second'],
        ['整', 'zhěng', 'ตรง (เป๊ะ)', 'sharp'], ['半', 'bàn', 'ครึ่ง = 30 นาที', 'half = :30'], ['刻', 'kè', '15 นาที (一刻 · 三刻)', 'quarter'],
        ['差', 'chà', 'ขาด / อีก…จะถึง', 'to (before)'], ['过', 'guò', 'เลย (三点过五分)', 'past'],
        ['小时', 'xiǎoshí', 'ชั่วโมง (ระยะเวลา)', 'hour (duration)'], ['分钟', 'fēnzhōng', 'นาที (ระยะเวลา)', 'minutes (duration)'], ['钟头', 'zhōngtóu', 'ชั่วโมง (ภาษาพูด)', 'hour (spoken)']]
        .map(([z, p, t, e]) => `<button type="button" class="tb-w" data-tbsay="${z}"><b lang="zh-Hans">${z}</b><span>${p}</span><small>${en() ? e : t}</small></button>`).join('')}</div></section>
    <section class="rb-sec"><p class="rb-k">${L('ช่วงเวลาของวัน (ใช้กับนาฬิกา 12 ชั่วโมง)', 'Parts of the day (with 12-hour time)')}</p>
      <div class="tb-periods">${PERIODS.map(p => `<button type="button" class="tb-pd${period(st.h).zh === p[2] ? ' on' : ''}" data-tbsay="${p[2]}"><b lang="zh-Hans">${p[2]}</b><span>${p[3]}</span><small>${en() ? p[5] : p[4]} · ${p[0]}:00–${p[1]}:00</small></button>`).join('')}</div>
      <p class="tb-note">${L('ขอบเขตแต่ละช่วงยืดหยุ่นตามคนพูด เช่น 7 โมงเช้า บางคนว่า 早上 บางคนว่า 上午 · ดึกมาก (23:00–01:00) มักพูด 半夜', 'Boundaries are flexible; very late at night people often say 半夜')}</p></section>`;
  }

  /* ---------- dates ---------- */
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  function dateRead(d) {
    const y = String(d.getFullYear()), mo = d.getMonth() + 1, da = d.getDate(), w = d.getDay();
    const yz = [...y].map(c => c === '0' ? '〇' : D[+c]).join(''), yp = [...y].map(c => DP[+c]).join(' ');
    return { yz, yp, mo, da, w,
      full: `${yz}年${n99(mo)}月${n99(da)}日`, fullP: `${yp} nián ${n99p(mo)} yuè ${n99p(da)} rì`,
      spoken: `${n99(mo)}月${n99(da)}号`, spokenP: `${n99p(mo)} yuè ${n99p(da)} hào`,
      week: [`星期${w === 0 ? '天' : WEEK[w]}`, `周${WEEK[w]}`, `礼拜${w === 0 ? '天' : WEEK[w]}`] };
  }
  function dateTab() {
    const d = st.date || new Date(), r = dateRead(d), iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const row = (zh, py, tag) => `<div class="rb-expr"><span class="rb-expr-tag">${esc(tag)}</span><div class="rb-expr-main"><b lang="zh-Hans">${esc(zh)}</b><span class="pyx">${esc(py)}</span></div><button type="button" class="gx-say sm" data-tbsay="${esc(zh)}">${icn('vol')}</button></div>`;
    return `<section class="tb-card">
      <label class="tb-date"><span>${L('เลือกวันที่ (หรือเขียนด้วย Pencil)', 'Pick a date')}</span><input type="date" id="tbDate" value="${iso}"></label>
      <div class="tb-reads">
        ${row(r.full, r.fullP, L('ภาษาเขียน (ปี → เดือน → วัน)', 'Written (year → month → day)'))}
        ${row(r.spoken, r.spokenP, L('ภาษาพูด ใช้ 号 แทน 日', 'Spoken: 号 instead of 日'))}
        ${row(`${r.full}，${r.week[0]}`, `${r.fullP}, xīngqī${r.w === 0 ? 'tiān' : DP[r.w]}`, L('พร้อมวันในสัปดาห์', 'With weekday'))}
      </div>
      <div class="rb-tip">${icn('bulb')}<span>${L(`ปีอ่าน<b>ทีละตัว</b>: ${r.yz}年 = ${[...r.yz].join(' · ')} ไม่ใช่ "สองพันยี่สิบหก" · ศูนย์ในปีเขียน 〇`, `Years are read <b>digit by digit</b>: ${r.yz}年`)}</span></div>
    </section>
    <section class="rb-sec"><p class="rb-k">${L('วันในสัปดาห์ 3 แบบ (ความหมายเดียวกัน)', 'Weekdays — three ways')}</p>
      <div class="tb-week">${[1, 2, 3, 4, 5, 6, 0].map(w => `<button type="button" class="tb-wk${w === r.w ? ' on' : ''}" data-tbsay="星期${w === 0 ? '天' : WEEK[w]}">
        <b lang="zh-Hans">星期${w === 0 ? '天/日' : WEEK[w]}</b><span lang="zh-Hans">周${WEEK[w]} · 礼拜${w === 0 ? '天' : WEEK[w]}</span><small>${en() ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][w] : ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'][w]}</small></button>`).join('')}</div>
      <p class="tb-note">${L('星期 ใช้ทั่วไป · 周 สั้นและเป็นทางการ (ป้าย ตาราง) · 礼拜 ภาษาพูด · วันอาทิตย์ใช้ 天 หรือ 日 แต่ 周日 ไม่ใช้ 周天', '星期 general · 周 short/formal · 礼拜 colloquial · Sunday: 星期天/日, 周日')}</p></section>
    <section class="rb-sec"><p class="rb-k">${L('เรียงจากใหญ่ไปเล็กเสมอ', 'Always big → small')}</p>
      <div class="tb-order" lang="zh-Hans">${['2026年', '11月', '28日', '星期六', '下午', '三点', '一刻'].map((x, i) => `<span style="--i:${i}">${x}</span>`).join('<i>→</i>')}</div>
      <p class="tb-note">${L('ภาษาไทยเริ่มจากเล็ก (บ่ายสามโมงสิบห้า วันเสาร์ที่ 28) · ภาษาจีนกลับกัน เริ่มจากใหญ่สุด', 'Thai/English go small → big; Chinese goes big → small')}</p></section>
    <section class="rb-sec"><p class="rb-k">${L('คำบอกวันที่ใช้บ่อย', 'Relative days')}</p>
      <div class="tb-words">${[['前天', 'qiántiān', 'เมื่อวานซืน'], ['昨天', 'zuótiān', 'เมื่อวาน'], ['今天', 'jīntiān', 'วันนี้'], ['明天', 'míngtiān', 'พรุ่งนี้'], ['后天', 'hòutiān', 'มะรืนนี้'],
        ['上个月', 'shàng ge yuè', 'เดือนที่แล้ว'], ['这个月', 'zhège yuè', 'เดือนนี้'], ['下个月', 'xià ge yuè', 'เดือนหน้า'], ['去年', 'qùnián', 'ปีที่แล้ว'], ['今年', 'jīnnián', 'ปีนี้'], ['明年', 'míngnián', 'ปีหน้า'],
        ['上周', 'shàngzhōu', 'สัปดาห์ที่แล้ว'], ['下周', 'xiàzhōu', 'สัปดาห์หน้า'], ['周末', 'zhōumò', 'สุดสัปดาห์']]
        .map(([z, p, t]) => `<button type="button" class="tb-w" data-tbsay="${z}"><b lang="zh-Hans">${z}</b><span>${p}</span><small>${t}</small></button>`).join('')}</div></section>`;
  }

  function durTab() {
    const pairs = [['两点', 'liǎng diǎn', 'สองโมง (จุดเวลา)', '两个小时', 'liǎng ge xiǎoshí', 'สองชั่วโมง (ระยะเวลา)'],
      ['三分', 'sān fēn', 'นาทีที่ 3 / 3 นาที (บนนาฬิกา)', '三分钟', 'sān fēnzhōng', 'สามนาที (ระยะเวลา)'],
      ['三月', 'sānyuè', 'เดือนมีนาคม', '三个月', 'sān ge yuè', 'สามเดือน'],
      ['星期三', 'xīngqīsān', 'วันพุธ', '三个星期', 'sān ge xīngqī', 'สามสัปดาห์'],
      ['三号', 'sān hào', 'วันที่ 3', '三天', 'sān tiān', 'สามวัน'],
      ['两点半', 'liǎng diǎn bàn', '2:30 น.', '两个半小时', 'liǎng ge bàn xiǎoshí', '2 ชั่วโมงครึ่ง']];
    return `<section class="rb-sec"><p class="rb-k">${L('จุดเวลา (เมื่อไร) ↔ ระยะเวลา (นานแค่ไหน)', 'Point in time ↔ duration')}</p>
      <div class="tb-dur">${pairs.map(p => `<div class="tb-pair">
        <button type="button" data-tbsay="${p[0]}"><b lang="zh-Hans">${p[0]}</b><span>${p[1]}</span><small>${p[2]}</small></button><i>≠</i>
        <button type="button" data-tbsay="${p[3]}"><b lang="zh-Hans">${p[3]}</b><span>${p[4]}</span><small>${p[5]}</small></button></div>`).join('')}</div>
      <div class="rb-tip">${icn('bulb')}<span>${L('ระยะเวลามักต้องมี <b>个</b> (小时 月 星期) แต่ <b>天 · 年 · 分钟</b> ไม่ต้องใส่ 个: 三天 · 两年 · 五分钟', 'Durations often need <b>个</b> (个小时, 个月, 个星期) but not with <b>天 · 年 · 分钟</b>')}</span></div></section>
    <section class="rb-sec"><p class="rb-k">${L('ตำแหน่งในประโยค', 'Where it goes in the sentence')}</p>
      <div class="tb-reads">${[['我八点上课。', 'Wǒ bā diǎn shàngkè.', L('จุดเวลา วางหน้ากริยา', 'Point in time: before the verb')],
        ['我上了两个小时课。', 'Wǒ shàngle liǎng ge xiǎoshí kè.', L('ระยะเวลา วางหลังกริยา', 'Duration: after the verb')],
        ['我等了他半个小时。', 'Wǒ děngle tā bàn ge xiǎoshí.', L('ครึ่งชั่วโมง = 半个小时', 'half an hour = 半个小时')]]
        .map(([z, p, t]) => `<div class="rb-expr"><span class="rb-expr-tag">${esc(t)}</span><div class="rb-expr-main"><b lang="zh-Hans">${z}</b><span class="pyx">${p}</span></div><button type="button" class="gx-say sm" data-tbsay="${z}">${icn('vol')}</button></div>`).join('')}</div></section>
    <button type="button" class="rb-link" data-tbnum="1">${L('กฎตัวเลข (二 / 两, 零) อยู่ในเล่ม VOL. 14 ตัวเลขและการคำนวณ', 'Number rules (二 / 两, 零): VOL. 14 Numbers')} →</button>`;
  }

  /* ---------- quiz: listen & set the clock · choose the reading · write with Pencil ---------- */
  const rnd = n => Math.floor(Math.random() * n);
  function newQuiz() {
    const kind = ['listen', 'choose', 'write'][st.quizN % 3];
    const h = 1 + rnd(22), m = [0, 5, 10, 15, 20, 30, 40, 45, 50, 55][rnd(10)];
    const q = { kind, h, m, done: false, ok: null };
    if (kind === 'choose') {
      const right = readings(h, m, 0, false)[0].zh, wrong = new Set();
      while (wrong.size < 3) { const h2 = 1 + rnd(22), m2 = [0, 5, 15, 30, 45, 50][rnd(6)]; const z = readings(h2, m2, 0, false)[0].zh; if (z !== right) wrong.add(z); }
      q.opts = [...wrong, right].sort(() => Math.random() - .5); q.right = right;
    }
    if (kind === 'write') {
      const items = [[30, '半', '两点＿', 'ครึ่ง (30 นาที)'], [15, '刻', '三点一＿', '15 นาที'], [45, '差', '＿一刻四点', 'อีก 15 นาทีจะ 4 โมง'], [0, '整', '八点＿', 'ตรงเป๊ะ'], [0, '两', '＿点', '2 โมง']];
      const it = items[rnd(items.length)]; q.ans = it[1]; q.blank = it[2]; q.hintTh = it[3];
    }
    st.quiz = q;
  }
  function quizTab() {
    if (st.quizN == null) { st.quizN = 0; st.score = 0; }
    if (!st.quiz) newQuiz();
    const q = st.quiz, p = period(q.h), h12 = q.h % 12 || 12, target = readings(q.h, q.m, 0, false)[0];
    let body = '';
    if (q.kind === 'listen') body = `<p class="tb-q">${L('ฟังแล้วหมุนเข็มนาฬิกาให้ตรง (ช่วงเวลาไม่ต้องสนใจ)', 'Listen, then set the clock')}</p>
      <div class="tb-qrow"><button type="button" class="btn primary" data-tbsay="${esc(target.zh)}">${icn('vol')}${L('ฟังโจทย์', 'Play')}</button>
      <button type="button" class="btn" data-tbqcheck="1">${L('ตรวจคำตอบ', 'Check')}</button></div>
      <div class="tb-clock-wrap sm" id="tbClockWrap">${clockSvg()}</div>`;
    if (q.kind === 'choose') body = `<p class="tb-q">${L('นาฬิกาบอกเวลาเท่าไร', 'What time is it?')} <b class="tb-dig">${h12}:${pad(q.m)} ${q.h < 12 ? 'AM' : 'PM'}</b> <span class="tb-per">${en() ? p.en : p.th}</span></p>
      <div class="tb-opts">${q.opts.map(o => `<button type="button" class="tb-opt${q.done ? (o === q.right ? ' ok' : '') : ''}" data-tbqopt="${esc(o)}" lang="zh-Hans">${esc(o)}</button>`).join('')}</div>`;
    if (q.kind === 'write') body = `<p class="tb-q">${L('เติมตัวที่หายไป (เขียนด้วย Apple Pencil หรือนิ้ว)', 'Fill the missing character (write it)')}</p>
      <p class="tb-blank" lang="zh-Hans">${esc(q.blank)}</p><p class="tb-note">${L('ใบ้: ', 'Hint: ')}${esc(q.hintTh)}</p>
      <div class="tb-qrow"><button type="button" class="btn primary" data-tbqwrite="1">${icn('pen')}${L('เขียนคำตอบ', 'Write')}</button>
      <input type="text" id="tbQin" maxlength="2" lang="zh-Hans" placeholder="${L('หรือพิมพ์', 'or type')}" autocomplete="off">
      <button type="button" class="btn" data-tbqcheck="1">${L('ตรวจ', 'Check')}</button></div>`;
    const res = q.done ? `<div class="tb-res ${q.ok ? 'ok' : 'bad'}">${q.ok ? L('ถูกต้อง!', 'Correct!') : L('ยังไม่ใช่ · คำตอบ: ', 'Not quite · answer: ')}<b lang="zh-Hans">${q.ok ? '' : esc(q.kind === 'write' ? q.ans : target.zh)}</b>
      <span class="pyx">${q.kind === 'write' ? '' : esc(target.zh + ' · ' + target.py)}</span>
      <button type="button" class="btn sm" data-tbqnext="1">${L('ข้อต่อไป', 'Next')} →</button></div>` : '';
    return `<section class="tb-card"><div class="tb-score">${L('คะแนน', 'Score')} <b>${st.score}</b> / ${st.quizN}</div>${body}${res}</section>`;
  }
  function checkQuiz(body, val) {
    const q = st.quiz; if (!q || q.done) return;
    if (q.kind === 'listen') q.ok = (st.h % 12) === (q.h % 12) && st.m === q.m;
    if (q.kind === 'choose') q.ok = val === q.right;
    if (q.kind === 'write') { const v = (val != null ? val : ($('#tbQin', body) || {}).value || '').trim(); q.ok = v === q.ans || (q.ans === '两' && v === '兩'); }
    q.done = true; st.quizN++; if (q.ok) st.score++;
    if (typeof sfx === 'function') sfx(q.ok ? 'ok' : 'bad');
    draw();
  }

  /* ---------- page ---------- */
  function draw() {
    const body = $('#bkBody'); if (!body || Book.id !== ID) return;
    const tabs = [['clock', L('นาฬิกา 3 เข็ม', 'Clock')], ['date', L('ปี · เดือน · วัน', 'Dates')], ['dur', L('จุดเวลา vs ระยะเวลา', 'Point vs duration')], ['quiz', L('แบบฝึก', 'Practice')]];
    body.innerHTML = `<div class="rb tb">
      <header class="rb-hero"><div class="rb-hero-top"><div><h2><span lang="zh-Hans">时间与日期</span> ${L('เวลาและวันที่', 'Time & Dates')}</h2>
        <p>${L('นาฬิกา 3 เข็มลากได้ด้วยนิ้วและ Apple Pencil · 12/24 ชั่วโมง · ปี เดือน วัน · จุดเวลากับระยะเวลา', '3-hand clock (finger & Apple Pencil) · 12/24 h · dates · point vs duration')}</p></div>
        <div class="sb-tools"><div class="gb-langs" role="group" aria-label="Language"><button type="button" class="gb-lg${en() ? '' : ' on'}" data-tblang="th">TH</button><button type="button" class="gb-lg${en() ? ' on' : ''}" data-tblang="en">EN</button></div></div></div>
        <nav class="rb-tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" class="rb-tab${st.tab === k ? ' on' : ''}" data-tbtab="${k}">${esc(l)}</button>`).join('')}</nav></header>
      <div class="rb-body">${st.tab === 'clock' ? clockTab() : st.tab === 'date' ? dateTab() : st.tab === 'dur' ? durTab() : quizTab()}</div></div>`;
    const v = $('#bkVol'); if (v) v.textContent = `VOL. 07 · Time · ${L('เวลาและวันที่', 'Time & Dates')}`;
    bindClock(body); live.mark();
    const di = $('#tbDate', body); if (di) di.onchange = () => { const p = di.value.split('-'); if (p.length === 3) { st.date = new Date(+p[0], +p[1] - 1, +p[2]); draw(); } };
  }

  /* ---------- hook into the reader (after refbooks.js, which owns the shelf entry) ---------- */
  if (typeof BOOK_META !== 'undefined' && BOOK_META[ID]) BOOK_META[ID].title = `时间与日期 ${T('เวลาและวันที่')}`;
  if (typeof SHELF !== 'undefined') { const sb = SHELF.find(b => b.id === ID); if (sb) { sb.hz = '时间与日期'; sb.th = `${T('เวลาและวันที่')}`; } }
  const render0 = Book.render, show0 = Book.show;
  Book.show = function (id) {
    if (id === ID) { const n = new Date(); st.h = n.getHours(); st.m = n.getMinutes(); st.s = n.getSeconds(); }
    return show0.apply(this, arguments);
  };
  Book.render = function () { const r = render0.apply(this, arguments); if (this.id === ID) draw(); return r; };

  $('#bkBody').addEventListener('click', e => {
    if (Book.id !== ID) return;
    const t = e.target.closest('[data-tbsay],[data-tbtab],[data-tb24],[data-tbstep],[data-tbset],[data-tblang],[data-tbnum],[data-tbqcheck],[data-tbqopt],[data-tbqnext],[data-tbqwrite]');
    if (!t) return;
    e.stopPropagation();
    const ds = t.dataset, body = $('#bkBody');
    if (ds.tbsay) return say(ds.tbsay);
    if (typeof sfx === 'function') sfx('tap');
    if (ds.tbtab) { st.tab = ds.tbtab; return draw(); }
    if (ds.tb24) { S().tb24 = ds.tb24 === '1'; save(); return draw(); }
    if (ds.tblang) { S().rbLang = ds.tblang; save(); return draw(); }
    if (ds.tbstep) { live.stop(); const [k, by] = ds.tbstep.split(':'); if (k === 's') { st.s += +by; if (st.s > 59) { st.s = 0; bump('m', 1); } if (st.s < 0) { st.s = 59; bump('m', -1); } } else bump(k, +by); return refresh(body); }
    if (ds.tbset) {
      if (ds.tbset === 'now') { live.on ? live.stop() : live.start(); return; }
      live.stop(); const [h, m, s] = ds.tbset.split(':').map(Number); st.h = h; st.m = m; st.s = s; return refresh(body);
    }
    if (ds.tbnum) return Router.go('/book/numbers');
    if (ds.tbqopt) return checkQuiz(body, ds.tbqopt);
    if (ds.tbqcheck) return checkQuiz(body);
    if (ds.tbqnext) { newQuiz(); st.h = 12; st.m = 0; st.s = 0; return draw(); }
    if (ds.tbqwrite && typeof HandPad !== 'undefined') HandPad.open({ onPick: ch => { const i = $('#tbQin', body); if (i) i.value = ch; checkQuiz(body, ch); } });
  }, true);
})();
