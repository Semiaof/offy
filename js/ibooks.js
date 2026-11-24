'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — interactive books on the bookshelf
   VOL 01 拼音   ← books/pinyin (พินอินเข้าใจง่าย v4: lessons, syllable lab, full chart with recorded sound, listening practice)
   VOL 02 基本笔画 ← books/hanzi  (汉字书写 v5: basic strokes, stroke-order rules, structure, the writing studio)
   VOL 03 六书   ← books/hanzi  (六书 theory + 392 analysed characters) + the HSK statistics chapter (data/books5.js)
   VOL 04 部首   ← ต้นไม้ตัวอักษร (js/tree.js) + books/hanzi (214 radicals, character search) + radical names in 4 languages (data/books5.js)
   A chapter is either a hash inside the app (shown in a frame; the app's own menus are hidden by each app's embed.css)
   or a set of book pages (shown by the normal reader). The frame follows the app's theme; the accent is the spine colour.
   Loaded after books5.js and before views.js (which boots the app).
   ===================================================================== */
(function ibooks() {
  const APPS = { pinyin: 'books/pinyin/index.html', hanzi: 'books/hanzi/index.html' };
  const PY_CREDIT = 'เสียงพยางค์: Chen Wang · เสียงคำ: Yue Tan (Shtooka project) · รวบรวมโดย Hugo Lopez — โครงการ audio-cmn · สัญญาอนุญาต CC BY-SA';
  const IB = {
    pinyin: { hz: '拼音', app: 'pinyin', ch: [
      { h: '#home', t: 'ภาพรวม' }, { h: '#learn', t: 'บทเรียน' }, { h: '#lab', t: 'แล็บประกอบเสียง' }, { h: '#chart', t: 'ตารางพินอิน' }, { h: '#practice', t: 'ฝึกฟัง' },
      { pages: () => BOOKS_OLD_PY(), labels: ['a', 'b', '1', '2', '3', '4'], t: 'สรุปแบบอ่าน' }],
      credit: PY_CREDIT },
    strokes: { hz: '基本笔画', app: 'hanzi', ch: [
      { h: '#explore/strokes', t: 'ขีดพื้นฐาน' }, { h: '#explore/rules', t: 'กฎลำดับขีด' }, { h: '#explore/structure', t: 'โครงสร้าง' }, { h: '#practice', t: 'ฝึกเขียน' }] },
    six: { hz: '六书', app: 'hanzi', ch: [
      { h: '#explore/liushu', t: 'ศาสตร์ 六书' }, { data: 'six', t: 'สถิติในอักษร HSK' }] },
    radicals: { hz: '部首查字', app: 'hanzi', ch: [
      { h: '#explore/radicals', t: 'หมวดนำ 214' }, { h: '#search', t: 'ค้นหาอักษร' }, { data: 'radicals', t: 'ชื่อราก 4 ภาษา' }] }
  };
  const BOOKS_OLD_PY = () => (window.OFFY_BOOKS && window.OFFY_BOOKS.py) || [];   // the earlier VOL 01 pages (data/books.js)

  Object.assign(window.OFFY_EN || {}, {
    'ภาพรวม': 'Overview', 'บทเรียน': 'Lessons', 'แล็บประกอบเสียง': 'Syllable lab', 'ตารางพินอิน': 'Pinyin chart', 'ฝึกฟัง': 'Listening', 'สรุปแบบอ่าน': 'Reading notes',
    'ขีดพื้นฐาน': 'Basic strokes', 'กฎลำดับขีด': 'Stroke order', 'โครงสร้าง': 'Structure', 'ฝึกเขียน': 'Writing studio', 'ศาสตร์ 六书': '六书 theory',
    'สถิติในอักษร HSK': 'In HSK characters', 'สายวิวัฒนาการ': 'Digivolution', 'ต้นไม้ตัวอักษร': 'Character tree', 'หมวดนำ 214': '214 radicals', 'ค้นหาอักษร': 'Find a character', 'ชื่อราก 4 ภาษา': 'Radical names in 4 languages',
    'เครดิต': 'Credits', 'บทในเล่ม': 'Chapters'
  });

  const st = { cur: {}, frameApp: null, frameReady: false };       // cur[book] = chapter index
  const spine = id => { const b = SHELF.find(x => x.id === id); return b ? BOOK_COLOR[b.c] : '#2c8259'; };
  const data = key => window.OFFY_BOOKS5 && window.OFFY_BOOKS5[key];
  const chapter = id => IB[id].ch[st.cur[id] || 0];
  const MOUNTS = { tree: () => window.OffyTree || (typeof OffyTree !== 'undefined' && OffyTree), digi: () => typeof OffyDigi !== 'undefined' && OffyDigi };
  const isPages = c => !!(c.pages || c.data || c.mount);
  const pagesOf = c => c.mount ? ['<div class="tr-root" id="mountRoot"></div>'] : c.pages ? c.pages() : (data(c.data) || {}).pages || [`<p class="muted b5-loading">${T('กำลังโหลดเนื้อหา…')}</p>`];
  const labelsOf = c => c.mount ? ['1'] : c.labels || (data(c.data) || {}).labels || ['1'];

  for (const [id, b] of Object.entries(IB)) {
    const shelf = SHELF.find(x => x.hz === b.hz); if (!shelf) continue;
    shelf.id = id;
    BOOK_META[id] = {
      vol: `VOL. ${shelf.vol} · ${shelf.tag}`, title: `${b.hz} ${shelf.th}`,
      pages: () => isPages(chapter(id)) ? pagesOf(chapter(id)) : [''],
      get labels() { return isPages(chapter(id)) ? labelsOf(chapter(id)) : ['1']; },
      get toc() { const c = chapter(id); return isPages(c) && c.data ? 0 : null; }
    };
  }

  /* ---------- the frame + chapter bar (built once, inside #v-book) ---------- */
  const view = $('#v-book');
  const bar = document.createElement('nav'); bar.className = 'ib-bar'; bar.setAttribute('aria-label', T('บทในเล่ม'));
  const wrap = document.createElement('div'); wrap.className = 'ib-wrap';
  wrap.innerHTML = '<iframe class="ib-frame" title="book" allow="autoplay; fullscreen" loading="eager"></iframe>';
  $('.ph', view).after(bar); bar.after(wrap);
  const frame = $('iframe', wrap);
  // opened from disk (file://) the origin is opaque ("null" / "file://"): messages then go to '*' and are checked by their source window
  const TARGET = location.protocol === 'file:' || !location.origin || location.origin === 'null' ? '*' : location.origin;
  const post = msg => { try { frame.contentWindow.postMessage(msg, TARGET); } catch (e) { } };

  function paintBar(id) {
    const b = IB[id], cur = st.cur[id] || 0;
    bar.style.setProperty('--bk', spine(id));
    bar.innerHTML = `<div class="ib-tabs" role="tablist">${b.ch.map((c, i) => `<button role="tab" aria-selected="${i === cur}" data-ch="${i}">${T(c.t)}</button>`).join('')}</div>
      ${b.credit ? `<button class="ib-info" data-credit aria-label="${T('เครดิต')}">${ic('info')}</button>` : ''}`;
    const on = $('[aria-selected="true"]', bar); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function fit() {
    if (!view.classList.contains('ib-app')) return;
    const top = wrap.getBoundingClientRect().top, nav = $('.nav'), nr = nav && nav.getBoundingClientRect();
    const below = nr && nr.top > innerHeight / 2 ? innerHeight - nr.top + 10 : 14;       // phone: the floating tab bar
    wrap.style.height = Math.max(320, innerHeight - top - below) + 'px';
  }
  function showChapter(id, fromRoute) {
    const c = chapter(id), app = IB[id].app;
    view.classList.add('ib'); view.classList.toggle('ib-app', !isPages(c)); view.classList.toggle('ib-wide', !!c.mount); view.style.setProperty('--bk', spine(id));
    paintBar(id);
    if (isPages(c)) { frame.blur(); post({ type: 'offy-stop' }); return; }
    const theme = currentTheme(), accent = spine(id);
    const src = `${APPS[app]}?embed=1&theme=${theme}&accent=${encodeURIComponent(accent)}${c.h}`;
    if (st.frameApp !== app + accent) { st.frameApp = app + accent; frame.src = src; }    // another app or another book colour
    else { frame.src = src; post({ type: 'offy-go', hash: c.h }); }   // same page, new #fragment: no reload, works from disk too
    window.scrollTo(0, 0);
    requestAnimationFrame(fit); setTimeout(fit, 450);
  }

  /* ---------- Book hooks ---------- */
  const show = Book.show, render = Book.render;
  Book.show = function (id) {
    if (!IB[id]) { view.classList.remove('ib', 'ib-app', 'ib-wide'); post({ type: 'offy-stop' }); return show.call(this, id); }
    this.pos[id] = 0;
    const r = show.call(this, id);
    showChapter(id, true);
    return r;
  };
  Book.render = function () {
    const r = render.call(this);
    if (IB[this.id]) {
      const c = chapter(this.id), pg = $('.pager');
      if (pg && (!isPages(c) || c.mount)) pg.hidden = true;
      const m = c.mount && MOUNTS[c.mount] && MOUNTS[c.mount]();                          // js/digi.js · js/tree.js
      if (m) m.mount($('#mountRoot'));
    }
    return r;
  };
  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-ch]');
    if (b) { const id = Book.id; st.cur[id] = +b.dataset.ch; Book.i = 0; Book.pos[id] = 0; sfx('tap'); Book.render(); $('#bkToc').hidden = BOOK_META[id].toc === null; showChapter(id); return; }
    if (e.target.closest('[data-credit]')) { const c = IB[Book.id] && IB[Book.id].credit; if (c) modal({ title: T('เครดิต'), msg: c }); }
  });
  // the page inside reports where it is: keep the chapter tab in step (e.g. a link inside the app to another section)
  window.addEventListener('message', e => {
    if (e.source !== frame.contentWindow || !e.data || e.data.type !== 'offy-book-route' || !IB[Book.id]) return;
    const id = Book.id, h = e.data.hash || '', i = IB[id].ch.findIndex(c => c.h && (h === c.h || h.startsWith(c.h + '/')));
    if (i >= 0 && i !== (st.cur[id] || 0)) { st.cur[id] = i; paintBar(id); }
  });
  frame.addEventListener('load', fit);
  addEventListener('resize', fit);
  // theme follows the app; leaving the book stops any sound inside
  new MutationObserver(() => post({ type: 'offy-theme', theme: currentTheme() })).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  addEventListener('hashchange', () => { if (!location.hash.startsWith('#/book/')) post({ type: 'offy-stop' }); else setTimeout(fit, 450); });
})();
