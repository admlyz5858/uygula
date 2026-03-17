export type FocusMode = 'focus' | 'break'

export interface NatureAsset {
  id: string
  category: 'forest' | 'rain' | 'ocean' | 'mountains' | 'night'
  imageUrl: string
  videoUrl?: string
  credit: string
}

export interface AudioTrack {
  id: string
  mode: FocusMode
  title: string
  url: string
  category: 'rain' | 'birds' | 'wind' | 'lofi' | 'piano' | 'chill' | 'nature'
}

export interface SessionRecord {
  id?: number
  startedAt: number
  endedAt: number
  mode: FocusMode
  completed: boolean
  durationSeconds: number
  productivityScore: number
}

export interface GamificationState {
  xp: number
  level: number
  streak: number
  plantStage: 'seed' | 'sprout' | 'tree' | 'magical-tree'
  questsCompletedToday: number
  sessionsToday: number
  minutesFocusedToday: number
}

export interface Quest {
  id: string
  title: string
  target: number
  progress: number
  rewardXp: number
  done: boolean
}

export interface PlannerResult {
  objective: string
  tasks: Array<{
    title: string
    minutes: number
    pomodoros: number
    priority: number
  }>
  scheduleTip: string
}
