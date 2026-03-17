import type { GamificationState, Quest } from '../data/types'

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 180) + 1)
}

export function stageFromSessions(sessions: number): GamificationState['plantStage'] {
  if (sessions >= 40) return 'magical-tree'
  if (sessions >= 20) return 'tree'
  if (sessions >= 8) return 'sprout'
  return 'seed'
}

export function defaultQuests(): Quest[] {
  return [
    { id: 'daily-3', title: 'Complete 3 sessions', target: 3, progress: 0, rewardXp: 80, done: false },
    { id: 'daily-60', title: 'Focus 60 minutes', target: 60, progress: 0, rewardXp: 110, done: false },
    { id: 'weekly-12', title: 'Weekly mission: 12 sessions', target: 12, progress: 0, rewardXp: 260, done: false },
  ]
}

export function updateQuests(quests: Quest[], sessionsToday: number, minutesFocused: number): Quest[] {
  return quests.map((quest) => {
    const metric = quest.id.includes('60') ? minutesFocused : sessionsToday
    const progress = Math.min(metric, quest.target)
    return { ...quest, progress, done: progress >= quest.target }
  })
}
