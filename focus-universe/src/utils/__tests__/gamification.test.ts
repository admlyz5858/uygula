import { describe, expect, it } from 'vitest'
import { defaultQuests, levelFromXp, stageFromSessions, updateQuests } from '../gamification'

describe('gamification helpers', () => {
  it('calculates level from xp', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(181)).toBe(2)
    expect(levelFromXp(540)).toBe(4)
  })

  it('returns correct plant stage', () => {
    expect(stageFromSessions(1)).toBe('seed')
    expect(stageFromSessions(9)).toBe('sprout')
    expect(stageFromSessions(25)).toBe('tree')
    expect(stageFromSessions(42)).toBe('magical-tree')
  })

  it('updates quest progress safely', () => {
    const quests = defaultQuests()
    const updated = updateQuests(quests, 3, 62)
    expect(updated[0].done).toBe(true)
    expect(updated[1].done).toBe(true)
    expect(updated[2].done).toBe(false)
  })
})
