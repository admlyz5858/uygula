"use strict";

// ============================================================
// CONFIGURATION
// ============================================================
const CFG = {
    WORLD_W: 800,
    MARBLE_R: 12,
    GRAVITY: 520,
    FRICTION: 0.997,
    WALL_BOUNCE: 0.55,
    MARBLE_BOUNCE: 0.7,
    MAX_VEL: 900,
    SUB_STEPS: 4,
    FINISH_DELAY: 3,
    COUNTDOWN_SECS: 3,
    SPEED_VAR: 0.08,
    DEFAULT_COUNT: 8,
};

// ============================================================
// TRACK DEFINITIONS
// ============================================================
function buildTrackPath(sections) {
    const pts = [];
    const obs = [];
    let y = 0;
    for (const s of sections) {
        switch (s.type) {
            case 'straight': {
                pts.push({ y, l: s.l, r: s.r });
                y += s.len;
                pts.push({ y, l: s.l, r: s.r });
                break;
            }
            case 'taper': {
                pts.push({ y, l: s.l1, r: s.r1 });
                y += s.len;
                pts.push({ y, l: s.l2, r: s.r2 });
                break;
            }
            case 'curve': {
                const steps = 12;
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const off = Math.sin(t * Math.PI * (s.periods || 1)) * s.amp;
                    pts.push({ y: y + t * s.len, l: s.l + off, r: s.r + off });
                }
                y += s.len;
                break;
            }
            case 'zigzag': {
                const segs = s.segs || 4;
                for (let i = 0; i <= segs; i++) {
                    const t = i / segs;
                    const dir = i % 2 === 0 ? -1 : 1;
                    const off = dir * s.amp;
                    pts.push({ y: y + t * s.len, l: s.baseL + (i > 0 ? off : 0), r: s.baseR + (i > 0 ? off : 0) });
                }
                y += s.len;
                break;
            }
            case 'funnel': {
                pts.push({ y, l: s.l1, r: s.r1 });
                y += s.len * 0.5;
                pts.push({ y, l: s.lm, r: s.rm });
                y += s.len * 0.5;
                pts.push({ y, l: s.l2, r: s.r2 });
                break;
            }
            case 'pegs': {
                for (let row = 0; row < s.rows; row++) {
                    const cols = row % 2 === 0 ? s.cols : s.cols - 1;
                    const offX = row % 2 === 0 ? 0 : s.spacingX * 0.5;
                    for (let c = 0; c < cols; c++) {
                        obs.push({
                            type: 'peg',
                            x: s.startX + offX + c * s.spacingX,
                            y: s.startY + row * s.spacingY,
                            r: s.pegR || 8,
                        });
                    }
                }
                break;
            }
            case 'bumpers': {
                for (const b of s.list) {
                    obs.push({ type: 'bumper', x: b.x, y: b.y, r: b.r || 22 });
                }
                break;
            }
            case 'bars': {
                for (const b of s.list) {
                    obs.push({ type: 'bar', x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 });
                }
                break;
            }
        }
    }
    return { path: pts, obstacles: obs, length: y };
}

const TRACKS = [
    {
        id: 'classic', name: 'Klasik Yarış',
        desc: 'Basit ve eğlenceli bir parkur. Yeni başlayanlar için ideal.',
        difficulty: 1, lengthLabel: 'Kısa',
        bg1: '#0a0a2e', bg2: '#162050', wallColor: '#4a90d9', trackColor: '#1a2a4e',
        get data() {
            return buildTrackPath([
                { type: 'straight', len: 120, l: 200, r: 600 },
                { type: 'taper', len: 200, l1: 200, r1: 600, l2: 280, r2: 520 },
                { type: 'straight', len: 100, l: 280, r: 520 },
                { type: 'pegs', rows: 5, cols: 6, spacingX: 45, spacingY: 50, startX: 280, startY: 460, pegR: 8 },
                { type: 'taper', len: 150, l1: 280, r1: 520, l2: 200, r2: 600 },
                { type: 'straight', len: 80, l: 200, r: 600 },
                { type: 'bumpers', list: [{ x: 320, y: 780 }, { x: 480, y: 780 }, { x: 400, y: 850, r: 28 }] },
                { type: 'straight', len: 200, l: 200, r: 600 },
                { type: 'curve', len: 400, l: 200, r: 600, amp: 80, periods: 2 },
                { type: 'taper', len: 200, l1: 200, r1: 600, l2: 320, r2: 480 },
                { type: 'straight', len: 100, l: 320, r: 480 },
                { type: 'taper', len: 150, l1: 320, r1: 480, l2: 200, r2: 600 },
                { type: 'straight', len: 250, l: 200, r: 600 },
            ]);
        }
    },
    {
        id: 'zigzag', name: 'Çılgın Zikzak',
        desc: 'Keskin virajlar ve dar geçitler. Çevik bilyeler avantajlı!',
        difficulty: 3, lengthLabel: 'Orta',
        bg1: '#1a0a0a', bg2: '#3a1525', wallColor: '#d94a7a', trackColor: '#2a1020',
        get data() {
            return buildTrackPath([
                { type: 'straight', len: 100, l: 200, r: 600 },
                { type: 'zigzag', len: 600, amp: 130, segs: 6, baseL: 250, baseR: 550 },
                { type: 'taper', len: 100, l1: 250, r1: 550, l2: 300, r2: 500 },
                { type: 'zigzag', len: 500, amp: 100, segs: 5, baseL: 300, baseR: 500 },
                { type: 'taper', len: 100, l1: 300, r1: 500, l2: 200, r2: 600 },
                { type: 'bumpers', list: [{ x: 300, y: 1450 }, { x: 500, y: 1450 }, { x: 400, y: 1520, r: 26 }] },
                { type: 'straight', len: 200, l: 200, r: 600 },
                { type: 'zigzag', len: 400, amp: 150, segs: 4, baseL: 250, baseR: 550 },
                { type: 'straight', len: 250, l: 200, r: 600 },
            ]);
        }
    },
    {
        id: 'plinko', name: 'Engel Cehennemi',
        desc: 'Çiviler, tamponlar ve engeller! Şans faktörü yüksek.',
        difficulty: 4, lengthLabel: 'Orta',
        bg1: '#0a1a0a', bg2: '#153020', wallColor: '#4ad95a', trackColor: '#102a15',
        get data() {
            return buildTrackPath([
                { type: 'straight', len: 100, l: 150, r: 650 },
                { type: 'pegs', rows: 8, cols: 9, spacingX: 55, spacingY: 55, startX: 170, startY: 130, pegR: 9 },
                { type: 'straight', len: 550, l: 150, r: 650 },
                { type: 'bumpers', list: [
                    { x: 250, y: 720 }, { x: 400, y: 700, r: 30 }, { x: 550, y: 720 },
                    { x: 300, y: 800 }, { x: 500, y: 800 },
                ] },
                { type: 'straight', len: 300, l: 150, r: 650 },
                { type: 'pegs', rows: 6, cols: 8, spacingX: 60, spacingY: 50, startX: 175, startY: 1050, pegR: 10 },
                { type: 'straight', len: 400, l: 150, r: 650 },
                { type: 'bars', list: [
                    { x1: 200, y1: 1500, x2: 350, y2: 1530 },
                    { x1: 450, y1: 1530, x2: 600, y2: 1500 },
                    { x1: 250, y1: 1600, x2: 550, y2: 1620 },
                ] },
                { type: 'taper', len: 150, l1: 150, r1: 650, l2: 250, r2: 550 },
                { type: 'straight', len: 100, l: 250, r: 550 },
                { type: 'taper', len: 100, l1: 250, r1: 550, l2: 150, r2: 650 },
                { type: 'straight', len: 300, l: 150, r: 650 },
            ]);
        }
    },
    {
        id: 'funnels', name: 'Dev Huni',
        desc: 'Daralan ve genişleyen kanallar. Sıkışma garantili!',
        difficulty: 3, lengthLabel: 'Uzun',
        bg1: '#1a1a00', bg2: '#2a2a10', wallColor: '#d9b44a', trackColor: '#2a2510',
        get data() {
            return buildTrackPath([
                { type: 'straight', len: 100, l: 150, r: 650 },
                { type: 'funnel', len: 300, l1: 150, r1: 650, lm: 340, rm: 460, l2: 150, r2: 650 },
                { type: 'straight', len: 100, l: 150, r: 650 },
                { type: 'bumpers', list: [{ x: 300, y: 550 }, { x: 500, y: 550 }, { x: 400, y: 620, r: 25 }] },
                { type: 'funnel', len: 400, l1: 150, r1: 650, lm: 360, rm: 440, l2: 200, r2: 600 },
                { type: 'pegs', rows: 4, cols: 7, spacingX: 55, spacingY: 50, startX: 220, startY: 1050, pegR: 8 },
                { type: 'straight', len: 300, l: 200, r: 600 },
                { type: 'funnel', len: 300, l1: 200, r1: 600, lm: 350, rm: 450, l2: 200, r2: 600 },
                { type: 'curve', len: 300, l: 200, r: 600, amp: 60, periods: 2 },
                { type: 'funnel', len: 250, l1: 200, r1: 600, lm: 340, rm: 460, l2: 150, r2: 650 },
                { type: 'straight', len: 300, l: 150, r: 650 },
            ]);
        }
    },
    {
        id: 'mega', name: 'Mega Parkur',
        desc: 'En uzun ve en zorlu parkur! Her şey var.',
        difficulty: 5, lengthLabel: 'Çok Uzun',
        bg1: '#0a0020', bg2: '#200040', wallColor: '#b04ad9', trackColor: '#150030',
        get data() {
            return buildTrackPath([
                { type: 'straight', len: 100, l: 150, r: 650 },
                { type: 'taper', len: 200, l1: 150, r1: 650, l2: 250, r2: 550 },
                { type: 'pegs', rows: 5, cols: 6, spacingX: 50, spacingY: 50, startX: 260, startY: 320, pegR: 8 },
                { type: 'straight', len: 350, l: 250, r: 550 },
                { type: 'taper', len: 100, l1: 250, r1: 550, l2: 150, r2: 650 },
                { type: 'zigzag', len: 500, amp: 120, segs: 5, baseL: 200, baseR: 600 },
                { type: 'bumpers', list: [
                    { x: 280, y: 1130 }, { x: 400, y: 1100, r: 30 }, { x: 520, y: 1130 },
                ] },
                { type: 'straight', len: 200, l: 150, r: 650 },
                { type: 'funnel', len: 350, l1: 150, r1: 650, lm: 350, rm: 450, l2: 150, r2: 650 },
                { type: 'pegs', rows: 6, cols: 8, spacingX: 58, spacingY: 48, startX: 175, startY: 1700, pegR: 9 },
                { type: 'straight', len: 400, l: 150, r: 650 },
                { type: 'bars', list: [
                    { x1: 200, y1: 2150, x2: 380, y2: 2180 },
                    { x1: 420, y1: 2180, x2: 600, y2: 2150 },
                ] },
                { type: 'curve', len: 400, l: 150, r: 650, amp: 100, periods: 2 },
                { type: 'funnel', len: 250, l1: 150, r1: 650, lm: 340, rm: 460, l2: 200, r2: 600 },
                { type: 'zigzag', len: 400, amp: 80, segs: 4, baseL: 250, baseR: 550 },
                { type: 'straight', len: 200, l: 200, r: 600 },
                { type: 'bumpers', list: [
                    { x: 300, y: 3470, r: 20 }, { x: 400, y: 3440, r: 20 }, { x: 500, y: 3470, r: 20 },
                ] },
                { type: 'taper', len: 150, l1: 200, r1: 600, l2: 150, r2: 650 },
                { type: 'straight', len: 300, l: 150, r: 650 },
            ]);
        }
    },
];

// ============================================================
// MARBLE DATABASE
// ============================================================
const MARBLE_DB = [
    { name: 'Kırmızı Alev', color: '#FF3333', speed: 1.15, weight: 1.0, bounce: 1.0, luck: 0.95 },
    { name: 'Yeşil Yıldız', color: '#33DD33', speed: 0.95, weight: 1.1, bounce: 0.9, luck: 1.1 },
    { name: 'Mavi Şimşek', color: '#3388FF', speed: 1.2, weight: 0.9, bounce: 1.05, luck: 0.9 },
    { name: 'Sarı Güneş', color: '#FFDD33', speed: 1.05, weight: 1.0, bounce: 1.1, luck: 1.0 },
    { name: 'Turuncu Ateş', color: '#FF8833', speed: 1.1, weight: 1.05, bounce: 0.95, luck: 1.0 },
    { name: 'Mor Fırtına', color: '#AA44FF', speed: 1.0, weight: 0.95, bounce: 1.15, luck: 1.05 },
    { name: 'Pembe Rüzgar', color: '#FF66AA', speed: 1.1, weight: 0.9, bounce: 1.0, luck: 1.1 },
    { name: 'Turkuaz Dalga', color: '#33DDCC', speed: 1.0, weight: 1.1, bounce: 1.0, luck: 1.0 },
    { name: 'Beyaz Kar', color: '#EEEEFF', speed: 1.05, weight: 1.0, bounce: 1.1, luck: 0.95 },
    { name: 'Siyah Gece', color: '#444455', speed: 1.15, weight: 1.15, bounce: 0.85, luck: 0.9 },
    { name: 'Altın Yıldız', color: '#FFD700', speed: 1.0, weight: 1.0, bounce: 1.0, luck: 1.2 },
    { name: 'Gümüş Ok', color: '#C0C0D0', speed: 1.2, weight: 0.85, bounce: 1.05, luck: 0.95 },
    { name: 'Bakır Kalkan', color: '#CD7F32', speed: 0.9, weight: 1.2, bounce: 0.9, luck: 1.05 },
    { name: 'Zümrüt Taş', color: '#50C878', speed: 1.05, weight: 1.05, bounce: 0.95, luck: 1.05 },
    { name: 'Yakut Işık', color: '#E0115F', speed: 1.15, weight: 0.95, bounce: 1.1, luck: 0.85 },
    { name: 'Safir Rüya', color: '#0F52BA', speed: 1.0, weight: 1.0, bounce: 1.0, luck: 1.15 },
    { name: 'Ametist Güç', color: '#9966CC', speed: 1.05, weight: 1.1, bounce: 0.95, luck: 1.0 },
    { name: 'Opal Hayal', color: '#A8C3BC', speed: 0.95, weight: 0.95, bounce: 1.2, luck: 1.1 },
    { name: 'Lava Topu', color: '#FF4500', speed: 1.2, weight: 1.1, bounce: 0.85, luck: 0.85 },
    { name: 'Buz Kristal', color: '#88DDFF', speed: 1.0, weight: 0.9, bounce: 1.1, luck: 1.15 },
    { name: 'Orman Yeşili', color: '#228B22', speed: 0.95, weight: 1.15, bounce: 0.95, luck: 1.1 },
    { name: 'Gök Mavisi', color: '#87CEEB', speed: 1.1, weight: 0.95, bounce: 1.05, luck: 1.0 },
    { name: 'Kiraz Kırmızı', color: '#DC143C', speed: 1.1, weight: 1.0, bounce: 1.0, luck: 1.0 },
    { name: 'Neon Yeşil', color: '#39FF14', speed: 1.25, weight: 0.85, bounce: 1.0, luck: 0.8 },
];

// ============================================================
// UTILITIES
// ============================================================
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rnd(lo, hi) { return lo + Math.random() * (hi - lo); }
function dist(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); }
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function fmtTime(s) { const m = Math.floor(s / 60); const sec = s % 60; return `${String(m).padStart(2, '0')}:${sec.toFixed(2).padStart(5, '0')}`; }

// ============================================================
// PHYSICS HELPERS
// ============================================================
function closestPointOnSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { x: ax, y: ay };
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / lenSq, 0, 1);
    return { x: ax + t * dx, y: ay + t * dy };
}

function circleSegCollision(cx, cy, cr, ax, ay, bx, by) {
    const cp = closestPointOnSeg(cx, cy, ax, ay, bx, by);
    const dx = cx - cp.x, dy = cy - cp.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < cr && d > 0.001) {
        const nx = dx / d, ny = dy / d;
        return { nx, ny, depth: cr - d, px: cp.x, py: cp.y };
    }
    return null;
}

function circleCircleCol(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1, dy = y2 - y1;
    const d = Math.sqrt(dx * dx + dy * dy);
    const minD = r1 + r2;
    if (d < minD && d > 0.001) {
        const nx = dx / d, ny = dy / d;
        return { nx, ny, depth: minD - d };
    }
    return null;
}

// ============================================================
// TRACK WALL SEGMENTS (generated from path)
// ============================================================
function buildWallSegs(path) {
    const left = [], right = [];
    for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1];
        left.push({ x1: a.l, y1: a.y, x2: b.l, y2: b.y });
        right.push({ x1: a.r, y1: a.y, x2: b.r, y2: b.y });
    }
    return { left, right };
}

function getTrackBounds(path, y) {
    for (let i = 0; i < path.length - 1; i++) {
        if (y >= path[i].y && y <= path[i + 1].y) {
            const t = (y - path[i].y) / (path[i + 1].y - path[i].y || 1);
            return { l: lerp(path[i].l, path[i + 1].l, t), r: lerp(path[i].r, path[i + 1].r, t) };
        }
    }
    const last = path[path.length - 1];
    return { l: last.l, r: last.r };
}

// ============================================================
// AUDIO
// ============================================================
const Audio = {
    ctx: null, enabled: true,
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    tone(freq, dur, type, vol) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type || 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(vol || 0.12, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + dur);
    },
    beep() { this.tone(440, 0.2, 'sine', 0.18); },
    go() { this.tone(880, 0.3, 'sine', 0.2); setTimeout(() => this.tone(1320, 0.2, 'sine', 0.15), 150); },
    bounce() { this.tone(200 + Math.random() * 300, 0.08, 'triangle', 0.06); },
    finish() { [0, 80, 160, 240].forEach((d, i) => setTimeout(() => this.tone(523 + i * 130, 0.25, 'triangle', 0.12), d)); },
};

// ============================================================
// PARTICLE SYSTEM
// ============================================================
class Particles {
    constructor() { this.list = []; }
    emit(x, y, color, n) {
        for (let i = 0; i < n; i++) {
            this.list.push({
                x, y, vx: rnd(-80, 80), vy: rnd(-120, 20),
                life: 1, decay: rnd(1.5, 3), r: rnd(2, 5), color
            });
        }
    }
    update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const p = this.list[i];
            p.vy += 200 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= p.decay * dt;
            if (p.life <= 0) this.list.splice(i, 1);
        }
    }
    draw(ctx, camY) {
        for (const p of this.list) {
            ctx.globalAlpha = clamp(p.life, 0, 1);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y - camY, p.r * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    clear() { this.list = []; }
}

// ============================================================
// MARBLE CLASS
// ============================================================
class Marble {
    constructor(data, index, total) {
        this.name = data.name;
        this.color = data.color;
        this.speed = data.speed;
        this.weight = data.weight;
        this.bounciness = data.bounce;
        this.luck = data.luck;
        this.r = CFG.MARBLE_R;
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.finished = false;
        this.finishTime = null;
        this.position = 0;
        this.trail = [];
        this._cele = false;
    }

    placeAtStart(index, total, path) {
        const bounds = getTrackBounds(path, 30);
        const w = bounds.r - bounds.l;
        const cols = Math.min(total, 4);
        const rows = Math.ceil(total / cols);
        const col = index % cols;
        const row = Math.floor(index / cols);
        this.x = bounds.l + (col + 1) * (w / (cols + 1));
        this.y = 30 + row * (CFG.MARBLE_R * 3);
        this.vx = 0; this.vy = 0;
    }

    update(dt) {
        if (this.finished) return;
        const g = CFG.GRAVITY * this.speed * (1 + rnd(-CFG.SPEED_VAR, CFG.SPEED_VAR));
        this.vy += g * dt;
        this.vx *= CFG.FRICTION;
        this.vy *= CFG.FRICTION;
        const maxV = CFG.MAX_VEL;
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > maxV) { this.vx *= maxV / spd; this.vy *= maxV / spd; }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    addTrail() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();
    }

    reset(index, total, path) {
        this.finished = false;
        this.finishTime = null;
        this.position = 0;
        this.vx = 0; this.vy = 0;
        this.trail = [];
        this._cele = false;
        this.placeAtStart(index, total, path);
    }
}

// ============================================================
// RENDERER
// ============================================================
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.scale = this.canvas.width / CFG.WORLD_W;
        this.viewH = this.canvas.height / this.scale;
    }

    clear(bg1, bg2) {
        const ctx = this.ctx;
        const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, bg1);
        grad.addColorStop(1, bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    beginWorld(camY) {
        const ctx = this.ctx;
        ctx.save();
        ctx.scale(this.scale, this.scale);
        ctx.translate(0, -camY);
    }

    endWorld() { this.ctx.restore(); }

    drawTrack(path, wallColor, trackColor, camY) {
        const ctx = this.ctx;
        const top = camY - 50;
        const bot = camY + this.viewH + 50;

        // Track fill
        ctx.fillStyle = trackColor;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            if (p.y < top - 200 || p.y > bot + 200) continue;
            if (!started) { ctx.moveTo(p.l, p.y); started = true; }
            else ctx.lineTo(p.l, p.y);
        }
        for (let i = path.length - 1; i >= 0; i--) {
            const p = path[i];
            if (p.y < top - 200 || p.y > bot + 200) continue;
            ctx.lineTo(p.r, p.y);
        }
        ctx.closePath();
        ctx.fill();

        // Walls
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = wallColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            if (p.y < top - 200 || p.y > bot + 200) continue;
            if (i === 0 || path[i - 1].y < top - 200) ctx.moveTo(p.l, p.y);
            else ctx.lineTo(p.l, p.y);
        }
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            if (p.y < top - 200 || p.y > bot + 200) continue;
            if (i === 0 || path[i - 1].y < top - 200) ctx.moveTo(p.r, p.y);
            else ctx.lineTo(p.r, p.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawObstacles(obstacles, camY, wallColor) {
        const ctx = this.ctx;
        const top = camY - 50, bot = camY + this.viewH + 50;
        for (const o of obstacles) {
            const oy = o.type === 'bar' ? Math.min(o.y1, o.y2) : o.y;
            if (oy < top - 50 || oy > bot + 50) continue;

            if (o.type === 'peg') {
                ctx.fillStyle = wallColor;
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (o.type === 'bumper') {
                const grad = ctx.createRadialGradient(o.x - 3, o.y - 3, 2, o.x, o.y, o.r);
                grad.addColorStop(0, '#ff8888');
                grad.addColorStop(1, '#cc3333');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ff6666';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (o.type === 'bar') {
                ctx.strokeStyle = wallColor;
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(o.x1, o.y1);
                ctx.lineTo(o.x2, o.y2);
                ctx.stroke();
                ctx.lineCap = 'butt';
            }
        }
    }

    drawStartFinish(startY, finishY, trackPath) {
        const ctx = this.ctx;
        const bs = getTrackBounds(trackPath, startY);
        const bf = getTrackBounds(trackPath, finishY);

        // Start line
        ctx.strokeStyle = '#44ff44';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(bs.l, startY);
        ctx.lineTo(bs.r, startY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 18px "Russo One", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BAŞLANGIÇ', (bs.l + bs.r) / 2, startY - 10);

        // Finish line
        const fw = bf.r - bf.l;
        const cells = 12;
        const cellW = fw / cells;
        for (let i = 0; i < cells; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#222222';
            ctx.fillRect(bf.l + i * cellW, finishY - 4, cellW, 8);
        }
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 18px "Russo One", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BİTİŞ', (bf.l + bf.r) / 2, finishY + 25);
    }

    drawMarble(m, showTrail) {
        const ctx = this.ctx;

        // Trail
        if (showTrail && m.trail.length > 1) {
            ctx.strokeStyle = m.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(m.trail[0].x, m.trail[0].y);
            for (let i = 1; i < m.trail.length; i++) {
                ctx.lineTo(m.trail[i].x, m.trail[i].y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(m.x + 2, m.y + 3, m.r, m.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Marble body gradient
        const grad = ctx.createRadialGradient(m.x - m.r * 0.3, m.y - m.r * 0.3, m.r * 0.1, m.x, m.y, m.r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, m.color);
        grad.addColorStop(1, darkenColor(m.color, 0.4));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();

        // Rim
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(m.x - m.r * 0.25, m.y - m.r * 0.25, m.r * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMarbleLabel(m) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const tw = ctx.measureText(m.name).width;
        const pad = 4;
        const lx = m.x - tw / 2 - pad;
        const ly = m.y - m.r - 18;
        ctx.fillRect(lx, ly, tw + pad * 2, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Exo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.name, m.x, ly + 8);
    }
}

function darkenColor(hex, factor) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.floor(r * factor);
    g = Math.floor(g * factor);
    b = Math.floor(b * factor);
    return `rgb(${r},${g},${b})`;
}

// ============================================================
// GAME
// ============================================================
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.particles = new Particles();
        this.state = 'menu';
        this.marbles = [];
        this.trackData = null;
        this.wallSegs = null;
        this.selectedTrack = TRACKS[0];
        this.selectedCount = CFG.DEFAULT_COUNT;
        this.selectedMarbles = [];
        this.camY = 0;
        this.raceTime = 0;
        this.raceFinished = false;
        this.finishTimer = 0;
        this.countdownTime = 0;
        this.raceSpeed = 1;
        this.showTrails = true;
        this._lastCd = -1;
        this._dustT = 0;
        this.tournament = { on: false, round: 0, total: 0, scores: {}, courses: [], marbleData: [] };
        this.lastT = performance.now();
        this.setupUI();
        Audio.init();
        this.loop();
    }

    // ---- UI ----
    setupUI() {
        document.addEventListener('click', () => Audio.resume(), { once: true });
        const $ = id => document.getElementById(id);
        $('btn-quick-race').onclick = () => { this.showScreen('setup'); this.populateSetup(); };
        $('btn-tournament').onclick = () => this.startTournament();
        $('btn-auto-race').onclick = () => this.startAutoRace();
        $('btn-settings').onclick = () => this.showScreen('settings');
        $('btn-back-settings').onclick = () => { this.applySettings(); this.showScreen('menu'); };
        $('btn-back-menu').onclick = () => this.showScreen('menu');
        $('btn-start-race').onclick = () => this.startRace();
        $('racer-count-slider').oninput = e => {
            this.selectedCount = +e.target.value;
            $('racer-count-display').textContent = this.selectedCount;
            this.refreshMarblePrev();
        };
        $('btn-shuffle-racers').onclick = () => this.refreshMarblePrev();
        $('btn-replay').onclick = () => this.replayRace();
        $('btn-new-race').onclick = () => { this.showScreen('setup'); this.populateSetup(); };
        $('btn-back-menu2').onclick = () => { this.cleanup(); this.showScreen('menu'); };
        $('btn-skip-race').onclick = () => this.skipRace();
        $('btn-next-tournament-race').onclick = () => this.nextTournamentRace();
        $('btn-end-tournament').onclick = () => { this.cleanup(); this.tournament.on = false; this.showScreen('menu'); };
    }

    showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const map = { menu: 'menu-screen', setup: 'setup-screen', settings: 'settings-screen', race: 'race-hud', results: 'results-screen', tournament: 'tournament-screen' };
        if (map[name]) document.getElementById(map[name]).classList.add('active');
        this.state = name;
    }

    populateSetup() {
        const cl = document.getElementById('course-list');
        cl.innerHTML = '';
        TRACKS.forEach(t => {
            const c = document.createElement('div');
            c.className = 'course-card' + (t === this.selectedTrack ? ' selected' : '');
            c.innerHTML = `<h4>${t.name}</h4><p>${t.desc}</p><div class="course-stats"><span>Zorluk: ${'★'.repeat(t.difficulty)}${'☆'.repeat(5 - t.difficulty)}</span><span>${t.lengthLabel}</span></div>`;
            c.onclick = () => { document.querySelectorAll('.course-card').forEach(x => x.classList.remove('selected')); c.classList.add('selected'); this.selectedTrack = t; };
            cl.appendChild(c);
        });
        this.refreshMarblePrev();
    }

    refreshMarblePrev() {
        this.selectedMarbles = shuffle(MARBLE_DB).slice(0, this.selectedCount);
        const pv = document.getElementById('racer-preview');
        pv.innerHTML = '';
        this.selectedMarbles.forEach(m => {
            const b = document.createElement('div');
            b.className = 'racer-badge';
            b.innerHTML = `<span class="racer-color-dot" style="background:${m.color}"></span><span>${m.name}</span>`;
            pv.appendChild(b);
        });
    }

    applySettings() {
        this.raceSpeed = parseFloat(document.getElementById('race-speed').value);
        Audio.enabled = document.getElementById('sound-toggle').checked;
        this.showTrails = document.getElementById('trail-toggle').checked;
    }

    // ---- RACE ----
    startRace() {
        this.cleanup();
        this.trackData = this.selectedTrack.data;
        this.wallSegs = buildWallSegs(this.trackData.path);
        this.marbles = this.selectedMarbles.map((d, i) => {
            const m = new Marble(d, i, this.selectedMarbles.length);
            m.placeAtStart(i, this.selectedMarbles.length, this.trackData.path);
            return m;
        });
        this.camY = 0;
        this.raceTime = 0;
        this.raceFinished = false;
        this.finishTimer = 0;
        this.countdownTime = CFG.COUNTDOWN_SECS + 1;
        this._lastCd = -1;
        this.showScreen('race');
        document.getElementById('course-name-hud').textContent = this.selectedTrack.name;
        document.getElementById('countdown-overlay').classList.remove('hidden');
        this.setupProgressBar();
        this.state = 'countdown';
    }

    setupProgressBar() {
        const tr = document.getElementById('progress-bar-track');
        tr.innerHTML = '<div class="progress-flag">🏁</div>';
        this.marbles.forEach(m => {
            const d = document.createElement('div');
            d.className = 'progress-dot';
            d.style.backgroundColor = m.color;
            d.dataset.name = m.name;
            tr.appendChild(d);
        });
    }

    cleanup() {
        this.marbles = [];
        this.trackData = null;
        this.wallSegs = null;
        this.particles.clear();
        const b = document.querySelector('.finish-banner');
        if (b) b.remove();
    }

    replayRace() {
        if (!this.trackData) return;
        this.marbles.forEach((m, i) => m.reset(i, this.marbles.length, this.trackData.path));
        this.particles.clear();
        this.raceTime = 0;
        this.raceFinished = false;
        this.finishTimer = 0;
        this.countdownTime = CFG.COUNTDOWN_SECS + 1;
        this._lastCd = -1;
        this.camY = 0;
        this.showScreen('race');
        document.getElementById('countdown-overlay').classList.remove('hidden');
        this.setupProgressBar();
        this.state = 'countdown';
    }

    skipRace() {
        this.marbles.forEach(m => {
            if (!m.finished) { m.finished = true; m.finishTime = this.raceTime + Math.random() * 2; m.y = this.trackData.length; }
        });
        this.raceFinished = true;
        this.showResults();
    }

    startAutoRace() {
        this.selectedTrack = TRACKS[Math.floor(Math.random() * TRACKS.length)];
        this.selectedCount = 8;
        this.selectedMarbles = shuffle(MARBLE_DB).slice(0, 8);
        this.startRace();
    }

    startTournament() {
        const t = this.tournament;
        t.on = true;
        t.round = 0;
        t.total = TRACKS.length;
        t.courses = shuffle([...TRACKS]);
        t.marbleData = shuffle(MARBLE_DB).slice(0, 8);
        t.scores = {};
        t.marbleData.forEach(m => { t.scores[m.name] = 0; });
        this.selectedMarbles = t.marbleData;
        this.selectedCount = 8;
        this.selectedTrack = t.courses[0];
        document.getElementById('btn-next-tournament-race').style.display = '';
        this.startRace();
    }

    nextTournamentRace() {
        const t = this.tournament;
        t.round++;
        if (t.round >= t.total) { this.showTournamentFinal(); return; }
        this.selectedTrack = t.courses[t.round];
        this.startRace();
    }

    showTournamentStandings() {
        const t = this.tournament;
        const div = document.getElementById('tournament-standings');
        div.innerHTML = '';
        const sorted = Object.entries(t.scores).sort((a, b) => b[1] - a[1]);
        sorted.forEach(([name, pts], i) => {
            const d = t.marbleData.find(m => m.name === name);
            const row = document.createElement('div');
            row.className = 'tournament-row';
            row.innerHTML = `<span class="t-pos">${i + 1}.</span><span class="t-color" style="background:${d.color}"></span><span class="t-name">${name}</span><span class="t-points">${pts} puan</span>`;
            div.appendChild(row);
        });
        document.getElementById('tournament-race-info').textContent = `Yarış ${t.round + 1} / ${t.total} tamamlandı`;
        this.showScreen('tournament');
    }

    showTournamentFinal() {
        document.getElementById('btn-next-tournament-race').style.display = 'none';
        document.getElementById('tournament-race-info').textContent = 'Turnuva Tamamlandı!';
        this.showTournamentStandings();
    }

    showResults() {
        const sorted = [...this.marbles].sort((a, b) => {
            if (a.finishTime == null && b.finishTime == null) return b.y - a.y;
            if (a.finishTime == null) return 1;
            if (b.finishTime == null) return -1;
            return a.finishTime - b.finishTime;
        });
        const wt = sorted[0].finishTime || 0;

        if (this.tournament.on) {
            const pts = [25, 18, 15, 12, 10, 8, 6, 4, 3, 2, 1, 0];
            sorted.forEach((m, i) => { if (this.tournament.scores[m.name] !== undefined) this.tournament.scores[m.name] += (pts[i] || 0); });
        }

        // Podium
        const podium = document.getElementById('results-podium');
        podium.innerHTML = '';
        [1, 0, 2].forEach(idx => {
            if (idx >= sorted.length) return;
            const m = sorted[idx];
            const p = document.createElement('div');
            p.className = `podium-place podium-${idx + 1}`;
            p.innerHTML = `<div class="podium-avatar" style="background:${m.color};border-color:${['var(--gold)', 'var(--silver)', 'var(--bronze)'][idx]}"></div><div class="podium-name">${m.name}</div><div class="podium-time">${m.finishTime ? fmtTime(m.finishTime) : 'DNF'}</div><div class="podium-block">${idx + 1}</div>`;
            podium.appendChild(p);
        });

        // Table
        const tbl = document.getElementById('results-table');
        tbl.innerHTML = '';
        sorted.forEach((m, i) => {
            const cls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            const diff = m.finishTime && wt ? `+${(m.finishTime - wt).toFixed(2)}s` : '';
            const row = document.createElement('div');
            row.className = `result-row ${cls}`;
            row.innerHTML = `<span class="result-pos">${i + 1}</span><span class="result-color" style="background:${m.color}"></span><span class="result-name">${m.name}</span><span class="result-time">${m.finishTime ? fmtTime(m.finishTime) : 'DNF'}</span><span class="result-diff">${i === 0 ? '' : diff}</span>`;
            tbl.appendChild(row);
        });

        if (this.tournament.on) this.showTournamentStandings();
        else this.showScreen('results');
    }

    updateHUD() {
        document.getElementById('race-timer').textContent = fmtTime(this.raceTime);
        const sorted = [...this.marbles].sort((a, b) => b.y - a.y);
        const posDiv = document.getElementById('hud-positions');
        posDiv.innerHTML = '';
        sorted.forEach((m, i) => {
            const pct = this.trackData ? Math.round((m.y / this.trackData.length) * 100) : 0;
            const row = document.createElement('div');
            row.className = 'hud-position-row' + (i === 0 ? ' first' : '');
            row.innerHTML = `<span class="pos-num">${i + 1}</span><span class="pos-color" style="background:${m.color}"></span><span class="pos-name">${m.name}</span><span class="pos-progress">${m.finished ? '🏁' : pct + '%'}</span>`;
            posDiv.appendChild(row);
        });
        // Progress dots
        document.querySelectorAll('.progress-dot').forEach(dot => {
            const m = this.marbles.find(x => x.name === dot.dataset.name);
            if (m && this.trackData) dot.style.left = clamp(m.y / this.trackData.length * 100, 0, 98) + '%';
        });
    }

    // ---- PHYSICS STEP ----
    physicsStep(dt) {
        if (!this.trackData) return;
        const { path, obstacles, length } = this.trackData;
        const walls = this.wallSegs;

        for (const m of this.marbles) {
            if (m.finished) continue;
            m.update(dt);

            // Wall collisions
            const allSegs = [...walls.left, ...walls.right];
            for (const seg of allSegs) {
                const c = circleSegCollision(m.x, m.y, m.r, seg.x1, seg.y1, seg.x2, seg.y2);
                if (c) {
                    m.x += c.nx * c.depth;
                    m.y += c.ny * c.depth;
                    const dot = m.vx * c.nx + m.vy * c.ny;
                    if (dot < 0) {
                        const bounce = CFG.WALL_BOUNCE * m.bounciness;
                        m.vx -= (1 + bounce) * dot * c.nx;
                        m.vy -= (1 + bounce) * dot * c.ny;
                        m.vx += rnd(-10, 10) * m.luck;
                    }
                }
            }

            // Obstacle collisions
            for (const o of obstacles) {
                if (o.type === 'peg' || o.type === 'bumper') {
                    const c = circleCircleCol(m.x, m.y, m.r, o.x, o.y, o.r);
                    if (c) {
                        m.x -= c.nx * c.depth;
                        m.y -= c.ny * c.depth;
                        const dot = m.vx * c.nx + m.vy * c.ny;
                        if (dot > 0) {
                            const bounce = (o.type === 'bumper' ? 1.2 : 0.8) * m.bounciness;
                            m.vx -= (1 + bounce) * dot * c.nx;
                            m.vy -= (1 + bounce) * dot * c.ny;
                            m.vx += rnd(-15, 15) * m.luck;
                            Audio.bounce();
                        }
                    }
                } else if (o.type === 'bar') {
                    const c = circleSegCollision(m.x, m.y, m.r, o.x1, o.y1, o.x2, o.y2);
                    if (c) {
                        m.x += c.nx * c.depth;
                        m.y += c.ny * c.depth;
                        const dot = m.vx * c.nx + m.vy * c.ny;
                        if (dot < 0) {
                            m.vx -= (1 + CFG.WALL_BOUNCE * m.bounciness) * dot * c.nx;
                            m.vy -= (1 + CFG.WALL_BOUNCE * m.bounciness) * dot * c.ny;
                        }
                    }
                }
            }

            // Finish check
            if (m.y >= length && !m.finished) {
                m.finished = true;
                m.finishTime = this.raceTime;
            }
        }

        // Marble-marble collisions
        for (let i = 0; i < this.marbles.length; i++) {
            for (let j = i + 1; j < this.marbles.length; j++) {
                const a = this.marbles[i], b = this.marbles[j];
                if (a.finished && b.finished) continue;
                const c = circleCircleCol(a.x, a.y, a.r, b.x, b.y, b.r);
                if (c) {
                    const totalW = a.weight + b.weight;
                    const wa = b.weight / totalW, wb = a.weight / totalW;
                    a.x -= c.nx * c.depth * wa;
                    a.y -= c.ny * c.depth * wa;
                    b.x += c.nx * c.depth * wb;
                    b.y += c.ny * c.depth * wb;
                    const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
                    const dot = dvx * c.nx + dvy * c.ny;
                    if (dot > 0) {
                        const bounce = CFG.MARBLE_BOUNCE;
                        a.vx -= (1 + bounce) * dot * c.nx * wa;
                        a.vy -= (1 + bounce) * dot * c.ny * wa;
                        b.vx += (1 + bounce) * dot * c.nx * wb;
                        b.vy += (1 + bounce) * dot * c.ny * wb;
                    }
                }
            }
        }
    }

    // ---- CAMERA ----
    updateCamera(dt) {
        if (!this.marbles.length || !this.trackData) return;
        const sorted = [...this.marbles].sort((a, b) => b.y - a.y);
        const top4 = sorted.slice(0, Math.min(4, sorted.length));
        const avgY = top4.reduce((s, m) => s + m.y, 0) / top4.length;
        const targetY = avgY - this.renderer.viewH * 0.35;
        this.camY = lerp(this.camY, targetY, 1 - Math.exp(-4 * dt));
    }

    // ---- MAIN LOOP ----
    loop() {
        requestAnimationFrame(() => this.loop());
        const now = performance.now();
        let dt = Math.min((now - this.lastT) / 1000, 0.05);
        this.lastT = now;

        // Always render background
        if (this.state === 'menu' || this.state === 'setup' || this.state === 'settings' || this.state === 'results' || this.state === 'tournament') {
            this.renderer.clear('#0a0a2e', '#162050');
            return;
        }

        if (!this.trackData) return;
        const track = this.selectedTrack;

        if (this.state === 'countdown') {
            this.countdownTime -= dt;
            const ct = document.getElementById('countdown-text');
            const co = document.getElementById('countdown-overlay');
            const num = Math.ceil(this.countdownTime - 1);
            if (this.countdownTime > 1) {
                if (this._lastCd !== num) { this._lastCd = num; Audio.beep(); }
                ct.textContent = num;
                ct.style.animation = 'none'; ct.offsetHeight; ct.style.animation = 'countdownPop .5s ease-out';
            } else if (this.countdownTime > 0) {
                if (this._lastCd !== 0) { this._lastCd = 0; Audio.go(); }
                ct.textContent = 'BAŞLA!';
                ct.style.color = 'var(--success)';
                ct.style.fontSize = '6rem';
            } else {
                co.classList.add('hidden');
                ct.style.color = '#fff';
                ct.style.fontSize = '12rem';
                this.state = 'racing';
            }
            this.renderFrame(track);
            return;
        }

        if (this.state === 'racing') {
            const sDt = dt * this.raceSpeed;
            this.raceTime += sDt;
            const subDt = sDt / CFG.SUB_STEPS;
            for (let s = 0; s < CFG.SUB_STEPS; s++) this.physicsStep(subDt);

            // Trails
            this._dustT += sDt;
            if (this._dustT > 0.05) {
                this._dustT = 0;
                this.marbles.forEach(m => { if (!m.finished) m.addTrail(); });
            }

            // Finish particles
            this.marbles.forEach(m => {
                if (m.finished && !m._cele) {
                    m._cele = true;
                    this.particles.emit(m.x, m.y, m.color, 20);
                    if (m.position === 0 && !document.querySelector('.finish-banner')) {
                        Audio.finish();
                        const banner = document.createElement('div');
                        banner.className = 'finish-banner';
                        banner.textContent = `🏆 ${m.name} 🏆`;
                        document.body.appendChild(banner);
                        setTimeout(() => banner.remove(), 3000);
                    }
                }
            });

            // Positions
            const sorted = [...this.marbles].sort((a, b) => b.y - a.y);
            sorted.forEach((m, i) => { m.position = i; });

            // All finished?
            if (this.marbles.every(m => m.finished) && !this.raceFinished) {
                this.raceFinished = true;
                this.finishTimer = CFG.FINISH_DELAY;
            }
            if (this.raceFinished) {
                this.finishTimer -= sDt;
                if (this.finishTimer <= 0) this.showResults();
            }

            // DNF
            const anyDone = this.marbles.some(m => m.finished);
            if (anyDone) {
                const wt = this.marbles.filter(m => m.finished).reduce((mn, m) => Math.min(mn, m.finishTime), Infinity);
                this.marbles.forEach(m => { if (!m.finished && this.raceTime > wt * 3) { m.finished = true; m.finishTime = this.raceTime; } });
            }

            this.particles.update(sDt);
            this.updateCamera(dt);
            this.updateHUD();
        }

        this.renderFrame(track);
    }

    renderFrame(track) {
        const r = this.renderer;
        r.clear(track.bg1, track.bg2);
        r.beginWorld(this.camY);
        r.drawTrack(this.trackData.path, track.wallColor, track.trackColor, this.camY);
        r.drawObstacles(this.trackData.obstacles, this.camY, track.wallColor);
        r.drawStartFinish(0, this.trackData.length, this.trackData.path);

        // Sort marbles by Y for draw order
        const sorted = [...this.marbles].sort((a, b) => a.y - b.y);
        sorted.forEach(m => r.drawMarble(m, this.showTrails));
        sorted.forEach(m => r.drawMarbleLabel(m));

        this.particles.draw(r.ctx, this.camY);
        r.endWorld();
    }
}

// ============================================================
// START
// ============================================================
window.addEventListener('DOMContentLoaded', () => new Game());
