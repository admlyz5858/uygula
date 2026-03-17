import { useEffect, useRef } from 'react'
import { saveSession } from '../../data/db'
import { useFocusStore } from '../../data/store'

function vibrate(ms: number): void {
  if ('vibrate' in navigator) navigator.vibrate(ms)
}

export function useTimerEngine(): void {
  const running = useFocusStore((state) => state.running)
  const mode = useFocusStore((state) => state.mode)
  const remainingSeconds = useFocusStore((state) => state.remainingSeconds)
  const tick = useFocusStore((state) => state.tick)
  const switchMode = useFocusStore((state) => state.switchMode)
  const completeSession = useFocusStore((state) => state.completeSession)
  const focusMinutes = useFocusStore((state) => state.focusMinutes)
  const breakMinutes = useFocusStore((state) => state.breakMinutes)
  const rotateBackground = useFocusStore((state) => state.rotateBackground)

  const startedAtRef = useRef<number>(Date.now())
  const bgCounterRef = useRef<number>(0)

  useEffect(() => {
    if (!running) return undefined
    const interval = window.setInterval(() => {
      tick()
      bgCounterRef.current += 1
      if (bgCounterRef.current >= 300) {
        rotateBackground()
        bgCounterRef.current = 0
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [running, tick, rotateBackground])

  useEffect(() => {
    if (running) return
    if (remainingSeconds > 0) return

    const completedMode = mode
    const durationSeconds = Math.round((completedMode === 'focus' ? focusMinutes : breakMinutes) * 60)
    const endedAt = Date.now()
    void saveSession({
      startedAt: startedAtRef.current,
      endedAt,
      mode: completedMode,
      completed: true,
      durationSeconds,
      productivityScore: completedMode === 'focus' ? 92 : 78,
    })

    completeSession(true)
    vibrate(80)
    switchMode(completedMode === 'focus' ? 'break' : 'focus')
    startedAtRef.current = Date.now()
  }, [running, remainingSeconds, mode, switchMode, completeSession, focusMinutes, breakMinutes])
}
