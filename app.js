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
        this.lastFrameTime = 0;
        this.running = false;
        this.paused = false;
        this.dpr = 1;
        this.showFPS = false;
        this.levelSelectScroll = 0;
        this.loadProgress();
    }

    loadProgress() {
        try {
            const d = JSON.parse(localStorage.getItem(SAVE_KEY));
            if (d && d.unlocked) this.unlockedLevel = Math.min(d.unlocked, 50);
        } catch (e) {}
    }

    saveProgress() {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify({ unlocked: this.unlockedLevel })); } catch (e) {}
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

    loadLevel(levelNum) {
        this.currentLevel = levelNum;
        const cfg = LEVELS[levelNum - 1];
        this.engine = new PhysicsEngine();
        this.ais = [];
        this.rankings = [];
        this.nextRank = 1;
        this.raceTimer = 0;

        const trackData = buildTrack(this.engine, this.renderer, cfg);
        this.finishY = trackData.finishY;
        this.trackBounds = trackData.bounds;

        for (let i = 0; i < cfg.marbles; i++) {
            const pos = trackData.startPositions[i] || { x: 0, y: 30 + i * 22 };
            const color = this.renderer.getMarbleColor(i);
            const marble = new Marble(pos.x, pos.y, 9, {
                color, glowColor: color,
                name: NAMES[i % NAMES.length],
                aiType: AI_TYPES[i % AI_TYPES.length],
            });
            this.engine.addMarble(marble);
            this.ais.push(new MarbleAI(marble, marble.aiType));
        }

        this.engine.paused = true;
        this.renderer.camera.setMode('static');
        this.renderer.camera.setTrackBounds(this.trackBounds);
        this.state = 'ready';
    }

    startCountdown() {
        this.state = 'countdown';
        this.countdownTimer = 3;
        this.engine.paused = true;
    }

    handleTap(screenX, screenY) {
        const w = this.canvas.width, h = this.canvas.height;

        if (this.state === 'menu') {
            this.handleMenuTap(screenX, screenY);
            return;
        }
        if (this.state === 'ready') {
            this.startCountdown();
            return;
        }
        if (this.state === 'finished') {
            const cx = w / 2, cy = h * 0.55;
            const bw = 160 * this.dpr, bh = 44 * this.dpr;
            if (screenX > cx - bw && screenX < cx + bw && screenY > cy - bh && screenY < cy + bh) {
                if (this.currentLevel < 50) {
                    this.loadLevel(this.currentLevel + 1);
                } else {
                    this.state = 'menu';
                }
                return;
            }
            const ry = cy + bh + 20 * this.dpr;
            if (screenX > cx - bw && screenX < cx + bw && screenY > ry - bh && screenY < ry + bh) {
                this.loadLevel(this.currentLevel);
                return;
            }
            const my = ry + bh + 20 * this.dpr;
            if (screenX > cx - bw && screenX < cx + bw && screenY > my - bh && screenY < my + bh) {
                this.state = 'menu';
                return;
            }
        }
    }

    handleMenuTap(sx, sy) {
        const d = this.dpr;
        const cols = Math.min(5, Math.floor(this.canvas.width / (70 * d)));
        const cellW = 62 * d, cellH = 62 * d, gap = 8 * d;
        const startY = 90 * d;
        const totalW = cols * (cellW + gap) - gap;
        const startX = (this.canvas.width - totalW) / 2;

        for (let i = 0; i < 50; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const x = startX + col * (cellW + gap);
            const y = startY + row * (cellH + gap) - this.levelSelectScroll;
            if (sx >= x && sx <= x + cellW && sy >= y && sy <= y + cellH) {
                const lvl = i + 1;
                if (lvl <= this.unlockedLevel) {
                    this.audio.init();
                    this.loadLevel(lvl);
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
            if (this.countdownTimer <= 0) {
                this.state = 'racing';
                this.engine.paused = false;
            }
            this.renderer.camera.update(dt, this.engine.marbles);
            return;
        }
        if (this.state === 'ready') {
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
            m.updateTrail();

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
        const w = this.canvas.width, h = this.canvas.height;
        const d = this.dpr;

        if (this.state === 'menu') {
            this.renderMenu(ctx, w, h, d);
            return;
        }

        ctx.save();
        this.renderer.render(this.engine, 0);
        ctx.restore();

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.font = `bold ${12 * d}px system-ui`;
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Level ${this.currentLevel}: ${LEVELS[this.currentLevel - 1].name}`, 10 * d, 8 * d);

        if (this.state === 'ready') {
            ctx.font = `bold ${28 * d}px system-ui`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText('TAP TO START', w / 2, h / 2 - 20 * d);
            ctx.font = `${14 * d}px system-ui`;
            ctx.fillStyle = '#aaa';
            ctx.fillText(`${LEVELS[this.currentLevel - 1].marbles} marbles`, w / 2, h / 2 + 15 * d);
        }

        if (this.state === 'countdown') {
            const num = Math.ceil(this.countdownTimer);
            ctx.font = `bold ${100 * d}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(num > 0 ? String(num) : 'GO!', w / 2, h / 2);
        }

        if (this.state === 'racing') {
            ctx.font = `bold ${14 * d}px system-ui`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`${this.raceTimer.toFixed(1)}s`, 10 * d, 24 * d);
            this.renderStandings(ctx, w, h, d);
        }

        if (this.state === 'finished') {
            this.renderResults(ctx, w, h, d);
        }

        if (this.showFPS) {
            ctx.font = `${10 * d}px monospace`;
            ctx.fillStyle = '#44ff44';
            ctx.textAlign = 'right';
            ctx.fillText(`${this.perf.getFPS()} FPS`, w - 8 * d, 8 * d);
        }
    }

    renderMenu(ctx, w, h, d) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#0c0c20';
        ctx.fillRect(0, 0, w, h);

        ctx.font = `bold ${28 * d}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('MARBLE RACE', w / 2, 40 * d);
        ctx.font = `${13 * d}px system-ui`;
        ctx.fillStyle = '#888';
        ctx.fillText('Select a level', w / 2, 65 * d);

        const cols = Math.min(5, Math.floor(w / (70 * d)));
        const cellW = 62 * d, cellH = 62 * d, gap = 8 * d;
        const startY = 90 * d;
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

            if (unlocked) {
                const grad = ctx.createLinearGradient(x, y, x, y + cellH);
                if (completed) {
                    grad.addColorStop(0, '#1a3a1a');
                    grad.addColorStop(1, '#0d1f0d');
                } else {
                    grad.addColorStop(0, '#1a1a3a');
                    grad.addColorStop(1, '#0d0d1f');
                }
                ctx.fillStyle = grad;
            } else {
                ctx.fillStyle = '#111118';
            }
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, cellW, cellH, 8 * d);
            else ctx.rect(x, y, cellW, cellH);
            ctx.fill();

            ctx.strokeStyle = completed ? '#2a6a2a' : unlocked ? '#3a3a6a' : '#222228';
            ctx.lineWidth = 1.5 * d;
            ctx.stroke();

            ctx.font = `bold ${18 * d}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = unlocked ? '#fff' : '#444';
            ctx.fillText(unlocked ? String(lvl) : '🔒', x + cellW / 2, y + cellH / 2 - 4 * d);

            if (completed) {
                ctx.font = `${9 * d}px system-ui`;
                ctx.fillStyle = '#4a4';
                ctx.fillText('✓', x + cellW / 2, y + cellH / 2 + 14 * d);
            } else if (unlocked) {
                ctx.font = `${8 * d}px system-ui`;
                ctx.fillStyle = '#888';
                ctx.fillText(LEVELS[i].marbles + '🔵', x + cellW / 2, y + cellH / 2 + 14 * d);
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

        const lbW = 140 * d, lbX = w - lbW - 6 * d, lbY = 6 * d;
        const rowH = 18 * d;
        const maxShow = Math.min(marbles.length, 8);

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(lbX, lbY, lbW, 6 * d + maxShow * rowH, 6 * d);
        else ctx.rect(lbX, lbY, lbW, 6 * d + maxShow * rowH);
        ctx.fill();

        ctx.font = `${9 * d}px system-ui`;
        for (let i = 0; i < maxShow; i++) {
            const m = marbles[i];
            const y = lbY + 4 * d + i * rowH;
            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.arc(lbX + 10 * d, y + 6 * d, 3 * d, 0, Math.PI * 2);
            ctx.fill();
            const rank = m.finished ? `#${m.rank}` : `${i + 1}.`;
            ctx.fillStyle = m.finished ? '#ffd700' : '#ccc';
            ctx.textAlign = 'left';
            ctx.fillText(`${rank} ${m.name}`, lbX + 17 * d, y + 3 * d);
            if (m.finished) {
                ctx.fillStyle = '#888';
                ctx.textAlign = 'right';
                ctx.fillText(`${m.finishTime.toFixed(1)}s`, lbX + lbW - 6 * d, y + 3 * d);
            }
        }
    }

    renderResults(ctx, w, h, d) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, w, h);

        ctx.font = `bold ${30 * d}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Level ${this.currentLevel} Complete!`, w / 2, h * 0.2);

        ctx.font = `bold ${18 * d}px system-ui`;
        ctx.fillStyle = '#ffd700';
        if (this.rankings.length > 0) {
            ctx.fillText(`🏆 ${this.rankings[0].name} wins!`, w / 2, h * 0.28);
        }

        ctx.font = `${13 * d}px system-ui`;
        ctx.fillStyle = '#ccc';
        const maxShow = Math.min(this.rankings.length, 6);
        for (let i = 0; i < maxShow; i++) {
            const m = this.rankings[i];
            ctx.fillStyle = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#888';
            ctx.fillText(`#${m.rank} ${m.name}  ${m.finishTime.toFixed(2)}s`, w / 2, h * 0.34 + i * 20 * d);
        }

        const btnY = h * 0.55;
        const btnW = 150 * d, btnH = 40 * d;

        ctx.fillStyle = '#4444cc';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(w / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 8 * d); ctx.fill(); }
        else { ctx.fillRect(w / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH); }
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${14 * d}px system-ui`;
        ctx.fillText(this.currentLevel < 50 ? '▶ NEXT LEVEL' : '🏆 ALL DONE!', w / 2, btnY + 1 * d);

        const retryY = btnY + btnH + 16 * d;
        ctx.fillStyle = '#333';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(w / 2 - btnW / 2, retryY - btnH / 2, btnW, btnH, 8 * d); ctx.fill(); }
        else { ctx.fillRect(w / 2 - btnW / 2, retryY - btnH / 2, btnW, btnH); }
        ctx.fillStyle = '#ccc';
        ctx.fillText('↻ RETRY', w / 2, retryY + 1 * d);

        const menuY = retryY + btnH + 16 * d;
        ctx.fillStyle = '#222';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(w / 2 - btnW / 2, menuY - btnH / 2, btnW, btnH, 8 * d); ctx.fill(); }
        else { ctx.fillRect(w / 2 - btnW / 2, menuY - btnH / 2, btnW, btnH); }
        ctx.fillStyle = '#999';
        ctx.fillText('← LEVELS', w / 2, menuY + 1 * d);
    }
}

let app = null;
function boot() { if (app) return; app = new MarbleRaceApp(); app.init(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
