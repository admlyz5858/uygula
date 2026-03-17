import { useMemo, useState } from 'react'

export function BreakMiniGames(): JSX.Element {
  const [water, setWater] = useState(20)
  const [rhythm, setRhythm] = useState(0)
  const [memoryState, setMemoryState] = useState<number[]>([])
  const target = useMemo(() => [1, 2, 1, 3], [])

  const memoryDone = memoryState.join('-') === target.join('-')

  return (
    <section className="rounded-3xl border border-white/15 bg-slate-900/45 p-5 text-white backdrop-blur-md">
      <h3 className="text-lg font-semibold">Break Mini Activities</h3>
      <p className="text-sm text-white/70">Light play to reset your mind without stress.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-medium">💧 Watering plants</p>
          <p className="text-xs text-white/70">Growth hydration: {water}%</p>
          <button className="mt-2 rounded-full bg-emerald-300/80 px-3 py-1 text-xs text-slate-900" onClick={() => setWater((value) => Math.min(100, value + 10))}>
            Water
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-medium">🎵 Rhythm tap</p>
          <p className="text-xs text-white/70">Combo: {rhythm}</p>
          <button className="mt-2 rounded-full bg-amber-300/90 px-3 py-1 text-xs text-slate-900" onClick={() => setRhythm((value) => value + 1)}>
            Tap on beat
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-medium">🧩 Memory pulse</p>
          <p className="text-xs text-white/70">{memoryDone ? 'Sequence complete ✅' : 'Repeat 1-2-1-3'}</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3].map((button) => (
              <button
                key={button}
                className="rounded-full bg-slate-200/85 px-2 py-1 text-xs font-semibold text-slate-900"
                onClick={() =>
                  setMemoryState((prev) => {
                    const next = [...prev, button].slice(-4)
                    return next
                  })
                }
              >
                {button}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
