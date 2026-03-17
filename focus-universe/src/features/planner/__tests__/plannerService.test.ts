import { describe, expect, it } from 'vitest'
import { buildPlan } from '../plannerService'

describe('planner service', () => {
  it('returns fallback tasks without api key', async () => {
    const result = await buildPlan('Study physics for 3 hours')
    expect(result.tasks.length).toBeGreaterThan(0)
    expect(result.tasks[0].pomodoros).toBeGreaterThan(0)
  })
})
