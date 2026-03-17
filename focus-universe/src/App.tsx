import { useMemo, useState } from 'react'
import { saveAs } from './utils/saveAs'
import { TopBar } from './components/TopBar'
import { ImmersiveBackground } from './components/ImmersiveBackground'
import { TimerHUD } from './components/TimerHUD'
import { BreathingOrb } from './components/BreathingOrb'
import { PlannerPanel } from './components/PlannerPanel'
import { GamificationPanel } from './components/GamificationPanel'
import { StatsPanel } from './components/StatsPanel'
import { BreakMiniGames } from './components/BreakMiniGames'
import { useFocusStore } from './data/store'
import { useTimerEngine } from './features/timer/useTimerEngine'
import { useAudioEngine } from './features/audio/useAudioEngine'
import { useBackgroundAssets } from './features/background/useBackgroundAssets'
import { exportSessionVideo } from './features/video/exportSessionVideo'

function App() {
  const [dark, setDark] = useState(true)
  const [exporting, setExporting] = useState(false)

  const mode = useFocusStore((state) => state.mode)
  const running = useFocusStore((state) => state.running)
  const remainingSeconds = useFocusStore((state) => state.remainingSeconds)
  const assets = useFocusStore((state) => state.assets)
  const backgroundIndex = useFocusStore((state) => state.backgroundIndex)
  const tracks = useFocusStore((state) => state.audioTracks)
  const game = useFocusStore((state) => state.gamification)
  const quests = useFocusStore((state) => state.quests)
  const focusMinutes = useFocusStore((state) => state.focusMinutes)
  const breakMinutes = useFocusStore((state) => state.breakMinutes)
  const startSession = useFocusStore((state) => state.startSession)
  const pauseSession = useFocusStore((state) => state.pauseSession)
  const resumeSession = useFocusStore((state) => state.resumeSession)
  const resetTimer = useFocusStore((state) => state.resetTimer)
  const switchMode = useFocusStore((state) => state.switchMode)

  useBackgroundAssets()
  useTimerEngine()
  useAudioEngine({ tracks, mode, running, remainingSeconds })

  const totalSeconds = useMemo(
    () => Math.round((mode === 'focus' ? focusMinutes : breakMinutes) * 60),
    [mode, focusMinutes, breakMinutes],
  )
  const progress = (totalSeconds - remainingSeconds) / Math.max(1, totalSeconds)
  const selectedAsset = assets[backgroundIndex % Math.max(assets.length, 1)]

  const exportVideo = async (): Promise<void> => {
    if (!selectedAsset) return
    try {
      setExporting(true)
      const blob = await exportSessionVideo({
        durationSeconds: Math.min(totalSeconds, 120),
        title: mode === 'focus' ? 'Focus Session' : 'Break Session',
        backgroundImage: selectedAsset.imageUrl,
      })
      saveAs(blob, `focus-universe-${mode}-${Date.now()}.webm`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className={`relative min-h-screen overflow-hidden ${dark ? 'bg-slate-950' : 'bg-slate-100'} text-white`}>
      <ImmersiveBackground assets={assets} index={backgroundIndex} running={running} />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-5 md:px-6">
        <TopBar
          mode={mode}
          dark={dark}
          onModeChange={switchMode}
          onToggleDark={() => setDark((value) => !value)}
          onExportVideo={() => void exportVideo()}
        />
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-[38px] border border-white/10 bg-slate-900/35 p-6">
              <div className="absolute right-8 top-8 hidden md:block">
                <BreathingOrb running={running} />
              </div>
              <TimerHUD
                mode={mode}
                running={running}
                remainingSeconds={remainingSeconds}
                progress={progress}
                onStart={startSession}
                onPause={pauseSession}
                onResume={resumeSession}
                onReset={resetTimer}
              />
              <p className="mt-4 text-sm text-white/65">
                {mode === 'focus'
                  ? 'No stress, just flow. Your world grows with every completed focus block.'
                  : 'Recovery mode active. Breathe, reset, and return stronger.'}
              </p>
              {exporting ? <p className="mt-2 text-xs text-focus">Rendering 4K export...</p> : null}
            </div>
            <PlannerPanel />
            <StatsPanel />
          </div>
          <div className="space-y-5">
            <GamificationPanel game={game} quests={quests} />
            <BreakMiniGames />
            <section className="rounded-3xl border border-white/15 bg-slate-900/45 p-5 text-white backdrop-blur-md">
              <h3 className="text-lg font-semibold">Ambient Credits</h3>
              <p className="text-sm text-white/70">{selectedAsset?.credit ?? 'Focus Universe source library'}</p>
              <p className="mt-2 text-xs text-white/60">
                Background auto-transitions every 5 minutes with crossfade and Ken Burns zoom.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
