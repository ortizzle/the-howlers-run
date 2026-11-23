/* ============================================================
   THE IRON RAIN — shared prototype engine (Merit scoring + demo data)
   Prototype only: in-memory state, simulated "today" mid-season.
   ============================================================ */

// ---------- DOM helpers (no innerHTML with data, no inline handlers) ----------
function h(tag, attrs) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (let i = 2; i < arguments.length; i++) appendKids(el, arguments[i]);
  return el;
}
function appendKids(el, c) {
  if (c == null || c === false) return;
  if (Array.isArray(c)) { c.forEach(x => appendKids(el, x)); return; }
  el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
}
const SVGNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs) {
  const el = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
  for (let i = 2; i < arguments.length; i++) appendKids(el, arguments[i]);
  return el;
}
function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

// ---------- Date helpers (YYYY-MM-DD strings, UTC math = no drift) ----------
function toD(k) { const p = k.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
function toK(d) { return d.toISOString().slice(0, 10); }
function addDays(k, n) { const d = toD(k); d.setUTCDate(d.getUTCDate() + n); return toK(d); }
function dow(k) { return (toD(k).getUTCDay() + 6) % 7; } // 0 = Monday
function weekKey(k) { return addDays(k, -dow(k)); }
function daysBetween(a, b) { return Math.round((toD(b) - toD(a)) / 86400000); }
function range(a, b) { const out = []; for (let k = a; k <= b; k = addDays(k, 1)) out.push(k); return out; }
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOWS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function fmtShort(k) { const d = toD(k); return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
function fmtDow(k) { return DOWS[dow(k)] + ' ' + fmtShort(k); }

// ---------- Season config ----------
const SEASON = { name: 'Season II', start: '2026-12-01', end: '2027-03-21', today: '2026-12-18' };
const HOLIDAY_HOLD = { start: '2026-12-01', end: '2027-01-04', tolerancePct: 0.5, reward: 100 };

const RULES = {
  activeDayMin: 20,   // minutes for a day to count as an Active Day
  activeDay: 10,      // Merit per Active Day
  standardDays: 4,    // Active Days per week to meet the Weekly Standard
  standard: 40,       // Merit for meeting the Standard
  chainStep: 0.10,    // +10% multiplier per consecutive Standard week
  chainMax: 5,        // up to ×1.5
  effortCap: 20,      // daily cap on effort Merit
  weighIn: 5,         // Merit for weighing in (once per week)
  stepPct: 0.5,       // progress credited in 0.5% steps of starting weight
  stepPts: 25,        // Merit per 0.5% step
  weeklyPctCap: 1.0,  // max % credited per week (rewards healthy pace)
  milestones: [[5, 100, 'Five Down'], [10, 150, 'Double Digits'], [15, 200, 'Reforged']],
  habit: 2,           // Merit per daily habit
  habitsMax: 3,
  pr: 25,             // Fitness track: Merit per personal record
  prWeeklyMax: 2,
};
const INTENSITY = { easy: { label: 'Easy', rate: 1 }, steady: { label: 'Steady', rate: 2 }, hard: { label: 'Hard', rate: 3 } };

const ACTIVITIES = [
  { id: 'tread', name: 'Tread', full: 'Peloton Tread', icon: '🏃', group: 'Peloton' },
  { id: 'bike', name: 'Bike', full: 'Peloton Bike', icon: '🚴', group: 'Peloton' },
  { id: 'strength', name: 'Strength', full: 'Peloton Strength', icon: '🏋️', group: 'Peloton' },
  { id: 'yoga', name: 'Yoga', full: 'Yoga / Stretch', icon: '🧘', group: 'Peloton' },
  { id: 'bootcamp', name: 'Bootcamp', full: 'Peloton Bootcamp', icon: '🔥', group: 'Peloton' },
  { id: 'run', name: 'Run', full: 'Outdoor Run', icon: '👟', group: 'Outside' },
  { id: 'walk', name: 'Walk', full: 'Walk', icon: '🚶', group: 'Outside' },
  { id: 'hike', name: 'Hike', full: 'Hike', icon: '⛰️', group: 'Outside' },
  { id: 'ride', name: 'Ride', full: 'Outdoor Ride', icon: '🚵', group: 'Outside' },
  { id: 'swim', name: 'Swim', full: 'Swim', icon: '🏊', group: 'Outside' },
  { id: 'sport', name: 'Sport', full: 'Sport / Pickleball', icon: '🏓', group: 'Outside' },
];
const ACT = {}; ACTIVITIES.forEach(a => ACT[a.id] = a);

const RANKS = [
  { name: 'Red', min: 0, color: '#b3261e' },
  { name: 'Gray', min: 250, color: '#7a7f87' },
  { name: 'Obsidian', min: 600, color: '#2c3e57' },
  { name: 'Copper', min: 1000, color: '#a0572a' },
  { name: 'Silver', min: 1500, color: '#a8b0bb' },
  { name: 'Gold', min: 2100, color: '#c9a227' },
  { name: 'Peerless', min: 2800, color: '#e8c547' },
];
function rankFor(m) { let r = RANKS[0], next = null; for (let i = 0; i < RANKS.length; i++) { if (m >= RANKS[i].min) { r = RANKS[i]; next = RANKS[i + 1] || null; } } return { rank: r, next }; }

// ---------- Members (demo) ----------
const MEMBERS = [
  { id: 'chris', name: 'Chris', title: 'Primus', house: '#9a1010', track: 'weight', share: true, goalPct: 10,
    habits: ['8k steps', 'Protein first', 'No late snacks'], coach: 'Sevro' },
  { id: 'kat', name: 'Kat', title: 'Obsidian', house: '#1e3858', track: 'weight', share: true, goalPct: 8,
    habits: ['Water 80oz', '8k steps', 'Sleep 7h'], coach: 'Mustang' },
  { id: 'sedona', name: 'Sedona', title: 'Violet', house: '#4a1878', track: 'fitness', share: false,
    habits: ['Stretch', 'Water', 'Screens off 9pm'], coach: 'Mustang' },
  { id: 'river', name: 'River', title: 'Copper', house: '#8b4513', track: 'fitness', share: false,
    habits: ['Outside 30m', 'Water', 'Veggies'], coach: 'Ragnar' },
];
const MEM = {}; MEMBERS.forEach(m => MEM[m.id] = m);

// ---------- State ----------
const S = { workouts: [], weighins: [], habits: {}, prs: [], howls: [], me: 'chris' };
let _id = 1; function nid() { return 'x' + (_id++); }

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function seedDemo() {
  const P = {
    chris:  { seed: 11, active: 0.78, min: [30, 60], hard: 0.35, acts: ['tread', 'bike', 'strength', 'walk', 'tread', 'bike'], start: 214.0, rate: 0.21, weigh: 0.85, hab: 0.7 },
    kat:    { seed: 23, active: 0.66, min: [25, 50], hard: 0.25, acts: ['bike', 'yoga', 'strength', 'walk', 'hike', 'bike'], start: 158.0, rate: 0.07, weigh: 0.45, hab: 0.8 },
    sedona: { seed: 37, active: 0.55, min: [20, 45], hard: 0.2, acts: ['yoga', 'bike', 'walk', 'sport', 'tread'], pr: 0.06, hab: 0.6 },
    river:  { seed: 41, active: 0.6, min: [20, 50], hard: 0.4, acts: ['ride', 'run', 'sport', 'bike', 'hike'], pr: 0.08, hab: 0.5 },
  };
  const days = range(SEASON.start, addDays(SEASON.today, -1));
  MEMBERS.forEach(m => {
    const p = P[m.id], r = mulberry32(p.seed);
    S.habits[m.id] = {};
    days.forEach((d, i) => {
      const weekend = dow(d) >= 5;
      if (r() < p.active + (weekend ? 0.08 : 0)) {
        const n = r() < 0.15 ? 2 : 1;
        for (let j = 0; j < n; j++) {
          const act = p.acts[Math.floor(r() * p.acts.length)];
          const min = Math.round((p.min[0] + r() * (p.min[1] - p.min[0])) / 5) * 5;
          const intensity = r() < p.hard ? 'hard' : (r() < 0.6 ? 'steady' : 'easy');
          S.workouts.push({ id: nid(), member: m.id, date: d, act, min, intensity });
        }
      }
      S.habits[m.id][d] = m.habits.map(() => r() < p.hab);
      if (p.start && r() < p.weigh) {
        const lbs = p.start - p.rate * i + (r() - 0.5) * 1.6;
        S.weighins.push({ id: nid(), member: m.id, date: d, lbs: Math.round(lbs * 10) / 10 });
      }
      if (p.pr && r() < p.pr) {
        const labels = { sedona: ['Bike 20-min output PR', 'Longest yoga hold', 'Tread 1-mile PR'], river: ['Fastest mile', 'Longest ride', 'Bike output PR'] }[m.id];
        S.prs.push({ id: nid(), member: m.id, date: d, label: labels[Math.floor(r() * labels.length)] });
      }
    });
    // make sure the start weigh-in exists on day one
    if (p.start && !S.weighins.some(w => w.member === m.id && w.date === SEASON.start))
      S.weighins.push({ id: nid(), member: m.id, date: SEASON.start, lbs: p.start });
  });
  S.howls = [
    { member: 'river', date: '2026-12-17', text: 'Hiked Pinnacle Peak before school. Who else is up before the sun?' },
    { member: 'kat', date: '2026-12-17', text: 'Chain at ×1.2. Do not touch my chain.' },
    { member: 'chris', date: '2026-12-16', text: 'Tread hill climb nearly broke me. Worth it.' },
    { member: 'sedona', date: '2026-12-15', text: 'New bike PR 🚴 — somebody tell River.' },
  ];
}

// ---------- Scoring ----------
function score(mid) {
  const m = MEM[mid], today = SEASON.today;
  const ledger = [];
  const add = (date, cat, label, pts) => { if (pts) ledger.push({ date, cat, label, pts }); };

  // Day info
  const day = {};
  S.workouts.filter(w => w.member === mid && w.date >= SEASON.start && w.date <= today)
    .sort((a, b) => a.date < b.date ? -1 : 1)
    .forEach(w => {
      const d = day[w.date] || (day[w.date] = { min: 0, effort: 0, list: [] });
      d.min += w.min; d.list.push(w);
      const raw = Math.round(w.min / 10 * INTENSITY[w.intensity].rate);
      const pts = Math.max(0, Math.min(raw, RULES.effortCap - d.effort));
      d.effort += pts;
      add(w.date, 'effort', ACT[w.act].full + ' · ' + w.min + ' min ' + INTENSITY[w.intensity].label.toLowerCase(), pts);
    });

  // Weeks, consistency, chain
  const weeks = [];
  let chain = 0;
  for (let wk = weekKey(SEASON.start); wk <= today; wk = addDays(wk, 7)) {
    const wEnd = addDays(wk, 6), complete = wEnd < today;
    const ds = range(wk, wEnd).filter(d => d >= SEASON.start && d <= today);
    let active = 0, stdDate = null, base = 0;
    ds.forEach(d => {
      const di = day[d];
      if (di && di.min >= RULES.activeDayMin) {
        active++; add(d, 'consistency', 'Active Day', RULES.activeDay); base += RULES.activeDay;
        if (active === RULES.standardDays) { stdDate = d; add(d, 'consistency', 'Weekly Standard met', RULES.standard); base += RULES.standard; }
      }
      if (di) base += di.effort;
      const hb = (S.habits[mid] || {})[d];
      if (hb) { const n = Math.min(hb.filter(Boolean).length, RULES.habitsMax); add(d, 'habits', 'Habits ' + n + '/' + m.habits.length, n * RULES.habit); }
    });
    const mult = 1 + RULES.chainStep * chain;
    const bonus = Math.round(base * (mult - 1));
    add(complete ? wEnd : today, 'consistency', 'Chain bonus ×' + mult.toFixed(1) + (complete ? '' : ' (so far)'), bonus);
    weeks.push({ key: wk, end: wEnd, complete, active, standard: !!stdDate, chainIn: chain, mult, days: ds });
    if (complete) chain = stdDate ? Math.min(chain + 1, RULES.chainMax) : Math.max(chain - 1, 0);
  }
  const curWeek = weeks[weeks.length - 1];
  const chainNow = curWeek.chainIn + (curWeek.standard ? 1 : 0) > RULES.chainMax ? RULES.chainMax : curWeek.chainIn;

  // Progress — weight track
  let weight = null;
  if (m.track === 'weight') {
    const ws = S.weighins.filter(w => w.member === mid && w.date >= SEASON.start && w.date <= today).sort((a, b) => a.date < b.date ? -1 : 1);
    if (ws.length) {
      const start = ws[0].lbs; let trend = start, low = start, credited = 0, wkSeen = {}, wkStartCredit = {};
      const series = [];
      ws.forEach(w => {
        trend = trend + 0.3 * (w.lbs - trend);
        low = Math.min(low, trend);
        series.push({ date: w.date, lbs: w.lbs, trend });
        const wk = weekKey(w.date);
        if (!wkSeen[wk]) { wkSeen[wk] = 1; wkStartCredit[wk] = credited; add(w.date, 'progress', 'Weekly weigh-in', RULES.weighIn); }
        const actual = (start - low) / start * 100;
        const allowed = wkStartCredit[wk] + RULES.weeklyPctCap;
        const target = Math.floor(Math.min(actual, allowed) / RULES.stepPct) * RULES.stepPct;
        if (target > credited) {
          const steps = Math.round((target - credited) / RULES.stepPct);
          add(w.date, 'progress', 'New low on trend · ' + target.toFixed(1) + '% down', steps * RULES.stepPts);
          RULES.milestones.forEach(ms => { if (credited < ms[0] && target >= ms[0]) add(w.date, 'progress', 'Milestone: ' + ms[2] + ' (' + ms[0] + '%)', ms[1]); });
          credited = target;
        }
      });
      const pctLost = (start - trend) / start * 100;
      const goalLbs = start * (1 - (m.goalPct || 10) / 100);
      const holdOk = trend <= start * (1 + HOLIDAY_HOLD.tolerancePct / 100);
      const weeksIn = Math.max(1, daysBetween(SEASON.start, today) / 7);
      weight = { start, trend, low, pctLost, credited, series, goalLbs, holdOk, pacePct: pctLost / weeksIn };
    }
  } else {
    // Fitness track — personal records
    const byWk = {};
    S.prs.filter(p => p.member === mid && p.date >= SEASON.start && p.date <= today).sort((a, b) => a.date < b.date ? -1 : 1).forEach(p => {
      const wk = weekKey(p.date); byWk[wk] = (byWk[wk] || 0) + 1;
      if (byWk[wk] <= RULES.prWeeklyMax) add(p.date, 'progress', 'Personal record · ' + p.label, RULES.pr);
    });
  }

  // Aggregates
  const cats = { consistency: 0, effort: 0, progress: 0, habits: 0 };
  let total = 0; const byDate = {}, byWeek = {};
  ledger.forEach(e => { cats[e.cat] += e.pts; total += e.pts; byDate[e.date] = (byDate[e.date] || 0) + e.pts; const wk = weekKey(e.date); byWeek[wk] = (byWeek[wk] || 0) + e.pts; });
  ledger.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const activeDays = Object.keys(day).filter(d => day[d].min >= RULES.activeDayMin);
  const totalMin = Object.keys(day).reduce((a, d) => a + day[d].min, 0);
  const prs = S.prs.filter(p => p.member === mid && p.date <= today).length;
  return { m, total, cats, ledger, day, weeks, curWeek, chain: curWeek.chainIn, chainNow, weight, byDate, byWeek, activeDays, totalMin, prs, rank: rankFor(total) };
}
function scoreAll() { const o = {}; MEMBERS.forEach(m => o[m.id] = score(m.id)); return o; }

// ---------- Gauntlet (individual, consistency-first) & Passage (pack) ----------
function gauntlet(all) {
  const count = (sc, fn) => sc.activeDays.filter(fn).length;
  return [
    { id: 'iron-dec', icon: '🗓️', name: 'Iron December', desc: '20 Active Days in December', goal: 20, reward: 150, val: sc => count(sc, d => d.slice(0, 7) === '2026-12') },
    { id: 'chain5', icon: '⛓️', name: 'Unbreakable Chain', desc: 'Reach a ×1.5 chain (5 straight Standard weeks)', goal: 5, reward: 200, val: sc => sc.chain + (sc.curWeek.standard ? 1 : 0) },
    { id: 'steed', icon: '🐎', name: 'Steed & Tread', desc: 'Use both the Bike and the Tread in 3 different weeks', goal: 3, reward: 100, val: sc => sc.weeks.filter(w => { const ws = S.workouts.filter(x => x.member === sc.m.id && weekKey(x.date) === w.key); return ws.some(x => x.act === 'bike') && ws.some(x => x.act === 'tread'); }).length },
    { id: 'walls', icon: '🏜️', name: 'Beyond the Walls', desc: '8 outdoor sessions (run, walk, hike, ride, swim, sport)', goal: 8, reward: 100, val: sc => S.workouts.filter(x => x.member === sc.m.id && x.date <= SEASON.today && ACT[x.act].group === 'Outside').length },
    { id: 'thousand', icon: '⏱️', name: 'The Thousand', desc: '1,000 active minutes this season', goal: 1000, reward: 150, val: sc => sc.totalMin },
  ].map(c => { const rows = MEMBERS.map(m => ({ m, v: Math.min(c.val(all[m.id]), c.goal) })).sort((a, b) => b.v - a.v); return Object.assign(c, { rows, winner: rows[0].v >= c.goal ? rows[0].m : null }); });
}
function passage(all) {
  const packDays = MEMBERS.reduce((a, m) => a + all[m.id].activeDays.length, 0);
  const packMin = MEMBERS.reduce((a, m) => a + all[m.id].totalMin, 0);
  const packStd = MEMBERS.reduce((a, m) => a + all[m.id].weeks.filter(w => w.standard).length, 0);
  return [
    { icon: '🔥', name: 'The First Hundred', desc: 'Pack Active Days', val: packDays, goal: 100, reward: '+50 each' },
    { icon: '🌊', name: 'Iron Tide', desc: 'Pack active minutes', val: packMin, goal: 5000, reward: '+75 each' },
    { icon: '🛡️', name: 'Shield Wall', desc: 'Weekly Standards met (all members)', val: packStd, goal: 40, reward: '+100 each' },
  ];
}

// ---------- Badges ----------
function badges(sc) {
  const wkCount = S.weighins.filter(w => w.member === sc.m.id).map(w => weekKey(w.date)).filter((v, i, a) => a.indexOf(v) === i).length;
  const list = [
    { icon: '🌧️', name: 'First Rain', desc: 'Log your first trial', v: sc.activeDays.length, tiers: [1, 25, 75] },
    { icon: '⛓️', name: 'Unbroken', desc: 'Standard weeks met', v: sc.weeks.filter(w => w.standard).length, tiers: [1, 6, 14] },
    { icon: '🐎', name: 'Steed Master', desc: 'Bike sessions', v: S.workouts.filter(w => w.member === sc.m.id && w.act === 'bike').length, tiers: [5, 25, 60] },
    { icon: '🏃', name: 'Treadborn', desc: 'Tread sessions', v: S.workouts.filter(w => w.member === sc.m.id && w.act === 'tread').length, tiers: [5, 25, 60] },
    { icon: '🏜️', name: 'Wanderer', desc: 'Outdoor sessions', v: S.workouts.filter(w => w.member === sc.m.id && ACT[w.act].group === 'Outside').length, tiers: [5, 20, 50] },
  ];
  if (sc.m.track === 'weight') list.push({ icon: '⚖️', name: 'The Faithful Scale', desc: 'Weeks weighed in', v: wkCount, tiers: [2, 8, 16] });
  else list.push({ icon: '⚡', name: 'Record Breaker', desc: 'Personal records', v: sc.prs, tiers: [1, 5, 12] });
  return list.map(b => { const tier = b.tiers.filter(t => b.v >= t).length; return Object.assign(b, { tier, next: b.tiers[tier] || null }); });
}

// ---------- Coach line (static stand-in for the AI coach) ----------
function coachLine(sc) {
  const w = sc.curWeek, left = Math.max(0, RULES.standardDays - w.active), daysLeft = 6 - dow(SEASON.today);
  const voice = { Sevro: ['Listen, goodman.', 'Gorydamn, look at you.', 'Bloodydamn.'], Mustang: ['Steady.', 'Good.', 'Think it through.'], Ragnar: ['The ice remembers.', 'Strength is patience.', 'Walk with purpose.'] }[sc.m.coach];
  if (w.standard) return voice[1] + ' Standard met with ' + daysLeft + ' days to spare. Anything else this week is pure chain fuel.';
  if (left <= daysLeft + 1) return voice[0] + ' ' + left + ' more Active Day' + (left === 1 ? '' : 's') + ' to hold the chain at ×' + (1 + RULES.chainStep * (sc.chain + 1)).toFixed(1) + '. ' + (left === 1 ? 'Twenty minutes. That is all it costs.' : 'You have the days. Spend them.');
  return voice[2] + ' The Standard slipped this week — but the chain only drops one link. Show up tomorrow and it starts climbing again.';
}

// ---------- Modal, toast ----------
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = h('div', { id: 'toast', class: 'toast' }); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3200);
}
function openModal(title, bodyEl, onClose) {
  const back = h('div', { class: 'modal-back' });
  const close = () => { back.remove(); if (onClose) onClose(); };
  back.addEventListener('click', e => { if (e.target === back) close(); });
  const card = h('div', { class: 'modal' },
    h('div', { class: 'modal-head' }, h('div', { class: 'modal-title' }, title), h('button', { class: 'modal-x', 'aria-label': 'Close', onclick: close }, '×')),
    bodyEl);
  back.appendChild(card); document.body.appendChild(back);
  return close;
}

// ---------- Log Trial form ----------
function openLog(onSaved) {
  const mid = S.me, m = MEM[mid];
  const f = { act: 'tread', min: 30, intensity: 'steady', lbs: '' };
  const before = score(mid).total;
  const preview = h('div', { class: 'log-preview' });
  const actGrid = h('div', { class: 'act-grid' });
  const groups = ['Peloton', 'Outside'];
  const actBtns = [];
  groups.forEach(g => {
    actGrid.appendChild(h('div', { class: 'act-group' }, g));
    ACTIVITIES.filter(a => a.group === g).forEach(a => {
      const b = h('button', { class: 'act-btn', type: 'button', onclick: () => { f.act = a.id; sync(); } }, h('span', { class: 'act-ico' }, a.icon), h('span', null, a.name));
      b._id = a.id; actBtns.push(b); actGrid.appendChild(b);
    });
  });
  const minVal = h('span', { class: 'min-val' });
  const minInput = h('input', { type: 'range', min: '5', max: '120', step: '5', value: '30', class: 'min-range', oninput: e => { f.min = +e.target.value; sync(); } });
  const intBtns = Object.keys(INTENSITY).map(k => { const b = h('button', { class: 'int-btn', type: 'button', onclick: () => { f.intensity = k; sync(); } }, INTENSITY[k].label, h('small', null, INTENSITY[k].rate + '/10 min')); b._id = k; return b; });
  const lbsInput = m.track === 'weight' ? h('input', { type: 'number', inputmode: 'decimal', step: '0.1', placeholder: 'optional', class: 'lbs-input', oninput: e => { f.lbs = e.target.value; sync(); } }) : null;

  function sync() {
    actBtns.forEach(b => b.classList.toggle('on', b._id === f.act));
    intBtns.forEach(b => b.classList.toggle('on', b._id === f.intensity));
    minVal.textContent = f.min + ' min';
    // preview score with a temp entry
    const tmp = { id: 'tmp', member: mid, date: SEASON.today, act: f.act, min: f.min, intensity: f.intensity };
    S.workouts.push(tmp);
    let tmpW = null; const lb = parseFloat(f.lbs);
    if (lbsInput && lb > 50 && lb < 500) { tmpW = { id: 'tmpw', member: mid, date: SEASON.today, lbs: lb }; S.weighins.push(tmpW); }
    const after = score(mid).total;
    S.workouts.pop(); if (tmpW) S.weighins.pop();
    clear(preview).appendChild(h('div', null, h('b', null, '+' + (after - before)), ' Merit'));
    preview.appendChild(h('div', { class: 'log-preview-sub' }, f.min < RULES.activeDayMin && !(score(mid).day[SEASON.today]) ? 'Under ' + RULES.activeDayMin + ' min — earns effort, not an Active Day' : 'Includes Active Day, effort, chain bonus & any Standard'));
  }
  const save = h('button', { class: 'btn-primary', type: 'button', onclick: () => {
    S.workouts.push({ id: nid(), member: mid, date: SEASON.today, act: f.act, min: f.min, intensity: f.intensity });
    const lb = parseFloat(f.lbs); if (lbsInput && lb > 50 && lb < 500) S.weighins.push({ id: nid(), member: mid, date: SEASON.today, lbs: lb });
    const gained = score(mid).total - before; close(); toast('+' + gained + ' Merit — ' + ACT[f.act].full + ' logged'); onSaved();
  } }, 'Log Trial');
  const body = h('div', { class: 'log-body' },
    h('label', { class: 'fld' }, 'Activity'), actGrid,
    h('label', { class: 'fld' }, 'Duration ', minVal), minInput,
    h('label', { class: 'fld' }, 'Intensity'), h('div', { class: 'int-row' }, intBtns),
    lbsInput ? [h('label', { class: 'fld' }, 'Weigh-in (lbs) ', h('small', null, 'private — only % is shared')), lbsInput] : null,
    preview, save);
  const close = openModal('Log a Trial · ' + fmtDow(SEASON.today), body);
  sync();
}

function toggleHabit(i, onDone) {
  const mid = S.me; const today = SEASON.today;
  const arr = S.habits[mid][today] || (S.habits[mid][today] = MEM[mid].habits.map(() => false));
  arr[i] = !arr[i]; toast((arr[i] ? '+' : '−') + RULES.habit + ' Merit · ' + MEM[mid].habits[i]); onDone();
}

seedDemo();
