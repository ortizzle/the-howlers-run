# Fuel — food, calories, macros and how you eat

Personal food log for a phone: scan a barcode, photograph a plate or a Nutrition Facts label, or add by hand; see calories and macros against targets; understand *how* you eat over time (where, when, which meals), with Claude summaries. Built in the ortizzle family-app mold: one `index.html`, no build step, localStorage as the source of truth, Arizona dates. Pixel / Chrome first, Safari still supported.

**Live app:** `https://ortizzle.github.io/fuel/` once this repo is deployed (see *Deploying*).

## Install on the phone

Open the live URL in Chrome, tap the ⋮ menu → **Add to Home screen** (or **Install app**). It runs full-screen with its own icon; the camera and storage permissions are granted once.

## What it does

| Capture | How | Fallbacks built in |
|---|---|---|
| **Scan** a package | Live camera → the browser's native barcode detector on the Pixel → Open Food Facts lookup → product card with servings or grams → log | USDA FoodData Central lookup when Open Food Facts misses (works out of the box on USDA's shared demo key, ~30 lookups an hour; add your own free key for unlimited) · ZXing decoder on browsers without a native detector · type the digits · decode a *photo* of the barcode · not found → photograph the Nutrition Facts label · custom entry tied to the barcode and remembered for next time |
| **Photo** of a plate or a label | Photo shrunk on the phone → Claude vision with your key, straight from the phone → itemized estimate with a confidence badge per item → adjust portions, pick meal and context → log | optional hint ("6 oz chicken, olive oil dressing") · re-analyze · describe it in words instead |
| **Add** by hand | **Quick add** (~60 common foods, offline) · **Describe** in a sentence → Claude estimate · **Custom** numbers (calories computed from macros if blank) | USDA search |

Every entry carries a **meal** (Breakfast, Lunch, Dinner, Snack, Pre-workout, Post-workout) and a **context** (Home-cooked, Takeout, Restaurant, At work, On the go, Packaged, Social / event, Other). Rows are editable; deletes are tombstones so a future sync can't resurrect them.

**Insights** (7 / 14 / 30 days): calories per day against target, macro averages and split, calories by context, by meal, by time of day, most-logged foods, weekday vs weekend, and, when The Howlers is connected, run days vs rest days. Every chart has a table view and tap-to-read values. "Analyze these days" asks Claude for patterns, wins, watch-outs and one experiment; "Summarize today" does the same for a single day. Only aggregated numbers are sent, never photos.

**The Howlers hook** (read-only): on a phone that also runs The Howlers, Fuel picks up the Howlers Gist keys from the shared `ortizzle.github.io` storage and shows the day's workout under the ring (run day / training day / rest day), splits Insights into run vs rest days, and tells Claude which days were runs. On another device, paste the Gist ID and token in Settings. Nothing is ever written to the Howlers Gist.

## The look

"Harbor": deep blue and brown. Light mode is warm cream with navy ink, navy buttons and a brown accent (the calorie ring, active states); dark mode is navy surfaces with cream ink and a caramel accent. One sans (Manrope), hairline borders, no ornament. Color otherwise carries only data: protein red, carbs gold, fat blue, fiber green, validated for color-blind separation and contrast on both surfaces; the P / C / F letters always sit beside the numbers so identity never rides on color alone. Appearance follows the phone (System) with Light / Dark overrides in Settings.

## Settings and keys

- **Daily targets** for calories, protein, carbs, fat, fiber.
- **Claude API key** (photos, descriptions, summaries). Stored only in this browser; calls go straight from the phone to Anthropic. Set a monthly spend limit on the key. Model: Sonnet 5 by default, Opus 5 or Haiku 4.5 selectable.
- **USDA key** (optional, free): removes the shared demo-key limit for barcode fallback and search.
- **The Howlers**: connection status, refresh, whose workouts.
- **Data**: load two sample weeks, export JSON, clear this device.

## Data model (sync-ready)

```
localStorage fuel_data      { records: { <id>: entry } }
entry = { id, type:'entry', date:'YYYY-MM-DD' (AZ), meal, context, time,
          name, brand, source:'upc'|'photo'|'manual'|'ai'|'quick'|'usda', barcode,
          servings, serving:{ label, grams }, per:{ kcal, protein, carbs, fat, fiber },
          note, createdAt, updatedAt, deleted? }
localStorage fuel_settings  { targets, scheme, model }
localStorage fuel_products  { <barcode>: product }          remembered scans / custom products
localStorage fuel_howlers_cache                              workouts by date (read-only mirror)
localStorage fuel_anthropic_key, fuel_usda_key, fuel_howlers  entered in Settings, never in the HTML
```

Records carry `id` / `updatedAt` / tombstones, so the canonical Gist safe-merge can be added without a migration. Because every ortizzle app shares the `ortizzle.github.io` origin, data logged under one path survives a move to another path on the same host.

## Repo layout

- `index.html` — the whole app (CSS and JS inline; ZXing loads from a CDN only when a browser lacks a native barcode detector).
- `icon.svg` — the mark used for the favicon and home-screen icon (also inlined in the page).
- `.github/workflows/pages.yml` — deploys the repo root to GitHub Pages on every push to `main` and enables Pages on first run.
- `.claude/launch.json` — local run config (`python3 -m http.server 4400`, open `http://localhost:4400/`).

## Deploying

Push to `main`. The workflow publishes the root to GitHub Pages; the first run enables Pages with "GitHub Actions" as the source (Settings → Pages shows it afterwards). Pages can lag a minute, and Chrome caches hard: verify with `?v=<timestamp>` appended to the URL.

## Known limits and challenges

- **Barcode coverage** is the biggest practical risk: Open Food Facts misses a share of US store brands and new products; the USDA fallback and the remembered-products memory cover most of the rest, and "photograph the label" covers the tail.
- **Photo estimates** are estimates: good at identifying items and reading labels, typically 20–30% off on mixed plates, blind to oils and sauces. The hint line and confidence badges exist for that; a kitchen scale plus the grams box beats any AI.
- **Trends only count logged days**, so consistency matters more than precision; recents / favorites / saved meals is the next feature for that reason.
- **Storage** is on-device. Chrome keeps it unless browsing data is cleared, and the app requests persistent storage; before relying on it daily, add Gist sync or use Export JSON.
- **Workouts** come from The Howlers until that season ends in January; Strava or Garmin export can replace it later.

## Roadmap

Recents / favorites / saved meals → training-day targets (more carbs on long-run days, driven by the Howlers hook) → Gist sync with the canonical safe-merge → weekly review → service worker for offline shell → Strava or Garmin export as the workout source after January.
