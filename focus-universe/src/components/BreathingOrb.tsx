import { motion } from 'framer-motion'

interface Props {
  running: boolean
}

export function BreathingOrb({ running }: Props): JSX.Element {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute h-56 w-56 rounded-full bg-emerald-200/25 blur-3xl"
        animate={{
          scale: running ? [1, 1.2, 1] : [1, 1.06, 1],
          opacity: running ? [0.35, 0.65, 0.35] : [0.18, 0.3, 0.18],
        }}
        transition={{ duration: running ? 6 : 8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
      <motion.div
        className="relative h-40 w-40 rounded-full border border-white/30 bg-white/10 shadow-glass backdrop-blur-xl"
        animate={{ scale: running ? [0.95, 1.07, 0.95] : [0.97, 1.02, 0.97] }}
        transition={{ duration: running ? 5 : 7, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
    </div>
  )
}
