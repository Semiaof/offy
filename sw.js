// Library of Limu · new offy v6 (lab) — offline support.
// Bump CACHE_NAME whenever app files change so old caches are dropped.
const CACHE_NAME = 'new-offy-v6-24';
const CORE_ASSETS = ['./', './index.html', './css/app.css', './css/v4.css', './css/five.css', './css/books5.css', './css/sbook.css', './css/refbooks.css', './css/cbook.css', './css/ibooks.css', './css/tree.css', './css/digi.css', './css/compose.css', './js/i18n-en.js', './js/core.js', './js/cloud.js', './js/play.js', './js/games.js', './js/app.js', './js/gami.js', './js/scene.js', './js/views.js', './data/words.js', './data/hsk.js', './data/synonyms.js', './js/books5.js', './js/gbook.js', './js/sbook.js', './js/refbooks.js', './js/cbook.js', './js/ibooks.js', './js/tree.js', './js/digi.js', './js/compose.js', './js/handpad.js', './js/hanzi.js', './js/credits.js', './js/five.js', './data/books.js', './manifest.json', './fonts/PinyinSans.woff', './fonts/KaiTi.woff', './icon.svg', './icons/icon-180.png', './icons/icon-192.png'];
// The Thai interface fonts come from Google Fonts. They are fetched and kept at install time
// (the stylesheet and every font file it points to), so even the very first offline start keeps its typeface.
const FONT_CSS = ['https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Serif+Thai:wght@600;700&display=swap'];

async function cacheFonts(cache) {
  for (const u of FONT_CSS) {
    try {
      const res = await fetch(u, { mode: 'cors' }); if (!res.ok) continue;
      const css = await res.clone().text(); await cache.put(u, res);
      const files = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]))];
      await Promise.all(files.map(f => fetch(f, { mode: 'cors' }).then(r => r.ok && cache.put(f, r)).catch(() => { })));
    } catch (e) { }
  }
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(c => Promise.all([c.addAll(CORE_ASSETS).catch(() => { }), cacheFonts(c)])));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network-first (always the newest files); the cache is only the offline fallback.
// Fonts and the stroke-order library from the CDNs are cached too, so they keep working offline once seen.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !/^https?:/.test(req.url) || /\/audio\/course\/|supabase\.co\//.test(req.url)) return;
  const same = new URL(req.url).origin === self.location.origin;
  const net = same ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  event.respondWith(net.then(res => {
    if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) { const c = res.clone(); caches.open(CACHE_NAME).then(x => x.put(req, c)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: same }).then(hit => hit || Response.error())));
});
