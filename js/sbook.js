'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — VOL 12 近义词辨析 Interactive Reader
   Routes:
     #/book/synonym          → Searchable, filterable 45-group hub + ✓/✗ Mini-Quiz
     #/book/synonym/<id>     → Focused comparison card (supports g33, cg-33, or word)
   Lazy data: data/synonyms.js (window.OFFY_SYNONYMS)
   ===================================================================== */
(function sbook() {
  const ID = 'synonym';
  const SRC = 'data/synonyms.js?v=1.0.0';

  const THEME_EN = {
    'การรับรู้': 'Perception', 'การรู้': 'Knowing', 'ความสามารถ': 'Ability', 'ความต้องการ': 'Desire & Need',
    'ความคิด': 'Thinking', 'การปฏิเสธ': 'Negation', 'จำนวน': 'Numbers & Quantity', 'คำช่วยท้ายประโยค': 'Modal Particles',
    'ระดับ': 'Degree', 'การเกิดซ้ำ': 'Repetition', 'เวลา': 'Time', 'การเรียน': 'Studying',
    'กริยาประจำวัน': 'Daily Verbs', 'ความรู้สึก': 'Feelings & Looks', 'ไวยากรณ์': 'Grammar Words',
    'สรรพนาม': 'Pronouns', 'มารยาท': 'Politeness', 'อาหาร': 'Food & Drink', 'ภาษา': 'Language'
  };

  Object.assign(window.OFFY_EN || {}, {
    'คำเหมือน / คำสับสน': 'Confusable Words',
    'ค้นหาคำจีน พินอิน คำแปล หรือหัวข้อ…': 'Search Chinese, pinyin, meaning or topic…',
    'กลุ่ม': 'groups',
    'คำที่เทียบ': 'words compared',
    'ทดสอบ ✓/✗': 'Quiz ✓/✗',
    'สรุปกฎสั้น': 'Quick Rule',
    'เกณฑ์แยกเร็ว': 'Fast Distinction',
    'อธิบายละเอียด': 'Detailed Breakdown',
    'ประโยคตัวอย่าง': 'Examples',
    'เฉพาะ ✓ ถูก': '✓ Correct only',
    'เฉพาะ ✗ ผิด': '✗ Wrong only',
    'กลุ่มอื่นในหมวดเดียวกัน': 'More in this category',
    'ไม่พบกลุ่มคำที่ค้นหา': 'No matching groups found',
    'แตะคำเพื่อดูการ์ด 5 ภาษา': 'Tap any word for 5-lang card',
    'ใช้ถูก': 'Correct',
    'ใช้ผิด': 'Wrong',
    'ข้อต่อไป': 'Next',
    'ดูกลุ่มนี้เต็ม ๆ': 'Open this group',
    'สรุปผลทดสอบ': 'Quiz Summary',
    'ทำอีกรอบ': 'Try again',
    'กลับไปรายการ': 'Back to list',
    'ประโยคนี้ใช้คำถูกหรือผิด?': 'Is this sentence used correctly or wrongly?'
  });

  let loading = null;
  let openId = null;     // 'g1'..'g45' or null
  let curTheme = 'all';
  let curQ = '';
  let exFilter = 'all';  // 'all' | 'ok' | 'no'
  let quiz = null;       // { items, i, score, answered, ok, label }
  let lastKey = null;
  let _wMap = null;

  const list = () => Array.isArray(window.OFFY_SYNONYMS) ? window.OFFY_SYNONYMS : null;
  const S = () => (typeof Store !== 'undefined' && Store.d && Store.d.settings) ? Store.d.settings : {};
  const isEn = () => { const l = S().sbLang; return l ? l === 'en' : (typeof LANG !== 'undefined' && LANG === 'en'); };
  const icn = (n, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}"><use href="#i-${n}"/></svg>`;

  function ensureData() {
    if (list()) return Promise.resolve(list());
    if (!loading) {
      loading = Fx.script(SRC).then(() => {
        if (Book.id === ID && location.hash.startsWith('#/book/')) draw();
        return list();
      }).catch(() => {
        loading = null;
        if (Book.id === ID) $('#bkBody').innerHTML = `<p class="muted b5-loading">${T('โหลดเนื้อหาเล่มนี้ไม่ได้ ลองเปิดใหม่อีกครั้ง')}</p>`;
        return null;
      });
    }
    return loading;
  }

  function resolveId(raw) {
    const arr = list();
    if (!raw || !arr) return null;
    const s = decodeURIComponent(String(raw)).trim();
    const low = s.toLowerCase();
    let hit = arr.find(g => g.id.toLowerCase() === low || g.cg.toLowerCase() === low || String(g.n) === low);
    if (!hit) {
      const m = low.match(/^(?:cg-?|g)(\d+)$/);
      if (m) { const num = +m[1]; hit = arr.find(g => g.n === num); }
    }
    if (!hit) hit = arr.find(g => g.words.includes(s));
    return hit ? hit.id : null;
  }

  /* map Chinese text → best app word ID for in-place 5-lang Sheet */
  function wordMap() {
    if (_wMap || typeof WORDS === 'undefined' || !WORDS.length) return _wMap || new Map();
    const m = new Map();
    const has5 = id => typeof FIVE !== 'undefined' && FIVE.has && FIVE.has(id);
    for (const w of WORDS) {
      if (!w || !w.zh) continue;
      const prev = m.get(w.zh);
      if (!prev) { m.set(w.zh, w); continue; }
      const p5 = has5(prev.id), c5 = has5(w.id);
      if (c5 && !p5) m.set(w.zh, w);
      else if (c5 === p5 && (+w.lvl || 99) < (+prev.lvl || 99)) m.set(w.zh, w);
    }
    _wMap = m;
    return m;
  }

  function findWordId(zh) {
    const m = wordMap();
    const tries = [zh, zh.replace(/[（()）]/g, ''), zh.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '')];
    for (const t of tries) {
      const hit = m.get(t);
      if (hit) return hit.id;
    }
    return null;
  }

  function openWord(zh) {
    const wid = findWordId(zh);
    if (wid && typeof Dict !== 'undefined' && Dict.detail) {
      sfx('tap');
      Dict.detail(wid);
      return;
    }
    const clean = zh.replace(/[（()）]/g, '');
    if (typeof TTS !== 'undefined') TTS.speak(clean);
    if (typeof toast === 'function') toast(`${zh} · ${T('ฟังเสียงแล้ว')}`, { icon: 'vol' });
  }

  /* split "1) ...  2) ...  3) ..." detailed prose into clean readable items */
  function splitDetail(txt) {
    if (!txt) return '';
    const cleaned = txt.trim();
    const parts = cleaned.split(/\s+(?=\d+\)\s)/).filter(Boolean);
    if (parts.length <= 1) return `<p class="sb-det-p">${esc(cleaned)}</p>`;
    const items = [];
    let note = '';
    for (let p of parts) {
      const mNote = p.match(/^(.*?)\s{2,}(หมายเหตุ[:：].*|Note[:：].*)$/s);
      if (mNote) { p = mNote[1].trim(); note = mNote[2].trim(); }
      const m = p.match(/^(\d+)\)\s*(.*)$/s);
      if (m) items.push(`<li><span class="sb-num">${m[1]}</span><span>${esc(m[2].trim())}</span></li>`);
      else items.push(`<li><span class="sb-num">•</span><span>${esc(p)}</span></li>`);
    }
    return `<ol class="sb-det-list">${items.join('')}</ol>${note ? `<p class="sb-det-note">${esc(note)}</p>` : ''}`;
  }

  function themeLabel(th) {
    return isEn() ? (THEME_EN[th] || th) : th;
  }

  function themesOf(arr) {
    const map = new Map();
    for (const g of arr) map.set(g.theme, (map.get(g.theme) || 0) + 1);
    return [...map.entries()];
  }

  function matchGroup(g, q, theme) {
    if (theme && theme !== 'all' && g.theme !== theme) return false;
    if (!q) return true;
    const ql = q.toLowerCase();
    const pinyins = Object.values(g.word_info || {}).map(v => v.pinyin || '').join(' ');
    const hay = [
      g.id, g.cg, String(g.n), g.theme, THEME_EN[g.theme] || '',
      g.title, g.words.join(' '), pinyins,
      g.rule_th, g.rule_en, g.ca_th, g.ca_en
    ].join(' ').toLowerCase();
    if (hay.includes(ql)) return true;
    // Strip tone marks for pinyin search without accents (e.g. "kanjian" or "hui")
    const fold = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return fold(pinyins.toLowerCase()).includes(fold(ql));
  }

  function langToggleHtml() {
    const en = isEn();
    const pyOn = S().showPinyin !== false;
    return `<div class="sb-tools">
      <div class="gb-langs" role="group" aria-label="${esc(T('ภาษาคำอธิบาย'))}">
        <button type="button" class="gb-lg${!en ? ' on' : ''}" data-sblang="th" aria-pressed="${!en}">TH</button>
        <button type="button" class="gb-lg${en ? ' on' : ''}" data-sblang="en" aria-pressed="${en}">EN</button>
      </div>
      <button type="button" class="gb-tbtn${pyOn ? '' : ' off'}" data-sbpy aria-label="${esc(T('แสดง/ซ่อนพินอิน'))}" title="${esc(T('แสดง/ซ่อนพินอิน'))}">${icn(pyOn ? 'eye' : 'eye-off')}</button>
    </div>`;
  }

  /* ---------- QUIZ MODE (✓ / ✗ Spot the Confusable Word) ---------- */
  function startQuiz(groups, label) {
    const okPool = [], noPool = [];
    for (const g of groups) {
      for (const ex of (g.examples || [])) {
        const item = { g, ex, ok: ex.mark === '✓' };
        if (item.ok) okPool.push(item); else noPool.push(item);
      }
    }
    const maxN = groups.length === 1 ? Math.min(10, okPool.length + noPool.length) : 10;
    const wantNo = Math.min(noPool.length, Math.ceil(maxN / 2));
    const wantOk = Math.min(okPool.length, maxN - wantNo);
    const chosen = shuffle([
      ...shuffle(noPool).slice(0, wantNo),
      ...shuffle(okPool).slice(0, wantOk)
    ]);
    if (!chosen.length) { toast(T('ไม่พบประโยคสำหรับทดสอบ'), { icon: 'info' }); return; }
    quiz = { items: chosen, i: 0, score: 0, answered: false, picked: null, label };
    sfx('tap');
    draw();
  }

  function renderQuiz() {
    const en = isEn(), q = quiz, total = q.items.length;
    if (q.i >= total) {
      const pct = Math.round((q.score / total) * 100);
      return `<div class="sb sb-quiz">
        <div class="sb-crumb">
          <button type="button" class="sb-back" data-sbqexit>${icn('chev-l')}${T('กลับไปรายการ')}</button>
          <span class="sb-pos">${T('สรุปผลทดสอบ')}</span>
        </div>
        <div class="sb-qdone">
          <div class="sb-qscore">${q.score}<span>/${total}</span></div>
          <h3>${pct >= 80 ? 'เยี่ยมมาก! แยกคำสับสนได้แม่นขึ้นแล้ว' : pct >= 50 ? 'ดีเลย! ทวนอีกนิดจะเป๊ะทุกคู่' : 'ลองกดดูแต่ละกลุ่มแล้วมาท้าใหม่นะ'}</h3>
          <p class="muted">${esc(q.label)} · ${pct}%</p>
          <div class="sb-qacts">
            <button type="button" class="btn primary" data-sbqretry>${icn('retry')}${T('ทำอีกรอบ')}</button>
            <button type="button" class="btn" data-sbqexit>${T('กลับไปรายการ')}</button>
          </div>
        </div>
      </div>`;
    }
    const cur = q.items[q.i], ex = cur.ex, g = cur.g;
    const right = q.answered && q.picked === cur.ok;
    return `<div class="sb sb-quiz">
      <div class="sb-crumb">
        <button type="button" class="sb-back" data-sbqexit>${icn('chev-l')}${T('กลับไปรายการ')}</button>
        <span class="sb-pos">${q.i + 1} / ${total} · ${T('ถูก')} ${q.score}</span>
        ${langToggleHtml()}
      </div>
      <div class="sb-qbar"><i style="width:${(q.i / total) * 100}%"></i></div>
      <div class="sb-qcard">
        <div class="sb-qmeta">
          <span class="sb-theme-tag">${esc(themeLabel(g.theme))}</span>
          <span class="sb-qgrp" lang="zh-Hans">${esc(g.words.slice(0, 4).join(' / '))}</span>
        </div>
        <p class="sb-qprompt">${T('ประโยคนี้ใช้คำถูกหรือผิด?')}</p>
        <div class="sb-qsent">
          <div class="sb-qzh" lang="zh-Hans">${esc(ex.zh)}</div>
          <div class="pyx sb-qpy">${esc(ex.py || '')}</div>
          ${(cur.ok || q.answered) ? `<button type="button" class="gx-say" data-sbsay="${esc(ex.zh)}" aria-label="${esc(T('ฟังเสียง'))}">${icn('vol')}</button>` : ''}
        </div>
        ${!q.answered ? `
          <div class="sb-qbtns">
            <button type="button" class="sb-qbtn ok" data-sbqans="1">${icn('check')}<span>✓ ${T('ใช้ถูก')}</span></button>
            <button type="button" class="sb-qbtn no" data-sbqans="0">${icn('x')}<span>✗ ${T('ใช้ผิด')}</span></button>
          </div>
        ` : `
          <div class="sb-qfb ${right ? 'is-ok' : 'is-no'}">
            <div class="sb-qfb-h">
              <b>${right ? '✓ ถูกต้อง!' : '✗ ยังไม่ใช่'}</b>
              <span>${cur.ok ? 'ประโยคนี้ใช้ถูก (✓)' : 'ประโยคนี้ใช้ผิด (✗)'}</span>
            </div>
            <p class="sb-qfb-tr">${esc(en ? (ex.en || ex.th) : (ex.th || ex.en))}</p>
            ${ex.note ? `<p class="sb-qfb-note">${esc(ex.note)}</p>` : ''}
            <p class="sb-qfb-rule">${esc(en ? (g.rule_en || g.rule_th) : (g.rule_th || g.rule_en))}</p>
            <div class="sb-qfb-f">
              <button type="button" class="btn sm" data-sbopen="${g.id}">${T('ดูกลุ่มนี้เต็ม ๆ')} →</button>
              <button type="button" class="btn primary" data-sbqnext>${q.i + 1 < total ? T('ข้อต่อไป') : T('สรุปผลทดสอบ')} ${icn('chev-r')}</button>
            </div>
          </div>
        `}
      </div>
    </div>`;
  }

  /* ---------- HUB (ALL 45 GROUPS: SEARCH + THEME FILTER + CARDS) ---------- */
  function renderHub(arr) {
    const en = isEn();
    const themes = themesOf(arr);
    const totalWords = new Set(arr.flatMap(g => g.words)).size;
    const matched = arr.filter(g => matchGroup(g, curQ, curTheme));

    const cardsHtml = matched.length ? matched.map(g => {
      const okN = (g.examples || []).filter(e => e.mark === '✓').length;
      const noN = (g.examples || []).filter(e => e.mark === '✗').length;
      const rule = en ? (g.rule_en || g.rule_th) : (g.rule_th || g.rule_en);
      return `<article class="sb-card" data-sbopen="${g.id}" tabindex="0" role="button">
        <div class="sb-card-top">
          <span class="sb-badge">#${String(g.n).padStart(2, '0')}</span>
          <span class="sb-theme-tag">${esc(themeLabel(g.theme))}</span>
          <span class="sb-excnt"><i class="ok">✓${okN}</i>${noN ? `<i class="no">✗${noN}</i>` : ''}</span>
        </div>
        <div class="sb-card-ws">${g.words.map(w => {
          const py = g.word_info && g.word_info[w] ? g.word_info[w].pinyin : '';
          return `<span class="sb-wmini"><b lang="zh-Hans">${esc(w)}</b>${py ? `<small class="pyx">${esc(py)}</small>` : ''}</span>`;
        }).join('')}</div>
        <p class="sb-card-rule">${esc(rule)}</p>
        <span class="sb-card-go">${en ? 'Compare & examples' : 'เทียบละเอียด & ตัวอย่าง'} ${icn('chev-r')}</span>
      </article>`;
    }).join('') : `<p class="sb-empty muted">${T('ไม่พบกลุ่มคำที่ค้นหา')}</p>`;

    return `<div class="sb sb-hub">
      <header class="sb-hero">
        <div class="sb-hero-top">
          <div>
            <h2><span lang="zh-Hans">近义词辨析</span> ${T('คำเหมือน / คำสับสน')}</h2>
            <p>${arr.length} ${T('กลุ่ม')} · ${totalWords} ${T('คำที่เทียบ')} · ${en ? 'Instant search, theme filter & ✓/✗ examples' : 'ค้นหาเร็ว กรองตามหมวด แตะคำเปิด 5 ภาษาได้ทันที'}</p>
          </div>
          ${langToggleHtml()}
        </div>
        <div class="sb-hero-acts">
          <label class="gb-search sb-search">
            ${icn('search')}
            <input type="search" id="sbQ" value="${esc(curQ)}" placeholder="${esc(T('ค้นหาคำจีน พินอิน คำแปล หรือหัวข้อ…'))}" autocomplete="off">
            <button type="button" class="gb-clr" id="sbClr" ${curQ ? '' : 'hidden'} aria-label="${esc(T('ล้างคำค้น'))}">${icn('x')}</button>
          </label>
          <button type="button" class="btn primary sm sb-qstart" data-sbquiz="filtered">${icn('target')}<span>${T('ทดสอบ ✓/✗')}</span></button>
        </div>
      </header>

      <div class="sb-themes" role="tablist" aria-label="หมวดคำสับสน">
        <button type="button" class="sb-tchip${curTheme === 'all' ? ' on' : ''}" data-sbtheme="all">${T('ทั้งหมด')} <small>${arr.length}</small></button>
        ${themes.map(([th, cnt]) => `<button type="button" class="sb-tchip${curTheme === th ? ' on' : ''}" data-sbtheme="${esc(th)}">${esc(themeLabel(th))} <small>${cnt}</small></button>`).join('')}
      </div>

      <div class="sb-statline">
        <span id="sbCount">${curQ || curTheme !== 'all' ? `${T('พบ')} <b>${matched.length}</b> / ${arr.length} ${T('กลุ่ม')}` : `${arr.length} ${T('กลุ่ม')} · ${en ? 'Tap any card to open' : 'แตะการ์ดเพื่ออ่านเทียบเต็ม ๆ'}`}</span>
        ${(curQ || curTheme !== 'all') ? `<button type="button" class="sb-reset" data-sbreset>${T('ล้างคำค้น')}</button>` : ''}
      </div>

      <div class="sb-grid" id="sbGrid">${cardsHtml}</div>
    </div>`;
  }

  /* ---------- DETAIL VIEW (ONE FOCUSED COMPARISON GROUP) ---------- */
  function renderDetail(arr, g) {
    const en = isEn();
    const idx = arr.findIndex(x => x.id === g.id);
    const prev = arr[idx - 1] || null;
    const next = arr[idx + 1] || null;
    const rule = en ? (g.rule_en || g.rule_th) : (g.rule_th || g.rule_en);
    const ca = en ? (g.ca_en || g.ca_th) : (g.ca_th || g.ca_en);
    const detail = en ? (g.detail_en || g.detail_th) : (g.detail_th || g.detail_en);

    const exs = g.examples || [];
    const okCnt = exs.filter(e => e.mark === '✓').length;
    const noCnt = exs.filter(e => e.mark === '✗').length;
    const shownEx = exs.filter(e => exFilter === 'all' || (exFilter === 'ok' ? e.mark === '✓' : e.mark === '✗'));

    const siblings = arr.filter(x => x.theme === g.theme && x.id !== g.id);

    return `<div class="sb sb-detail">
      <div class="sb-crumb">
        <button type="button" class="sb-back" data-sbback>${icn('chev-l')}${T('ทั้งหมด')} (${arr.length})</button>
        <span class="sb-pos">#${String(g.n).padStart(2, '0')} / ${arr.length}</span>
        ${langToggleHtml()}
        <span class="gb-step">
          <button type="button" data-sbopen="${prev ? prev.id : ''}" ${prev ? '' : 'disabled'} aria-label="${esc(T('บทก่อนหน้า'))}">${icn('chev-l')}</button>
          <button type="button" data-sbopen="${next ? next.id : ''}" ${next ? '' : 'disabled'} aria-label="${esc(T('บทถัดไป'))}">${icn('chev-r')}</button>
        </span>
      </div>

      <header class="sb-dh">
        <div class="sb-dh-meta">
          <span class="sb-badge">#${String(g.n).padStart(2, '0')}</span>
          <button type="button" class="sb-theme-tag is-btn" data-sbjumpth="${esc(g.theme)}">${esc(themeLabel(g.theme))}</button>
          <span class="sb-hint">${T('แตะคำเพื่อดูการ์ด 5 ภาษา')}</span>
        </div>
        <h2 lang="zh-Hans">${esc(g.title)}</h2>
      </header>

      <div class="sb-wbar">
        ${g.words.map(w => {
          const info = (g.word_info && g.word_info[w]) || {};
          const lv = info.level || '';
          const lvShort = /^HSK\s*\d/i.test(lv) ? lv : (lv ? 'วลี' : '');
          const cleanSpeak = w.replace(/[（()）]/g, '');
          return `<div class="sb-wchip">
            <button type="button" class="sb-wmain" data-sbword="${esc(w)}" title="${esc(T('แตะคำเพื่อดูการ์ด 5 ภาษา'))}">
              <b lang="zh-Hans">${esc(w)}</b>
              ${info.pinyin ? `<span class="pyx">${esc(info.pinyin)}</span>` : ''}
              ${lvShort ? `<i title="${esc(lv)}">${esc(lvShort)}</i>` : ''}
            </button>
            <button type="button" class="sb-wsay" data-sbsay="${esc(cleanSpeak)}" aria-label="${esc(T('ฟังเสียง'))} ${esc(w)}">${icn('vol')}</button>
          </div>`;
        }).join('')}
      </div>

      <section class="sb-rulebox">
        <div class="sb-sec-k">${icn('bulb')}<span>${T('สรุปกฎสั้น')}</span></div>
        <p class="sb-rule-txt">${esc(rule)}</p>
        ${ca ? `<div class="sb-ca"><b>${T('เกณฑ์แยกเร็ว')}:</b> ${esc(ca)}</div>` : ''}
      </section>

      ${detail ? `<section class="sb-detbox">
        <h3 class="sb-sec-k">${T('อธิบายละเอียด')}</h3>
        ${splitDetail(detail)}
      </section>` : ''}

      <section class="sb-exbox">
        <div class="sb-exhead">
          <h3 class="sb-sec-k">${T('ประโยคตัวอย่าง')} <small>✓ ${okCnt}${noCnt ? ` · ✗ ${noCnt}` : ''}</small></h3>
          <div class="sb-exhead-r">
            ${noCnt ? `<div class="gb-uf" role="tablist">
              <button type="button" class="${exFilter === 'all' ? 'on' : ''}" data-sbexf="all">${T('ทั้งหมด')}</button>
              <button type="button" class="${exFilter === 'ok' ? 'on' : ''}" data-sbexf="ok">✓ (${okCnt})</button>
              <button type="button" class="${exFilter === 'no' ? 'on' : ''}" data-sbexf="no">✗ (${noCnt})</button>
            </div>` : ''}
            ${exs.length >= 2 ? `<button type="button" class="btn sm" data-sbquiz="one">${icn('target')}${T('ทดสอบ ✓/✗')}</button>` : ''}
          </div>
        </div>
        <div class="sb-exlist">
          ${shownEx.map(ex => {
            const ok = ex.mark === '✓';
            return `<article class="sb-excard ${ok ? 'ok' : 'no'}">
              <div class="sb-exmk" aria-label="${ok ? 'ถูก' : 'ผิด'}">${ok ? '✓' : '✗'}</div>
              <div class="sb-exbody">
                <div class="sb-exzh-row">
                  <span class="sb-exzh" lang="zh-Hans">${esc(ex.zh)}</span>
                  ${ok ? `<button type="button" class="gx-say sm" data-sbsay="${esc(ex.zh)}" aria-label="${esc(T('ฟังเสียง'))}">${icn('vol')}</button>` : ''}
                </div>
                ${ex.py ? `<div class="pyx sb-expy">${esc(ex.py)}</div>` : ''}
                <div class="sb-extr">${esc(en ? (ex.en || ex.th) : (ex.th || ex.en))}</div>
                ${en && ex.th ? '' : (!en && ex.en ? `<div class="sb-extr-sub" lang="en">${esc(ex.en)}</div>` : '')}
                ${ex.note ? `<div class="sb-exnote">${esc(ex.note)}</div>` : ''}
              </div>
            </article>`;
          }).join('')}
        </div>
      </section>

      ${siblings.length ? `<section class="sb-sibs">
        <h3 class="sb-sec-k">${T('กลุ่มอื่นในหมวดเดียวกัน')} · ${esc(themeLabel(g.theme))}</h3>
        <div class="sb-sib-list">
          ${siblings.map(x => `<button type="button" class="sb-sib" data-sbopen="${x.id}">
            <span class="sb-badge">#${String(x.n).padStart(2, '0')}</span>
            <b lang="zh-Hans">${esc(x.title)}</b>
            ${icn('chev-r')}
          </button>`).join('')}
        </div>
      </section>` : ''}

      <div class="sb-navfoot">
        ${prev ? `<button type="button" class="sb-nf" data-sbopen="${prev.id}">${icn('chev-l')}<span><small>${T('บทก่อนหน้า')} #${String(prev.n).padStart(2, '0')}</small><b lang="zh-Hans">${esc(prev.title)}</b></span></button>` : '<span></span>'}
        ${next ? `<button type="button" class="sb-nf next" data-sbopen="${next.id}"><span><small>${T('บทถัดไป')} #${String(next.n).padStart(2, '0')}</small><b lang="zh-Hans">${esc(next.title)}</b></span>${icn('chev-r')}</button>` : ''}
      </div>
    </div>`;
  }

  /* ---------- DRAW & ROUTING ---------- */
  function draw() {
    const body = $('#bkBody');
    const arr = list();
    if (!arr) {
      body.innerHTML = `<p class="muted b5-loading">${T('กำลังโหลดเนื้อหา…')}</p>`;
      ensureData();
      return;
    }
    if (openId) {
      const resolved = resolveId(openId);
      if (resolved) openId = resolved; else openId = null;
    }
    const g = openId ? arr.find(x => x.id === openId) : null;
    const key = quiz ? 'Q:' + quiz.i + ':' + quiz.answered : (g ? 'D:' + g.id : 'H');
    const changed = key !== lastKey;
    lastKey = key;

    body.innerHTML = quiz ? renderQuiz() : (g ? renderDetail(arr, g) : renderHub(arr));
    $('#bkVol').textContent = quiz
      ? `VOL. 12 · Synonym · ${T('ทดสอบ ✓/✗')}`
      : g
        ? `VOL. 12 · Synonym · #${String(g.n).padStart(2, '0')}/45 · ${themeLabel(g.theme)}`
        : `VOL. 12 · Synonym · ${arr.length} ${T('กลุ่ม')}`;
    $('#bkToc').hidden = !g && !quiz;

    // Bind live search smoothly without re-rendering input focus away
    const qIn = $('#sbQ', body), qClr = $('#sbClr', body);
    if (qIn) {
      qIn.addEventListener('input', () => {
        curQ = qIn.value;
        if (qClr) qClr.hidden = !curQ;
        updateHubCards(arr);
      });
      if (qClr) qClr.onclick = () => { curQ = ''; qIn.value = ''; qClr.hidden = true; updateHubCards(arr); qIn.focus(); };
    }
    // Center active theme pill
    const onPill = $('.sb-tchip.on', body);
    if (onPill && onPill.parentNode) {
      const p = onPill.parentNode;
      if (p.scrollWidth > p.clientWidth) p.scrollLeft = Math.max(0, onPill.offsetLeft - (p.clientWidth - onPill.offsetWidth) / 2);
    }
    if (changed && !qIn) window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function updateHubCards(arr) {
    const body = $('#bkBody'), grid = $('#sbGrid', body), cnt = $('#sbCount', body);
    if (!grid) return;
    const en = isEn();
    const matched = arr.filter(g => matchGroup(g, curQ, curTheme));
    grid.innerHTML = matched.length ? matched.map(g => {
      const okN = (g.examples || []).filter(e => e.mark === '✓').length;
      const noN = (g.examples || []).filter(e => e.mark === '✗').length;
      const rule = en ? (g.rule_en || g.rule_th) : (g.rule_th || g.rule_en);
      return `<article class="sb-card" data-sbopen="${g.id}" tabindex="0" role="button">
        <div class="sb-card-top">
          <span class="sb-badge">#${String(g.n).padStart(2, '0')}</span>
          <span class="sb-theme-tag">${esc(themeLabel(g.theme))}</span>
          <span class="sb-excnt"><i class="ok">✓${okN}</i>${noN ? `<i class="no">✗${noN}</i>` : ''}</span>
        </div>
        <div class="sb-card-ws">${g.words.map(w => {
          const py = g.word_info && g.word_info[w] ? g.word_info[w].pinyin : '';
          return `<span class="sb-wmini"><b lang="zh-Hans">${esc(w)}</b>${py ? `<small class="pyx">${esc(py)}</small>` : ''}</span>`;
        }).join('')}</div>
        <p class="sb-card-rule">${esc(rule)}</p>
        <span class="sb-card-go">${en ? 'Compare & examples' : 'เทียบละเอียด & ตัวอย่าง'} ${icn('chev-r')}</span>
      </article>`;
    }).join('') : `<p class="sb-empty muted">${T('ไม่พบกลุ่มคำที่ค้นหา')}</p>`;
    if (cnt) {
      cnt.innerHTML = (curQ || curTheme !== 'all')
        ? `${T('พบ')} <b>${matched.length}</b> / ${arr.length} ${T('กลุ่ม')}`
        : `${arr.length} ${T('กลุ่ม')} · ${en ? 'Tap any card to open' : 'แตะการ์ดเพื่ออ่านเทียบเต็ม ๆ'}`;
    }
  }

  const openGroup = (id, swap) => {
    quiz = null;
    exFilter = 'all';
    openId = id;
    (swap ? Router.replace : Router.go).call(Router, '/book/synonym/' + id);
  };
  const toHub = () => {
    quiz = null;
    openId = null;
    Router.up('/book/synonym');
  };

  /* ---------- HOOK INTO BOOK READER ---------- */
  const show0 = Book.show, render0 = Book.render, go0 = Book.go, key0 = Book.key;
  Book.show = function (id) {
    if (id === ID) {
      const arg = Router.parse(location.hash).args[1] || null;
      openId = arg;
      quiz = null;
      exFilter = 'all';
      ensureData();
    } else {
      lastKey = null;
      quiz = null;
    }
    return show0.apply(this, arguments);
  };
  Book.render = function () {
    const r = render0.apply(this, arguments);
    const on = this.id === ID;
    $('#v-book').classList.toggle('sb-on', on);
    if (on) draw();
    return r;
  };
  Book.go = function () {
    if (this.id === ID) return;
    return go0.apply(this, arguments);
  };
  Book.key = function (e) {
    if (this.id === ID) {
      if (e.key === 'Escape' && (openId || quiz)) { toHub(); return; }
      const arr = list();
      if (openId && !quiz && arr) {
        const idx = arr.findIndex(x => x.id === openId);
        if (e.key === 'ArrowRight' && arr[idx + 1]) { sfx('flip'); openGroup(arr[idx + 1].id, true); return; }
        if (e.key === 'ArrowLeft' && arr[idx - 1]) { sfx('flip'); openGroup(arr[idx - 1].id, true); return; }
      }
      return;
    }
    return key0.apply(this, arguments);
  };

  /* smart header buttons: detail/quiz → hub → library */
  document.addEventListener('click', e => {
    if (Book.id !== ID) return;
    if (e.target.closest('#bkToc')) {
      e.stopImmediatePropagation();
      if (openId || quiz) toHub();
      return;
    }
    if (e.target.closest('#v-book .back-btn')) {
      if (quiz) { e.preventDefault(); e.stopImmediatePropagation(); sfx('tap'); quiz = null; draw(); }
      else if (openId) { e.preventDefault(); e.stopImmediatePropagation(); sfx('tap'); toHub(); }
    }
  }, true);

  $('#bkBody').addEventListener('click', e => {
    if (Book.id !== ID) return;
    const t = e.target.closest('[data-sbopen],[data-sbtheme],[data-sbback],[data-sbword],[data-sbsay],[data-sblang],[data-sbpy],[data-sbexf],[data-sbreset],[data-sbjumpth],[data-sbquiz],[data-sbqans],[data-sbqnext],[data-sbqexit],[data-sbqretry]');
    if (!t) return;
    const ds = t.dataset;
    const arr = list() || [];

    if (ds.sbsay) { e.stopPropagation(); if (typeof TTS !== 'undefined') TTS.speak(ds.sbsay); return; }
    if (ds.sbword) { e.stopPropagation(); openWord(ds.sbword); return; }
    if (ds.sblang) {
      sfx('tap'); S().sbLang = ds.sblang; try { Store.save(); } catch (err) {} draw(); return;
    }
    if (ds.sbpy != null) {
      if (typeof togglePinyin === 'function') togglePinyin();
      const on = S().showPinyin !== false;
      t.classList.toggle('off', !on);
      const u = t.querySelector('use'); if (u) u.setAttribute('href', on ? '#i-eye' : '#i-eye-off');
      return;
    }
    if (ds.sbtheme) {
      sfx('tap'); curTheme = ds.sbtheme; draw(); return;
    }
    if (ds.sbreset != null) {
      sfx('tap'); curQ = ''; curTheme = 'all'; draw(); return;
    }
    if (ds.sbjumpth) {
      sfx('tap'); curTheme = ds.sbjumpth; curQ = ''; toHub(); return;
    }
    if (ds.sbback != null) {
      sfx('tap'); toHub(); return;
    }
    if (ds.sbopen) {
      sfx('tap'); openGroup(ds.sbopen, !!openId && !quiz); return;
    }
    if (ds.sbexf) {
      sfx('tap'); exFilter = ds.sbexf; draw(); return;
    }
    if (ds.sbquiz) {
      if (ds.sbquiz === 'one' && openId) {
        const g = arr.find(x => x.id === openId);
        if (g) startQuiz([g], `#${g.n} ${g.title}`);
      } else {
        const pool = arr.filter(g => matchGroup(g, curQ, curTheme));
        startQuiz(pool.length ? pool : arr, curTheme === 'all' ? `${T('ทั้งหมด')} (${arr.length} ${T('กลุ่ม')})` : themeLabel(curTheme));
      }
      return;
    }
    if (ds.sbqans != null && quiz && !quiz.answered) {
      const picked = ds.sbqans === '1';
      quiz.answered = true;
      quiz.picked = picked;
      const right = picked === quiz.items[quiz.i].ok;
      if (right) { quiz.score++; sfx('ok'); } else sfx('bad');
      draw();
      return;
    }
    if (ds.sbqnext != null && quiz) {
      sfx('tap'); quiz.i++; quiz.answered = false; quiz.picked = null; draw(); return;
    }
    if (ds.sbqretry != null && quiz) {
      const groups = [...new Set(quiz.items.map(x => x.g))];
      startQuiz(groups, quiz.label);
      return;
    }
    if (ds.sbqexit != null) {
      sfx('tap'); quiz = null; draw(); return;
    }
  });

  // Keyboard accessibility for cards
  $('#bkBody').addEventListener('keydown', e => {
    if (Book.id !== ID) return;
    if (e.key === 'Enter' || e.key === ' ') {
      const c = e.target.closest('.sb-card[data-sbopen]');
      if (c) { e.preventDefault(); sfx('tap'); openGroup(c.dataset.sbopen, false); }
    }
  });
})();
