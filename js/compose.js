'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — ผสมอักษร (character composer), a tab of #/hanzi
   Start from one square: 小. Slots open on every side where a piece can be added and still make a real character
   (top · bottom · left · right · inside · around); pick one and the square becomes that character — 小 → 尔 → 你 —
   until nothing more can be added. The chain of squares above keeps every step.
   Data: data/compose.js (window.OFFY_COMPOSE: top-level IDS of each HSK character and of every part inside one,
   from cjkvi-ids) + data/tree.js (pinyin, meaning, level, words) — both made by แปล HSK1 5ภาษา/tools/build_*.py.
   ===================================================================== */
const OffyCompose = (() => {
  const SRC = 'data/compose.js?v=1', TREE = 'data/tree.js?v=6';
  const IDC = /[⿰-⿿㇯]/g;
  const ZONES = ['top', 'left', 'right', 'bottom', 'inside', 'around'];
  const ZN = { top: 'เติมด้านบน', bottom: 'เติมด้านล่าง', left: 'เติมด้านซ้าย', right: 'เติมด้านขวา', inside: 'แทรกกลาง', around: 'ล้อมรอบ' };
  const ENC = '⿴⿵⿶⿷⿸⿹⿺⿼⿽';
  const STARTERS = '口木日月女子人心王土火水小大力又寸工禾目马白';
  const DISP = { '𠂊': '⺈' };                       // the same piece, in a code point fonts actually have
  const PAGE = 30;
  const st = { chain: [], more: {} };
  let C = null, D = null, host = null, kids = null;

  Object.assign(window.OFFY_EN || {}, {
    'ผสมอักษร': 'Compose', 'นอก HSK': 'Not HSK', 'เติมด้านบน': 'Add on top', 'เติมด้านล่าง': 'Add below', 'เติมด้านซ้าย': 'Add on the left', 'เติมด้านขวา': 'Add on the right',
    'แทรกกลาง': 'Put inside', 'ล้อมรอบ': 'Wrap around', 'เริ่มจากอักษรหรือส่วนประกอบตัวไหนก็ได้': 'Start from any character or part',
    'พิมพ์หรือเขียนตัวเริ่มต้น': 'Type or write a starting piece', 'เริ่มใหม่': 'Start over', 'ย้อน': 'Back', 'ส่วนประกอบ': 'Part',
    'สุดสายแล้ว · ไม่มีอักษร HSK ที่ผสมต่อจากตัวนี้': 'End of the line · no HSK character builds on this one',
    'ตัวนี้ยังไม่มีข้อมูลการผสม': 'No composing data for this one yet', 'ดูเพิ่มอีก': 'Show', 'ตัว': 'more', 'อยู่ใน': 'in',
    'ลองเริ่มจาก': 'Try starting from', 'คำที่ใช้ตัวนี้': 'Words with it', 'ผสมได้อีก': 'can still grow', 'ทาง': 'ways',
    'กำลังโหลดตัวผสม…': 'Loading…', 'เขียนค้นหา': 'Handwriting'
  });

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const disp = g => { const s = String(g).replace(IDC, ''); return [...s].map(c => DISP[c] || c).join(''); };
  const xb = g => [...String(g)].some(c => c.codePointAt(0) >= 0x20000) ? ' xb' : '';
  const lvl = g => { const x = D.c[g]; return x ? x[1] : 0; };
  const LVN = l => l === 7 ? '7-9' : String(l);
  const lvOk = l => typeof HzLv === 'undefined' || HzLv.has(l);      // the HSK levels picked on the อักษร page (7 = the 7–9 band)
  const okC = c => lvOk(D.c[c][1]);
  const reach = g => { let n = (D.cc[g] || []).filter(okC).length; ((D.amb || {})[g] || []).forEach(no => { n += (D.cc[`${g}@${no}`] || []).filter(okC).length; }); return n; };
  // a step shows only when it is an HSK character of a picked level, or a part that leads to one
  const shown = e => { const l = lvl(e.r); return l ? lvOk(l) : reach(e.r) > 0; };

  function zoneOf(idc, i) {
    if (idc === '⿰') return i ? 'left' : 'right';
    if (idc === '⿱') return i ? 'top' : 'bottom';
    if (idc === '⿲') return ['right', 'around', 'left'][i];
    if (idc === '⿳') return ['bottom', 'around', 'top'][i];
    if (idc === '⿻') return 'inside';
    if (ENC.includes(idc)) return i ? 'around' : 'inside';
    return null;
  }
  function index() {
    kids = new Map();
    for (const [g, row] of Object.entries(C.ids)) {
      const idc = row[0], parts = row.slice(1);
      parts.forEach((p, i) => {
        if (!p || /^[⿰-⿿㇯]/.test(p) || p === g) return;
        const z = zoneOf(idc, i); if (!z) return;
        if (!kids.has(p)) kids.set(p, {});
        const k = kids.get(p); (k[z] = k[z] || []);
        if (!k[z].some(e => e.r === g)) k[z].push({ r: g, i, idc, add: parts.filter((_, j) => j !== i).filter(Boolean) });
      });
    }
    // HSK characters first (easiest level first), then parts that lead to the most HSK characters
    const rank = e => { const l = lvl(e.r); return l ? l * 1e4 : 1e5 - Math.min(9999, reach(e.r)); };
    kids.forEach(k => Object.values(k).forEach(list => list.sort((a, b) => rank(a) - rank(b))));
  }
  const ways = g => { const k = kids.get(g) || {}; return ZONES.reduce((n, z) => n + (k[z] || []).filter(shown).length, 0); };

  /* ---------- pieces ---------- */
  const zoneIcon = z => `<svg class="cp-zi" viewBox="0 0 20 20" aria-hidden="true"><rect x="1.5" y="1.5" width="17" height="17" rx="4"/>${{
    top: '<rect class="f" x="4" y="4" width="12" height="5" rx="1.5"/>', bottom: '<rect class="f" x="4" y="11" width="12" height="5" rx="1.5"/>',
    left: '<rect class="f" x="4" y="4" width="5" height="12" rx="1.5"/>', right: '<rect class="f" x="11" y="4" width="5" height="12" rx="1.5"/>',
    inside: '<rect class="f" x="7" y="7" width="6" height="6" rx="1.5"/>', around: '<path class="f o" d="M4.5 15.5V4.5h11v11"/>'
  }[z]}</svg>`;

  // the character drawn as its layout: the piece you had (ink) and the piece just added (accent)
  function structHTML(g, from) {
    const row = C.ids[g]; if (!row) return '';
    const idc = row[0], parts = row.slice(1);
    const cell = (p, j) => `<span class="cp-s-c${from && j === from.i ? ' old' : from ? ' new' : ''}${xb(p)}">${esc(disp(p) || '?')}</span>`;
    const k = idc === '⿰' ? 'lr' : idc === '⿱' ? 'tb' : idc === '⿲' ? 'lmr' : idc === '⿳' ? 'tmb' : ENC.includes(idc) ? 'enc' : 'ov';
    return `<div class="cp-struct k-${k}" lang="zh-Hans" aria-label="${esc(row.join(''))}">${parts.map(cell).join('')}</div>`;
  }

  function centerHTML() {
    const e = st.chain[st.chain.length - 1];
    if (!e) return `<div class="cp-center empty">
        <div class="cp-sq">?</div>
        <p class="cp-lead">${T('เริ่มจากอักษรหรือส่วนประกอบตัวไหนก็ได้')}</p>
        <p class="cp-try"><span>${T('ลองเริ่มจาก')}</span>${[...STARTERS].filter(g => ways(g)).map(g => `<button data-start="${g}" lang="zh-Hans">${g}</button>`).join('')}</p></div>`;
    const g = e.g, x = D.c[g], n = ways(g);
    const mo = typeof HzKit !== 'undefined' ? HzKit.charMean(g, D, null) : { t: x ? (LANG !== 'en' && x[9]) || x[10] || '' : '', fb: false };
    const dot = typeof HzKit !== 'undefined' ? HzKit.dotHtml(g) : '';
    const xbar = typeof HzKit !== 'undefined' ? HzKit.crossBar(g, 'compose') : '';
    const words = x ? (D.cw[g] || []).filter(i => lvOk(D.w[i][2])).slice(0, 6).map(i => {
      const w = D.w[i];
      const gl = typeof HzKit !== 'undefined' ? HzKit.wordGloss(w[0], w[3], !!w[4]) : { t: w[3], fb: !w[4] };
      return `<li><button type="button" class="cp-wbtn" data-cpword="${esc(w[0])}"><i class="lvq" style="--c:var(--hsk${w[2]})">${LVN(w[2])}</i><b lang="zh-Hans">${esc(w[0])}</b><span class="pyx">${esc(w[1])}</span><span class="cp-wgl">${gl.fb ? '<em>EN</em>' : ''}${esc(gl.t)}</span></button><button type="button" class="tr-say" data-say="${esc(w[0])}" aria-label="${T('ฟังเสียง')}">${ic('vol')}</button></li>`;
    }).join('') : '';
    return `<div class="cp-center${n ? '' : ' end'}" data-in="${e.z || ''}">
      <button class="cp-sq${xb(g)}" style="--lc:var(--hsk${x ? x[1] : 'C'})" data-say="${esc(g)}" lang="zh-Hans" aria-label="${esc(g)}">${dot}${esc(disp(g))}<span class="cp-say-badge" aria-hidden="true">${ic('vol')}</span></button>
      ${structHTML(g, e.from)}
      <div class="cp-meta">
        ${x ? `<p class="cp-py"><span class="pyx">${esc(x[0])}</span><em style="--c:var(--hsk${x[1]})">HSK ${LVN(x[1])}</em></p><p class="cp-mean">${esc(mo.t || '')}</p>`
        : `<p class="cp-py"><em class="part">${T('ส่วนประกอบ')}</em>${reach(g) ? ` <span class="muted">${T('อยู่ใน')} ${reach(g)} ${T('ตัว')}</span>` : ''}</p>`}
        ${n ? `<p class="cp-ways">${T('ผสมได้อีก')} <b>${n}</b> ${T('ทาง')}</p>` : `<p class="cp-end">${T('สุดสายแล้ว · ไม่มีอักษร HSK ที่ผสมต่อจากตัวนี้')}</p>`}
      </div>
      ${xbar}
      ${words ? `<div class="cp-ws-wrap"><div class="cp-ws-h"><span>${T('คำที่ใช้ตัวนี้')}</span><small>${T('แตะเพื่อดู 5 ภาษา')}</small></div><ul class="cp-ws" aria-label="${T('คำที่ใช้ตัวนี้')}">${words}</ul></div>` : ''}
    </div>`;
  }

  function zonesHTML() {
    const e = st.chain[st.chain.length - 1]; if (!e) return '';
    const k = kids.get(e.g) || {};
    return ZONES.map(z => {
      const list = (k[z] || []).filter(shown); if (!list.length) return '';
      const lim = st.more[z] ? list.length : PAGE;
      const btns = list.slice(0, lim).map((c, j) => {
        const l = lvl(c.r), cx = D.c[c.r];
        const dot = typeof HzKit !== 'undefined' ? HzKit.dotHtml(c.r) : '';
        const mo = cx && typeof HzKit !== 'undefined' ? HzKit.charMean(c.r, D, null) : { t: '' };
        const sh = mo.t ? (typeof HzKit !== 'undefined' ? HzKit.short(mo.t, 6) : mo.t.slice(0, 6)) : '';
        return `<button class="cp-c${l ? '' : ' part'}${xb(c.r)}" style="--lc:var(--hsk${l || 'C'});--d:${Math.min(j, 14) * 18}ms" data-pick="${esc(c.r)}" data-z="${z}" data-j="${j}" lang="zh-Hans">
          ${dot}${cx && cx[0] ? `<span class="pyx cp-cpy">${esc(cx[0])}</span>` : ''}<b>${esc(disp(c.r))}</b><small>+${esc(c.add.map(disp).join(''))}${sh ? ` · ${esc(sh)}` : ''}</small><i>${l ? 'HSK ' + LVN(l) : T('นอก HSK')}</i></button>`;
      }).join('');
      return `<section class="cp-z z-${z}"><h4>${zoneIcon(z)}${T(ZN[z])}<span>${list.length}</span></h4>
        <div class="cp-cs">${btns}${list.length > lim ? `<button class="cp-more" data-more="${z}">${T('ดูเพิ่มอีก')} ${list.length - lim} ${T('ตัว')}</button>` : ''}</div></section>`;
    }).join('');
  }

  function chainHTML() {
    return st.chain.map((e, i) => `${i ? `<i class="cp-arr">${zoneIcon(e.z)}</i>` : ''}<button class="cp-box${i === st.chain.length - 1 ? ' on' : ''}${xb(e.g)}" data-step="${i}" lang="zh-Hans">${esc(disp(e.g))}</button>`).join('');
  }

  function paint(anim) {
    if (!host) return;
    const e = st.chain[st.chain.length - 1];
    host.innerHTML = `<div class="cp${anim ? ' anim' : ''}">
      <div class="cp-top">
        <label class="cp-q">${ic('search')}<input id="cpQ" maxlength="2" placeholder="${T('พิมพ์หรือเขียนตัวเริ่มต้น')}" autocomplete="off" lang="zh-Hans"></label>
        <button class="cp-pen" data-handpad="#cpQ" aria-label="${T('เขียนค้นหา')}">${ic('pen')}</button>
        ${st.chain.length > 1 ? `<button class="cp-btn" data-back>${ic('undo')}<span>${T('ย้อน')}</span></button>` : ''}
        ${st.chain.length ? `<button class="cp-btn" data-reset>${ic('retry')}<span>${T('เริ่มใหม่')}</span></button>` : ''}
      </div>
      ${st.chain.length ? `<div class="cp-chain" aria-label="chain">${chainHTML()}</div>` : ''}
      <div class="cp-board${e ? '' : ' start'}">${centerHTML()}${zonesHTML()}</div>
    </div>`;
  }

  function start(g) {
    g = DISP[g] && C.ids[DISP[g]] ? DISP[g] : g;
    if (!kids.has(g) && !C.ids[g] && !D.c[g]) { toast(T('ตัวนี้ยังไม่มีข้อมูลการผสม'), { icon: 'info' }); return; }
    st.chain = [{ g }]; st.more = {}; paint(true);
  }
  function pick(r, z, j) {
    const e = st.chain[st.chain.length - 1], c = ((kids.get(e.g) || {})[z] || []).filter(shown)[j];
    st.chain.push({ g: r, z, from: c ? { i: c.i } : null }); st.more = {};
    try { sfx('tap'); } catch (err) { }
    paint(true);
  }

  function bind() {
    host.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.cpword) { if (typeof HzKit !== 'undefined') HzKit.openWord(d.cpword); else TTS.speak(d.cpword); return; }
      if (d.say) { TTS.speak(d.say); return; }
      if (d.start) { start(d.start); return; }
      if (d.pick) { pick(d.pick, d.z, +d.j); return; }
      if (d.more) { st.more[d.more] = true; paint(); return; }
      if (d.step !== undefined) { st.chain = st.chain.slice(0, +d.step + 1); st.more = {}; paint(true); return; }
      if (d.back !== undefined) { st.chain.pop(); st.more = {}; paint(true); return; }
      if (d.reset !== undefined) { st.chain = []; st.more = {}; paint(true); }
    });
    const go = inp => { const g = Array.from(inp.value.trim())[0]; if (g && /[⺀-鿿\u{20000}-\u{3FFFF}]/u.test(g) && !(st.chain.length === 1 && st.chain[0].g === g)) start(g); };
    host.addEventListener('change', e => { if (e.target.id === 'cpQ') go(e.target); });
    host.addEventListener('input', e => { if (e.target.id === 'cpQ' && !e.isComposing) go(e.target); });
  }

  return {
    async mount(el) {
      host = el; if (!host) return;
      host.innerHTML = `<p class="tr-empty">${T('กำลังโหลดตัวผสม…')}</p>`;
      try {
        if (!window.OFFY_TREE) await Fx.script(TREE);
        if (!window.OFFY_COMPOSE) await Fx.script(SRC);
      } catch (e) { host.innerHTML = `<p class="tr-empty">${T('โหลดเนื้อหาเล่มนี้ไม่ได้ ลองเปิดใหม่อีกครั้ง')}</p>`; return; }
      if (host !== el) return;
      D = window.OFFY_TREE; C = window.OFFY_COMPOSE;
      if (!kids) index();
      bind(); paint(true);
    },
    refresh() { if (host && host.isConnected && C) paint(); },
    start(g) { if (C) start(g); }
  };
})();
