import { PhysicsEngine } from './src/physics/engine.js';
import { Marble } from './src/physics/marble.js';
import { Renderer } from './src/render/renderer.js';
import { buildTrack, LEVELS } from './src/procedural/track.js';
import { MarbleAI } from './src/ai/behavior.js';
import { TouchController } from './src/mobile/touch.js';
import { PerformanceMonitor, setupVisibilityHandler } from './src/mobile/performance.js';
import { AudioEngine } from './src/audio/audio.js';

const NAMES = [
    'Crimson','Emerald','Sapphire','Amber','Violet','Cyan','Coral','Lime',
    'Indigo','Rose','Teal','Gold','Scarlet','Azure','Orchid','Ruby',
    'Jade','Cobalt','Tangerine','Magenta','Flame','Forest','Ocean','Sunset',
    'Nebula','Arctic','Peach','Mint','Storm','Lava','Blaze','Frost',
];
const AI_TYPES = ['aggressive','balanced','safe','random'];
const SAVE_KEY = 'marble-race-progress';

class MarbleRaceApp {
    constructor() {
        this.initialized = false;
        this.canvas = null;
        this.engine = null;
        this.renderer = null;
        this.audio = new AudioEngine();
        this.perf = new PerformanceMonitor();
        this.touch = null;
        this.ais = [];
        this.state = 'menu';
        this.raceTimer = 0;
        this.countdownTimer = 0;
        this.finishY = 0;
        this.trackBounds = null;
        this.rankings = [];
        this.nextRank = 1;
        this.currentLevel = 1;
        this.unlockedLevel = 1;
        this.customMarbleCount = 0;
        this.lastFrameTime = 0;
        this.running = false;
        this.paused = false;
        this.dpr = 1;
        this.showFPS = false;
        this.levelSelectScroll = 0;
        this.sliderDragging = false;
        this.loadProgress();
    }

    loadProgress() {
        try {
            const d = JSON.parse(localStorage.getItem(SAVE_KEY));
            if (d && d.unlocked) this.unlockedLevel = Math.min(d.unlocked, 50);
            if (d && d.customMarbles) this.customMarbleCount = d.customMarbles;
        } catch (e) {}
    }

    saveProgress() {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify({ unlocked: this.unlockedLevel, customMarbles: this.customMarbleCount })); } catch (e) {}
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) return;

        this.engine = new PhysicsEngine();
        this.renderer = new Renderer(this.canvas);
        this.setupCanvas();

        this.touch = new TouchController(this.canvas, this.renderer.camera);
        this.touch.onTap = (x, y) => this.handleTap(x, y);

        setupVisibilityHandler(
            () => { this.paused = false; },
            () => { this.paused = true; }
        );
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.trackBounds) this.renderer.camera.setTrackBounds(this.trackBounds);
        });

        this.state = 'menu';
        this.running = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame(t => this.gameLoop(t));
    }

    setupCanvas() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth, h = window.innerHeight;
        this.canvas.width = Math.floor(w * this.dpr);
        this.canvas.height = Math.floor(h * this.dpr);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        if (this.renderer) this.renderer.resize(this.canvas.width, this.canvas.height);
    }

    getMarbleCount(levelCfg) {
        return this.customMarbleCount > 0 ? this.customMarbleCount : levelCfg.marbles;
    }

    getMarbleRadius(count) {
        if (count <= 20) return 9;
        if (count <= 50) return 7;
        if (count <= 100) return 5;
        if (count <= 300) return 3.5;
        if (count <= 600) return 2.5;
        return 2;
    }

    loadLevel(levelNum) {
        this.currentLevel = levelNum;
        const cfg = { ...LEVELS[levelNum - 1] };
        const mc = this.getMarbleCount(cfg);
        cfg.marbles = mc;

        if (mc > 50) {
            cfg.trackWidth = Math.max(cfg.trackWidth, 500);
        }

        this.engine = new PhysicsEngine();
        this.ais = [];
        this.rankings = [];
        this.nextRank = 1;
        this.raceTimer = 0;

        const trackData = buildTrack(this.engine, this.renderer, cfg);
        this.finishY = trackData.finishY;
        this.trackBounds = trackData.bounds;

        const radius = this.getMarbleRadius(mc);
        const useAI = mc <= 50;

        for (let i = 0; i < mc; i++) {
            const pos = trackData.startPositions[i] || { x: (Math.random() - 0.5) * (cfg.trackWidth - 30), y: 25 + (i * 5) % 60 };
            const color = this.renderer.getMarbleColor(i);
            const marble = new Marble(pos.x, pos.y, radius, {
                color, glowColor: color,
                name: NAMES[i % NAMES.length],
                aiType: AI_TYPES[i % AI_TYPES.length],
            });
            this.engine.addMarble(marble);
            if (useAI) this.ais.push(new MarbleAI(marble, marble.aiType));
        }

        this.engine.paused = true;
        this.renderer.camera.setMode('static');
        this.renderer.camera.setTrackBounds(this.trackBounds);
        this.state = 'ready';
    }

    startCountdown() {
        this.state = 'countdown';
        this.countdownTimer = 2;
        this.engine.paused = true;
    }

    handleTap(screenX, screenY) {
        const w = this.canvas.width, h = this.canvas.height, d = this.dpr;

        if (this.state === 'menu') {
            this.handleMenuTap(screenX, screenY);
            return;
        }
        if (this.state === 'ready') {
            this.startCountdown();
            return;
        }
        if (this.state === 'finished') {
            const cx = w / 2;
            const btnW = 160 * d, btnH = 42 * d;
            const baseY = h * 0.55;
            const btns = [baseY, baseY + btnH + 14 * d, baseY + (btnH + 14 * d) * 2];
            for (let i = 0; i < btns.length; i++) {
                const by = btns[i];
                if (screenX > cx - btnW && screenX < cx + btnW && screenY > by - btnH / 2 && screenY < by + btnH / 2) {
                    if (i === 0) { if (this.currentLevel < 50) this.loadLevel(this.currentLevel + 1); else this.state = 'menu'; }
                    if (i === 1) this.loadLevel(this.currentLevel);
                    if (i === 2) this.state = 'menu';
                    return;
                }
            }
        }
    }

    handleMenuTap(sx, sy) {
        const d = this.dpr, w = this.canvas.width, h = this.canvas.height;

        const sliderY = 68 * d;
        const sliderX = w * 0.15;
        const sliderW = w * 0.7;
        if (sy >= sliderY - 20 * d && sy <= sliderY + 20 * d && sx >= sliderX && sx <= sliderX + sliderW) {
            const t = Math.max(0, Math.min(1, (sx - sliderX) / sliderW));
            this.customMarbleCount = Math.round(t * 999) + 1;
            this.saveProgress();
            return;
        }

        const resetBtnX = sliderX + sliderW + 10 * d;
        if (sy >= sliderY - 15 * d && sy <= sliderY + 15 * d && sx >= resetBtnX && sx <= resetBtnX + 40 * d) {
            this.customMarbleCount = 0;
            this.saveProgress();
            return;
        }

        const cols = Math.min(5, Math.floor(w / (70 * d)));
        const cellW = 60 * d, cellH = 55 * d, gap = 8 * d;
        const startY = 100 * d;
        const totalW = cols * (cellW + gap) - gap;
        const startX = (w - totalW) / 2;

        for (let i = 0; i < 50; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const x = startX + col * (cellW + gap);
            const y = startY + row * (cellH + gap) - this.levelSelectScroll;
            if (sx >= x && sx <= x + cellW && sy >= y && sy <= y + cellH) {
                if (i + 1 <= this.unlockedLevel) {
                    this.audio.init();
                    this.loadLevel(i + 1);
                }
                return;
            }
        }
    }

    gameLoop(timestamp) {
        if (!this.running) return;
        this.perf.startFrame();
        const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
        this.lastFrameTime = timestamp;
        if (!this.paused) { this.update(dt); this.render(); }
        requestAnimationFrame(t => this.gameLoop(t));
    }

    update(dt) {
        if (this.state === 'menu') return;

        if (this.state === 'countdown') {
            this.countdownTimer -= dt;
            if (this.countdownTimer <= 0) { this.state = 'racing'; this.engine.paused = false; }
            this.renderer.camera.update(dt, this.engine.marbles);
            return;
        }
        if (this.state !== 'racing') {
            this.renderer.camera.update(dt, this.engine.marbles);
            return;
        }

        this.raceTimer += dt;
        this.engine.update(dt);
        for (const ai of this.ais) ai.update(dt, this.engine.time, this.engine);

        for (const m of this.engine.marbles) {
            if (!m.alive) continue;
            if (this.engine.marbles.length <= 100) m.updateTrail();

            if (this.trackBounds) {
                const b = this.trackBounds, r = m.radius;
                if (m.x - r < b.minX) { m.x = b.minX + r; m.vx = Math.abs(m.vx) * 0.4; }
                if (m.x + r > b.maxX) { m.x = b.maxX - r; m.vx = -Math.abs(m.vx) * 0.4; }
                if (m.y - r < b.minY) { m.y = b.minY + r; m.vy = Math.abs(m.vy) * 0.3; }
                if (m.y + r > b.maxY) { m.y = b.maxY - r; m.vy = -Math.abs(m.vy) * 0.3; }
            }

            if (!m.finished && m.y >= this.finishY) {
                m.finished = true;
                m.finishTime = this.raceTimer;
                m.rank = this.nextRank++;
                this.rankings.push(m);
                if (m.rank === 1) this.audio.playFinish(1);
            }
        }

        const active = this.engine.marbles.filter(m => m.alive && !m.finished);
        if (active.length === 0) {
            for (const m of this.engine.marbles) {
                if (!m.finished) { m.finished = true; m.finishTime = this.raceTimer; m.rank = this.nextRank++; this.rankings.push(m); }
            }
            this.state = 'finished';
            if (this.currentLevel >= this.unlockedLevel && this.currentLevel < 50) {
                this.unlockedLevel = this.currentLevel + 1;
                this.saveProgress();
            }
        }

        this.renderer.camera.update(dt, this.engine.marbles);
    }

    render() {
        const ctx = this.renderer.ctx;
        const w = this.canvas.width, h = this.canvas.height, d = this.dpr;

        if (this.state === 'menu') { this.renderMenu(ctx, w, h, d); return; }

        ctx.save();
        this.renderer.render(this.engine, 0);
        ctx.restore();

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const mc = this.engine.marbles.length;
        ctx.font = `bold ${11 * d}px system-ui`;
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Lv.${this.currentLevel} - ${LEVELS[this.currentLevel - 1].name} (${mc} tops)`, 8 * d, 6 * d);

        if (this.state === 'ready') {
            ctx.font = `bold ${26 * d}px system-ui`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText('TAP TO START', w / 2, h / 2 - 15 * d);
            ctx.font = `${13 * d}px system-ui`;
            ctx.fillStyle = '#aaa';
            ctx.fillText(`${mc} marbles`, w / 2, h / 2 + 15 * d);
        }

        if (this.state === 'countdown') {
            const num = Math.ceil(this.countdownTimer);
            ctx.font = `bold ${90 * d}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(num > 0 ? String(num) : 'GO!', w / 2, h / 2);
        }

        if (this.state === 'racing') {
            ctx.font = `bold ${13 * d}px system-ui`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`${this.raceTimer.toFixed(1)}s`, 8 * d, 20 * d);
            ctx.fillText(`${this.rankings.length}/${mc} finished`, 8 * d, 36 * d);
            if (mc <= 100) this.renderStandings(ctx, w, h, d);
        }

        if (this.state === 'finished') this.renderResults(ctx, w, h, d);

        if (this.showFPS) {
            ctx.font = `${10 * d}px monospace`;
            ctx.fillStyle = '#4f4';
            ctx.textAlign = 'right';
            ctx.fillText(`${this.perf.getFPS()} FPS`, w - 6 * d, 6 * d);
        }
    }

    renderMenu(ctx, w, h, d) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#0c0c20';
        ctx.fillRect(0, 0, w, h);

        ctx.font = `bold ${26 * d}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('MARBLE RACE', w / 2, 30 * d);

        const sliderY = 68 * d;
        const sliderX = w * 0.12;
        const sliderW = w * 0.65;
        const mc = this.customMarbleCount;
        const label = mc > 0 ? `${mc} tops` : 'Default';

        ctx.font = `${11 * d}px system-ui`;
        ctx.fillStyle = '#999';
        ctx.textAlign = 'left';
        ctx.fillText('Top sayısı:', sliderX, sliderY - 14 * d);

        ctx.fillStyle = '#222';
        ctx.fillRect(sliderX, sliderY - 3 * d, sliderW, 6 * d);
        if (mc > 0) {
            const t = (mc - 1) / 999;
            ctx.fillStyle = '#4466cc';
            ctx.beginPath();
            ctx.arc(sliderX + t * sliderW, sliderY, 8 * d, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.font = `bold ${13 * d}px system-ui`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(label, sliderX + sliderW + 12 * d, sliderY - 5 * d);

        if (mc > 0) {
            const resetX = sliderX + sliderW + 12 * d;
            const resetY = sliderY + 8 * d;
            ctx.font = `${9 * d}px system-ui`;
            ctx.fillStyle = '#666';
            ctx.fillText('(tap to reset)', resetX, resetY);
        }

        const cols = Math.min(5, Math.floor(w / (68 * d)));
        const cellW = 58 * d, cellH = 52 * d, gap = 7 * d;
        const startY = 95 * d;
        const totalW = cols * (cellW + gap) - gap;
        const startX = (w - totalW) / 2;

        for (let i = 0; i < 50; i++) {
            const lvl = i + 1;
            const col = i % cols, row = Math.floor(i / cols);
            const x = startX + col * (cellW + gap);
            const y = startY + row * (cellH + gap) - this.levelSelectScroll;
            if (y + cellH < 0 || y > h) continue;

            const unlocked = lvl <= this.unlockedLevel;
            const completed = lvl < this.unlockedLevel;

            ctx.fillStyle = completed ? '#132213' : unlocked ? '#151530' : '#0e0e14';
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, cellW, cellH, 7 * d);
            else ctx.rect(x, y, cellW, cellH);
            ctx.fill();
            ctx.strokeStyle = completed ? '#2a6a2a' : unlocked ? '#333366' : '#1a1a22';
            ctx.lineWidth = d;
            ctx.stroke();

            ctx.font = `bold ${16 * d}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = unlocked ? '#fff' : '#444';
            ctx.fillText(unlocked ? String(lvl) : '🔒', x + cellW / 2, y + cellH / 2 - 3 * d);

            if (completed) {
                ctx.font = `${9 * d}px system-ui`;
                ctx.fillStyle = '#4a4';
                ctx.fillText('✓', x + cellW / 2, y + cellH / 2 + 13 * d);
            } else if (unlocked) {
                const dispMc = mc > 0 ? mc : LEVELS[i].marbles;
                ctx.font = `${8 * d}px system-ui`;
                ctx.fillStyle = '#777';
                ctx.fillText(`${dispMc}`, x + cellW / 2, y + cellH / 2 + 13 * d);
            }
        }
    }

    renderStandings(ctx, w, h, d) {
        const marbles = [...this.engine.marbles].filter(m => m.alive || m.finished).sort((a, b) => {
            if (a.finished && b.finished) return a.rank - b.rank;
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.y - a.y;
        });

        const lbW = 130 * d, lbX = w - lbW - 5 * d, lbY = 5 * d;
        const rowH = 16 * d;
        const maxShow = Math.min(marbles.length, 8);

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(lbX, lbY, lbW, 4 * d + maxShow * rowH, 5 * d);
        else ctx.rect(lbX, lbY, lbW, 4 * d + maxShow * rowH);
        ctx.fill();

        ctx.font = `${8.5 * d}px system-ui`;
        ctx.textBaseline = 'top';
        for (let i = 0; i < maxShow; i++) {
            const m = marbles[i];
            const y = lbY + 3 * d + i * rowH;
            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.arc(lbX + 8 * d, y + 5 * d, 2.5 * d, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = m.finished ? '#ffd700' : '#ccc';
            ctx.textAlign = 'left';
            ctx.fillText(`${m.finished ? '#' + m.rank : i + 1 + '.'} ${m.name}`, lbX + 14 * d, y + 1 * d);
            if (m.finished) {
                ctx.fillStyle = '#888';
                ctx.textAlign = 'right';
                ctx.fillText(`${m.finishTime.toFixed(1)}s`, lbX + lbW - 5 * d, y + 1 * d);
            }
        }
    }

    renderResults(ctx, w, h, d) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, w, h);

        const mc = this.engine.marbles.length;
        ctx.font = `bold ${26 * d}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Level ${this.currentLevel} Complete!`, w / 2, h * 0.15);

        ctx.font = `${12 * d}px system-ui`;
        ctx.fillStyle = '#aaa';
        ctx.fillText(`${mc} marbles | ${this.raceTimer.toFixed(1)}s`, w / 2, h * 0.21);

        if (this.rankings.length > 0) {
            ctx.font = `bold ${18 * d}px system-ui`;
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`🏆 ${this.rankings[0].name} wins!`, w / 2, h * 0.27);
        }

        ctx.font = `${11 * d}px system-ui`;
        const maxShow = Math.min(this.rankings.length, mc > 100 ? 3 : 6);
        for (let i = 0; i < maxShow; i++) {
            const m = this.rankings[i];
            ctx.fillStyle = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#888';
            ctx.fillText(`#${m.rank} ${m.name}  ${m.finishTime.toFixed(2)}s`, w / 2, h * 0.33 + i * 18 * d);
        }

        const btnW = 150 * d, btnH = 38 * d;
        const btns = [
            { y: h * 0.55, color: '#4444cc', text: this.currentLevel < 50 ? '▶ NEXT LEVEL' : '🏆 ALL DONE!' },
            { y: h * 0.55 + btnH + 12 * d, color: '#333', text: '↻ RETRY' },
            { y: h * 0.55 + (btnH + 12 * d) * 2, color: '#222', text: '← LEVELS' },
        ];
        for (const b of btns) {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(w / 2 - btnW / 2, b.y - btnH / 2, btnW, btnH, 7 * d);
            else ctx.rect(w / 2 - btnW / 2, b.y - btnH / 2, btnW, btnH);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${13 * d}px system-ui`;
            ctx.fillText(b.text, w / 2, b.y + 1 * d);
        }
    }
}

let app = null;
function boot() { if (app) return; app = new MarbleRaceApp(); app.init(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
