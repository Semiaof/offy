'use strict';
/* =====================================================================
   Library of Limu · new offy v6 — five bookshelf volumes built from the HSK 3.0 data
   VOL 03 六书 · VOL 04 部首查字 · VOL 06 语法手册 · VOL 10 常用量词 · VOL 12 近义词辨析
   Pages: data/books5.js (window.OFFY_BOOKS5), made by แปล HSK1 5ภาษา/tools/build_books.py.
   The file is large, so it loads the first time the shelf or one of these books opens.
   Loaded before views.js (which boots the app), so a link straight to #/book/radicals works.
   Tapping a Chinese word inside these books opens it in the word library.
   ===================================================================== */
(function books5() {
  const SRC = 'data/books5.js?v=9.0.0';
  const IDS = { radicals: '部首查字', six: '六书', measure: '常用量词', synonym: '近义词辨析', grammar: '语法手册' };
  const data = id => window.OFFY_BOOKS5 && window.OFFY_BOOKS5[id];
  let loading = null;
  const load = () => loading = loading || Fx.script(SRC).then(() => { if (IDS[Book.id] && location.hash.startsWith('#/book/')) Book.render(); })
    .catch(() => { loading = null; if (IDS[Book.id]) $('#bkBody').innerHTML = `<p class="muted">${T('โหลดเนื้อหาเล่มนี้ไม่ได้ ลองเปิดใหม่อีกครั้ง')}</p>`; });

  Object.assign(window.OFFY_EN || {}, { 'กำลังโหลดเนื้อหา…': 'Loading…', 'โหลดเนื้อหาเล่มนี้ไม่ได้ ลองเปิดใหม่อีกครั้ง': 'This book could not load — please try again' });

  for (const [id, hz] of Object.entries(IDS)) {
    const shelf = SHELF.find(b => b.hz === hz); if (!shelf) continue;
    shelf.id = id;
    BOOK_META[id] = {
      vol: `VOL. ${shelf.vol} · ${shelf.tag}`, title: `${hz} ${shelf.th}`, toc: 0,
      pages: () => (data(id) || {}).pages || [`<p class="muted b5-loading">${T('กำลังโหลดเนื้อหา…')}</p>`],
      get labels() { return (data(id) || {}).labels || ['1']; }
    };
  }

  const libShow = Library.show, bookShow = Book.show;
  Library.show = function () { libShow.call(this); load(); };                       // warm it up while the shelf is open
  Book.show = function (id) { if (IDS[id]) load(); return bookShow.call(this, id); };

  // a Chinese word in these books → the word library, searching for it
  $('#bkBody').addEventListener('click', e => {
    if (!IDS[Book.id]) return;
    const say = e.target.closest('[data-say]'); if (say) { TTS.speak(say.dataset.say); return; }
    const b = e.target.closest('[data-q]'); if (!b) return;
    Dict.preset = { q: b.dataset.q }; Router.go('/dict');
  });

  // explanations show the reader's language (the flashcard language of the word library), the others stay hidden
  const L5 = ['th', 'en', 'zh', 'vi', 'ja'];
  const readerLang = () => { try { const m = typeof f5main === 'function' ? f5main() : LANG; return L5.includes(m) ? m : 'th'; } catch (err) { return LANG === 'en' ? 'en' : 'th'; } };
  const bookRender = Book.render;
  Book.render = function () { const r = bookRender.apply(this, arguments); if (IDS[this.id]) $('#bkBody').dataset.gl = readerLang(); return r; };
})();
