# 🔥 FOCUS UNIVERSE

**FOCUS UNIVERSE** is an immersive, production-style Pomodoro platform that blends:

- 🎮 Game loop (XP, levels, plant growth, quests, streaks)
- 🧘 Ambient calm engine (crossfading backgrounds/audio, breathing orb, fog + particles)
- 🧠 AI planning (OpenAI online + offline fallback)
- 📊 Statistics system (daily chart + heatmap + productivity score)
- 🎬 Session export (4K canvas + MediaRecorder)

Built with:

- React + TypeScript + Vite
- Tailwind CSS
- IndexedDB (Dexie)
- Capacitor Android
- PWA (manifest + service worker)
- Vitest unit tests
- GitHub Actions CI

---

## Core Experience

When the user starts focus:

1. Immersive world appears with smooth blur/fade transitions
2. Nature background auto-rotates every 5 minutes (crossfade + subtle Ken Burns zoom)
3. Ambient audio starts and crossfades between focus/break profiles
4. Last 10 seconds trigger ticking intensity + final bell

The app is designed as a calming focus universe, not a plain timer UI.

---

## Project Structure

```txt
focus-universe/
  src/
    components/           UI modules (timer, stats, planner, game panels)
    data/                 IndexedDB + store + types + fallback assets
    features/             audio, background, timer, planner, video, stats
    utils/                helper utilities
  public/
    assets/               local fallback media packs
    sw.js                 service worker
    manifest.webmanifest  PWA manifest
  scripts/
    fetch-assets.mjs      remote stock index fetch (Pexels/Unsplash)
    bootstrap-fallback-assets.mjs
    android-sync.sh
```

---

## Quick Start

```bash
cd focus-universe
npm install
npm run assets:fallback
npm run dev
```

Open http://localhost:5173

---

## Asset System (Royalty-Free + Fallback)

### Option A: Use bundled local fallback assets
```bash
npm run assets:fallback
```

### Option B: Build remote stock index (Pexels/Unsplash)
1. Copy env file:
```bash
cp .env.example .env
```
2. Set keys in `.env`:
```txt
VITE_PEXELS_API_KEY=...
VITE_UNSPLASH_ACCESS_KEY=...
```
3. Fetch:
```bash
npm run assets:fetch
```

> App automatically falls back to local assets when remote keys/data are missing.

---

## Android (Capacitor)

```bash
npm run build
npx cap sync android
npx cap open android
```

Shortcut:
```bash
./scripts/android-sync.sh
```

---

## PWA

PWA support is enabled with:
- `public/manifest.webmanifest`
- `public/sw.js`
- service worker registration in `src/main.tsx`

Installable in supported browsers as a standalone app.

---

## Testing

```bash
npm run test:run
```

Current coverage target modules:
- gamification progression logic
- AI planner fallback behavior

---

## CI

GitHub Actions workflow:

- `.github/workflows/focus-universe-ci.yml`
  - installs deps
  - prepares fallback assets
  - runs unit tests
  - builds production bundle

---

## Production Build

```bash
npm run build
npm run preview
```

---

## Notes

- OpenAI key is optional and stored locally in browser storage.
- IndexedDB persists session history and drives stats/heatmap.
- The export feature currently outputs `webm` via `MediaRecorder` in browser-safe format.
