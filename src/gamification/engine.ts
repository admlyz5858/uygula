export function xpForSession(minutes: number): number {
  return Math.max(20, Math.round(minutes * 1.2));
}

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 120) + 1);
}

export function plantStage(completedSessions: number, health: number): string {
  if (health <= 20) return "withered";
  if (completedSessions < 2) return "seed";
  if (completedSessions < 6) return "sprout";
  if (completedSessions < 16) return "tree";
  return "magical tree";
}

export function productivityScore(
  sessionsToday: number,
  minutesToday: number,
  streakDays: number,
): number {
  const base = sessionsToday * 14 + minutesToday * 0.65 + streakDays * 4;
  return Math.max(0, Math.min(100, Math.round(base)));
}
