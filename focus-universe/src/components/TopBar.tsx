import { Download, Moon, Sun } from 'lucide-react'
import type { FocusMode } from '../data/types'

interface Props {
  mode: FocusMode
  dark: boolean
  onModeChange: (mode: FocusMode) => void
  onToggleDark: () => void
  onExportVideo: () => void
}

export function TopBar({ mode, dark, onModeChange, onToggleDark, onExportVideo }: Props): JSX.Element {
  return (
    <header className="z-20 flex w-full max-w-6xl items-center justify-between rounded-full border border-white/15 bg-slate-950/45 px-6 py-3 text-white shadow-glass backdrop-blur-xl">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">Focus Universe</p>
        <p className="text-sm text-white/85">Netflix + Calm + Game + Productivity</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`rounded-full px-4 py-2 text-sm ${mode === 'focus' ? 'bg-focus text-slate-900' : 'bg-white/10'}`}
          onClick={() => onModeChange('focus')}
        >
          Focus
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm ${mode === 'break' ? 'bg-break text-slate-900' : 'bg-white/10'}`}
          onClick={() => onModeChange('break')}
        >
          Break
        </button>
        <button className="rounded-full bg-white/10 p-2" onClick={onToggleDark} aria-label="Toggle dark mode">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="rounded-full bg-white/10 px-3 py-2 text-sm" onClick={onExportVideo}>
          <Download className="mr-1 inline h-4 w-4" />
          Export 4K
        </button>
      </div>
    </header>
  )
}
