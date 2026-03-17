import { Pause, Play, RefreshCcw, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatClock } from '../utils/time'
import type { FocusMode } from '../data/types'

interface Props {
  mode: FocusMode
  running: boolean
  remainingSeconds: number
  progress: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
}

export function TimerHUD(props: Props): JSX.Element {
  const { mode, running, remainingSeconds, progress, onStart, onPause, onResume, onReset } = props
  const isFocus = mode === 'focus'

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-3xl rounded-[36px] border border-white/20 bg-white/10 p-8 text-white shadow-glass backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-focus" />
          <p className="text-sm uppercase tracking-[0.35em] text-white/70">{isFocus ? 'Focus World' : 'Recovery Zone'}</p>
        </div>
        <p className="text-sm text-white/70">{isFocus ? 'Calm + Deep' : 'Light + Recharge'}</p>
      </div>

      <p className="text-center text-7xl font-semibold tracking-wider">{formatClock(remainingSeconds)}</p>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/20">
        <motion.div
          className={`h-full rounded-full ${isFocus ? 'bg-focus' : 'bg-break'}`}
          animate={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="mt-7 flex justify-center gap-3">
        {!running && remainingSeconds > 0 ? (
          <button className="rounded-full bg-focus px-5 py-3 font-medium text-slate-900" onClick={onStart}>
            <Play className="mr-1 inline h-4 w-4" /> Start
          </button>
        ) : null}
        {running ? (
          <button className="rounded-full bg-white/20 px-5 py-3 font-medium" onClick={onPause}>
            <Pause className="mr-1 inline h-4 w-4" /> Pause
          </button>
        ) : null}
        {!running && remainingSeconds > 0 ? (
          <button className="rounded-full bg-white/20 px-5 py-3 font-medium" onClick={onResume}>
            <Play className="mr-1 inline h-4 w-4" /> Resume
          </button>
        ) : null}
        <button className="rounded-full bg-white/15 px-5 py-3 font-medium" onClick={onReset}>
          <RefreshCcw className="mr-1 inline h-4 w-4" /> Reset
        </button>
      </div>
    </motion.section>
  )
}
