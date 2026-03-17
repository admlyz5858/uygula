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
