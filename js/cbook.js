'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — VOL 14 新HSK教程 (Interactive Course Book)
   Routes:
     #/book/course              → Overview shelf (defaults to HSK 3)
     #/book/course/<lv>         → Book TOC (e.g. #/book/course/3)
     #/book/course/<lv>/<n>     → Interactive Lesson (e.g. #/book/course/3/1)
   Hooks into SHELF, BOOK_META, Book, Dict.detail (5-lang Sheet),
   playGame (Flashcards / 听写 / Mini-games), and Grammar Book (#/book/grammar/<id>).
   ===================================================================== */
(function cbook() {
  const ID = 'course';
  const SAVE_KEY = 'offy.course.v1';

  const BOOKS_CATALOG = [
    { key: 'hsk1',  lv: '1',  title: 'HSK 1',  sub: '15 บท',  zh: '新HSK教程 1',  en: 'New HSK Course 1',  color: '#1e7ca6', lessons: 15, audio: 'ครบ 15 บท (ในเครื่อง)', src: null },
    { key: 'hsk2',  lv: '2',  title: 'HSK 2',  sub: '15 บท',  zh: '新HSK教程 2',  en: 'New HSK Course 2',  color: '#c98212', lessons: 15, audio: 'ครบ 15 บท (ในเครื่อง)', src: null },
    { key: 'hsk3',  lv: '3',  title: 'HSK 3',  sub: '18 บท',  zh: '新HSK教程 3',  en: 'New HSK Course 3',  color: '#e6511e', lessons: 18, audio: 'ครบ 18 บท · 144 ไฟล์',  src: 'data/course/hsk3.js?v=1.0.0' },
    { key: 'hsk4a', lv: '4a', title: 'HSK 4上', sub: '10 บท',  zh: '新HSK教程 4上', en: 'New HSK Course 4A', color: '#1f5fa8', lessons: 10, audio: 'ครบ บท 1–10 · 80 ไฟล์', src: null },
    { key: 'hsk4b', lv: '4b', title: 'HSK 4下', sub: '10 บท',  zh: '新HSK教程 4下', en: 'New HSK Course 4B', color: '#23804e', lessons: 10, audio: 'ครบ บท 11–20 · 80 ไฟล์', src: null }
  ];

  const byLv = lv => BOOKS_CATALOG.find(b => b.lv === String(lv || '').toLowerCase()) || BOOKS_CATALOG[2];
  const packData = key => window.OFFY_COURSE && window.OFFY_COURSE[key];
  const packLoading = {};

  /* Show VOL. 14 only on local / private network hosts (course text & audio stay local, excluded from public GitHub) */
  const isLocalHost = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|::1|192\.168\.|10\.|100\.)/.test(location.hostname);
  if (!isLocalHost) return;

  /* Register VOL. 14 on Library Shelf & BOOK_META */
  if (typeof SHELF !== 'undefined' && !SHELF.some(b => b.id === ID)) {
    SHELF.push({ id: ID, tag: 'Course 3.0', hz: '新HSK教程', th: 'หนังสือเรียน HSK 3.0', vol: '14', c: 'orange' });
  }
  if (typeof BOOK_META !== 'undefined') {
    BOOK_META[ID] = {
      vol: 'VOL. 14 · Course 3.0',
      title: '新HSK教程 หนังสือเรียน HSK 3.0',
      toc: 0,
      pages: () => ['<div class="cb" id="cbRoot"></div>'],
      labels: ['1']
    };
  }

  /* ---------- Persistent Reader Preferences & Self-Check Progress (in Store.d.course for Backup & Cloud Sync!) ---------- */
  let _migratedOld = false;
  function cStore() {
    if (typeof Store === 'undefined' || !Store.d) return { py: true, tr: 'both', listen: false, hlNw: true, prog: {} };
    let c = Store.d.course;
    if (!c || typeof c !== 'object') c = Store.d.course = {};
    if (!_migratedOld) {
      _migratedOld = true;
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          const old = JSON.parse(raw);
          if (old && typeof old === 'object') {
            if (c.py == null && old.py != null) c.py = old.py;
            if (!c.tr && old.tr) c.tr = old.tr;
            if (c.listen == null && old.listen != null) c.listen = old.listen;
            if (c.hlNw == null && old.hlNw != null) c.hlNw = old.hlNw;
            if (old.prog && typeof old.prog === 'object') {
              c.prog = c.prog || {};
              Object.entries(old.prog).forEach(([k, v]) => { if (!c.prog[k]) c.prog[k] = v; });
            }
            Store.save();
          }
          localStorage.removeItem(SAVE_KEY);
        }
      } catch (e) {}
    }
    if (c.py == null) c.py = true;
    if (!c.tr) c.tr = 'both';          // 'th' | 'both' | 'en' | 'off'
    if (c.listen == null) c.listen = false;
    if (c.hlNw == null) c.hlNw = true;
    if (!c.prog || typeof c.prog !== 'object') c.prog = {};
    return c;
  }
  const saveState = () => { if (typeof Store !== 'undefined' && Store.d) Store.save(); };
  const progOf = key => {
    const c = cStore();
    return (c.prog[key] || (c.prog[key] = { obj: {}, u: {}, a: {}, note: '', t: 0 }));
  };

  /* ---------- Route State ---------- */
  let curLv = '3', curLesson = null;

  function parseCourseRoute() {
    const { name, args } = Router.parse(location.hash);
    if (name !== 'book' || args[0] !== ID) return;
    curLv = args[1] ? String(args[1]).toLowerCase() : '3';
    if (!BOOKS_CATALOG.some(b => b.lv === curLv)) curLv = '3';
    curLesson = args[2] ? +args[2] : null;
  }

  function ensurePack(cat) {
    if (!cat || !cat.src) return Promise.resolve(null);
    if (packData(cat.key)) return Promise.resolve(packData(cat.key));
    if (packLoading[cat.key]) return packLoading[cat.key];
    packLoading[cat.key] = Fx.script(cat.src)
      .then(() => { packLoading[cat.key] = null; return packData(cat.key); })
      .catch(() => { packLoading[cat.key] = null; return null; });
    return packLoading[cat.key];
  }

  /* ---------- Single Active HTML5 Audio Engine ---------- */
  const aud = new Audio();
  let audBar = null, audSrc = null, audSpeed = 1, audLoop = false;
  const fmtSec = s => {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return `${m}:${r < 10 ? '0' : ''}${r}`;
  };
  function syncAudioUI() {
    if (!audBar || !audBar.isConnected) return;
    const playBtn = audBar.querySelector('[data-cba-play]');
    if (playBtn) {
      const u = playBtn.querySelector('use');
      if (u) u.setAttribute('href', aud.paused ? '#i-play' : '#i-pause');
    }
    const seek = audBar.querySelector('[data-cba-seek]');
    const tm = audBar.querySelector('[data-cba-time]');
    if (seek && isFinite(aud.duration) && aud.duration > 0) {
      seek.value = String(Math.round((aud.currentTime / aud.duration) * 1000));
    }
    if (tm) tm.textContent = `${fmtSec(aud.currentTime)} / ${fmtSec(aud.duration)}`;
  }
  function stopAudio() {
    aud.pause();
    if (audBar) { syncAudioUI(); audBar = null; }
    audSrc = null;
  }
  aud.addEventListener('timeupdate', syncAudioUI);
  aud.addEventListener('loadedmetadata', syncAudioUI);
  aud.addEventListener('ended', () => {
    if (audLoop) { aud.currentTime = 0; aud.play().catch(() => {}); }
    else syncAudioUI();
  });
  aud.addEventListener('error', () => {
    if (audBar) toast('ไม่พบไฟล์เสียงสำหรับแทร็กนี้', { icon: 'info' });
    syncAudioUI();
  });

  function renderAudioBar(src, label, compact) {
    return `<div class="cb-aud${compact ? ' compact' : ''}" data-cba-src="${esc(src)}">
      <button type="button" class="cb-aud-play" data-cba-play aria-label="เล่น/หยุดเสียง">${ic('play')}</button>
      <span class="cb-aud-tag">${ic('vol')} ${esc(label)}</span>
      <input type="range" class="cb-aud-seek" data-cba-seek min="0" max="1000" value="0" aria-label="ตำแหน่งเสียง">
      <span class="cb-aud-time" data-cba-time>0:00 / 0:00</span>
      <button type="button" class="cb-aud-btn" data-cba-spd title="ปรับความเร็วเสียง">1x</button>
      <button type="button" class="cb-aud-btn" data-cba-loop title="วนซ้ำ">↻</button>
    </div>`;
  }

  /* ---------- Word Index & Longest-Match Tokenizer (Tappable 5-Lang Words) ---------- */
  let _baseDict = null, _baseHasFive = false;
  function getBaseDict() {
    const hasFive = typeof FIVE !== 'undefined' && FIVE.D && Array.isArray(FIVE.D.words) && FIVE.D.words.length > 0;
    if (_baseDict && _baseHasFive === hasFive) return _baseDict;
    const map = new Map();
    // 1) App WORDS (2,200+ words)
    if (typeof WORDS !== 'undefined') {
      WORDS.forEach(w => { if (w && w.zh && !map.has(w.zh)) map.set(w.zh, { app: w.id, lvl: w.lvl }); });
    }
    // 2) Prioritize 5-language OFFY_DATA entries
    if (hasFive) {
      FIVE.D.words.forEach(f => {
        if (f && f.zh && f.app) map.set(f.zh, { app: f.app, lvl: f.lvl, f5: true });
      });
    }
    _baseDict = map;
    _baseHasFive = hasFive;
    return map;
  }

  function buildLessonMatcher(book, lesson) {
    const base = getBaseDict();
    const nwMap = new Map();
    (lesson.sections || []).forEach(sec => {
      if (sec.type === 'text' && sec.newWords) {
        sec.newWords.forEach(nw => nwMap.set(nw.zh, nw));
      }
    });
    const extra = book.extraWords || {};
    const castByZh = {};
    Object.values(book.cast || {}).forEach(c => { castByZh[c.zh] = c; });
    const aliases = { '同乐': book.cast && book.cast.ytl, '家月': book.cast && book.cast.bjy, '一雪姐': book.cast && book.cast.wyx };

    const lookup = zh => {
      if (nwMap.has(zh)) { const nw = nwMap.get(zh); return { kind: 'nw', zh, app: nw.app || (base.get(zh) && base.get(zh).app) || null, nw }; }
      if (extra[zh]) return { kind: 'extra', zh, extra: extra[zh] };
      if (castByZh[zh]) return { kind: 'cast', zh, cast: castByZh[zh] };
      if (aliases[zh]) return { kind: 'cast', zh, cast: aliases[zh] };
      if (base.has(zh)) return { kind: 'dict', zh, app: base.get(zh).app };
      return null;
    };

    const tokenize = text => {
      const chars = Array.from(String(text || ''));
      let out = '', i = 0;
      while (i < chars.length) {
        const ch = chars[i];
        if (!/[\u4e00-\u9fff]/.test(ch)) { out += esc(ch); i++; continue; }
        let hit = null, hitLen = 1;
        for (let len = Math.min(5, chars.length - i); len >= 1; len--) {
          const sub = chars.slice(i, i + len).join('');
          const m = lookup(sub);
          if (m) { hit = m; hitLen = len; break; }
        }
        if (hit) {
          const cls = hit.kind === 'nw' ? 'cb-tok is-nw' : 'cb-tok';
          const appAttr = hit.app ? ` data-cbapp="${esc(hit.app)}"` : '';
          out += `<span class="${cls}" data-cbw="${esc(hit.zh)}"${appAttr} role="button" tabindex="0">${esc(hit.zh)}</span>`;
          i += hitLen;
        } else {
          out += esc(ch);
          i++;
        }
      }
      return out;
    };
    return { tokenize, lookup, nwMap };
  }

  const getWord = id => (id && typeof BY_ID !== 'undefined' && BY_ID ? (typeof BY_ID.get === 'function' ? BY_ID.get(id) : BY_ID[id]) : null);

  /* Open In-Place 5-Language Sheet Popup without leaving the Lesson! */
  function openWordSheet(zh, appId, book) {
    // 1) Try full 5-language Dict.detail(appId) inside Sheet
    let targetId = appId;
    if (!targetId) {
      const hit = getBaseDict().get(zh);
      if (hit && hit.app) targetId = hit.app;
    }
    if (targetId && getWord(targetId) && typeof Dict !== 'undefined' && Dict.detail) {
      sfx('tap');
      Dict.detail(targetId);
      return;
    }
    // 2) Fallback: rich 5-language inline sheet for extraWords (e.g. 服务台, 行李箱) or Cast character
    const ex = book && book.extraWords && book.extraWords[zh];
    if (ex) {
      sfx('tap');
      const partsHtml = (ex.parts || []).map(p => {
        const b = getBaseDict().get(p);
        return b && b.app ? `<button type="button" class="chip" data-cbopen-part="${esc(b.app)}" lang="zh-Hans">${esc(p)} ▸</button>` : `<span class="chip">${esc(p)}</span>`;
      }).join('');
      const body = `
        <div class="cb-exsheet-head">
          <div>
            <div class="cb-exsheet-zh hz" lang="zh-Hans">${esc(ex.zh)}</div>
            <div class="cb-exsheet-py">${esc(ex.py)} <span class="cb-nw-pos">${esc(ex.pos)}</span> <span class="cb-nw-pos">HSK ${ex.lvl} · ${esc(ex.tag || 'เสริม')}</span></div>
          </div>
          <button type="button" class="ibtn" data-cb-say="${esc(ex.zh)}" aria-label="ฟังเสียง">${ic('vol')}</button>
        </div>
        <div class="cb-exsheet-grid">
          <div class="cb-exsheet-row"><b>TH</b><div>${esc(ex.th)}</div></div>
          <div class="cb-exsheet-row"><b>EN</b><div>${esc(ex.en)}</div></div>
          <div class="cb-exsheet-row"><b>中文</b><div lang="zh-Hans">${esc(ex.zhDef)}</div></div>
          <div class="cb-exsheet-row"><b>VI</b><div>${esc(ex.vi)}</div></div>
          <div class="cb-exsheet-row"><b>JA</b><div lang="ja">${esc(ex.ja)}</div></div>
        </div>
        ${ex.ex ? `<div class="ex-card"><div><div class="expy pyx">${esc(ex.ex.py)}</div><div class="exzh" lang="zh-Hans">${esc(ex.ex.zh)}</div><div class="lang-th">${esc(ex.ex.th)}</div></div><button type="button" class="ibtn sm" data-cb-say="${esc(ex.ex.zh)}" aria-label="ฟังประโยค">${ic('vol')}</button></div>` : ''}
        ${partsHtml ? `<div style="margin-top:12px"><small class="muted" style="display:block;margin-bottom:6px">เปิดคำประกอบในคลัง 5 ภาษา:</small><div style="display:flex;gap:6px;flex-wrap:wrap">${partsHtml}</div></div>` : ''}
      `;
      const foot = `<button type="button" class="btn primary" data-cb-close>ปิด</button>`;
      Sheet.open(body, foot);
      $('#sheetBody').onclick = e => {
        const s = e.target.closest('[data-cb-say]'); if (s) { TTS.speak(s.dataset.cbSay); return; }
        const p = e.target.closest('[data-cbopen-part]'); if (p && typeof Dict !== 'undefined') { Dict.detail(p.dataset.cbopenPart); }
      };
      $('#sheetFoot').onclick = e => { if (e.target.closest('[data-cb-close]')) Sheet.close(); };
      return;
    }
    const cast = Object.values((book && book.cast) || {}).find(c => c.zh === zh || c.zh.includes(zh));
    if (cast) {
      sfx('tap');
      const body = `
        <div class="cb-exsheet-head">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="cb-ava" style="background:${cast.bg};width:52px;height:52px;font-size:22px;border-color:${cast.bg}">${esc(cast.ch)}</div>
            <div>
              <div class="cb-exsheet-zh hz" style="font-size:28px" lang="zh-Hans">${esc(cast.zh)}</div>
              <div class="cb-exsheet-py">${esc(cast.py)}</div>
            </div>
          </div>
          <button type="button" class="ibtn" data-cb-say="${esc(cast.zh)}" aria-label="ฟังเสียง">${ic('vol')}</button>
        </div>
        <div class="cb-exsheet-grid">
          <div class="cb-exsheet-row"><b>ตัวละคร</b><div><b>${esc(cast.th)}</b> (${esc(cast.en)})<br><span class="muted">${esc(cast.role)}</span></div></div>
        </div>`;
      Sheet.open(body, `<button type="button" class="btn primary" data-cb-close>ปิด</button>`);
      $('#sheetBody').onclick = e => { const s = e.target.closest('[data-cb-say]'); if (s) TTS.speak(s.dataset.cbSay); };
      $('#sheetFoot').onclick = e => { if (e.target.closest('[data-cb-close]')) Sheet.close(); };
      return;
    }
    // 3) Generic TTS fallback
    TTS.speak(zh);
    toast(`อ่านออกเสียง: ${zh}`, { icon: 'vol', ms: 1400 });
  }

  /* Collect all app WORDS objects for a lesson to send to Flashcards / Dictation / Games */
  function getLessonWords(lesson) {
    const out = [], seen = new Set();
    (lesson.sections || []).forEach(sec => {
      if (sec.type !== 'text' || !sec.newWords) return;
      sec.newWords.forEach(nw => {
        const id = nw.app || (getBaseDict().get(nw.zh) && getBaseDict().get(nw.zh).app);
        const w = getWord(id);
        if (w && !seen.has(id)) {
          seen.add(id);
          out.push(w);
        }
      });
    });
    return out;
  }

  /* ---------- Render: Overview Shelf & TOC ---------- */
  function renderOverview(cat, book) {
    const tabs = BOOKS_CATALOG.map(b => `
      <button type="button" class="cb-lvtab${b.lv === cat.lv ? ' on' : ''}" style="--lc:${b.color}" data-cblv="${b.lv}">
        <b>${esc(b.title)}</b><small>${esc(b.sub)}</small>
      </button>`).join('');

    if (!book) {
      return `<div class="cb" style="--cb:${cat.color}">
        <nav class="cb-lvbar" aria-label="เลือกระดับหนังสือเรียน">${tabs}</nav>
        <div class="cb-ov-hero">
          <span class="cb-ov-badge">${esc(cat.title)} · หนังสือเรียน HSK 3.0</span>
          <h2><span class="hz" lang="zh-Hans">${esc(cat.zh)}</span></h2>
          <p>${esc(cat.en)} · สำนักพิมพ์ FLTRP (2026)</p>
          <div class="cb-ov-stats">
            <span class="cb-stat-pill">${ic('books')} <b>${cat.lessons}</b> บทเรียน</span>
            <span class="cb-stat-pill">${ic('ear')} เสียงแท้: <b>${esc(cat.audio)}</b></span>
            <span class="cb-stat-pill">${ic('pin')} สถานะ: รอยืนยันขยายต่อหลังดูต้นแบบ HSK 3</span>
          </div>
        </div>
        <div class="cb-card" style="text-align:center;padding:28px 18px">
          <p style="margin:0 0 12px;font-size:15px">ตอนนี้ทำ <b>ต้นแบบเต็มระบบ (เฟส 3)</b> ไว้ที่ <b>HSK 3 บทที่ 1</b> พร้อมเสียงจริงครบ 8 แทร็กครับ</p>
          <button type="button" class="btn primary" data-cbgo-l="3:1">${ic('play')} เปิดดูต้นแบบ HSK 3 บทที่ 1 เลย</button>
        </div>
      </div>`;
    }

    const readyCount = book.toc.filter(x => x.ready).length;
    const st = cStore();
    const cards = book.toc.map(item => {
      const pKey = `${book.id}:L${item.n}`;
      const pr = st.prog[pKey];
      const doneU = pr ? Object.values(pr.u || {}).filter(Boolean).length : 0;
      const doneA = pr ? Object.values(pr.a || {}).filter(Boolean).length : 0;
      return `<button type="button" class="cb-toc-card ${item.ready ? 'ready' : 'soon'}" ${item.ready ? `data-cbgo-l="${cat.lv}:${item.n}"` : 'data-cbsoon="1"'}>
        <div class="cb-toc-top">
          <span class="cb-toc-no">${item.n}</span>
          <div class="cb-toc-titles">
            <span class="cb-toc-zh hz" lang="zh-Hans">${esc(item.zh)}</span>
            <span class="cb-toc-th">${esc(item.th)}</span>
            <span class="cb-toc-en">${esc(item.en)}</span>
          </div>
        </div>
        <div class="cb-toc-gps">${item.gp.map(g => `<span class="cb-toc-gp" lang="zh-Hans">${esc(g)}</span>`).join('')}</div>
        <div class="cb-toc-foot">
          <span>หน้า ${esc(item.page)}</span>
          ${item.ready
            ? `<span class="cb-ready-tag">${ic('play')} พร้อมเรียน · 8 เสียงจริง${(doneU || doneA) ? ` · ✓ ${doneU}/${doneA}` : ''}</span>`
            : `<span>ต้นแบบ — รอยืนยันแกะต่อ</span>`}
        </div>
      </button>`;
    }).join('');

    return `<div class="cb" style="--cb:${book.accent}">
      <nav class="cb-lvbar" aria-label="เลือกระดับหนังสือเรียน">${tabs}</nav>
      <div class="cb-ov-hero">
        <div class="cb-ov-top">
          <div>
            <span class="cb-ov-badge">HSK 3 · ต้นแบบเฟส 3</span>
            <h2><span class="hz" lang="zh-Hans">${esc(book.titleZh)}</span> · ${esc(book.titleEn)}</h2>
            <p>${esc(book.publisher)} — โครงสร้างตรงหนังสือจริง + เสียงแท้ + เชื่อมดิก 5 ภาษา & Grammar Book</p>
          </div>
          <button type="button" class="btn primary" data-cbgo-l="${cat.lv}:1">${ic('play')} เปิดบทที่ 1 (พร้อมเสียงจริง)</button>
        </div>
        <div class="cb-ov-stats">
          <span class="cb-stat-pill">${ic('books')} ทั้งเล่ม <b>${book.totalLessons}</b> บท</span>
          <span class="cb-stat-pill">${ic('check')} ต้นแบบพร้อมเรียน <b>${readyCount}</b> บท</span>
          <span class="cb-stat-pill">${ic('ear')} เสียงแท้ FLTRP <b>${book.audioTracks}</b> แทร็ก</span>
          <span class="cb-stat-pill">${ic('link')} เชื่อมศัพท์ 5 ภาษา + Grammar Book</span>
        </div>
      </div>
      <div class="cb-toc-head">
        <h3>${ic('book')} สารบัญ <span class="hz" lang="zh-Hans">目录</span> (${book.totalLessons} บท)</h3>
        <span class="muted" style="font-size:12.5px">แตะบทที่ 1 เพื่อทดลองเรียนเต็มระบบ</span>
      </div>
      <div class="cb-toc-grid">${cards}</div>
    </div>`;
  }

  /* ---------- Render: Full Interactive Textbook Lesson ---------- */
  function trLabel(mode) {
    return { both: 'แปล: ไทย+EN', th: 'แปล: ไทย', en: 'แปล: EN', off: 'แปล: ซ่อน' }[mode] || 'แปล: ไทย+EN';
  }

  function renderLesson(cat, book, lesson) {
    const st = cStore();
    const matcher = buildLessonMatcher(book, lesson);
    const pKey = `${book.id}:L${lesson.n}`;
    const pr = progOf(pKey);
    const lWords = getLessonWords(lesson);
    const rootCls = `cb${st.py ? '' : ' no-py'}${st.listen ? ' listen-only' : ''}${st.hlNw ? ' hl-nw' : ''}`;

    const sectionsHtml = lesson.sections.map((sec, si) => {
      if (sec.type === 'text') return renderTextSection(sec, si, book, matcher);
      if (sec.type === 'grammar') return renderGrammarSection(sec, si, matcher);
      return '';
    }).join('');

    return `<div class="${rootCls}" id="cbLesson" data-tr="${esc(st.tr)}" style="--cb:${book.accent}">
      <!-- Sticky Reader Control Bar -->
      <div class="cb-bar" role="toolbar" aria-label="เครื่องมือการอ่านบทเรียน">
        <button type="button" class="cb-bar-back" data-cb-toc="${cat.lv}">${ic('chev-l')} สารบัญ</button>
        <button type="button" class="cb-ctrl${st.py ? ' on' : ''}" data-cb-toggle="py">${ic(st.py ? 'eye' : 'eye-off')} พินอิน</button>
        <button type="button" class="cb-ctrl${st.tr !== 'off' ? ' on' : ''}" data-cb-toggle="tr">${esc(trLabel(st.tr))}</button>
        <button type="button" class="cb-ctrl${st.listen ? ' on' : ''}" data-cb-toggle="listen">${ic('ear')} ฝึกฟังเปล่า</button>
        <button type="button" class="cb-ctrl${st.hlNw ? ' on' : ''}" data-cb-toggle="hlNw">${ic('sparkle')} ไฮไลต์คำใหม่</button>
        <button type="button" class="cb-ctrl cb-ctrl-cta" data-cb-practice="flash">${ic('play')} ฝึกศัพท์บทนี้ (${lWords.length} คำ)</button>
      </div>

      <!-- Textbook p.001 Hero + Objectives -->
      <header class="cb-hero">
        <div class="cb-hero-banner">
          <div class="cb-hero-numbox">
            <small>Lesson</small>
            <b>${lesson.n}</b>
          </div>
          <div class="cb-hero-titles">
            <div class="cb-hero-py">${esc(lesson.titlePy)}</div>
            <h2 class="cb-hero-zh hz" lang="zh-Hans">${matcher.tokenize(lesson.titleZh)}</h2>
            <div class="cb-hero-sub">
              <span class="cb-tr-th">${esc(lesson.titleTh)}</span>
              <span class="cb-tr-en cb-en">${esc(lesson.titleEn)}</span>
            </div>
          </div>
          <span class="cb-hero-page">p.${esc(lesson.pageRange)}</span>
        </div>
        <div class="cb-obj">
          <h3 class="cb-obj-h">${ic('target')} <span class="hz" lang="zh-Hans">目标</span> Objectives · เป้าหมายของบทนี้</h3>
          <ul class="cb-obj-list">
            ${lesson.objectives.map(o => `<li class="cb-obj-item">
              <input type="checkbox" data-cb-obj="${esc(o.id)}" ${pr.obj && pr.obj[o.id] ? 'checked' : ''} aria-label="${esc(o.zh)}">
              <div>
                <span class="cb-obj-zh hz" lang="zh-Hans">${esc(o.zh)}</span>
                <span class="cb-obj-th">${esc(o.th)}</span>
                <span class="cb-obj-en">${esc(o.en)}</span>
              </div>
            </li>`).join('')}
          </ul>
        </div>
      </header>

      <!-- 热身 Warm-Up -->
      ${renderWarmUp(lesson.warmup, matcher)}

      <!-- 课文 1–4 + 小语讲堂 1–3 (Exact page-by-page textbook flow!) -->
      ${sectionsHtml}

      <!-- 综合练习 Comprehensive Exercises -->
      ${renderExercises(lesson.exercises, matcher)}

      <!-- 课堂活动 Classroom Activity -->
      ${renderActivity(lesson.activity, matcher)}

      <!-- 学习小结 Self-Check (理解 / 会用) + Practice Dock -->
      ${renderSelfCheck(lesson, pr, lWords)}
    </div>`;
  }

  function renderWarmUp(wu, matcher) {
    if (!wu) return '';
    const m = wu.match;
    const optsHtml = `<option value="">-- เลือกคำ (A–F) --</option>` + m.words.map(w => `<option value="${w.k}">${w.k}. ${w.zh} (${w.py})</option>`).join('');
    return `<section class="cb-sec" id="cb-warmup">
      <div class="cb-ribbon">
        <span class="cb-rib-zh hz" lang="zh-Hans">热身</span>
        <span class="cb-rib-en">Warm-Up · อุ่นเครื่อง</span>
        <span class="cb-rib-pg">p.${esc(wu.page)}</span>
      </div>
      <div class="cb-card">
        <h4 class="cb-subh"><span class="cb-sq">1</span> <span class="hz" lang="zh-Hans">${esc(m.promptZh)}</span> <small>${esc(m.promptTh)}</small></h4>
        <div class="cb-wu-bank">
          ${m.words.map(w => `<button type="button" class="cb-wu-chip" data-cbw="${esc(w.zh)}" ${w.app ? `data-cbapp="${esc(w.app)}"` : ''}>
            <b>${w.k}</b><span class="hz" lang="zh-Hans">${esc(w.zh)}</span><span class="pyx">${esc(w.py)}</span>
          </button>`).join('')}
        </div>
        <div class="cb-wu-grid" data-cb-wugroup>
          ${m.cards.map(c => `<div class="cb-wu-pic" data-wu-ans="${c.ans}">
            <div class="cb-wu-ico">${c.icon}</div>
            <div class="cb-wu-desc">${esc(c.labelTh)}<small>${esc(c.labelEn)}</small></div>
            <select class="cb-wu-sel" aria-label="เลือกคำให้ตรงกับภาพที่ ${c.id}">${optsHtml}</select>
          </div>`).join('')}
        </div>
        <div class="cb-actions-row">
          <button type="button" class="btn primary" data-cb-wucheck>${ic('check')} ตรวจคำตอบ Warm-Up</button>
          <button type="button" class="btn" data-cb-wureset>เริ่มใหม่</button>
          <span class="cb-score-badge" data-cb-wuscore></span>
        </div>
      </div>

      <div class="cb-card">
        <h4 class="cb-subh"><span class="cb-sq">2</span> <span class="hz" lang="zh-Hans">${esc(wu.discuss.promptZh)}</span> <small>${esc(wu.discuss.promptTh)}</small></h4>
        <div class="cb-disc-list">
          ${wu.discuss.items.map((it, idx) => `<div class="cb-disc-item">
            <span class="cb-disc-zh hz" lang="zh-Hans">(${idx + 1}) ${matcher.tokenize(it.zh)}</span>
            <div class="cb-bub-py" style="margin-top:2px">${esc(it.py)}</div>
            <span class="cb-disc-th">${esc(it.th)}</span>
            <span class="cb-disc-en">${esc(it.en)}</span>
            <button type="button" class="cb-reveal-btn" data-cb-reveal="wu-d-${idx}">${ic('bulb')} ดูแนวทางการตอบ</button>
            <div class="cb-sample-box" id="wu-d-${idx}" hidden>
              <div class="hz" lang="zh-Hans">${matcher.tokenize(it.sampleZh)}</div>
              <div class="muted" style="font-size:12.5px;margin-top:3px">${esc(it.sampleTh)}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </section>`;
  }

  function renderNewWordsBox(sec, wide) {
    return `<aside class="cb-nw-card${wide ? ' wide' : ''}">
      <div class="cb-nw-head">
        <div class="cb-nw-title"><span class="hz" lang="zh-Hans">生词</span> <small>New Words</small></div>
        ${renderAudioBar(sec.vocabAudio, sec.vocabAudioLabel, true)}
      </div>
      <ul class="cb-nw-list">
        ${sec.newWords.map(nw => `<li class="cb-nw-row" data-cbw="${esc(nw.zh)}" ${nw.app ? `data-cbapp="${esc(nw.app)}"` : ''} role="button" tabindex="0" title="แตะเพื่อเปิดพจนานุกรม 5 ภาษา">
          <span class="cb-nw-no">${nw.num}</span>
          <span class="cb-nw-zh hz" lang="zh-Hans">${nw.star ? `<span class="cb-nw-star" title="คำเสริมนอกหลักสูตร">${ic('star')}</span>` : ''}${esc(nw.zh)}</span>
          <div class="cb-nw-meta">
            <span class="cb-nw-py">${esc(nw.py)}</span><span class="cb-nw-pos">${esc(nw.pos)}</span>
            <span class="cb-nw-gl">${esc(nw.th)}<small>${esc(nw.en)}</small></span>
          </div>
          <span class="cb-nw-go">5 ภาษา ▸</span>
        </li>`).join('')}
      </ul>
    </aside>`;
  }

  function renderTextSection(sec, si, book, matcher) {
    const isDiary = sec.kind === 'narrative';
    const mcqHtml = (sec.mcq || []).map((q, qi) => {
      const letters = ['A', 'B', 'C', 'D'];
      return `<div class="cb-mcq-q" data-mcq-ans="${q.ans}">
        <div class="cb-mcq-qt"><span class="hz" lang="zh-Hans">(${qi + 1}) ${esc(q.qZh)}</span><small>${esc(q.qTh)}</small></div>
        <div class="cb-mcq-opts">
          ${q.opts.map((opt, oi) => `<button type="button" class="cb-mcq-opt" data-cb-mcq="${oi}"><b>${letters[oi]}</b> <span class="hz" lang="zh-Hans">${esc(opt)}</span></button>`).join('')}
        </div>
        <div class="cb-mcq-why" hidden>✓ ${esc(q.whyTh)}</div>
      </div>`;
    }).join('');

    let bodyHtml = '';
    if (isDiary) {
      const sentencesHtml = sec.lines.map((ln, li) => `
        <div class="cb-diary-s" data-cb-peek>
          <span class="cb-peek-hint">${ic('ear')} แตะเพื่อเปิดดูประโยคที่ ${li + 1}</span>
          <div class="cb-bub-top">
            <div class="cb-bub-body">
              <div class="cb-bub-py">${esc(ln.py)}</div>
              <div class="cb-bub-zh hz" lang="zh-Hans">${matcher.tokenize(ln.zh)}</div>
              <div class="cb-bub-tr">
                <span class="cb-tr-th">${esc(ln.th)}</span>
                <span class="cb-tr-en">${esc(ln.en)}</span>
              </div>
            </div>
            <button type="button" class="cb-say-line" data-cb-sayline="${esc(ln.zh)}" title="อ่านออกเสียงประโยคนี้">${ic('vol')}</button>
          </div>
        </div>`).join('');
      bodyHtml = `<div class="cb-stage full">
        <div>
          <div class="cb-diary">${sentencesHtml}</div>
          ${renderNewWordsBox(sec, true)}
        </div>
      </div>`;
    } else {
      const turnsHtml = sec.lines.map((ln, li) => {
        const sp = (book.cast && book.cast[ln.sp]) || { zh: ln.sp || '', bg: '#666', ch: '?' };
        const tipHtml = ln.tip ? `<div class="cb-tip-wrap">
          <button type="button" class="cb-tip-btn" data-cb-reveal="tip-${si}-${li}">${ic('bulb')} 小语助力 · ${esc(ln.tip.zh)}</button>
          <div class="cb-tip-box" id="tip-${si}-${li}" hidden>${esc(ln.tip.th)}</div>
        </div>` : '';
        return `<div class="cb-turn">
          <div class="cb-ava-col">
            <div class="cb-ava" style="background:${sp.bg}" data-cbw="${esc(sp.zh)}" role="button" tabindex="0" title="${esc(sp.th)} (${esc(sp.role)})">${esc(sp.ch)}</div>
            <span class="cb-ava-name hz" lang="zh-Hans">${esc(sp.zh)}</span>
          </div>
          <div class="cb-bub" data-cb-peek>
            <span class="cb-peek-hint">${ic('ear')} โหมดฝึกฟัง — แตะเพื่อเปิดดูบรรทัดนี้</span>
            <div class="cb-bub-top">
              <div class="cb-bub-body">
                <div class="cb-bub-py">${esc(ln.py)}</div>
                <div class="cb-bub-zh hz" lang="zh-Hans">${matcher.tokenize(ln.zh)}</div>
                <div class="cb-bub-tr">
                  <span class="cb-tr-th">${esc(ln.th)}</span>
                  <span class="cb-tr-en">${esc(ln.en)}</span>
                </div>
                ${tipHtml}
              </div>
              <button type="button" class="cb-say-line" data-cb-sayline="${esc(ln.zh)}" title="อ่านออกเสียงบรรทัดนี้">${ic('vol')}</button>
            </div>
          </div>
        </div>`;
      }).join('');
      bodyHtml = `<div class="cb-stage">
        <div class="cb-bubbles">${turnsHtml}</div>
        ${renderNewWordsBox(sec, false)}
      </div>`;
    }

    const qaHtml = (sec.qa || []).length ? `<div class="cb-qa">
      <h4 class="cb-subh" style="margin-bottom:4px"><span class="cb-sq">■</span> <span class="hz" lang="zh-Hans">${isDiary ? '朗读课文，读后回答问题。' : '分角色朗读对话，读后回答问题。'}</span> <small>อ่านจบแล้วลองตอบคำถาม</small></h4>
      <div class="cb-qa-list">
        ${sec.qa.map((q, qi) => `<div class="cb-qa-item">
          <div class="cb-qa-q"><span class="hz" lang="zh-Hans">(${qi + 1}) ${matcher.tokenize(q.qZh)}</span><small>${esc(q.qTh)}</small></div>
          <button type="button" class="cb-reveal-btn" data-cb-reveal="qa-${si}-${qi}">ดูแนวคำตอบ</button>
          <div class="cb-sample-box" id="qa-${si}-${qi}" hidden>
            <div class="hz" lang="zh-Hans">${matcher.tokenize(q.aZh)}</div>
            <div class="muted" style="font-size:12.5px;margin-top:2px">${esc(q.aTh)}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

    return `<section class="cb-sec" id="cb-text-${sec.num}">
      <div class="cb-ribbon">
        <span class="cb-rib-zh hz" lang="zh-Hans">课文 ${sec.num}</span>
        <span class="cb-rib-en">Text ${sec.num}${isDiary ? ' · บทความ/ไดอารี' : ' · บทสนทนา'}</span>
        <span class="cb-rib-pg">p.${esc(sec.page)}</span>
      </div>
      <div class="cb-setting">
        <span class="cb-pin">${ic('pin')}</span>
        <div>
          <span class="cb-setting-zh hz" lang="zh-Hans">${matcher.tokenize(sec.settingZh)}</span>
          <span class="cb-setting-py cb-bub-py">${esc(sec.settingPy)}</span>
          <span class="cb-setting-tr">${esc(sec.settingTh)} · ${esc(sec.settingEn)}</span>
        </div>
      </div>

      <!-- Listening Comprehension + Real FLTRP Audio Player -->
      <div class="cb-mcq-box">
        <h4 class="cb-subh" style="margin-bottom:4px"><span class="cb-sq">■</span> <span class="hz" lang="zh-Hans">${isDiary ? '听两遍课文，选择正确答案。' : '听两遍对话，选择正确答案。'}</span> <small>ฟังเสียงจริงแล้วเลือกคำตอบ</small></h4>
        ${renderAudioBar(sec.audio, sec.audioLabel, false)}
        ${mcqHtml}
      </div>

      <!-- 2-Column Textbook Dialogue + Peach New Words -->
      ${bodyHtml}
      ${qaHtml}
    </section>`;
  }

  function renderGrammarSection(sec, si, matcher) {
    const bridges = (sec.gids || []).map(gid => `<a class="cb-bridge-btn" href="#/book/grammar/${esc(gid)}">
      ${ic('book')} เจาะลึกใน Grammar Book · <span>${esc(gid)}</span> ${ic('arrow-r')}
    </a>`).join('');

    const drillsHtml = sec.drills ? `<div class="cb-drills">
      <h4 class="cb-subh"><span class="cb-sq">■</span> <span class="hz" lang="zh-Hans">${esc(sec.drills.titleZh)}</span> <small>${esc(sec.drills.titleTh)}</small></h4>
      ${sec.drills.items.map((it, di) => `<div class="cb-drill-item">
        ${it.ctxA && !it.inlineA ? `<div class="hz" lang="zh-Hans">(${di + 1}) A: ${esc(it.ctxA)}</div><div>B: <span class="hz" lang="zh-Hans">${esc(it.pre)}</span><input type="text" class="cb-blank-in" placeholder="พิมพ์ลองแต่งดู…"><span class="hz" lang="zh-Hans">${esc(it.post)}</span>${it.hint ? `<span class="cb-hint-tag">(${esc(it.hint)})</span>` : ''}</div>`
          : it.inlineA ? `<div>(${di + 1}) A: <span class="hz" lang="zh-Hans">${esc(it.ctxA)}</span><input type="text" class="cb-blank-in" placeholder="พิมพ์ลองแต่งดู…"><span class="hz" lang="zh-Hans">${esc(it.post)}</span>${it.hint ? `<span class="cb-hint-tag">(${esc(it.hint)})</span>` : ''}</div>${it.ctxB ? `<div class="hz" lang="zh-Hans">B: ${esc(it.ctxB)}</div>` : ''}`
          : `<div>(${di + 1}) <span class="hz" lang="zh-Hans">${esc(it.pre)}</span><input type="text" class="cb-blank-in" placeholder="พิมพ์ลองแต่งดู…"><span class="hz" lang="zh-Hans">${esc(it.post)}</span>${it.hint ? `<span class="cb-hint-tag">(${esc(it.hint)})</span>` : ''}</div>`}
        <button type="button" class="cb-reveal-btn" data-cb-reveal="gd-${si}-${di}">ดูแนวคำตอบ</button>
        <div class="cb-sample-box" id="gd-${si}-${di}" hidden>
          <div><b>ตัวอย่างคำตอบ:</b> <span class="hz" lang="zh-Hans">${esc(it.sample)}</span></div>
          <div class="muted" style="font-size:12.5px;margin-top:2px">${esc(it.fullTh)}</div>
        </div>
      </div>`).join('')}
    </div>` : '';

    return `<section class="cb-sec" id="cb-gram-${sec.num}">
      <div class="cb-ribbon">
        <span class="cb-rib-zh hz" lang="zh-Hans">${ic('grad')} 小语讲堂</span>
        <span class="cb-rib-en">Xiaoyu's Classroom · จุดไวยากรณ์ที่ ${sec.num}</span>
        <span class="cb-rib-pg">p.${esc(sec.page)}</span>
      </div>
      <div class="cb-gram-card">
        <div class="cb-gram-head">
          <span class="cb-gram-num">${sec.num}</span>
          <h3 class="cb-gram-title"><span class="hz" lang="zh-Hans">${esc(sec.titleZh)}</span><small>${esc(sec.titleTh)} · ${esc(sec.titleEn)}</small></h3>
        </div>
        ${bridges ? `<div class="cb-gram-bridges">${bridges}</div>` : ''}
        <div class="cb-gram-exp">
          <p class="cb-exp-th">${esc(sec.expTh).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>
          <p class="hz" lang="zh-Hans">${esc(sec.expZh)}</p>
          <p class="cb-exp-en">${esc(sec.expEn)}</p>
        </div>
        <ul class="cb-ex-list">
          ${sec.examples.map((ex, ei) => `<li class="cb-ex-item">
            <span class="cb-ex-no">(${ei + 1})</span>
            <div style="flex:1;min-width:0">
              <div class="cb-ex-py">${esc(ex.py)}</div>
              <div class="cb-ex-zh hz" lang="zh-Hans">${matcher.tokenize(ex.zh)}</div>
              <div class="cb-bub-tr" style="border-top:none;padding-top:2px;margin-top:2px">
                <span class="cb-tr-th">${esc(ex.th)}</span>
                <span class="cb-tr-en">${esc(ex.en)}</span>
              </div>
            </div>
            <button type="button" class="cb-say-line" data-cb-sayline="${esc(ex.zh)}" title="ฟังเสียงตัวอย่าง">${ic('vol')}</button>
          </li>`).join('')}
        </ul>
        ${drillsHtml}
      </div>
    </section>`;
  }

  function renderExercises(ex, matcher) {
    if (!ex) return '';
    const groupsHtml = ex.clozeGroups.map(grp => {
      const opts = `<option value="">___</option>` + grp.bank.map(b => `<option value="${b.k}">${b.k} ${b.w}</option>`).join('');
      return `<div class="cb-card" data-cb-clozegroup="${grp.id}">
        <h4 class="cb-subh"><span class="cb-sq">■</span> <span class="hz" lang="zh-Hans">选词填空</span> <small>เลือกคำเติมช่องว่าง · ${esc(grp.titleTh)}</small></h4>
        <div class="cb-bank-bar">
          ${grp.bank.map(b => `<span class="cb-bank-word"><b>${b.k}</b><span class="hz" lang="zh-Hans">${esc(b.w)}</span></span>`).join('')}
        </div>
        ${grp.items.map(it => `<div class="cb-cloze-item" data-cl-ans="${it.ans}">
          ${it.ctxA ? `<div class="hz" lang="zh-Hans">(${it.n}) A: ${esc(it.ctxA)}</div><div>B: <span class="hz" lang="zh-Hans">${esc(it.pre)}</span><select class="cb-cloze-sel">${opts}</select><span class="hz" lang="zh-Hans">${esc(it.post)}</span></div>`
            : it.isA ? `<div>(${it.n}) A: <span class="hz" lang="zh-Hans">${esc(it.pre)}</span><select class="cb-cloze-sel">${opts}</select><span class="hz" lang="zh-Hans">${esc(it.post)}</span></div><div class="hz" lang="zh-Hans">B: ${esc(it.ctxB)}</div>`
            : `<div>(${it.n}) <span class="hz" lang="zh-Hans">${esc(it.pre)}</span><select class="cb-cloze-sel">${opts}</select><span class="hz" lang="zh-Hans">${esc(it.post)}</span></div>`}
          <div class="cb-cl-exp muted" style="font-size:12.5px;margin-top:4px" hidden>เฉลย: <b>${it.ans}</b> — ${esc(it.th)}</div>
        </div>`).join('')}
        <div class="cb-actions-row">
          <button type="button" class="btn primary" data-cb-clcheck>${ic('check')} ตรวจคำตอบ</button>
          <button type="button" class="btn" data-cb-clreset>ล้างคำตอบ</button>
          <span class="cb-score-badge" data-cb-clscore></span>
        </div>
      </div>`;
    }).join('');

    const pdHtml = `<div class="cb-card">
      <h4 class="cb-subh"><span class="cb-sq">■</span> <span class="hz" lang="zh-Hans">用本课新学的词语和语言点描述图片。</span> <small>เติมบทสนทนาตามภาพด้วยคำศัพท์และไวยากรณ์บทนี้</small></h4>
      <div class="cb-pd-grid">
        ${ex.pictureDialogues.map(pd => `<div class="cb-pd-card">
          <div class="cb-pd-scene">${esc(pd.scene)}</div>
          ${pd.lines.map(l => `<div class="cb-pd-line"><b>${l.sp}:</b><span class="hz" lang="zh-Hans">${esc(l.text)}</span>${l.ans ? `<span class="cb-pd-ans" data-pd-ans hidden>${ic('bulb')} ${esc(l.ans)}</span>` : ''}</div>`).join('')}
          <button type="button" class="cb-reveal-btn" data-cb-pdtog>ดูแนวคำตอบบทสนทนานี้</button>
        </div>`).join('')}
      </div>
    </div>`;

    return `<section class="cb-sec" id="cb-exercises">
      <div class="cb-ribbon">
        <span class="cb-rib-zh hz" lang="zh-Hans">综合练习</span>
        <span class="cb-rib-en">Comprehensive Exercises · แบบฝึกหัดรวม</span>
        <span class="cb-rib-pg">p.${esc(ex.page)}</span>
      </div>
      ${groupsHtml}
      ${pdHtml}
    </section>`;
  }

  function renderActivity(act, matcher) {
    if (!act) return '';
    return `<section class="cb-sec" id="cb-activity">
      <div class="cb-ribbon">
        <span class="cb-rib-zh hz" lang="zh-Hans">课堂活动</span>
        <span class="cb-rib-en">Classroom Activity · ฝึกพูดตามสถานการณ์</span>
        <span class="cb-rib-pg">p.${esc(act.page)}</span>
      </div>
      <div class="cb-act-grid">
        ${act.scenes.map(sc => `<div class="cb-act-card">
          <h4><span class="hz" lang="zh-Hans">${esc(sc.titleZh)}</span> · ${esc(sc.titleTh)}</h4>
          <p style="margin:0 0 5px;font-size:13.5px">${esc(sc.descTh)}</p>
          <p class="hz muted" style="margin:0;font-size:13px" lang="zh-Hans">${esc(sc.descZh)}</p>
          <div class="cb-act-chips">
            ${sc.chips.map(ch => `<button type="button" class="cb-act-chip hz" data-cbw="${esc(ch)}" lang="zh-Hans">${esc(ch)}</button>`).join('')}
          </div>
        </div>`).join('')}
      </div>
    </section>`;
  }

  function renderSelfCheck(lesson, pr, lWords) {
    return `<section class="cb-sec" id="cb-summary">
      <div class="cb-ribbon">
        <span class="cb-rib-zh hz" lang="zh-Hans">学习小结</span>
        <span class="cb-rib-en">Learning Summary · ประเมินตัวเอง</span>
      </div>
      <div class="cb-card">
        <p class="muted" style="margin:0 0 8px;font-size:13px">ติ๊กประเมินความมั่นใจตามแบบหนังสือเรียน (ระบบบันทึกให้อัตโนมัติในเครื่อง):</p>
        <table class="cb-sc-table">
          <thead>
            <tr>
              <th>หัวข้อที่เรียนในบทนี้</th>
              <th class="c">理解<br><small>เข้าใจ</small></th>
              <th class="c">会用<br><small>ใช้เป็นจริง</small></th>
            </tr>
          </thead>
          <tbody>
            ${lesson.selfCheck.map(it => `<tr>
              <td><b class="hz" lang="zh-Hans">${esc(it.zh)}</b><br><small class="muted">${esc(it.th)}</small></td>
              <td class="c"><button type="button" class="cb-sc-chk${pr.u && pr.u[it.id] ? ' on' : ''}" data-cb-sc="u:${it.id}" aria-label="เข้าใจ">✓</button></td>
              <td class="c"><button type="button" class="cb-sc-chk${pr.a && pr.a[it.id] ? ' on' : ''}" data-cb-sc="a:${it.id}" aria-label="ใช้เป็น">✓</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
        <label style="display:block;margin-top:12px;font-size:13px;font-weight:600;color:var(--ink-2)">${ic('pen')} <span class="hz" lang="zh-Hans">我需要努力的</span> · จุดที่อยากฝึกเพิ่มในบทนี้:</label>
        <textarea class="cb-sc-note" data-cb-note placeholder="จดคำศัพท์ที่ยังจำไม่ได้ หรือโครงสร้างที่อยากทบทวนเพิ่ม…">${esc(pr.note || '')}</textarea>
      </div>

      <!-- Practice Handoff Dock (Course → App Flashcards / Dictation / Games!) -->
      <div class="cb-dock">
        <h3>${ic('pad')} ส่งคำศัพท์บทที่ ${lesson.n} ไปฝึกต่อในแอป (${lWords.length} คำในคลัง 5 ภาษา)</h3>
        <p>ฝึกจำคำศัพท์ใหม่ของบทนี้ผ่านแฟลชการ์ด เขียนตามคำบอก หรือมินิเกม — เล่นจบแล้วกลับมาหน้าบทเรียนนี้ทันที</p>
        <div class="cb-dock-btns">
          <button type="button" class="btn primary" data-cb-practice="flash">${ic('play')} แฟลชการ์ด</button>
          <button type="button" class="btn" data-cb-practice="tingxie">${ic('pen')} 听写 เขียนตามคำบอก</button>
          <button type="button" class="btn" data-cb-practice="match">${ic('target')} หน้าต่างความจำ</button>
          <button type="button" class="btn" data-cb-practice="tone">${ic('g-tone')} ล่าวรรณยุกต์</button>
        </div>
      </div>
    </section>`;
  }

  /* ---------- Main Draw Controller ---------- */
  function draw() {
    const body = $('#bkBody');
    if (!body || Book.id !== ID) return;
    stopAudio();
    const cat = byLv(curLv);
    const book = packData(cat.key);

    if (cat.src && !book) {
      body.innerHTML = `<div class="cb"><p class="muted b5-loading">กำลังโหลดเนื้อหาหนังสือเรียน ${esc(cat.title)}…</p></div>`;
      ensurePack(cat).then(loaded => {
        if (Book.id === ID) draw();
      });
      return;
    }

    if (curLesson && book && book.lessons && book.lessons[curLesson]) {
      const lesson = book.lessons[curLesson];
      $('#bkVol').textContent = `VOL. 14 · ${book.titleZh} · Lesson ${lesson.n}`;
      $('#bkTitle').innerHTML = `<span class="hz" lang="zh-Hans">${esc(lesson.titleZh)}</span>`;
      $('#bkToc').hidden = false;
      body.innerHTML = renderLesson(cat, book, lesson);
    } else {
      curLesson = null;
      $('#bkVol').textContent = `VOL. 14 · Course 3.0 · ${cat.title}`;
      $('#bkTitle').innerHTML = `<span class="hz" lang="zh-Hans">${esc(cat.zh)}</span> ${esc(cat.title)}`;
      $('#bkToc').hidden = true;
      body.innerHTML = renderOverview(cat, book);
    }
  }

  /* ---------- Hook into Book Lifecycle ---------- */
  const show0 = Book.show, render0 = Book.render;
  Book.show = function (id) {
    if (id === ID) parseCourseRoute();
    else stopAudio();
    return show0.apply(this, arguments);
  };
  Book.render = function () {
    const r = render0.apply(this, arguments);
    const on = this.id === ID;
    $('#v-book').classList.toggle('cb-on', on);
    if (on) draw();
    return r;
  };
  addEventListener('hashchange', () => {
    if (!location.hash.startsWith('#/book/course')) stopAudio();
  });

  /* Smart top-left Back & TOC buttons inside Course Book */
  document.addEventListener('click', e => {
    if (Book.id !== ID) return;
    if (e.target.closest('#bkToc') && curLesson) {
      e.stopImmediatePropagation();
      sfx('tap');
      Router.up(`/book/course/${curLv}`);
      return;
    }
    if (e.target.closest('#v-book .back-btn') && curLesson) {
      e.preventDefault();
      e.stopImmediatePropagation();
      sfx('tap');
      Router.up(`/book/course/${curLv}`);
    }
  }, true);

  /* ---------- Interactive Event Delegation ---------- */
  $('#bkBody').addEventListener('click', e => {
    if (Book.id !== ID) return;
    const cat = byLv(curLv);
    const book = packData(cat.key);
    const lesson = curLesson && book && book.lessons && book.lessons[curLesson];

    // 1. Audio player controls
    const audEl = e.target.closest('.cb-aud');
    if (audEl) {
      const src = audEl.dataset.cbaSrc;
      if (e.target.closest('[data-cba-play]')) {
        if (audSrc === src && audBar === audEl) {
          if (aud.paused) aud.play().catch(() => {}); else aud.pause();
        } else {
          stopAudio();
          audBar = audEl; audSrc = src;
          aud.src = src;
          aud.playbackRate = audSpeed;
          aud.play().catch(() => {});
          // sync speed/loop labels on newly active bar
          const sb = audEl.querySelector('[data-cba-spd]'); if (sb) sb.textContent = audSpeed + 'x';
          const lb = audEl.querySelector('[data-cba-loop]'); if (lb) lb.classList.toggle('on', audLoop);
        }
        syncAudioUI();
        return;
      }
      if (e.target.closest('[data-cba-spd]')) {
        const speeds = [1, 0.75, 1.25];
        audSpeed = speeds[(speeds.indexOf(audSpeed) + 1) % speeds.length];
        aud.playbackRate = audSpeed;
        $$('.cb-aud [data-cba-spd]', $('#bkBody')).forEach(b => { b.textContent = audSpeed + 'x'; });
        sfx('tap');
        return;
      }
      if (e.target.closest('[data-cba-loop]')) {
        audLoop = !audLoop;
        $$('.cb-aud [data-cba-loop]', $('#bkBody')).forEach(b => b.classList.toggle('on', audLoop));
        sfx(audLoop ? 'on' : 'off');
        return;
      }
      return;
    }

    // 2. Level switcher & lesson navigation
    const lvBtn = e.target.closest('[data-cblv]');
    if (lvBtn) { sfx('tap'); Router.replace(`/book/course/${lvBtn.dataset.cblv}`); return; }
    const goL = e.target.closest('[data-cbgo-l]');
    if (goL) { const [l, n] = goL.dataset.cbgoL.split(':'); sfx('tap'); Router.go(`/book/course/${l}/${n}`); return; }
    const toToc = e.target.closest('[data-cb-toc]');
    if (toToc) { sfx('tap'); Router.up(`/book/course/${toToc.dataset.cbToc}`); return; }
    if (e.target.closest('[data-cbsoon]')) { toast('บทนี้เป็นรายการตัวอย่างในสารบัญ — รอคุณยืนยันขยายต่อหลังดูบทที่ 1 ครับ', { icon: 'info' }); return; }

    // 3. Sticky Reader Toggles (Pinyin / Translation / Listening / Highlight NW)
    const tog = e.target.closest('[data-cb-toggle]');
    if (tog) {
      const st = cStore();
      const k = tog.dataset.cbToggle;
      const root = $('#cbLesson');
      if (k === 'py') {
        st.py = !st.py; saveState(); sfx(st.py ? 'on' : 'off');
        if (root) root.classList.toggle('no-py', !st.py);
        tog.classList.toggle('on', st.py);
        const u = tog.querySelector('use'); if (u) u.setAttribute('href', st.py ? '#i-eye' : '#i-eye-off');
      } else if (k === 'tr') {
        const order = ['both', 'th', 'en', 'off'];
        st.tr = order[(order.indexOf(st.tr) + 1) % order.length]; saveState(); sfx('tap');
        if (root) root.dataset.tr = st.tr;
        tog.textContent = trLabel(st.tr);
        tog.classList.toggle('on', st.tr !== 'off');
      } else if (k === 'listen') {
        st.listen = !st.listen; saveState(); sfx(st.listen ? 'on' : 'off');
        if (root) {
          root.classList.toggle('listen-only', st.listen);
          if (!st.listen) $$('.peek', root).forEach(el => el.classList.remove('peek'));
        }
        tog.classList.toggle('on', st.listen);
        toast(st.listen ? 'เปิดโหมดฝึกฟังเปล่า — แตะที่แต่ละประโยคเพื่อเปิดดูเฉลย' : 'ปิดโหมดฝึกฟังแล้ว', { icon: 'info', ms: 2000 });
      } else if (k === 'hlNw') {
        st.hlNw = !st.hlNw; saveState(); sfx(st.hlNw ? 'on' : 'off');
        if (root) root.classList.toggle('hl-nw', st.hlNw);
        tog.classList.toggle('on', st.hlNw);
      }
      return;
    }

    // 4. Launch Practice (Course → Flashcards / Dictation / Mini-games)
    const prBtn = e.target.closest('[data-cb-practice]');
    if (prBtn && lesson) {
      const mode = prBtn.dataset.cbPractice;
      const words = getLessonWords(lesson);
      if (!words.length) { toast('ยังไม่พบคำศัพท์ในคลังสำหรับบทนี้', { icon: 'info' }); return; }
      stopAudio();
      sfx('pop');
      playGame(mode, {
        words,
        title: `${book.titleZh} · บทที่ ${lesson.n}`,
        kind: 'custom',
        back: `/book/course/${curLv}/${lesson.n}`
      });
      return;
    }

    // 5. Per-line TTS speaker
    const sayLine = e.target.closest('[data-cb-sayline]');
    if (sayLine) { TTS.speak(sayLine.dataset.cbSayline); return; }

    // 6. Listening-only peek click on blurred bubble/diary sentence
    const peekEl = e.target.closest('[data-cb-peek]');
    if (peekEl && cStore().listen && !peekEl.classList.contains('peek')) {
      peekEl.classList.add('peek');
      sfx('tap');
      return;
    }

    // 7. Reveal toggles (Xiaoyu's Tip, Q&A sample answers, Grammar drills)
    const rev = e.target.closest('[data-cb-reveal]');
    if (rev) {
      const target = document.getElementById(rev.dataset.cbReveal);
      if (target) { target.hidden = !target.hidden; sfx('tap'); }
      return;
    }

    // 8. Picture-dialogue answer toggle
    const pdTog = e.target.closest('[data-cb-pdtog]');
    if (pdTog) {
      const card = pdTog.closest('.cb-pd-card');
      const items = $$('[data-pd-ans]', card);
      const show = items.some(x => x.hidden);
      items.forEach(x => { x.hidden = !show; });
      pdTog.textContent = show ? 'ซ่อนแนวคำตอบ' : 'ดูแนวคำตอบบทสนทนานี้';
      sfx('tap');
      return;
    }

    // 9. Listening MCQ answer check
    const mcqOpt = e.target.closest('[data-cb-mcq]');
    if (mcqOpt) {
      const qBox = mcqOpt.closest('.cb-mcq-q');
      const chosen = +mcqOpt.dataset.cbMcq;
      const ans = +qBox.dataset.mcqAns;
      $$('.cb-mcq-opt', qBox).forEach((b, i) => {
        b.classList.remove('ok', 'bad');
        if (i === ans) b.classList.add('ok');
        else if (i === chosen) b.classList.add('bad');
      });
      const why = $('.cb-mcq-why', qBox);
      if (why) why.hidden = false;
      sfx(chosen === ans ? 'correct' : 'wrong');
      return;
    }

    // 10. Warm-Up Match check / reset
    if (e.target.closest('[data-cb-wucheck]')) {
      const box = e.target.closest('.cb-card');
      let ok = 0, total = 0;
      $$('.cb-wu-pic', box).forEach(card => {
        total++;
        const sel = card.querySelector('select');
        const right = sel && sel.value === card.dataset.wuAns;
        card.classList.toggle('ok', !!right);
        card.classList.toggle('bad', !right);
        if (right) ok++;
      });
      const sc = box.querySelector('[data-cb-wuscore]');
      if (sc) sc.textContent = `ได้ ${ok} / ${total} ข้อ${ok === total ? ' · ยอดเยี่ยม!' : ''}`;
      sfx(ok === total ? 'complete' : 'tap');
      return;
    }
    if (e.target.closest('[data-cb-wureset]')) {
      const box = e.target.closest('.cb-card');
      $$('.cb-wu-pic', box).forEach(card => {
        card.classList.remove('ok', 'bad');
        const sel = card.querySelector('select'); if (sel) sel.value = '';
      });
      const sc = box.querySelector('[data-cb-wuscore]'); if (sc) sc.textContent = '';
      sfx('tap');
      return;
    }

    // 11. Cloze Exercise check / reset
    if (e.target.closest('[data-cb-clcheck]')) {
      const grp = e.target.closest('[data-cb-clozegroup]');
      let ok = 0, total = 0;
      $$('.cb-cloze-item', grp).forEach(item => {
        total++;
        const sel = item.querySelector('select');
        const right = sel && sel.value === item.dataset.clAns;
        item.classList.toggle('ok', !!right);
        item.classList.toggle('bad', !right);
        const exp = item.querySelector('.cb-cl-exp');
        if (exp) exp.hidden = false;
        if (right) ok++;
      });
      const sc = grp.querySelector('[data-cb-clscore]');
      if (sc) sc.textContent = `คะแนน ${ok} / ${total}${ok === total ? ' · ครบหมด!' : ''}`;
      sfx(ok === total ? 'complete' : 'tap');
      return;
    }
    if (e.target.closest('[data-cb-clreset]')) {
      const grp = e.target.closest('[data-cb-clozegroup]');
      $$('.cb-cloze-item', grp).forEach(item => {
        item.classList.remove('ok', 'bad');
        const sel = item.querySelector('select'); if (sel) sel.value = '';
        const exp = item.querySelector('.cb-cl-exp'); if (exp) exp.hidden = true;
      });
      const sc = grp.querySelector('[data-cb-clscore]'); if (sc) sc.textContent = '';
      sfx('tap');
      return;
    }

    // 12. Self-Check (理解 / 会用) checkboxes
    const scBtn = e.target.closest('[data-cb-sc]');
    if (scBtn && lesson) {
      const [col, key] = scBtn.dataset.cbSc.split(':');
      const pr = progOf(`${book.id}:L${lesson.n}`);
      pr[col] = pr[col] || {};
      pr[col][key] = !pr[col][key];
      pr.t = Date.now();
      scBtn.classList.toggle('on', !!pr[col][key]);
      saveState();
      sfx(pr[col][key] ? 'on' : 'off');
      return;
    }

    // 13. Tap ANY word in Dialogue / Diary / New Words / Activity chips → 5-Language Sheet!
    const wEl = e.target.closest('[data-cbw]');
    if (wEl) {
      openWordSheet(wEl.dataset.cbw, wEl.dataset.cbapp || null, book);
    }
  });

  /* Input events: Audio seek slider, Objective checkboxes, Self-check personal note */
  $('#bkBody').addEventListener('input', e => {
    if (Book.id !== ID) return;
    if (e.target.matches('[data-cba-seek]')) {
      const audEl = e.target.closest('.cb-aud');
      if (audBar === audEl && isFinite(aud.duration) && aud.duration > 0) {
        aud.currentTime = (Number(e.target.value) / 1000) * aud.duration;
        syncAudioUI();
      }
      return;
    }
    if (e.target.matches('[data-cb-note]') && curLesson) {
      const cat = byLv(curLv), book = packData(cat.key);
      if (book) { const pr = progOf(`${book.id}:L${curLesson}`); pr.note = e.target.value; pr.t = Date.now(); saveState(); }
    }
  });

  $('#bkBody').addEventListener('change', e => {
    if (Book.id !== ID) return;
    if (e.target.matches('[data-cb-obj]') && curLesson) {
      const cat = byLv(curLv), book = packData(cat.key);
      if (book) {
        const pr = progOf(`${book.id}:L${curLesson}`);
        pr.obj = pr.obj || {};
        pr.obj[e.target.dataset.cbObj] = e.target.checked;
        pr.t = Date.now();
        saveState();
        sfx(e.target.checked ? 'on' : 'off');
      }
    }
  });
})();
