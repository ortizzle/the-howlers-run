# The Howler Pack

The Ortiz family's fitness app. Everyone moves, the pack climbs from Red to Gold together, one season at a time. It's themed on Pierce Brown's *Red Rising* and is the successor to The Howlers half-marathon tracker.

- **Proctors** (parents) and **Pups** (kids) each climb their own ladder, scored differently and fairly.
- **December is The Passage**, a trial run. Season 1 (*Iron Rain*) starts Jan 1, then a new season every quarter.

## Install (Pixel / Chrome)

1. Open the live URL in Chrome. Tap ⋮ → **Install app**.
2. Pick your name ("Whose phone is this?").
3. **Join the family.** A parent starts the pack once (see below), then sends everyone the join link from Settings → Family sync → *Invite family*. Opening the link on a phone connects it.

**Starting the pack (one parent, once):**
1. Settings → Family sync. Paste a GitHub token with **gist** scope.
2. Tap **Start**. The app creates a private Gist named `howler-pack.json`.
3. The token travels inside the join link, so send that link to family only.

## What's in it

- **Today**
  - The whole pack at the top: tap a name to open Stats / The Annals.
  - Then **Log a workout**. Parents also get one-tap usuals, ✨ paste-or-snap, and a private weigh-in. Kids get the big "I moved!" buttons.
  - The seasonal race, this week's Primus race, your coach, your week, cheers, and Fuel.
- **Progress**
  - Parents: weight trend chart (pounds never leave the phone), milestone ladder, Holiday Hold.
  - Everyone: minutes per week, activity mix, active-day calendar, weekly scorecards, recent Merit.
- **Goals:** monthly and seasonal goals with suggestions, plus the Hall of Honors.
- **Pack:** cheers, the race map with lore stations, Primus history, Cookie & Biscuit's walks, and the Lore of the Pack.
- **Settings:** this phone, coach, weight goal and sharing, usuals, taekwondo days, dogs, race prize, family sync, Claude key, Fuel, Peloton CSV, reminders, Drive copy, sample-data preview, backup.

## Scoring (Merit)

| | Proctors | Pups |
|---|---|---|
| Active Day | 20+ min **or** 100 MET-min → +15 | 20+ min → +10 |
| Weekly Standard | 4 Active Days → +50 | 3 Active Days → +30 |
| Effort | MET-minutes ÷ 10 (cap 40/day) | 1 per 5 min (cap 12/day) |
| Progress | weekly weigh-in +5 · each new 0.5% trend low +25 (max 1%/week) · 5/10/15% milestones | — |
| Goals | monthly +50 · season +150 | monthly +25 · season +75 |

**Everyone also earns:**
- **Chain:** each straight week meeting the Standard adds +10%, up to ×1.5. A missed week drops one link, not all of them.
- **Together:** +5 when 2+ of you log the same activity.
- **Cheering:** +2 per cheer, up to 5 a day.
- **Weekly Primus:** +25 for whoever beats their own target by the most.
- **The race:** a Pack checkpoint on time is +25, and reaching the destination is +50.

**Seasonal race:** each person's Active Day moves the pack 1 step, and each activity done together adds 1 more.
- *Race to the New Year:* 75 steps, with a Christmas Eve checkpoint at 55.
- *Race to Spring:* 200 steps.

Ranks are Red → Gray → Obsidian → Copper → Silver → Gold → Peerless. They reset each season and scale with season length.

## Privacy

- Weigh-ins stay in this phone's storage.
- Only Merit awards sync, plus the % lost if that parent turns sharing on.
- Kids' screens and coaches never mention weight or food.
- Fuel data is read on the same phone only and never synced.
- The Claude key and the sync token live only in each phone's storage, never in the code.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app: one file, no build step |
| `sw.js` | Offline shell, Peloton share target, background cheers and evening nudge |
| `manifest.webmanifest` | Install metadata and share target |
| `ortiz-drive.js` | Shared Ortiz Drive backup, same as the other apps |
| icons | App icons |

## Local development

```bash
python3 -m http.server 4410   # then open http://localhost:4410
```

Settings → *Preview with sample data* shows a mid-December family without saving anything.
