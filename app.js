const SETTINGS_STORAGE_KEY = "focus-pomodoro-settings-v1";
const MEDIA_STORAGE_KEY = "focus-pomodoro-media-v1";

const DEFAULT_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
};

const VISUALS = [
  {
    src: "assets/images/countryside.webp",
    title: "Countryside Path",
    credit: "CC0 · Pixel.la Free Stock Photos / Wikimedia Commons",
  },
  {
    src: "assets/images/river.webp",
    title: "River in Fall",
    credit: "Public Domain · U.S. Fish and Wildlife Service / Wikimedia Commons",
  },
  {
    src: "assets/images/autumn.webp",
    title: "Beautiful Autumn Day",
    credit: "Public Domain · Photos Public Domain / Wikimedia Commons",
  },
];

const TRACKS = [
  {
    id: "gymnopedie",
    title: "Gymnopédie No.1 (Focus)",
    src: "assets/music/gymnopedie-focus.ogg",
    credit: "CC0 1.0 · Kevin MacLeod düzenlemesi / Wikimedia Commons",
  },
  {
    id: "waves",
    title: "Ocean Waves Ambience",
    src: "assets/music/waves-focus.ogg",
    credit: "Public Domain · Dsw4 / Wikimedia Commons",
  },
  {
    id: "campfire",
    title: "Campfire Ambience",
    src: "assets/music/campfire-focus.ogg",
    credit: "CC BY 3.0 · Glaneur de sons / Wikimedia Commons",
  },
];

const state = {
  mode: "focus",
  remainingSeconds: DEFAULT_SETTINGS.focusMinutes * 60,
  running: false,
  completedFocusSessions: 0,
  intervalId: null,
  phaseDurationSeconds: DEFAULT_SETTINGS.focusMinutes * 60,
  settings: { ...DEFAULT_SETTINGS },
  visualIndex: 0,
  selectedTrackId: TRACKS[0].id,
  volume: 0.45,
  isMuted: false,
};

const modeLabel = document.getElementById("modeLabel");
const sessionCount = document.getElementById("sessionCount");
const timerDisplay = document.getElementById("timerDisplay");
const progressBar = document.getElementById("progressBar");
const bgImage = document.getElementById("bgImage");
const galleryImage = document.getElementById("galleryImage");
const galleryCaption = document.getElementById("galleryCaption");

const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const skipBtn = document.getElementById("skipBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const prevVisualBtn = document.getElementById("prevVisualBtn");
const nextVisualBtn = document.getElementById("nextVisualBtn");

const musicSelect = document.getElementById("musicSelect");
const volumeInput = document.getElementById("volumeInput");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const musicMuteBtn = document.getElementById("musicMuteBtn");
const trackMeta = document.getElementById("trackMeta");
const ambientPlayer = document.getElementById("ambientPlayer");

const focusInput = document.getElementById("focusInput");
const shortBreakInput = document.getElementById("shortBreakInput");
const longBreakInput = document.getElementById("longBreakInput");
const cycleInput = document.getElementById("cycleInput");

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
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

function loadMediaPreferences() {
  try {
    const saved = localStorage.getItem(MEDIA_STORAGE_KEY);
    if (!saved) {
      return;
    }
    const parsed = JSON.parse(saved);
    state.visualIndex = clamp(Number(parsed.visualIndex), 0, VISUALS.length - 1, 0);
    state.selectedTrackId = TRACKS.some((track) => track.id === parsed.selectedTrackId)
      ? parsed.selectedTrackId
      : TRACKS[0].id;
    state.volume = clamp(Number(parsed.volume * 100), 0, 100, 45) / 100;
    state.isMuted = Boolean(parsed.isMuted);
  } catch (_) {
    // Varsayılan ayarlar ile devam et.
  }
}

function saveMediaPreferences() {
  localStorage.setItem(
    MEDIA_STORAGE_KEY,
    JSON.stringify({
      visualIndex: state.visualIndex,
      selectedTrackId: state.selectedTrackId,
      volume: state.volume,
      isMuted: state.isMuted,
    }),
  );
}

function saveSettings() {
  const nextSettings = {
    focusMinutes: clamp(Number(focusInput.value), 1, 90, state.settings.focusMinutes),
    shortBreakMinutes: clamp(Number(shortBreakInput.value), 1, 30, state.settings.shortBreakMinutes),
    longBreakMinutes: clamp(Number(longBreakInput.value), 5, 60, state.settings.longBreakMinutes),
    longBreakEvery: clamp(Number(cycleInput.value), 2, 8, state.settings.longBreakEvery),
  };

  state.settings = nextSettings;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  initializeCurrentMode();
  updateUI();
}

function fillInputs() {
  focusInput.value = String(state.settings.focusMinutes);
  shortBreakInput.value = String(state.settings.shortBreakMinutes);
  longBreakInput.value = String(state.settings.longBreakMinutes);
  cycleInput.value = String(state.settings.longBreakEvery);
  volumeInput.value = String(Math.round(state.volume * 100));
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
  updateUI();
}

function stopTimer() {
  state.running = false;
  startPauseBtn.textContent = "Başlat";
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
  updateUI();
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
  const wasMusicPlaying = !ambientPlayer.paused;
  stopTimer();

  if (state.mode === "focus") {
    state.completedFocusSessions += 1;
    const useLongBreak = state.completedFocusSessions % state.settings.longBreakEvery === 0;
    state.mode = useLongBreak ? "longBreak" : "shortBreak";
  } else {
    state.mode = "focus";
  }

  syncVisualWithMode();
  syncTrackWithMode(wasMusicPlaying);
  state.phaseDurationSeconds = getModeDurationSeconds(state.mode);
  state.remainingSeconds = state.phaseDurationSeconds;

  if (!skipNotification) {
    notifyPhaseSwitch();
    vibratePhone();
    beep();
  }
}

function syncVisualWithMode() {
  if (state.mode === "focus") {
    setVisual(0);
  } else if (state.mode === "shortBreak") {
    setVisual(1);
  } else {
    setVisual(2);
  }
}

function syncTrackWithMode(keepPlaying) {
  if (state.mode === "focus") {
    selectTrack("gymnopedie", keepPlaying);
  } else if (state.mode === "shortBreak") {
    selectTrack("waves", keepPlaying);
  } else {
    selectTrack("campfire", keepPlaying);
  }
}

function updateUI() {
  timerDisplay.textContent = formatSeconds(state.remainingSeconds);
  sessionCount.textContent = `Tamamlanan odak: ${state.completedFocusSessions}`;
  document.body.classList.toggle("is-running", state.running);

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

function setVisual(index) {
  const normalized = (index + VISUALS.length) % VISUALS.length;
  state.visualIndex = normalized;
  const visual = VISUALS[normalized];
  galleryImage.src = visual.src;
  bgImage.src = visual.src;
  galleryCaption.textContent = `${visual.title} · ${visual.credit}`;
  saveMediaPreferences();
}

function goToNextVisual() {
  setVisual(state.visualIndex + 1);
}

function goToPrevVisual() {
  setVisual(state.visualIndex - 1);
}

function populateTrackSelect() {
  TRACKS.forEach((track) => {
    const option = document.createElement("option");
    option.value = track.id;
    option.textContent = track.title;
    musicSelect.append(option);
  });
}

function selectTrack(trackId, autoplayIfPlaying = false) {
  const track = TRACKS.find((item) => item.id === trackId);
  if (!track) {
    return;
  }
  const keepPlaying = autoplayIfPlaying && !ambientPlayer.paused;
  state.selectedTrackId = track.id;
  musicSelect.value = track.id;
  ambientPlayer.src = track.src;
  ambientPlayer.volume = state.volume;
  ambientPlayer.muted = state.isMuted;
  trackMeta.textContent = `${track.title} · ${track.credit}`;
  saveMediaPreferences();

  if (keepPlaying) {
    ambientPlayer.play().catch(() => {});
  }
}

function toggleMusic() {
  if (ambientPlayer.paused) {
    ambientPlayer.play().then(updateMusicButtons).catch(() => {});
  } else {
    ambientPlayer.pause();
    updateMusicButtons();
  }
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  ambientPlayer.muted = state.isMuted;
  saveMediaPreferences();
  updateMusicButtons();
}

function updateVolume() {
  state.volume = clamp(Number(volumeInput.value), 0, 100, 45) / 100;
  ambientPlayer.volume = state.volume;
  saveMediaPreferences();
}

function updateMusicButtons() {
  musicToggleBtn.textContent = ambientPlayer.paused ? "Müziği başlat" : "Müziği durdur";
  musicMuteBtn.textContent = state.isMuted ? "Sesi aç" : "Sessize al";
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
prevVisualBtn.addEventListener("click", goToPrevVisual);
nextVisualBtn.addEventListener("click", goToNextVisual);
musicToggleBtn.addEventListener("click", toggleMusic);
musicMuteBtn.addEventListener("click", toggleMute);
volumeInput.addEventListener("input", updateVolume);
musicSelect.addEventListener("change", (event) => selectTrack(event.target.value, true));
ambientPlayer.addEventListener("play", updateMusicButtons);
ambientPlayer.addEventListener("pause", updateMusicButtons);

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
loadMediaPreferences();
populateTrackSelect();
fillInputs();
initializeCurrentMode();
setVisual(state.visualIndex);
selectTrack(state.selectedTrackId);
updateMusicButtons();
updateUI();
