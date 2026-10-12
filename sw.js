// 오늘 뭐 먹지 서비스 워커
// - 화면(HTML)과 식당 목록(data/*.json)은 인터넷이 되면 항상 새로 받고, 안 되면 저장해 둔 걸 보여줘요.
// - 아이콘·글꼴은 한 번 받으면 저장해 두고 써요.
// - 네이버·카카오 지도는 건드리지 않아요 (항상 원래대로 인터넷에서 받아요).
// 파일을 바꿔 배포할 때는 VERSION만 올리면 예전 저장본이 정리돼요.
const VERSION = '2026-10-12-5';
const SHELL = `shell-${VERSION}`;
const FONTS = 'fonts-v1';
const PRECACHE = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png',
  './data/company.json', './data/restaurants.json', './data/cafes.json', './data/overrides.json', './data/zones.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('shell-') && k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req, cacheKey) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) cache.put(cacheKey || req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(cacheKey || req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 구글 폰트: 저장해 두고 재사용
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(req, FONTS));
    return;
  }
  // 다른 사이트(네이버·카카오 지도 등)는 그대로 통과
  if (url.origin !== self.location.origin) return;

  // 화면 이동: 새 화면 우선, 오프라인이면 저장본
  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req, './index.html'));
    return;
  }
  // 식당·카페 목록: 새 목록 우선
  if (url.pathname.includes('/data/')) {
    e.respondWith(networkFirst(req));
    return;
  }
  // 그 밖의 파일(아이콘 등): 저장본 우선
  e.respondWith(cacheFirst(req, SHELL));
});
