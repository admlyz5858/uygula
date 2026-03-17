import { openDB } from "idb";
import type { AppProgress, KpssData, ThemeMode, TimerSettings } from "../types";

const DB_NAME = "focus-universe-db";
const STORE_NAME = "kv";

const DEFAULT_SETTINGS: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4
};

const DEFAULT_PROGRESS: AppProgress = {
  xp: 0,
  level: 1,
  completedSessions: 0,
  streakDays: 0,
  plantHealth: 100,
  records: []
};

const DEFAULT_KPSS_DATA: KpssData = {
  goal: {
    track: "GK-GY",
    topic: "Paragraf + Problem",
    dailyQuestions: 120,
    dailyMinutes: 180
  },
  logs: [],
  trials: [],
  mistakes: [],
  reviews: [],
  aiGoalInput: "KPSS'ye 90 gün kaldı. GK-GY netimi 75'e çıkar.",
  remainingDays: 90,
  currentNet: 52
};

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  }
});

export async function saveValue<T>(key: string, value: T): Promise<void> {
  const db = await dbPromise;
  await db.put(STORE_NAME, value, key);
}

export async function loadValue<T>(key: string, fallback: T): Promise<T> {
  const db = await dbPromise;
  const value = (await db.get(STORE_NAME, key)) as T | undefined;
  return value ?? fallback;
}

export async function loadSettings(): Promise<TimerSettings> {
  return loadValue<TimerSettings>("settings", DEFAULT_SETTINGS);
}

export async function saveSettings(settings: TimerSettings): Promise<void> {
  return saveValue("settings", settings);
}

export async function loadProgress(): Promise<AppProgress> {
  return loadValue<AppProgress>("progress", DEFAULT_PROGRESS);
}

export async function saveProgress(progress: AppProgress): Promise<void> {
  return saveValue("progress", progress);
}

export async function loadTheme(): Promise<ThemeMode> {
  return loadValue<ThemeMode>("theme", "system");
}

export async function saveTheme(theme: ThemeMode): Promise<void> {
  return saveValue("theme", theme);
}

export async function loadAmbientVolume(): Promise<number> {
  return loadValue<number>("ambientVolume", 0.72);
}

export async function saveAmbientVolume(volume: number): Promise<void> {
  return saveValue("ambientVolume", volume);
}

export async function loadSelectedBackgroundId(): Promise<string> {
  return loadValue<string>("backgroundId", "forest_local");
}

export async function saveSelectedBackgroundId(id: string): Promise<void> {
  return saveValue("backgroundId", id);
}

export async function loadKpssData(): Promise<KpssData> {
  return loadValue<KpssData>("kpssData", DEFAULT_KPSS_DATA);
}

export async function saveKpssData(data: KpssData): Promise<void> {
  return saveValue("kpssData", data);
}
