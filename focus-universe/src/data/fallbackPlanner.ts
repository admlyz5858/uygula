import type { PlannerResult } from './types'

const templates = [
  { keyword: 'study', title: 'Concept review', minutes: 50 },
  { keyword: 'physics', title: 'Problem set drilling', minutes: 45 },
  { keyword: 'coding', title: 'Implement feature slice', minutes: 60 },
  { keyword: 'exam', title: 'Mock test + error review', minutes: 55 },
  { keyword: 'writing', title: 'Deep draft sprint', minutes: 50 },
]

export function offlinePlanner(goal: string): PlannerResult {
  const normalized = goal.toLowerCase()
  const selected = templates.filter((template) => normalized.includes(template.keyword))
  const list = (selected.length > 0 ? selected : templates.slice(0, 3)).slice(0, 4)

  const tasks = list.map((template, index) => ({
    title: template.title,
    minutes: template.minutes,
    pomodoros: Math.max(1, Math.round(template.minutes / 25)),
    priority: 5 - index,
  }))

  return {
    objective: goal,
    tasks,
    scheduleTip: 'Start with the highest cognitive task in the first two sessions and keep breaks intentional.',
  }
}
