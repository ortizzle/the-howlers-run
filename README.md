# The Howlers — Half Marathon Training Tracker

A Red Rising–themed fitness tracking app for a 5-person running group training for the **Rock 'n' Roll Arizona Half Marathon (January 17, 2027)**.

**Live app:** [ortizzle.github.io/the-howlers-run](https://ortizzle.github.io/the-howlers-run)

---

## Overview

The Howlers is a single-file progressive web app (PWA) where each member of the pack logs workouts, earns **Laurels**, competes in **Gauntlet challenges**, conquers **Pack Passages**, and gets trash-talked by an AI coach from the Sons of Ares. All state is synced across devices via a private GitHub Gist.

---

## The Pack

| Name | House Color |
|------|-------------|
| Chris (Primus) | Red |
| Kat | Obsidian |
| Sedona | Violet |
| River | Copper |
| Jermainus | Pink / 💀 MIA (frozen) |

---

## Laurel Scoring

Laurels (L) are the primary point currency earned by logging workouts.

### Workout Types & Laurel Rates

| Workout | Name in App | Laurel Rate |
|---------|------------|-------------|
| Long Run | The Grand March | 15L/mile · min 8.8 mi from Jun 1 (was 8 mi) |
| Tempo Run | — | 12L/mile |
| Easy Run | — | 8L/mile |
| Walk/Run | — | 8L/mile (+ optional minutes tracking from Jun 1) |
| Peloton | — | 8L per 10 min |
| Strength | The Iron Forge | Before Jun 1: 15L flat · From Jun 1: 1L/min, capped at 30L |
| Mobility | Mind & Body | 15L flat |
| Cardio | — | 15L flat |
| Race | Race Day | 15L/mile |

### Bonus Point Sources

| Source | Amount |
|--------|--------|
| Duel victory | Varies by challenge |
| Pack Quest conquest bonus | Varies |
| Badge award | Bronze +25L · Silver +50L · Gold +100L |
| Underdog bonus | +20% when 300+ Laurels behind the leader |
| Trash Talk Toll | Deducted from challenger, added to pot |

---

## Qualifying Thresholds

Some features (streaks, perfect weeks, Gauntlet challenges) require workouts to meet minimum thresholds:

- **Runs** must be ≥ 1 mile
- **Timed workouts** (Peloton, Cardio, Strength, Mobility) must be ≥ 15 minutes
- Sub-minimum efforts are logged and earn Laurels, but do **not** count toward streaks or challenges

---

## The Gauntlet — Individual Challenges

Duel-style challenges where the **first Howler** to hit the goal wins the Laurel reward.

| Challenge | Goal | Reward |
|-----------|------|--------|
| The Faithful | First Perfect Week | 75L |
| Grand March Initiate | First Long Run | 50L |
| The Long Road | 3 Long Runs | 100L |
| The Iron League | 50 total miles | 150L |
| Unbreakable | 8-week streak | 175L |
| Peloton Pioneer | 5 Peloton sessions | 75L |
| Tempo Terran | 3 tempo sessions in a week | 100L |
| ... and more | | |

Filter by **All / In Progress / Conquered**.

---

## The Passage — Pack Milestones

Pack-wide goals where everyone contributes. Reached when the whole pack crosses a collective threshold.

Filter by **All / Pending / Reached**.

---

## Pack Quests

Admin-created time-limited events where the pack races toward a shared goal. Scoring includes an **Underdog Bonus** — the bottom 2 Howlers by total Laurels who meet the individual floor each earn the highest tier's bonus when the quest ends.

---

## Badges

Badges are earned by hitting personal milestones. Each badge has Bronze / Silver / Gold tiers.

| Badge | Icon | Tracks |
|-------|------|--------|
| First Step | 👟 | Total trials logged |
| Week Warrior | ⚔️ | Perfect weeks completed |
| Steed Master | 🚴 | Peloton sessions |
| Iron Forged | 🦵 | Strength sessions |
| Mind & Body | 🧘 | Mobility sessions |
| The Long March | 🗺️ | Long Runs completed |
| Unbroken | 🔥 | Current streak length |
| Centurion | 💯 | Total Laurels earned |

Badge rewards (Laurels) are granted via a howl entry when a tier is first reached.

---

## The Unbreakable Challenge

Each player's flip card shows a **pip row** tracking progress toward an 8-week qualifying streak. Each filled pip = 1 week of qualifying workouts. First to 8 wins 175L.

---

## Streaks & Perfect Weeks

- **Streak**: Consecutive weeks with at least one qualifying workout. Week boundaries start on **Monday**.
- **Perfect Week**: A week with at least 4 qualifying workout days.
- Week key format: `YYYY-MM-DD` (Monday's date) — used for all streak and challenge calculations.

---

## The Howler — Pack Feed

A group message board for trash talk, encouragement, and battle cries. Howlers can:
- Post messages and @mention pack members
- React to howls with emojis
- Challenge others to duels via the Sovereign Howl form

---

## AI Coaches — The Council of Ares

Each Howler is assigned one of three coaches drawn from the *Red Rising* universe. After every logged trial, the coach delivers a personalized nudge based on the Howler's recent stats. Coaches are character-voiced and **never** confuse miles for Laurels.

---

## Strava Integration

Connect a Strava account to import recent activities directly into the log form. The Strava **activity name** carries over into the workout notes field automatically.

---

## Frozen Accounts (💀 MIA)

A player can be frozen by an admin to pause their participation:

- Frozen players show a **pink gradient** card with a **💀 MIA** badge
- They **cannot log workouts or earn Laurels** while frozen
- To unfreeze, the player must howl exactly: **"I'm back in boyo!"** from their own account
- Points earned are **only for dates on or after their return date** — no backdating
- Frozen accounts cannot be deleted without an **admin PIN**

---

## Technical Architecture

| Aspect | Detail |
|--------|--------|
| Stack | Single-file HTML — all CSS, JS, and HTML inline |
| State storage | GitHub Gist (private), synced via `saveState()` / `loadState()` |
| Merge strategy | Safe-merge fetches remote Gist before every save to handle concurrent edits |
| PWA | Service worker for background polling and OS push notifications |
| Fonts | Cinzel (headers) + Crimson Pro (body) from Google Fonts |
| Charts | Inline SVG / CSS-based |
| AI coach | Anthropic Claude API (key stored in localStorage) |
| Timezone | Arizona (UTC-7 always — no DST) |
| CORS | All Gist fetches use `cache: 'no-store'` to prevent `cache-control` CORS preflight blocks |

---

## Local Development

```bash
cd ~/Downloads/projects/the-howlers-run
python3 -m http.server 4400
# Open http://localhost:4400
```

---

## Deployment

Push via **GitHub Desktop** (terminal not authenticated).
Live at: `https://ortizzle.github.io/the-howlers-run`

---

## Rule Changes — June 1, 2026

| Change | Before | After |
|--------|--------|-------|
| Long Run minimum | 8.0 mi | 8.8 mi |
| Iron Forge (Strength) | 15L flat | 1L/min, capped at 30L |
| Walk/Run | Miles only | Miles + optional minutes |

---

## Pending Features

- **Underdog Challenges** — everyone participates; lower-ranked players earn higher bonus multipliers. UI and goal design TBD.
