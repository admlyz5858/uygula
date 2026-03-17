import * as THREE from 'three';

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
    trackWidth: 14,
    laneSpacing: 1.5,
    groundHeight: 0.4,
    baseSpeed: 7,
    gravity: -25,
    racerScale: 1,
    cameraHeight: 6,
    cameraDistance: 18,
    cameraSide: 8,
    obstacleBaseTime: 1.2,
    stumbleChance: 0.12,
    stumblePenalty: 0.8,
    finishDelay: 3000,
    countdownTime: 3,
    maxRacers: 12,
    defaultRacerCount: 8,
    speedVariation: 0.15,
    shadowMapSize: 1024,
};

// ============================================================
// COURSE DEFINITIONS
// ============================================================
const COURSES = [
    {
        id: 'city',
        name: 'Şehir Parkuru',
        description: 'Çatılardan çatılara koş! Duvarlar, boşluklar ve denge kirişleri.',
        difficulty: 2,
        length: 'Orta',
        theme: { ground: 0x808080, accent: 0xFF6B35, sky1: '#4a90d9', sky2: '#87CEEB', fog: 0x87CEEB, ambient: 0x8888cc },
        segments: [
            { type: 'flat', length: 25 },
            { type: 'wall', height: 3.5 },
            { type: 'flat', length: 18 },
            { type: 'gap', width: 4 },
            { type: 'flat', length: 15 },
            { type: 'beam', length: 8 },
            { type: 'flat', length: 18 },
            { type: 'wall', height: 2.5 },
            { type: 'flat', length: 12 },
            { type: 'gap', width: 5 },
            { type: 'flat', length: 20 },
            { type: 'trampoline' },
            { type: 'flat', length: 15 },
            { type: 'wall', height: 4 },
            { type: 'flat', length: 18 },
            { type: 'gap', width: 3.5 },
            { type: 'flat', length: 25 },
        ]
    },
    {
        id: 'forest',
        name: 'Orman Macerası',
        description: 'Ağaçlar arasında parkur! Kütükler, trambolinler ve engeller.',
        difficulty: 3,
        length: 'Uzun',
        theme: { ground: 0x5a8a3c, accent: 0x8B4513, sky1: '#2d5a1e', sky2: '#87ab69', fog: 0x87ab69, ambient: 0x88aa88 },
        segments: [
            { type: 'flat', length: 20 },
            { type: 'beam', length: 10 },
            { type: 'flat', length: 15 },
            { type: 'wall', height: 3 },
            { type: 'flat', length: 12 },
            { type: 'gap', width: 4.5 },
            { type: 'flat', length: 15 },
            { type: 'trampoline' },
            { type: 'flat', length: 10 },
            { type: 'wall', height: 3.5 },
            { type: 'flat', length: 18 },
            { type: 'gap', width: 5.5 },
            { type: 'flat', length: 12 },
            { type: 'beam', length: 12 },
            { type: 'flat', length: 15 },
            { type: 'wall', height: 4 },
            { type: 'flat', length: 10 },
            { type: 'trampoline' },
            { type: 'flat', length: 20 },
        ]
    },
    {
        id: 'factory',
        name: 'Fabrika Kaçışı',
        description: 'Endüstriyel engelleri aş! Trambolinler ve yüksek duvarlar.',
        difficulty: 4,
        length: 'Uzun',
        theme: { ground: 0x666666, accent: 0xFFAA00, sky1: '#333333', sky2: '#665544', fog: 0x665544, ambient: 0xaa8866 },
        segments: [
            { type: 'flat', length: 20 },
            { type: 'wall', height: 4.5 },
            { type: 'flat', length: 10 },
            { type: 'trampoline' },
            { type: 'flat', length: 12 },
            { type: 'gap', width: 6 },
            { type: 'flat', length: 10 },
            { type: 'wall', height: 3 },
            { type: 'flat', length: 8 },
            { type: 'wall', height: 5 },
            { type: 'flat', length: 15 },
            { type: 'beam', length: 10 },
            { type: 'flat', length: 12 },
            { type: 'gap', width: 5 },
            { type: 'flat', length: 10 },
            { type: 'trampoline' },
            { type: 'flat', length: 8 },
            { type: 'wall', height: 3.5 },
            { type: 'flat', length: 25 },
        ]
    },
    {
        id: 'mega',
        name: 'Mega Parkur',
        description: 'En zorlu parkur! Tüm engel türleri, maksimum zorluk.',
        difficulty: 5,
        length: 'Çok Uzun',
        theme: { ground: 0x554466, accent: 0xFF00FF, sky1: '#1a0a2e', sky2: '#4a2080', fog: 0x4a2080, ambient: 0xaa66cc },
        segments: [
            { type: 'flat', length: 20 },
            { type: 'wall', height: 3 },
            { type: 'flat', length: 10 },
            { type: 'gap', width: 4 },
            { type: 'flat', length: 10 },
            { type: 'beam', length: 8 },
            { type: 'flat', length: 12 },
            { type: 'trampoline' },
            { type: 'flat', length: 10 },
            { type: 'wall', height: 5 },
            { type: 'flat', length: 8 },
            { type: 'gap', width: 6 },
            { type: 'flat', length: 10 },
            { type: 'wall', height: 4 },
            { type: 'flat', length: 10 },
            { type: 'beam', length: 14 },
            { type: 'flat', length: 10 },
            { type: 'trampoline' },
            { type: 'flat', length: 8 },
            { type: 'gap', width: 5 },
            { type: 'flat', length: 10 },
            { type: 'wall', height: 3.5 },
            { type: 'flat', length: 8 },
            { type: 'trampoline' },
            { type: 'flat', length: 25 },
        ]
    },
    {
        id: 'speed',
        name: 'Hız Testi',
        description: 'Kısa ama yoğun! Hız her şeydir.',
        difficulty: 3,
        length: 'Kısa',
        theme: { ground: 0x2244aa, accent: 0x00FFFF, sky1: '#001133', sky2: '#003366', fog: 0x003366, ambient: 0x6688cc },
        segments: [
            { type: 'flat', length: 15 },
            { type: 'gap', width: 3 },
            { type: 'flat', length: 8 },
            { type: 'wall', height: 2.5 },
            { type: 'flat', length: 8 },
            { type: 'trampoline' },
            { type: 'flat', length: 8 },
            { type: 'gap', width: 4 },
            { type: 'flat', length: 8 },
            { type: 'beam', length: 6 },
            { type: 'flat', length: 8 },
            { type: 'wall', height: 3 },
            { type: 'flat', length: 20 },
        ]
    },
];

// ============================================================
// RACER DATABASE
// ============================================================
const RACER_DB = [
    { name: 'Hızlı Hasan', color: 0xFF4444, speed: 1.2, agility: 0.9, stamina: 0.85, luck: 0.9 },
    { name: 'Çevik Cem', color: 0x44FF44, speed: 0.95, agility: 1.25, stamina: 0.9, luck: 0.95 },
    { name: 'Güçlü Gökhan', color: 0x4444FF, speed: 0.85, agility: 0.9, stamina: 1.25, luck: 0.9 },
    { name: 'Şanslı Şerif', color: 0xFFFF44, speed: 0.95, agility: 0.95, stamina: 0.9, luck: 1.25 },
    { name: 'Yıldırım Yusuf', color: 0xFF8800, speed: 1.3, agility: 1.0, stamina: 0.7, luck: 0.85 },
    { name: 'Kaya Kemal', color: 0x888888, speed: 0.8, agility: 0.85, stamina: 1.3, luck: 0.95 },
    { name: 'Rüzgar Rıza', color: 0x00CCCC, speed: 1.05, agility: 1.05, stamina: 1.0, luck: 1.0 },
    { name: 'Aslan Ali', color: 0xCC8800, speed: 1.1, agility: 1.05, stamina: 1.05, luck: 0.95 },
    { name: 'Kaplan Kaan', color: 0xFF6600, speed: 1.0, agility: 1.2, stamina: 0.9, luck: 0.9 },
    { name: 'Pars Pelin', color: 0xFF44FF, speed: 0.95, agility: 1.3, stamina: 0.85, luck: 0.9 },
    { name: 'Kartal Koray', color: 0x6644FF, speed: 1.15, agility: 0.95, stamina: 0.9, luck: 1.1 },
    { name: 'Tilki Tarık', color: 0xFF8844, speed: 0.95, agility: 1.0, stamina: 0.8, luck: 1.3 },
    { name: 'Kurt Kerem', color: 0x666699, speed: 1.05, agility: 1.0, stamina: 1.05, luck: 1.0 },
    { name: 'Çita Çağrı', color: 0xFFCC00, speed: 1.35, agility: 1.05, stamina: 0.65, luck: 0.8 },
    { name: 'Ayı Ahmet', color: 0x884422, speed: 0.75, agility: 0.8, stamina: 1.35, luck: 1.0 },
    { name: 'Tavşan Tuna', color: 0xFFAACC, speed: 1.2, agility: 0.85, stamina: 0.9, luck: 1.0 },
    { name: 'Maymun Mert', color: 0x88CC44, speed: 0.85, agility: 1.35, stamina: 0.85, luck: 0.95 },
    { name: 'Pantera Pınar', color: 0x222222, speed: 1.1, agility: 1.1, stamina: 1.05, luck: 1.0 },
    { name: 'Şahin Selim', color: 0x4488FF, speed: 1.2, agility: 1.15, stamina: 0.8, luck: 0.85 },
    { name: 'Jaguar Jas', color: 0x44CC88, speed: 1.1, agility: 1.1, stamina: 1.0, luck: 1.05 },
    { name: 'Bora Barış', color: 0xAA44FF, speed: 1.15, agility: 0.95, stamina: 1.1, luck: 0.9 },
    { name: 'Fırtına Fatih', color: 0x00AAFF, speed: 1.25, agility: 1.0, stamina: 0.85, luck: 0.85 },
    { name: 'Ejder Emre', color: 0xFF0066, speed: 1.0, agility: 1.15, stamina: 1.0, luck: 1.05 },
    { name: 'Geyik Gizem', color: 0xAAFF44, speed: 1.1, agility: 1.2, stamina: 0.85, luck: 0.9 },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function randRange(min, max) { return min + Math.random() * (max - min); }
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}
function colorToCSS(hex) {
    return '#' + hex.toString(16).padStart(6, '0');
}

// ============================================================
// STICKMAN MODEL BUILDER
// ============================================================
class StickmanModel {
    constructor(color) {
        this.group = new THREE.Group();
        this.color = color;
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });

        // Head
        const headGeo = new THREE.SphereGeometry(0.28, 12, 12);
        this.head = new THREE.Mesh(headGeo, mat);
        this.head.position.y = 1.75;
        this.head.castShadow = true;
        this.group.add(this.head);

        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8);
        this.torso = new THREE.Mesh(torsoGeo, mat);
        this.torso.position.y = 1.2;
        this.torso.castShadow = true;
        this.group.add(this.torso);

        // Left arm pivot
        this.leftArmPivot = new THREE.Group();
        this.leftArmPivot.position.set(-0.3, 1.5, 0);
        const lArmGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 6);
        lArmGeo.translate(0, -0.25, 0);
        this.leftArm = new THREE.Mesh(lArmGeo, mat);
        this.leftArm.castShadow = true;
        this.leftArmPivot.add(this.leftArm);
        this.group.add(this.leftArmPivot);

        // Right arm pivot
        this.rightArmPivot = new THREE.Group();
        this.rightArmPivot.position.set(0.3, 1.5, 0);
        const rArmGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 6);
        rArmGeo.translate(0, -0.25, 0);
        this.rightArm = new THREE.Mesh(rArmGeo, mat);
        this.rightArm.castShadow = true;
        this.rightArmPivot.add(this.rightArm);
        this.group.add(this.rightArmPivot);

        // Left leg pivot
        this.leftLegPivot = new THREE.Group();
        this.leftLegPivot.position.set(-0.12, 0.85, 0);
        const lLegGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.6, 6);
        lLegGeo.translate(0, -0.3, 0);
        this.leftLeg = new THREE.Mesh(lLegGeo, darkMat);
        this.leftLeg.castShadow = true;
        this.leftLegPivot.add(this.leftLeg);
        this.group.add(this.leftLegPivot);

        // Right leg pivot
        this.rightLegPivot = new THREE.Group();
        this.rightLegPivot.position.set(0.12, 0.85, 0);
        const rLegGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.6, 6);
        rLegGeo.translate(0, -0.3, 0);
        this.rightLeg = new THREE.Mesh(rLegGeo, darkMat);
        this.rightLeg.castShadow = true;
        this.rightLegPivot.add(this.rightLeg);
        this.group.add(this.rightLegPivot);

        // Shoes (small spheres at leg bottoms)
        const shoeGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        this.leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
        this.leftShoe.position.y = -0.6;
        this.leftLegPivot.add(this.leftShoe);
        this.rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
        this.rightShoe.position.y = -0.6;
        this.rightLegPivot.add(this.rightShoe);

        // Name sprite
        this.nameSprite = null;
    }

    setNameLabel(name) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.roundRect(0, 8, 256, 48, 8);
        ctx.fill();

        ctx.font = 'bold 24px "Exo 2", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, 128, 32);

        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        this.nameSprite = new THREE.Sprite(spriteMat);
        this.nameSprite.scale.set(2.5, 0.625, 1);
        this.nameSprite.position.y = 2.3;
        this.group.add(this.nameSprite);
    }

    animateRunning(time, speedFactor) {
        const freq = speedFactor * 10;
        const legAmp = 0.7;
        const armAmp = 0.5;

        this.leftLegPivot.rotation.x = Math.sin(time * freq) * legAmp;
        this.rightLegPivot.rotation.x = Math.sin(time * freq + Math.PI) * legAmp;
        this.leftArmPivot.rotation.x = Math.sin(time * freq + Math.PI) * armAmp;
        this.rightArmPivot.rotation.x = Math.sin(time * freq) * armAmp;
        this.torso.rotation.z = Math.sin(time * freq * 2) * 0.03;
        this.head.position.y = 1.75 + Math.abs(Math.sin(time * freq)) * 0.04;
    }

    animateClimbing(progress) {
        const p = clamp(progress, 0, 1);
        this.leftArmPivot.rotation.x = -2.0 + Math.sin(p * Math.PI * 4) * 0.5;
        this.rightArmPivot.rotation.x = -2.0 + Math.sin(p * Math.PI * 4 + Math.PI) * 0.5;
        this.leftLegPivot.rotation.x = Math.sin(p * Math.PI * 4 + Math.PI) * 0.6;
        this.rightLegPivot.rotation.x = Math.sin(p * Math.PI * 4) * 0.6;
    }

    animateJumping(progress) {
        const p = clamp(progress, 0, 1);
        this.leftArmPivot.rotation.x = -1.5;
        this.rightArmPivot.rotation.x = -1.5;
        this.leftLegPivot.rotation.x = -0.3;
        this.rightLegPivot.rotation.x = -0.3;
        this.group.children.forEach(c => { if (c !== this.nameSprite) c.rotation.z = 0; });
    }

    animateBalance(time, speedFactor) {
        const freq = speedFactor * 5;
        this.leftArmPivot.rotation.x = 0;
        this.rightArmPivot.rotation.x = 0;
        this.leftArmPivot.rotation.z = -1.2 + Math.sin(time * freq * 2) * 0.4;
        this.rightArmPivot.rotation.z = 1.2 + Math.sin(time * freq * 2 + Math.PI) * 0.4;
        this.leftLegPivot.rotation.x = Math.sin(time * freq) * 0.3;
        this.rightLegPivot.rotation.x = Math.sin(time * freq + Math.PI) * 0.3;
        this.torso.rotation.z = Math.sin(time * freq * 1.5) * 0.08;
    }

    animateBounce(progress) {
        const p = clamp(progress, 0, 1);
        this.leftArmPivot.rotation.x = -2.5;
        this.rightArmPivot.rotation.x = -2.5;
        this.leftArmPivot.rotation.z = 0;
        this.rightArmPivot.rotation.z = 0;
        this.leftLegPivot.rotation.x = 0.4;
        this.rightLegPivot.rotation.x = 0.4;
    }

    animateStumble(progress) {
        const p = clamp(progress, 0, 1);
        this.torso.rotation.x = Math.sin(p * Math.PI) * 0.8;
        this.leftArmPivot.rotation.x = Math.sin(p * Math.PI) * 1.5;
        this.rightArmPivot.rotation.x = Math.sin(p * Math.PI + 0.5) * 1.5;
        this.leftLegPivot.rotation.x = -0.3;
        this.rightLegPivot.rotation.x = 0.2;
    }

    resetPose() {
        this.leftArmPivot.rotation.set(0, 0, 0);
        this.rightArmPivot.rotation.set(0, 0, 0);
        this.leftLegPivot.rotation.set(0, 0, 0);
        this.rightLegPivot.rotation.set(0, 0, 0);
        this.torso.rotation.set(0, 0, 0);
        this.head.position.y = 1.75;
    }

    animateVictory(time) {
        this.leftArmPivot.rotation.x = -2.8;
        this.rightArmPivot.rotation.x = -2.8;
        this.leftArmPivot.rotation.z = -0.3;
        this.rightArmPivot.rotation.z = 0.3;
        this.group.position.y = Math.abs(Math.sin(time * 5)) * 0.3;
    }
}

// ============================================================
// RACER CLASS
// ============================================================
class Racer {
    constructor(data, laneIndex, totalLanes) {
        this.name = data.name;
        this.baseColor = data.color;
        this.speed = data.speed;
        this.agility = data.agility;
        this.stamina = data.stamina;
        this.luck = data.luck;

        this.model = new StickmanModel(data.color);
        this.model.setNameLabel(data.name);

        const laneWidth = CONFIG.trackWidth / (totalLanes + 1);
        this.laneX = (laneIndex + 1) * laneWidth - CONFIG.trackWidth / 2;
        this.model.group.position.x = this.laneX;

        this.progress = 0;
        this.verticalPos = 0;
        this.verticalVel = 0;
        this.state = 'idle';
        this.obstacleTimer = 0;
        this.obstacleDuration = 0;
        this.currentObstacle = null;
        this.finishTime = null;
        this.finished = false;
        this.position = 0;
        this.stumbleTimer = 0;
        this.staminaFactor = 1.0;
        this.currentSpeedVariation = 0;
        this.speedChangeTimer = 0;
        this.obstacleStartZ = 0;
        this.obstacleEndZ = 0;
    }

    getEffectiveSpeed() {
        return CONFIG.baseSpeed * this.speed * this.staminaFactor * (1 + this.currentSpeedVariation);
    }

    update(dt, time, obstacles, courseLength, raceTime) {
        if (this.finished) {
            this.model.animateVictory(time);
            return;
        }

        if (this.state === 'idle') return;

        this.speedChangeTimer -= dt;
        if (this.speedChangeTimer <= 0) {
            this.currentSpeedVariation = randRange(-CONFIG.speedVariation, CONFIG.speedVariation);
            this.speedChangeTimer = randRange(0.5, 2.0);
        }

        this.staminaFactor = lerp(1.0, this.stamina, clamp(raceTime / 60, 0, 1));

        if (this.state === 'stumble') {
            this.stumbleTimer -= dt;
            const stumbleProgress = 1 - (this.stumbleTimer / CONFIG.stumblePenalty);
            this.model.animateStumble(stumbleProgress);
            if (this.stumbleTimer <= 0) {
                this.state = 'running';
                this.model.resetPose();
            }
            this.updatePosition();
            return;
        }

        if (this.state === 'obstacle') {
            this.obstacleTimer += dt;
            const p = clamp(this.obstacleTimer / this.obstacleDuration, 0, 1);

            if (this.currentObstacle) {
                const obs = this.currentObstacle;
                switch (obs.type) {
                    case 'wall':
                        this.model.animateClimbing(p);
                        this.progress = lerp(this.obstacleStartZ, this.obstacleEndZ, p);
                        this.verticalPos = Math.sin(p * Math.PI) * obs.height;
                        break;
                    case 'gap':
                        this.model.animateJumping(p);
                        this.progress = lerp(this.obstacleStartZ, this.obstacleEndZ, p);
                        this.verticalPos = Math.sin(p * Math.PI) * 3;
                        break;
                    case 'beam':
                        this.model.animateBalance(time, this.agility);
                        this.progress = lerp(this.obstacleStartZ, this.obstacleEndZ, p);
                        this.verticalPos = 0.6;
                        this.model.group.position.x = this.laneX + Math.sin(time * 3) * 0.1;
                        break;
                    case 'trampoline':
                        this.model.animateBounce(p);
                        this.progress = lerp(this.obstacleStartZ, this.obstacleEndZ, p);
                        this.verticalPos = Math.sin(p * Math.PI) * 5;
                        break;
                }
            }

            if (p >= 1) {
                this.state = 'running';
                this.verticalPos = 0;
                this.currentObstacle = null;
                this.model.resetPose();
                this.model.group.position.x = this.laneX;
            }
            this.updatePosition();
            return;
        }

        // Running state
        const effSpeed = this.getEffectiveSpeed();
        this.progress += effSpeed * dt;
        this.model.animateRunning(time, effSpeed / CONFIG.baseSpeed);

        // Check for obstacles
        for (const obs of obstacles) {
            if (!obs.passed || !obs.passed.has(this)) {
                if (this.progress >= obs.zStart && this.progress < obs.zStart + 0.5) {
                    if (!obs.passed) obs.passed = new Set();
                    obs.passed.add(this);
                    this.startObstacle(obs);
                    break;
                }
            }
        }

        if (this.progress >= courseLength && !this.finished) {
            this.finished = true;
            this.finishTime = raceTime;
            this.progress = courseLength;
        }

        this.updatePosition();
    }

    startObstacle(obs) {
        this.state = 'obstacle';
        this.obstacleTimer = 0;
        this.currentObstacle = obs;
        this.obstacleStartZ = obs.zStart;

        const agilityFactor = 2 - this.agility;
        const randomFactor = 0.85 + Math.random() * 0.3;
        let baseDuration;

        switch (obs.type) {
            case 'wall':
                baseDuration = 1.0 + obs.height * 0.35;
                this.obstacleEndZ = obs.zEnd;
                break;
            case 'gap':
                baseDuration = 0.6 + obs.width * 0.08;
                this.obstacleEndZ = obs.zEnd;
                break;
            case 'beam':
                baseDuration = obs.length * 0.18;
                this.obstacleEndZ = obs.zEnd;
                break;
            case 'trampoline':
                baseDuration = 0.8;
                this.obstacleEndZ = obs.zEnd + 3;
                break;
            default:
                baseDuration = 1.0;
                this.obstacleEndZ = obs.zEnd;
        }

        this.obstacleDuration = baseDuration * agilityFactor * randomFactor;

        // Stumble check
        if (Math.random() > this.luck * 0.85) {
            this.obstacleDuration *= 1.4;
        }

        // Chance of major stumble after obstacle
        if (Math.random() < CONFIG.stumbleChance * (2 - this.luck)) {
            this.obstacleDuration += CONFIG.stumblePenalty * 0.5;
        }
    }

    updatePosition() {
        this.model.group.position.z = this.progress;
        this.model.group.position.y = this.verticalPos;
    }

    startRunning() {
        this.state = 'running';
    }

    reset() {
        this.progress = 0;
        this.verticalPos = 0;
        this.verticalVel = 0;
        this.state = 'idle';
        this.obstacleTimer = 0;
        this.currentObstacle = null;
        this.finishTime = null;
        this.finished = false;
        this.position = 0;
        this.stumbleTimer = 0;
        this.staminaFactor = 1.0;
        this.model.resetPose();
        this.model.group.position.set(this.laneX, 0, 0);
    }
}

// ============================================================
// COURSE BUILDER
// ============================================================
class CourseBuilder {
    constructor(scene) {
        this.scene = scene;
        this.meshes = [];
        this.obstacles = [];
        this.courseLength = 0;
        this.courseGroup = new THREE.Group();
        scene.add(this.courseGroup);
    }

    clear() {
        this.courseGroup.clear();
        this.meshes = [];
        this.obstacles = [];
        this.courseLength = 0;
    }

    build(courseDef) {
        this.clear();
        const theme = courseDef.theme;
        let z = 0;

        // Start line
        this.addStartLine(z);

        for (const seg of courseDef.segments) {
            switch (seg.type) {
                case 'flat':
                    this.addFlat(z, seg.length, theme);
                    z += seg.length;
                    break;
                case 'wall':
                    this.addWall(z, seg.height, theme);
                    const wallLen = 2;
                    this.obstacles.push({
                        type: 'wall',
                        zStart: z,
                        zEnd: z + wallLen,
                        height: seg.height,
                        passed: new Set()
                    });
                    z += wallLen;
                    break;
                case 'gap':
                    this.addGap(z, seg.width, theme);
                    this.obstacles.push({
                        type: 'gap',
                        zStart: z,
                        zEnd: z + seg.width,
                        width: seg.width,
                        passed: new Set()
                    });
                    z += seg.width;
                    break;
                case 'beam':
                    this.addBeam(z, seg.length, theme);
                    this.obstacles.push({
                        type: 'beam',
                        zStart: z,
                        zEnd: z + seg.length,
                        length: seg.length,
                        passed: new Set()
                    });
                    z += seg.length;
                    break;
                case 'trampoline':
                    this.addTrampoline(z, theme);
                    const tramLen = 2;
                    this.obstacles.push({
                        type: 'trampoline',
                        zStart: z,
                        zEnd: z + tramLen,
                        passed: new Set()
                    });
                    z += tramLen;
                    break;
            }
        }

        // Finish line
        this.addFinishLine(z);
        this.courseLength = z;

        // Side rails / decorations
        this.addSideDecorations(theme);

        return { obstacles: this.obstacles, courseLength: this.courseLength };
    }

    addFlat(z, length, theme) {
        const geo = new THREE.BoxGeometry(CONFIG.trackWidth, CONFIG.groundHeight, length);
        const mat = new THREE.MeshStandardMaterial({
            color: theme.ground,
            roughness: 0.8,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, -CONFIG.groundHeight / 2, z + length / 2);
        mesh.receiveShadow = true;
        this.courseGroup.add(mesh);

        // Lane markings
        for (let i = 1; i < 8; i++) {
            const lx = (i / 8) * CONFIG.trackWidth - CONFIG.trackWidth / 2;
            const lineGeo = new THREE.BoxGeometry(0.05, 0.01, length);
            const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.position.set(lx, 0.01, z + length / 2);
            this.courseGroup.add(line);
        }

        // Edge rails
        const railGeo = new THREE.BoxGeometry(0.2, 0.5, length);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const leftRail = new THREE.Mesh(railGeo, railMat);
        leftRail.position.set(-CONFIG.trackWidth / 2 - 0.1, 0.15, z + length / 2);
        leftRail.castShadow = true;
        this.courseGroup.add(leftRail);

        const rightRail = new THREE.Mesh(railGeo, railMat);
        rightRail.position.set(CONFIG.trackWidth / 2 + 0.1, 0.15, z + length / 2);
        rightRail.castShadow = true;
        this.courseGroup.add(rightRail);
    }

    addWall(z, height, theme) {
        // The wall itself
        const wallGeo = new THREE.BoxGeometry(CONFIG.trackWidth, height, 0.6);
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xCC4444,
            roughness: 0.6,
            metalness: 0.2
        });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, height / 2, z + 1);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.courseGroup.add(wall);

        // Warning stripes on top
        const stripeGeo = new THREE.BoxGeometry(CONFIG.trackWidth + 0.2, 0.15, 0.7);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xFFCC00 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(0, height + 0.05, z + 1);
        this.courseGroup.add(stripe);

        // Small ground before wall
        const preGeo = new THREE.BoxGeometry(CONFIG.trackWidth, CONFIG.groundHeight, 2);
        const preMat = new THREE.MeshStandardMaterial({ color: theme.ground });
        const pre = new THREE.Mesh(preGeo, preMat);
        pre.position.set(0, -CONFIG.groundHeight / 2, z + 1);
        pre.receiveShadow = true;
        this.courseGroup.add(pre);
    }

    addGap(z, width, theme) {
        // Danger markers on edges
        const markerGeo = new THREE.BoxGeometry(CONFIG.trackWidth, 0.3, 0.3);
        const markerMat = new THREE.MeshStandardMaterial({ color: 0xFF4444, emissive: 0x441111 });

        const frontMarker = new THREE.Mesh(markerGeo, markerMat);
        frontMarker.position.set(0, 0.15, z);
        this.courseGroup.add(frontMarker);

        const backMarker = new THREE.Mesh(markerGeo, markerMat);
        backMarker.position.set(0, 0.15, z + width);
        this.courseGroup.add(backMarker);

        // Depth visual (dark pit)
        const pitGeo = new THREE.BoxGeometry(CONFIG.trackWidth - 0.4, 0.1, width - 0.2);
        const pitMat = new THREE.MeshStandardMaterial({ color: 0x111122 });
        const pit = new THREE.Mesh(pitGeo, pitMat);
        pit.position.set(0, -2, z + width / 2);
        this.courseGroup.add(pit);

        // Pit walls
        const sideGeo = new THREE.BoxGeometry(0.3, 4, width);
        const sideMat = new THREE.MeshStandardMaterial({ color: 0x333344 });
        const leftSide = new THREE.Mesh(sideGeo, sideMat);
        leftSide.position.set(-CONFIG.trackWidth / 2 + 0.15, -2, z + width / 2);
        this.courseGroup.add(leftSide);
        const rightSide = new THREE.Mesh(sideGeo, sideMat);
        rightSide.position.set(CONFIG.trackWidth / 2 - 0.15, -2, z + width / 2);
        this.courseGroup.add(rightSide);
    }

    addBeam(z, length, theme) {
        // Narrow beam
        const beamGeo = new THREE.BoxGeometry(1.2, 0.3, length);
        const beamMat = new THREE.MeshStandardMaterial({
            color: 0xDDAA44,
            roughness: 0.4,
            metalness: 0.3
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 0.55, z + length / 2);
        beam.castShadow = true;
        beam.receiveShadow = true;
        this.courseGroup.add(beam);

        // Support posts
        const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.7, 6);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x888844 });
        for (let pz = z + 1; pz < z + length; pz += 3) {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(0, 0.25, pz);
            post.castShadow = true;
            this.courseGroup.add(post);
        }

        // Side decorations (water/pit below)
        const waterGeo = new THREE.BoxGeometry(CONFIG.trackWidth, 0.05, length);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x2244AA,
            transparent: true,
            opacity: 0.5,
            emissive: 0x112244
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.set(0, -0.5, z + length / 2);
        this.courseGroup.add(water);
    }

    addTrampoline(z, theme) {
        // Trampoline pad
        const padGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.15, 16);
        const padMat = new THREE.MeshStandardMaterial({
            color: 0x4488FF,
            emissive: 0x112244,
            roughness: 0.3,
            metalness: 0.5
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(0, 0.1, z + 1);
        pad.castShadow = true;
        this.courseGroup.add(pad);

        // Frame
        const frameGeo = new THREE.TorusGeometry(1.6, 0.1, 8, 24);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.rotation.x = -Math.PI / 2;
        frame.position.set(0, 0.1, z + 1);
        this.courseGroup.add(frame);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        for (let a = 0; a < 4; a++) {
            const angle = (a / 4) * Math.PI * 2;
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(Math.cos(angle) * 1.3, -0.15, z + 1 + Math.sin(angle) * 1.3);
            this.courseGroup.add(leg);
        }

        // Ground under trampoline
        const groundGeo = new THREE.BoxGeometry(CONFIG.trackWidth, CONFIG.groundHeight, 2);
        const groundMat = new THREE.MeshStandardMaterial({ color: theme.ground });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(0, -CONFIG.groundHeight / 2, z + 1);
        ground.receiveShadow = true;
        this.courseGroup.add(ground);
    }

    addStartLine(z) {
        // Start banner
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

        const leftPole = new THREE.Mesh(poleGeo, poleMat);
        leftPole.position.set(-CONFIG.trackWidth / 2 - 0.5, 2.5, z);
        leftPole.castShadow = true;
        this.courseGroup.add(leftPole);

        const rightPole = new THREE.Mesh(poleGeo, poleMat);
        rightPole.position.set(CONFIG.trackWidth / 2 + 0.5, 2.5, z);
        rightPole.castShadow = true;
        this.courseGroup.add(rightPole);

        // Banner
        const bannerGeo = new THREE.BoxGeometry(CONFIG.trackWidth + 2, 1.2, 0.1);
        const bannerMat = new THREE.MeshStandardMaterial({ color: 0x22AA22, emissive: 0x114411 });
        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.set(0, 4.5, z);
        this.courseGroup.add(banner);

        // Start text via canvas texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#22AA22';
        ctx.fillRect(0, 0, 512, 128);
        ctx.font = 'bold 72px "Russo One", Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BAŞLANGIÇ', 256, 64);
        const tex = new THREE.CanvasTexture(canvas);
        const textMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0x114411 });
        const textGeo = new THREE.PlaneGeometry(CONFIG.trackWidth + 2, 1.2);
        const textMesh = new THREE.Mesh(textGeo, textMat);
        textMesh.position.set(0, 4.5, z + 0.06);
        this.courseGroup.add(textMesh);

        // Start ground marking
        for (let i = 0; i < 8; i++) {
            const checkGeo = new THREE.BoxGeometry(CONFIG.trackWidth / 8, 0.02, 0.8);
            const checkMat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xFFFFFF : 0x222222 });
            const check = new THREE.Mesh(checkGeo, checkMat);
            check.position.set(
                (i / 8) * CONFIG.trackWidth - CONFIG.trackWidth / 2 + CONFIG.trackWidth / 16,
                0.01,
                z - 0.4
            );
            this.courseGroup.add(check);
        }
    }

    addFinishLine(z) {
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

        const leftPole = new THREE.Mesh(poleGeo, poleMat);
        leftPole.position.set(-CONFIG.trackWidth / 2 - 0.5, 2.5, z);
        leftPole.castShadow = true;
        this.courseGroup.add(leftPole);

        const rightPole = new THREE.Mesh(poleGeo, poleMat);
        rightPole.position.set(CONFIG.trackWidth / 2 + 0.5, 2.5, z);
        rightPole.castShadow = true;
        this.courseGroup.add(rightPole);

        const bannerGeo = new THREE.BoxGeometry(CONFIG.trackWidth + 2, 1.2, 0.1);
        const bannerMat = new THREE.MeshStandardMaterial({ color: 0xDD2222, emissive: 0x441111 });
        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.set(0, 4.5, z);
        this.courseGroup.add(banner);

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#DD2222';
        ctx.fillRect(0, 0, 512, 128);
        ctx.font = 'bold 72px "Russo One", Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BİTİŞ', 256, 64);
        const tex = new THREE.CanvasTexture(canvas);
        const textMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0x441111 });
        const textGeo = new THREE.PlaneGeometry(CONFIG.trackWidth + 2, 1.2);
        const textMesh = new THREE.Mesh(textGeo, textMat);
        textMesh.position.set(0, 4.5, z + 0.06);
        this.courseGroup.add(textMesh);

        // Finish ground marking (checkered)
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 2; j++) {
                const checkGeo = new THREE.BoxGeometry(CONFIG.trackWidth / 16, 0.02, 0.5);
                const checkMat = new THREE.MeshStandardMaterial({
                    color: (i + j) % 2 === 0 ? 0xFFFFFF : 0x222222
                });
                const check = new THREE.Mesh(checkGeo, checkMat);
                check.position.set(
                    (i / 16) * CONFIG.trackWidth - CONFIG.trackWidth / 2 + CONFIG.trackWidth / 32,
                    0.01,
                    z - 0.25 + j * 0.5
                );
                this.courseGroup.add(check);
            }
        }

        // Finish line ground
        const groundGeo = new THREE.BoxGeometry(CONFIG.trackWidth, CONFIG.groundHeight, 10);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(0, -CONFIG.groundHeight / 2, z + 5);
        ground.receiveShadow = true;
        this.courseGroup.add(ground);
    }

    addSideDecorations(theme) {
        const totalLen = this.courseLength + 20;

        // Trees/poles along the side
        for (let z = 5; z < totalLen; z += randRange(8, 15)) {
            for (const side of [-1, 1]) {
                const x = side * (CONFIG.trackWidth / 2 + randRange(2, 5));

                // Simple tree: trunk + foliage
                const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 2, 6);
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.set(x, 1, z);
                trunk.castShadow = true;
                this.courseGroup.add(trunk);

                const foliageGeo = new THREE.SphereGeometry(randRange(0.8, 1.5), 8, 8);
                const foliageMat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.6, 0.35)
                });
                const foliage = new THREE.Mesh(foliageGeo, foliageMat);
                foliage.position.set(x, 2.5 + Math.random() * 0.5, z);
                foliage.castShadow = true;
                this.courseGroup.add(foliage);
            }
        }

        // Light posts
        for (let z = 10; z < totalLen; z += 25) {
            for (const side of [-1, 1]) {
                const x = side * (CONFIG.trackWidth / 2 + 1);
                const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 4, 6);
                const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
                const pole = new THREE.Mesh(poleGeo, poleMat);
                pole.position.set(x, 2, z);
                this.courseGroup.add(pole);

                const lightGeo = new THREE.SphereGeometry(0.2, 8, 8);
                const lightMat = new THREE.MeshStandardMaterial({
                    color: 0xFFFF88,
                    emissive: 0xFFFF44,
                    emissiveIntensity: 0.5
                });
                const light = new THREE.Mesh(lightGeo, lightMat);
                light.position.set(x, 4.2, z);
                this.courseGroup.add(light);
            }
        }
    }
}

// ============================================================
// CAMERA CONTROLLER
// ============================================================
class CameraController {
    constructor(camera) {
        this.camera = camera;
        this.mode = 'chase';
        this.targetPos = new THREE.Vector3();
        this.targetLook = new THREE.Vector3();
        this.currentPos = new THREE.Vector3(0, 10, -15);
        this.currentLook = new THREE.Vector3(0, 1, 0);
        this.smoothness = 3;
    }

    setMode(mode) {
        this.mode = mode;
    }

    update(dt, racers, courseLength) {
        if (!racers || racers.length === 0) return;

        const activeRacers = racers.filter(r => !r.finished);
        const sortedByProgress = [...racers].sort((a, b) => b.progress - a.progress);
        const leader = sortedByProgress[0];
        const pack = sortedByProgress.slice(0, Math.min(4, sortedByProgress.length));

        const avgZ = pack.reduce((s, r) => s + r.progress, 0) / pack.length;
        const avgY = pack.reduce((s, r) => s + r.verticalPos, 0) / pack.length;

        const progressRatio = avgZ / courseLength;

        switch (this.mode) {
            case 'chase':
                this.targetPos.set(
                    Math.sin(progressRatio * 0.5) * 3,
                    CONFIG.cameraHeight + avgY * 0.3,
                    avgZ - CONFIG.cameraDistance
                );
                this.targetLook.set(0, 1 + avgY * 0.3, avgZ + 5);
                break;

            case 'side':
                this.targetPos.set(
                    CONFIG.cameraSide + 5,
                    CONFIG.cameraHeight - 1,
                    avgZ
                );
                this.targetLook.set(0, 1.5, avgZ + 2);
                break;

            case 'cinematic': {
                const phase = (progressRatio * 3) % 3;
                if (phase < 1) {
                    // Behind chase
                    this.targetPos.set(
                        Math.sin(progressRatio * 2) * 5,
                        CONFIG.cameraHeight + 2,
                        avgZ - CONFIG.cameraDistance - 3
                    );
                    this.targetLook.set(0, 1, avgZ + 8);
                } else if (phase < 2) {
                    // Side view
                    this.targetPos.set(
                        CONFIG.cameraSide + 8,
                        CONFIG.cameraHeight,
                        avgZ - 2
                    );
                    this.targetLook.set(0, 1.5, avgZ + 3);
                } else {
                    // High angle
                    this.targetPos.set(
                        Math.sin(progressRatio * 1.5) * 6,
                        CONFIG.cameraHeight + 8,
                        avgZ - 10
                    );
                    this.targetLook.set(0, 0, avgZ + 5);
                }
                break;
            }

            case 'top':
                this.targetPos.set(0, 20, avgZ - 5);
                this.targetLook.set(0, 0, avgZ + 5);
                break;
        }

        const s = 1 - Math.exp(-this.smoothness * dt);
        this.currentPos.lerp(this.targetPos, s);
        this.currentLook.lerp(this.targetLook, s);

        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this.currentLook);
    }

    setInitialPosition(z) {
        this.currentPos.set(0, CONFIG.cameraHeight + 2, z - CONFIG.cameraDistance - 5);
        this.currentLook.set(0, 1, z);
        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this.currentLook);
    }
}

// ============================================================
// PARTICLE SYSTEM
// ============================================================
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    emit(position, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.08, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            this.scene.add(mesh);

            this.particles.push({
                mesh,
                velocity: new THREE.Vector3(
                    randRange(-2, 2),
                    randRange(1, 4),
                    randRange(-2, 2)
                ),
                life: 1.0,
                decay: randRange(1, 3)
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= p.decay * dt;
            p.velocity.y -= 10 * dt;
            p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
            p.mesh.material.opacity = Math.max(0, p.life);
            p.mesh.scale.setScalar(p.life);

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }

    clear() {
        for (const p of this.particles) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        }
        this.particles = [];
    }
}

// ============================================================
// MAIN GAME
// ============================================================
class ParkourGame {
    constructor() {
        this.state = 'menu';
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cameraCtrl = null;
        this.courseBuilder = null;
        this.particles = null;
        this.racers = [];
        this.obstacles = [];
        this.courseLength = 0;

        this.selectedCourse = COURSES[0];
        this.selectedRacerCount = CONFIG.defaultRacerCount;
        this.selectedRacerData = [];

        this.raceTime = 0;
        this.countdownTime = 0;
        this.raceFinished = false;
        this.finishTimer = 0;
        this.raceSpeed = 1;
        this.cameraMode = 'chase';

        this.clock = new THREE.Clock();
        this.animationId = null;

        // Tournament
        this.tournamentMode = false;
        this.tournamentRaces = 0;
        this.tournamentCurrentRace = 0;
        this.tournamentScores = {};
        this.tournamentCourses = [];

        // Auto race
        this.autoRaceMode = false;
        this.autoRaceTimer = 0;
    }

    init() {
        this.setupThreeJS();
        this.setupUI();
        this.courseBuilder = new CourseBuilder(this.scene);
        this.particles = new ParticleSystem(this.scene);
        this.animate();
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            500
        );
        this.camera.position.set(0, 8, -15);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        document.getElementById('game-container').appendChild(this.renderer.domElement);

        this.cameraCtrl = new CameraController(this.camera);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupEnvironment(theme) {
        // Clear old environment
        const toRemove = [];
        this.scene.traverse(child => {
            if (child.userData.isEnvironment) toRemove.push(child);
        });
        toRemove.forEach(c => this.scene.remove(c));

        // Sky
        const skyColor1 = new THREE.Color(theme.sky1);
        const skyColor2 = new THREE.Color(theme.sky2);
        this.scene.background = skyColor2;
        this.scene.fog = new THREE.Fog(theme.fog, 50, 200);

        // Ambient light
        const ambient = new THREE.AmbientLight(theme.ambient, 0.6);
        ambient.userData.isEnvironment = true;
        this.scene.add(ambient);

        // Hemisphere light
        const hemi = new THREE.HemisphereLight(0xffffff, theme.ground, 0.4);
        hemi.userData.isEnvironment = true;
        this.scene.add(hemi);

        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(20, 30, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = CONFIG.shadowMapSize;
        sun.shadow.mapSize.height = CONFIG.shadowMapSize;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 100;
        sun.shadow.camera.left = -30;
        sun.shadow.camera.right = 30;
        sun.shadow.camera.top = 30;
        sun.shadow.camera.bottom = -10;
        sun.userData.isEnvironment = true;
        this.scene.add(sun);

        // Ground plane (infinite look)
        const groundGeo = new THREE.PlaneGeometry(200, 500);
        const groundMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(theme.ground).multiplyScalar(0.5),
            roughness: 1.0
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -2, 100);
        ground.receiveShadow = true;
        ground.userData.isEnvironment = true;
        this.scene.add(ground);
    }

    // ---- UI MANAGEMENT ----
    setupUI() {
        // Menu buttons
        document.getElementById('btn-quick-race').addEventListener('click', () => {
            this.showScreen('setup');
            this.populateSetup();
        });

        document.getElementById('btn-tournament').addEventListener('click', () => {
            this.startTournament();
        });

        document.getElementById('btn-auto-race').addEventListener('click', () => {
            this.startAutoRace();
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            this.showScreen('settings');
        });

        document.getElementById('btn-back-settings').addEventListener('click', () => {
            this.applySettings();
            this.showScreen('menu');
        });

        // Setup buttons
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            this.showScreen('menu');
        });

        document.getElementById('btn-start-race').addEventListener('click', () => {
            this.startRace();
        });

        document.getElementById('racer-count-slider').addEventListener('input', (e) => {
            this.selectedRacerCount = parseInt(e.target.value);
            document.getElementById('racer-count-display').textContent = this.selectedRacerCount;
            this.updateRacerPreview();
        });

        document.getElementById('btn-shuffle-racers').addEventListener('click', () => {
            this.updateRacerPreview();
        });

        // Results buttons
        document.getElementById('btn-replay').addEventListener('click', () => {
            this.replayRace();
        });

        document.getElementById('btn-new-race').addEventListener('click', () => {
            this.showScreen('setup');
            this.populateSetup();
        });

        document.getElementById('btn-back-menu2').addEventListener('click', () => {
            this.cleanupRace();
            this.showScreen('menu');
        });

        // Race HUD
        document.getElementById('btn-skip-race').addEventListener('click', () => {
            this.skipRace();
        });

        // Tournament buttons
        document.getElementById('btn-next-tournament-race').addEventListener('click', () => {
            this.nextTournamentRace();
        });

        document.getElementById('btn-end-tournament').addEventListener('click', () => {
            this.cleanupRace();
            this.tournamentMode = false;
            this.showScreen('menu');
        });
    }

    showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screenId = {
            menu: 'menu-screen',
            setup: 'setup-screen',
            settings: 'settings-screen',
            race: 'race-hud',
            results: 'results-screen',
            tournament: 'tournament-screen'
        }[name];
        if (screenId) {
            document.getElementById(screenId).classList.add('active');
        }
        this.state = name;
    }

    populateSetup() {
        // Course list
        const courseList = document.getElementById('course-list');
        courseList.innerHTML = '';
        COURSES.forEach(course => {
            const card = document.createElement('div');
            card.className = 'course-card' + (course === this.selectedCourse ? ' selected' : '');
            card.innerHTML = `
                <h4>${course.name}</h4>
                <p>${course.description}</p>
                <div class="course-stats">
                    <span>Zorluk: ${'★'.repeat(course.difficulty)}${'☆'.repeat(5 - course.difficulty)}</span>
                    <span>Uzunluk: ${course.length}</span>
                </div>
            `;
            card.addEventListener('click', () => {
                document.querySelectorAll('.course-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCourse = course;
            });
            courseList.appendChild(card);
        });

        this.updateRacerPreview();
    }

    updateRacerPreview() {
        this.selectedRacerData = shuffleArray(RACER_DB).slice(0, this.selectedRacerCount);
        const preview = document.getElementById('racer-preview');
        preview.innerHTML = '';
        this.selectedRacerData.forEach(r => {
            const badge = document.createElement('div');
            badge.className = 'racer-badge';
            badge.innerHTML = `
                <span class="racer-color-dot" style="background:${colorToCSS(r.color)}"></span>
                <span>${r.name}</span>
            `;
            preview.appendChild(badge);
        });
    }

    applySettings() {
        this.cameraMode = document.getElementById('camera-mode').value;
        this.raceSpeed = parseFloat(document.getElementById('race-speed').value);
        if (this.cameraCtrl) {
            this.cameraCtrl.setMode(this.cameraMode);
        }
    }

    // ---- RACE MANAGEMENT ----
    startRace() {
        this.cleanupRace();
        this.setupEnvironment(this.selectedCourse.theme);

        const courseData = this.courseBuilder.build(this.selectedCourse);
        this.obstacles = courseData.obstacles;
        this.courseLength = courseData.courseLength;

        // Create racers
        this.racers = this.selectedRacerData.map((data, i) => {
            const racer = new Racer(data, i, this.selectedRacerData.length);
            this.scene.add(racer.model.group);
            return racer;
        });

        this.raceTime = 0;
        this.raceFinished = false;
        this.finishTimer = 0;
        this.countdownTime = CONFIG.countdownTime + 1;

        this.cameraCtrl.setMode(this.cameraMode);
        this.cameraCtrl.setInitialPosition(0);

        this.showScreen('race');
        document.getElementById('course-name-hud').textContent = this.selectedCourse.name;
        document.getElementById('countdown-overlay').classList.remove('hidden');

        this.setupProgressBar();
        this.state = 'countdown';
    }

    setupProgressBar() {
        const track = document.getElementById('progress-bar-track');
        track.innerHTML = '<div class="progress-flag">🏁</div>';

        this.racers.forEach(racer => {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            dot.style.backgroundColor = colorToCSS(racer.baseColor);
            dot.dataset.racerName = racer.name;
            track.appendChild(dot);
        });
    }

    updateProgressBar() {
        const dots = document.querySelectorAll('.progress-dot');
        dots.forEach(dot => {
            const racer = this.racers.find(r => r.name === dot.dataset.racerName);
            if (racer) {
                const pct = clamp((racer.progress / this.courseLength) * 100, 0, 98);
                dot.style.left = pct + '%';
            }
        });
    }

    cleanupRace() {
        // Remove racers from scene
        this.racers.forEach(r => {
            this.scene.remove(r.model.group);
        });
        this.racers = [];

        // Clear course
        if (this.courseBuilder) this.courseBuilder.clear();

        // Clear particles
        if (this.particles) this.particles.clear();

        // Remove finish banner if exists
        const banner = document.querySelector('.finish-banner');
        if (banner) banner.remove();

        // Reset obstacles
        this.obstacles = [];
    }

    replayRace() {
        // Reset all racers
        this.racers.forEach(r => r.reset());
        this.obstacles.forEach(o => { o.passed = new Set(); });
        this.raceTime = 0;
        this.raceFinished = false;
        this.finishTimer = 0;
        this.countdownTime = CONFIG.countdownTime + 1;

        this.cameraCtrl.setInitialPosition(0);
        this.showScreen('race');
        document.getElementById('countdown-overlay').classList.remove('hidden');
        this.setupProgressBar();
        this.state = 'countdown';
    }

    skipRace() {
        // Fast-forward to end
        this.racers.forEach(r => {
            if (!r.finished) {
                r.finished = true;
                r.finishTime = this.raceTime + Math.random() * 2;
                r.progress = this.courseLength;
            }
        });
        this.raceFinished = true;
        this.showResults();
    }

    startAutoRace() {
        this.autoRaceMode = true;
        this.selectedCourse = COURSES[Math.floor(Math.random() * COURSES.length)];
        this.selectedRacerCount = 8;
        this.selectedRacerData = shuffleArray(RACER_DB).slice(0, this.selectedRacerCount);
        this.cameraMode = 'cinematic';
        this.cameraCtrl.setMode('cinematic');
        this.startRace();
    }

    startTournament() {
        this.tournamentMode = true;
        this.tournamentRaces = COURSES.length;
        this.tournamentCurrentRace = 0;
        this.tournamentCourses = shuffleArray([...COURSES]);
        this.selectedRacerCount = 8;
        this.selectedRacerData = shuffleArray(RACER_DB).slice(0, this.selectedRacerCount);
        this.tournamentScores = {};
        this.selectedRacerData.forEach(r => {
            this.tournamentScores[r.name] = 0;
        });

        this.selectedCourse = this.tournamentCourses[0];
        this.startRace();
    }

    nextTournamentRace() {
        this.tournamentCurrentRace++;
        if (this.tournamentCurrentRace >= this.tournamentRaces) {
            this.showTournamentFinal();
            return;
        }
        this.selectedCourse = this.tournamentCourses[this.tournamentCurrentRace];
        this.startRace();
    }

    showTournamentStandings() {
        const standings = document.getElementById('tournament-standings');
        standings.innerHTML = '';

        const sorted = Object.entries(this.tournamentScores)
            .sort((a, b) => b[1] - a[1]);

        sorted.forEach(([name, points], i) => {
            const data = this.selectedRacerData.find(r => r.name === name);
            const row = document.createElement('div');
            row.className = 'tournament-row';
            row.innerHTML = `
                <span class="t-pos">${i + 1}.</span>
                <span class="t-color" style="background:${colorToCSS(data.color)}"></span>
                <span class="t-name">${name}</span>
                <span class="t-points">${points} puan</span>
            `;
            standings.appendChild(row);
        });

        const raceInfo = document.getElementById('tournament-race-info');
        raceInfo.textContent = `Yarış ${this.tournamentCurrentRace + 1} / ${this.tournamentRaces} tamamlandı`;

        this.showScreen('tournament');
    }

    showTournamentFinal() {
        document.getElementById('tournament-race-info').textContent = 'Turnuva Tamamlandı!';
        document.getElementById('btn-next-tournament-race').style.display = 'none';
        this.showTournamentStandings();
    }

    showResults() {
        const sorted = [...this.racers].sort((a, b) => {
            if (a.finishTime === null && b.finishTime === null) return b.progress - a.progress;
            if (a.finishTime === null) return 1;
            if (b.finishTime === null) return -1;
            return a.finishTime - b.finishTime;
        });

        const winnerTime = sorted[0].finishTime || 0;

        // Tournament points
        if (this.tournamentMode) {
            const pointTable = [25, 18, 15, 12, 10, 8, 6, 4, 3, 2, 1, 0];
            sorted.forEach((racer, i) => {
                if (this.tournamentScores[racer.name] !== undefined) {
                    this.tournamentScores[racer.name] += pointTable[i] || 0;
                }
            });
        }

        // Podium
        const podium = document.getElementById('results-podium');
        podium.innerHTML = '';

        const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
        podiumOrder.forEach(idx => {
            if (idx < sorted.length) {
                const r = sorted[idx];
                const place = document.createElement('div');
                place.className = `podium-place podium-${idx + 1}`;
                place.innerHTML = `
                    <div class="podium-avatar" style="background:${colorToCSS(r.baseColor)};border-color:${idx === 0 ? 'var(--gold)' : idx === 1 ? 'var(--silver)' : 'var(--bronze)'}"></div>
                    <div class="podium-name">${r.name}</div>
                    <div class="podium-time">${r.finishTime ? formatTime(r.finishTime) : 'DNF'}</div>
                    <div class="podium-block">${idx + 1}</div>
                `;
                podium.appendChild(place);
            }
        });

        // Results table
        const table = document.getElementById('results-table');
        table.innerHTML = '';
        sorted.forEach((r, i) => {
            const row = document.createElement('div');
            const cls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            const diff = r.finishTime && winnerTime ? `+${(r.finishTime - winnerTime).toFixed(2)}s` : '';
            row.className = `result-row ${cls}`;
            row.innerHTML = `
                <span class="result-pos">${i + 1}</span>
                <span class="result-color" style="background:${colorToCSS(r.baseColor)}"></span>
                <span class="result-name">${r.name}</span>
                <span class="result-time">${r.finishTime ? formatTime(r.finishTime) : 'DNF'}</span>
                <span class="result-diff">${i === 0 ? '' : diff}</span>
            `;
            table.appendChild(row);
        });

        if (this.tournamentMode) {
            this.showTournamentStandings();
        } else {
            this.showScreen('results');
        }
    }

    updateHUD() {
        // Timer
        document.getElementById('race-timer').textContent = formatTime(this.raceTime);

        // Positions
        const sorted = [...this.racers].sort((a, b) => b.progress - a.progress);
        const posDiv = document.getElementById('hud-positions');
        posDiv.innerHTML = '';

        sorted.forEach((r, i) => {
            const row = document.createElement('div');
            row.className = 'hud-position-row' + (i === 0 ? ' first' : '');
            const pct = Math.round((r.progress / this.courseLength) * 100);
            row.innerHTML = `
                <span class="pos-num">${i + 1}</span>
                <span class="pos-color" style="background:${colorToCSS(r.baseColor)}"></span>
                <span class="pos-name">${r.name}</span>
                <span class="pos-progress">${r.finished ? '🏁' : pct + '%'}</span>
            `;
            posDiv.appendChild(row);
        });

        this.updateProgressBar();
    }

    // ---- GAME LOOP ----
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        const dt = Math.min(this.clock.getDelta(), 0.05);

        if (this.state === 'countdown') {
            this.countdownTime -= dt;
            const countdownText = document.getElementById('countdown-text');
            const overlay = document.getElementById('countdown-overlay');

            if (this.countdownTime > 1) {
                countdownText.textContent = Math.ceil(this.countdownTime - 1);
                countdownText.style.animation = 'none';
                countdownText.offsetHeight; // reflow
                countdownText.style.animation = 'countdownPop 0.5s ease-out';
            } else if (this.countdownTime > 0) {
                countdownText.textContent = 'BAŞLA!';
                countdownText.style.color = 'var(--success)';
                countdownText.style.fontSize = '6rem';
            } else {
                overlay.classList.add('hidden');
                countdownText.style.color = 'white';
                countdownText.style.fontSize = '12rem';
                this.state = 'racing';
                this.racers.forEach(r => r.startRunning());
            }

            this.cameraCtrl.update(dt, this.racers, this.courseLength);
            this.renderer.render(this.scene, this.camera);
            return;
        }

        if (this.state === 'racing') {
            const scaledDt = dt * this.raceSpeed;
            this.raceTime += scaledDt;
            const time = this.clock.elapsedTime;

            // Update racers
            this.racers.forEach(r => {
                r.update(scaledDt, time, this.obstacles, this.courseLength, this.raceTime);
            });

            // Check for first finisher
            const firstFinisher = this.racers.find(r => r.finished && r.position === 0);
            if (!firstFinisher) {
                const justFinished = this.racers.find(r => r.finished && r.position === 0);
                if (justFinished) {
                    this.particles.emit(justFinished.model.group.position, justFinished.baseColor, 30);
                }
            }

            // Assign positions
            const sorted = [...this.racers].sort((a, b) => b.progress - a.progress);
            sorted.forEach((r, i) => { r.position = i; });

            // Particles for finishers
            this.racers.forEach(r => {
                if (r.finished && !r._celebrationStarted) {
                    r._celebrationStarted = true;
                    this.particles.emit(r.model.group.position.clone().add(new THREE.Vector3(0, 2, 0)), r.baseColor, 25);

                    // Show finish banner for first place
                    if (r.position === 0 && !document.querySelector('.finish-banner')) {
                        const banner = document.createElement('div');
                        banner.className = 'finish-banner';
                        banner.textContent = `🏆 ${r.name} 🏆`;
                        document.body.appendChild(banner);
                        setTimeout(() => banner.remove(), 3000);
                    }
                }
            });

            // Check if all finished
            const allFinished = this.racers.every(r => r.finished);
            if (allFinished && !this.raceFinished) {
                this.raceFinished = true;
                this.finishTimer = CONFIG.finishDelay / 1000;
            }

            if (this.raceFinished) {
                this.finishTimer -= scaledDt;
                if (this.finishTimer <= 0) {
                    if (this.autoRaceMode) {
                        this.autoRaceMode = false;
                    }
                    this.showResults();
                }
            }

            // Force DNF for stragglers (after 3x the winner's time)
            const anyFinished = this.racers.some(r => r.finished);
            if (anyFinished) {
                const winnerTime = this.racers.filter(r => r.finished).reduce((min, r) => Math.min(min, r.finishTime), Infinity);
                this.racers.forEach(r => {
                    if (!r.finished && this.raceTime > winnerTime * 2.5) {
                        r.finished = true;
                        r.finishTime = this.raceTime;
                    }
                });
            }

            this.particles.update(scaledDt);
            this.cameraCtrl.update(dt, this.racers, this.courseLength);
            this.updateHUD();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================================
// START THE GAME
// ============================================================
const game = new ParkourGame();
game.init();
