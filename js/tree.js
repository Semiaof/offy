'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — ต้นไม้ตัวอักษร (character tree), a chapter of VOL 04 部首
   radical (or any component) → every HSK character that contains it → every HSK word that uses the character.
   Wide screens: three columns side by side. Phones: one column at a time with a breadcrumb.
   Data: data/tree.js (window.OFFY_TREE, ~1.3 MB) from แปล HSK1 5ภาษา/tools/build_tree.py — loaded when first opened.
   ===================================================================== */
const OffyTree = (() => {
  const SRC = 'data/tree.js?v=6';
  const LVN = l => l === 7 ? '7-9' : String(l);
  const st = { node: null, ch: null, q: '', all: false, stage: 'r' };       // node: {r: no} | {g: component}
  let D = null, host = null, rad = null;

  Object.assign(window.OFFY_EN || {}, {
    'ต้นไม้ตัวอักษร': 'Character tree', 'ค้นหาราก ส่วนประกอบ หรืออักษร': 'Find a radical, component or character',
    'รากที่มีอักษรใน HSK': 'Radicals used in HSK', 'ทั้ง 214 ราก': 'All 214', 'อยู่ในหมวดนี้': 'Filed under this radical',
    'มีส่วนนี้อยู่ข้างใน แต่จัดหมวดอื่น': 'Contain it, filed under another radical', 'อักษรที่มีส่วนนี้': 'Characters that contain it',
    'คำ HSK ที่ใช้ตัวนี้': 'HSK words with this character', 'ส่วนประกอบ': 'Components', 'หมวดอักษร': 'Radical', 'เลือกรากทางซ้าย': 'Pick a radical on the left',
    'เลือกอักษรเพื่อดูคำที่ใช้': 'Pick a character to see its words', 'ยังไม่มีอักษร HSK ในหมวดนี้': 'No HSK characters under this radical',
    'กำลังโหลดต้นไม้…': 'Loading the tree…', 'ขีด': 'strokes', 'ตัว': 'chars', 'คำ': 'words', 'ราก': 'Radicals', 'อักษร': 'Characters'
  });

  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ü/g, 'v');
  const term = (g, raw) => {
    if (!raw || typeof F5TERMS === 'undefined') return esc(raw || '');
    const k = Object.keys(F5TERMS[g]).sort((a, b) => b.length - a.length).find(x => raw.startsWith(x));
    return k ? `${esc(F5TERMS[g][k][LANG === 'en' ? 1 : 0])} <small lang="zh-Hans">${esc(raw)}</small>` : `<span lang="zh-Hans">${esc(raw)}</span>`;
  };
  const radOf = no => rad.get(no);
  /* look-alike forms arrive tagged: 阝@170 (left · 阜) / 阝@163 (right · 邑), 月@130 (⺼ flesh) … */
  const base = g => String(g).split('@')[0];
  const side = g => { const [c, no] = String(g).split('@'); if (!no) return ''; const r = rad.get(+no); if (!r) return '';
    return `${c === '阝' ? (no === '170' ? T('ซ้าย') + ' ' : T('ขวา') + ' ') : ''}${r[1]} · ${LANG === 'en' ? r[5] : r[4]}`; };
  /* 简 / 繁 (one setting with the Digivolution chapter): simplified by default, never both mixed */
  const trad = () => !!S().hzTrad;
  const radG = r => trad() || D.c[r[1]] ? r[1] : ((r[8].find(f => f[1] === 'ตัวย่อ') || r[8].find(f => D.c[f[0]]) || [])[0] || r[1]);
  const radForms = r => [r[1], ...r[8].map(f => f[0])].filter(g => g !== radG(r) && (trad() || g !== r[1] || radG(r) === r[1]));
  const cg = c => { const x = D.c[c]; return trad() && x && x[8] ? x[8] : c; };
  const lvOk = l => typeof HzLv === 'undefined' || HzLv.has(l);      // the HSK levels picked on the อักษร page (7 = the 7–9 band)
  const chOk = c => lvOk((D.c[c] || [])[1] || 7);
  const nodeChars = n => (n.r ? D.rc[n.r] : [D.cc[n.g] || [], []]).map(l => l.filter(chOk));
  const lvTag = l => `<span class="tr-lvl" style="--bk:var(--hsk${l})">HSK ${LVN(l)}</span>`;
  const tile = (c, on) => {
    const x = D.c[c] || [];
    const mo = typeof HzKit !== 'undefined' ? HzKit.charMean(c, D, null) : { t: (LANG !== 'en' && x[9]) || x[10] || '', fb: false };
    const sh = mo.t ? (typeof HzKit !== 'undefined' ? HzKit.short(mo.t, 8) : mo.t.slice(0, 8)) : '';
    const dot = typeof HzKit !== 'undefined' ? HzKit.dotHtml(c) : '';
    return `<button class="tr-c${on ? ' on' : ''}"${x[1] ? ` style="--lc:var(--hsk${x[1]})"` : ''} data-ch="${esc(c)}" lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${dot}<b>${esc(cg(c))}</b><span class="pyx">${esc(x[0] || '')}</span>${sh ? `<small class="tr-cm${mo.fb ? ' fb' : ''}">${esc(sh)}</small>` : ''}</button>`;
  };
  const byLevel = list => { const g = {}; list.forEach(c => { const l = (D.c[c] || [])[1] || 7; (g[l] = g[l] || []).push(c); }); return Object.keys(g).sort().map(l => [+l, g[l]]); };

  /* ---------- columns ---------- */
  function colRadicals() {
    const q = fold(st.q.trim());
    const list = D.r.filter(r => {
      const n = D.rc[r[0]], cnt = n[0].filter(chOk).length + n[1].filter(chOk).length;
      if (!st.all && !cnt) return false;
      if (!q) return true;
      return [r[1], ...r[8].map(f => f[0])].some(g => g === st.q.trim()) || fold(r[4]).includes(q) || fold(r[3]).replace(/[^a-z]/g, '').startsWith(q.replace(/[^a-z]/g, '') || '~') || fold(r[5]).includes(q);
    });
    const groups = {}; list.forEach(r => (groups[r[2]] = groups[r[2]] || []).push(r));
    return `<div class="tr-tools"><div class="seg sm tr-seg"><button data-all="0" class="${st.all ? '' : 'on'}">${T('รากที่มีอักษรใน HSK')}</button><button data-all="1" class="${st.all ? 'on' : ''}">${T('ทั้ง 214 ราก')}</button></div></div>
      ${Object.keys(groups).map(s => `<p class="tr-h">${s} ${T('ขีด')}</p><div class="tr-rads">${groups[s].map(r => {
        const n = nodeChars({ r: r[0] }), on = st.node && st.node.r === r[0];
        const fs = radForms(r); return `<button class="tr-r${on ? ' on' : ''}" data-r="${r[0]}"><b lang="zh-Hans">${esc(radG(r))}</b>${fs.length ? `<i lang="zh-Hans">${fs.map(esc).join('')}</i>` : ''}<span>${esc(LANG === 'en' ? r[5] : r[4])}</span><small>${n[0].length + n[1].length}</small></button>`;
      }).join('')}</div>`).join('') || `<p class="tr-empty">—</p>`}`;
  }
  function colChars() {
    const n = st.node;
    if (!n) return `<p class="tr-empty">${T('เลือกรากทางซ้าย')}</p>`;
    const [own, has] = nodeChars(n);
    let head;
    if (n.r) {
      const r = radOf(n.r), g = radG(r);
      const langs = [
        r[5] ? `<span><b>EN</b> ${esc(r[5])}</span>` : '',
        r[6] ? `<span lang="vi"><b>VI</b> ${esc(r[6])}</span>` : '',
        r[7] ? `<span lang="ja"><b>JA</b> ${esc(r[7])}</span>` : ''
      ].filter(Boolean).join('');
      head = `<div class="tr-node"><div class="tr-glyphs" lang="zh-Hans"><b>${esc(g)}</b>${radForms(r).map(f => `<span>${esc(f)}</span>`).join('')}</div>
        <div class="tr-names"><div class="tr-nh"><b>${esc(LANG === 'en' ? r[5] : r[4])}</b> <span class="pyx">${esc(r[3])}</span><button type="button" class="tr-say" data-say="${esc(g)}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></div>
        <small>#${r[0]} · ${r[2]} ${T('ขีด')}</small>
        ${langs ? `<div class="tr-langs">${langs}</div>` : ''}
        <div class="tr-nacts"><button type="button" class="hz-xbtn sm" data-hzjump="digi" data-hzch="${esc(g)}">${ic('bolt')}<span>${T('สายวิวัฒนาการ')}</span></button><button type="button" class="hz-xbtn sm" data-hzjump="compose" data-hzch="${esc(g)}">${ic('wand')}<span>${T('ผสมอักษร')}</span></button></div></div></div>`;
    } else {
      const x = D.c[n.g], g = base(n.g);
      const mo = typeof HzKit !== 'undefined' ? HzKit.charMean(n.g, D, null) : { t: x ? (LANG !== 'en' && x[9]) || x[10] : '' };
      head = `<div class="tr-node"><div class="tr-glyphs" lang="zh-Hans"><b>${esc(g)}</b></div><div class="tr-names"><div class="tr-nh"><b>${T('ส่วนประกอบ')}${side(n.g) ? ` · ${esc(side(n.g))}` : ''}</b>${x ? ` <span class="pyx">${esc(x[0])}</span>` : ''}<button type="button" class="tr-say" data-say="${esc(g)}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></div><small>${esc(mo.t || '')}</small></div></div>`;
    }
    const sec = (title, list) => !list.length ? '' : `<section class="tr-sec"><p class="tr-st">${title} <small>${list.length} ${T('ตัว')}</small></p>
      ${byLevel(list).map(([l, cs]) => `<div class="tr-lv">${lvTag(l)}<div class="tr-cs">${cs.map(c => tile(c, c === st.ch)).join('')}</div></div>`).join('')}</section>`;
    const body = n.r ? sec(T('อยู่ในหมวดนี้'), own) + sec(T('มีส่วนนี้อยู่ข้างใน แต่จัดหมวดอื่น'), has) : sec(T('อักษรที่มีส่วนนี้'), own);
    return head + (body || `<p class="tr-empty">${T('ยังไม่มีอักษร HSK ในหมวดนี้')}</p>`);
  }
  function colWords() {
    const c = st.ch;
    if (!c) return `<p class="tr-empty">${T('เลือกอักษรเพื่อดูคำที่ใช้')}</p>`;
    const x = D.c[c] || [], r = x[3] && radOf(x[3]), ws = (D.cw[c] || []).filter(i => lvOk(D.w[i][2]));
    const mo = typeof HzKit !== 'undefined' ? HzKit.charMean(c, D, null) : { t: (LANG !== 'en' && x[9]) || x[10] || '', fb: false };
    const meaning = mo.t + (mo.fb || LANG === 'en' || !x[10] || mo.t === x[10] ? '' : ` · ${x[10]}`);
    const comps = (x[4] || []).map(g => `<button class="tr-chip" data-g="${esc(g)}" lang="zh-Hans">${esc(base(g))}${side(g) ? `<small>${esc(side(g))}</small>` : ''}</button>`).join('<i>+</i>');
    const word = i => {
      const w = D.w[i], hi = esc(w[0]).split(esc(c)).join(`<mark>${esc(c)}</mark>`);
      const gl = typeof HzKit !== 'undefined' ? HzKit.wordGloss(w[0], w[3], !!w[4]) : { t: w[3], fb: !w[4] };
      return `<li><button class="tr-w" style="--lc:var(--hsk${w[2]})" data-w="${esc(w[0])}"><b lang="zh-Hans">${hi}</b><span class="pyx">${esc(w[1])}</span><span class="tr-gl">${gl.fb ? '<em>EN</em>' : ''}${esc(gl.t)}</span></button><button class="tr-say" data-say="${esc(w[0])}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></li>`;
    };
    const groups = {}; ws.forEach(i => (groups[D.w[i][2]] = groups[D.w[i][2]] || []).push(i));
    const xbar = typeof HzKit !== 'undefined' ? HzKit.crossBar(c, 'tree') : '';
    return `<div class="tr-char"><div class="tr-big" lang="${trad() ? 'zh-Hant' : 'zh-Hans'}">${esc(cg(c))}</div>
      <div class="tr-ci"><p><span class="pyx">${esc(x[0])}</span> ${lvTag(x[1])} <button class="tr-say" data-say="${esc(c)}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></p>
        ${meaning ? `<p class="tr-mean">${esc(meaning)}</p>` : ''}
        <dl class="tr-facts">${x[2] ? `<div><dt>${T('ขีด')}</dt><dd>${x[2]}</dd></div>` : ''}${r ? `<div><dt>${T('หมวดอักษร')}</dt><dd><button class="tr-chip" data-r="${r[0]}" lang="zh-Hans">${esc(radG(r))}</button></dd></div>` : ''}
          ${x[5] ? `<div><dt>结构</dt><dd>${term('struct', x[5])}</dd></div>` : ''}${x[6] ? `<div><dt>六书</dt><dd>${term('six', x[6])}</dd></div>` : ''}${x[7] ? `<div><dt>Hán Việt</dt><dd lang="vi">${esc(x[7])}</dd></div>` : ''}</dl>
        ${comps ? `<p class="tr-comps"><span>${T('ส่วนประกอบ')}</span>${comps}</p>` : ''}</div></div>
      ${xbar}
      <p class="tr-st">${T('คำ HSK ที่ใช้ตัวนี้')} <small>${ws.length} ${T('คำ')}</small></p>
      ${Object.keys(groups).sort().map(l => `<div class="tr-lv">${lvTag(+l)}<ul class="tr-ws">${groups[l].map(word).join('')}</ul></div>`).join('')}`;
  }
  function crumbs() {
    const n = st.node, parts = [`<button data-stage="r">${T('ราก')}</button>`];
    if (n) parts.push(`<button data-stage="c" lang="zh-Hans">${esc(n.r ? radG(radOf(n.r)) : base(n.g))}</button>`);
    if (st.ch) parts.push(`<button data-stage="w" lang="zh-Hans">${esc(cg(st.ch))}</button>`);
    return parts.join(`<i>›</i>`);
  }

  /* ---------- paint ---------- */
  function paint(keep) {
    if (!host) return;
    const y = keep ? [...host.querySelectorAll('.tr-col')].map(c => c.scrollTop) : null;
    host.innerHTML = `<div class="tr" data-stage="${st.stage}">
      <div class="tr-top"><label class="tr-q">${ic('search')}<input type="search" value="${esc(st.q)}" placeholder="${T('ค้นหาราก / ส่วนประกอบ / อักษร')}" autocomplete="off" spellcheck="false"><button class="q-pen" data-handpad=".tr-q input" aria-label="${T('เขียนค้นหา')}">${ic('pen')}</button></label>
        <button class="tr-tg" data-trad aria-pressed="${trad()}" aria-label="简 / 繁"><span class="${trad() ? '' : 'on'}" lang="zh-Hans">简</span><span class="${trad() ? 'on' : ''}" lang="zh-Hant">繁</span></button>
        <nav class="tr-crumbs">${crumbs()}</nav></div>
      <div class="tr-cols"><div class="tr-col tr-c1">${colRadicals()}</div><div class="tr-col tr-c2">${colChars()}</div><div class="tr-col tr-c3">${colWords()}</div></div></div>`;
    if (y) host.querySelectorAll('.tr-col').forEach((c, i) => { c.scrollTop = y[i]; });
    const on = host.querySelector('.tr-c1 .tr-r.on'); if (on && !keep) on.scrollIntoView({ block: 'nearest' });
  }
  function go(patch) { Object.assign(st, patch); paint(true); const c = host.querySelector(st.stage === 'w' ? '.tr-c3' : '.tr-c2'); if (c && patch.scrollTop !== false) c.scrollTop = 0; if (matchMedia('(max-width: 899px)').matches) host.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  function bind() {
    host.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.say) { TTS.speak(d.say); return; }
      if (d.all !== undefined) { st.all = d.all === '1'; paint(); return; }
      if (d.trad !== undefined) { S().hzTrad = !trad(); Store.save(); paint(true); return; }
      if (d.stage) { st.stage = d.stage; paint(true); return; }
      if (d.r) { sfx('tap'); go({ node: { r: +d.r }, ch: null, stage: 'c' }); return; }
      if (d.g) { sfx('tap'); const no = +(String(d.g).split('@')[1] || 0), asRad = no ? rad.get(no) : D.r.find(r => r[1] === d.g || r[8].some(f => f[0] === d.g)); go({ node: asRad ? { r: asRad[0] } : { g: d.g }, ch: null, stage: 'c' }); return; }
      if (d.ch) { sfx('tap'); go({ ch: d.ch, stage: 'w', scrollTop: true }); return; }
      if (d.w) { if (typeof HzKit !== 'undefined') HzKit.openWord(d.w); else { const w = WORDS.find(x => x.zh === d.w); if (w) Dict.detail(w.id); else TTS.speak(d.w); } }
    });
    host.addEventListener('input', e => {
      if (!e.target.matches('.tr-q input')) return;
      const v = e.target.value; st.q = v; const t = v.trim();
      // a character or component typed in: jump straight to it
      if (t.length === 1 && /[㐀-鿿⺀-⿟]/.test(t)) {
        const r = D.r.find(x => x[1] === t || x[8].some(f => f[0] === t));
        if (r && !D.c[t]) { Object.assign(st, { node: { r: r[0] }, ch: null, stage: 'c' }); }
        else if (D.c[t]) { const x = D.c[t]; Object.assign(st, { node: x[3] ? { r: x[3] } : { g: t }, ch: t, stage: 'w' }); }
        else if (D.cc[t]) Object.assign(st, { node: { g: t }, ch: null, stage: 'c' });
      }
      const pos = e.target.selectionStart; paint(true);
      const inp = host.querySelector('.tr-q input'); inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (err) { }
    });
  }

  return {
    refresh() { if (host && host.isConnected && D) paint(true); },
    focus(c) {
      if (!D || !host || !host.isConnected || !c) return;
      const t = base(c);
      if (D.c[t]) {
        const x = D.c[t];
        go({ node: x[3] ? { r: x[3] } : { g: t }, ch: t, stage: 'w', scrollTop: true });
      } else {
        const r = D.r.find(x => x[1] === t || x[8].some(f => f[0] === t));
        if (r) go({ node: { r: r[0] }, ch: null, stage: 'c', scrollTop: true });
        else if (D.cc[t]) go({ node: { g: t }, ch: null, stage: 'c', scrollTop: true });
        else toast(T('ยังไม่มีอักษร HSK ในหมวดนี้'), { icon: 'info' });
      }
    },
    async mount(el) {
      host = el; if (!host) return;
      host.innerHTML = `<p class="tr-empty">${T('กำลังโหลดต้นไม้…')}</p>`;
      if (!window.OFFY_TREE) { try { await Fx.script(SRC); } catch (e) { host.innerHTML = `<p class="tr-empty">${T('โหลดเนื้อหาเล่มนี้ไม่ได้ ลองเปิดใหม่อีกครั้ง')}</p>`; return; } }
      if (host !== el) return;
      D = window.OFFY_TREE; rad = new Map(D.r.map(r => [r[0], r]));
      if (!st.node) st.node = { r: 85 };                  // start somewhere alive: 水 / 氵
      bind(); paint();
    }
  };
})();
