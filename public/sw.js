// Minimal service worker: exists only so Chrome/Android recognize the app as
// installable. Deliberately does NOT call respondWith — leaving the fetch
// event unhandled means every request goes straight to the network exactly
// as if there were no service worker, so it can never serve stale cached
// content (a real risk while the app is still under active development,
// where every request should hit the live server).
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Intentionally empty.
});
