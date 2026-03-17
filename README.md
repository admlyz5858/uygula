# Focus Pomodoro AI Pro

A full Android Studio project built with Kotlin, MVVM, Compose + XML, Room, WorkManager, foreground services, ExoPlayer, FFmpeg, and MPAndroidChart.

## Key Features
- Pomodoro foreground timer with lock-screen notification controls
- AI task planner with OpenAI integration and offline template fallback
- Room-backed task manager and focus history
- Stats dashboard (Compose + XML MPAndroidChart)
- Streaks, levels, achievements, and daily insight notifications
- 4K Pomodoro video generator (FFmpeg) with export and share
- Material 3 UI with dark/light mode

## Heavy Offline Asset Libraries
Assets are bundled under `app/src/main/assets`:
- `videos/` (10 HD looping ambient videos)
- `audio/` (20 ambient tracks)
- `images/` (55 high-resolution stills)
- `templates/` (AI planning templates + rules + schedules)

Total bundled assets exceed 100MB.

## Android SDK setup (persistent in this repo)
This repo includes scripts for SDK + environment bootstrap:

1. Run one-time setup:
   - `./scripts/android/setup-sdk.sh`
2. For any new shell session, load env vars:
   - `source ./scripts/android/env.sh`
3. Ensure `local.properties` exists/updates automatically:
   - `./scripts/android/ensure-local-properties.sh`

`gradlew` also auto-runs env detection + `local.properties` generation before each build.

## Build
1. Ensure Android SDK is installed (use script above)
2. Optional release signing:
   - copy `keystore.properties.example` to `keystore.properties`
   - fill in your keystore values
3. Build:
   - `./gradlew :app:assembleDebug`
   - `./gradlew :app:bundleRelease`

## Download APK from GitHub Actions
1. Push your branch to GitHub.
2. Open the repository **Actions** tab.
3. Run workflow: **Android Debug APK** (or use a recent push/PR run).
4. Open the workflow run and download artifact:
   - `focus-pomodoro-ai-pro-debug-apk`
