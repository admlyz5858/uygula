import { offlinePlanner } from '../../data/fallbackPlanner'
import type { PlannerResult } from '../../data/types'

export async function buildPlan(goal: string, apiKey?: string): Promise<PlannerResult> {
  if (!goal.trim()) {
    return offlinePlanner('Focus blocks for deep work')
  }

  if (!apiKey) return offlinePlanner(goal)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'You are a productivity coach. Return JSON with objective, tasks[{title,minutes,pomodoros,priority}], scheduleTip.',
          },
          { role: 'user', content: goal },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error('AI planning request failed')
    }

    const payload = await response.json()
    const raw = payload.choices?.[0]?.message?.content
    if (!raw) throw new Error('No AI response content')
    const json = JSON.parse(raw) as PlannerResult
    if (!Array.isArray(json.tasks)) throw new Error('Invalid AI payload')
    return json
  } catch {
    return offlinePlanner(goal)
  }
}
