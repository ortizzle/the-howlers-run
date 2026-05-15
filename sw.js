// Howlers Service Worker — background polling + OS notifications
const ICON = './icon.svg';

let _gistId = '';
let _gistToken = '';
const _seenHowls = new Set();
const _seenWorkouts = new Set();

const SKIP_WORKOUTS = new Set([
  'trashtalk_fee','trashtalk_pot','motivate_fee','motivate_gift',
  'duel_win','duel_loss','milestone_bonus'
]);
const WORKOUT_LABELS = {
  long_run:'Long Run', tempo:'Tempo Run', easy_run:'Easy Run', walk_run:'Walk/Run',
  peloton:'Peloton', strength:'Strength', mobility:'Mobility', cardio:'Cardio',
  race:'Race Day 🏆', optional_run:'Optional Run', optional_other:'Cross-Train'
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Messages from the main page
self.addEventListener('message', e => {
  const msg = e.data;
  if (!msg || !msg.type) return;

  if (msg.type === 'SEED') {
    if (msg.gistId) _gistId = msg.gistId;
    if (msg.gistToken) _gistToken = msg.gistToken;
    if (Array.isArray(msg.howlIds)) msg.howlIds.forEach(id => _seenHowls.add(id));
    if (Array.isArray(msg.workoutIds)) msg.workoutIds.forEach(id => _seenWorkouts.add(id));
  }

  // Main page delegates notification display to SW so it's an OS-level alert
  if (msg.type === 'NOTIFY') {
    self.registration.showNotification(msg.title, {
      body: msg.body,
      icon: ICON,
      badge: ICON,
      tag: msg.tag || ('howlers-' + Date.now()),
      renotify: true,
      vibrate: [200, 100, 200]
    });
  }
});

// Tapping a notification opens the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const open = list.find(c => c.url.includes('/the-howlers-run'));
      if (open) return open.focus();
      return self.clients.openWindow('./');
    })
  );
});

// Periodic Background Sync — fires even when app is closed (Chrome/Android, requires install)
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-howls') e.waitUntil(poll());
});

async function poll() {
  if (!_gistId || !_gistToken) return;
  try {
    const res = await fetch('https://api.github.com/gists/' + _gistId, {
      headers: { Authorization: 'token ' + _gistToken, Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) return;
    const json = await res.json();

    let fileObj = json.files && json.files['howlers-data.json'];
    if (!fileObj && json.files) {
      const k = Object.keys(json.files).find(k => k.endsWith('.json'));
      if (k) fileObj = json.files[k];
    }
    let text = fileObj && fileObj.content;
    if (fileObj && fileObj.truncated && fileObj.raw_url) {
      text = await (await fetch(fileObj.raw_url, {
        headers: { Authorization: 'token ' + _gistToken }
      })).text();
    }
    if (!text) return;

    const data = JSON.parse(text);
    const players = data.players || [];

    for (const h of (data.howls || [])) {
      if (_seenHowls.has(h.id) || h.player_id === 'system') continue;
      _seenHowls.add(h.id);
      const p = players.find(x => x.id === h.player_id);
      if (!p) continue;
      await self.registration.showNotification('🐺 ' + p.name.split(' ')[0] + ' howled', {
        body: h.message.length > 100 ? h.message.slice(0, 100) + '…' : h.message,
        icon: ICON,
        badge: ICON,
        tag: 'howl-' + h.id,
        renotify: true,
        vibrate: [200, 100, 200]
      });
    }

    for (const w of (data.workouts || [])) {
      if (_seenWorkouts.has(w.id) || SKIP_WORKOUTS.has(w.workout)) continue;
      _seenWorkouts.add(w.id);
      const p = players.find(x => x.id === w.player_id);
      if (!p) continue;
      const label = w.milestone_label || WORKOUT_LABELS[w.workout] || w.workout;
      const detail = w.miles ? w.miles + ' mi' : (w.minutes ? w.minutes + ' min' : '');
      await self.registration.showNotification('🐺 ' + p.name.split(' ')[0] + ' logged a workout', {
        body: label + (detail ? ' · ' + detail : '') + ' · +' + (w.laurels_base || 0) + 'L',
        icon: ICON,
        badge: ICON,
        tag: 'workout-' + w.id,
        renotify: true,
        vibrate: [100, 50, 100]
      });
    }
  } catch (err) {
    console.warn('[Howlers SW] poll error:', err);
  }
}
