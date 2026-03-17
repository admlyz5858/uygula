# Focus Pomodoro AI Pro

A full Android Studio project built with Kotlin, MVVM, Compose + XML, Room, WorkManager, foreground services, ExoPlayer, FFmpeg, and MPAndroidChart.

## Key Features
- Pomodoro foreground timer with lock-screen notification controls
- AI task planner with OpenAI integration and offline template fallback
- Room-backed task manager and focus history
- Stats dashboard (Compose + XML MPAndroidChart)
- Streaks, levels, achievements, and daily insight notifications
- 4K Pomodoro video generator (FFmpegKit) with export and share
- Material 3 UI with dark/light mode

## Heavy Offline Asset Libraries
Assets are bundled under `app/src/main/assets`:
- `videos/` (10 HD looping ambient videos)
- `audio/` (20 ambient tracks)
- `images/` (55 high-resolution stills)
- `templates/` (AI planning templates + rules + schedules)

Total bundled assets exceed 100MB.

## Build
1. Install Android SDK (API 35 + Build Tools)
2. Create `local.properties`:
   - `sdk.dir=/path/to/Android/Sdk`
3. Optional release signing:
   - copy `keystore.properties.example` to `keystore.properties`
   - fill in your keystore values
4. Build:
   - `./gradlew :app:assembleDebug`
   - `./gradlew :app:bundleRelease`
