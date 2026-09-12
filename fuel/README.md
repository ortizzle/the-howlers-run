# Fuel — food, calories & macros (prototype v0.1)

**Status: prototype for review.** Lives under `fuel/` on branch `claude/food-intake-tracking-app-l8d81o`. Not deployed to GitHub Pages; nothing on `main` changed.

## What it is

A single-file food log in the family-app mold: one `index.html`, no build step, mobile Safari first, localStorage as the source of truth, Arizona dates. You capture what you eat three ways and it keeps a daily tally of calories, protein, carbs, fat (and fiber) against your targets.

| Capture | How the prototype does it | Fallbacks already built in |
|---|---|---|
| **Scan** a package | Live camera → native `BarcodeDetector` where the browser has one (Chrome / Android), otherwise the ZXing decoder (lazy-loaded from a CDN, 330 KB) → Open Food Facts lookup → product card with servings or grams → log | type the digits · decode a *photo* of the barcode (the iPhone camera app focuses better than a live web stream) · USDA lookup when a key is set · not found → photograph the Nutrition Facts label · custom entry tied to the barcode and remembered, so the next scan is instant and offline |
| **Photo** of a plate or a label | Photo shrunk to ≤1280 px JPEG on the phone → Claude vision (your API key, browser-direct, nothing in between) → itemized estimate with a confidence badge per item → tick / adjust portions → log | optional one-line hint ("that's 6 oz chicken") · re-analyze · describe it in words instead |
| **Add** by hand | **Quick add**: ~60 common foods, no network · **Describe**: one sentence → Claude text estimate · **Custom**: type the numbers (calories computed from macros if left blank) | USDA FoodData Central search (400k+ foods) when a free key is set |

Every logged row is editable (tap it): name, brand, meal, servings, per-serving numbers, delete. Deletes are tombstones, so a future sync cannot resurrect them.

## Scope, restated

**In:** personal daily log · calories + protein / carbs / fat, fiber shown · day-by-day navigation · daily targets · the three capture flows above · three switchable looks · sample-day seeding · JSON export · API keys entered in Settings and stored only on the device.

**Out for now** (each is a candidate for v0.2, see the end): cross-device sync or family sharing · week / trend views · favorites, recents, saved meals · streaks and badges · micronutrients, sugar, sodium · weight tracking · service worker / offline shell · Howlers cross-over (training-day targets).

## How to review it

1. **Phone preview link** (in the session summary). It is a private artifact page with a sample day pre-loaded. The look, the log, editing and manual entry are fully live. The preview host blocks outside network calls, so barcode lookups fail there and the camera may not be allowed; photo and text estimates run through the preview host's own Claude access (no key needed) when it permits images. A banner in the app says the same.
2. **Locally:** `python3 -m http.server 4400` from the repo root, open `http://localhost:4400/fuel/`. The camera works on localhost; lookups need internet.
3. **Deployed** (after your go-ahead; options below). Everything works, including the live scanner, because GitHub Pages is HTTPS.

Switch looks with the pill in the header or in Settings → Look. Settings → Load sample day fills today. Settings → Clear wipes the device.

## The three looks (pick one to commit to)

- **Forge** (default) — dark iron, ember and gold. The natural companion to The Howlers. Cormorant SC + Spectral.
- **Ledger** — ration-book paper and ink. Light; sibling of the Howlers' Gold of Luna palette. Same type.
- **Lab** — cool navy, mint accent, monospaced numerals. The "it's a dashboard" alternative. Inter + JetBrains Mono.

The macro colors (protein red, carbs gold, fat violet/blue, fiber green) stay consistent across looks.

## Data model (sync-ready from day one)

```
localStorage fuel_data      { records: { <id>: entry } }
entry = { id, type:'entry', date:'YYYY-MM-DD' (AZ), meal, time,
          name, brand, source:'upc'|'photo'|'manual'|'ai'|'quick'|'usda', barcode,
          servings, serving:{ label:'1 cup (30 g)', grams }, per:{ kcal, protein, carbs, fat, fiber },
          note, createdAt, updatedAt, deleted? }
localStorage fuel_settings  { targets:{ kcal, protein, carbs, fat, fiber }, theme }
localStorage fuel_products  { <barcode>: product }      remembered scans / custom products
localStorage fuel_anthropic_key, fuel_usda_key           entered in Settings, never in the HTML
```

Totals are `per × servings`. Records carry `id` / `updatedAt` / tombstones, so the canonical Gist safe-merge from `core-patterns.md` can be dropped in without a migration. Photos are never stored, only their results (about 1 KB per entry; years of logs fit comfortably).

## Challenges, honestly

### 1. Barcode → nutrition data coverage is the biggest risk, not the scanning
- **Open Food Facts** (used first) is free, needs no key and allows browser calls, but it is crowd-sourced. Big US brands are mostly there; store brands, regional and brand-new products are often missing or half-filled (per 100 g only, kJ only, no serving size). The prototype normalizes all of those shapes, but a missing product is still missing. Expect a noticeable share of misses on a real grocery run; the honest way to size it is to scan your pantry once and count.
- **USDA FoodData Central** "Branded" data has hundreds of thousands of US UPCs from label-data partners. Free personal key (instant signup, 1,000 requests/hour), used as a fallback when set. Data can lag reformulations and discontinued items, and its names are shouty ("CHEERIOS") so the app title-cases them.
- **Paid options** if misses stay annoying: Nutritionix (best restaurant + UPC coverage, free tier then paid), Edamam (food database with UPC lookup, limited free tier). MyFitnessPal's database is the gold standard but has no public API.
- **Built-in mitigation:** every scanned or hand-entered product is remembered on the device by barcode, and "not found" leads straight to "photograph the Nutrition Facts label", which Claude reads nearly verbatim. In practice the second scan of anything in your kitchen is instant and offline.
- *Recommendation:* start with Open Food Facts + a free USDA key. Revisit paid APIs only if your pantry test shows a high miss rate.

### 2. Live barcode scanning on iPhone is workable, not native-app smooth
- iOS Safari has no `BarcodeDetector` API, so scanning runs in JavaScript (ZXing). It works, but 1D barcodes want a steady hand, decent light and 6–10 inches of distance; the live web-camera stream doesn't always macro-focus on small codes.
- That is why the sheet also offers **"use a photo of the barcode"**: the native camera focuses reliably and ZXing decodes the still. And typing the digits always works.
- The decoder comes from a CDN on first use (jsDelivr, unpkg as fallback), then stays cached. If you want zero external dependencies, the file can be vendored next to `index.html` (still no build step) at the cost of a second file in the repo.
- Home-screen "app" mode: camera works on modern iOS but permission prompts can repeat more often than in Safari proper; links opened inside Messages / Instagram in-app browsers may block the camera entirely.
- Native apps (AVFoundation) scan far better. That would mean leaving the single-HTML-file model, so it is noted, not recommended.

### 3. Photo estimates are useful, but they are estimates
- Vision models recognize items well and read labels almost exactly, but calorie estimates from a plate are typically off by 20–30% and worse for what a photo cannot show: cooking oil, sauces, sugar in drinks, depth of a bowl, restaurant portions.
- The prototype shows a confidence badge per item, lets you scale each portion before logging, stores a "low-confidence" note, and takes a one-line hint ("dressing is olive oil, chicken is 6 oz") that improves results a lot for very little effort.
- The single biggest accuracy lever is not AI: a kitchen scale plus the "grams eaten" box on the product card.
- **Model, cost, speed.** The prototype calls `claude-opus-5` at medium effort with server-side refusal fallbacks enabled (harmless for food; if the account isn't on that beta the app retries without it). One photo ≈ 2k input tokens plus a few hundred output tokens: on the order of 2–5¢ per photo, so five photos a day is a few dollars a month. Sonnet 5 would be roughly 40% of that if accuracy holds; that is a one-line change to test. Because thinking is on, first results take about 5–20 s; "quick" text estimates are faster.
- **Privacy:** photos go from the phone straight to Anthropic's API and are subject to Anthropic's API data policies; the app never stores them.

### 4. Serving sizes are the eternal problem
- Labels say "1.5 cup (39 g)", databases say "per 100 g", people eat "some". The prototype stores per-serving values *and* grams per serving, offers a servings stepper, and converts grams eaten into servings when grams are known. Products with no serving weight fall back to "per 100 g".
- Photo estimates come back as a described portion (e.g. "1 cup (150 g)") with a portion multiplier; there is no way around eyeballing there.

### 5. Manual entry needs a real search eventually
- The built-in list is a stopgap for the prototype. USDA search is wired up (needs the free key); Open Food Facts text search was skipped on purpose (slow, ~10 requests/minute). "Describe" via Claude is the most natural input ("chipotle chicken bowl, no rice, double chicken") and costs well under a cent per entry.
- For daily use the highest-value addition is **recents / favorites / saved meals** ("my usual breakfast"), which is why it tops the v0.2 list.

### 6. Storage, backup, sync
- Solo app → localStorage, per the standards. Safari can purge a site's storage after seven days of Safari use without visiting the site (a home-screen install keeps its own counter, and daily use resets it), so before relying on it daily either add Gist sync (also gives you a phone + laptop view) or use Settings → Export JSON as a backup. The records already have the shape the canonical safe-merge expects.

### 7. Keys on the phone
- The Anthropic key and the optional USDA key live in localStorage for this origin only, entered through Settings and never committed (the repo is public; the hygiene greps pass). Anyone holding the unlocked phone could read the key from the browser, so set a monthly spend limit on that key in the Anthropic console.

### 8. Reviewing before deploying
- The camera needs HTTPS or localhost, so the honest test of scanning is a deployed URL or the local server; the artifact preview is for look-and-feel, the log, manual entry and (if permitted) photo estimates. Once deployed, mobile Safari caches hard: verify with `?v=<timestamp>`.

## Deploy options (nothing deployed yet)

1. **Subfolder of this repo** — merge `fuel/` to `main`; live at `ortizzle.github.io/the-howlers-run/fuel/`. Fastest for a review round; shares the Howlers' history.
2. **Own repo `ortizzle/fuel`** (or a better name) — live at `ortizzle.github.io/fuel/`; cleaner long-term, its own Gist, its own README. Recommended once the look is approved.
3. **Both:** review from the subfolder now, move to its own repo before daily use.

## Decisions for you

1. Which look: Forge, Ledger or Lab (or a direction to iterate on).
2. Name: "Fuel" is a placeholder; a Red Rising name is easy to swap in.
3. Personal only, or Kat / the pack too (drives Gist sync now vs later).
4. Targets: fixed numbers, or training-day dependent (long-run days get more carbs; could read today's Howlers workout from its Gist).
5. Data sources: Open Food Facts only vs + free USDA key (recommended) vs a paid API.
6. Photo model: keep Opus 5 for accuracy or trial Sonnet 5 for cost/speed.
7. Deploy option 1, 2 or 3.

## What the headless smoke test covers (Chromium, 390 × 844, Arizona clock)

Fresh start with empty state and no console errors · add / edit / reload persistence · delete → tombstone → still deleted after reload · typed barcode → mocked Open Food Facts → per-serving parse, grams-to-servings, logged with source `upc`, remembered locally · not-found, no-nutrition and kJ-only products · ZXing decoding of generated EAN-13 and UPC-A images through the "photo of a barcode" path · UPC-E expansion and code variants · photo flow gated without a key, then with a mocked Claude response: image block, model, browser header, fallback beta header, downscaled image, hint text, item selection and portion multipliers · describe flow · custom entry with barcode memory · date arithmetic · targets update the ring · no horizontal scroll in all three looks · all buttons ≥ 44 px · preview-mode seeding. Hygiene greps (no `onclick=`, no native dialogs, no `toISOString` dates, no keys, no `innerHTML`) pass.

Not testable here and worth a real-phone pass: live camera scanning, iOS keyboard behavior in the sheets, HEIC photos from the library, actual Claude latency and accuracy, actual Open Food Facts hit rate on your pantry.

## Proposed v0.2 (after look-and-feel approval)

Recents / favorites / saved meals → Gist sync with the canonical safe-merge → week view and 7-day averages → Howlers hook (today's workout adjusts targets) → service worker for offline shell → optional vendored decoder.
