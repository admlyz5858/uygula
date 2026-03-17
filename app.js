const STORAGE_KEY = "focus-pomodoro-settings-v1";

const DEFAULT_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
};

const state = {
  mode: "focus",
  remainingSeconds: DEFAULT_SETTINGS.focusMinutes * 60,
  running: false,
  completedFocusSessions: 0,
  intervalId: null,
  phaseDurationSeconds: DEFAULT_SETTINGS.focusMinutes * 60,
  settings: { ...DEFAULT_SETTINGS },
};

const modeLabel = document.getElementById("modeLabel");
const sessionCount = document.getElementById("sessionCount");
const timerDisplay = document.getElementById("timerDisplay");
const progressBar = document.getElementById("progressBar");

const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const skipBtn = document.getElementById("skipBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

const focusInput = document.getElementById("focusInput");
const shortBreakInput = document.getElementById("shortBreakInput");
const longBreakInput = document.getElementById("longBreakInput");
const cycleInput = document.getElementById("cycleInput");

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return;
    }
    const parsed = JSON.parse(saved);
    state.settings = {
      focusMinutes: clamp(parsed.focusMinutes, 1, 90, DEFAULT_SETTINGS.focusMinutes),
      shortBreakMinutes: clamp(parsed.shortBreakMinutes, 1, 30, DEFAULT_SETTINGS.shortBreakMinutes),
      longBreakMinutes: clamp(parsed.longBreakMinutes, 5, 60, DEFAULT_SETTINGS.longBreakMinutes),
      longBreakEvery: clamp(parsed.longBreakEvery, 2, 8, DEFAULT_SETTINGS.longBreakEvery),
    };
  } catch (_) {
    state.settings = { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  const nextSettings = {
    focusMinutes: clamp(Number(focusInput.value), 1, 90, state.settings.focusMinutes),
    shortBreakMinutes: clamp(Number(shortBreakInput.value), 1, 30, state.settings.shortBreakMinutes),
    longBreakMinutes: clamp(Number(longBreakInput.value), 5, 60, state.settings.longBreakMinutes),
    longBreakEvery: clamp(Number(cycleInput.value), 2, 8, state.settings.longBreakEvery),
  };

  state.settings = nextSettings;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
  initializeCurrentMode();
  updateUI();
}

function fillInputs() {
  focusInput.value = String(state.settings.focusMinutes);
  shortBreakInput.value = String(state.settings.shortBreakMinutes);
  longBreakInput.value = String(state.settings.longBreakMinutes);
  cycleInput.value = String(state.settings.longBreakEvery);
}

function clamp(value, min, max, fallback) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function initializeCurrentMode() {
  const duration = getModeDurationSeconds(state.mode);
  state.phaseDurationSeconds = duration;
  state.remainingSeconds = duration;
  stopTimer();
}

function getModeDurationSeconds(mode) {
  if (mode === "focus") {
    return state.settings.focusMinutes * 60;
  }
  if (mode === "shortBreak") {
    return state.settings.shortBreakMinutes * 60;
  }
  return state.settings.longBreakMinutes * 60;
}

function toggleStartPause() {
  if (state.running) {
    stopTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (state.running) {
    return;
  }
  state.running = true;
  startPauseBtn.textContent = "Duraklat";

  // Arka planda zaman kaymasını azaltmak için her tikte gerçek zaman farkı hesaplanır.
  let lastTick = performance.now();

  state.intervalId = window.setInterval(() => {
    const now = performance.now();
    const elapsed = Math.floor((now - lastTick) / 1000);
    if (elapsed < 1) {
      return;
    }
    lastTick += elapsed * 1000;
    state.remainingSeconds = Math.max(0, state.remainingSeconds - elapsed);

    if (state.remainingSeconds === 0) {
      onPhaseFinished();
    }
    updateUI();
  }, 250);
}

function stopTimer() {
  state.running = false;
  startPauseBtn.textContent = "Başlat";
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

function resetCurrentPhase() {
  initializeCurrentMode();
  updateUI();
}

function skipPhase() {
  onPhaseFinished(true);
  updateUI();
}

function onPhaseFinished(skipNotification = false) {
  stopTimer();

  if (state.mode === "focus") {
    state.completedFocusSessions += 1;
    const useLongBreak = state.completedFocusSessions % state.settings.longBreakEvery === 0;
    state.mode = useLongBreak ? "longBreak" : "shortBreak";
  } else {
    state.mode = "focus";
  }

  state.phaseDurationSeconds = getModeDurationSeconds(state.mode);
  state.remainingSeconds = state.phaseDurationSeconds;

  if (!skipNotification) {
    notifyPhaseSwitch();
    vibratePhone();
    beep();
  }
}

function updateUI() {
  timerDisplay.textContent = formatSeconds(state.remainingSeconds);
  sessionCount.textContent = `Tamamlanan odak: ${state.completedFocusSessions}`;

  if (state.mode === "focus") {
    modeLabel.textContent = "Odak";
    modeLabel.classList.remove("mode-badge--break");
    modeLabel.classList.add("mode-badge--focus");
    document.title = `${timerDisplay.textContent} · Odak`;
  } else if (state.mode === "shortBreak") {
    modeLabel.textContent = "Kısa mola";
    modeLabel.classList.remove("mode-badge--focus");
    modeLabel.classList.add("mode-badge--break");
    document.title = `${timerDisplay.textContent} · Kısa mola`;
  } else {
    modeLabel.textContent = "Uzun mola";
    modeLabel.classList.remove("mode-badge--focus");
    modeLabel.classList.add("mode-badge--break");
    document.title = `${timerDisplay.textContent} · Uzun mola`;
  }

  const completed = state.phaseDurationSeconds - state.remainingSeconds;
  const progress = (completed / state.phaseDurationSeconds) * 100;
  progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function notifyPhaseSwitch() {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
    return;
  }

  if (Notification.permission === "granted") {
    const body = state.mode === "focus" ? "Odak seansı başladı." : "Mola zamanı başladı.";
    new Notification("Pomodoro", { body });
  }
}

function vibratePhone() {
  if ("vibrate" in navigator) {
    navigator.vibrate([200, 100, 250]);
  }
}

function beep() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
  } catch (_) {
    // Sessizce geç: bazı tarayıcılarda ses kilidi olabilir.
  }
}

startPauseBtn.addEventListener("click", toggleStartPause);
resetBtn.addEventListener("click", resetCurrentPhase);
skipBtn.addEventListener("click", skipPhase);
saveSettingsBtn.addEventListener("click", saveSettings);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    updateUI();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

loadSettings();
fillInputs();
initializeCurrentMode();
updateUI();
