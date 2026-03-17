export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const min = Math.floor(safe / 60)
  const sec = safe % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function minutesToSeconds(minutes: number): number {
  return Math.max(1, Math.round(minutes * 60))
}
