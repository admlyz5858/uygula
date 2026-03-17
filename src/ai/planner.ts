import type { PlannerOutput, PlannerTask } from "../types";

function parseHours(input: string): number {
  const hourMatch = input.match(/(\d+(?:\.\d+)?)\s*(hour|hours|h|saat)/i);
  const minuteMatch = input.match(/(\d+)\s*(minute|minutes|min|dk)/i);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const result = hours * 60 + minutes;
  return result > 0 ? result : 90;
}

function inferTopic(input: string): string {
  const cleaned = input.trim();
  if (cleaned.length < 10) {
    return "Deep Work";
  }
  return cleaned
    .replace(/\d+(?:\.\d+)?\s*(hour|hours|h|saat|minute|minutes|min|dk)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
}

export function generateAiPlan(goalInput: string, focusMinutes = 25): PlannerOutput {
  const totalMinutes = parseHours(goalInput);
  const totalSessions = Math.max(1, Math.ceil(totalMinutes / focusMinutes));
  const topic = inferTopic(goalInput);

  const blocks = Math.min(4, Math.max(2, Math.ceil(totalSessions / 2)));
  const sessionsPerBlock = Math.ceil(totalSessions / blocks);

  const tasks: PlannerTask[] = Array.from({ length: blocks }, (_, idx) => {
    const isLast = idx === blocks - 1;
    const sessions = isLast
      ? totalSessions - sessionsPerBlock * (blocks - 1)
      : sessionsPerBlock;
    return {
      title: `${topic || "Focus"} · Block ${idx + 1}`,
      sessions,
      minutes: sessions * focusMinutes
    };
  }).filter((t) => t.sessions > 0);

  const recommendedSchedule = [
    "Start with 1 warm-up focus session (lowest-friction task).",
    "Run 2-3 deep sessions before checking messages.",
    "Take a long break after every 4 sessions.",
    "Reserve final block for review + summary notes."
  ];

  return {
    summary: `${topic || "Goal"} mapped to ${totalSessions} pomodoros (~${totalMinutes} min).`,
    tasks,
    recommendedSchedule
  };
}
