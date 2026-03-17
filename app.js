import { PhysicsEngine } from './src/physics/engine.js';
import { Marble } from './src/physics/marble.js';
import { Renderer } from './src/render/renderer.js';
import { buildTrack } from './src/procedural/track.js';
import { MarbleAI } from './src/ai/behavior.js';
import { TouchController } from './src/mobile/touch.js';
import { PerformanceMonitor, setupVisibilityHandler } from './src/mobile/performance.js';
import { AudioEngine } from './src/audio/audio.js';
import { ReplaySystem } from './src/replay/replay.js';

const MARBLE_NAMES = [
    'Crimson', 'Emerald', 'Sapphire', 'Amber', 'Violet',
    'Cyan', 'Coral', 'Lime', 'Indigo', 'Rose',
    'Teal', 'Gold', 'Scarlet', 'Azure', 'Orchid',
    'Ruby', 'Jade', 'Cobalt', 'Tangerine', 'Magenta',
    'Flame', 'Forest', 'Ocean', 'Sunset', 'Nebula',
    'Arctic', 'Peach', 'Mint', 'Storm', 'Lava',
];
const AI_TYPES = ['aggressive', 'balanced', 'safe', 'random'];

class MarbleRaceApp {
    constructor() {
        this.initialized = false;
        this.canvas = null;
        this.engine = null;
        this.renderer = null;
        this.audio = new AudioEngine();
        this.perf = new PerformanceMonitor();
        this.replay = new ReplaySystem();
        this.touch = null;
        this.ais = [];
        this.raceState = 'idle';
        this.raceTimer = 0;
        this.countdownTimer = 0;
        this.finishY = 0;
        this.trackBounds = null;
        this.rankings = [];
        this.nextRank = 1;
        this.seed = Math.floor(Math.random() * 99999);
        this.marbleCount = 10;
        this.lastFrameTime = 0;
        this.running = false;
        this.paused = false;
        this.showLeaderboard = true;
        this.showFPS = false;
        this.dpr = 1;
        this.ui = {};
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) return;

        this.engine = new PhysicsEngine();
        this.renderer = new Renderer(this.canvas);
        this.setupCanvas();
        this.setupUI();

        this.touch = new TouchController(this.canvas, this.renderer.camera);
        this.touch.onTap = (x, y) => this.handleTap(x, y);
        this.perf.onQualityChange = (level) => this.renderer.setQuality(level);

        setupVisibilityHandler(
            () => { this.paused = false; this.audio.resume(); },
            () => { this.paused = true; this.audio.suspend(); }
        );
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.trackBounds) this.renderer.camera.setTrackBounds(this.trackBounds);
        });

        this.startNewRace();
        this.running = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame(t => this.gameLoop(t));
    }

    setupCanvas() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = Math.floor(w * this.dpr);
        this.canvas.height = Math.floor(h * this.dpr);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        if (this.renderer) this.renderer.resize(this.canvas.width, this.canvas.height);
    }

    setupUI() {
        this.ui = {
            startBtn: document.getElementById('startBtn'),
            restartBtn: document.getElementById('restartBtn'),
            marbleCount: document.getElementById('marbleCount'),
            seedInput: document.getElementById('seedInput'),
            cameraMode: document.getElementById('cameraMode'),
            speedSelect: document.getElementById('speedSelect'),
            muteBtn: document.getElementById('muteBtn'),
            fpsToggle: document.getElementById('fpsToggle'),
            lbToggle: document.getElementById('leaderboardToggle'),
            replayBtn: document.getElementById('replayBtn'),
            newSeedBtn: document.getElementById('newSeedBtn'),
            panelToggle: document.getElementById('panelToggle'),
            controlPanel: document.getElementById('controlPanel'),
            panelBody: document.getElementById('panelBody'),
        };
        const u = this.ui;

        if (u.startBtn) u.startBtn.onclick = () => { this.audio.init(); this.startCountdown(); };
        if (u.restartBtn) u.restartBtn.onclick = () => { this.audio.init(); this.startNewRace(); };
        if (u.newSeedBtn) u.newSeedBtn.onclick = () => {
            this.seed = Math.floor(Math.random() * 99999);
            if (u.seedInput) u.seedInput.value = this.seed;
            this.startNewRace();
        };
        if (u.cameraMode) u.cameraMode.onchange = () => {
            this.renderer.camera.setMode(u.cameraMode.value);
            this.renderer.camera.panOffsetX = 0;
            this.renderer.camera.panOffsetY = 0;
            if (u.cameraMode.value === 'static' && this.trackBounds) {
                this.renderer.camera.setTrackBounds(this.trackBounds);
            }
        };
        if (u.speedSelect) u.speedSelect.onchange = () => {};
        if (u.muteBtn) u.muteBtn.onclick = () => {
            this.audio.init().then(() => {
                this.audio.setMuted(!this.audio.muted);
                u.muteBtn.textContent = this.audio.muted ? '🔇' : '🔊';
            });
        };
        if (u.fpsToggle) u.fpsToggle.onclick = () => { this.showFPS = !this.showFPS; };
        if (u.lbToggle) u.lbToggle.onclick = () => { this.showLeaderboard = !this.showLeaderboard; };
        if (u.replayBtn) u.replayBtn.onclick = () => this.toggleReplay();

        if (u.panelToggle) {
            u.panelToggle.onclick = (e) => {
                e.stopPropagation();
                const panel = u.controlPanel;
                if (panel) {
                    panel.classList.toggle('collapsed');
                }
            };
        }

        if (u.seedInput) u.seedInput.value = this.seed;
        if (u.marbleCount) u.marbleCount.value = this.marbleCount;
    }

    startNewRace() {
        this.engine = new PhysicsEngine();
        this.ais = [];
        this.rankings = [];
        this.nextRank = 1;
        this.raceTimer = 0;
        this.raceState = 'idle';

        const u = this.ui;
        if (u.seedInput) { const v = parseInt(u.seedInput.value); if (!isNaN(v) && v > 0) this.seed = v; }
        if (u.marbleCount) { const v = parseInt(u.marbleCount.value); if (!isNaN(v) && v >= 2 && v <= 30) this.marbleCount = v; }

        const trackData = buildTrack(this.engine, this.renderer, this.seed, this.marbleCount);
        this.finishY = trackData.finishY;
        this.trackBounds = trackData.bounds;

        for (let i = 0; i < this.marbleCount; i++) {
            const pos = trackData.startPositions[i] || { x: (Math.random() - 0.5) * 100, y: 30 + i * 24 };
            const color = this.renderer.getMarbleColor(i);
            const marble = new Marble(pos.x, pos.y, 10, {
                color, glowColor: color,
                name: MARBLE_NAMES[i % MARBLE_NAMES.length],
                aiType: AI_TYPES[i % AI_TYPES.length],
            });
            this.engine.addMarble(marble);
            this.ais.push(new MarbleAI(marble, marble.aiType));
        }

        this.engine.paused = true;
        this.renderer.camera.setMode('static');
        this.renderer.camera.setTrackBounds(this.trackBounds);
        this.replay.startRecording();
        this.audio.init().then(() => this.audio.startMusic());
        this.updateRankingsDOM();

        if (u.startBtn) u.startBtn.textContent = '▶ START RACE';
    }

    startCountdown() {
        if (this.raceState === 'racing' || this.raceState === 'countdown') return;
        if (this.raceState === 'finished' || this.raceState === 'replay') {
            this.startNewRace();
        }
        this.raceState = 'countdown';
        this.countdownTimer = 3;
        this.engine.paused = true;
        if (this.ui.startBtn) this.ui.startBtn.textContent = '⏳ 3...';
    }

    handleTap(x, y) {
        this.audio.init();
        if (this.raceState === 'idle') { this.startCountdown(); return; }
        const closest = this.findClosestMarble(x, y, 60);
        if (closest && this.raceState === 'racing') {
            this.renderer.camera.focusOn(closest);
            setTimeout(() => {
                this.renderer.camera.setMode('static');
                if (this.trackBounds) this.renderer.camera.setTrackBounds(this.trackBounds);
            }, 3000);
        }
    }

    findClosestMarble(x, y, maxDist = 50) {
        let best = null, bestD = maxDist * maxDist;
        for (const m of this.engine.marbles) {
            if (!m.alive) continue;
            const d2 = (m.x - x) ** 2 + (m.y - y) ** 2;
            if (d2 < bestD) { bestD = d2; best = m; }
        }
        return best;
    }

    toggleReplay() {
        if (this.replay.playing) {
            this.replay.stopPlayback();
            this.raceState = 'finished';
        } else if (this.replay.snapshots.length > 0) {
            this.replay.startPlayback(1);
            this.raceState = 'replay';
        }
    }

    gameLoop(timestamp) {
        if (!this.running) return;
        this.perf.startFrame();
        const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
        this.lastFrameTime = timestamp;
        if (!this.paused) { this.update(dt); this.render(dt); }
        requestAnimationFrame(t => this.gameLoop(t));
    }

    update(dt) {
        if (this.raceState === 'replay') {
            const frame = this.replay.getPlaybackFrame(dt);
            if (frame) this.applyReplayFrame(frame); else this.raceState = 'finished';
            this.renderer.camera.update(dt, this.engine.marbles);
            return;
        }

        if (this.raceState === 'countdown') {
            this.countdownTimer -= dt;
            if (this.ui.startBtn) this.ui.startBtn.textContent = `⏳ ${Math.ceil(this.countdownTimer)}...`;
            if (this.countdownTimer <= 0) {
                this.raceState = 'racing';
                this.engine.paused = false;
                if (this.ui.startBtn) this.ui.startBtn.textContent = '🏁 RACING...';
            }
            this.renderer.camera.update(dt, this.engine.marbles);
            return;
        }

        if (this.raceState !== 'racing') {
            this.renderer.camera.update(dt, this.engine.marbles);
            return;
        }

        this.raceTimer += dt;
        const userSpeed = parseFloat(this.ui.speedSelect?.value) || 1;
        const slowMo = this.renderer.slowMo.getScale();
        this.engine.slowMotion = slowMo * userSpeed;
        this.engine.update(dt);

        for (const ai of this.ais) ai.update(dt, this.engine.time, this.engine);

        for (const m of this.engine.marbles) {
            if (!m.alive) continue;
            m.updateTrail();

            if (this.trackBounds) {
                const b = this.trackBounds;
                const r = m.radius;
                if (m.x - r < b.minX) { m.x = b.minX + r; m.vx = Math.abs(m.vx) * 0.5; }
                if (m.x + r > b.maxX) { m.x = b.maxX - r; m.vx = -Math.abs(m.vx) * 0.5; }
                if (m.y - r < b.minY) { m.y = b.minY + r; m.vy = Math.abs(m.vy) * 0.3; }
                if (m.y + r > b.maxY) { m.y = b.maxY - r; m.vy = -Math.abs(m.vy) * 0.3; }
            }

            if (!m.finished && m.y >= this.finishY) {
                m.finished = true;
                m.finishTime = this.raceTimer;
                m.rank = this.nextRank++;
                this.rankings.push(m);
                this.updateRankingsDOM();

                if (m.rank === 1) {
                    this.renderer.slowMo.trigger(0.3, 2);
                    this.renderer.camera.shake(10);
                    this.renderer.flash.trigger('#fff', 0.2);
                    this.audio.playFinish(1);
                    this.renderer.camera.focusMarble = m;
                    this.renderer.camera.dramaticFinishZoom = true;
                    setTimeout(() => {
                        this.renderer.camera.dramaticFinishZoom = false;
                        this.renderer.camera.setMode('static');
                        if (this.trackBounds) this.renderer.camera.setTrackBounds(this.trackBounds);
                    }, 2500);
                } else if (m.rank <= 3) {
                    this.renderer.camera.shake(5);
                    this.audio.playFinish(m.rank);
                }
            }
        }

        for (const event of this.engine.events) {
            if (event.type === 'collision' && event.force > 100) {
                this.renderer.particles.emitCollision(event.x, event.y, event.nx, event.ny, event.force, event.marble.color);
                event.marble.squashTarget = 1 - Math.min(0.5, event.force * 0.0002);
                const pan = this.audio.getSpatialPan(event.marble.x, this.renderer.camera.x, this.canvas.width / this.renderer.camera.zoom);
                this.audio.playBounce(event.force, pan);
                if (event.force > 500) this.renderer.camera.shake(Math.min(8, event.force * 0.002));
            }
        }

        const active = this.engine.marbles.filter(m => m.alive && !m.finished);
        if (active.length === 0 && this.raceState === 'racing') {
            for (const m of this.engine.marbles) {
                if (!m.finished) { m.finished = true; m.finishTime = this.raceTimer; m.rank = this.nextRank++; this.rankings.push(m); }
            }
            this.raceState = 'finished';
            this.replay.stopRecording();
            this.updateRankingsDOM();
            if (this.ui.startBtn) this.ui.startBtn.textContent = '▶ NEW RACE';
        }

        const speeds = this.engine.marbles.filter(m => m.alive).map(m => m.getSpeed());
        this.audio.updateMusicIntensity(speeds.length > 0 ? Math.max(...speeds) / 600 : 0);
        this.replay.captureFrame(this.engine.marbles, this.engine.time);
        this.renderer.camera.update(dt, this.engine.marbles);
    }

    applyReplayFrame(frame) {
        for (const d of frame.marbles) {
            const m = this.engine.marbles.find(e => e.id === d.id);
            if (m) { m.x = d.x; m.y = d.y; m.angle = d.angle; m.alive = d.alive; m.finished = d.finished; m.squash = d.squash; m.updateTrail(); }
        }
    }

    render(dt) {
        const ctx = this.renderer.ctx;
        ctx.save();
        this.renderer.render(this.engine, dt);
        ctx.restore();
        this.renderHUD();
    }

    renderHUD() {
        const ctx = this.renderer.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const d = this.dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        if (this.raceState === 'countdown' && this.countdownTimer > 0) {
            const num = Math.ceil(this.countdownTimer);
            const frac = 1 - (this.countdownTimer % 1);
            const scale = 1 + frac * 0.4;
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.scale(scale, scale);
            ctx.font = `bold ${Math.round(120 * d)}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#6366f1';
            ctx.shadowBlur = 30 * d;
            ctx.fillText(num > 0 ? String(num) : 'GO!', 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        if (this.raceState === 'racing' || this.raceState === 'finished') {
            ctx.font = `bold ${14 * d}px system-ui, sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const mins = Math.floor(this.raceTimer / 60);
            const secs = (this.raceTimer % 60).toFixed(1);
            ctx.fillText(`${mins}:${secs.padStart(4, '0')}`, 12 * d, 42 * d);
        }

        if (this.raceState === 'finished' && this.rankings.length > 0) {
            ctx.save();
            ctx.font = `bold ${36 * d}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 20 * d;
            ctx.fillText('RACE COMPLETE!', w / 2, 60 * d);
            ctx.shadowBlur = 0;
            ctx.font = `bold ${22 * d}px system-ui, sans-serif`;
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`🏆 ${this.rankings[0].name} WINS!`, w / 2, 100 * d);
            ctx.restore();
        }

        if (this.raceState === 'idle') {
            ctx.font = `bold ${20 * d}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillText('Press START RACE to begin!', w / 2, h / 2);
        }

        if (this.showLeaderboard && this.raceState !== 'idle') {
            this.renderLeaderboard(ctx, w, h);
        }

        if (this.showFPS) {
            ctx.font = `${11 * d}px monospace`;
            ctx.fillStyle = this.perf.getFPS() < 30 ? '#ff4444' : '#44ff44';
            ctx.textAlign = 'right';
            ctx.fillText(`${this.perf.getFPS()} FPS`, w - 10 * d, 42 * d);
        }
    }

    renderLeaderboard(ctx, w, h) {
        const marbles = [...this.engine.marbles].filter(m => m.alive || m.finished).sort((a, b) => {
            if (a.finished && b.finished) return a.rank - b.rank;
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.y - a.y;
        });

        const d = this.dpr;
        const lbW = 155 * d;
        const lbX = w - lbW - 8 * d;
        const lbY = 38 * d;
        const rowH = 20 * d;
        const maxShow = Math.min(marbles.length, 8);
        const lbH = 24 * d + maxShow * rowH;

        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(lbX, lbY, lbW, lbH, 8 * d);
        else ctx.rect(lbX, lbY, lbW, lbH);
        ctx.fill();

        ctx.font = `bold ${10 * d}px system-ui, sans-serif`;
        ctx.fillStyle = '#999';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('STANDINGS', lbX + 8 * d, lbY + 6 * d);

        ctx.font = `${10 * d}px system-ui, sans-serif`;
        for (let i = 0; i < maxShow; i++) {
            const m = marbles[i];
            const y = lbY + 22 * d + i * rowH;
            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.arc(lbX + 12 * d, y + 3 * d, 3.5 * d, 0, Math.PI * 2);
            ctx.fill();
            const rank = m.finished ? `#${m.rank}` : `${i + 1}.`;
            ctx.fillStyle = m.finished ? '#ffd700' : '#ccc';
            ctx.textAlign = 'left';
            ctx.fillText(`${rank} ${m.name}`, lbX + 20 * d, y);
            if (m.finished) {
                ctx.fillStyle = '#888';
                ctx.textAlign = 'right';
                ctx.fillText(`${m.finishTime.toFixed(1)}s`, lbX + lbW - 8 * d, y);
            }
        }
    }

    updateRankingsDOM() {
        const el = document.getElementById('rankingsList');
        if (!el) return;
        el.innerHTML = '';
        if (this.rankings.length === 0) return;
        const t = document.createElement('div');
        t.style.cssText = 'font-weight:800;font-size:11px;color:#aaa;margin-bottom:6px;letter-spacing:1px;';
        t.textContent = 'RESULTS';
        el.appendChild(t);
        for (const m of this.rankings) {
            const d = document.createElement('div');
            d.className = 'ranking-item';
            d.innerHTML = `<span class="rank">#${m.rank}</span><span class="marble-dot" style="background:${m.color}"></span><span class="name">${m.name}</span><span class="time">${m.finishTime.toFixed(2)}s</span>`;
            el.appendChild(d);
        }
    }
}

let app = null;
function boot() { if (app) return; app = new MarbleRaceApp(); app.init(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
