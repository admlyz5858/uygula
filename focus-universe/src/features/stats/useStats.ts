import { eachDayOfInterval, endOfDay, format, startOfDay, subDays } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { getSessions } from '../../data/db'
import type { SessionRecord } from '../../data/types'

export interface StatsView {
  sessions: SessionRecord[]
  dailyMinutes: Array<{ day: string; minutes: number }>
  weeklyMinutes: Array<{ label: string; value: number }>
  heatmap: Array<{ date: string; intensity: number }>
  productivityScore: number
}

export function useStats(days = 30): StatsView {
  const [sessions, setSessions] = useState<SessionRecord[]>([])

  useEffect(() => {
    void getSessions(days).then((items) => setSessions(items))
  }, [days])

  return useMemo(() => {
    const now = new Date()
    const start = subDays(now, 13)
    const dayList = eachDayOfInterval({ start, end: now })

    const dailyMinutes = dayList.map((day) => {
      const dayStart = startOfDay(day).getTime()
      const dayEnd = endOfDay(day).getTime()
      const total = sessions
        .filter((session) => session.startedAt >= dayStart && session.startedAt <= dayEnd && session.mode === 'focus')
        .reduce((sum, session) => sum + Math.round(session.durationSeconds / 60), 0)
      return { day: format(day, 'EEE'), minutes: total }
    })

    const weeklyMinutes = [
      { label: 'Week-1', value: dailyMinutes.slice(0, 7).reduce((sum, item) => sum + item.minutes, 0) },
      { label: 'Week-2', value: dailyMinutes.slice(7).reduce((sum, item) => sum + item.minutes, 0) },
    ]

    const heatmap = eachDayOfInterval({ start: subDays(now, 55), end: now }).map((day) => {
      const dayStart = startOfDay(day).getTime()
      const dayEnd = endOfDay(day).getTime()
      const total = sessions
        .filter((session) => session.startedAt >= dayStart && session.startedAt <= dayEnd && session.mode === 'focus')
        .reduce((sum, session) => sum + session.durationSeconds / 60, 0)
      return { date: format(day, 'yyyy-MM-dd'), intensity: Math.min(4, Math.floor(total / 25)) }
    })

    const productivityScore =
      sessions.length === 0 ? 0 : Math.round(sessions.reduce((sum, item) => sum + item.productivityScore, 0) / sessions.length)

    return { sessions, dailyMinutes, weeklyMinutes, heatmap, productivityScore }
  }, [sessions])
}
