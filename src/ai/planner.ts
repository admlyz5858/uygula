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

export function generateKpssCoachPlan(params: {
  goalInput: string;
  track: string;
  remainingDays: number;
  currentNet: number;
  weakTopics: string[];
}): PlannerOutput {
  const { goalInput, track, remainingDays, currentNet, weakTopics } = params;
  const targetHint = goalInput || `${track} netini yükselt`;
  const urgency = remainingDays <= 45 ? "high" : remainingDays <= 90 ? "medium" : "balanced";
  const weak = weakTopics.length > 0 ? weakTopics.slice(0, 3) : ["Paragraf", "Problem", "Tarih tekrar"];
  const netGap = Math.max(0, 85 - currentNet);

  const tasks: PlannerTask[] = [
    {
      title: `${track} Çekirdek konu blokları (${weak[0]})`,
      sessions: urgency === "high" ? 4 : 3,
      minutes: urgency === "high" ? 200 : 150
    },
    {
      title: `Soru çözüm + hız antrenmanı (${weak[1] ?? "Soru seti"})`,
      sessions: urgency === "high" ? 5 : 4,
      minutes: urgency === "high" ? 250 : 200
    },
    {
      title: `Yanlış defteri tekrarları (${weak[2] ?? "Tekrar"})`,
      sessions: 2,
      minutes: 100
    },
    {
      title: "Deneme + analiz",
      sessions: urgency === "high" ? 2 : 1,
      minutes: urgency === "high" ? 150 : 90
    }
  ];

  const recommendedSchedule = [
    `Current net: ${currentNet}. Estimated gap to 85 net: ~${netGap}.`,
    "Sabah blok: konu anlatım + mini test, öğleden sonra yoğun soru çözümü.",
    "Her gün en az 1 yanlış defteri tekrarı ve 1 hız bloğu ekle.",
    "Haftada en az 2 deneme, deneme sonrası 60 dakikalık analiz zorunlu.",
    "Zayıf konu sıralaması: " + weak.join(" > ")
  ];

  return {
    summary: `${targetHint} için ${remainingDays} gün kaldı. ${urgency.toUpperCase()} yoğunlukta KPSS planı üretildi.`,
    tasks,
    recommendedSchedule
  };
}
