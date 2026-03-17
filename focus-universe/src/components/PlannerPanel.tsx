import { useState } from 'react'
import { buildPlan } from '../features/planner/plannerService'
import { useFocusStore } from '../data/store'

export function PlannerPanel(): JSX.Element {
  const [goal, setGoal] = useState('Study physics for 3 hours')
  const [loading, setLoading] = useState(false)
  const planner = useFocusStore((state) => state.planner)
  const setPlanner = useFocusStore((state) => state.setPlanner)
  const aiKey = useFocusStore((state) => state.aiKey)
  const setAiKey = useFocusStore((state) => state.setAiKey)

  const handleGenerate = async (): Promise<void> => {
    setLoading(true)
    const result = await buildPlan(goal, aiKey || undefined)
    setPlanner(result)
    setLoading(false)
  }

  return (
    <section className="rounded-3xl border border-white/15 bg-slate-900/45 p-5 text-white backdrop-blur-md">
      <h3 className="text-lg font-semibold">AI Planning Console</h3>
      <p className="mt-1 text-sm text-white/70">Goal → smart task split → pomodoro schedule</p>

      <textarea
        className="mt-3 w-full rounded-2xl border border-white/20 bg-slate-950/40 p-3 text-sm focus:border-focus focus:outline-none"
        rows={3}
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
      />
      <input
        className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/40 px-3 py-2 text-xs focus:border-focus focus:outline-none"
        placeholder="Optional OpenAI key (stored locally)"
        value={aiKey}
        onChange={(event) => setAiKey(event.target.value)}
      />

      <button
        className="mt-3 rounded-full bg-focus px-4 py-2 text-sm font-semibold text-slate-900"
        onClick={() => void handleGenerate()}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Generate Focus Strategy'}
      </button>

      {planner ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-focus">{planner.scheduleTip}</p>
          {planner.tasks.map((task) => (
            <div key={task.title} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
              <p className="font-medium">{task.title}</p>
              <p className="text-xs text-white/70">
                {task.minutes} min • {task.pomodoros} pomodoros • priority {task.priority}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
