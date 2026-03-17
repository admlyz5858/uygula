import { useEffect, useMemo, useRef } from 'react'
import { Howl } from 'howler'
import type { AudioTrack, FocusMode } from '../../data/types'
import { uiSfx } from '../../data/fallbackAssets'

interface AudioInput {
  tracks: AudioTrack[]
  mode: FocusMode
  running: boolean
  remainingSeconds: number
}

export function useAudioEngine({ tracks, mode, running, remainingSeconds }: AudioInput): void {
  const activeTrack = useMemo(
    () => tracks.find((track) => track.mode === mode) ?? tracks[0],
    [tracks, mode],
  )

  const ambientRef = useRef<Howl | null>(null)
  const tickRef = useRef<Howl | null>(null)
  const bellRef = useRef<Howl | null>(null)
  const lastModeRef = useRef<FocusMode>(mode)
  const lastRemainingRef = useRef<number>(remainingSeconds)

  useEffect(() => {
    tickRef.current = new Howl({ src: [uiSfx.tick], volume: 0.12 })
    bellRef.current = new Howl({ src: [uiSfx.bell], volume: 0.22 })
    return () => {
      tickRef.current?.unload()
      bellRef.current?.unload()
      ambientRef.current?.unload()
    }
  }, [])

  useEffect(() => {
    if (!activeTrack) return
    if (!running) return

    if (mode !== lastModeRef.current || !ambientRef.current) {
      const next = new Howl({ src: [activeTrack.url], loop: true, volume: 0 })
      next.play()
      next.fade(0, mode === 'focus' ? 0.42 : 0.5, 1800)

      if (ambientRef.current) {
        const previous = ambientRef.current
        previous.fade(previous.volume(), 0, 1500)
        setTimeout(() => previous.unload(), 1600)
      }

      ambientRef.current = next
      lastModeRef.current = mode
    }
  }, [activeTrack, mode, running])

  useEffect(() => {
    if (!running) {
      ambientRef.current?.fade(ambientRef.current.volume(), 0.1, 800)
      return
    }
    const target = mode === 'focus' ? 0.42 : 0.5
    ambientRef.current?.fade(ambientRef.current.volume(), target, 700)
  }, [running, mode])

  useEffect(() => {
    if (!running) return
    if (remainingSeconds > 0 && remainingSeconds <= 10 && remainingSeconds !== lastRemainingRef.current) {
      const intensity = 0.1 + (10 - remainingSeconds) * 0.03
      tickRef.current?.volume(Math.min(0.42, intensity))
      tickRef.current?.play()
    }
    if (remainingSeconds === 0 && lastRemainingRef.current !== 0) {
      bellRef.current?.play()
    }
    lastRemainingRef.current = remainingSeconds
  }, [remainingSeconds, running])
}
