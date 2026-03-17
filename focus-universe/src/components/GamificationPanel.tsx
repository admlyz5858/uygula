import type { GamificationState, Quest } from '../data/types'

interface Props {
  game: GamificationState
  quests: Quest[]
}

const plantEmoji: Record<GamificationState['plantStage'], string> = {
  seed: '🌱',
  sprout: '🌿',
  tree: '🌳',
  'magical-tree': '🌌🌳',
}

export function GamificationPanel({ game, quests }: Props): JSX.Element {
  return (
    <section className="rounded-3xl border border-white/15 bg-slate-900/45 p-5 text-white backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Growth Engine</h3>
        <span className="text-2xl">{plantEmoji[game.plantStage]}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <InfoTile label="XP" value={String(game.xp)} />
        <InfoTile label="Level" value={String(game.level)} />
        <InfoTile label="Streak" value={`${game.streak} 🔥`} />
        <InfoTile label="Focused Today" value={`${game.minutesFocusedToday}m`} />
      </div>
      <div className="mt-4 space-y-2">
        {quests.map((quest) => (
          <div key={quest.id} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
            <p className="text-sm font-medium">{quest.title}</p>
            <p className="text-xs text-white/70">
              {quest.progress}/{quest.target} • +{quest.rewardXp} XP {quest.done ? '✅' : ''}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function InfoTile({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  )
}
