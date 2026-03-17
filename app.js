/* ==========================================================
   MISKET YARIŞI  –  3D Marble Race Game
   Three.js r149 + Cannon.js 0.6.2
   ========================================================== */

(function () {
  "use strict";

  // ───────── Constants ─────────
  const MARBLE_RADIUS = 0.42;
  const TRACK_THICKNESS = 0.5;
  const WALL_HEIGHT = 2.2;
  const WALL_THICK = 0.28;
  const GRAVITY = -28;
  const PHYSICS_DT = 1 / 60;
  const MAX_SUBSTEPS = 3;
  const FINISH_TIMEOUT = 90;
  const SEGMENT_OVERLAP = 0.8;

  const MARBLE_DEFS = [
    { name: "Kırmızı Şimşek", color: 0xff2233 },
    { name: "Mavi Fırtına", color: 0x2266ff },
    { name: "Yeşil Ejderha", color: 0x22cc44 },
    { name: "Sarı Güneş", color: 0xffcc00 },
    { name: "Turuncu Alev", color: 0xff6611 },
    { name: "Mor Yıldırım", color: 0x9944ff },
    { name: "Pembe Panter", color: 0xff44aa },
    { name: "Beyaz Kurt", color: 0xeeeeff },
    { name: "Siyah Şahin", color: 0x181818 },
    { name: "Turkuaz Dalga", color: 0x00cccc },
    { name: "Altın Yıldız", color: 0xdaa520 },
    { name: "Gümüş Ok", color: 0x99aacc },
  ];

  // ───────── DOM ─────────
  const canvas = document.getElementById("gameCanvas");
  const menuScreen = document.getElementById("menuScreen");
  const resultsScreen = document.getElementById("resultsScreen");
  const hudEl = document.getElementById("hud");
  const countdownEl = document.getElementById("countdown");
  const leaderboardEl = document.getElementById("leaderboard");
  const speedValEl = document.getElementById("speedVal");
  const timeValEl = document.getElementById("timeVal");
  const yourPosEl = document.getElementById("yourPos");
  const yourPosTextEl = document.getElementById("yourPosText");
  const sectionNameEl = document.getElementById("sectionName");
  const marbleGridEl = document.getElementById("marbleGrid");
  const startBtnEl = document.getElementById("startBtn");
  const replayBtnEl = document.getElementById("replayBtn");

  // ───────── Game State ─────────
  const state = {
    phase: "menu",
    selectedIdx: -1,
    marbles: [],
    finishOrder: [],
    raceTime: 0,
    cdValue: 3,
    cdTimer: 0,
  };

  // ───────── Three.js Setup ─────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7ec8e3);
  scene.fog = new THREE.FogExp2(0x7ec8e3, 0.0022);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 110, -30);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));

  const sun = new THREE.DirectionalLight(0xfff5e0, 1.6);
  sun.position.set(60, 130, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 350;
  sun.shadow.camera.left = -140;
  sun.shadow.camera.right = 140;
  sun.shadow.camera.top = 140;
  sun.shadow.camera.bottom = -40;
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3a5f0b, 0.35));

  const fillLight = new THREE.DirectionalLight(0xaaccff, 0.4);
  fillLight.position.set(-40, 60, 50);
  scene.add(fillLight);

  // ───────── Cannon.js Setup ─────────
  const world = new CANNON.World();
  world.gravity.set(0, GRAVITY, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 18;

  const matTrack = new CANNON.Material("track");
  const matMarble = new CANNON.Material("marble");
  world.addContactMaterial(new CANNON.ContactMaterial(matTrack, matMarble, { friction: 0.18, restitution: 0.32 }));
  world.addContactMaterial(new CANNON.ContactMaterial(matMarble, matMarble, { friction: 0.08, restitution: 0.5 }));

  // Ground (safety net)
  const groundBody = new CANNON.Body({ mass: 0, material: matTrack });
  groundBody.addShape(new CANNON.Plane());
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  groundBody.position.y = -20;
  world.addBody(groundBody);

  // ───────── Environment Visuals ─────────
  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x4a8c3f, roughness: 0.95 })
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -20;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Water plane
  const waterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x1a6b8a, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.7 })
  );
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -19.5;
  scene.add(waterMesh);

  // ───────── Track Waypoints ─────────
  function spiralPoints(cx, cz, radius, yStart, yEnd, turns, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const angle = t * turns * Math.PI * 2 - Math.PI * 0.5;
      pts.push({ x: cx + Math.cos(angle) * radius, y: yStart + (yEnd - yStart) * t, z: cz + Math.sin(angle) * radius, w: 3.8 });
    }
    return pts;
  }

  function buildWaypoints() {
    const wp = [];
    // Section 1 – Start Platform
    wp.push({ x: 0, y: 80, z: 0, w: 13 });
    wp.push({ x: 0, y: 80, z: 8, w: 13 });

    // Section 2 – Initial Steep Drop
    wp.push({ x: 0, y: 72, z: 28, w: 12 });
    wp.push({ x: 0, y: 64, z: 48, w: 11 });
    wp.push({ x: 0, y: 58, z: 62, w: 10 });

    // Section 3 – Funnel (narrows)
    wp.push({ x: 1, y: 54, z: 76, w: 8 });
    wp.push({ x: 2, y: 50, z: 90, w: 6 });
    wp.push({ x: 1, y: 47, z: 103, w: 4.2 });

    // Section 4 – S-Curves
    wp.push({ x: 7, y: 44, z: 115, w: 4.2 });
    wp.push({ x: 14, y: 41.5, z: 126, w: 4.2 });
    wp.push({ x: 19, y: 39, z: 138, w: 4.2 });
    wp.push({ x: 16, y: 36.5, z: 150, w: 4.2 });
    wp.push({ x: 8, y: 34, z: 160, w: 4.2 });
    wp.push({ x: 0, y: 32, z: 170, w: 4.2 });
    wp.push({ x: -8, y: 30, z: 180, w: 4.2 });
    wp.push({ x: -16, y: 28, z: 190, w: 4.2 });

    // Section 5 – Spiral Descent (1.5 turns)
    const sp = spiralPoints(-8, 208, 13, 26, 12, 1.5, 22);
    wp.push(...sp);

    // Section 6 – Transition & Jump
    wp.push({ x: -2, y: 11, z: 226, w: 4.5 });
    wp.push({ x: 2, y: 10, z: 238, w: 5 });
    wp.push({ x: 5, y: 11.5, z: 246, w: 5 });
    // Jump gap — landing zone
    wp.push({ x: 8, y: 4, z: 258, w: 8 });

    // Section 7 – Bumpy Chicane
    wp.push({ x: 17, y: 4, z: 278, w: 3.8 });
    wp.push({ x: 7, y: 3.5, z: 288, w: 3.8 });
    wp.push({ x: 17, y: 3, z: 298, w: 3.8 });
    wp.push({ x: 7, y: 2.5, z: 308, w: 3.8 });

    // Section 8 – Final Straight
    wp.push({ x: 10, y: 1.8, z: 325, w: 5.5 });
    wp.push({ x: 10, y: 1, z: 345, w: 6.5 });
    wp.push({ x: 10, y: 0.3, z: 362, w: 7.5 });
    wp.push({ x: 10, y: 0, z: 378, w: 8 });
    wp.push({ x: 10, y: 0, z: 390, w: 8 });
    return wp;
  }

  const trackWP = buildWaypoints();
  const trackVecs = trackWP.map((p) => new THREE.Vector3(p.x, p.y, p.z));
  const finishZ = trackWP[trackWP.length - 1].z - 5;

  // ───────── Track Builder ─────────
  function getSectionColor(idx) {
    const t = idx / (trackWP.length - 1);
    const hue = t * 0.75;
    return new THREE.Color().setHSL(hue, 0.45, 0.48);
  }

  function createSegment(from, to, wFrom, wTo, idx) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length() + SEGMENT_OVERLAP;
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    const nDir = dir.clone().normalize();
    const w = (wFrom + wTo) / 2;
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), nDir);

    const col = getSectionColor(idx);

    // Floor
    const fG = new THREE.BoxGeometry(w, TRACK_THICKNESS, len);
    const fMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, metalness: 0.05 });
    const fM = new THREE.Mesh(fG, fMat);
    fM.position.copy(mid);
    fM.setRotationFromQuaternion(q);
    fM.castShadow = true;
    fM.receiveShadow = true;
    scene.add(fM);

    const fB = new CANNON.Body({ mass: 0, material: matTrack });
    fB.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, TRACK_THICKNESS / 2, len / 2)));
    fB.position.set(mid.x, mid.y, mid.z);
    fB.quaternion.set(q.x, q.y, q.z, q.w);
    world.addBody(fB);

    // Walls
    const wMat = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.65), roughness: 0.75, transparent: true, opacity: 0.55 });
    const wG = new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, len);

    [-1, 1].forEach((side) => {
      const wM = new THREE.Mesh(wG, wMat);
      const off = new THREE.Vector3(side * (w / 2 + WALL_THICK / 2), WALL_HEIGHT / 2, 0).applyQuaternion(q);
      wM.position.copy(mid).add(off);
      wM.setRotationFromQuaternion(q);
      wM.castShadow = true;
      scene.add(wM);

      const wB = new CANNON.Body({ mass: 0, material: matTrack });
      wB.addShape(new CANNON.Box(new CANNON.Vec3(WALL_THICK / 2, WALL_HEIGHT / 2, len / 2)));
      wB.position.set(wM.position.x, wM.position.y, wM.position.z);
      wB.quaternion.set(q.x, q.y, q.z, q.w);
      world.addBody(wB);
    });
  }

  function buildTrack() {
    for (let i = 0; i < trackWP.length - 1; i++) {
      const a = trackWP[i], b = trackWP[i + 1];
      createSegment(
        new THREE.Vector3(a.x, a.y, a.z),
        new THREE.Vector3(b.x, b.y, b.z),
        a.w, b.w, i
      );
    }
  }

  // ───────── Decorations ─────────
  let startGateBody = null;
  let startGateMesh = null;

  function addDecorations() {
    // Start gate
    const sw = trackWP[0];
    const gateMat3 = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5, metalness: 0.3 });
    startGateMesh = new THREE.Mesh(new THREE.BoxGeometry(sw.w + 1, 4, 0.5), gateMat3);
    startGateMesh.position.set(sw.x, sw.y + 2, sw.z + 9.5);
    startGateMesh.castShadow = true;
    scene.add(startGateMesh);

    startGateBody = new CANNON.Body({ mass: 0, material: matTrack });
    startGateBody.addShape(new CANNON.Box(new CANNON.Vec3((sw.w + 1) / 2, 2, 0.25)));
    startGateBody.position.set(sw.x, sw.y + 2, sw.z + 9.5);
    world.addBody(startGateBody);

    // Start arch pillars
    const archMat = new THREE.MeshStandardMaterial({ color: 0xaa1111, roughness: 0.4, metalness: 0.4 });
    [-1, 1].forEach((side) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 0.6), archMat);
      p.position.set(sw.x + side * (sw.w / 2 + 0.5), sw.y + 3, sw.z + 9.5);
      p.castShadow = true;
      scene.add(p);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(sw.w + 2.5, 1, 0.8), archMat);
    beam.position.set(sw.x, sw.y + 6.2, sw.z + 9.5);
    beam.castShadow = true;
    scene.add(beam);

    // "START" text on beam
    const startLabelGeo = new THREE.BoxGeometry(4, 0.6, 0.1);
    const startLabelMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 });
    const startLabel = new THREE.Mesh(startLabelGeo, startLabelMat);
    startLabel.position.set(sw.x, sw.y + 6.2, sw.z + 9.1);
    scene.add(startLabel);

    // Finish line
    const fw = trackWP[trackWP.length - 1];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 2; j++) {
        const isBlack = (i + j) % 2 === 0;
        const chkGeo = new THREE.BoxGeometry(fw.w / 10, 0.06, 1);
        const chkMat = new THREE.MeshStandardMaterial({ color: isBlack ? 0x111111 : 0xffffff });
        const chk = new THREE.Mesh(chkGeo, chkMat);
        chk.position.set(fw.x - fw.w / 2 + (i + 0.5) * (fw.w / 10), fw.y + 0.28, fw.z - 4 + j);
        scene.add(chk);
      }
    }

    // Finish arch
    const finArchMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.6 });
    [-1, 1].forEach((side) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7, 8), finArchMat);
      p.position.set(fw.x + side * (fw.w / 2 + 0.5), fw.y + 3.5, fw.z - 3.5);
      p.castShadow = true;
      scene.add(p);
    });
    const finBeam = new THREE.Mesh(new THREE.BoxGeometry(fw.w + 2, 0.8, 0.6), finArchMat);
    finBeam.position.set(fw.x, fw.y + 7, fw.z - 3.5);
    finBeam.castShadow = true;
    scene.add(finBeam);

    // Checkered flag banners
    const bannerGeo = new THREE.PlaneGeometry(2, 3);
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    [-1, 1].forEach((side) => {
      const b = new THREE.Mesh(bannerGeo, bannerMat);
      b.position.set(fw.x + side * (fw.w / 2 + 0.5), fw.y + 5.5, fw.z - 3.5);
      scene.add(b);
    });

    // Support pillars along track
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.85, metalness: 0.15 });
    for (let i = 2; i < trackWP.length; i += 4) {
      const wp = trackWP[i];
      if (wp.y > 3) {
        const h = wp.y + 20;
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, h, 6), pillarMat);
        p.position.set(wp.x, wp.y - h / 2, wp.z);
        p.castShadow = true;
        scene.add(p);
      }
    }

    // Trees
    const treeMats = [
      new THREE.MeshStandardMaterial({ color: 0x2d6b27 }),
      new THREE.MeshStandardMaterial({ color: 0x3a8030 }),
      new THREE.MeshStandardMaterial({ color: 0x1f5520 }),
    ];
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e });
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 300;
      const z = Math.random() * 450 - 30;
      const scale = 0.7 + Math.random() * 0.8;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.4 * scale, 3 * scale, 5), trunkMat);
      trunk.position.set(x, -20 + 1.5 * scale, z);
      trunk.castShadow = true;
      scene.add(trunk);
      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(1.8 * scale, 5 * scale, 6),
        treeMats[Math.floor(Math.random() * 3)]
      );
      foliage.position.set(x, -20 + 5.5 * scale, z);
      foliage.castShadow = true;
      scene.add(foliage);
    }

    // Clouds
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 15; i++) {
      const g = new THREE.SphereGeometry(4 + Math.random() * 6, 8, 6);
      const c = new THREE.Mesh(g, cloudMat);
      c.position.set((Math.random() - 0.5) * 400, 100 + Math.random() * 40, Math.random() * 500 - 50);
      c.scale.set(1 + Math.random(), 0.4 + Math.random() * 0.3, 1 + Math.random());
      scene.add(c);
    }

    // Mountains in background
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.9 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xddddee, roughness: 0.8 });
    const mountainPositions = [
      { x: -200, z: 300, s: 80, h: 120 },
      { x: 200, z: 350, s: 60, h: 90 },
      { x: -150, z: 500, s: 100, h: 150 },
      { x: 150, z: 500, s: 70, h: 110 },
      { x: 0, z: 550, s: 90, h: 130 },
      { x: -250, z: 100, s: 50, h: 70 },
      { x: 250, z: 150, s: 65, h: 95 },
    ];
    mountainPositions.forEach((mp) => {
      const mtn = new THREE.Mesh(new THREE.ConeGeometry(mp.s, mp.h, 6), mountainMat);
      mtn.position.set(mp.x, -20 + mp.h / 2 - 10, mp.z);
      scene.add(mtn);
      const snow = new THREE.Mesh(new THREE.ConeGeometry(mp.s * 0.35, mp.h * 0.25, 6), snowMat);
      snow.position.set(mp.x, -20 + mp.h - 10 - mp.h * 0.12, mp.z);
      scene.add(snow);
    });

    // Spectator stands along the track
    const standMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    const standPositions = [
      { x: -12, y: 80, z: 5, rot: 0 },
      { x: 25, y: 45, z: 140, rot: -0.3 },
      { x: -30, y: 20, z: 200, rot: 0.5 },
      { x: 25, y: 2, z: 355, rot: -0.2 },
    ];
    standPositions.forEach((sp) => {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 3), standMat);
      stand.position.set(sp.x, sp.y - 1, sp.z);
      stand.rotation.y = sp.rot;
      stand.castShadow = true;
      scene.add(stand);

      const backGeo = new THREE.BoxGeometry(8, 2, 0.3);
      const back = new THREE.Mesh(backGeo, standMat);
      back.position.set(sp.x - Math.sin(sp.rot) * 1.3, sp.y + 0.8, sp.z - Math.cos(sp.rot) * 1.3);
      back.rotation.y = sp.rot;
      scene.add(back);

      const dotColors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff44ff];
      for (let i = 0; i < 12; i++) {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 6, 6),
          new THREE.MeshStandardMaterial({ color: dotColors[i % dotColors.length] })
        );
        dot.position.set(
          sp.x + (Math.random() - 0.5) * 6,
          sp.y + 0.5 + Math.random() * 0.5,
          sp.z + (Math.random() - 0.5) * 1.5
        );
        scene.add(dot);
      }
    });

    // Boost zone indicators (glowing track sections)
    const boostZones = [
      { z: 50, x: 0, y: 64, w: 11 },
      { z: 238, x: 2, y: 10, w: 5 },
      { z: 345, x: 10, y: 1, w: 6.5 },
    ];
    boostZones.forEach((bz) => {
      const geo = new THREE.BoxGeometry(bz.w - 0.5, 0.08, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x00ff44,
        emissive: 0x00ff44,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(bz.x, bz.y + 0.3, bz.z);
      scene.add(mesh);
    });

    // Bumpers in the chicane
    addBumper(12, 3.8, 283, 0.5, 1.5);
    addBumper(12, 3.2, 293, 0.5, 1.5);
    addBumper(12, 2.7, 303, 0.5, 1.5);

    // Bumpers in S-curves
    addBumper(10, 42, 133, 0.45, 1.3);
    addBumper(8, 35, 155, 0.45, 1.3);

    // Spinning obstacles
    addSpinner(1, 47, 103, 1.8, 2.5);
    addSpinner(12, 3.5, 283, 1.5, 3.0);

    // Track edge stripes (colored markers at key sections)
    const edgeStripeMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.2 });
    const dangerStripeMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.2 });
    for (let i = 0; i < trackWP.length; i += 3) {
      const wp = trackWP[i];
      const stripeMat = i > 30 && i < 55 ? dangerStripeMat : edgeStripeMat;
      [-1, 1].forEach((side) => {
        const geo = new THREE.BoxGeometry(0.15, 0.1, 2);
        const stripe = new THREE.Mesh(geo, stripeMat);
        stripe.position.set(wp.x + side * (wp.w / 2 - 0.1), wp.y + 0.28, wp.z);
        scene.add(stripe);
      });
    }

    // Half-pipe banked walls at the S-curve section
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x558855, roughness: 0.5, transparent: true, opacity: 0.4 });
    const bankPositions = [
      { x: 19, y: 39, z: 138, w: 4.2, angle: 0.4, side: 1 },
      { x: 16, y: 36.5, z: 150, w: 4.2, angle: -0.3, side: -1 },
      { x: -16, y: 28, z: 190, w: 4.2, angle: 0.35, side: -1 },
    ];
    bankPositions.forEach((bp) => {
      const geo = new THREE.BoxGeometry(2, 0.3, 14);
      const mesh = new THREE.Mesh(geo, bankMat);
      mesh.position.set(bp.x + bp.side * bp.w / 2, bp.y + 0.5, bp.z);
      mesh.rotation.z = bp.side * bp.angle;
      scene.add(mesh);

      const body = new CANNON.Body({ mass: 0, material: matTrack });
      body.addShape(new CANNON.Box(new CANNON.Vec3(1, 0.15, 7)));
      body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
      const bq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, bp.side * bp.angle));
      body.quaternion.set(bq.x, bq.y, bq.z, bq.w);
      world.addBody(body);
    });

    // Danger zone warning signs near the spiral
    const signMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff8800, emissiveIntensity: 0.3 });
    const signGeo = new THREE.BoxGeometry(1.5, 1.5, 0.1);
    const spiralEntry = trackWP[16];
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(spiralEntry.x - 3, spiralEntry.y + 3, spiralEntry.z);
    scene.add(sign);
    const signPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3, 4),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    signPost.position.set(spiralEntry.x - 3, spiralEntry.y + 1.5, spiralEntry.z);
    scene.add(signPost);
  }

  function addBumper(x, y, z, radius, height) {
    const geo = new THREE.CylinderGeometry(radius, radius, height, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff3355, roughness: 0.3, metalness: 0.6, emissive: 0xff1133, emissiveIntensity: 0.15 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    scene.add(mesh);

    const body = new CANNON.Body({ mass: 0, material: matTrack });
    body.addShape(new CANNON.Cylinder(radius, radius, height, 12));
    body.position.set(x, y + height / 2, z);
    world.addBody(body);
  }

  function removeStartGate() {
    if (startGateBody) {
      world.removeBody(startGateBody);
      startGateBody = null;
    }
    if (startGateMesh) {
      scene.remove(startGateMesh);
      startGateMesh = null;
    }
  }

  // ───────── Environment Map for Shiny Marbles ─────────
  let envMap = null;
  function generateEnvMap() {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envRT = pmremGenerator.fromScene(scene, 0, 0.1, 500);
    envMap = envRT.texture;
    pmremGenerator.dispose();
  }

  // ───────── Marble Trail System ─────────
  const TRAIL_LENGTH = 28;

  function createTrail(color) {
    const positions = new Float32Array(TRAIL_LENGTH * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    return { geo, positions, line, count: 0 };
  }

  function updateTrail(trail, pos) {
    const p = trail.positions;
    if (trail.count < TRAIL_LENGTH) trail.count++;
    for (let i = (trail.count - 1) * 3; i >= 3; i -= 3) {
      p[i] = p[i - 3];
      p[i + 1] = p[i - 2];
      p[i + 2] = p[i - 1];
    }
    p[0] = pos.x;
    p[1] = pos.y;
    p[2] = pos.z;
    trail.geo.attributes.position.needsUpdate = true;
    trail.geo.setDrawRange(0, trail.count);
  }

  // ───────── Marble Creation ─────────
  function createMarbles() {
    const startWP = trackWP[0];
    state.marbles = [];

    for (let i = 0; i < MARBLE_DEFS.length; i++) {
      const def = MARBLE_DEFS[i];
      const geo = new THREE.SphereGeometry(MARBLE_RADIUS, 28, 28);
      const mat = new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: 0.1,
        metalness: 0.9,
        envMap: envMap,
        envMapIntensity: 1.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const row = Math.floor(i / 4);
      const col = i % 4;
      const x = startWP.x + (col - 1.5) * 2.4;
      const z = startWP.z + 2 + row * 2.2;
      const y = startWP.y + 1.5;

      const body = new CANNON.Body({
        mass: 1 + (Math.random() - 0.5) * 0.06,
        material: matMarble,
        shape: new CANNON.Sphere(MARBLE_RADIUS),
        linearDamping: 0.04,
        angularDamping: 0.25,
      });
      body.position.set(x, y, z);
      world.addBody(body);

      const trail = createTrail(def.color);

      state.marbles.push({
        def, mesh, body, trail,
        startX: x, startY: y, startZ: z,
        finished: false,
        finishTime: 0,
        progress: 0,
      });
    }
  }

  function resetMarbles() {
    state.marbles.forEach((m) => {
      m.body.position.set(m.startX, m.startY, m.startZ);
      m.body.velocity.set(0, 0, 0);
      m.body.angularVelocity.set(0, 0, 0);
      m.body.force.set(0, 0, 0);
      m.body.torque.set(0, 0, 0);
      m.finished = false;
      m.finishTime = 0;
      m.progress = 0;
      if (m.trail) {
        m.trail.count = 0;
        m.trail.geo.setDrawRange(0, 0);
      }
    });
    // Clear confetti
    confettiPieces.forEach((c) => {
      scene.remove(c.mesh);
      c.mesh.geometry.dispose();
      c.mesh.material.dispose();
    });
    confettiPieces.length = 0;
    confettiActive = false;
  }

  // ───────── Progress Tracking ─────────
  const _tmpA = new THREE.Vector3();
  const _tmpB = new THREE.Vector3();
  const _tmpP = new THREE.Vector3();

  function computeProgress(marble) {
    const pos = marble.body.position;
    _tmpP.set(pos.x, pos.y, pos.z);
    let bestT = 0;
    let minDist = 1e9;
    for (let i = 0; i < trackVecs.length - 1; i++) {
      _tmpA.copy(trackVecs[i]);
      _tmpB.copy(trackVecs[i + 1]).sub(_tmpA);
      const lenSq = _tmpB.lengthSq();
      if (lenSq < 0.001) continue;
      let t = _tmpP.clone().sub(_tmpA).dot(_tmpB) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const closest = _tmpA.clone().addScaledVector(_tmpB, t);
      const dist = closest.distanceToSquared(_tmpP);
      if (dist < minDist) {
        minDist = dist;
        bestT = i + t;
      }
    }
    return bestT / (trackVecs.length - 1);
  }

  function isAtFinish(marble) {
    return marble.body.position.z >= finishZ;
  }

  function findNearestWP(marble) {
    const pos = marble.body.position;
    let best = 0, minD = 1e9;
    for (let i = 0; i < trackWP.length; i++) {
      const wp = trackWP[i];
      const d = (pos.x - wp.x) ** 2 + (pos.z - wp.z) ** 2;
      if (d < minD) { minD = d; best = i; }
    }
    return best;
  }

  // ───────── Camera ─────────
  const cam = {
    pos: new THREE.Vector3(0, 110, -30),
    look: new THREE.Vector3(0, 80, 20),
    smoothP: 0.04,
    smoothL: 0.05,
    angleTimer: 0,
    currentAngle: 0,
    angleDuration: 6,
  };

  const CAM_ANGLES = [
    { offset: new THREE.Vector3(-16, 12, -14), name: "chase-left" },
    { offset: new THREE.Vector3(16, 10, -12), name: "chase-right" },
    { offset: new THREE.Vector3(0, 20, -18), name: "high-back" },
    { offset: new THREE.Vector3(-8, 6, -8), name: "low-left" },
    { offset: new THREE.Vector3(5, 15, 10), name: "front-high" },
    { offset: new THREE.Vector3(-20, 8, 0), name: "side" },
  ];

  function updateCamera() {
    if (state.phase === "menu") {
      const t = Date.now() * 0.00008;
      const cx = 10 + Math.cos(t) * 70;
      const cz = 150 + Math.sin(t) * 70;
      cam.pos.lerp(new THREE.Vector3(cx, 85, cz), 0.012);
      cam.look.lerp(new THREE.Vector3(0, 45, 160), 0.012);
      camera.position.copy(cam.pos);
      camera.lookAt(cam.look);
      return;
    }

    let leader = state.marbles[0];
    let maxProg = -1;
    for (const m of state.marbles) {
      if (!m.finished && m.progress > maxProg) {
        maxProg = m.progress;
        leader = m;
      }
    }

    const lp = leader.body.position;
    const target = new THREE.Vector3(lp.x, lp.y, lp.z);
    const vel = leader.body.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    const lookAheadDist = Math.min(speed * 0.6, 15);
    const lookAhead = new THREE.Vector3(vel.x, 0, vel.z).normalize().multiplyScalar(lookAheadDist);

    const angle = CAM_ANGLES[cam.currentAngle];
    const desiredPos = target.clone().add(angle.offset);
    const desiredLook = target.clone().add(lookAhead);

    cam.pos.lerp(desiredPos, cam.smoothP);
    cam.look.lerp(desiredLook, cam.smoothL);

    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);
  }

  function rotateCameraAngle(dt) {
    cam.angleTimer += dt;
    if (cam.angleTimer >= cam.angleDuration) {
      cam.angleTimer = 0;
      cam.currentAngle = (cam.currentAngle + 1) % CAM_ANGLES.length;
      cam.angleDuration = 4 + Math.random() * 4;
    }
  }

  // ───────── UI ─────────
  function hexStr(c) {
    return "#" + c.toString(16).padStart(6, "0");
  }

  function lighten(hex, amount) {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  }

  function populateMarbleGrid() {
    marbleGridEl.innerHTML = "";
    MARBLE_DEFS.forEach((def, i) => {
      const card = document.createElement("div");
      card.className = "marble-card";
      card.innerHTML = `
        <div class="marble-preview" style="background:radial-gradient(circle at 35% 32%,${lighten(def.color, 120)},${hexStr(def.color)})"></div>
        <div class="marble-name">${def.name}</div>`;
      card.addEventListener("click", () => {
        document.querySelectorAll(".marble-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        state.selectedIdx = i;
        startBtnEl.disabled = false;
      });
      marbleGridEl.appendChild(card);
    });
  }

  function updateLeaderboard() {
    const sorted = state.marbles
      .map((m, i) => ({ m, i }))
      .sort((a, b) => {
        if (a.m.finished && b.m.finished) return a.m.finishTime - b.m.finishTime;
        if (a.m.finished) return -1;
        if (b.m.finished) return 1;
        return b.m.progress - a.m.progress;
      });

    let html = '<div class="lb-title">Sıralama</div>';
    const show = Math.min(sorted.length, 6);
    for (let i = 0; i < show; i++) {
      const { m, i: idx } = sorted[i];
      const mine = idx === state.selectedIdx;
      html += `<div class="lb-item${mine ? " mine" : ""}">
        <span class="lb-pos">${i + 1}</span>
        <span class="lb-dot" style="background:${hexStr(m.def.color)}"></span>
        <span class="lb-name">${m.def.name}</span>
      </div>`;
    }
    if (sorted.length > show) html += '<div class="lb-more">+' + (sorted.length - show) + " daha</div>";
    leaderboardEl.innerHTML = html;

    // Your marble position
    const myPos = sorted.findIndex((s) => s.i === state.selectedIdx) + 1;
    if (myPos > 0) {
      yourPosEl.classList.remove("hidden");
      yourPosTextEl.textContent = `Senin misketin: ${myPos}. sırada`;
    }
  }

  const TRACK_SECTIONS = [
    { minZ: 0, maxZ: 10, name: "Başlangıç Platformu" },
    { minZ: 10, maxZ: 65, name: "Dik Yokuş" },
    { minZ: 65, maxZ: 110, name: "Huni Bölgesi" },
    { minZ: 110, maxZ: 195, name: "S Virajları" },
    { minZ: 195, maxZ: 225, name: "Ölüm Spirali" },
    { minZ: 225, maxZ: 260, name: "Atlama Rampası" },
    { minZ: 260, maxZ: 320, name: "Şikane Bölgesi" },
    { minZ: 320, maxZ: 400, name: "Final Düzlüğü" },
  ];

  function updateSectionDisplay() {
    let leader = state.marbles[0];
    let maxProg = -1;
    for (const m of state.marbles) {
      if (!m.finished && m.progress > maxProg) {
        maxProg = m.progress;
        leader = m;
      }
    }
    const z = leader.body.position.z;
    const section = TRACK_SECTIONS.find((s) => z >= s.minZ && z < s.maxZ);
    if (section) {
      sectionNameEl.classList.remove("hidden");
      sectionNameEl.textContent = section.name;
    }
  }

  function showResults() {
    resultsScreen.classList.remove("hidden");
    hudEl.classList.add("hidden");
    sectionNameEl.classList.add("hidden");

    // Podium
    const podiumEl = document.getElementById("podium");
    const top3 = state.finishOrder.slice(0, 3);
    const positions = [1, 0, 2]; // 2nd, 1st, 3rd for visual layout
    let podiumHTML = "";
    positions.forEach((pi) => {
      if (pi < top3.length) {
        const m = top3[pi];
        podiumHTML += `<div class="podium-place">
          <div class="podium-marble" style="background:radial-gradient(circle at 35% 32%,${lighten(m.def.color, 120)},${hexStr(m.def.color)})"></div>
          <div class="podium-name">${m.def.name}</div>
          <div class="podium-bar p${pi + 1}">${pi === 0 ? "🥇" : pi === 1 ? "🥈" : "🥉"}</div>
        </div>`;
      }
    });
    podiumEl.innerHTML = podiumHTML;

    // Full results list
    const listEl = document.getElementById("resultsList");
    let listHTML = "";
    state.finishOrder.forEach((m, i) => {
      const idx = state.marbles.indexOf(m);
      const mine = idx === state.selectedIdx;
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
      listHTML += `<div class="r-item${mine ? " mine" : ""}">
        <span class="r-pos">${medal || i + 1 + "."}</span>
        <span class="r-dot" style="background:${hexStr(m.def.color)}"></span>
        <span class="r-name">${m.def.name}</span>
        <span class="r-time">${m.finishTime.toFixed(1)}s</span>
      </div>`;
    });
    listEl.innerHTML = listHTML;

    // Your result
    const yourEl = document.getElementById("yourResult");
    const sel = state.marbles[state.selectedIdx];
    const pos = state.finishOrder.indexOf(sel) + 1;
    if (pos === 1) {
      yourEl.innerHTML = "🎉 Tebrikler! Misketin <strong>1. oldu!</strong>";
      yourEl.style.borderColor = "rgba(251,191,36,.4)";
    } else if (pos <= 3) {
      yourEl.innerHTML = `👏 Misketin <strong>${pos}. oldu!</strong> Harika yarış!`;
      yourEl.style.borderColor = "rgba(99,102,241,.3)";
    } else {
      yourEl.innerHTML = `Misketin <strong>${pos}. oldu.</strong> Bir dahaki sefere!`;
      yourEl.style.borderColor = "rgba(255,255,255,.06)";
    }
  }

  // ───────── Confetti System ─────────
  const confettiPieces = [];
  let confettiActive = false;

  function spawnConfetti(origin) {
    confettiActive = true;
    const colors = [0xff2233, 0x2266ff, 0x22cc44, 0xffcc00, 0xff44aa, 0x9944ff, 0x00cccc, 0xffffff];
    for (let i = 0; i < 120; i++) {
      const geo = new THREE.PlaneGeometry(0.25 + Math.random() * 0.3, 0.25 + Math.random() * 0.3);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        origin.x + (Math.random() - 0.5) * 10,
        origin.y + 4 + Math.random() * 8,
        origin.z + (Math.random() - 0.5) * 10
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(mesh);
      confettiPieces.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 3, (Math.random() - 0.5) * 8),
        rotVel: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5),
        life: 3 + Math.random() * 2,
      });
    }
  }

  function updateConfetti(dt) {
    if (!confettiActive) return;
    for (let i = confettiPieces.length - 1; i >= 0; i--) {
      const c = confettiPieces[i];
      c.life -= dt;
      if (c.life <= 0) {
        scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        c.mesh.material.dispose();
        confettiPieces.splice(i, 1);
        continue;
      }
      c.vel.y -= 6 * dt;
      c.vel.x *= 0.99;
      c.vel.z *= 0.99;
      c.mesh.position.add(c.vel.clone().multiplyScalar(dt));
      c.mesh.rotation.x += c.rotVel.x * dt;
      c.mesh.rotation.y += c.rotVel.y * dt;
      c.mesh.rotation.z += c.rotVel.z * dt;
      if (c.life < 1) c.mesh.material.opacity = c.life;
    }
    if (confettiPieces.length === 0) confettiActive = false;
  }

  // ───────── Rotating Obstacles ─────────
  const spinners = [];

  function addSpinner(x, y, z, armLength, speed) {
    const armGeo = new THREE.BoxGeometry(armLength * 2, 0.6, 0.6);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.3, metalness: 0.5, emissive: 0xff4400, emissiveIntensity: 0.1 });
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.set(x, y + 0.5, z);
    armMesh.castShadow = true;
    scene.add(armMesh);

    const postGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, y + 0.3, z);
    scene.add(post);

    const armBody = new CANNON.Body({ mass: 0, material: matTrack, type: CANNON.Body.KINEMATIC });
    armBody.addShape(new CANNON.Box(new CANNON.Vec3(armLength, 0.3, 0.3)));
    armBody.position.set(x, y + 0.5, z);
    world.addBody(armBody);

    spinners.push({ mesh: armMesh, body: armBody, x, y: y + 0.5, z, speed, angle: Math.random() * Math.PI * 2 });
  }

  function updateSpinners(dt) {
    spinners.forEach((s) => {
      s.angle += s.speed * dt;
      s.mesh.rotation.y = s.angle;
      s.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), s.angle);
    });
  }

  // ───────── Audio ─────────
  let audioCtx = null;
  let rollingNoise = null;
  let rollingGain = null;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function beep(freq, dur, vol) {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (_) {}
  }

  function startRollingSound() {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();
      if (rollingNoise) return;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      rollingNoise = ctx.createBufferSource();
      rollingNoise.buffer = buffer;
      rollingNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 200;
      filter.Q.value = 0.8;

      rollingGain = ctx.createGain();
      rollingGain.gain.value = 0;

      rollingNoise.connect(filter);
      filter.connect(rollingGain);
      rollingGain.connect(ctx.destination);
      rollingNoise.start();
    } catch (_) {}
  }

  function updateRollingSound() {
    if (!rollingGain || state.selectedIdx < 0) return;
    try {
      const sel = state.marbles[state.selectedIdx];
      const v = sel.body.velocity;
      const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      const targetVol = Math.min(speed / 40, 0.08);
      rollingGain.gain.value += (targetVol - rollingGain.gain.value) * 0.1;
    } catch (_) {}
  }

  function stopRollingSound() {
    try {
      if (rollingNoise) {
        rollingNoise.stop();
        rollingNoise = null;
        rollingGain = null;
      }
    } catch (_) {}
  }

  // ───────── Particle System ─────────
  const MAX_PARTICLES = 200;
  const particlePositions = new Float32Array(MAX_PARTICLES * 3);
  const particleColors = new Float32Array(MAX_PARTICLES * 3);
  const particleVelocities = [];
  const particleLifetimes = [];
  let particleCount = 0;

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
  const particleMat = new THREE.PointsMaterial({ size: 0.25, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true });
  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  for (let i = 0; i < MAX_PARTICLES; i++) {
    particleVelocities.push(new THREE.Vector3());
    particleLifetimes.push(0);
  }

  function emitParticles(pos, color, count) {
    for (let i = 0; i < count && particleCount < MAX_PARTICLES; i++) {
      const idx = particleCount;
      particlePositions[idx * 3] = pos.x + (Math.random() - 0.5) * 0.5;
      particlePositions[idx * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.5;
      particlePositions[idx * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.5;
      particleColors[idx * 3] = ((color >> 16) & 0xff) / 255;
      particleColors[idx * 3 + 1] = ((color >> 8) & 0xff) / 255;
      particleColors[idx * 3 + 2] = (color & 0xff) / 255;
      particleVelocities[idx].set((Math.random() - 0.5) * 4, Math.random() * 5 + 2, (Math.random() - 0.5) * 4);
      particleLifetimes[idx] = 1 + Math.random() * 0.5;
      particleCount++;
    }
  }

  function updateParticles(dt) {
    for (let i = particleCount - 1; i >= 0; i--) {
      particleLifetimes[i] -= dt;
      if (particleLifetimes[i] <= 0) {
        particleCount--;
        if (i < particleCount) {
          particlePositions[i * 3] = particlePositions[particleCount * 3];
          particlePositions[i * 3 + 1] = particlePositions[particleCount * 3 + 1];
          particlePositions[i * 3 + 2] = particlePositions[particleCount * 3 + 2];
          particleColors[i * 3] = particleColors[particleCount * 3];
          particleColors[i * 3 + 1] = particleColors[particleCount * 3 + 1];
          particleColors[i * 3 + 2] = particleColors[particleCount * 3 + 2];
          particleVelocities[i].copy(particleVelocities[particleCount]);
          particleLifetimes[i] = particleLifetimes[particleCount];
        }
        continue;
      }
      particleVelocities[i].y -= 9.8 * dt;
      particlePositions[i * 3] += particleVelocities[i].x * dt;
      particlePositions[i * 3 + 1] += particleVelocities[i].y * dt;
      particlePositions[i * 3 + 2] += particleVelocities[i].z * dt;
    }
    particleGeo.attributes.position.needsUpdate = true;
    particleGeo.attributes.color.needsUpdate = true;
    particleGeo.setDrawRange(0, particleCount);
  }

  // ───────── Game Logic ─────────
  function startRace() {
    menuScreen.classList.add("hidden");
    hudEl.classList.remove("hidden");
    countdownEl.classList.remove("hidden");
    yourPosEl.classList.add("hidden");
    sectionNameEl.classList.add("hidden");
    state.phase = "countdown";
    state.cdValue = 3;
    state.cdTimer = 0;
    state.raceTime = 0;
    state.finishOrder = [];
    particleCount = 0;

    // Recreate start gate if needed
    if (!startGateBody) {
      const sw = trackWP[0];
      startGateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(sw.w + 1, 4, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5, metalness: 0.3 })
      );
      startGateMesh.position.set(sw.x, sw.y + 2, sw.z + 9.5);
      startGateMesh.castShadow = true;
      scene.add(startGateMesh);

      startGateBody = new CANNON.Body({ mass: 0, material: matTrack });
      startGateBody.addShape(new CANNON.Box(new CANNON.Vec3((sw.w + 1) / 2, 2, 0.25)));
      startGateBody.position.set(sw.x, sw.y + 2, sw.z + 9.5);
      world.addBody(startGateBody);
    }

    resetMarbles();
    countdownEl.textContent = "3";
    countdownEl.className = "countdown";
    beep(440, 0.15, 0.15);
  }

  function handleCountdown(dt) {
    state.cdTimer += dt;
    updateSpinners(dt);
    // Step physics during countdown so marbles settle
    world.step(PHYSICS_DT, dt, MAX_SUBSTEPS);
    syncMeshes();

    if (state.cdTimer >= 1) {
      state.cdTimer = 0;
      state.cdValue--;
      if (state.cdValue > 0) {
        countdownEl.textContent = String(state.cdValue);
        countdownEl.style.animation = "none";
        void countdownEl.offsetHeight;
        countdownEl.style.animation = "";
        beep(440, 0.15, 0.15);
      } else if (state.cdValue === 0) {
        countdownEl.textContent = "BAŞLA!";
        countdownEl.className = "countdown go";
        beep(880, 0.4, 0.25);
      } else {
        countdownEl.classList.add("hidden");
        state.phase = "racing";
        removeStartGate();
        startRollingSound();
        state.marbles.forEach((m) => {
          m.body.velocity.set((Math.random() - 0.5) * 0.8, 0, 1.5 + Math.random() * 0.5);
        });
      }
    }
  }

  function handleRacing(dt) {
    state.raceTime += dt;
    rotateCameraAngle(dt);

    updateSpinners(dt);

    // Boost zones & random perturbations
    state.marbles.forEach((m) => {
      if (m.finished) return;
      const pz = m.body.position.z;
      // Boost zones at z=50, z=238, z=345
      if ((pz > 47 && pz < 53) || (pz > 235 && pz < 241) || (pz > 342 && pz < 348)) {
        m.body.applyForce(new CANNON.Vec3(0, 0, 8), m.body.position);
      }
      if (Math.random() < 0.015) {
        const fx = (Math.random() - 0.5) * 1.2;
        const fz = (Math.random() - 0.5) * 0.6;
        m.body.applyForce(new CANNON.Vec3(fx, 0, fz), m.body.position);
      }
    });

    world.step(PHYSICS_DT, dt, MAX_SUBSTEPS);
    syncMeshes();

    // Update progress & check finish
    state.marbles.forEach((m) => {
      if (!m.finished) {
        m.progress = computeProgress(m);
        if (isAtFinish(m)) {
          m.finished = true;
          m.finishTime = state.raceTime;
          state.finishOrder.push(m);
          emitParticles(m.mesh.position, m.def.color, 15);
          if (state.marbles.indexOf(m) === state.selectedIdx) {
            beep(660, 0.3, 0.2);
          }
        }
      }
      // Respawn fallen marbles
      if (m.body.position.y < -25) {
        const wpIdx = Math.min(findNearestWP(m) + 1, trackWP.length - 1);
        const wp = trackWP[wpIdx];
        m.body.position.set(wp.x, wp.y + 3, wp.z);
        m.body.velocity.set(0, 0, 2);
        m.body.angularVelocity.set(0, 0, 0);
      }
    });

    updateLeaderboard();
    updateSectionDisplay();

    // Speed display
    if (state.selectedIdx >= 0) {
      const sel = state.marbles[state.selectedIdx];
      const v = sel.body.velocity;
      const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) * 3.6;
      speedValEl.textContent = Math.round(speed);
    }
    timeValEl.textContent = state.raceTime.toFixed(1);
    updateRollingSound();

    updateParticles(dt);
    updateConfetti(dt);

    // Spawn confetti when first marble finishes
    if (state.finishOrder.length === 1 && !confettiActive) {
      const fw = trackWP[trackWP.length - 1];
      spawnConfetti(new THREE.Vector3(fw.x, fw.y, fw.z - 3));
    }

    // Check race end
    if (state.finishOrder.length >= MARBLE_DEFS.length) {
      state.phase = "finished";
      stopRollingSound();
      setTimeout(showResults, 1200);
    }
    if (state.raceTime > FINISH_TIMEOUT) {
      state.marbles.forEach((m) => {
        if (!m.finished) {
          m.finished = true;
          m.finishTime = state.raceTime;
          state.finishOrder.push(m);
        }
      });
      state.phase = "finished";
      stopRollingSound();
      setTimeout(showResults, 800);
    }
  }

  function syncMeshes() {
    state.marbles.forEach((m) => {
      m.mesh.position.set(m.body.position.x, m.body.position.y, m.body.position.z);
      m.mesh.quaternion.set(m.body.quaternion.x, m.body.quaternion.y, m.body.quaternion.z, m.body.quaternion.w);
      if (state.phase === "racing" || state.phase === "finished") {
        updateTrail(m.trail, m.mesh.position);
      }
    });
  }

  function newRace() {
    resultsScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
    sectionNameEl.classList.add("hidden");
    state.phase = "menu";
    state.selectedIdx = -1;
    stopRollingSound();
    startBtnEl.disabled = true;
    document.querySelectorAll(".marble-card").forEach((c) => c.classList.remove("selected"));
    resetMarbles();
  }

  // ───────── Main Loop ─────────
  let prevTime = performance.now();

  function loop() {
    requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min((now - prevTime) / 1000, 0.05);
    prevTime = now;

    switch (state.phase) {
      case "menu":
        break;
      case "countdown":
        handleCountdown(dt);
        break;
      case "racing":
        handleRacing(dt);
        break;
      case "finished":
        world.step(PHYSICS_DT, dt, MAX_SUBSTEPS);
        syncMeshes();
        updateParticles(dt);
        updateConfetti(dt);
        updateSpinners(dt);
        break;
    }

    updateCamera();
    renderer.render(scene, camera);
  }

  // ───────── Events ─────────
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  startBtnEl.addEventListener("click", startRace);
  replayBtnEl.addEventListener("click", newRace);

  // ───────── Init ─────────
  buildTrack();
  addDecorations();
  generateEnvMap();
  createMarbles();
  populateMarbleGrid();
  loop();
})();
