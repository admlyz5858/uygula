export type TimerMode = "focus" | "shortBreak" | "longBreak";
export type ThemeMode = "system" | "dark" | "light";

export interface TimerSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
}

export interface BackgroundItem {
  id: string;
  name: string;
  source: "unsplash" | "pexels" | "local";
  url: string;
}

export interface AudioTrack {
  id: string;
  name: string;
  mode: TimerMode;
  url: string;
  category: "ambient" | "instrumental" | "uplift";
}

export interface DayRecord {
  date: string;
  focusMinutes: number;
  sessions: number;
  xp: number;
}

export interface AppProgress {
  xp: number;
  level: number;
  completedSessions: number;
  streakDays: number;
  plantHealth: number;
  records: DayRecord[];
}

export interface PlannerTask {
  title: string;
  sessions: number;
  minutes: number;
}

export interface PlannerOutput {
  summary: string;
  tasks: PlannerTask[];
  recommendedSchedule: string[];
}

export type KpssTrack = "GK-GY" | "Egitim Bilimleri" | "OABT";

export interface KpssGoal {
  track: KpssTrack;
  topic: string;
  dailyQuestions: number;
  dailyMinutes: number;
}

export interface KpssSessionLog {
  id: string;
  date: string;
  track: KpssTrack;
  topic: string;
  questions: number;
  correct: number;
  wrong: number;
  minutes: number;
  isSimulation: boolean;
}

export interface KpssTrialResult {
  id: string;
  date: string;
  track: KpssTrack;
  correct: number;
  wrong: number;
  net: number;
}

export interface KpssMistakeItem {
  id: string;
  date: string;
  track: KpssTrack;
  topic: string;
  questionRef: string;
  errorType: string;
  reason: string;
  stage: number;
  nextReviewAt: string;
}

export interface KpssReviewEvent {
  date: string;
  count: number;
}

export interface KpssData {
  goal: KpssGoal;
  logs: KpssSessionLog[];
  trials: KpssTrialResult[];
  mistakes: KpssMistakeItem[];
  reviews: KpssReviewEvent[];
  aiGoalInput: string;
  remainingDays: number;
  currentNet: number;
}
