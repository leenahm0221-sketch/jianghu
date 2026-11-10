// 离线缓存：联网时每次都直接向服务器要最新版（不用浏览器缓存），断网时才用缓存
  const C = 'jianghu-v95-85aa85e2';
  self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png']))); });
  self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
  self.addEventListener('fetch', e => { if (e.request.method !== 'GET') return; e.respondWith(fetch(e.request, { cache: 'no-store' }).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request))); });
  