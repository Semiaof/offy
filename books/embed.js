/* Library of Limu · new offy v6 — runs inside an interactive book (an app opened in the bookshelf's frame).
   Only active with ?embed=1. The page's own menus are hidden (embed.css); the book's chapter tabs drive it instead.
   ?theme=light|dark follows the app; ?accent=#rrggbb is the book's spine colour.
   Messages (same origin only): parent → offy-go {hash} · offy-theme {theme} · offy-stop
                                 page  → offy-book-route {hash} whenever the page changes view */
(function () {
  var qs = new URLSearchParams(location.search);
  if (!qs.has('embed')) return;
  var root = document.documentElement;
  root.classList.add('embed');
  var accent = qs.get('accent');
  if (accent && /^#[0-9a-f]{6}$/i.test(accent)) root.style.setProperty('--book', accent);

  function setTheme(t) {
    if (t !== 'dark' && t !== 'light') return;
    if (typeof window.applyTheme === 'function') { try { window.applyTheme(t); } catch (e) { } }
    root.setAttribute('data-theme', t);
  }
  // from disk (file://) the origin is "null": post to '*' and trust only the parent window as sender
  var TARGET = location.protocol === 'file:' || !location.origin || location.origin === 'null' ? '*' : location.origin;
  function report() { try { parent.postMessage({ type: 'offy-book-route', hash: location.hash }, TARGET); } catch (e) { } }
  function stop() {
    if (typeof window.stopAudio === 'function') { try { window.stopAudio(); } catch (e) { } }
    try { speechSynthesis.cancel(); } catch (e) { }
    document.querySelectorAll('audio').forEach(function (a) { a.pause(); });
  }

  setTheme(qs.get('theme'));
  // the pinyin page switches views with go() and replaceState (no hashchange) — report those too
  if (typeof window.go === 'function') {
    var go = window.go;
    window.go = function () { var r = go.apply(this, arguments); report(); return r; };
  }
  // the book changes chapter by changing this frame's #fragment; the pinyin page switches views with go()
  window.addEventListener('hashchange', function () {
    var v = location.hash.replace(/^#/, '');
    if (root.dataset.embedApp === 'pinyin' && typeof window.go === 'function' && v) { stop(); window.go(v); window.scrollTo(0, 0); }
    report();
  });
  window.addEventListener('message', function (e) {
    if (e.source !== parent || !e.data) return;
    var d = e.data;
    if (d.type === 'offy-theme') setTheme(d.theme);
    else if (d.type === 'offy-stop') stop();
    else if (d.type === 'offy-go' && d.hash) {
      stop();
      if (typeof window.go === 'function' && root.dataset.embedApp === 'pinyin') window.go(d.hash.replace(/^#/, ''));
      else if (location.hash !== d.hash) location.hash = d.hash;
      window.scrollTo(0, 0);
    }
  });
  window.addEventListener('load', function () { setTheme(qs.get('theme')); report(); });
})();
