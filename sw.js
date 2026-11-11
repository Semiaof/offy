// Library of Limu · new offy v2 — offline support.
// Bump CACHE_NAME whenever app files change so old caches are dropped.
const CACHE_NAME = 'new-offy-v2-0';
const CORE_ASSETS = ['./', './index.html', './css/app.css', './js/core.js', './js/play.js', './js/app.js', './data/words.js', './data/books.js', './manifest.json', './icon.svg', './icons/icon-180.png', './icons/icon-192.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS).catch(() => {})));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network-first (always the newest files); the cache is only the offline fallback.
// Fonts and the stroke-order library from the CDNs are cached too, so they keep working offline once seen.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !/^https?:/.test(req.url)) return;
  const same = new URL(req.url).origin === self.location.origin;
  const net = same ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  event.respondWith(net.then(res => {
    if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) { const c = res.clone(); caches.open(CACHE_NAME).then(x => x.put(req, c)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: same }).then(hit => hit || Response.error())));
});
