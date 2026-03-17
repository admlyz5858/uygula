const STORAGE_KEY = "misket-arena-preferences-v1";
const CHAMPIONSHIP_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const TEAM_NAMES = ["Nordic", "Atlantic", "Mediterranean", "Americas", "Asia", "Africa", "Pacific", "Eurasia"];

const PALETTE = [
  "#22d3ee",
  "#7c3aed",
  "#f59e0b",
  "#fb7185",
  "#4ade80",
  "#60a5fa",
  "#f97316",
  "#e879f9",
  "#14b8a6",
  "#facc15",
  "#38bdf8",
  "#a3e635",
  "#ef4444",
  "#818cf8",
  "#06b6d4",
];

const PARTICIPANT_DATA = [
  ["TUR", "Turkey", "Eurasia"],
  ["JPN", "Japan", "Pacific"],
  ["BRA", "Brazil", "Americas"],
  ["GER", "Germany", "Atlantic"],
  ["ITA", "Italy", "Mediterranean"],
  ["FRA", "France", "Atlantic"],
  ["ESP", "Spain", "Mediterranean"],
  ["GBR", "United Kingdom", "Atlantic"],
  ["NOR", "Norway", "Nordic"],
  ["SWE", "Sweden", "Nordic"],
  ["FIN", "Finland", "Nordic"],
  ["CAN", "Canada", "Americas"],
  ["USA", "United States", "Americas"],
  ["MEX", "Mexico", "Americas"],
  ["ARG", "Argentina", "Americas"],
  ["CHL", "Chile", "Americas"],
  ["PER", "Peru", "Americas"],
  ["EGY", "Egypt", "Africa"],
  ["MAR", "Morocco", "Africa"],
  ["NGA", "Nigeria", "Africa"],
  ["KEN", "Kenya", "Africa"],
  ["ZAF", "South Africa", "Africa"],
  ["IND", "India", "Asia"],
  ["CHN", "China", "Asia"],
  ["KOR", "South Korea", "Asia"],
  ["IDN", "Indonesia", "Asia"],
  ["THA", "Thailand", "Asia"],
  ["SAU", "Saudi Arabia", "Eurasia"],
  ["UAE", "United Arab Emirates", "Eurasia"],
  ["AUS", "Australia", "Pacific"],
  ["NZL", "New Zealand", "Pacific"],
  ["GRC", "Greece", "Mediterranean"],
  ["PRT", "Portugal", "Atlantic"],
  ["NLD", "Netherlands", "Atlantic"],
  ["BEL", "Belgium", "Atlantic"],
  ["POL", "Poland", "Atlantic"],
  ["UKR", "Ukraine", "Eurasia"],
  ["CZE", "Czechia", "Atlantic"],
  ["AUT", "Austria", "Mediterranean"],
  ["CHE", "Switzerland", "Mediterranean"],
  ["ROU", "Romania", "Eurasia"],
  ["HUN", "Hungary", "Eurasia"],
  ["SRB", "Serbia", "Eurasia"],
  ["HRV", "Croatia", "Mediterranean"],
  ["SVN", "Slovenia", "Mediterranean"],
  ["DNK", "Denmark", "Nordic"],
  ["ISL", "Iceland", "Nordic"],
  ["IRL", "Ireland", "Atlantic"],
  ["QAT", "Qatar", "Eurasia"],
  ["VNM", "Vietnam", "Asia"],
  ["PHL", "Philippines", "Pacific"],
  ["MYS", "Malaysia", "Asia"],
  ["PAK", "Pakistan", "Asia"],
  ["KAZ", "Kazakhstan", "Eurasia"],
  ["UZB", "Uzbekistan", "Eurasia"],
  ["GEO", "Georgia", "Eurasia"],
  ["ARM", "Armenia", "Eurasia"],
  ["AZE", "Azerbaijan", "Eurasia"],
  ["COL", "Colombia", "Americas"],
  ["URY", "Uruguay", "Americas"],
];

const PARTICIPANTS = PARTICIPANT_DATA.map(([code, name, team], index) => {
  const color = PALETTE[index % PALETTE.length];
  return {
    id: code,
    code,
    name,
    team,
    color,
    accent: PALETTE[(index + 5) % PALETTE.length],
    pace: statFromText(`${code}:pace`, 0.78, 1.2),
    stability: statFromText(`${code}:stability`, 0.76, 1.16),
    aggression: statFromText(`${code}:aggression`, 0.62, 1.18),
    fortune: statFromText(`${code}:fortune`, 0.68, 1.22),
  };
});

const TRACKS = [
  {
    id: "team-sprint",
    name: "Takim Sprinti",
    shortLabel: "Takim",
    inspiration: "The Team Marble Race 3 in Algodoo - 30 Colors",
    author: "Humin",
    summary:
      "30 renkli takim hissini veren hiz koridorlari, spinner bolumu ve akici grup temposuna sahip bir acilis pisti.",
    rulesText: "4 tur, boost koridorlari ve grup baskisiyla saf hiz yarisi",
    hazardText: "Launch ramp, chaos spinner, funnel escape",
    colorA: "#22d3ee",
    colorB: "#7c3aed",
    laps: 4,
    baseSpeed: 0.14,
    maxMarbles: 40,
    visualWidth: 0.1,
    path: [
      [0.12, 0.5],
      [0.2, 0.24],
      [0.38, 0.16],
      [0.64, 0.18],
      [0.84, 0.34],
      [0.8, 0.58],
      [0.62, 0.76],
      [0.34, 0.8],
      [0.16, 0.66],
      [0.12, 0.5],
    ],
    hazards: [
      {
        id: "launch",
        type: "boost",
        label: "Launch Ramp",
        start: 0.05,
        end: 0.14,
        strength: 0.28,
        description: "Acilis duzlugunde hiz kazanip pack'i ayirir.",
      },
      {
        id: "spinner",
        type: "spinner",
        label: "Chaos Spinner",
        start: 0.29,
        end: 0.41,
        strength: 0.55,
        frequency: 8,
        description: "Marble'lari saga sola savuran kaotik orta sektor.",
      },
      {
        id: "funnel",
        type: "funnel",
        label: "Funnel Escape",
        start: 0.74,
        end: 0.88,
        strength: 0.44,
        description: "Daralan cikista istikrarli marbles avantaj saglar.",
      },
    ],
    notes: [
      "Takim baskisi ve hiz koridorlari videodaki 30 renkli toplu cikis duygusunu hedefler.",
      "Spinner + funnel kombinasyonu kalabalik pack'i parcalamak icin kullanilir.",
    ],
  },
  {
    id: "territory-war",
    name: "Territory Clash",
    shortLabel: "Bolge",
    inspiration: "Territory War x Country Marbles - Marble Race in Algodoo",
    author: "RAIDEN",
    summary:
      "Ulke misketleri, pist ustundeki kontrol zonlarinda takim enerjisi biriktirir ve kazanan bolgeye gecici turbo acilir.",
    rulesText: "3 tur, kontrol bolgesi kazanci ve sureli takim buff sistemi",
    hazardText: "Territory nodes, splitter gate, rough switchback",
    colorA: "#34d399",
    colorB: "#38bdf8",
    laps: 3,
    baseSpeed: 0.135,
    maxMarbles: 36,
    visualWidth: 0.11,
    path: [
      [0.14, 0.52],
      [0.22, 0.22],
      [0.46, 0.16],
      [0.74, 0.22],
      [0.86, 0.44],
      [0.76, 0.7],
      [0.52, 0.78],
      [0.28, 0.72],
      [0.14, 0.52],
    ],
    hazards: [
      {
        id: "north-zone",
        type: "territory",
        label: "North Capture Zone",
        start: 0.14,
        end: 0.23,
        strength: 0.42,
        description: "Bu zonda daha fazla team presence saglayan ekip gecici hiz buff'i alir.",
      },
      {
        id: "splitter",
        type: "split",
        label: "Frontier Splitter",
        start: 0.38,
        end: 0.48,
        strength: 0.34,
        description: "Ulke pack'ini kisa ve uzun koridorlara ayiran rastlantili gecit.",
        branches: [
          { label: "Fast lane", lane: -0.58, speed: 1.09, weight: 0.34 },
          { label: "Stable lane", lane: 0, speed: 1.02, weight: 0.4 },
          { label: "Wide lane", lane: 0.58, speed: 0.95, weight: 0.26 },
        ],
      },
      {
        id: "south-zone",
        type: "territory",
        label: "South Capture Zone",
        start: 0.64,
        end: 0.74,
        strength: 0.46,
        description: "Finale yakin ikinci kontrol nodu; comeback sansi verir.",
      },
      {
        id: "rough",
        type: "rough",
        label: "Border Switchback",
        start: 0.8,
        end: 0.92,
        strength: 0.4,
        description: "Agresif cizgi alimi hata cezasi dogurur.",
      },
    ],
    notes: [
      "Territory war basligi dogrudan harita hakimiyeti hissi verdigi icin bolge kontrol zorlugu eklendi.",
      "Ulke temali roster ile takim buff'lari ayni anda calisir.",
    ],
  },
  {
    id: "world-elimination",
    name: "World Elimination Ladder",
    shortLabel: "Eleme",
    inspiration: "213 Countries 212 Eliminations Marble Race in Algodoo",
    author: "Charlie's Marble Factory",
    summary:
      "Cok kalabalik field mantigini, kademeli eleme kapilari ve her turda daralan funnel ile kompaktlastiran survival etabi.",
    rulesText: "4 tur, her tur sonunda eleme kapisi, son kalanlar puan toplar",
    hazardText: "Crush gate, mega funnel, panic spiral",
    colorA: "#f59e0b",
    colorB: "#ef4444",
    laps: 4,
    baseSpeed: 0.132,
    maxMarbles: 60,
    visualWidth: 0.1,
    path: [
      [0.1, 0.5],
      [0.2, 0.18],
      [0.52, 0.12],
      [0.82, 0.24],
      [0.9, 0.5],
      [0.78, 0.78],
      [0.48, 0.86],
      [0.18, 0.74],
      [0.1, 0.5],
    ],
    hazards: [
      {
        id: "spiral",
        type: "spinner",
        label: "Panic Spiral",
        start: 0.2,
        end: 0.3,
        strength: 0.5,
        frequency: 10,
        description: "Pack'leri dagitip arkadakileri tehlikeye atar.",
      },
      {
        id: "crush",
        type: "punch",
        label: "Crush Gate",
        start: 0.46,
        end: 0.54,
        strength: 0.62,
        description: "Vurucu kapilar temposu dusuk olanlari iceri hapseder.",
      },
      {
        id: "funnel",
        type: "funnel",
        label: "Mega Funnel",
        start: 0.7,
        end: 0.84,
        strength: 0.52,
        description: "Tur sonu eleme oncesi pack'i tekrar sikiestirir.",
      },
    ],
    eliminationTriggers: [
      { progress: 1, count: 8, reason: "Tur 1 eleme kapisi" },
      { progress: 2, count: 8, reason: "Tur 2 eleme kapisi" },
      { progress: 3, count: 8, reason: "Tur 3 eleme kapisi" },
    ],
    notes: [
      "Kalabalik country race mantigi, surekli azalan field ile survival temposuna donusturuldu.",
      "Her eleme, videodaki cok sayili culling formatina referans verir.",
    ],
  },
  {
    id: "country-grand-prix",
    name: "50 Country Grand Prix",
    shortLabel: "GP",
    inspiration: "50 COUNTRIES MARBLE RACE IN ALGODOO",
    author: "MarbleZone",
    summary:
      "Saf grand prix ritmi; daha az hazard, daha cok apex, ritim ve uzun sureli tutarlilik odakli pist duzeni.",
    rulesText: "5 tur, saf hiz ve teknik sektor dengesi",
    hazardText: "S-curve, speed ribbon, soft jump",
    colorA: "#60a5fa",
    colorB: "#8b5cf6",
    laps: 5,
    baseSpeed: 0.145,
    maxMarbles: 50,
    visualWidth: 0.095,
    path: [
      [0.12, 0.44],
      [0.22, 0.22],
      [0.46, 0.18],
      [0.68, 0.22],
      [0.84, 0.38],
      [0.8, 0.58],
      [0.66, 0.72],
      [0.42, 0.76],
      [0.2, 0.68],
      [0.12, 0.44],
    ],
    hazards: [
      {
        id: "ribbon",
        type: "boost",
        label: "Speed Ribbon",
        start: 0.1,
        end: 0.17,
        strength: 0.22,
        description: "Start sonrasi hiz alan teknik bir duzluktur.",
      },
      {
        id: "s-bend",
        type: "rough",
        label: "S-Bend Compression",
        start: 0.34,
        end: 0.48,
        strength: 0.34,
        description: "Apex kaciranlar momentum kaybeder.",
      },
      {
        id: "jump",
        type: "split",
        label: "Soft Jump Selector",
        start: 0.72,
        end: 0.82,
        strength: 0.22,
        description: "Yaris cizgisini bir miktar rastlantisallastiran teknik mini ayrim.",
        branches: [
          { label: "Inside", lane: -0.44, speed: 1.06, weight: 0.38 },
          { label: "Middle", lane: 0, speed: 1.01, weight: 0.36 },
          { label: "Outside", lane: 0.44, speed: 0.97, weight: 0.26 },
        ],
      },
    ],
    notes: [
      "Bu etap, verilen country race videolarindaki saf yaris tadini hazard yogunlugunu azaltarak verir.",
      "Uzun sureli tutarlilik ve cizgi kalitesi burada daha belirleyicidir.",
    ],
  },
  {
    id: "tank-arena",
    name: "Weaponized Tank Arena",
    shortLabel: "Arena",
    inspiration: "Weaponized Tank Arena - Marble Race Countries in Algodoo",
    author: "RAIDEN",
    summary:
      "Combat zone icindeki kule atislari, kalkan puani ve riskli orta alanla country marble konseptini arena savasina ceviren etap.",
    rulesText: "4 tur, combat zoneda hasar, kalkan kirilinca eliminasyon riski",
    hazardText: "Turret fire, mine strip, combat funnel",
    colorA: "#fb7185",
    colorB: "#f97316",
    laps: 4,
    baseSpeed: 0.136,
    maxMarbles: 32,
    visualWidth: 0.105,
    path: [
      [0.16, 0.54],
      [0.22, 0.26],
      [0.42, 0.16],
      [0.68, 0.2],
      [0.84, 0.42],
      [0.8, 0.68],
      [0.58, 0.82],
      [0.32, 0.78],
      [0.16, 0.54],
    ],
    hazards: [
      {
        id: "mine-strip",
        type: "punch",
        label: "Mine Strip",
        start: 0.18,
        end: 0.27,
        strength: 0.54,
        description: "Mini darbelerle line bozar ve shield asindirir.",
      },
      {
        id: "combat",
        type: "combat",
        label: "Turret Arena",
        start: 0.4,
        end: 0.62,
        strength: 0.7,
        description: "Yakindaki rakiplere random kule salvolari gelir.",
      },
      {
        id: "exit",
        type: "funnel",
        label: "Combat Exit Funnel",
        start: 0.7,
        end: 0.82,
        strength: 0.42,
        description: "Hasarli marbles cikista daha da savrulur.",
      },
    ],
    notes: [
      "Basliktaki tank arena fikrini, shield ve projectile tabanli sektor hasarina cevirdik.",
      "Liderlik kadar hayatta kalma da kazanma kosuluna etki eder.",
    ],
  },
  {
    id: "stage-lottery",
    name: "Stage Lottery Rush",
    shortLabel: "Lottery",
    inspiration: "Stage Lottery #4 - Roll to Choose - Elimination Marble Race",
    author: "MIKAN",
    summary:
      "Her turda rastgele secilen koridorlarla adim adim eleme yapan, izleme zevki yuksek bir son etap.",
    rulesText: "4 tur, her turda lottery branch ve asama elemesi",
    hazardText: "Lottery gate, jackpot chute, final cull",
    colorA: "#facc15",
    colorB: "#ec4899",
    laps: 4,
    baseSpeed: 0.138,
    maxMarbles: 40,
    visualWidth: 0.1,
    path: [
      [0.12, 0.48],
      [0.18, 0.2],
      [0.38, 0.14],
      [0.62, 0.18],
      [0.86, 0.34],
      [0.84, 0.62],
      [0.62, 0.8],
      [0.34, 0.84],
      [0.14, 0.68],
      [0.12, 0.48],
    ],
    hazards: [
      {
        id: "lottery-1",
        type: "split",
        label: "Lottery Gate Alpha",
        start: 0.2,
        end: 0.33,
        strength: 0.4,
        description: "Uc koridorlu secim: hiz, denge ya da uzun yol.",
        branches: [
          { label: "Jackpot", lane: -0.62, speed: 1.14, weight: 0.22 },
          { label: "Neutral", lane: 0, speed: 1.01, weight: 0.5 },
          { label: "Detour", lane: 0.62, speed: 0.91, weight: 0.28 },
        ],
      },
      {
        id: "lottery-2",
        type: "split",
        label: "Lottery Gate Beta",
        start: 0.56,
        end: 0.68,
        strength: 0.44,
        description: "Ikinci rastgele secim, son tura kadar alan daraltir.",
        branches: [
          { label: "Inside", lane: -0.48, speed: 1.09, weight: 0.3 },
          { label: "Bounce", lane: 0.18, speed: 0.98, weight: 0.48 },
          { label: "Wide", lane: 0.62, speed: 0.92, weight: 0.22 },
        ],
      },
      {
        id: "jackpot",
        type: "boost",
        label: "Jackpot Chute",
        start: 0.72,
        end: 0.8,
        strength: 0.24,
        description: "Dogru koridordan cikana final öncesi momentum verir.",
      },
    ],
    eliminationTriggers: [
      { progress: 1, count: 4, reason: "Stage 1 cut" },
      { progress: 2, count: 4, reason: "Stage 2 cut" },
      { progress: 3, count: 4, reason: "Stage 3 cut" },
    ],
    notes: [
      "Roll to choose mantigi, branch kararlari ve kademeli cull sistemi ile modellendi.",
      "Her turda baska bir grup dogru koridoru yakalayip one cikabilir.",
    ],
  },
].map(buildTrackRuntime);

const canvas = document.getElementById("raceCanvas");
const ctx = canvas.getContext("2d");
const themeColorMeta = document.getElementById("themeColorMeta");
const trackSelect = document.getElementById("trackSelect");
const marbleCountInput = document.getElementById("marbleCountInput");
const marbleCountValue = document.getElementById("marbleCountValue");
const simSpeedInput = document.getElementById("simSpeedInput");
const simSpeedValue = document.getElementById("simSpeedValue");
const autoAdvanceSelect = document.getElementById("autoAdvanceSelect");
const startRaceBtn = document.getElementById("startRaceBtn");
const pauseBtn = document.getElementById("pauseBtn");
const championshipBtn = document.getElementById("championshipBtn");
const nextEventBtn = document.getElementById("nextEventBtn");
const activeFormatValue = document.getElementById("activeFormatValue");
const raceStateValue = document.getElementById("raceStateValue");
const championValue = document.getElementById("championValue");
const trackModeChip = document.getElementById("trackModeChip");
const lapValue = document.getElementById("lapValue");
const survivorValue = document.getElementById("survivorValue");
const leaderValue = document.getElementById("leaderValue");
const pointsLeaderValue = document.getElementById("pointsLeaderValue");
const trackTitle = document.getElementById("trackTitle");
const trackSummary = document.getElementById("trackSummary");
const trackInspiration = document.getElementById("trackInspiration");
const trackRules = document.getElementById("trackRules");
const trackHazardMeta = document.getElementById("trackHazardMeta");
const eventIndexChip = document.getElementById("eventIndexChip");
const hazardList = document.getElementById("hazardList");
const eventLog = document.getElementById("eventLog");
const timelineChip = document.getElementById("timelineChip");
const standingsBody = document.getElementById("standingsBody");
const referenceCards = document.getElementById("referenceCards");

const state = {
  preferences: {
    trackId: TRACKS[0].id,
    marbleCount: 32,
    simSpeed: 1.5,
    autoAdvance: true,
  },
  currentTrack: TRACKS[0],
  currentTrackIndex: 0,
  marbles: [],
  logs: [],
  scoreboard: {},
  teamScoreboard: {},
  running: false,
  paused: false,
  raceFinished: false,
  championshipMode: false,
  championshipRoster: null,
  championshipEventIndex: 0,
  completedChampionshipEvents: 0,
  elapsed: 0,
  leaderId: null,
  raceSeed: 1,
  rng: mulberry32(1),
  handledTriggers: new Set(),
  territorySamples: {},
  territoryLeader: null,
  territoryLeaderUntil: 0,
  territoryPulseAt: 0,
  pendingAdvanceHandle: null,
  lastTimestamp: 0,
  leaderboardCache: [],
};

if (themeColorMeta) {
  themeColorMeta.setAttribute("content", "#050816");
}

function statFromText(text, min, max) {
  const hash = hashString(text);
  const normalized = ((hash % 1000) + 1000) % 1000 / 999;
  return min + (max - min) * normalized;
}

function hashString(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildTrackRuntime(track) {
  const points = track.path.map(([x, y]) => ({ x, y }));
  let totalLength = 0;
  const segments = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    segments.push({ start, end, from: totalLength, to: totalLength + length, length });
    totalLength += length;
  }
  return {
    ...track,
    points,
    segments,
    totalLength,
    hazardColors: {
      boost: "#22d3ee",
      spinner: "#f59e0b",
      funnel: "#fde047",
      punch: "#fb7185",
      territory: "#34d399",
      split: "#c084fc",
      combat: "#ef4444",
      rough: "#94a3b8",
    },
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mulberry32(seed) {
  let stateValue = seed >>> 0;
  return () => {
    stateValue += 0x6d2b79f5;
    let result = Math.imul(stateValue ^ (stateValue >>> 15), 1 | stateValue);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    const track = TRACKS.find((item) => item.id === parsed.trackId);
    state.preferences.trackId = track ? track.id : TRACKS[0].id;
    state.preferences.marbleCount = clamp(Number(parsed.marbleCount) || 32, 12, 60);
    state.preferences.simSpeed = clamp(Number(parsed.simSpeed) || 1.5, 0.75, 2.75);
    state.preferences.autoAdvance = parsed.autoAdvance !== false;
  } catch (_) {
    // Varsayilan ayarlarla devam edilir.
  }
}

function savePreferences() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.preferences));
}

function populateTrackSelect() {
  TRACKS.forEach((track) => {
    const option = document.createElement("option");
    option.value = track.id;
    option.textContent = track.name;
    trackSelect.append(option);
  });
}

function renderReferenceCards() {
  referenceCards.innerHTML = "";
  TRACKS.forEach((track) => {
    const card = document.createElement("article");
    card.className = "reference-card";
    card.innerHTML = `
      <span class="reference-card__meta">${track.author} · ${track.inspiration}</span>
      <h3>${track.name}</h3>
      <p>${track.summary}</p>
      <ul>
        ${track.notes.map((note) => `<li>${note}</li>`).join("")}
      </ul>
    `;
    referenceCards.append(card);
  });
}

function syncControlsToState() {
  trackSelect.value = state.preferences.trackId;
  marbleCountInput.value = String(state.preferences.marbleCount);
  simSpeedInput.value = String(state.preferences.simSpeed);
  autoAdvanceSelect.value = state.preferences.autoAdvance ? "on" : "off";
  marbleCountValue.textContent = String(getActiveMarbleCount());
  simSpeedValue.textContent = `${Number(state.preferences.simSpeed).toFixed(2)}x`;
}

function getActiveMarbleCount() {
  return Math.min(state.preferences.marbleCount, state.currentTrack.maxMarbles, PARTICIPANTS.length);
}

function setTrackById(trackId, previewOnly = true) {
  const nextIndex = TRACKS.findIndex((track) => track.id === trackId);
  if (nextIndex === -1) {
    return;
  }
  state.currentTrackIndex = nextIndex;
  state.currentTrack = TRACKS[nextIndex];
  state.preferences.trackId = trackId;
  savePreferences();
  marbleCountValue.textContent = String(getActiveMarbleCount());
  renderTrackDetails();
  if (previewOnly) {
    seedRace({ startImmediately: false, useChampionshipRoster: false });
  }
}

function renderTrackDetails() {
  const track = state.currentTrack;
  activeFormatValue.textContent = track.name;
  trackTitle.textContent = track.name;
  trackSummary.textContent = track.summary;
  trackInspiration.textContent = `${track.inspiration} · ${track.author}`;
  trackRules.textContent = track.rulesText;
  trackHazardMeta.textContent = track.hazardText;
  eventIndexChip.textContent = `Event ${state.currentTrackIndex + 1}/${TRACKS.length}`;
  hazardList.innerHTML = "";
  track.hazards.forEach((hazard) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>
        <span class="legend-dot" style="background:${track.hazardColors[hazard.type] || "#fff"}"></span>
        ${hazard.label}
      </strong>
      <span>${hazard.description}</span>
    `;
    hazardList.append(item);
  });
}

function buildRoster(count, seed) {
  const pool = [...PARTICIPANTS];
  const rng = mulberry32(seed);
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(rng() * (index + 1));
    [pool[index], pool[nextIndex]] = [pool[nextIndex], pool[index]];
  }
  return pool.slice(0, count);
}

function ensureScoreEntry(participant) {
  if (!state.scoreboard[participant.id]) {
    state.scoreboard[participant.id] = {
      id: participant.id,
      name: participant.name,
      code: participant.code,
      team: participant.team,
      color: participant.color,
      points: 0,
      wins: 0,
      podiums: 0,
    };
  }
  if (!state.teamScoreboard[participant.team]) {
    state.teamScoreboard[participant.team] = 0;
  }
}

function createRaceMarble(base, index) {
  ensureScoreEntry(base);
  const seedValue = hashString(`${base.id}:${state.raceSeed}:${state.currentTrack.id}:${index}`);
  return {
    id: base.id,
    code: base.code,
    name: base.name,
    team: base.team,
    color: base.color,
    accent: base.accent,
    pace: base.pace,
    stability: base.stability,
    aggression: base.aggression,
    fortune: base.fortune,
    progress: -index * 0.013,
    speed: 0,
    lane: (state.rng() - 0.5) * 0.1,
    laneTarget: 0,
    status: "racing",
    finishTime: null,
    finishOrder: null,
    eliminationReason: "",
    eliminationSnapshot: null,
    shield: 100,
    boostTimer: 0,
    slowTimer: 0,
    stunTimer: 0,
    branchMemory: {},
    hazardCooldowns: {},
    phase: seedValue / 1000,
  };
}

function clearPendingAdvance() {
  if (state.pendingAdvanceHandle !== null) {
    clearTimeout(state.pendingAdvanceHandle);
    state.pendingAdvanceHandle = null;
  }
}

function seedRace({ startImmediately, useChampionshipRoster }) {
  clearPendingAdvance();
  state.elapsed = 0;
  state.leaderId = null;
  state.handledTriggers = new Set();
  state.territoryLeader = null;
  state.territoryLeaderUntil = 0;
  state.territoryPulseAt = 2.8;
  state.logs = [];
  state.raceFinished = false;
  state.running = startImmediately;
  state.paused = false;
  pauseBtn.textContent = "Duraklat";
  state.raceSeed += 1;
  state.rng = mulberry32(hashString(`${state.currentTrack.id}:${state.raceSeed}`));

  const roster =
    useChampionshipRoster && state.championshipRoster
      ? state.championshipRoster
      : buildRoster(getActiveMarbleCount(), hashString(`${state.currentTrack.id}:${state.raceSeed}:roster`));

  state.marbles = roster.map((entry, index) => createRaceMarble(entry, index));
  addLog(
    `${state.currentTrack.name} yuku hazirlandi. ${state.marbles.length} misket ${startImmediately ? "yarisa cikti" : "gridde bekliyor"}.`,
  );
  updateRaceStateText(startImmediately ? "Canli" : "Hazir");
  updateDerivedUI();
}

function startSingleRace() {
  state.championshipMode = false;
  state.championshipRoster = null;
  state.completedChampionshipEvents = 0;
  state.championshipEventIndex = state.currentTrackIndex;
  seedRace({ startImmediately: true, useChampionshipRoster: false });
}

function startChampionship() {
  state.championshipMode = true;
  state.completedChampionshipEvents = 0;
  state.championshipEventIndex = 0;
  state.scoreboard = {};
  state.teamScoreboard = {};
  state.currentTrackIndex = 0;
  state.currentTrack = TRACKS[0];
  state.preferences.trackId = state.currentTrack.id;
  savePreferences();
  const championshipCount = Math.min(
    state.preferences.marbleCount,
    ...TRACKS.map((track) => track.maxMarbles),
    PARTICIPANTS.length,
  );
  state.championshipRoster = buildRoster(
    championshipCount,
    hashString(`championship:${state.raceSeed}:${state.preferences.marbleCount}`),
  );
  trackSelect.value = state.currentTrack.id;
  renderTrackDetails();
  seedRace({ startImmediately: true, useChampionshipRoster: true });
  addLog("6 etaplik sampiyona basladi. Puanlar bu rozet altinda toplanacak.");
}

function advanceToNextEvent() {
  const nextIndex = (state.currentTrackIndex + 1) % TRACKS.length;
  state.currentTrackIndex = nextIndex;
  state.currentTrack = TRACKS[nextIndex];
  state.preferences.trackId = state.currentTrack.id;
  trackSelect.value = state.currentTrack.id;
  savePreferences();
  renderTrackDetails();

  if (state.championshipMode && state.completedChampionshipEvents < TRACKS.length) {
    state.championshipEventIndex = nextIndex;
    seedRace({ startImmediately: true, useChampionshipRoster: true });
    return;
  }

  seedRace({ startImmediately: true, useChampionshipRoster: false });
}

function updateRaceStateText(label) {
  raceStateValue.textContent = label;
  trackModeChip.textContent = state.championshipMode ? `Sampiyona · ${label}` : label;
}

function addLog(message) {
  state.logs.unshift({
    id: `${Date.now()}-${Math.floor(state.rng() * 100000)}`,
    at: state.elapsed,
    message,
  });
  state.logs = state.logs.slice(0, 16);
  renderEventLog();
}

function renderEventLog() {
  timelineChip.textContent = `${state.logs.length} olay`;
  eventLog.innerHTML = "";
  state.logs.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "event-log__item";
    item.innerHTML = `
      <span class="event-log__time">T+${formatClock(entry.at)}</span>
      <div class="event-log__body">${entry.message}</div>
    `;
    eventLog.append(item);
  });
}

function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remainingSeconds = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getSortedStandings() {
  const statusRank = { finished: 0, racing: 1, eliminated: 2 };
  return [...state.marbles].sort((a, b) => {
    if (statusRank[a.status] !== statusRank[b.status]) {
      return statusRank[a.status] - statusRank[b.status];
    }
    if (a.status === "finished" && b.status === "finished") {
      return a.finishOrder - b.finishOrder;
    }
    return b.progress - a.progress;
  });
}

function updateDerivedUI() {
  const standings = getSortedStandings();
  state.leaderboardCache = standings;

  const liveLeader = standings.find((marble) => marble.status !== "eliminated");
  const finished = standings.filter((marble) => marble.status === "finished").length;
  const alive = standings.filter((marble) => marble.status === "racing").length;
  const currentLap = liveLeader ? clamp(Math.floor(Math.max(0, liveLeader.progress)) + 1, 1, state.currentTrack.laps) : 0;
  const lapDisplay = !state.running && state.elapsed === 0 && !state.raceFinished ? 0 : currentLap;

  lapValue.textContent = `${lapDisplay} / ${state.currentTrack.laps}`;
  survivorValue.textContent = String(alive + finished);
  leaderValue.textContent = liveLeader ? `${liveLeader.code} · ${liveLeader.name}` : "-";

  const seasonLeader = getSeasonLeader();
  championValue.textContent = seasonLeader ? `${seasonLeader.code} · ${seasonLeader.points} puan` : "-";
  pointsLeaderValue.textContent = seasonLeader ? `${seasonLeader.code} · ${seasonLeader.points}` : "-";

  renderStandingsTable(standings);
  document.title = `${state.currentTrack.name} · ${liveLeader ? liveLeader.code : "Hazir"}`;
}

function renderStandingsTable(standings) {
  standingsBody.innerHTML = "";
  standings.forEach((marble, index) => {
    const score = state.scoreboard[marble.id]?.points || 0;
    const row = document.createElement("tr");
    const statusLabel =
      marble.status === "finished" ? "Finis" : marble.status === "eliminated" ? "Elendi" : "Yarista";
    const statusClass =
      marble.status === "finished"
        ? "status-pill status-pill--finished"
        : marble.status === "eliminated"
          ? "status-pill status-pill--eliminated"
          : "status-pill status-pill--racing";
    const progressText =
      marble.status === "finished"
        ? formatClock(marble.finishTime || 0)
        : marble.status === "eliminated"
          ? marble.eliminationReason || `${roundTo((marble.progress / state.currentTrack.laps) * 100, 1)}%`
          : `${roundTo((clamp(marble.progress, 0, state.currentTrack.laps) / state.currentTrack.laps) * 100, 1)}%`;

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <div class="standings-marble">
          <span class="standings-marble__swatch" style="background:${marble.color}"></span>
          <div>
            <strong>${marble.code}</strong>
            <div>${marble.name}</div>
          </div>
        </div>
      </td>
      <td>${marble.team}</td>
      <td><span class="${statusClass}">${statusLabel}</span></td>
      <td>${progressText}</td>
      <td>${score}</td>
    `;
    standingsBody.append(row);
  });
}

function getSeasonLeader() {
  const values = Object.values(state.scoreboard);
  if (!values.length) {
    return null;
  }
  return values.sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name))[0];
}

function chooseWeightedBranch(branches, marble) {
  const weights = branches.map((branch) => {
    const fortuneBias = branch.speed >= 1 ? marble.fortune : marble.stability;
    return Math.max(0.05, branch.weight * fortuneBias);
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = state.rng() * total;
  for (let index = 0; index < branches.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) {
      return branches[index];
    }
  }
  return branches[branches.length - 1];
}

function getBranchDecision(marble, hazard) {
  const lapKey = `${hazard.id}:${Math.floor(Math.max(0, marble.progress))}`;
  if (!marble.branchMemory[lapKey]) {
    marble.branchMemory[lapKey] = chooseWeightedBranch(hazard.branches, marble);
  }
  return marble.branchMemory[lapKey];
}

function isInsideHazard(marble, hazard) {
  const lapProgress = ((marble.progress % 1) + 1) % 1;
  return lapProgress >= hazard.start && lapProgress <= hazard.end;
}

function updateRace(dt) {
  if (!state.running || state.paused || state.raceFinished) {
    return;
  }

  state.elapsed += dt;
  const active = state.marbles.filter((marble) => marble.status === "racing");
  if (!active.length) {
    finishRace();
    return;
  }

  state.territorySamples = {};
  active.forEach((marble) => updateMarbleMotion(marble, dt));
  resolvePackInteractions(active, dt);
  resolveCombat(active, dt);
  handleEliminationTriggers();
  handleFinishers();
  updateTerritoryLeader();
  updateLeaderAnnouncements();
  updateDerivedUI();

  const remaining = state.marbles.filter((marble) => marble.status === "racing").length;
  if (remaining === 0) {
    finishRace();
  }
}

function updateMarbleMotion(marble, dt) {
  const track = state.currentTrack;
  let desiredLane = marble.lane * 0.45;
  let targetSpeed = track.baseSpeed * (0.88 + marble.pace * 0.22);
  targetSpeed *= 0.96 + Math.sin(state.elapsed * 0.95 + marble.phase) * 0.018;
  targetSpeed *= 0.97 + marble.stability * 0.03;

  for (const hazard of track.hazards) {
    if (!isInsideHazard(marble, hazard)) {
      continue;
    }
    if (hazard.type === "boost") {
      targetSpeed *= 1 + hazard.strength;
      desiredLane *= 0.85;
    } else if (hazard.type === "spinner") {
      targetSpeed *= 0.92 + state.rng() * 0.18 * hazard.strength;
      desiredLane += Math.sin(state.elapsed * (hazard.frequency || 6) + marble.phase) * 0.7 * hazard.strength;
    } else if (hazard.type === "funnel") {
      targetSpeed *= 0.94 - hazard.strength * 0.04;
      desiredLane *= 0.28;
    } else if (hazard.type === "rough") {
      targetSpeed *= 0.9 + state.rng() * 0.12;
      desiredLane += (state.rng() - 0.5) * 0.45 * hazard.strength;
    } else if (hazard.type === "territory") {
      state.territorySamples[marble.team] = (state.territorySamples[marble.team] || 0) + dt * marble.aggression;
      targetSpeed *= marble.team === state.territoryLeader && state.elapsed <= state.territoryLeaderUntil ? 1.06 : 1;
    } else if (hazard.type === "split") {
      const branch = getBranchDecision(marble, hazard);
      targetSpeed *= branch.speed;
      desiredLane = branch.lane;
    } else if (hazard.type === "punch") {
      const cooldownKey = `${hazard.id}:${Math.floor(Math.max(0, marble.progress) * 2)}`;
      if (!marble.hazardCooldowns[cooldownKey] || marble.hazardCooldowns[cooldownKey] < state.elapsed) {
        if (state.rng() < dt * (0.35 + marble.aggression * 0.08) * hazard.strength * 3) {
          marble.stunTimer = Math.max(marble.stunTimer, 0.55 + state.rng() * 0.45);
          marble.slowTimer = Math.max(marble.slowTimer, 1.1);
          marble.shield = clamp(marble.shield - (6 + state.rng() * 10), 0, 100);
          marble.hazardCooldowns[cooldownKey] = state.elapsed + 1.8;
          if (state.rng() < 0.08) {
            addLog(`${marble.code} ${hazard.label} icinde duvara vurdu ve ritim kaybetti.`);
          }
        }
      }
    }
  }

  if (marble.stunTimer > 0) {
    marble.stunTimer = Math.max(0, marble.stunTimer - dt);
    targetSpeed *= 0.38;
  }
  if (marble.slowTimer > 0) {
    marble.slowTimer = Math.max(0, marble.slowTimer - dt);
    targetSpeed *= 0.8;
  }
  if (marble.boostTimer > 0) {
    marble.boostTimer = Math.max(0, marble.boostTimer - dt);
    targetSpeed *= 1.08;
  }

  marble.laneTarget = clamp(
    desiredLane + (state.rng() - 0.5) * 0.12 * (2 - marble.stability),
    -0.82,
    0.82,
  );
  marble.lane += (marble.laneTarget - marble.lane) * Math.min(1, dt * 3.8);
  marble.speed += (targetSpeed - marble.speed) * Math.min(1, dt * 3.1);
  marble.progress += Math.max(0.002, marble.speed * dt * state.preferences.simSpeed);
}

function resolvePackInteractions(active) {
  const sorted = [...active].sort((a, b) => b.progress - a.progress);
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const leader = sorted[index];
    const follower = sorted[index + 1];
    const gap = leader.progress - follower.progress;
    if (gap > 0.034) {
      continue;
    }
    const laneGap = Math.abs(leader.lane - follower.lane);
    if (laneGap > 0.34) {
      continue;
    }
    const pressure = (0.034 - gap) / 0.034;
    leader.speed *= 0.995;
    follower.speed *= 0.985;
    leader.laneTarget += (state.rng() - 0.5) * 0.3 * pressure;
    follower.laneTarget += (state.rng() - 0.5) * 0.34 * pressure;
  }
}

function resolveCombat(active, dt) {
  const combatZones = state.currentTrack.hazards.filter((hazard) => hazard.type === "combat");
  if (!combatZones.length) {
    return;
  }

  combatZones.forEach((hazard) => {
    const fighters = active.filter((marble) => isInsideHazard(marble, hazard));
    fighters.forEach((attacker) => {
      if (attacker.status !== "racing") {
        return;
      }
      const cooldownKey = `${hazard.id}:fire`;
      if ((attacker.hazardCooldowns[cooldownKey] || 0) > state.elapsed) {
        return;
      }
      if (state.rng() > dt * hazard.strength * 2.3) {
        return;
      }
      const targets = fighters.filter(
        (candidate) =>
          candidate.status === "racing" &&
          candidate.id !== attacker.id &&
          Math.abs(candidate.progress - attacker.progress) < 0.08,
      );
      if (!targets.length) {
        return;
      }
      const target = targets[Math.floor(state.rng() * targets.length)];
      const damage = 16 + state.rng() * 18 * attacker.aggression;
      target.shield = clamp(target.shield - damage, 0, 100);
      target.slowTimer = Math.max(target.slowTimer, 1.5);
      attacker.boostTimer = Math.max(attacker.boostTimer, 0.7);
      attacker.hazardCooldowns[cooldownKey] = state.elapsed + 0.9;

      if (target.shield <= 0) {
        eliminateMarble(target, "Arena hit");
        addLog(`${attacker.code} combat zoneda ${target.code} icin bitirici vurus buldu.`);
      } else if (state.rng() < 0.12) {
        addLog(`${attacker.code} kulenin yardimiyla ${target.code} ustunde baski kurdu.`);
      }
    });
  });
}

function handleEliminationTriggers() {
  const triggers = state.currentTrack.eliminationTriggers || [];
  triggers.forEach((trigger) => {
    if (state.handledTriggers.has(trigger.progress)) {
      return;
    }
    const leaderProgress = Math.max(...state.marbles.map((marble) => marble.progress));
    if (leaderProgress < trigger.progress) {
      return;
    }
    state.handledTriggers.add(trigger.progress);
    const victims = state.marbles
      .filter((marble) => marble.status === "racing")
      .sort((a, b) => a.progress - b.progress)
      .slice(0, trigger.count);
    victims.forEach((victim) => eliminateMarble(victim, trigger.reason));
    if (victims.length) {
      addLog(`${trigger.reason}: ${victims.map((victim) => victim.code).join(", ")} elendi.`);
    }
  });
}

function handleFinishers() {
  const finishers = state.marbles.filter(
    (marble) => marble.status === "racing" && marble.progress >= state.currentTrack.laps,
  );
  if (!finishers.length) {
    return;
  }

  const finishedCount = state.marbles.filter((marble) => marble.status === "finished").length;
  finishers
    .sort((a, b) => b.progress - a.progress)
    .forEach((marble, index) => {
      marble.status = "finished";
      marble.finishOrder = finishedCount + index + 1;
      marble.finishTime = state.elapsed;
      marble.progress = state.currentTrack.laps;
      if (marble.finishOrder <= 3) {
        addLog(`${ordinal(marble.finishOrder)} sira: ${marble.code} ${marble.name} finish cizgisini gecti.`);
      }
    });
}

function eliminateMarble(marble, reason) {
  if (marble.status !== "racing") {
    return;
  }
  marble.status = "eliminated";
  marble.eliminationReason = reason;
  marble.eliminationSnapshot = {
    progress: clamp(marble.progress, 0, state.currentTrack.laps),
    lane: marble.lane,
  };
}

function updateTerritoryLeader() {
  if (state.elapsed < state.territoryPulseAt) {
    return;
  }
  state.territoryPulseAt = state.elapsed + 3.2;
  const entries = Object.entries(state.territorySamples);
  if (!entries.length) {
    return;
  }
  entries.sort((a, b) => b[1] - a[1]);
  const [team, pressure] = entries[0];
  if (pressure < 0.25) {
    return;
  }
  state.territoryLeader = team;
  state.territoryLeaderUntil = state.elapsed + 2.8;
  addLog(`${team} capture zonelarinda baskin kurdu ve gecici hiz buff'i kazandi.`);
}

function updateLeaderAnnouncements() {
  const leader = getSortedStandings().find((marble) => marble.status !== "eliminated");
  if (!leader || leader.id === state.leaderId) {
    return;
  }
  const previousLeader = state.leaderId;
  state.leaderId = leader.id;
  if (previousLeader !== null) {
    addLog(`Lider degisimi: ${leader.code} pack'in onune gecti.`);
  }
}

function finishRace() {
  if (state.raceFinished) {
    return;
  }
  state.raceFinished = true;
  state.running = false;
  updateRaceStateText("Tamamlandi");

  const ordered = getFinalPlacements();
  ordered.forEach((marble, index) => {
    const points = CHAMPIONSHIP_POINTS[index] || 0;
    ensureScoreEntry(marble);
    state.scoreboard[marble.id].points += points;
    state.teamScoreboard[marble.team] += points;
    if (index === 0) {
      state.scoreboard[marble.id].wins += 1;
    }
    if (index < 3) {
      state.scoreboard[marble.id].podiums += 1;
    }
  });

  if (ordered[0]) {
    addLog(`Kazanan: ${ordered[0].code} ${ordered[0].name} · ${ordered[0].team}.`);
  }
  updateDerivedUI();

  if (state.championshipMode) {
    state.completedChampionshipEvents += 1;
    if (state.completedChampionshipEvents >= TRACKS.length) {
      state.championshipMode = false;
      state.championshipRoster = null;
      const champion = getSeasonLeader();
      if (champion) {
        addLog(`Sampiyona bitti. Genel lider ${champion.code} ${champion.name} oldu.`);
      }
      return;
    }
    if (state.preferences.autoAdvance) {
      state.pendingAdvanceHandle = window.setTimeout(() => {
        advanceToNextEvent();
      }, 2600);
      addLog("Sonraki sampiyona etabi otomatik olarak yuklenecek.");
    } else {
      addLog("Sampiyona beklemede. Devam icin 'Sonraki event' butonunu kullan.");
    }
  }
}

function getFinalPlacements() {
  return [...state.marbles].sort((a, b) => {
    if (a.status === "finished" && b.status === "finished") {
      return a.finishOrder - b.finishOrder;
    }
    if (a.status === "finished") {
      return -1;
    }
    if (b.status === "finished") {
      return 1;
    }
    return b.progress - a.progress;
  });
}

function ordinal(rank) {
  if (rank === 1) {
    return "1.";
  }
  if (rank === 2) {
    return "2.";
  }
  if (rank === 3) {
    return "3.";
  }
  return `${rank}.`;
}

function getPointAt(progress, laneOffset = 0) {
  const runtime = state.currentTrack;
  const loopProgress = ((progress % 1) + 1) % 1;
  const target = loopProgress * runtime.totalLength;
  const segment =
    runtime.segments.find((item) => target >= item.from && target <= item.to) || runtime.segments[runtime.segments.length - 1];
  const local = clamp((target - segment.from) / segment.length, 0, 1);
  const x = lerp(segment.start.x, segment.end.x, local);
  const y = lerp(segment.start.y, segment.end.y, local);
  const angle = Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x);
  const normalX = -Math.sin(angle);
  const normalY = Math.cos(angle);
  return {
    x: x + normalX * laneOffset,
    y: y + normalY * laneOffset,
    angle,
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * ratio));
  const height = Math.max(1, Math.floor(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawScene() {
  resizeCanvas();
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#081225");
  gradient.addColorStop(1, "#040814");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  drawStars(width, height);
  drawTrack(width, height);
  drawHazards(width, height);
  drawStartFinish(width, height);
  drawMarbles(width, height);
  drawCanvasHud(width, height);
}

function drawStars(width, height) {
  ctx.save();
  for (let index = 0; index < 28; index += 1) {
    const x = ((index * 97) % 1000) / 1000 * width;
    const y = ((index * 173 + 13) % 1000) / 1000 * height;
    const alpha = 0.06 + ((index * 19) % 7) * 0.012;
    ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (index % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTrack(width, height) {
  const scale = Math.min(width, height);
  const trackWidth = scale * state.currentTrack.visualWidth;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = trackWidth + 16;
  traceTrackPath(ctx, width, height, 0);
  ctx.stroke();

  const baseGradient = ctx.createLinearGradient(0, 0, width, height);
  baseGradient.addColorStop(0, state.currentTrack.colorA);
  baseGradient.addColorStop(1, state.currentTrack.colorB);
  ctx.strokeStyle = baseGradient;
  ctx.lineWidth = trackWidth;
  traceTrackPath(ctx, width, height, 0);
  ctx.globalAlpha = 0.22;
  ctx.stroke();

  ctx.strokeStyle = "rgba(11, 18, 40, 0.96)";
  ctx.lineWidth = trackWidth * 0.62;
  ctx.globalAlpha = 1;
  traceTrackPath(ctx, width, height, 0);
  ctx.stroke();
  ctx.restore();
}

function drawHazards(width, height) {
  const scale = Math.min(width, height);
  const trackWidth = scale * state.currentTrack.visualWidth * 0.92;
  state.currentTrack.hazards.forEach((hazard) => {
    ctx.save();
    ctx.strokeStyle = state.currentTrack.hazardColors[hazard.type] || "#fff";
    ctx.lineWidth = trackWidth * 0.38;
    ctx.globalAlpha = hazard.type === "combat" ? 0.9 : 0.72;
    drawProgressRange(hazard.start, hazard.end, width, height);
    ctx.stroke();

    const labelPoint = getPointAt((hazard.start + hazard.end) / 2, 0);
    ctx.fillStyle = "rgba(2, 6, 23, 0.88)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(
      labelPoint.x * width - 56,
      labelPoint.y * height - 16,
      112,
      24,
      10,
    );
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#dce8f8";
    ctx.font = `${Math.max(10, Math.floor(scale * 0.014))}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(hazard.label, labelPoint.x * width, labelPoint.y * height + 5);
    ctx.restore();
  });
}

function drawStartFinish(width, height) {
  const point = getPointAt(0);
  const scale = Math.min(width, height);
  const trackWidth = scale * state.currentTrack.visualWidth * 0.56;
  const centerX = point.x * width;
  const centerY = point.y * height;
  const normalX = -Math.sin(point.angle);
  const normalY = Math.cos(point.angle);
  ctx.save();
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(centerX - normalX * trackWidth, centerY - normalY * trackWidth);
  ctx.lineTo(centerX + normalX * trackWidth, centerY + normalY * trackWidth);
  ctx.stroke();
  ctx.restore();
}

function drawMarbles(width, height) {
  const scale = Math.min(width, height);
  const radius = scale * 0.011;
  const laneScale = state.currentTrack.visualWidth * 0.42;
  const sorted = [...state.marbles].sort((a, b) => a.progress - b.progress);

  sorted.forEach((marble) => {
    const useSnapshot = marble.status === "eliminated" && marble.eliminationSnapshot;
    const sample = useSnapshot
      ? getPointAt(marble.eliminationSnapshot.progress, marble.eliminationSnapshot.lane * laneScale)
      : getPointAt(clamp(marble.progress, 0, state.currentTrack.laps), marble.lane * laneScale);
    const x = sample.x * width;
    const y = sample.y * height;

    ctx.save();
    ctx.globalAlpha = marble.status === "eliminated" ? 0.3 : 1;
    ctx.shadowColor = marble.color;
    ctx.shadowBlur = marble.status === "finished" ? 22 : 16;
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.35, radius * 0.2, x, y, radius);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.25, marble.accent);
    gradient.addColorStop(1, marble.color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (state.leaderId === marble.id && marble.status !== "eliminated") {
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (marble.status !== "eliminated") {
      ctx.fillStyle = "#e2e8f0";
      ctx.font = `${Math.max(11, Math.floor(scale * 0.013))}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(marble.code, x, y - radius - 8);
    }
    ctx.restore();
  });
}

function drawCanvasHud(width, height) {
  const topFive = state.leaderboardCache.slice(0, 5);
  const panelWidth = Math.min(width * 0.27, 320);
  const rowHeight = 26;
  const panelHeight = 56 + topFive.length * rowHeight;
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 23, 0.7)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(18, 18, panelWidth, panelHeight, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 18px Inter, sans-serif";
  ctx.fillText("Canli ilk 5", 34, 44);

  topFive.forEach((marble, index) => {
    ctx.fillStyle = marble.color;
    ctx.beginPath();
    ctx.arc(34, 68 + index * rowHeight, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "13px Inter, sans-serif";
    const label =
      marble.status === "finished"
        ? `${ordinal(marble.finishOrder)} finis`
        : marble.status === "eliminated"
          ? "elendi"
          : `${roundTo((clamp(marble.progress, 0, state.currentTrack.laps) / state.currentTrack.laps) * 100, 1)}%`;
    ctx.fillText(`${index + 1}. ${marble.code} · ${label}`, 50, 72 + index * rowHeight);
  });

  ctx.fillStyle = "rgba(220, 232, 248, 0.8)";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText(`T+${formatClock(state.elapsed)} · ${state.preferences.simSpeed.toFixed(2)}x`, 34, panelHeight + 8);
  ctx.restore();
}

function traceTrackPath(targetContext, width, height, laneOffset) {
  state.currentTrack.points.forEach((point, index) => {
    const x = point.x * width;
    const y = point.y * height;
    if (index === 0) {
      targetContext.beginPath();
      targetContext.moveTo(x, y + laneOffset);
    } else {
      targetContext.lineTo(x, y + laneOffset);
    }
  });
}

function drawProgressRange(start, end, width, height) {
  const steps = 44;
  ctx.beginPath();
  for (let index = 0; index <= steps; index += 1) {
    const t = lerp(start, end, index / steps);
    const point = getPointAt(t);
    const x = point.x * width;
    const y = point.y * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
}

function gameLoop(timestamp) {
  if (!state.lastTimestamp) {
    state.lastTimestamp = timestamp;
  }
  const delta = Math.min(0.05, (timestamp - state.lastTimestamp) / 1000);
  state.lastTimestamp = timestamp;
  updateRace(delta);
  drawScene();
  window.requestAnimationFrame(gameLoop);
}

function handleTrackChange() {
  setTrackById(trackSelect.value, true);
}

function handleMarbleCountChange() {
  state.preferences.marbleCount = clamp(Number(marbleCountInput.value), 12, 60);
  marbleCountValue.textContent = String(getActiveMarbleCount());
  savePreferences();
  seedRace({ startImmediately: false, useChampionshipRoster: false });
}

function handleSimSpeedChange() {
  state.preferences.simSpeed = clamp(Number(simSpeedInput.value), 0.75, 2.75);
  simSpeedValue.textContent = `${state.preferences.simSpeed.toFixed(2)}x`;
  savePreferences();
}

function handleAutoAdvanceChange() {
  state.preferences.autoAdvance = autoAdvanceSelect.value === "on";
  savePreferences();
}

function togglePause() {
  if (!state.running || state.raceFinished) {
    return;
  }
  state.paused = !state.paused;
  updateRaceStateText(state.paused ? "Duraklatildi" : "Canli");
  pauseBtn.textContent = state.paused ? "Devam et" : "Duraklat";
}

trackSelect.addEventListener("change", handleTrackChange);
marbleCountInput.addEventListener("input", handleMarbleCountChange);
simSpeedInput.addEventListener("input", handleSimSpeedChange);
autoAdvanceSelect.addEventListener("change", handleAutoAdvanceChange);
startRaceBtn.addEventListener("click", startSingleRace);
pauseBtn.addEventListener("click", togglePause);
championshipBtn.addEventListener("click", startChampionship);
nextEventBtn.addEventListener("click", advanceToNextEvent);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

loadPreferences();
populateTrackSelect();
renderReferenceCards();
state.currentTrackIndex = TRACKS.findIndex((track) => track.id === state.preferences.trackId);
state.currentTrack = TRACKS[state.currentTrackIndex] || TRACKS[0];
syncControlsToState();
renderTrackDetails();
seedRace({ startImmediately: false, useChampionshipRoster: false });
renderEventLog();
updateDerivedUI();
window.requestAnimationFrame(gameLoop);
