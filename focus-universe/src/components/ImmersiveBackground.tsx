import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import type { NatureAsset } from '../data/types'

interface Props {
  assets: NatureAsset[]
  index: number
  running: boolean
}

const particles = Array.from({ length: 24 }, (_, i) => i)

export function ImmersiveBackground({ assets, index, running }: Props): JSX.Element {
  const asset = assets[index % Math.max(assets.length, 1)] ?? assets[0]
  const modeClass = running ? 'blur-[1px]' : 'blur-[5px]'

  const backgroundStyle = useMemo(
    () => ({
      backgroundImage: `url(${asset?.imageUrl ?? ''})`,
      transform: running ? 'scale(1.08)' : 'scale(1.02)',
    }),
    [asset?.imageUrl, running],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={asset?.id ?? 'fallback'}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-[3000ms] ${modeClass}`}
          style={backgroundStyle}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.4, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/35 via-slate-950/45 to-slate-950/80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(212,249,255,0.22),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(141,231,202,0.18),transparent_40%)]" />

      {particles.map((id) => (
        <motion.span
          key={id}
          className="absolute rounded-full bg-white/20"
          style={{
            width: `${(id % 4) + 2}px`,
            height: `${(id % 4) + 2}px`,
            top: `${(id * 7) % 100}%`,
            left: `${(id * 11) % 100}%`,
          }}
          animate={{ y: [0, -18, 0], opacity: [0.15, 0.6, 0.2] }}
          transition={{ duration: 5 + (id % 6), repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
