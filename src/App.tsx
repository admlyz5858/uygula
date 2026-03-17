import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Brain, Flame, Leaf, Play, Shield, Sparkles, Swords, Trophy, Users, Wand2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { generateAiPlan } from "./ai/planner";
import { levelFromXp, plantStage, productivityScore, xpForSession } from "./gamification/engine";
import {
  loadAmbientVolume,
  loadProgress,
  loadSelectedBackgroundId,
  loadSettings,
  loadTheme,
  saveAmbientVolume,
  saveProgress,
  saveSelectedBackgroundId,
  saveSettings,
  saveTheme,
} from "./lib/storage";
import { lastDays, streakFromRecords, upsertDayRecord } from "./stats/metrics";
import type { AppProgress, AudioTrack, BackgroundItem, PlannerOutput, ThemeMode, TimerMode } from "./types";

type RichBackground = BackgroundItem & { unlockLevel: number; mood: "focus" | "break" };

const SETTINGS_DEFAULT = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
};

const BACKGROUNDS: RichBackground[] = [
  {
    id: "forest_remote",
    name: "Forest Sanctuary",
    source: "unsplash",
    url: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=2400&q=80",
    unlockLevel: 1,
    mood: "focus",
  },
  {
    id: "rain_remote",
    name: "Rain Window",
    source: "pexels",
    url: "https://images.pexels.com/photos/1529360/pexels-photo-1529360.jpeg?auto=compress&cs=tinysrgb&w=2400",
    unlockLevel: 2,
    mood: "focus",
  },
  {
    id: "ocean_remote",
    name: "Ocean Breath",
    source: "unsplash",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80",
    unlockLevel: 3,
    mood: "break",
  },
  {
    id: "mountains_remote",
    name: "Mountain Clarity",
    source: "pexels",
    url: "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=2400",
    unlockLevel: 4,
    mood: "focus",
  },
  {
    id: "night_remote",
    name: "Night Cosmos",
    source: "unsplash",
    url: "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?auto=format&fit=crop&w=2400&q=80",
    unlockLevel: 5,
    mood: "break",
  },
  {
    id: "forest_local",
    name: "Local Forest",
    source: "local",
    url: "/assets/images/countryside.webp",
    unlockLevel: 1,
    mood: "focus",
  },
  {
    id: "river_local",
    name: "Local River",
    source: "local",
    url: "/assets/images/river.webp",
    unlockLevel: 1,
    mood: "break",
  },
  {
    id: "autumn_local",
    name: "Local Autumn",
    source: "local",
    url: "/assets/images/autumn.webp",
    unlockLevel: 1,
    mood: "focus",
  },
];

const TRACKS: (AudioTrack & { unlockLevel: number; gain: number })[] = [
  {
    id: "rain_focus",
    name: "Rain Focus",
    mode: "focus",
    url: "/assets/music/waves-focus.ogg",
    category: "ambient",
    unlockLevel: 1,
    gain: 0.82,
  },
  {
    id: "forest_focus",
    name: "Forest Lofi",
    mode: "focus",
    url: "/assets/music/gymnopedie-focus.ogg",
    category: "instrumental",
    unlockLevel: 2,
    gain: 0.74,
  },
  {
    id: "wind_focus",
    name: "Wind Drift",
    mode: "focus",
    url: "/assets/music/campfire-focus.ogg",
    category: "ambient",
    unlockLevel: 3,
    gain: 0.86,
  },
  {
    id: "rain_deep_focus",
    name: "Rain Deep Focus",
    mode: "focus",
    url: "/assets/music/waves-deep.ogg",
    category: "ambient",
    unlockLevel: 2,
    gain: 0.82,
  },
  {
    id: "forest_night_focus",
    name: "Forest Night Focus",
    mode: "focus",
    url: "/assets/music/forest-night.ogg",
    category: "ambient",
    unlockLevel: 3,
    gain: 0.84,
  },
  {
    id: "piano_dream_focus",
    name: "Piano Dream Focus",
    mode: "focus",
    url: "/assets/music/piano-dream.ogg",
    category: "instrumental",
    unlockLevel: 4,
    gain: 0.76,
  },
  {
    id: "piano_break",
    name: "Soft Piano Break",
    mode: "shortBreak",
    url: "/assets/music/gymnopedie-focus.ogg",
    category: "uplift",
    unlockLevel: 1,
    gain: 0.7,
  },
  {
    id: "chill_break",
    name: "Ocean Chill Break",
    mode: "shortBreak",
    url: "/assets/music/waves-focus.ogg",
    category: "uplift",
    unlockLevel: 1,
    gain: 0.78,
  },
  {
    id: "waves_soft_break",
    name: "Waves Soft Break",
    mode: "shortBreak",
    url: "/assets/music/waves-soft.ogg",
    category: "uplift",
    unlockLevel: 2,
    gain: 0.8,
  },
  {
    id: "piano_bright_break",
    name: "Piano Bright Break",
    mode: "shortBreak",
    url: "/assets/music/piano-bright.ogg",
    category: "uplift",
    unlockLevel: 3,
    gain: 0.78,
  },
  {
    id: "campfire_chill_break",
    name: "Campfire Chill Break",
    mode: "shortBreak",
    url: "/assets/music/campfire-chill.ogg",
    category: "uplift",
    unlockLevel: 4,
    gain: 0.84,
  },
  {
    id: "long_break_breath",
    name: "Long Break Breath",
    mode: "longBreak",
    url: "/assets/music/campfire-focus.ogg",
    category: "uplift",
    unlockLevel: 1,
    gain: 0.83,
  },
  {
    id: "long_break_waves",
    name: "Long Break Waves",
    mode: "longBreak",
    url: "/assets/music/waves-soft.ogg",
    category: "uplift",
    unlockLevel: 2,
    gain: 0.8,
  },
  {
    id: "long_break_piano",
    name: "Long Break Piano",
    mode: "longBreak",
    url: "/assets/music/piano-bright.ogg",
    category: "uplift",
    unlockLevel: 3,
    gain: 0.76,
  },
];

const FOCUS_QUOTES = [
  "You entered the focus universe.",
  "One session can change your whole day.",
  "Calm breath. Clear mind. Deep work.",
];

const BREAK_QUOTES = [
  "Great work. Recover with intention.",
  "Break gently. Return stronger.",
  "Your world is growing with every session.",
];

const BUILD_LABEL = "Build 1.3.0";
const INPUT_LIMITS = {
  focusMinutes: { min: 10, max: 90 },
  shortBreakMinutes: { min: 3, max: 30 },
  longBreakMinutes: { min: 10, max: 60 },
  longBreakEvery: { min: 2, max: 8 },
} as const;
const FOCUS_ROOMS = [
  { id: "deep-temple", name: "Deep Temple", participants: 19, bonusXp: 10 },
  { id: "silent-lake", name: "Silent Lake", participants: 12, bonusXp: 8 },
  { id: "night-owls", name: "Night Owls", participants: 27, bonusXp: 12 },
] as const;
const BOSS_CHALLENGES = [
  { id: "boss50", label: "Boss 50", minutes: 50, xpMultiplier: 2 },
  { id: "boss75", label: "Boss 75", minutes: 75, xpMultiplier: 2.6 },
] as const;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clampPercent(value: number): number {
  return clampNumber(value, 0, 100);
}

function sanitizeSettings(input: typeof SETTINGS_DEFAULT): typeof SETTINGS_DEFAULT {
  return {
    focusMinutes: clampNumber(Math.round(input.focusMinutes), INPUT_LIMITS.focusMinutes.min, INPUT_LIMITS.focusMinutes.max),
    shortBreakMinutes: clampNumber(
      Math.round(input.shortBreakMinutes),
      INPUT_LIMITS.shortBreakMinutes.min,
      INPUT_LIMITS.shortBreakMinutes.max,
    ),
    longBreakMinutes: clampNumber(
      Math.round(input.longBreakMinutes),
      INPUT_LIMITS.longBreakMinutes.min,
      INPUT_LIMITS.longBreakMinutes.max,
    ),
    longBreakEvery: clampNumber(Math.round(input.longBreakEvery), INPUT_LIMITS.longBreakEvery.min, INPUT_LIMITS.longBreakEvery.max),
  };
}

function getWeeklyBarHeight(sessions: number): number {
  return clampNumber(Math.round(sessions * 18), 6, 144);
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getDurationByMode(mode: TimerMode, settings: typeof SETTINGS_DEFAULT): number {
  if (mode === "focus") return settings.focusMinutes * 60;
  if (mode === "shortBreak") return settings.shortBreakMinutes * 60;
  return settings.longBreakMinutes * 60;
}

function shuffle<T>(arr: T[]): T[] {
  const copied = [...arr];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

async function preloadImage(src: string, timeout = 4500): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(false), timeout);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    img.src = src;
  });
}

function App() {
  const [ready, setReady] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [settings, setSettings] = useState(SETTINGS_DEFAULT);
  const [progress, setProgress] = useState<AppProgress>({
    xp: 0,
    level: 1,
    completedSessions: 0,
    streakDays: 0,
    plantHealth: 100,
    records: [],
  });
  const [mode, setMode] = useState<TimerMode>("focus");
  const [running, setRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(settings.focusMinutes * 60);
  const [phaseDuration, setPhaseDuration] = useState(settings.focusMinutes * 60);
  const [cycleCount, setCycleCount] = useState(0);
  const [quote, setQuote] = useState("Press START to enter focus universe.");
  const [immersive, setImmersive] = useState(false);

  const [currentBackground, setCurrentBackground] = useState<RichBackground>(BACKGROUNDS[0]);
  const [nextBackground, setNextBackground] = useState<RichBackground | null>(null);
  const [backgroundTransitioning, setBackgroundTransitioning] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState("forest_local");

  const [ambientVolume, setAmbientVolume] = useState(0.72);
  const [muted, setMuted] = useState(false);
  const [focusTrackId, setFocusTrackId] = useState("rain_focus");
  const [breakTrackId, setBreakTrackId] = useState("piano_break");
  const [breakLongTrackId, setBreakLongTrackId] = useState("long_break_breath");

  const [goalInput, setGoalInput] = useState("Study physics for 3 hours");
  const [plannerOutput, setPlannerOutput] = useState<PlannerOutput | null>(null);

  const [wateringPoints, setWateringPoints] = useState(0);
  const [rhythmPulseAt, setRhythmPulseAt] = useState(Date.now());
  const [rhythmScore, setRhythmScore] = useState(0);
  const [distractionGuardEnabled, setDistractionGuardEnabled] = useState(true);
  const [distractionCount, setDistractionCount] = useState(0);
  const [joinedRoomId, setJoinedRoomId] = useState<string>("");
  const [bossMode, setBossMode] = useState(false);
  const [bossMinutes, setBossMinutes] = useState<number | null>(null);
  const [bossSessionsWon, setBossSessionsWon] = useState(0);
  const [memoryCards, setMemoryCards] = useState(
    shuffle(["🌿", "🌿", "✨", "✨"]).map((value, idx) => ({
      id: idx,
      value,
      open: false,
      solved: false,
    })),
  );
  const [memoryPickedIds, setMemoryPickedIds] = useState<number[]>([]);

  const [exportingVideo, setExportingVideo] = useState(false);
  const [loadingBackground, setLoadingBackground] = useState(false);

  const timerRef = useRef<number | null>(null);
  const bgRotateRef = useRef<number | null>(null);
  const rhythmRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(remainingSeconds);
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioRef = useRef<"a" | "b">("a");
  const completingRef = useRef(false);
  const quickActionAppliedRef = useRef(false);

  const resolvedTheme = useMemo(() => {
    if (themeMode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return themeMode;
  }, [themeMode]);

  const unlockedBackgrounds = useMemo(
    () => BACKGROUNDS.filter((bg) => progress.level >= bg.unlockLevel),
    [progress.level],
  );

  const focusTracks = useMemo(
    () => TRACKS.filter((t) => t.mode === "focus" && progress.level >= t.unlockLevel),
    [progress.level],
  );

  const breakTracks = useMemo(
    () => TRACKS.filter((t) => t.mode === "shortBreak" && progress.level >= t.unlockLevel),
    [progress.level],
  );

  const longBreakTracks = useMemo(
    () => TRACKS.filter((t) => t.mode === "longBreak" && progress.level >= t.unlockLevel),
    [progress.level],
  );

  useEffect(() => {
    if (focusTracks.length > 0 && !focusTracks.some((track) => track.id === focusTrackId)) {
      setFocusTrackId(focusTracks[0].id);
    }
  }, [focusTracks, focusTrackId]);

  useEffect(() => {
    if (breakTracks.length > 0 && !breakTracks.some((track) => track.id === breakTrackId)) {
      setBreakTrackId(breakTracks[0].id);
    }
  }, [breakTracks, breakTrackId]);

  useEffect(() => {
    if (longBreakTracks.length > 0 && !longBreakTracks.some((track) => track.id === breakLongTrackId)) {
      setBreakLongTrackId(longBreakTracks[0].id);
    }
  }, [longBreakTracks, breakLongTrackId]);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayRecord = progress.records.find((r) => r.date === today) ?? {
    date: today,
    sessions: 0,
    focusMinutes: 0,
    xp: 0,
  };
  const weekRecords = lastDays(progress.records, 7);
  const heatmapRecords = lastDays(progress.records, 84);
  const weeklySessions = weekRecords.reduce((sum, item) => sum + item.sessions, 0);
  const weeklyMinutes = weekRecords.reduce((sum, item) => sum + item.focusMinutes, 0);
  const score = productivityScore(todayRecord.sessions, todayRecord.focusMinutes, progress.streakDays);
  const joinedRoom = FOCUS_ROOMS.find((room) => room.id === joinedRoomId) ?? null;

  const plant = plantStage(progress.completedSessions, progress.plantHealth);

  useEffect(() => {
    void (async () => {
      const [loadedSettings, loadedProgress, loadedTheme, loadedVolume, savedBackgroundId] =
        await Promise.all([
          loadSettings(),
          loadProgress(),
          loadTheme(),
          loadAmbientVolume(),
          loadSelectedBackgroundId(),
        ]);
      setSettings(sanitizeSettings(loadedSettings));
      setProgress({ ...loadedProgress, level: levelFromXp(loadedProgress.xp) });
      setThemeMode(loadedTheme);
      setAmbientVolume(loadedVolume);
      setSelectedBackgroundId(savedBackgroundId);
      const selected = BACKGROUNDS.find((bg) => bg.id === savedBackgroundId) ?? BACKGROUNDS[0];
      setCurrentBackground(selected);
      const duration = getDurationByMode("focus", loadedSettings);
      setRemainingSeconds(duration);
      setPhaseDuration(duration);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.body.className = resolvedTheme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900";
  }, [resolvedTheme]);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    let lastTick = Date.now();
    timerRef.current = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTick) / 1000);
      if (elapsed < 1) return;
      lastTick += elapsed * 1000;

      setRemainingSeconds((prev) => {
        const next = Math.max(0, prev - elapsed);
        if (next !== prev) {
          const currentSecond = Math.max(0, next);
          if (currentSecond <= 10 && currentSecond > 0 && lastSecondRef.current !== currentSecond) {
            playTick(currentSecond);
          }
          lastSecondRef.current = currentSecond;
        }
        if (next === 0 && !completingRef.current) {
          completingRef.current = true;
          void completePhase();
        }
        return next;
      });
    }, 250);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (bgRotateRef.current) window.clearInterval(bgRotateRef.current);
    bgRotateRef.current = null;
    if (unlockedBackgrounds.length < 2) return;

    const intervalMs = running ? 1000 * 60 * 5 : 1000 * 90;
    bgRotateRef.current = window.setInterval(() => {
      void rotateBackground();
    }, intervalMs);
    return () => {
      if (bgRotateRef.current) window.clearInterval(bgRotateRef.current);
      bgRotateRef.current = null;
    };
  }, [running, mode, unlockedBackgrounds.length, currentBackground.id]);

  useEffect(() => {
    if (!(mode !== "focus" && running)) {
      if (rhythmRef.current) window.clearInterval(rhythmRef.current);
      rhythmRef.current = null;
      return;
    }
    rhythmRef.current = window.setInterval(() => {
      setRhythmPulseAt(Date.now());
    }, 1200);
    return () => {
      if (rhythmRef.current) window.clearInterval(rhythmRef.current);
    };
  }, [mode, running]);

  useEffect(() => {
    if (!ready) return;
    void saveTheme(themeMode);
  }, [themeMode, ready]);

  useEffect(() => {
    if (!ready) return;
    void saveAmbientVolume(ambientVolume);
    applyActiveVolume();
  }, [ambientVolume, muted, ready]);

  useEffect(() => {
    if (!ready || quickActionAppliedRef.current) return;
    const quick = new URLSearchParams(window.location.search).get("quick");
    if (!quick) return;
    quickActionAppliedRef.current = true;
    if (quick === "focus15") {
      void startQuickSession(15, false);
    } else if (quick === "focus25") {
      void startQuickSession(25, false);
    } else if (quick === "focus50") {
      void startQuickSession(50, false);
    } else if (quick === "boss50") {
      void startQuickSession(50, true);
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [ready]);

  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden || !running || mode !== "focus" || !distractionGuardEnabled) return;
      setDistractionCount((prev) => prev + 1);
      setQuote("Distraction Guard: You left focus mode. Come back and reclaim momentum.");
      setProgress((prev) => {
        const damage = bossMode ? 10 : 5;
        const next = { ...prev, plantHealth: Math.max(0, prev.plantHealth - damage) };
        void saveProgress(next);
        return next;
      });
      void nudge();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [running, mode, distractionGuardEnabled, bossMode]);

  async function applyBackground(background: RichBackground) {
    setLoadingBackground(true);
    const ok = await preloadImage(background.url);
    const fallback = BACKGROUNDS.find((bg) => bg.source === "local") ?? BACKGROUNDS[0];
    const finalBackground = ok ? background : fallback;
    setNextBackground(finalBackground);
    setBackgroundTransitioning(true);
    window.setTimeout(() => {
      setCurrentBackground(finalBackground);
      setNextBackground(null);
      setBackgroundTransitioning(false);
      setLoadingBackground(false);
    }, 2400);
    setSelectedBackgroundId(finalBackground.id);
    await saveSelectedBackgroundId(finalBackground.id);
  }

  async function rotateBackground(targetMode: TimerMode = mode) {
    const pool = unlockedBackgrounds.filter((bg) => bg.mood === (targetMode === "focus" ? "focus" : "break"));
    const source = pool.length > 0 ? pool : unlockedBackgrounds;
    if (!source.length) return;
    const candidates = source.filter((bg) => bg.id !== currentBackground.id);
    const pickFrom = candidates.length > 0 ? candidates : source;
    const next = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    await applyBackground(next);
  }

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        lockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Ignore unsupported wake lock environments.
    }
  }

  async function releaseWakeLock() {
    try {
      await lockRef.current?.release();
      lockRef.current = null;
    } catch {
      // Ignore release errors.
    }
  }

  function currentTrackForMode(nextMode: TimerMode): AudioTrack & { gain: number } {
    const fallback = TRACKS[0];
    if (nextMode === "focus") {
      return focusTracks.find((t) => t.id === focusTrackId) ?? focusTracks[0] ?? fallback;
    }
    if (nextMode === "shortBreak") {
      return breakTracks.find((t) => t.id === breakTrackId) ?? breakTracks[0] ?? fallback;
    }
    return longBreakTracks.find((t) => t.id === breakLongTrackId) ?? longBreakTracks[0] ?? fallback;
  }

  function applyActiveVolume() {
    const active = activeAudioRef.current === "a" ? audioARef.current : audioBRef.current;
    if (!active) return;
    const track = currentTrackForMode(mode);
    active.volume = muted ? 0 : Math.max(0, Math.min(1, ambientVolume * track.gain));
  }

  async function crossfadeToTrack(nextMode: TimerMode, shouldAutoPlay: boolean) {
    const activeRef = activeAudioRef.current === "a" ? audioARef.current : audioBRef.current;
    const nextRef = activeAudioRef.current === "a" ? audioBRef.current : audioARef.current;
    const track = currentTrackForMode(nextMode);
    if (!nextRef) return;
    const nextAudio = nextRef;

    nextAudio.src = track.url;
    nextAudio.loop = true;
    nextAudio.currentTime = 0;
    nextAudio.volume = 0;

    if (shouldAutoPlay) {
      try {
        await nextAudio.play();
      } catch {
        return;
      }
    }

    const target = muted ? 0 : ambientVolume * track.gain;
    const duration = 2200;
    const start = performance.now();

    function step(now: number) {
      const progressValue = Math.min(1, (now - start) / duration);
      nextAudio.volume = target * progressValue;
      if (activeRef) {
        activeRef.volume = Math.max(0, (1 - progressValue) * target);
      }
      if (progressValue < 1) {
        requestAnimationFrame(step);
      } else if (activeRef) {
        activeRef.pause();
        activeRef.currentTime = 0;
      }
    }
    requestAnimationFrame(step);
    activeAudioRef.current = activeAudioRef.current === "a" ? "b" : "a";
  }

  async function refreshNativeNotification(isRunning: boolean) {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.requestPermissions();
      await LocalNotifications.cancel({ notifications: [{ id: 777 }] });
      if (!isRunning) return;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 777,
            title: "FOCUS UNIVERSE",
            body: `${mode === "focus" ? "Focus" : "Break"} ${formatClock(remainingSeconds)}`,
            schedule: { at: new Date(Date.now() + 1000) },
            ongoing: true as any,
            sound: undefined,
          } as any,
        ],
      });
    } catch {
      // Ignore notification errors on unsupported builds.
    }
  }

  async function startFocusWorld(forcedMode: TimerMode = mode) {
    setImmersive(true);
    setRunning(true);
    setQuote(FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]);
    completingRef.current = false;
    lastSecondRef.current = remainingSeconds;
    await requestWakeLock();
    await crossfadeToTrack(forcedMode, true);
    await refreshNativeNotification(true);
    await rotateBackground(forcedMode);
  }

  async function pauseSession() {
    setRunning(false);
    await releaseWakeLock();
    await refreshNativeNotification(false);
  }

  async function resetPhase() {
    if (mode === "focus" && running && remainingSeconds > 5) {
      setProgress((prev) => {
        const next = { ...prev, plantHealth: Math.max(0, prev.plantHealth - (bossMode ? 22 : 15)) };
        void saveProgress(next);
        return next;
      });
      setQuote(bossMode ? "Boss challenge failed. Your tree took heavy damage." : "Focus interrupted. Your plant needs consistency.");
    }
    setBossMode(false);
    setBossMinutes(null);
    await pauseSession();
    const duration = getDurationByMode(mode, settings);
    setPhaseDuration(duration);
    setRemainingSeconds(duration);
  }

  async function completePhase() {
    await pauseSession();
    playBell();
    await nudge();

    if (mode === "focus") {
      const baseMinutes = bossMode ? (bossMinutes ?? settings.focusMinutes) : settings.focusMinutes;
      const bossMultiplier = bossMode ? (baseMinutes >= 75 ? 2.6 : 2) : 1;
      const roomBonus = joinedRoom?.bonusXp ?? 0;
      const gainedXp = Math.round(xpForSession(baseMinutes) * bossMultiplier + roomBonus);
      const updatedRecords = upsertDayRecord(progress.records, today, {
        sessions: 1,
        focusMinutes: baseMinutes,
        xp: gainedXp,
      });
      const xpTotal = progress.xp + gainedXp;
      const nextProgress: AppProgress = {
        ...progress,
        xp: xpTotal,
        level: levelFromXp(xpTotal),
        completedSessions: progress.completedSessions + 1,
        records: updatedRecords,
        streakDays: streakFromRecords(updatedRecords),
        plantHealth: Math.min(100, progress.plantHealth + (bossMode ? 7 : 4)),
      };
      setProgress(nextProgress);
      void saveProgress(nextProgress);
      if (bossMode) {
        setBossSessionsWon((prev) => prev + 1);
        setQuote("Boss cleared. Massive XP gained.");
      } else {
        setQuote(BREAK_QUOTES[Math.floor(Math.random() * BREAK_QUOTES.length)]);
      }
    } else {
      setQuote(FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]);
    }

    const nextMode: TimerMode =
      mode === "focus"
        ? (cycleCount + 1) % settings.longBreakEvery === 0
          ? "longBreak"
          : "shortBreak"
        : "focus";

    setCycleCount((prev) => (mode === "focus" ? prev + 1 : prev));
    setMode(nextMode);
    const duration = getDurationByMode(nextMode, settings);
    setPhaseDuration(duration);
    setRemainingSeconds(duration);
    completingRef.current = false;
    if (bossMode && mode === "focus") {
      setBossMode(false);
      setBossMinutes(null);
    }
    await crossfadeToTrack(nextMode, true);
    await rotateBackground();
  }

  async function startQuickSession(minutes: number, asBoss: boolean) {
    const safeMinutes = clampNumber(Math.round(minutes), INPUT_LIMITS.focusMinutes.min, INPUT_LIMITS.focusMinutes.max);
    const nextSettings = sanitizeSettings({ ...settings, focusMinutes: safeMinutes });
    setSettings(nextSettings);
    await saveSettings(nextSettings);

    setMode("focus");
    setCycleCount(0);
    setBossMode(asBoss);
    setBossMinutes(asBoss ? safeMinutes : null);

    const duration = safeMinutes * 60;
    setPhaseDuration(duration);
    setRemainingSeconds(duration);

    await startFocusWorld("focus");
  }

  async function nudge() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      if ("vibrate" in navigator) navigator.vibrate([100, 80, 150]);
    }
  }

  function playTick(second: number) {
    try {
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const intensity = (11 - second) / 10;
      osc.frequency.value = 650 + intensity * 400;
      gain.gain.value = 0.04 + intensity * 0.06;
      osc.type = "triangle";
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08 + intensity * 0.1);
    } catch {
      // Ignore in restricted autoplay environments.
    }
  }

  function playBell() {
    try {
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch {
      // Ignore audio errors.
    }
  }

  function savePlanner() {
    setPlannerOutput(generateAiPlan(goalInput, settings.focusMinutes));
  }

  function tapRhythm() {
    const delta = Math.abs(Date.now() - rhythmPulseAt);
    if (delta <= 230) {
      setRhythmScore((prev) => prev + 2);
    } else if (delta <= 420) {
      setRhythmScore((prev) => prev + 1);
    }
  }

  function pickMemoryCard(id: number) {
    if (memoryPickedIds.length >= 2) return;
    const selected = memoryCards.find((c) => c.id === id);
    if (!selected || selected.solved || selected.open) return;

    const updated = memoryCards.map((card) => (card.id === id ? { ...card, open: true } : card));
    const picked = [...memoryPickedIds, id];
    setMemoryCards(updated);
    setMemoryPickedIds(picked);

    if (picked.length === 2) {
      const [a, b] = picked.map((pid) => updated.find((c) => c.id === pid)!);
      window.setTimeout(() => {
        if (a.value === b.value) {
          setMemoryCards((prev) => prev.map((card) => (picked.includes(card.id) ? { ...card, solved: true } : card)));
        } else {
          setMemoryCards((prev) => prev.map((card) => (picked.includes(card.id) ? { ...card, open: false } : card)));
        }
        setMemoryPickedIds([]);
      }, 500);
    }
  }

  async function handleVideoExport() {
    if (exportingVideo) return;
    setExportingVideo(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 3840;
      canvas.height = 2160;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      const context = ctx;

      const bg = new Image();
      bg.crossOrigin = "anonymous";
      bg.src = currentBackground.url;
      await new Promise<void>((resolve) => {
        bg.onload = () => resolve();
        bg.onerror = () => resolve();
      });

      const exportSeconds = Math.max(20, Math.min(remainingSeconds, 90));
      const stream = canvas.captureStream(30);

      const ambient = new Audio(currentTrackForMode(mode).url);
      ambient.loop = true;
      ambient.volume = ambientVolume * 0.6;
      try {
        await ambient.play();
      } catch {
        // Keep going even without audio stream.
      }
      const audioStream = (ambient as any).captureStream?.() as MediaStream | undefined;
      if (audioStream) {
        audioStream.getAudioTracks().forEach((track) => stream.addTrack(track));
      }

      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      const start = performance.now();
      recorder.start();

      await new Promise<void>((resolve) => {
        function draw() {
          const elapsed = (performance.now() - start) / 1000;
          const left = Math.max(0, exportSeconds - Math.floor(elapsed));
          context.drawImage(bg, 0, 0, canvas.width, canvas.height);
          context.fillStyle = "rgba(2, 6, 23, 0.45)";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = "rgba(255,255,255,0.92)";
          context.font = "bold 220px Inter, sans-serif";
          context.textAlign = "center";
          context.fillText(formatClock(left), canvas.width / 2, canvas.height / 2);
          context.font = "72px Inter, sans-serif";
          context.fillText("FOCUS UNIVERSE", canvas.width / 2, canvas.height / 2 + 140);
          context.font = "48px Inter, sans-serif";
          context.fillText(
            `${mode === "focus" ? "Deep Focus" : "Recharge Break"} Session`,
            canvas.width / 2,
            canvas.height / 2 + 220,
          );

          if (elapsed < exportSeconds) {
            requestAnimationFrame(draw);
          } else {
            recorder.stop();
            ambient.pause();
            resolve();
          }
        }
        requestAnimationFrame(draw);
      });

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focus-universe-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingVideo(false);
    }
  }

  function handleThemeChange(nextTheme: ThemeMode) {
    setThemeMode(nextTheme);
  }

  function handleSettingInput<K extends keyof typeof SETTINGS_DEFAULT>(key: K, value: string) {
    const parsed = Number(value);
    const limits = INPUT_LIMITS[key];
    const safe = clampNumber(Math.round(parsed), limits.min, limits.max);
    setSettings((prev) => ({ ...prev, [key]: Number.isFinite(parsed) ? safe : prev[key] }));
  }

  async function handleSettingsSave() {
    const sanitized = sanitizeSettings(settings);
    setSettings(sanitized);
    const nextDuration = getDurationByMode(mode, sanitized);
    setPhaseDuration(nextDuration);
    setRemainingSeconds(nextDuration);
    await saveSettings(sanitized);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-xl font-semibold">Loading FOCUS UNIVERSE…</p>
      </div>
    );
  }

  const progressPercent = clampPercent(((phaseDuration - remainingSeconds) / phaseDuration) * 100);
  const questDailyThree = todayRecord.sessions >= 3;
  const questFocus60 = todayRecord.focusMinutes >= 60;
  const questWeekly = weeklySessions >= 20;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <img
          src={currentBackground.url}
          className="h-full w-full animate-zoomBg object-cover"
          alt={currentBackground.name}
        />
        {nextBackground && (
          <img
            src={nextBackground.url}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2400ms] ${
              backgroundTransitioning ? "opacity-100" : "opacity-0"
            }`}
            alt={nextBackground.name}
          />
        )}
        <div className={`absolute inset-0 ${resolvedTheme === "dark" ? "bg-slate-950/40" : "bg-slate-100/15"}`} />
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute animate-drift rounded-full bg-white/20 blur-[1px]"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 18}s`,
              opacity: 0.2 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-6 md:px-6 ${immersive ? "immersive-grid" : ""}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">🔥 FOCUS UNIVERSE</h1>
            <p className="text-sm text-slate-200/90">Game + Meditation + Productivity System</p>
            <p className="text-xs font-medium text-cyan-200/90">{BUILD_LABEL}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["system", "light", "dark"] as ThemeMode[]).map((item) => (
              <button
                key={item}
                onClick={() => handleThemeChange(item)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  themeMode === item
                    ? "bg-violet-500 text-white"
                    : "glass-card px-3 py-2 text-slate-100"
                }`}
              >
                {item === "system" ? "Auto" : item === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-300" />
                <p className="font-semibold">{mode === "focus" ? "Deep Focus Mode" : "Restorative Break Mode"}</p>
              </div>
              <p className="text-sm text-slate-300">Streak: {progress.streakDays} 🔥</p>
            </div>

            <motion.div
              initial={{ opacity: 0.8, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900/35 p-8 text-center backdrop-blur"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`h-52 w-52 rounded-full bg-violet-400/25 blur-2xl ${running ? "animate-pulseSlow" : ""}`}
                  style={{ animationDuration: `${Math.max(2, Math.floor(phaseDuration / 40))}s` }}
                />
              </div>
              <p className="relative text-[5rem] font-black tracking-widest md:text-[7rem]">{formatClock(remainingSeconds)}</p>
              <p className="relative mt-1 text-sm text-slate-200">{quote}</p>
              <div className="relative mt-6 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-emerald-300 transition-all duration-200" style={{ width: `${progressPercent}%` }} />
              </div>
              {bossMode && (
                <p className="relative mt-3 text-sm font-semibold text-rose-300">
                  ⚔ Boss Challenge Active ({bossMinutes} min)
                </p>
              )}
            </motion.div>

            <div className="mt-4 flex flex-wrap gap-2">
              {!running ? (
                <button
                  onClick={() => void startFocusWorld()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-3 font-bold text-white"
                >
                  <Play className="h-5 w-5" /> START IMMERSION
                </button>
              ) : (
                <button onClick={pauseSession} className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-black">
                  Pause
                </button>
              )}
              <button onClick={resetPhase} className="rounded-xl bg-white/20 px-4 py-3 font-semibold">
                Reset
              </button>
              <button onClick={completePhase} className="rounded-xl bg-emerald-500/80 px-4 py-3 font-semibold text-slate-900">
                Skip
              </button>
              <button
                onClick={handleVideoExport}
                disabled={exportingVideo}
                className="rounded-xl bg-sky-500/80 px-4 py-3 font-semibold text-slate-900 disabled:opacity-60"
              >
                {exportingVideo ? "Exporting 4K..." : "Export 4K Video"}
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-white/15 bg-slate-950/30 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Play className="h-4 w-4 text-cyan-200" />
                <p className="text-sm font-semibold">Quick Actions</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void startQuickSession(15, false)} className="rounded-lg bg-cyan-500/80 px-3 py-2 text-sm font-semibold text-slate-900">
                  Quick 15
                </button>
                <button onClick={() => void startQuickSession(25, false)} className="rounded-lg bg-cyan-500/80 px-3 py-2 text-sm font-semibold text-slate-900">
                  Quick 25
                </button>
                <button onClick={() => void startQuickSession(50, false)} className="rounded-lg bg-cyan-500/80 px-3 py-2 text-sm font-semibold text-slate-900">
                  Quick 50
                </button>
                {BOSS_CHALLENGES.map((challenge) => (
                  <button
                    key={challenge.id}
                    onClick={() => void startQuickSession(challenge.minutes, true)}
                    className="rounded-lg bg-rose-500/80 px-3 py-2 text-sm font-semibold text-white"
                  >
                    {challenge.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-white/15 bg-slate-950/30 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-200" />
                <p className="text-sm font-semibold">Distraction Guard</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setDistractionGuardEnabled((prev) => !prev)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    distractionGuardEnabled ? "bg-emerald-500/80 text-slate-900" : "bg-white/20"
                  }`}
                >
                  {distractionGuardEnabled ? "Guard ON" : "Guard OFF"}
                </button>
                <p className="text-sm text-slate-200">Distractions: {distractionCount}</p>
                {bossSessionsWon > 0 && <p className="text-sm text-rose-200">Boss wins: {bossSessionsWon}</p>}
              </div>
            </div>
          </section>

          <section className="glass-card space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-300" />
              <h2 className="text-lg font-bold">Living World Progress</h2>
            </div>
            <p className="text-4xl">{plant === "seed" ? "🌰" : plant === "sprout" ? "🌱" : plant === "tree" ? "🌳" : plant === "withered" ? "🥀" : "🌌🌳"}</p>
            <p className="text-sm capitalize">Plant stage: {plant}</p>
            <p className="text-sm">Health: {Math.round(clampPercent(progress.plantHealth))}%</p>
            <p className="text-sm">XP: {progress.xp} · Level: {progress.level}</p>
            <p className="text-sm">Completed sessions: {progress.completedSessions}</p>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-2 rounded-full bg-emerald-300" style={{ width: `${clampPercent(progress.plantHealth)}%` }} />
            </div>

            <div className="rounded-xl border border-white/15 bg-slate-950/30 p-3">
              <h3 className="mb-2 font-semibold">Daily + Weekly Quests</h3>
              <p className={`text-sm ${questDailyThree ? "text-emerald-300" : "text-slate-200"}`}>
                {questDailyThree ? "✅" : "⬜"} Complete 3 sessions
              </p>
              <p className={`text-sm ${questFocus60 ? "text-emerald-300" : "text-slate-200"}`}>
                {questFocus60 ? "✅" : "⬜"} Focus 60 minutes
              </p>
              <p className={`text-sm ${questWeekly ? "text-emerald-300" : "text-slate-200"}`}>
                {questWeekly ? "✅" : "⬜"} Weekly mission: 20 sessions
              </p>
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="glass-card p-4 lg:col-span-2">
            <div className="mb-2 flex items-center gap-2">
              <Brain className="h-5 w-5 text-cyan-200" />
              <h2 className="font-bold">AI Planner</h2>
            </div>
            <textarea
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="h-24 w-full rounded-xl border border-white/20 bg-slate-950/30 p-3 text-sm outline-none"
              placeholder="Study physics 3 hours"
              maxLength={180}
            />
            <p className="mt-1 text-right text-[11px] text-slate-300">{goalInput.length}/180</p>
            <div className="mt-2 flex gap-2">
              <button onClick={savePlanner} className="rounded-xl bg-violet-500 px-4 py-2 font-semibold">
                Generate AI Plan
              </button>
            </div>
            {plannerOutput && (
              <div className="mt-3 space-y-2 rounded-xl border border-white/15 bg-slate-950/30 p-3 text-sm">
                <p className="font-semibold">{plannerOutput.summary}</p>
                {plannerOutput.tasks.map((task) => (
                  <p key={task.title}>
                    • {task.title} — {task.sessions} sessions ({task.minutes} min)
                  </p>
                ))}
                {plannerOutput.recommendedSchedule.map((line) => (
                  <p key={line} className="text-slate-300">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </section>

          <section className="glass-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-amber-200" />
              <h2 className="font-bold">Ambient Control</h2>
            </div>

            <p className="mb-1 text-xs uppercase tracking-wider text-slate-300">Environment (auto fetch + fallback)</p>
            <div className="hide-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
              {unlockedBackgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => void applyBackground(bg)}
                  className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold ${
                    selectedBackgroundId === bg.id ? "bg-violet-500 text-white" : "bg-white/15"
                  }`}
                >
                  {bg.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-300">
              {loadingBackground ? "Loading high-quality visual..." : `${currentBackground.name} · Auto cycle enabled`}
            </p>

            <p className="mb-1 mt-3 text-xs uppercase tracking-wider text-slate-300">Focus audio</p>
            <select
              value={focusTrackId}
              onChange={(e) => setFocusTrackId(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-slate-950/40 p-2 text-sm"
            >
              {focusTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>

            <p className="mb-1 mt-3 text-xs uppercase tracking-wider text-slate-300">Break audio</p>
            <select
              value={breakTrackId}
              onChange={(e) => setBreakTrackId(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-slate-950/40 p-2 text-sm"
            >
              {breakTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>

            <p className="mb-1 mt-3 text-xs uppercase tracking-wider text-slate-300">Long break audio</p>
            <select
              value={breakLongTrackId}
              onChange={(e) => setBreakLongTrackId(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-slate-950/40 p-2 text-sm"
            >
              {longBreakTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>

            <div className="mt-3">
              <p className="mb-1 text-xs uppercase tracking-wider text-slate-300">Volume normalization</p>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(ambientVolume * 100)}
                onChange={(e) => setAmbientVolume(Number(e.target.value) / 100)}
                className="w-full"
              />
              <div className="mt-2 flex gap-2">
                <button onClick={() => setMuted((prev) => !prev)} className="rounded-xl bg-white/20 px-3 py-2 text-sm">
                  {muted ? "Unmute" : "Mute"}
                </button>
                <button onClick={() => void crossfadeToTrack(mode, true)} className="rounded-xl bg-cyan-500/80 px-3 py-2 text-sm text-slate-900">
                  Crossfade now
                </button>
              </div>
            </div>
          </section>
        </div>

        <section className="glass-card mt-4 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-200" />
            <h2 className="font-bold">Focus Rooms</h2>
          </div>
          <p className="text-sm text-slate-300">Join a room for social accountability and extra XP.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {FOCUS_ROOMS.map((room) => {
              const joined = room.id === joinedRoomId;
              return (
                <button
                  key={room.id}
                  onClick={() => setJoinedRoomId((prev) => (prev === room.id ? "" : room.id))}
                  className={`rounded-xl border p-3 text-left ${
                    joined ? "border-cyan-300 bg-cyan-500/20" : "border-white/20 bg-slate-950/30"
                  }`}
                >
                  <p className="font-semibold">{room.name}</p>
                  <p className="text-xs text-slate-300">{room.participants + (joined ? 1 : 0)} users online</p>
                  <p className="text-xs text-emerald-300">+{room.bonusXp} XP per focus session</p>
                </button>
              );
            })}
          </div>
          {joinedRoom && (
            <p className="mt-2 text-sm text-cyan-100">
              Joined: <span className="font-semibold">{joinedRoom.name}</span>
            </p>
          )}
        </section>

        <section className="glass-card mt-4 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Swords className="h-5 w-5 text-rose-300" />
            <h2 className="font-bold">Boss Challenges</h2>
          </div>
          <p className="text-sm text-slate-300">
            Challenge mode grants major XP boosts, but interruption causes stronger plant-health penalties.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BOSS_CHALLENGES.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => void startQuickSession(challenge.minutes, true)}
                className="rounded-lg bg-rose-500/80 px-3 py-2 text-sm font-semibold text-white"
              >
                Start {challenge.minutes}m Boss (x{challenge.xpMultiplier} XP)
              </button>
            ))}
          </div>
        </section>

        {mode !== "focus" && (
          <section className="glass-card mt-4 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5 text-emerald-300" />
              Relaxing Break Mini Activities
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/15 bg-slate-950/30 p-3">
                <p className="font-semibold">💧 Water your plant</p>
                <p className="text-sm text-slate-300">Water points: {wateringPoints}</p>
                <button onClick={() => setWateringPoints((prev) => prev + 1)} className="mt-2 rounded-lg bg-emerald-500/80 px-3 py-2 text-sm font-semibold text-slate-900">
                  Water
                </button>
              </div>
              <div className="rounded-xl border border-white/15 bg-slate-950/30 p-3">
                <p className="font-semibold">🎵 Rhythm tap</p>
                <motion.div
                  key={rhythmPulseAt}
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 1.05, opacity: 0.25 }}
                  transition={{ duration: 1.15 }}
                  className="mx-auto mt-2 h-14 w-14 rounded-full bg-cyan-300/60"
                />
                <p className="mt-2 text-sm text-slate-300">Score: {rhythmScore}</p>
                <button onClick={tapRhythm} className="mt-2 rounded-lg bg-cyan-500/80 px-3 py-2 text-sm font-semibold text-slate-900">
                  Tap on beat
                </button>
              </div>
              <div className="rounded-xl border border-white/15 bg-slate-950/30 p-3">
                <p className="font-semibold">🧩 Memory puzzle</p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {memoryCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => pickMemoryCard(card.id)}
                      className={`rounded-lg px-2 py-2 text-center ${
                        card.open || card.solved ? "bg-violet-400/70" : "bg-white/15"
                      }`}
                    >
                      {card.open || card.solved ? card.value : "?"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="glass-card mt-4 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-300" />
            <h2 className="font-bold">Stats & Psychological Momentum</h2>
          </div>
          <p className="text-sm text-slate-300">
            Productivity score: <span className="font-bold text-white">{score}</span> · Weekly focus: {weeklyMinutes} min
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-slate-950/30 p-3">
              <p className="mb-2 text-sm font-semibold">Last 7 days sessions</p>
              <div className="flex h-36 items-end gap-2 overflow-hidden">
                {weekRecords.map((item) => (
                  <div key={item.date} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-gradient-to-t from-violet-500 to-cyan-300" style={{ height: `${getWeeklyBarHeight(item.sessions)}px` }} />
                    <span className="text-[10px] text-slate-300">{item.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/15 bg-slate-950/30 p-3">
              <p className="mb-2 text-sm font-semibold">Focus heatmap (12 weeks)</p>
              <div className="grid grid-cols-12 gap-1">
                {heatmapRecords.map((item) => (
                  <span
                    key={item.date}
                    className={`h-3 w-3 rounded-sm ${
                      item.focusMinutes >= 90
                        ? "bg-emerald-400"
                        : item.focusMinutes >= 45
                          ? "bg-emerald-300/80"
                          : item.focusMinutes > 0
                            ? "bg-emerald-200/50"
                            : "bg-white/10"
                    }`}
                    title={`${item.date} · ${item.focusMinutes} min`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card mt-4 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-rose-300" />
            <h2 className="font-bold">Timer Settings</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm">
              Focus (min)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950/30 p-2"
                value={settings.focusMinutes}
                min={INPUT_LIMITS.focusMinutes.min}
                max={INPUT_LIMITS.focusMinutes.max}
                step={1}
                inputMode="numeric"
                onChange={(e) => handleSettingInput("focusMinutes", e.target.value)}
              />
            </label>
            <label className="text-sm">
              Short Break
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950/30 p-2"
                value={settings.shortBreakMinutes}
                min={INPUT_LIMITS.shortBreakMinutes.min}
                max={INPUT_LIMITS.shortBreakMinutes.max}
                step={1}
                inputMode="numeric"
                onChange={(e) => handleSettingInput("shortBreakMinutes", e.target.value)}
              />
            </label>
            <label className="text-sm">
              Long Break
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950/30 p-2"
                value={settings.longBreakMinutes}
                min={INPUT_LIMITS.longBreakMinutes.min}
                max={INPUT_LIMITS.longBreakMinutes.max}
                step={1}
                inputMode="numeric"
                onChange={(e) => handleSettingInput("longBreakMinutes", e.target.value)}
              />
            </label>
            <label className="text-sm">
              Long break every
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-white/20 bg-slate-950/30 p-2"
                value={settings.longBreakEvery}
                min={INPUT_LIMITS.longBreakEvery.min}
                max={INPUT_LIMITS.longBreakEvery.max}
                step={1}
                inputMode="numeric"
                onChange={(e) => handleSettingInput("longBreakEvery", e.target.value)}
              />
            </label>
          </div>
          <button onClick={() => void handleSettingsSave()} className="mt-3 rounded-xl bg-violet-500 px-4 py-2 font-semibold">
            Save settings
          </button>
        </section>
      </div>

      <audio ref={audioARef} preload="auto" />
      <audio ref={audioBRef} preload="auto" />
    </div>
  );
}

export default App;
