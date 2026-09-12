# Fuel — food, calories, macros and how you eat (prototype v0.2)

**Status: prototype for review.** Lives under `fuel/` on branch `claude/food-intake-tracking-app-l8d81o`. Not deployed to GitHub Pages; nothing on `main` changed. Built for a Pixel (Chrome on Android) first; still works in mobile Safari.

## What changed in v0.2

- **One committed look** instead of three: simple and modern. Manrope, a monochrome interface (light and dark, following the phone by default), color reserved for data. Macros are colored text, not pills.
- **Contexts** on every entry: Home-cooked, Takeout, Restaurant, At work, On the go, Packaged, Social / event, Other. The last one you used is the default for the next entry.
- **Meal types**: Breakfast, Lunch, Dinner, Snack, Pre-workout, Post-workout.
- **Insights** tab: last 7 / 14 / 30 days. Calories per day against target, macro averages and the protein/carb/fat split, where the calories come from (by context), by meal, when you eat (time of day), most-logged foods, weekday vs weekend. Every chart has a table view and tap-to-read values.
- **Claude summaries and analysis**: "Summarize today" on the log, and "Analyze these N days" on Insights. Only the numbers are sent, never photos or raw notes.
- **Model choice** in Settings: Sonnet 5 (default), Opus 5, Haiku 4.5.
- Android touches: the native barcode detector runs first (ZXing is now the fallback), continuous autofocus is requested on the camera, persistent storage is requested from Chrome, and an install manifest is included for "Add to Home screen".
- Photo flow: an optional one-line hint ("the chicken is 6 oz") and a re-analyze button.

## What it is

A single-file food log in the family-app mold: one `index.html`, no build step, localStorage as the source of truth, Arizona dates. You capture what you eat three ways and it keeps a daily tally of calories, protein, carbs, fat and fiber against your targets, then turns the log into trends.

| Capture | How the prototype does it | Fallbacks already built in |
|---|---|---|
| **Scan** a package | Live camera → the browser's native `BarcodeDetector` on the Pixel (fast, ML-Kit backed) → Open Food Facts lookup → product card with servings or grams → log | ZXing decoder on browsers without a native detector · type the digits · decode a *photo* of the barcode · USDA lookup when a key is set · not found → photograph the Nutrition Facts label · custom entry tied to the barcode and remembered for next time |
| **Photo** of a plate or a label | Photo shrunk to ≤1280 px JPEG on the phone → Claude vision with your key, straight from the phone → itemized estimate with a confidence badge per item → tick / adjust portions, pick meal and context → log | optional hint · re-analyze · describe it in words instead |
| **Add** by hand | **Quick add**: ~60 common foods, no network · **Describe**: one sentence → Claude text estimate · **Custom**: type the numbers (calories computed from macros if left blank) | USDA FoodData Central search (400k+ foods) when a free key is set |

Every logged row is editable (tap it): name, brand, meal, context, servings, per-serving numbers, delete. Deletes are tombstones, so a future sync cannot resurrect them.

## Scope, restated

**In:** personal daily log · calories + protein / carbs / fat, fiber shown · meal types incl. pre/post-workout · contexts · day-by-day navigation · daily targets · the three capture flows · Insights over 7/14/30 days with charts and table views · Claude day summary and range analysis · light / dark / system appearance · model choice · sample data (two weeks) · JSON export · keys entered in Settings and stored only on the device.

**Out for now:** cross-device sync or family sharing · favorites, recents, saved meals · Garmin / workout data (path below) · training-day targets · micronutrients, sugar, sodium · weight tracking · service worker / offline shell.

## How to review it

1. **Phone preview link** (in the session summary). A private artifact page with two sample weeks pre-loaded, so the log and Insights are populated. Layout, appearance, editing, manual entry and Insights are fully live. The preview host blocks outside network calls, so barcode lookups fail there and the camera may be refused; Claude features run through the preview host's own access when it permits them.
2. **Locally:** `python3 -m http.server 4400` from the repo root, open `http://localhost:4400/fuel/`. The camera works on localhost; lookups need internet.
3. **Deployed** (after your go-ahead; options below). Everything works, including the live scanner, because GitHub Pages is HTTPS.

Settings → "Load 2 sample weeks" fills the last 14 days on any device. Settings → Clear wipes it.

## The look

Simple, modern, quiet. One sans (Manrope), a near-black or off-white ground, hairline borders, no textures or ornament. Color has exactly two jobs: identify a macro (protein red, carbs gold, fat blue, fiber green) and flag a state (over target). The macro colors were validated for color-blind separation and contrast on both the light and dark surfaces; the P / C / F letters always sit beside the numbers so identity never rides on color alone.

Appearance follows the phone (System) with Light / Dark overrides in Settings.

## Data model (sync-ready from day one)

```
localStorage fuel_data      { records: { <id>: entry } }
entry = { id, type:'entry', date:'YYYY-MM-DD' (AZ), meal, context, time,
          name, brand, source:'upc'|'photo'|'manual'|'ai'|'quick'|'usda', barcode,
          servings, serving:{ label:'1 cup (30 g)', grams }, per:{ kcal, protein, carbs, fat, fiber },
          note, createdAt, updatedAt, deleted? }
localStorage fuel_settings  { targets:{ kcal, protein, carbs, fat, fiber }, scheme, model }
localStorage fuel_products  { <barcode>: product }      remembered scans / custom products
localStorage fuel_anthropic_key, fuel_usda_key           entered in Settings, never in the HTML
```

Totals are `per × servings`. Records carry `id` / `updatedAt` / tombstones, so the canonical Gist safe-merge from `core-patterns.md` can be dropped in without a migration. Workouts would be a second record type (`type:'workout'`) in the same store. Photos are never stored, only their results.

## Claude: what is sent, what it costs

- **Photos and descriptions** go straight from the phone to the Anthropic API with your key; nothing passes through a server. A photo is downscaled first, so a call is roughly 2k tokens in and a few hundred out.
- **Summaries and analysis** send only aggregates: per-day totals, targets, the by-context / by-meal / by-hour tables and the most-logged list. No photos, no free text beyond food names.
- **Model:** Sonnet 5 by default (≈ 1–2¢ per photo, well under a cent per summary). Opus 5 is a Settings switch if estimates feel off; Haiku 4.5 is there for cost tests. Effort is set to medium on Sonnet and Opus.
- **Latency:** first results in roughly 5–15 s on Sonnet with thinking on; text-only calls are faster.
- **Refusals** are handled (a friendly message, no crash). The key lives in this browser's storage only; set a monthly spend limit on it in the Anthropic console.

## Garmin and workouts: the path (not built yet)

Garmin has no public API for individuals, so the practical routes are:

1. **The Howlers Gist** (recommended first step). The Howlers already logs every run and workout, including the Strava activity name, to its Gist. Fuel can read that Gist (read-only, same token) and show today's workout under the ring, then adjust targets on training days and add a "fueling around runs" section to Insights (what pre- and post-workout meals look like on run days vs rest days). Zero new integrations.
2. **Strava** (next). Garmin Connect auto-syncs to Strava, and The Howlers already has a Strava connection; Fuel can reuse the same pattern to pull duration, distance and Garmin's calorie estimate for the day.
3. **Garmin Connect export** (FIT / CSV) for a one-off backfill.
4. **Health Connect** on Android is native-app only; not reachable from a web app.

What it unlocks: net energy (eaten minus burned), carb targets that rise on long-run days, and the question you actually asked, how eating changes around training.

## Challenges, honestly

### 1. Barcode → nutrition data coverage is the biggest risk
- **Open Food Facts** (used first) is free and needs no key, but it is crowd-sourced. Big US brands are mostly there; store brands, regional and brand-new products are often missing or half-filled (per 100 g only, kJ only, no serving size). The app normalizes all of those shapes, but a missing product is still missing. Size it by scanning your pantry once and counting.
- **USDA FoodData Central** has hundreds of thousands of US UPCs from label data. Free personal key, used as a fallback when set; names arrive shouty ("CHEERIOS") so the app title-cases them.
- **Paid options** if misses stay annoying: Nutritionix, Edamam. MyFitnessPal's database is the gold standard but has no public API.
- **Built in:** every scanned or hand-entered product is remembered by barcode, and "not found" leads to "photograph the Nutrition Facts label", which Claude reads nearly verbatim. Second scans are instant and offline.

### 2. Scanning on the Pixel should be good; on iPhones it is workable
- Chrome on Android exposes `BarcodeDetector`, backed by ML Kit: quick, tolerant of angle and low light. The app requests continuous autofocus on the stream. The two things to verify on the real phone: how close the main camera focuses on small codes, and whether the detector is available in a home-screen install (it should be).
- iPhones have no native detector, so the ZXing fallback runs there, which wants steady hands and good light; the photo-of-a-barcode and typed paths cover the gaps. ZXing loads from a CDN on first use; it can be vendored next to `index.html` if you want zero external dependencies.

### 3. Photo estimates are useful, but they are estimates
- Vision models recognize items well and read labels almost exactly, but calorie estimates from a plate are typically off by 20–30% and blind to what a photo cannot show: cooking oil, sauces, sugar in drinks, depth of a bowl. The hint line and the confidence badges exist for that reason; a kitchen scale plus the grams box beats any AI.

### 4. Trends are only as good as the logging habit
- Insights count only logged days, so a skipped day does not drag the average down, but a half-logged day does. The "days logged" stat is deliberately front and center. Recents / favorites / saved meals (top of the v0.3 list) is what makes daily logging fast enough to stick.

### 5. Serving sizes are the eternal problem
- Labels say "1.5 cup (39 g)", databases say "per 100 g", people eat "some". The app stores per-serving values and grams, offers a servings stepper, and converts grams eaten into servings when grams are known.

### 6. Storage and backup
- Chrome on Android keeps site storage until you clear browsing data, and the app asks for persistent storage; installing to the home screen makes it stickier. Still: before relying on it daily, either add Gist sync (also gives phone + laptop) or use Settings → Export JSON. The records already have the shape the safe-merge expects.

### 7. Reviewing before deploying
- The camera needs HTTPS or localhost, so the honest test of scanning is a deployed URL or the local server. Once deployed, verify with `?v=<timestamp>`: browsers cache hard.

## Deploy options (nothing deployed yet)

1. **Subfolder of this repo** — merge `fuel/` to `main`; live at `ortizzle.github.io/the-howlers-run/fuel/`. Fastest for a real-phone round.
2. **Own repo** (`ortizzle/fuel` or a better name) — live at `ortizzle.github.io/fuel/`; cleaner long-term, its own Gist. Recommended once the look is approved.
3. **Both:** review from the subfolder now, move to its own repo before daily use.

## Decisions for you

1. The look: is this the direction, or what would you change (density, the ring, the bottom bar)?
2. The context list: keep these eight, or rename / add (e.g. "Meal prep", "Travel")?
3. Name: "Fuel" is a placeholder.
4. Open Food Facts alone vs adding the free USDA key (recommended).
5. Garmin route: start with the Howlers Gist read, then Strava?
6. Deploy option 1, 2 or 3.

## What the headless suite covers (Chromium, 390 × 844, Arizona clock)

Fresh start with empty state and no console errors · add / edit / reload persistence with contexts · delete → tombstone → still deleted after reload · typed barcode → mocked Open Food Facts → per-serving parse, grams-to-servings, remembered locally, context saved · not-found, no-nutrition and kJ-only products · ZXing decoding of generated EAN-13 and UPC-A images through the "photo of a barcode" path · UPC-E expansion · photo flow gated without a key, then with a mocked Claude response: Sonnet 5 by default, image block, browser header, hint text, no beta headers, item selection, portion multipliers and context · describe flow · model switch (Haiku omits effort, Opus carries it) · day summary rendered from Claude JSON · custom entry with barcode memory · two seeded weeks → Insights: 7 columns with target line and tooltips, table view, stats coherence, 14- and 30-day re-render, Claude analysis · light / dark / system appearance · no horizontal scroll anywhere · all buttons ≥ 44 px · preview-mode seeding. Hygiene greps (no `onclick=`, no native dialogs, no `toISOString` dates, no keys, no `innerHTML`) pass.

Not testable here and worth a real-phone pass: the native detector and camera focus on the Pixel, real Claude latency and accuracy with your key, the real Open Food Facts hit rate on your pantry.

## Proposed v0.3

Recents / favorites / saved meals → Howlers Gist read for workouts and training-day targets → Gist sync with the canonical safe-merge → weekly review email-style summary → service worker for offline shell → Strava pull.
