/* ============================================================
   THE HOWLERS · FAMILY PACK — prototype engine (Season II: Iron Rain)
   Pack (adults): Merit = consistency + MET-based effort + progress + habits
   Pups (kids):   Paws  = consistency + moving minutes + together bonus
   Prototype only: in-memory state, simulated "today" = Fri Dec 18.
   (DOM/date helpers are prepended from engine.js by build.py)
   ============================================================ */

// ---------- Naming (placeholders until the family decides) ----------
const NAMES = { pack: 'Family Pack', adults: 'Proctors', kids: 'Pups', adultUnit: 'Merit', kidUnit: 'Fangs', adultOne: 'Proctor', kidOne: 'Pup' };

// ---------- Seasons: December is the trial run, then quarterly seasons ----------
const SEASONS = [
  { id: 's0', name: 'The Passage', sub: 'Trial run', start: '2026-12-01', end: '2026-12-31', trial: true },
  { id: 's1', name: 'Season 1', sub: 'Iron Rain', start: '2027-01-01', end: '2027-03-31' },
  { id: 's2', name: 'Season 2', sub: 'The Institute', start: '2027-04-01', end: '2027-06-30' },
  { id: 's3', name: 'Season 3', sub: 'Mars Rising', start: '2027-07-01', end: '2027-09-30' },
  { id: 's4', name: 'Season 4', sub: 'Siege of Luna', start: '2027-10-01', end: '2027-12-31' },
];
const TODAY = '2026-12-18';
const SEASON = Object.assign({ today: TODAY }, SEASONS.find(s => s.start <= TODAY && TODAY <= s.end));
const NEXT_SEASON = SEASONS[SEASONS.findIndex(s => s.id === SEASON.id) + 1];
// Rank thresholds are written for a 13-week season and scale with the season's length
const SEASON_SCALE = (daysBetween(SEASON.start, SEASON.end) + 1) / 91;
const DOGS = [{ id: 'cookie', name: 'Cookie', icon: '🍪' }, { id: 'biscuit', name: 'Biscuit', icon: '🥨' }];

const RULES = {
  pack: { activeMin: 20, activeMetMin: 100, activeDay: 15, standardDays: 4, standard: 50, effortDiv: 10, effortCap: 40, unit: NAMES.adultUnit, goalMonth: 50, goalSeason: 150 },
  pup:  { activeMin: 20, activeDay: 10, standardDays: 3, standard: 30, minPer: 5, minCap: 12, unit: NAMES.kidUnit, goalMonth: 25, goalSeason: 75 },
  chainStep: 0.10, chainMax: 5,
  together: 5, togetherDailyMax: 2,
  habit: 2, habitsMax: 3,
  weighIn: 5, stepPct: 0.5, stepPts: 25, weeklyPctCap: 1.0,
};

// MET values ≈ Compendium of Physical Activities, [easy, normal, brutal]. To be verified against the published tables before the real build.
const ACTIVITIES = [
  { id: 'tread', name: 'Tread', icon: '🏃', group: 'Peloton', met: [4.5, 8, 10.5], detail: 'tread' },
  { id: 'bike', name: 'Bike', icon: '🚴', group: 'Peloton', met: [5, 7, 9], detail: 'bike' },
  { id: 'strength', name: 'Strength', icon: '🏋️', group: 'Peloton', met: [3.5, 5, 6], adult: true },
  { id: 'yoga', name: 'Yoga', icon: '🧘', group: 'Peloton', met: [2.5, 3, 4] },
  { id: 'bootcamp', name: 'Bootcamp', icon: '🔥', group: 'Peloton', met: [6, 8, 9], adult: true },
  { id: 'dogwalk', name: 'Dog Walk', icon: '🐕', group: 'Together', met: [3, 3.5, 4.3], detail: 'dist' },
  { id: 'park', name: 'Park', icon: '🛝', group: 'Together', met: [3.5, 4.5, 5.8] },
  { id: 'hike', name: 'Hike', icon: '⛰️', group: 'Together', met: [5.3, 6, 7.8] },
  { id: 'ride', name: 'Bike Ride', icon: '🚵', group: 'Together', met: [6, 8, 10] },
  { id: 'swim', name: 'Swim', icon: '🏊', group: 'Together', met: [5.8, 7, 9.8] },
  { id: 'tkd', name: 'Taekwondo', icon: '🥋', group: 'Classes & Outside', met: [5.3, 7.5, 10.3] },
  { id: 'run', name: 'Run', icon: '👟', group: 'Classes & Outside', met: [8, 9.8, 11.5], detail: 'dist' },
  { id: 'walk', name: 'Walk', icon: '🚶', group: 'Classes & Outside', met: [3, 3.5, 4.3], detail: 'dist' },
  { id: 'sport', name: 'Sport', icon: '🏓', group: 'Classes & Outside', met: [4, 5, 7] },
  { id: 'play', name: 'Active Play', icon: '⚽', group: 'Classes & Outside', met: [3.5, 5, 6.5] },
];
const ACT = {}; ACTIVITIES.forEach(a => ACT[a.id] = a);
const FELT = { easy: { i: 0, label: 'Easy', ico: '🙂' }, normal: { i: 1, label: 'Normal', ico: '😤' }, brutal: { i: 2, label: 'Brutal', ico: '🥵' } };

// Per 13-week season. Ranks reset each season; the color you finish on goes in the Hall of Honors.
const RANK_BASE = [
  { name: 'Red', color: '#b3261e', adult: 0, kid: 0 }, { name: 'Gray', color: '#7a7f87', adult: 450, kid: 250 },
  { name: 'Obsidian', color: '#3a4f6e', adult: 1100, kid: 550 }, { name: 'Copper', color: '#a0572a', adult: 1900, kid: 900 },
  { name: 'Silver', color: '#a8b0bb', adult: 2800, kid: 1300 }, { name: 'Gold', color: '#d4a82a', adult: 3800, kid: 1750 },
  { name: 'Peerless', color: '#f2cf55', adult: 4800, kid: 2200 },
];
const PACK_RANKS = RANK_BASE.map(r => ({ name: r.name, color: r.color, min: Math.round(r.adult * SEASON_SCALE / 10) * 10 }));
const PUP_RANKS = RANK_BASE.map(r => ({ name: r.name, color: r.color, min: Math.round(r.kid * SEASON_SCALE / 10) * 10 }));
function rankFor(pts, pup) { const L = pup ? PUP_RANKS : PACK_RANKS; let i = 0; L.forEach((r, j) => { if (pts >= r.min) i = j; }); return { i, rank: L[i], next: L[i + 1] || null, list: L }; }

const MEMBERS = [
  { id: 'chris', name: 'Chris', title: 'Primus', house: '#9a1010', pup: false, habits: ['8k steps', 'Protein first', 'No late snacks'],
    usuals: [{ act: 'tread', min: 30 }, { act: 'bike', min: 45 }, { act: 'strength', min: 20 }, { act: 'dogwalk', min: 30, together: true }] },
  { id: 'kat', name: 'Kat', title: 'Obsidian', house: '#1e3858', pup: false, habits: ['Water 80oz', '8k steps', 'Sleep 7h'],
    usuals: [{ act: 'bike', min: 30 }, { act: 'yoga', min: 20 }, { act: 'dogwalk', min: 30, together: true }, { act: 'park', min: 60, together: true }] },
  { id: 'sedona', name: 'Sedona', title: 'Violet', house: '#6a2aa8', pup: true, age: 13 },
  { id: 'river', name: 'River', title: 'Copper', house: '#b0601e', pup: true, age: 10 },
];
// Kids' big buttons (everything except adult-only Peloton strength/bootcamp is still under "Something else")
const PUP_BUTTONS = [{ act: 'tkd', min: 60 }, { act: 'dogwalk', min: 30 }, { act: 'park', min: 60 }, { act: 'play', min: 30 },
  { act: 'run', min: 20 }, { act: 'walk', min: 30 }, { act: 'hike', min: 60 }, { act: 'yoga', min: 20 },
  { act: 'ride', min: 30 }, { act: 'bike', min: 20 }, { act: 'tread', min: 20 }];
const MEM = {}; MEMBERS.forEach(m => MEM[m.id] = m);
const TKD_DAYS = [0, 3]; // Mon & Thu
const KIDS = MEMBERS.filter(m => m.pup).map(m => m.id);

const S = { workouts: [], weighins: [], habits: {}, goals: {}, me: 'chris', seen: {} };
let _id = 1; function nid() { return 'x' + (_id++); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- Goals: monthly + season (quarterly). December goals are practice. ----------
const GOAL_TYPES = {
  activeDays: { label: n => n + ' Active Days', icon: '📅', unit: 'days', who: 'all', val: (mid, a, b) => activeDaysIn(mid, a, b) },
  standards:  { label: n => 'Hit the Standard ' + n + ' weeks', icon: '✦', unit: 'weeks', who: 'all', val: (mid, a, b) => score(mid).weeks.filter(w => w.standard && w.key >= weekKey(a) && w.key <= b).length },
  minutes:    { label: n => n.toLocaleString() + ' minutes moving', icon: '⏱️', unit: 'min', who: 'all', val: (mid, a, b) => minutesIn(mid, a, b) },
  tkd:        { label: n => n + ' Taekwondo classes', icon: '🥋', unit: 'classes', who: 'kid', val: (mid, a, b) => countIn(mid, a, b, w => w.act === 'tkd') },
  dogs:       { label: n => 'Walk Cookie & Biscuit ' + n + ' times', icon: '🐕', unit: 'walks', who: 'all', val: (mid, a, b) => countIn(mid, a, b, w => w.act === 'dogwalk') },
  outside:    { label: n => n + ' outside sessions', icon: '🌵', unit: 'sessions', who: 'all', val: (mid, a, b) => countIn(mid, a, b, w => ['Together', 'Classes & Outside'].includes(ACT[w.act].group)) },
  peloton:    { label: n => n + ' Peloton classes', icon: '🚴', unit: 'classes', who: 'all', val: (mid, a, b) => countIn(mid, a, b, w => ACT[w.act].group === 'Peloton') },
  weight:     { label: n => 'Trend down ' + n + '%', icon: '⚖️', unit: '%', who: 'adult', private: true, step: 0.5, val: (mid, a, b) => trendPct(mid, a, b) },
};
function inWin(w, mid, a, b) { return w.member === mid && w.date >= a && w.date <= b && w.date <= SEASON.today; }
function countIn(mid, a, b, fn) { return S.workouts.filter(w => inWin(w, mid, a, b) && fn(w)).length; }
function minutesIn(mid, a, b) { return S.workouts.filter(w => inWin(w, mid, a, b)).reduce((s, w) => s + w.min, 0); }
function activeDaysIn(mid, a, b) { const sc = score(mid); return Object.keys(sc.day).filter(d => d >= a && d <= b && sc.isActive(d)).length; }
function trendPct(mid, a, b) { const ws = S.weighins.filter(w => w.member === mid && w.date >= a && w.date <= b && w.date <= SEASON.today).sort((x, y) => x.date < y.date ? -1 : 1); if (ws.length < 2) return 0; let t = ws[0].lbs; ws.forEach(w => t += 0.3 * (w.lbs - t)); return Math.max(0, Math.round((ws[0].lbs - t) / ws[0].lbs * 1000) / 10); }
function monthWindow() { const d = SEASON.today; const y = +d.slice(0, 4), m = +d.slice(5, 7); const end = toK(new Date(Date.UTC(y, m, 0))); return { a: d.slice(0, 8) + '01', b: end, name: ['January','February','March','April','May','June','July','August','September','October','November','December'][m - 1] }; }
function goalStatus(mid, g, scope) {
  const win = scope === 'month' ? monthWindow() : { a: SEASON.start, b: SEASON.end };
  const v = GOAL_TYPES[g.type].val(mid, win.a, win.b);
  const elapsed = (daysBetween(win.a, SEASON.today) + 1) / (daysBetween(win.a, win.b) + 1);
  return { v, pct: Math.min(1, v / g.target), done: v >= g.target, onPace: v >= g.target * elapsed * 0.95, elapsed };
}
// Suggest next-season goals from what each person actually did in the trial run
function suggestGoals(mid) {
  const m = MEM[mid], days = daysBetween(SEASON.start, SEASON.today) + 1, per = x => x / days;
  const ad = activeDaysIn(mid, SEASON.start, SEASON.today), dogs = countIn(mid, SEASON.start, SEASON.today, w => w.act === 'dogwalk');
  const out = [{ type: 'activeDays', target: Math.min(24, Math.max(8, Math.round(per(ad) * 31))), why: 'you averaged ' + (per(ad) * 7).toFixed(1) + ' active days a week in December' + (per(ad) * 31 > 24 ? ', capped at 24 so rest days stay guilt-free' : '') }];
  if (m.pup) out.push({ type: 'tkd', target: 8, why: 'twice a week, every week' });
  out.push({ type: 'dogs', target: Math.max(4, Math.round(per(dogs) * 31)), why: 'Cookie & Biscuit say thanks' });
  if (!m.pup) out.push({ type: 'weight', target: 2, why: 'about 0.5% a week, a steady healthy pace', private: true });
  return out;
}

function logGroup(members, base) { const g = members.length > 1 ? nid() : null; const ids = []; members.forEach(mid => { const id = nid(); ids.push(id); S.workouts.push(Object.assign({ id, member: mid, group: g }, base)); }); return ids; }

function seedDemo() {
  const r = mulberry32(7);
  range(SEASON.start, addDays(SEASON.today, -1)).forEach((d, i) => {
    const wd = dow(d), weekend = wd >= 5;
    // Taekwondo Mon/Thu for both kids (Dec 17 left unlogged to show the catch-up prompt)
    if (TKD_DAYS.includes(wd) && d !== '2026-12-17') logGroup(KIDS, { date: d, act: 'tkd', min: 60, felt: 'normal', by: 'kat' });
    // Family dog walk most days, random crew
    if (r() < 0.6) { const crew = MEMBERS.map(m => m.id).filter(() => r() < 0.55); if (crew.length) logGroup(crew, { date: d, act: 'dogwalk', min: 20 + Math.floor(r() * 3) * 5, felt: 'easy', dogs: r() < 0.6 ? ['cookie', 'biscuit'] : [r() < 0.5 ? 'cookie' : 'biscuit'] }); }
    // Park on weekends
    if (weekend && r() < 0.7) logGroup(['sedona', 'river', r() < 0.5 ? 'kat' : 'chris'], { date: d, act: 'park', min: 60 + Math.floor(r() * 3) * 15, felt: 'normal' });
    // Kids extra play
    KIDS.forEach(k => { if (!weekend && !TKD_DAYS.includes(wd) && r() < 0.3) S.workouts.push({ id: nid(), member: k, date: d, act: ['play', 'ride', 'bike', 'run', 'yoga'][Math.floor(r() * 5)], min: [20, 30][Math.floor(r() * 2)], felt: 'normal' }); });
    // Adults Peloton
    [['chris', 0.72, ['tread', 'bike', 'strength', 'tread']], ['kat', 0.6, ['bike', 'yoga', 'strength', 'bike']]].forEach(([mid, p, acts]) => {
      if (r() < p) {
        const act = acts[Math.floor(r() * acts.length)], min = [20, 30, 30, 45][Math.floor(r() * 4)];
        const felt = r() < 0.3 ? 'brutal' : r() < 0.6 ? 'normal' : 'easy';
        const detail = act === 'tread' && r() < 0.6 ? { mph: Math.round((3.2 + r() * 3) * 10) / 10, incline: Math.round(r() * 8) } : act === 'bike' && r() < 0.6 ? { watts: 110 + Math.round(r() * 80) } : null;
        S.workouts.push({ id: nid(), member: mid, date: d, act, min, felt, detail });
      }
    });
    // Adult habits + weigh-ins
    [['chris', 214, 0.21, 0.85], ['kat', 158, 0.07, 0.5]].forEach(([mid, start, rate, p]) => {
      (S.habits[mid] = S.habits[mid] || {})[d] = MEM[mid].habits.map(() => r() < 0.7);
      if (i === 0 || r() < p) S.weighins.push({ member: mid, date: d, lbs: Math.round((start - rate * i + (i ? (r() - 0.5) * 1.6 : 0)) * 10) / 10 });
    });
  });
  S.goals = {
    chris:  { month: [{ type: 'activeDays', target: 20 }, { type: 'peloton', target: 14 }, { type: 'weight', target: 2 }], season: [{ type: 'standards', target: 4 }] },
    kat:    { month: [{ type: 'activeDays', target: 16 }, { type: 'dogs', target: 15 }, { type: 'weight', target: 1.5 }], season: [{ type: 'standards', target: 3 }] },
    sedona: { month: [{ type: 'activeDays', target: 14 }, { type: 'tkd', target: 8 }], season: [{ type: 'minutes', target: 900 }] },
    river:  { month: [{ type: 'activeDays', target: 14 }, { type: 'outside', target: 10 }], season: [{ type: 'tkd', target: 8 }] },
  };
}

// ---------- Effort math ----------
function acsmMet(mph, gradePct) {
  const v = mph * 26.8224, g = (gradePct || 0) / 100; // m/min
  const vo2 = mph >= 4.5 ? 3.5 + 0.2 * v + 0.9 * v * g : 3.5 + 0.1 * v + 1.8 * v * g;
  return vo2 / 3.5;
}
function bikeMet(w) { return w <= 50 ? 3.5 : w <= 89 ? 4.8 : w <= 100 ? 6.8 : w <= 160 ? 8.8 : w <= 200 ? 11 : 14; }
function metFor(w) {
  const a = ACT[w.act], d = w.detail || {};
  if (w.act === 'tread' && d.mph) return { met: acsmMet(d.mph, d.incline), how: d.mph + ' mph · ' + (d.incline || 0) + '% incline' };
  if (w.act === 'bike' && d.watts) return { met: bikeMet(d.watts), how: d.watts + ' W avg' };
  if (a.detail === 'dist' && d.miles) { const mph = d.miles / (w.min / 60); return { met: acsmMet(mph, 0), how: d.miles + ' mi · ' + mph.toFixed(1) + ' mph' }; }
  return { met: a.met[FELT[w.felt || 'normal'].i], how: FELT[w.felt || 'normal'].label };
}

// ---------- Scoring ----------
function score(mid) {
  const m = MEM[mid], R = m.pup ? RULES.pup : RULES.pack, today = SEASON.today;
  const ledger = []; const add = (date, cat, label, pts) => { if (pts) ledger.push({ date, cat, label, pts }); };
  const day = {};
  S.workouts.filter(w => w.member === mid && w.date >= SEASON.start && w.date <= today).sort((a, b) => a.date < b.date ? -1 : 1).forEach(w => {
    const d = day[w.date] || (day[w.date] = { min: 0, metMin: 0, eff: 0, tog: 0, list: [] });
    const mm = metFor(w); d.min += w.min; d.metMin += mm.met * w.min; d.list.push(w);
    let pts;
    if (m.pup) { pts = Math.max(0, Math.min(Math.floor(w.min / R.minPer), R.minCap - d.eff)); add(w.date, 'effort', ACT[w.act].name + ' · ' + w.min + ' min' + (w.by && w.by !== mid ? ' (added by ' + MEM[w.by].name + ')' : ''), pts); }
    else { pts = Math.max(0, Math.min(Math.round(mm.met * w.min / R.effortDiv), R.effortCap - d.eff)); add(w.date, 'effort', ACT[w.act].name + ' · ' + w.min + ' min · ' + mm.met.toFixed(1) + ' MET (' + mm.how + ')', pts); }
    d.eff += pts;
    if (w.group && d.tog < RULES.togetherDailyMax) {
      d.tog++; const with_ = S.workouts.filter(x => x.group === w.group && x.member !== mid).map(x => MEM[x.member].name);
      add(w.date, 'together', 'Together with ' + with_.join(' & '), RULES.together);
    }
  });
  const isActive = d => day[d] && (day[d].min >= R.activeMin || (!m.pup && day[d].metMin >= R.activeMetMin));
  const weeks = []; let chain = 0;
  for (let wk = weekKey(SEASON.start); wk <= today; wk = addDays(wk, 7)) {
    const wEnd = addDays(wk, 6), complete = wEnd < today, ds = range(wk, wEnd).filter(d => d >= SEASON.start && d <= today);
    let active = 0, std = false, base = 0;
    ds.forEach(d => {
      if (isActive(d)) { active++; add(d, 'consistency', 'Active Day', R.activeDay); base += R.activeDay;
        if (active === R.standardDays) { std = true; add(d, 'consistency', (m.pup ? 'Pup' : 'Weekly') + ' Standard met', R.standard); base += R.standard; } }
      if (day[d]) base += day[d].eff;
      const hb = !m.pup && (S.habits[mid] || {})[d];
      if (hb) { const n = Math.min(hb.filter(Boolean).length, RULES.habitsMax); add(d, 'habits', 'Habits ' + n + '/3', n * RULES.habit); }
    });
    const mult = 1 + RULES.chainStep * chain, bonus = Math.round(base * (mult - 1));
    add(complete ? wEnd : today, 'consistency', 'Chain bonus ×' + mult.toFixed(1), bonus);
    weeks.push({ key: wk, complete, active, standard: std, mult });
    if (complete) chain = std ? Math.min(chain + 1, RULES.chainMax) : Math.max(chain - 1, 0);
  }
  let pctLost = null;
  if (!m.pup) {
    const ws = S.weighins.filter(w => w.member === mid && w.date <= today).sort((a, b) => a.date < b.date ? -1 : 1);
    if (ws.length) { const start = ws[0].lbs; let trend = start, low = start, cred = 0; const seen = {}, wkStart = {};
      ws.forEach(w => { trend += 0.3 * (w.lbs - trend); low = Math.min(low, trend); const wk = weekKey(w.date);
        if (!seen[wk]) { seen[wk] = 1; wkStart[wk] = cred; add(w.date, 'progress', 'Weekly weigh-in', RULES.weighIn); }
        const t = Math.floor(Math.min((start - low) / start * 100, wkStart[wk] + RULES.weeklyPctCap) / RULES.stepPct) * RULES.stepPct;
        if (t > cred) { add(w.date, 'progress', 'New trend low · ' + t.toFixed(1) + '%', Math.round((t - cred) / RULES.stepPct) * RULES.stepPts); cred = t; } });
      pctLost = (start - trend) / start * 100; }
  }
  let total = 0; const byWeek = {}; ledger.forEach(e => { total += e.pts; const k = weekKey(e.date); byWeek[k] = (byWeek[k] || 0) + e.pts; });
  ledger.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const cur = weeks[weeks.length - 1];
  return { m, R, total, ledger, day, weeks, cur, chain: Math.round((cur.mult - 1) / RULES.chainStep), isActive, byWeek, pctLost, rank: rankFor(total, m.pup) };
}
function scoreAll() { const o = {}; MEMBERS.forEach(m => o[m.id] = score(m.id)); return o; }

function count(fn) { return S.workouts.filter(w => w.date <= SEASON.today && fn(w)).length; }
function groupsOf(act) { const g = {}; S.workouts.filter(w => w.group && w.act === act && w.date <= SEASON.today).forEach(w => g[w.group] = 1); return Object.keys(g).length; }
function dogWalks(dogId) { const g = {}; S.workouts.filter(w => w.act === 'dogwalk' && w.date <= SEASON.today && (w.dogs || []).includes(dogId)).forEach(w => g[w.group || w.id] = 1); return Object.keys(g).length; }
function familyQuests() {
  const togetherMin = (() => { const g = {}; S.workouts.filter(w => w.group && w.date <= SEASON.today).forEach(w => g[w.group] = w.min); return Object.values(g).reduce((a, b) => a + b, 0); })();
  return [
    { icon: '🐕', name: 'Walkies', desc: 'Cookie & Biscuit family walks (2+ of us)', val: groupsOf('dogwalk'), goal: 40, reward: '+50 each' },
    { icon: '🛝', name: 'Park Patrol', desc: 'Family park trips', val: groupsOf('park'), goal: 15, reward: '+40 each' },
    { icon: '⏳', name: 'Hours Together', desc: 'Minutes moving as a family', val: togetherMin, goal: 3000, reward: '+75 each' },
  ];
}
function pupBadges(mid) {
  return [
    { icon: '🥋', name: 'Black Belt Bound', v: count(w => w.member === mid && w.act === 'tkd'), tiers: [4, 16, 32] },
    { icon: '🐕', name: 'Best Friend', v: count(w => w.member === mid && w.act === 'dogwalk'), tiers: [5, 20, 50] },
    { icon: '🛝', name: 'Park Ranger', v: count(w => w.member === mid && w.act === 'park'), tiers: [3, 10, 25] },
    { icon: '🐾', name: 'Paw Prints', v: Object.keys(score(mid).day).filter(d => score(mid).isActive(d)).length, tiers: [5, 25, 60] },
  ].map(b => Object.assign(b, { tier: b.tiers.filter(t => b.v >= t).length }));
}

// ---------- Peloton CSV import (free: Profile → Workouts → Download Workouts) ----------
function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c; }
  if (f || row.length) { row.push(f); rows.push(row); }
  const head = rows.shift() || []; return rows.filter(r => r.length > 3).map(r => { const o = {}; head.forEach((h, i) => o[h.trim()] = (r[i] || '').trim()); return o; });
}
function pelotonToWorkouts(rows, mid) {
  const map = { cycling: 'bike', running: 'tread', walking: 'tread', strength: 'strength', yoga: 'yoga', stretching: 'yoga', bootcamp: 'bootcamp', 'bike bootcamp': 'bootcamp', 'tread bootcamp': 'bootcamp', outdoor: 'walk' };
  return rows.map(r => {
    const disc = (r['Fitness Discipline'] || '').toLowerCase(), act = map[disc];
    const date = (r['Workout Timestamp'] || '').slice(0, 10), min = parseFloat(r['Length (minutes)']);
    if (!act || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !(min > 0)) return { skip: true, title: r['Title'] || disc || 'Unknown', reason: act ? 'missing data' : 'not counted (' + (disc || '?') + ')' };
    const detail = {}; const mph = parseFloat(r['Avg. Speed (mph)']), inc = parseFloat(r['Avg. Incline']), watts = parseFloat(r['Avg. Watts']);
    if (act === 'tread' && mph > 0) { detail.mph = mph; detail.incline = inc > 0 ? inc : 0; }
    if (act === 'bike' && watts > 0) detail.watts = watts;
    const w = { member: mid, date, act, min, felt: 'normal', detail: Object.keys(detail).length ? detail : null, title: r['Title'], instructor: r['Instructor Name'] };
    w.dupe = S.workouts.some(x => x.member === mid && x.date === date && x.act === act && x.min === min);
    return w;
  });
}
const SAMPLE_CSV = 'Workout Timestamp,Live/On-Demand,Instructor Name,Length (minutes),Fitness Discipline,Type,Title,Class Timestamp,Total Output,Avg. Watts,Avg. Resistance,Avg. Cadence (RPM),Avg. Speed (mph),Distance (mi),Calories Burned,Avg. Heartrate,Avg. Incline,Avg. Pace (min/mi)\n' +
  '2026-12-18 06:05 (MST),On Demand,Instructor A,30,Running,Intervals,"30 min Hills & Intervals Run",2026-11-02 05:00 (MST),,,,,5.6,2.81,365,152,4.5,10.71\n' +
  '2026-12-18 06:40 (MST),On Demand,Instructor B,10,Stretching,Post-Run,10 min Post-Run Stretch,2026-10-12 08:00 (MST),,,,,,,32,,,\n' +
  '2026-12-17 19:30 (MST),Live,Instructor C,45,Cycling,Climb,"45 min Climb Ride",2026-12-17 19:30 (MST),498,184,47,78,,14.2,520,149,,\n' +
  '2026-12-16 07:00 (MST),On Demand,Instructor D,10,Meditation,Sleep,10 min Sleep Meditation,2026-09-01 20:00 (MST),,,,,,,,,,\n';

// ---------- UI primitives ----------
let _undo = null;
function toast(msg, actionLabel, action) {
  let t = document.getElementById('toast'); if (!t) { t = h('div', { id: 'toast', class: 'toast' }); document.body.appendChild(t); }
  clear(t).appendChild(h('span', null, msg));
  if (actionLabel) t.appendChild(h('button', { class: 'toast-act', type: 'button', onclick: () => { t.classList.remove('show'); action(); } }, actionLabel));
  t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), actionLabel ? 5000 : 3000);
}
function openModal(title, bodyEl) {
  const back = h('div', { class: 'modal-back' }); const close = () => back.remove();
  back.addEventListener('click', e => { if (e.target === back) close(); });
  back.appendChild(h('div', { class: 'modal' }, h('div', { class: 'modal-head' }, h('div', { class: 'modal-title' }, title), h('button', { class: 'modal-x', type: 'button', 'aria-label': 'Close', onclick: close }, '×')), bodyEl));
  document.body.appendChild(back); return close;
}
function gainFor(mids, fn) { const before = {}; mids.forEach(id => before[id] = score(id).total); fn(); const out = {}; mids.forEach(id => out[id] = score(id).total - before[id]); return out; }
function gainText(g) { return Object.keys(g).map(id => MEM[id].name + ' +' + g[id] + ' ' + (MEM[id].pup ? NAMES.kidUnit : NAMES.adultUnit) + (g[id] === 0 ? ' (today\'s effort cap reached)' : '')).join(' · '); }

// One-tap usual: logs immediately, offers Undo
function quickUsual(u, onDone) {
  const crew = u.together ? [S.me].concat(MEMBERS.filter(m => m.id !== S.me && m.pup).map(m => m.id)) : [S.me];
  let ids; const g = gainFor(crew, () => { ids = logGroup(crew, { date: SEASON.today, act: u.act, min: u.min, felt: 'normal', by: S.me, dogs: u.act === 'dogwalk' ? ['cookie', 'biscuit'] : null }); });
  onDone(); toast(ACT[u.act].icon + ' ' + gainText(g), 'Undo', () => { S.workouts = S.workouts.filter(w => !ids.includes(w.id)); onDone(); });
}

// Full log sheet: activity, duration chips, who moved, optional felt/details
function openLog(onDone, preset) {
  const me = MEM[S.me];
  const f = { act: (preset && preset.act) || (me.pup ? 'tkd' : 'tread'), min: (preset && preset.min) || 30, felt: 'normal', crew: [S.me], detail: {}, open: false, dogs: ['cookie', 'biscuit'] };
  const body = h('div', { class: 'log-body' }), preview = h('div', { class: 'log-preview' });
  function draw() {
    clear(body);
    const anyAdult = f.crew.some(id => !MEM[id].pup);
    // activities
    const grid = h('div', { class: 'act-grid' }); let lastG = '';
    ACTIVITIES.filter(a => !(me.pup && a.adult)).forEach(a => {
      if (a.group !== lastG) { lastG = a.group; grid.appendChild(h('div', { class: 'act-group' }, a.group)); }
      grid.appendChild(h('button', { class: 'act-btn' + (f.act === a.id ? ' on' : ''), type: 'button', onclick: () => { f.act = a.id; f.detail = {}; draw(); } }, h('span', { class: 'act-ico' }, a.icon), h('span', null, a.name)));
    });
    if (!me.pup) body.appendChild(h('button', { class: 'ai-btn', type: 'button', onclick: () => { close(); openAIReader(onDone); } }, '✨ Paste or snap a workout instead'));
    body.appendChild(h('label', { class: 'fld' }, 'What'));
    body.appendChild(grid);
    if (f.act === 'dogwalk') {
      body.appendChild(h('label', { class: 'fld' }, 'Which pups?'));
      body.appendChild(h('div', { class: 'chips' }, DOGS.map(dg => h('button', { class: 'chip-btn' + (f.dogs.includes(dg.id) ? ' on' : ''), type: 'button',
        onclick: () => { f.dogs = f.dogs.includes(dg.id) ? f.dogs.filter(x => x !== dg.id) : f.dogs.concat(dg.id); if (!f.dogs.length) f.dogs = [dg.id]; draw(); } }, dg.icon + ' ' + dg.name))));
    }
    body.appendChild(h('label', { class: 'fld' }, 'How long'));
    body.appendChild(h('div', { class: 'chips' }, [10, 20, 30, 45, 60, 90].map(n => h('button', { class: 'chip-btn' + (f.min === n ? ' on' : ''), type: 'button', onclick: () => { f.min = n; draw(); } }, n + 'm'))));
    body.appendChild(h('label', { class: 'fld' }, 'Who moved? ', h('small', null, 'one entry logs for everyone')));
    body.appendChild(h('div', { class: 'chips' }, MEMBERS.map(m => h('button', { class: 'chip-btn who' + (f.crew.includes(m.id) ? ' on' : ''), type: 'button', style: '--house:' + m.house,
      onclick: () => { f.crew = f.crew.includes(m.id) ? f.crew.filter(x => x !== m.id) : f.crew.concat(m.id); if (!f.crew.length) f.crew = [S.me]; draw(); } }, (m.pup ? '🐾 ' : '') + m.name))));
    if (anyAdult) {
      body.appendChild(h('label', { class: 'fld' }, 'How did it feel? ', h('small', null, 'adults only · nudges effort ±')));
      body.appendChild(h('div', { class: 'chips' }, Object.keys(FELT).map(k => h('button', { class: 'chip-btn' + (f.felt === k ? ' on' : ''), type: 'button', onclick: () => { f.felt = k; draw(); } }, FELT[k].ico + ' ' + FELT[k].label))));
      const kind = ACT[f.act].detail;
      if (kind) {
        body.appendChild(h('button', { class: 'more-btn', type: 'button', onclick: () => { f.open = !f.open; draw(); } }, (f.open ? '▾ ' : '▸ ') + 'Add details for exact points (optional)'));
        if (f.open) {
          const num = (key, label, ph) => h('label', { class: 'num' }, label, h('input', { type: 'number', inputmode: 'decimal', step: '0.1', placeholder: ph, value: f.detail[key] || '', oninput: e => { const v = parseFloat(e.target.value); if (v > 0) f.detail[key] = v; else delete f.detail[key]; upd(); } }));
          const row = h('div', { class: 'num-row' });
          if (kind === 'tread') { row.appendChild(num('mph', 'Avg speed (mph)', '4.0')); row.appendChild(num('incline', 'Avg incline (%)', '3')); }
          if (kind === 'bike') row.appendChild(num('watts', 'Avg output (watts)', '150'));
          if (kind === 'dist') row.appendChild(num('miles', 'Distance (miles)', '1.5'));
          body.appendChild(row);
          body.appendChild(h('div', { class: 'hint' }, 'These are on the Peloton summary screen. Skip them and the activity type plus "how it felt" fills in.'));
        }
      }
    }
    body.appendChild(preview);
    body.appendChild(h('button', { class: 'btn-primary', type: 'button', onclick: save }, 'Log it'));
    upd();
  }
  function base() { return { date: SEASON.today, act: f.act, min: f.min, felt: f.felt, by: S.me, dogs: f.act === 'dogwalk' ? f.dogs.slice() : null, detail: Object.keys(f.detail).length ? Object.assign({}, f.detail) : null }; }
  function upd() {
    const snap = S.workouts.slice(); const g = gainFor(f.crew, () => logGroup(f.crew, base())); S.workouts = snap;
    clear(preview).appendChild(h('div', { class: 'gain' }, f.crew.map(id => h('span', null, h('b', null, '+' + g[id]), ' ' + MEM[id].name))));
    if (!MEM[f.crew[0]].pup) { const mm = metFor(Object.assign({ member: f.crew[0] }, base())); preview.appendChild(h('div', { class: 'hint' }, ACT[f.act].name + ' ≈ ' + mm.met.toFixed(1) + ' MET · ' + mm.how)); }
  }
  function save() { const crew = f.crew.slice(); let ids; const g = gainFor(crew, () => { ids = logGroup(crew, base()); }); close(); onDone(); toast(ACT[f.act].icon + ' ' + gainText(g), 'Undo', () => { S.workouts = S.workouts.filter(w => !ids.includes(w.id)); onDone(); }); }
  const close = openModal(me.pup ? 'What did you do? 🐾' : 'Log a Trial', body);
  draw();
}

function openImport(onDone) {
  const body = h('div', { class: 'log-body' });
  const file = h('input', { type: 'file', accept: '.csv,text/csv', style: 'display:none', onchange: e => { const fl = e.target.files[0]; if (!fl) return; const rd = new FileReader(); rd.onload = () => show(rd.result); rd.readAsText(fl); } });
  function show(text) {
    const list = pelotonToWorkouts(parseCSV(text), S.me), fresh = list.filter(w => !w.skip && !w.dupe);
    clear(body).appendChild(h('div', { class: 'hint', style: 'margin-bottom:8px' }, 'Found ' + list.length + ' workouts · ' + fresh.length + ' new'));
    list.forEach(w => body.appendChild(h('div', { class: 'imp-row' + (w.skip || w.dupe ? ' off' : '') },
      h('span', { class: 'act-ico' }, w.skip ? '·' : ACT[w.act].icon),
      h('span', { class: 'll' }, w.title || '', h('small', null, w.skip ? w.reason : fmtShort(w.date) + ' · ' + w.min + ' min · ' + metFor(w).met.toFixed(1) + ' MET' + (w.dupe ? ' · already logged' : ''))))));
    body.appendChild(h('button', { class: 'btn-primary', type: 'button', style: 'margin-top:14px', onclick: () => {
      const g = gainFor([S.me], () => fresh.forEach(w => S.workouts.push({ id: nid(), member: w.member, date: w.date, act: w.act, min: w.min, felt: w.felt, detail: w.detail })));
      close(); onDone(); toast('Imported ' + fresh.length + ' · ' + gainText(g)); } }, 'Add ' + fresh.length + ' workouts'));
  }
  body.appendChild(h('p', { class: 'hint', style: 'font-size:14px' }, 'On onepeloton.com: Profile → Workouts → Download Workouts. Drop the file here once a week. Pace, incline and watts come along automatically.'));
  body.appendChild(file);
  body.appendChild(h('button', { class: 'btn-primary', type: 'button', style: 'margin-top:12px', onclick: () => file.click() }, 'Choose Peloton CSV'));
  body.appendChild(h('button', { class: 'more-btn', type: 'button', style: 'margin-top:8px;width:100%', onclick: () => show(SAMPLE_CSV) }, 'Try it with a sample file'));
  const close = openModal('Import from Peloton', body);
}

// ---------- Settings (API key lives only in this browser's localStorage) ----------
const KEY_NAME = 'howlers_family_anthropic_key';
function getKey() { try { return localStorage.getItem(KEY_NAME) || ''; } catch (e) { return ''; } }
function setKey(v) { try { if (v) localStorage.setItem(KEY_NAME, v); else localStorage.removeItem(KEY_NAME); } catch (e) { /* private mode */ } }
function openSettings(onDone) {
  const inp = h('input', { type: 'password', class: 'lbs-input', placeholder: 'sk-ant-…', value: getKey(), autocomplete: 'off' });
  const body = h('div', { class: 'log-body' },
    h('p', { class: 'hint', style: 'font-size:14px' }, 'Your Claude API key powers the workout reader and the coaches. It is stored only on this phone, never in the app code or the shared family data.'),
    h('label', { class: 'fld' }, 'Claude API key'), inp,
    h('button', { class: 'btn-primary', type: 'button', style: 'margin-top:14px', onclick: () => { setKey(inp.value.trim()); close(); toast(inp.value.trim() ? 'Key saved on this phone' : 'Key removed'); if (onDone) onDone(); } }, 'Save'));
  const close = openModal('Settings', body);
}

// ---------- AI workout reader: paste text or snap the Peloton summary ----------
const AI_MODEL = 'claude-opus-5-5';
const WORKOUT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['workouts'],
  properties: { workouts: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['activity', 'minutes', 'title'],
    properties: {
      activity: { type: 'string', enum: ACTIVITIES.map(a => a.id).concat(['skip']) },
      minutes: { type: 'number' }, title: { type: 'string' },
      date: { type: 'string', description: 'YYYY-MM-DD if shown' },
      mph: { type: 'number' }, incline: { type: 'number' }, watts: { type: 'number' }, miles: { type: 'number' },
      felt: { type: 'string', enum: ['easy', 'normal', 'brutal'] },
    } } } },
};
function aiPrompt(text) {
  return 'Extract every workout from this ' + (text ? 'text' : 'screenshot') + ' (usually a Peloton or fitness-app summary). ' +
    'Map each to one activity id: ' + ACTIVITIES.map(a => a.id + ' (' + a.name + ')').join(', ') + '. ' +
    'Peloton cycling = bike; Peloton running or walking = tread; stretching = yoga; meditation or anything that is not exercise = skip. ' +
    'Copy numbers exactly as shown: average speed in mph, average incline in %, average output in watts, distance in miles. ' +
    'Leave out any number that is not shown rather than estimating it. Set felt only if the person says how it felt. Today is ' + SEASON.today + '.' +
    (text ? '\n\n<workout_text>\n' + text + '\n</workout_text>' : '');
}
async function readWithClaude(text, image) {
  const key = getKey(); if (!key) throw new Error('NO_KEY');
  const content = image ? [{ type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } }, { type: 'text', text: aiPrompt('') }] : [{ type: 'text', text: aiPrompt(text) }];
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2026-10-21',
      'anthropic-beta': 'server-side-fallback-2026-07-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: AI_MODEL, max_tokens: 16000, fallbacks: 'default', output_config: { effort: 'low', format: { type: 'json_schema', schema: WORKOUT_SCHEMA } },
      messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) throw new Error('HTTP_' + res.status);
  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error('REFUSED');
  if (data.stop_reason === 'max_tokens') throw new Error('TRUNCATED');
  const txt = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return JSON.parse(txt).workouts || [];
}
// Offline stand-in so the prototype works with no key: reads common numbers from pasted text
function readDemo(text) {
  const lo = text.toLowerCase(), num = re => { const m = lo.match(re); return m ? parseFloat(m[1]) : undefined; };
  const kinds = [['tread', /\b(run|running|tread|walk(ing)? class|hiit run|hills)\b/], ['bike', /\b(ride|cycling|bike|climb|output)\b/], ['strength', /\b(strength|upper body|lower body|arms|core)\b/],
    ['yoga', /\b(yoga|stretch)\b/], ['bootcamp', /bootcamp/], ['dogwalk', /\b(dog|cookie|biscuit)\b/], ['hike', /\bhike\b/], ['tkd', /taekwondo/]];
  const k = kinds.find(x => x[1].test(lo));
  return [{ activity: k ? k[0] : 'walk', minutes: num(/(\d+)\s*(?:min|minute)/) || 30, title: text.split('\n')[0].slice(0, 60) || 'Workout',
    mph: num(/([\d.]+)\s*mph/), incline: num(/([\d.]+)\s*%\s*(?:avg\s*)?incline/) || num(/incline[^\d]{0,12}([\d.]+)/), watts: num(/([\d.]+)\s*(?:w\b|watts)/), miles: num(/([\d.]+)\s*(?:mi\b|miles)/) }];
}
function shrinkImage(file) {
  return new Promise((ok, bad) => { const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const sc = Math.min(1, 1568 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok({ type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.85).split(',')[1] }); };
    img.onerror = () => bad(new Error('IMAGE')); img.src = url; });
}
function openAIReader(onDone) {
  const body = h('div', { class: 'log-body' });
  const ta = h('textarea', { class: 'ai-text', rows: '5', placeholder: 'Paste from Peloton, Apple Fitness, a text… e.g. "45 min Climb Ride, 184 avg watts, felt brutal"' });
  const photo = h('input', { type: 'file', accept: 'image/*', style: 'display:none', onchange: async e => { const fl = e.target.files[0]; if (!fl) return; try { run(null, await shrinkImage(fl)); } catch (er) { toast('Could not open that photo'); } } });
  const status = h('div', { class: 'hint' });
  const hasKey = !!getKey();
  async function run(text, image) {
    if (!text && !image) { toast('Paste something or add a photo first'); return; }
    status.textContent = hasKey ? 'Reading…' : '';
    let list;
    try { list = hasKey ? await readWithClaude(text, image) : readDemo(text || ''); }
    catch (er) {
      const msg = { NO_KEY: 'Add a Claude key in Settings to read photos.', REFUSED: 'The reader declined that one. Try logging it by hand.', HTTP_401: 'That API key was not accepted. Check Settings.', TRUNCATED: 'That was too long to read. Try one workout at a time.' }[er.message];
      status.textContent = msg || 'Could not read it (' + er.message + '). Try again or log by hand.'; return;
    }
    review(list.filter(w => w.activity !== 'skip' && ACT[w.activity] && w.minutes > 0));
  }
  function review(list) {
    clear(body);
    if (!list.length) { body.appendChild(h('p', null, 'No workouts found in that.')); return; }
    body.appendChild(h('p', { class: 'hint', style: 'font-size:14px;margin-bottom:6px' }, 'Check these, then add. Tap ✕ to drop one.'));
    const rows = list.map(w => {
      const detail = {}; ['mph', 'incline', 'watts', 'miles'].forEach(k => { if (w[k] > 0) detail[k] = w[k]; });
      return { act: w.activity, min: Math.round(w.minutes), felt: w.felt || 'normal', date: /^\d{4}-\d{2}-\d{2}$/.test(w.date || '') && w.date <= SEASON.today ? w.date : SEASON.today, title: w.title, detail: Object.keys(detail).length ? detail : null, keep: true };
    });
    const listEl = h('div');
    function drawRows() { clear(listEl); rows.forEach(r => { const mm = metFor(r);
      listEl.appendChild(h('div', { class: 'imp-row' + (r.keep ? '' : ' off') }, h('span', { class: 'act-ico' }, ACT[r.act].icon),
        h('span', { class: 'll' }, r.title || ACT[r.act].name, h('small', null, fmtShort(r.date) + ' · ' + r.min + ' min · ' + mm.met.toFixed(1) + ' MET · ' + mm.how)),
        h('button', { class: 'modal-x', type: 'button', 'aria-label': 'Drop', onclick: () => { r.keep = !r.keep; drawRows(); } }, r.keep ? '✕' : '↺'))); }); }
    drawRows(); body.appendChild(listEl);
    if (!hasKey) body.appendChild(h('p', { class: 'hint' }, 'Demo reader (no key set). With a Claude key it reads photos and exact numbers.'));
    body.appendChild(h('button', { class: 'btn-primary', type: 'button', style: 'margin-top:14px', onclick: () => {
      const keep = rows.filter(r => r.keep);
      const g = gainFor([S.me], () => keep.forEach(r => S.workouts.push({ id: nid(), member: S.me, date: r.date, act: r.act, min: r.min, felt: r.felt, detail: r.detail, by: S.me })));
      close(); onDone(); toast('Added ' + keep.length + ' · ' + gainText(g)); } }, 'Add workouts'));
  }
  body.appendChild(ta);
  body.appendChild(h('div', { class: 'ai-row' },
    h('button', { class: 'btn-primary', type: 'button', onclick: () => run(ta.value.trim(), null) }, 'Read it'),
    h('button', { class: 'chip-btn', type: 'button', onclick: () => { if (!hasKey) { toast('Photos need a Claude key — see Settings'); return; } photo.click(); } }, '📷 Photo')));
  body.appendChild(photo); body.appendChild(status);
  body.appendChild(h('p', { class: 'hint' }, hasKey ? 'Uses your Claude key · about 1–2¢ per read.' : 'No Claude key on this phone yet: pasted text uses a simple demo reader.'));
  body.appendChild(h('button', { class: 'more-btn', type: 'button', onclick: () => { close(); openImport(onDone); } }, '▸ Or import a whole Peloton CSV (backfill)'));
  const close = openModal('✨ Paste or snap a workout', body);
}

seedDemo();
