const STORAGE_KEY = "marble-race-ultimate-config-v1";
const FINISH_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const MODE_META = {
  team: {
    label: "Team Marble Race",
    description:
      "Videolardaki takım yarışlarına uygun mod: her misket bireysel yarışır, takım toplam puanı sıralamayı belirler.",
  },
  territory: {
    label: "Territory War",
    description:
      "Checkpoint bölgeleri ele geçirilir. Geçiş yapan lider takım bölgeleri kontrol eder ve saniyelik kontrol puanı toplar.",
  },
  elimination: {
    label: "Country Elimination",
    description:
      "Belirli aralıklarla son sıradaki misket elenir. Büyük katılımlı ülke eleme yarışlarının ritmini simüle eder.",
  },
  arena: {
    label: "Weaponized Tank Arena",
    description:
      "Parkur çevresindeki turret tehlikeleri misketlere hasar verir. Canı biten elenir; hem hız hem hayatta kalma kritik.",
  },
  lottery: {
    label: "Stage Lottery Elimination",
    description:
      "Yarış sırasında rastgele global modifikatörler açılır: Hyper Boost, Gravity Well, Ice Drift gibi sürprizler tur dengelerini değiştirir.",
  },
};

const SECTION_META = {
  boost: { label: "Boost", color: "rgba(34,197,94,0.40)", accelMul: 1.15, maxMul: 1.18, dragMul: 0.78, chaos: 0.1 },
  mud: { label: "Mud", color: "rgba(234,179,8,0.34)", accelMul: 0.8, maxMul: 0.78, dragMul: 1.36, chaos: 0.22 },
  chaos: { label: "Chaos", color: "rgba(244,63,94,0.34)", accelMul: 1, maxMul: 1.04, dragMul: 1, chaos: 0.95 },
  splitter: {
    label: "Splitter",
    color: "rgba(125,211,252,0.33)",
    accelMul: 1.04,
    maxMul: 1.04,
    dragMul: 0.96,
    chaos: 0.35,
  },
  jump: { label: "Jump", color: "rgba(167,139,250,0.36)", accelMul: 1.09, maxMul: 1.08, dragMul: 0.9, chaos: 0.52 },
};

const LOTTERY_EFFECTS = [
  { name: "Hyper Boost", accelMul: 1.32, maxMul: 1.24, dragMul: 0.86, chaosMul: 0.7, duration: 13 },
  { name: "Gravity Well", accelMul: 0.86, maxMul: 0.82, dragMul: 1.26, chaosMul: 1.2, duration: 11 },
  { name: "Ice Drift", accelMul: 0.98, maxMul: 1.08, dragMul: 0.74, chaosMul: 1.6, duration: 12 },
  { name: "Magnet Storm", accelMul: 1.02, maxMul: 0.96, dragMul: 1.12, chaosMul: 2.1, duration: 9 },
  { name: "Turbo Draft", accelMul: 1.18, maxMul: 1.15, dragMul: 0.9, chaosMul: 0.85, duration: 14 },
];

const TEAM_PALETTE = [
  { name: "Crimson", color: "#f43f5e" },
  { name: "Azure", color: "#38bdf8" },
  { name: "Emerald", color: "#22c55e" },
  { name: "Amber", color: "#f59e0b" },
  { name: "Violet", color: "#a78bfa" },
  { name: "Silver", color: "#cbd5e1" },
];

const COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Bulgaria",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Croatia",
  "Czechia",
  "Denmark",
  "Egypt",
  "Estonia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Kazakhstan",
  "Kenya",
  "Latvia",
  "Lithuania",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Peru",
  "Poland",
  "Portugal",
  "Romania",
  "Saudi Arabia",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Ukraine",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Vietnam",
];

const canvas = document.getElementById("raceCanvas");
const ctx = canvas.getContext("2d");
const modeSelect = document.getElementById("modeSelect");
const marbleCountInput = document.getElementById("marbleCountInput");
const lapsInput = document.getElementById("lapsInput");
const speedProfileSelect = document.getElementById("speedProfileSelect");
const seedInput = document.getElementById("seedInput");
const intensityInput = document.getElementById("intensityInput");
const modeDescription = document.getElementById("modeDescription");
const generateBtn = document.getElementById("generateBtn");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const raceClock = document.getElementById("raceClock");
const raceStateBadge = document.getElementById("raceStateBadge");
const leaderboardBody = document.getElementById("leaderboardBody");
const eventLog = document.getElementById("eventLog");
const lotteryBadge = document.getElementById("lotteryBadge");
const activeMarblesStat = document.getElementById("activeMarblesStat");
const eliminatedStat = document.getElementById("eliminatedStat");
const captureStat = document.getElementById("captureStat");
const damageStat = document.getElementById("damageStat");

const state = {
  config: {
    mode: "team",
    marbleCount: 36,
    laps: 5,
    speedProfile: "balanced",
    seed: "2026-ultimate-league",
    intensity: 60,
  },
  race: null,
  running: false,
  panelTick: 0,
  frameTime: 0,
};

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return;
    }
    const parsed = JSON.parse(saved);
    state.config.mode = MODE_META[parsed.mode] ? parsed.mode : state.config.mode;
    state.config.marbleCount = clampNum(parsed.marbleCount, 12, 120, 36);
    state.config.laps = clampNum(parsed.laps, 2, 12, 5);
    state.config.speedProfile =
      parsed.speedProfile === "chaos" || parsed.speedProfile === "endurance" || parsed.speedProfile === "balanced"
        ? parsed.speedProfile
        : state.config.speedProfile;
    state.config.seed = typeof parsed.seed === "string" && parsed.seed.trim() ? parsed.seed.trim() : state.config.seed;
    state.config.intensity = clampNum(parsed.intensity, 1, 100, 60);
  } catch (_) {
    // Bozuk yerel kayıt varsa varsayılanla devam edilir.
  }
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
}

function fillControls() {
  modeSelect.value = state.config.mode;
  marbleCountInput.value = String(state.config.marbleCount);
  lapsInput.value = String(state.config.laps);
  speedProfileSelect.value = state.config.speedProfile;
  seedInput.value = state.config.seed;
  intensityInput.value = String(state.config.intensity);
  renderModeDescription();
}

function readControls() {
  state.config.mode = MODE_META[modeSelect.value] ? modeSelect.value : "team";
  state.config.marbleCount = clampNum(Number(marbleCountInput.value), 12, 120, 36);
  state.config.laps = clampNum(Number(lapsInput.value), 2, 12, 5);
  state.config.speedProfile = speedProfileSelect.value;
  state.config.seed = seedInput.value.trim() || "2026-ultimate-league";
  state.config.intensity = clampNum(Number(intensityInput.value), 1, 100, 60);
  saveConfig();
}

function renderModeDescription() {
  const meta = MODE_META[modeSelect.value] || MODE_META.team;
  modeDescription.textContent = `${meta.label}: ${meta.description}`;
}

function resetRace() {
  readControls();
  setupCanvasSize();
  const rng = createRng(`${state.config.seed}|${state.config.mode}|${state.config.marbleCount}`);
  const track = buildTrack(rng, canvas.width, canvas.height);
  const marbles = buildMarbles(track, rng, state.config);

  const teamScores = {};
  TEAM_PALETTE.forEach((team) => {
    teamScores[team.name] = 0;
  });

  state.race = {
    rng,
    track,
    marbles,
    teamScores,
    events: [],
    captures: 0,
    damageEvents: 0,
    raceTime: 0,
    finished: false,
    finishers: [],
    eliminated: [],
    nextEliminationAt: 16,
    eliminationInterval: 8 + (1 - state.config.intensity / 100) * 14,
    checkpointOwners: Object.fromEntries(track.checkpoints.map((cp) => [cp.id, null])),
    checkpointPointsTimer: 0,
    lottery: {
      active: null,
      expiresAt: 0,
      nextAt: 9,
    },
    turretCooldowns: Object.fromEntries(track.turrets.map((_, i) => [i, 0])),
  };

  state.running = false;
  startPauseBtn.textContent = "Yarışı Başlat";
  addEvent("Yeni yarış üretildi. Parkur ve dinamikler hazır.");
  renderModeDescription();
  updatePanels(true);
  renderRace();
}

function setupCanvasSize() {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

function buildTrack(rng, fullWidth, fullHeight) {
  const width = fullWidth / (window.devicePixelRatio || 1);
  const height = fullHeight / (window.devicePixelRatio || 1);
  const centerX = width / 2;
  const centerY = height / 2;
  const controlPoints = [];
  const count = 14;
  const baseRadius = Math.min(width, height) * 0.34;

  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const radius = baseRadius * (0.76 + rng() * 0.42);
    controlPoints.push({
      x: centerX + Math.cos(angle) * radius * 1.18,
      y: centerY + Math.sin(angle) * radius * 0.86,
    });
  }

  const sampled = [];
  const samplesPerSegment = 20;
  for (let i = 0; i < count; i += 1) {
    const p0 = controlPoints[(i - 1 + count) % count];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % count];
    const p3 = controlPoints[(i + 2) % count];
    for (let j = 0; j < samplesPerSegment; j += 1) {
      const t = j / samplesPerSegment;
      sampled.push({
        x: catmull(p0.x, p1.x, p2.x, p3.x, t),
        y: catmull(p0.y, p1.y, p2.y, p3.y, t),
      });
    }
  }

  const cumulative = [0];
  let totalLength = 0;
  for (let i = 1; i < sampled.length; i += 1) {
    totalLength += distance(sampled[i - 1], sampled[i]);
    cumulative.push(totalLength);
  }
  totalLength += distance(sampled[sampled.length - 1], sampled[0]);
  sampled.push({ x: sampled[0].x, y: sampled[0].y });
  cumulative.push(totalLength);

  const sectionTypes = ["boost", "mud", "chaos", "splitter", "jump", "boost", "mud", "chaos", "splitter", "jump"];
  shuffleInPlace(rng, sectionTypes);
  const sections = sectionTypes.map((type, index) => {
    const step = totalLength / sectionTypes.length;
    return { type, start: index * step, end: (index + 1) * step };
  });

  const checkpoints = [];
  for (let i = 0; i < 6; i += 1) {
    checkpoints.push({ id: `CP-${i + 1}`, distance: (totalLength / 6) * i });
  }

  const turrets = [];
  for (let i = 0; i < 7; i += 1) {
    const dist = (totalLength / 7) * i + rng() * (totalLength / 30);
    const p = pointAt({ sampled, cumulative, totalLength }, dist);
    turrets.push({
      distance: dist,
      x: p.x + p.nx * (64 + rng() * 28),
      y: p.y + p.ny * (64 + rng() * 28),
    });
  }

  return {
    sampled,
    cumulative,
    totalLength,
    sections,
    checkpoints,
    turrets,
    trackWidth: 56,
  };
}

function buildMarbles(track, rng, config) {
  const marbles = [];
  const laneLimit = track.trackWidth * 0.34;
  const spacing = 12;
  const profile = config.speedProfile;
  let baseMax = 145;
  let baseAccel = 36;
  let baseDrag = 0.45;

  if (profile === "chaos") {
    baseMax = 152;
    baseAccel = 38;
    baseDrag = 0.4;
  } else if (profile === "endurance") {
    baseMax = 138;
    baseAccel = 31;
    baseDrag = 0.34;
  }

  for (let i = 0; i < config.marbleCount; i += 1) {
    const team = TEAM_PALETTE[i % TEAM_PALETTE.length];
    const country = COUNTRIES[i % COUNTRIES.length];
    const color = team.color;
    marbles.push({
      id: i + 1,
      name: `${country} ${i + 1}`,
      country,
      team: team.name,
      color,
      lap: 0,
      progress: ((track.totalLength - i * spacing) % track.totalLength + track.totalLength) % track.totalLength,
      speed: 22 + rng() * 18,
      laneOffset: (rng() * 2 - 1) * laneLimit,
      laneTarget: (rng() * 2 - 1) * laneLimit,
      baseMax: baseMax + (rng() * 24 - 12),
      baseAccel: baseAccel + (rng() * 9 - 4),
      baseDrag: baseDrag + (rng() * 0.12 - 0.06),
      raceDistance: 0,
      finished: false,
      eliminated: false,
      eliminationOrder: 0,
      finishOrder: 0,
      health: 100,
      score: 0,
      captures: 0,
    });
  }
  return marbles;
}

function toggleRace() {
  if (!state.race) {
    return;
  }
  if (state.race.finished) {
    return;
  }
  state.running = !state.running;
  startPauseBtn.textContent = state.running ? "Duraklat" : "Devam Et";
  addEvent(state.running ? "Yarış başladı." : "Yarış duraklatıldı.");
}

function updateRace(dt) {
  const race = state.race;
  if (!race || race.finished) {
    return;
  }
  race.raceTime += dt;
  const lotteryEffect = updateLottery(dt, race);
  maybeTriggerElimination(race);
  updateTerritoryControl(dt, race);
  updateTurrets(dt, race);

  const active = race.marbles.filter((m) => !m.finished && !m.eliminated);
  active.forEach((marble) => {
    const section = getSectionAt(race.track.sections, marble.progress);
    const effect = SECTION_META[section.type];
    const maxSpeed = marble.baseMax * effect.maxMul * lotteryEffect.maxMul;
    const accel = marble.baseAccel * effect.accelMul * lotteryEffect.accelMul;
    const drag = marble.baseDrag * effect.dragMul * lotteryEffect.dragMul;
    const chaos = effect.chaos * lotteryEffect.chaosMul * (state.config.intensity / 100);

    marble.speed += accel * dt * (0.8 + race.rng() * 0.6);
    marble.speed *= Math.max(0.82, 1 - drag * dt);
    marble.speed = clampFloat(marble.speed, 16, maxSpeed + 35);

    if (race.rng() < chaos * dt) {
      marble.laneTarget = (race.rng() * 2 - 1) * race.track.trackWidth * 0.36;
      if (section.type === "jump") {
        marble.speed += race.rng() * 18 - 7;
      }
    }

    marble.laneOffset += (marble.laneTarget - marble.laneOffset) * dt * (2 + chaos * 2.4);
    marble.laneOffset += (race.rng() * 2 - 1) * chaos * 5 * dt;
    const laneLimit = race.track.trackWidth * 0.36;
    marble.laneOffset = clampFloat(marble.laneOffset, -laneLimit, laneLimit);

    const previousProgress = marble.progress;
    marble.progress += marble.speed * dt;
    marble.raceDistance += marble.speed * dt;

    while (marble.progress >= race.track.totalLength) {
      marble.progress -= race.track.totalLength;
      marble.lap += 1;
      if (state.config.mode !== "elimination" && marble.lap >= state.config.laps) {
        onFinishMarble(marble, race);
        break;
      }
    }

    if (!marble.finished && !marble.eliminated) {
      processCheckpointCrossings(marble, previousProgress, marble.progress, race);
    }
  });

  applyPackDynamics(race, dt);
  maybeCompleteRace(race);
}

function updateLottery(dt, race) {
  const neutral = { accelMul: 1, maxMul: 1, dragMul: 1, chaosMul: 1 };
  if (state.config.mode !== "lottery") {
    race.lottery.active = null;
    return neutral;
  }

  if (race.lottery.active && race.raceTime >= race.lottery.expiresAt) {
    addEvent(`Stage Lottery bitti: ${race.lottery.active.name}`);
    race.lottery.active = null;
  }

  if (!race.lottery.active && race.raceTime >= race.lottery.nextAt) {
    const effect = LOTTERY_EFFECTS[Math.floor(race.rng() * LOTTERY_EFFECTS.length)];
    race.lottery.active = effect;
    race.lottery.expiresAt = race.raceTime + effect.duration;
    race.lottery.nextAt = race.lottery.expiresAt + 7 + race.rng() * 10;
    addEvent(`Stage Lottery aktif: ${effect.name}`);
  }

  return race.lottery.active || neutral;
}

function maybeTriggerElimination(race) {
  if (state.config.mode !== "elimination") {
    return;
  }
  const alive = race.marbles.filter((m) => !m.finished && !m.eliminated);
  if (alive.length <= 1 || race.raceTime < race.nextEliminationAt) {
    return;
  }
  alive.sort((a, b) => getDistance(b, race.track.totalLength) - getDistance(a, race.track.totalLength));
  const loser = alive[alive.length - 1];
  eliminateMarble(loser, race, `Elendi (zaman bazlı eleme)`);
  race.nextEliminationAt += race.eliminationInterval * (0.86 + race.rng() * 0.25);
}

function updateTerritoryControl(dt, race) {
  if (state.config.mode !== "territory") {
    return;
  }
  race.checkpointPointsTimer += dt;
  if (race.checkpointPointsTimer < 1) {
    return;
  }
  race.checkpointPointsTimer = 0;
  Object.values(race.checkpointOwners).forEach((ownerTeam) => {
    if (ownerTeam) {
      race.teamScores[ownerTeam] += 1;
    }
  });
}

function updateTurrets(dt, race) {
  if (state.config.mode !== "arena") {
    return;
  }
  const alive = race.marbles.filter((m) => !m.finished && !m.eliminated);
  if (!alive.length) {
    return;
  }
  const intensityFactor = 0.35 + state.config.intensity / 100;
  race.track.turrets.forEach((turret, index) => {
    race.turretCooldowns[index] -= dt;
    if (race.turretCooldowns[index] > 0) {
      return;
    }
    race.turretCooldowns[index] = 1.4 + race.rng() * 2.2;

    const candidates = alive
      .map((marble) => {
        const gap = Math.abs(normalizeDistance(marble.progress - turret.distance, race.track.totalLength));
        return { marble, gap };
      })
      .sort((a, b) => a.gap - b.gap);

    if (!candidates.length || candidates[0].gap > 52 || race.rng() > intensityFactor) {
      return;
    }

    const target = candidates[0].marble;
    const damage = 8 + race.rng() * 18;
    target.health -= damage;
    target.speed *= 0.74;
    race.damageEvents += 1;
    addEvent(`Turret vurdu: ${target.name} (-${Math.round(damage)} hp)`);
    if (target.health <= 0) {
      eliminateMarble(target, race, "Arena hasariyla elendi");
    }
  });
}

function applyPackDynamics(race, dt) {
  const active = race.marbles.filter((m) => !m.finished && !m.eliminated);
  active.sort((a, b) => getDistance(b, race.track.totalLength) - getDistance(a, race.track.totalLength));
  for (let i = 0; i < active.length; i += 1) {
    const back = active[i];
    for (let j = i + 1; j < Math.min(i + 6, active.length); j += 1) {
      const front = active[j];
      const gap = Math.abs(getDistance(front, race.track.totalLength) - getDistance(back, race.track.totalLength));
      if (gap > 18) {
        continue;
      }
      const laneGap = Math.abs(front.laneOffset - back.laneOffset);
      if (laneGap < 10) {
        back.speed += 11 * dt;
        front.speed *= 0.996;
        back.laneOffset -= Math.sign(back.laneOffset - front.laneOffset || 1) * 5 * dt;
      }
      if (state.config.mode === "arena" && gap < 8 && laneGap < 7) {
        back.health -= 5 * dt;
        front.health -= 5 * dt;
        if (back.health <= 0 && !back.eliminated) {
          eliminateMarble(back, race, "Arena carpismasinda dustu");
        }
        if (front.health <= 0 && !front.eliminated) {
          eliminateMarble(front, race, "Arena carpismasinda dustu");
        }
      }
    }
  }
}

function processCheckpointCrossings(marble, prevProgress, nextProgress, race) {
  race.track.checkpoints.forEach((checkpoint) => {
    if (!didCrossDistance(prevProgress, nextProgress, checkpoint.distance, race.track.totalLength)) {
      return;
    }
    if (state.config.mode === "territory") {
      const owner = race.checkpointOwners[checkpoint.id];
      if (owner !== marble.team) {
        race.checkpointOwners[checkpoint.id] = marble.team;
        race.captures += 1;
        marble.captures += 1;
        marble.score += 8;
        race.teamScores[marble.team] += 6;
        addEvent(`${marble.team} ${checkpoint.id} noktasini ele gecirdi`);
      }
    }
  });
}

function onFinishMarble(marble, race) {
  if (marble.finished || marble.eliminated) {
    return;
  }
  marble.finished = true;
  marble.finishOrder = race.finishers.length + 1;
  const points = FINISH_POINTS[marble.finishOrder - 1] || 0;
  marble.score += points;
  race.teamScores[marble.team] += points;
  race.finishers.push(marble);
  addEvent(`${marble.name} finişi gordu (#${marble.finishOrder})`);
}

function eliminateMarble(marble, race, reason) {
  if (marble.finished || marble.eliminated) {
    return;
  }
  marble.eliminated = true;
  marble.eliminationOrder = race.eliminated.length + 1;
  race.eliminated.push(marble);
  marble.score += Math.max(0, 14 - marble.eliminationOrder);
  addEvent(`${marble.name} ${reason}`);
}

function maybeCompleteRace(race) {
  if (race.finished) {
    return;
  }
  const active = race.marbles.filter((m) => !m.finished && !m.eliminated);
  if (state.config.mode === "elimination") {
    if (active.length <= 1) {
      if (active.length === 1) {
        onFinishMarble(active[0], race);
      }
      race.finished = true;
    }
  } else if (state.config.mode === "arena") {
    if (active.length <= 1 || race.finishers.length >= Math.max(1, Math.floor(state.config.marbleCount * 0.75))) {
      if (active.length === 1 && !active[0].finished) {
        onFinishMarble(active[0], race);
      }
      race.finished = true;
    }
  } else if (!active.length) {
    race.finished = true;
  }

  if (race.raceTime > 300) {
    race.finished = true;
    addEvent("Maksimum sureye ulasildi, yaris sonlandirildi.");
  }

  if (race.finished) {
    state.running = false;
    startPauseBtn.textContent = "Yaris Bitti";
    addEvent("Yaris tamamlandi.");
  }
}

function getSectionAt(sections, progress) {
  return sections.find((section) => progress >= section.start && progress < section.end) || sections[0];
}

function drawTrack(race) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#020617");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const points = race.track.sampled;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = "rgba(148,163,184,0.28)";
  ctx.lineWidth = race.track.trackWidth + 18;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = "rgba(17,24,39,0.95)";
  ctx.lineWidth = race.track.trackWidth;
  ctx.stroke();

  race.track.sections.forEach((section) => {
    drawDistanceSegment(race.track, section.start, section.end, SECTION_META[section.type].color, race.track.trackWidth - 14);
  });

  race.track.checkpoints.forEach((checkpoint) => {
    const p = pointAt(race.track, checkpoint.distance);
    const owner = race.checkpointOwners[checkpoint.id];
    ctx.strokeStyle = owner ? TEAM_PALETTE.find((team) => team.name === owner)?.color || "#94a3b8" : "#475569";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x - p.nx * 30, p.y - p.ny * 30);
    ctx.lineTo(p.x + p.nx * 30, p.y + p.ny * 30);
    ctx.stroke();
  });

  if (state.config.mode === "arena") {
    race.track.turrets.forEach((turret) => {
      ctx.fillStyle = "rgba(248,113,113,0.85)";
      ctx.beginPath();
      ctx.arc(turret.x, turret.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(254,242,242,0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
}

function drawMarbles(race) {
  const marblesToDraw = race.marbles.slice().sort((a, b) => getDistance(a, race.track.totalLength) - getDistance(b, race.track.totalLength));
  marblesToDraw.forEach((marble) => {
    if (marble.eliminated) {
      return;
    }
    const p = pointAt(race.track, marble.progress);
    const x = p.x + p.nx * marble.laneOffset;
    const y = p.y + p.ny * marble.laneOffset;

    ctx.beginPath();
    ctx.fillStyle = "rgba(2,6,23,0.4)";
    ctx.arc(x + 2.6, y + 2.8, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = marble.color;
    ctx.arc(x, y, 7.5, 0, Math.PI * 2);
    ctx.fill();

    if (state.config.mode === "arena") {
      const hpRatio = Math.max(0, marble.health / 100);
      ctx.fillStyle = "rgba(15,23,42,0.85)";
      ctx.fillRect(x - 10, y - 14, 20, 3);
      ctx.fillStyle = hpRatio > 0.45 ? "#22c55e" : hpRatio > 0.2 ? "#eab308" : "#ef4444";
      ctx.fillRect(x - 10, y - 14, 20 * hpRatio, 3);
    }
  });

  const leaders = getRankedMarbles(race).slice(0, 3);
  leaders.forEach((marble, index) => {
    if (marble.eliminated) {
      return;
    }
    const p = pointAt(race.track, marble.progress);
    const x = p.x + p.nx * marble.laneOffset;
    const y = p.y + p.ny * marble.laneOffset;
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 10px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`#${index + 1}`, x, y - 12);
  });
}

function drawHud(race) {
  ctx.font = "700 12px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(226,232,240,0.9)";
  ctx.textAlign = "left";
  ctx.fillText(`Mode: ${MODE_META[state.config.mode].label}`, 14, 20);
  ctx.fillText(`Lap target: ${state.config.laps}`, 14, 38);
  ctx.fillText(`Active marbles: ${race.marbles.filter((m) => !m.eliminated && !m.finished).length}`, 14, 56);
}

function renderRace() {
  if (!state.race) {
    return;
  }
  drawTrack(state.race);
  drawMarbles(state.race);
  drawHud(state.race);
}

function updatePanels(force = false) {
  const race = state.race;
  if (!race) {
    return;
  }
  raceClock.textContent = formatRaceTime(race.raceTime);
  raceStateBadge.textContent = race.finished ? "Bitti" : state.running ? "Canli" : "Hazir";
  raceStateBadge.className = `badge ${race.finished ? "badge--end" : state.running ? "badge--run" : "badge--idle"}`;

  const activeCount = race.marbles.filter((m) => !m.finished && !m.eliminated).length;
  activeMarblesStat.textContent = String(activeCount);
  eliminatedStat.textContent = String(race.eliminated.length);
  captureStat.textContent = String(race.captures);
  damageStat.textContent = String(race.damageEvents);

  if (state.config.mode === "lottery" && race.lottery.active) {
    lotteryBadge.hidden = false;
    lotteryBadge.textContent = `Stage Lottery: ${race.lottery.active.name}`;
  } else {
    lotteryBadge.hidden = true;
  }

  if (!force && performance.now() - state.panelTick < 160) {
    return;
  }
  state.panelTick = performance.now();

  const ranked = getRankedMarbles(race);
  leaderboardBody.innerHTML = ranked
    .map((marble, index) => {
      const status = marble.finished ? "Finish" : marble.eliminated ? "Elendi" : "Yarista";
      return `<tr>
        <td>${index + 1}</td>
        <td><span class="marble-dot" style="background:${marble.color}"></span>${escapeHtml(marble.name)}</td>
        <td>${escapeHtml(marble.team)}</td>
        <td>${status}</td>
        <td>${marble.lap}/${state.config.laps}</td>
        <td>${Math.round(marble.speed)}</td>
        <td>${Math.round(marble.score)}</td>
      </tr>`;
    })
    .join("");

  eventLog.innerHTML = race.events.map((event) => `<li>${escapeHtml(event)}</li>`).join("");
}

function getRankedMarbles(race) {
  const totalLength = race.track.totalLength;
  const marbles = race.marbles.slice();
  marbles.sort((a, b) => {
    if (a.finished && b.finished) {
      return a.finishOrder - b.finishOrder;
    }
    if (a.finished) {
      return -1;
    }
    if (b.finished) {
      return 1;
    }
    if (a.eliminated && b.eliminated) {
      return b.eliminationOrder - a.eliminationOrder;
    }
    if (a.eliminated) {
      return 1;
    }
    if (b.eliminated) {
      return -1;
    }
    return getDistance(b, totalLength) - getDistance(a, totalLength);
  });
  return marbles;
}

function addEvent(message) {
  if (!state.race) {
    return;
  }
  state.race.events.unshift(`[${formatRaceTime(state.race.raceTime)}] ${message}`);
  state.race.events = state.race.events.slice(0, 40);
}

function tick(now) {
  if (!state.frameTime) {
    state.frameTime = now;
  }
  const dt = Math.min(0.05, (now - state.frameTime) / 1000);
  state.frameTime = now;
  if (state.running) {
    updateRace(dt);
  }
  updatePanels();
  renderRace();
  requestAnimationFrame(tick);
}

function drawDistanceSegment(track, start, end, color, width) {
  const step = 10;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();

  if (end < start) {
    end += track.totalLength;
  }
  let first = true;
  for (let d = start; d <= end; d += step) {
    const p = pointAt(track, d);
    if (first) {
      ctx.moveTo(p.x, p.y);
      first = false;
    } else {
      ctx.lineTo(p.x, p.y);
    }
  }
  ctx.stroke();
}

function pointAt(track, distanceAlong) {
  const total = track.totalLength;
  let distanceNorm = ((distanceAlong % total) + total) % total;
  const cumulative = track.cumulative;
  let low = 0;
  let high = cumulative.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (cumulative[mid] < distanceNorm) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  const index = Math.max(1, low);
  const prevIndex = index - 1;
  const prevLen = cumulative[prevIndex];
  const nextLen = cumulative[index];
  const span = nextLen - prevLen || 1;
  const t = (distanceNorm - prevLen) / span;
  const a = track.sampled[prevIndex];
  const b = track.sampled[index % track.sampled.length];
  const x = lerp(a.x, b.x, t);
  const y = lerp(a.y, b.y, t);

  const prev = track.sampled[(prevIndex - 1 + track.sampled.length) % track.sampled.length];
  const next = track.sampled[(index + 1) % track.sampled.length];
  const tx = next.x - prev.x;
  const ty = next.y - prev.y;
  const mag = Math.hypot(tx, ty) || 1;
  const nx = -ty / mag;
  const ny = tx / mag;
  return { x, y, nx, ny };
}

function didCrossDistance(prev, next, checkpoint, totalLength) {
  if (next >= totalLength) {
    next -= totalLength;
  }
  if (next >= prev) {
    return checkpoint >= prev && checkpoint < next;
  }
  return checkpoint >= prev || checkpoint < next;
}

function getDistance(marble, totalLength) {
  return marble.lap * totalLength + marble.progress;
}

function createRng(seedText) {
  let seed = hashString(seedText);
  return function rng() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clampNum(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampFloat(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function normalizeDistance(value, totalLength) {
  let wrapped = ((value % totalLength) + totalLength) % totalLength;
  if (wrapped > totalLength * 0.5) {
    wrapped -= totalLength;
  }
  return wrapped;
}

function formatRaceTime(seconds) {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = (seconds % 60).toFixed(1).padStart(4, "0");
  return `${min}:${sec}`;
}

function shuffleInPlace(rng, list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

modeSelect.addEventListener("change", () => {
  renderModeDescription();
});
generateBtn.addEventListener("click", () => {
  resetRace();
});
startPauseBtn.addEventListener("click", () => {
  if (!state.race) {
    resetRace();
  }
  toggleRace();
});
resetBtn.addEventListener("click", () => {
  resetRace();
});
window.addEventListener("resize", () => {
  if (!state.race) {
    return;
  }
  resetRace();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

loadConfig();
fillControls();
resetRace();
requestAnimationFrame(tick);
