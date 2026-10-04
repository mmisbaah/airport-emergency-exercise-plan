/* Service worker — offline support for the Airport Emergency Exercise Plan.
   The app is fully static, so caching the shell makes it work with zero
   connectivity (airport ops networks are unreliable).

   VERSION must be bumped whenever index.html / css / js change so stale
   caches are dropped on deploy (keep it in step with the ?v= versions). */

var VERSION = 'eop-20261004.47';
var SHELL_CACHE = 'eop-shell-' + VERSION;

var SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/data.js',
  './favicon.svg',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function (cache) { return cache.addAll(SHELL); })
      .catch(function () { /* one 404 must not break install */ })
  );
  // NOTE: no skipWaiting() here — the waiting worker activates naturally
  // once this page unloads; navigations are network-first, so updates
  // reach the user silently on their next reload (no toast).
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys
        .filter(function (k) { return k.indexOf('eop-shell-') === 0 && k !== SHELL_CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  // Navigations: network first (so new deploys show up), cached fallback.
  // Falls back on BOTH network errors and non-ok responses (proxies and
  // captive portals answer 5xx instead of failing the connection).
  if (req.mode === 'navigate') {
    event.respondWith(
      // fetch by URL (not req) — navigation requests carry redirect:'manual',
      // which would surface Pages' 308 (e.g. tests.html -> /tests/tests) as a
      // non-ok response and wrongly trigger the offline shell fallback
      fetch(req.url, { redirect: 'follow' }).then(function (resp) {
        if (resp && resp.ok) {
          // only the app shell itself may overwrite the cached index.html —
          // visits to /tests/ etc. must not corrupt the offline fallback
          var path = new URL(req.url).pathname;
          if (path === '/' || path.slice(-11) === '/index.html') {
            var copy = resp.clone();
            caches.open(SHELL_CACHE).then(function (c) { c.put('./index.html', copy); });
          }
          return resp;
        }
        // not ok (4xx/5xx) — serve the cached shell instead of an error page
        return caches.match('./index.html').then(function (hit) {
          return hit || resp;
        });
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Same-origin assets: cache first (URLs are version-busted via ?v=),
  // refresh in the background.
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: false }).then(function (hit) {
      if (hit) {
        // refresh best-effort (ignore failures)
        fetch(req).then(function (resp) {
          if (resp && resp.ok) {
            var copy = resp.clone();
            caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); });
          }
        }).catch(function () {});
        return hit;
      }
      return fetch(req).then(function (resp) {
        if (resp && resp.ok && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); });
          return resp;
        }
        // network failed or answered with an error → cached copy if we have one
        return caches.match(req, { ignoreSearch: false }).then(function (cached) {
          return cached || resp;
        });
      });
    })
  );
});
