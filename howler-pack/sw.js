/* The Howler Pack service worker
   - offline app shell (network first for the page, so updates land quickly)
   - share target: Peloton app → Share → Howler Pack hands the screenshot/text to the workout reader
   - background check (Periodic Background Sync on installed Android apps): cheers for you + an evening nudge */
const SHELL = 'pack-shell-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './ortiz-drive.js'];
const TZ = 'America/Phoenix';

self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pack-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method === 'POST' && url.origin === location.origin && url.pathname.endsWith('/share-target')) { e.respondWith(receiveShare(req)); return; }
  if (req.method !== 'GET' || url.origin !== location.origin) return;           // GitHub, Claude, fonts: straight to the network
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(SHELL).then(c => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => { const net = fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); } return res; }).catch(() => hit); return hit || net; }));
});

async function receiveShare(req) {
  try {
    const form = await req.formData(), c = await caches.open('pack-share');
    const file = form.get('image'), text = [form.get('title'), form.get('text'), form.get('url')].filter(Boolean).join('\n');
    if (file && file.size) await c.put('shared-image', new Response(file, { headers: { 'Content-Type': file.type || 'image/jpeg' } }));
    if (text) await c.put('shared-text', new Response(text));
  } catch (e) { /* fall through to the app */ }
  return Response.redirect('./?share=1', 303);
}

// ── settings handed over by the page (stored in Cache Storage so they survive the worker sleeping)
self.addEventListener('message', e => { if (e.data && e.data.type === 'CONFIG') e.waitUntil(putJSON('config', e.data.config)); });
async function getJSON(key, fallback) { try { const r = await (await caches.open('pack-config')).match(key); return r ? await r.json() : fallback; } catch (e) { return fallback; } }
async function putJSON(key, val) { const c = await caches.open('pack-config'); await c.put(key, new Response(JSON.stringify(val), { headers: { 'Content-Type': 'application/json' } })); }

self.addEventListener('periodicsync', e => { if (e.tag === 'pack-check') e.waitUntil(check()); });

function azNow() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(new Date());
  const g = t => (parts.find(p => p.type === t) || {}).value;
  return { day: g('year') + '-' + g('month') + '-' + g('day'), hour: +g('hour') % 24 };
}
async function check() {
  const cfg = await getJSON('config', null); if (!cfg || !cfg.on || !cfg.gistId || !cfg.token || !cfg.me) return;
  let data;
  try {
    const res = await fetch('https://api.github.com/gists/' + cfg.gistId, { cache: 'no-store', headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json' } });
    if (!res.ok) return;
    const gist = await res.json(), f = gist.files && gist.files[cfg.file || 'howler-pack.json']; if (!f) return;
    data = JSON.parse(f.truncated ? await (await fetch(f.raw_url, { cache: 'no-store' })).text() : f.content);
  } catch (e) { return; }
  const recs = Object.values(data.records || {}).filter(r => !r.deleted), names = {};
  recs.filter(r => r.type === 'member').forEach(m => { names[m.mid] = m.name; });
  const seen = await getJSON('seen', null), now = azNow(), first = !seen, next = { ids: {}, nudged: (seen && seen.nudged) || '' };
  const cheers = recs.filter(r => r.type === 'cheer' && r.to === cfg.me);
  cheers.forEach(c => { next.ids[c.id] = 1; });
  if (!first) {
    const fresh = cheers.filter(c => !seen.ids[c.id]).slice(-3);
    for (const c of fresh) await self.registration.showNotification((names[c.from] || 'Family') + ' cheered you ' + c.emoji, { body: c.text || 'Keep going!', icon: './icon-192.png', badge: './icon-192.png', tag: 'cheer-' + c.id });
  }
  // Evening nudge: after 5pm, nothing logged today, once a day
  const movedToday = recs.some(r => r.type === 'workout' && r.member === cfg.me && r.date === now.day);
  if (!movedToday && now.hour >= 17 && now.hour < 21 && next.nudged !== now.day) {
    next.nudged = now.day;
    await self.registration.showNotification('Twenty minutes keeps the chain alive 🐺', { body: 'A walk with the dogs counts, ' + (cfg.name || 'Howler') + '.', icon: './icon-192.png', badge: './icon-192.png', tag: 'nudge' });
  }
  await putJSON('seen', next);
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => { const w = list.find(c => c.url.startsWith(self.registration.scope)); return w ? w.focus() : self.clients.openWindow('./'); }));
});
