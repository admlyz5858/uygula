import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fallbackAudioTracks, fallbackNatureAssets } from './fallbackAssets'
import type { AudioTrack, FocusMode, GamificationState, NatureAsset, PlannerResult, Quest } from './types'
import { defaultQuests, levelFromXp, stageFromSessions, updateQuests } from '../utils/gamification'

export interface FocusState {
  mode: FocusMode
  running: boolean
  remainingSeconds: number
  focusMinutes: number
  breakMinutes: number
  backgroundIndex: number
  assets: NatureAsset[]
  audioTracks: AudioTrack[]
  gamification: GamificationState
  quests: Quest[]
  planner: PlannerResult | null
  aiKey: string
  startSession: () => void
  pauseSession: () => void
  resumeSession: () => void
  resetTimer: () => void
  tick: () => void
  switchMode: (mode: FocusMode) => void
  rotateBackground: () => void
  setAssets: (assets: NatureAsset[]) => void
  setAudioTracks: (tracks: AudioTrack[]) => void
  completeSession: (completed: boolean) => void
  setPlanner: (result: PlannerResult | null) => void
  setAiKey: (key: string) => void
}

const initialGamification: GamificationState = {
  xp: 0,
  level: 1,
  streak: 0,
  plantStage: 'seed',
  questsCompletedToday: 0,
  sessionsToday: 0,
  minutesFocusedToday: 0,
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      mode: 'focus',
      running: false,
      remainingSeconds: 25 * 60,
      focusMinutes: 25,
      breakMinutes: 5,
      backgroundIndex: 0,
      assets: fallbackNatureAssets,
      audioTracks: fallbackAudioTracks,
      gamification: initialGamification,
      quests: defaultQuests(),
      planner: null,
      aiKey: '',
      startSession: () => set({ running: true }),
      pauseSession: () => set({ running: false }),
      resumeSession: () => set({ running: true }),
      resetTimer: () => {
        const state = get()
        const base = state.mode === 'focus' ? state.focusMinutes : state.breakMinutes
        set({ remainingSeconds: Math.round(base * 60), running: false })
      },
      tick: () => {
        const state = get()
        if (!state.running) return
        const next = state.remainingSeconds - 1
        if (next <= 0) {
          set({ remainingSeconds: 0, running: false })
          return
        }
        set({ remainingSeconds: next })
      },
      switchMode: (mode) => {
        const state = get()
        const nextSeconds = Math.round((mode === 'focus' ? state.focusMinutes : state.breakMinutes) * 60)
        set({ mode, remainingSeconds: nextSeconds, running: false })
      },
      rotateBackground: () => {
        const state = get()
        set({ backgroundIndex: (state.backgroundIndex + 1) % Math.max(1, state.assets.length) })
      },
      setAssets: (assets) => {
        if (assets.length === 0) return
        set({ assets })
      },
      setAudioTracks: (tracks) => {
        if (tracks.length === 0) return
        set({ audioTracks: tracks })
      },
      completeSession: (completed) => {
        const state = get()
        const gamification = { ...state.gamification }
        if (state.mode === 'focus' && completed) {
          gamification.sessionsToday += 1
          gamification.minutesFocusedToday += state.focusMinutes
          gamification.streak += 1
          gamification.xp += Math.round(state.focusMinutes * 2.6)
        } else if (state.mode === 'focus' && !completed) {
          gamification.streak = Math.max(0, gamification.streak - 1)
          gamification.xp = Math.max(0, gamification.xp - 15)
        }

        gamification.level = levelFromXp(gamification.xp)
        gamification.plantStage = stageFromSessions(gamification.sessionsToday)

        const quests = updateQuests(state.quests, gamification.sessionsToday, gamification.minutesFocusedToday)
        gamification.questsCompletedToday = quests.filter((quest) => quest.done).length

        set({ gamification, quests })
      },
      setPlanner: (result) => set({ planner: result }),
      setAiKey: (key) => set({ aiKey: key.trim() }),
    }),
    {
      name: 'focus-universe-store',
      partialize: (state) => ({
        focusMinutes: state.focusMinutes,
        breakMinutes: state.breakMinutes,
        gamification: state.gamification,
        quests: state.quests,
        planner: state.planner,
        aiKey: state.aiKey,
      }),
    },
  ),
)
