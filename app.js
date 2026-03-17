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
        this.rankings = [];
        this.nextRank = 1;
        this.seed = Math.floor(Math.random() * 99999);
        this.marbleCount = 12;
        this.lastFrameTime = 0;
        this.running = false;
        this.paused = false;
        this.showLeaderboard = true;
        this.showFPS = false;
        this.dpr = 1;
        this.uiElements = {};
        this.panelOpen = true;
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

        window.addEventListener('resize', () => this.setupCanvas());

        this.startNewRace();
        this.running = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    setupCanvas() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = Math.floor(w * this.dpr);
        this.canvas.height = Math.floor(h * this.dpr);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        if (this.renderer) {
            this.renderer.resize(this.canvas.width, this.canvas.height);
        }
    }

    setupUI() {
        this.uiElements = {
            startBtn: document.getElementById('startBtn'),
            restartBtn: document.getElementById('restartBtn'),
            marbleCountInput: document.getElementById('marbleCount'),
            seedInput: document.getElementById('seedInput'),
            cameraSelect: document.getElementById('cameraMode'),
            speedSelect: document.getElementById('speedSelect'),
            muteBtn: document.getElementById('muteBtn'),
            fpsToggle: document.getElementById('fpsToggle'),
            leaderboardToggle: document.getElementById('leaderboardToggle'),
            replayBtn: document.getElementById('replayBtn'),
            newSeedBtn: document.getElementById('newSeedBtn'),
            panelToggle: document.getElementById('panelToggle'),
            controlPanel: document.getElementById('controlPanel'),
        };

        const ui = this.uiElements;
        if (ui.startBtn) ui.startBtn.addEventListener('click', () => {
            this.audio.init();
            this.startRace();
        });
        if (ui.restartBtn) ui.restartBtn.addEventListener('click', () => {
            this.audio.init();
            this.startNewRace();
        });
        if (ui.newSeedBtn) ui.newSeedBtn.addEventListener('click', () => {
            this.seed = Math.floor(Math.random() * 99999);
            if (ui.seedInput) ui.seedInput.value = this.seed;
            this.startNewRace();
        });
        if (ui.cameraSelect) ui.cameraSelect.addEventListener('change', (e) => {
            this.renderer.camera.setMode(e.target.value);
            this.renderer.camera.panOffsetX = 0;
            this.renderer.camera.panOffsetY = 0;
        });
        if (ui.speedSelect) ui.speedSelect.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (this.engine) this.engine.slowMotion = val;
        });
        if (ui.muteBtn) ui.muteBtn.addEventListener('click', () => {
            this.audio.init().then(() => {
                this.audio.setMuted(!this.audio.muted);
                ui.muteBtn.textContent = this.audio.muted ? '🔇' : '🔊';
            });
        });
        if (ui.fpsToggle) ui.fpsToggle.addEventListener('click', () => {
            this.showFPS = !this.showFPS;
        });
        if (ui.leaderboardToggle) ui.leaderboardToggle.addEventListener('click', () => {
            this.showLeaderboard = !this.showLeaderboard;
        });
        if (ui.replayBtn) ui.replayBtn.addEventListener('click', () => this.toggleReplay());
        if (ui.panelToggle) ui.panelToggle.addEventListener('click', () => {
            this.panelOpen = !this.panelOpen;
            if (ui.controlPanel) ui.controlPanel.classList.toggle('collapsed', !this.panelOpen);
        });

        if (ui.seedInput) ui.seedInput.value = this.seed;
        if (ui.marbleCountInput) ui.marbleCountInput.value = this.marbleCount;
    }

    startNewRace() {
        this.engine = new PhysicsEngine();
        this.ais = [];
        this.rankings = [];
        this.nextRank = 1;
        this.raceTimer = 0;
        this.raceState = 'countdown';
        this.countdownTimer = 3;

        const ui = this.uiElements;
        if (ui.seedInput) {
            const val = parseInt(ui.seedInput.value);
            if (!isNaN(val) && val > 0) this.seed = val;
        }
        if (ui.marbleCountInput) {
            const val = parseInt(ui.marbleCountInput.value);
            if (!isNaN(val) && val >= 2 && val <= 30) this.marbleCount = val;
        }

        const trackData = buildTrack(this.engine, this.renderer, this.seed, this.marbleCount);
        this.finishY = trackData.finishY;

        for (let i = 0; i < this.marbleCount; i++) {
            const pos = trackData.startPositions[i] || {
                x: (Math.random() - 0.5) * 150,
                y: 20 + i * 25,
            };
            const color = this.renderer.getMarbleColor(i);
            const radius = 11;
            const marble = new Marble(pos.x, pos.y, radius, {
                color,
                glowColor: color,
                name: MARBLE_NAMES[i % MARBLE_NAMES.length],
                aiType: AI_TYPES[i % AI_TYPES.length],
                material: 'default',
            });
            this.engine.addMarble(marble);
            this.ais.push(new MarbleAI(marble, marble.aiType));
        }

        this.engine.paused = true;
        this.renderer.camera.setMode('follow_pack');
        this.renderer.camera.targetZoom = 0.6;
        this.renderer.camera.zoom = 0.6;
        let avgX = 0, avgY = 0;
        for (const p of trackData.startPositions) { avgX += p.x; avgY += p.y; }
        avgX /= (trackData.startPositions.length || 1);
        avgY /= (trackData.startPositions.length || 1);
        this.renderer.camera.x = avgX;
        this.renderer.camera.y = avgY;
        this.renderer.camera.targetX = avgX;
        this.renderer.camera.targetY = avgY;

        this.replay.startRecording();
        this.audio.init().then(() => this.audio.startMusic());
        this.updateRankingsDOM();
    }

    startRace() {
        if (this.raceState !== 'countdown' && this.raceState !== 'idle') return;
        this.raceState = 'countdown';
        this.countdownTimer = 3;
        this.engine.paused = true;
    }

    handleTap(x, y) {
        this.audio.init();
        if (this.raceState === 'idle') {
            this.startRace();
            return;
        }
        const closest = this.findClosestMarble(x, y, 50);
        if (closest && this.raceState === 'racing') {
            this.renderer.camera.focusOn(closest);
            setTimeout(() => this.renderer.camera.setMode('follow_leader'), 3000);
        }
    }

    findClosestMarble(x, y, maxDist = 50) {
        let best = null;
        let bestDist = maxDist * maxDist;
        for (const m of this.engine.marbles) {
            if (!m.alive) continue;
            const dx = m.x - x;
            const dy = m.y - y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist) { bestDist = d2; best = m; }
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

        const rawDt = (timestamp - this.lastFrameTime) / 1000;
        const dt = Math.min(rawDt, 0.05);
        this.lastFrameTime = timestamp;

        if (!this.paused) {
            this.update(dt);
            this.render(dt);
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        if (this.raceState === 'replay') {
            const frame = this.replay.getPlaybackFrame(dt);
            if (frame) {
                this.applyReplayFrame(frame);
            } else {
                this.raceState = 'finished';
            }
            this.renderer.camera.update(dt, this.engine.marbles);
            return;
        }

        if (this.raceState === 'countdown') {
            this.countdownTimer -= dt;
            if (this.countdownTimer <= 0) {
                this.raceState = 'racing';
                this.engine.paused = false;
                this.renderer.camera.setMode('follow_leader');
            }
            this.renderer.camera.update(dt, this.engine.marbles);
            return;
        }

        if (this.raceState !== 'racing' && this.raceState !== 'finished') {
            this.renderer.camera.update(dt, this.engine.marbles);
            return;
        }

        if (this.raceState === 'racing') {
            this.raceTimer += dt;
            const slowMoScale = this.renderer.slowMo.getScale();
            const userSpeed = parseFloat(this.uiElements.speedSelect?.value) || 1;
            this.engine.slowMotion = slowMoScale * userSpeed;
            this.engine.update(dt);

            for (const ai of this.ais) {
                ai.update(dt, this.engine.time, this.engine);
            }
        }

        for (const marble of this.engine.marbles) {
            if (!marble.alive) continue;
            marble.updateTrail();

            if (!marble.finished && marble.y >= this.finishY) {
                marble.finished = true;
                marble.finishTime = this.raceTimer;
                marble.rank = this.nextRank++;
                this.rankings.push(marble);
                this.updateRankingsDOM();

                if (marble.rank === 1) {
                    this.renderer.slowMo.trigger(0.25, 2.5);
                    this.renderer.camera.shake(20);
                    this.renderer.flash.trigger('#fff', 0.25);
                    this.audio.playFinish(1);
                    this.renderer.camera.dramaticFinishZoom = true;
                    setTimeout(() => { this.renderer.camera.dramaticFinishZoom = false; }, 3500);
                } else if (marble.rank <= 3) {
                    this.renderer.camera.shake(8);
                    this.audio.playFinish(marble.rank);
                } else {
                    this.audio.playFinish(marble.rank);
                }
            }

            if (marble.y > this.finishY + 500 || marble.y < -500 ||
                marble.x < -2000 || marble.x > 2000) {
                if (!marble.finished) {
                    marble.finished = true;
                    marble.finishTime = this.raceTimer;
                    marble.rank = this.nextRank++;
                    this.rankings.push(marble);
                    marble.alive = false;
                    this.updateRankingsDOM();
                }
            }
        }

        for (const event of this.engine.events) {
            if (event.type === 'collision' && event.force > 80) {
                this.renderer.particles.emitCollision(
                    event.x, event.y, event.nx, event.ny,
                    event.force, event.marble.color
                );
                event.marble.squashTarget = 1 - Math.min(0.6, event.force * 0.0003);
                const pan = this.audio.getSpatialPan(
                    event.marble.x, this.renderer.camera.x,
                    this.canvas.width / this.renderer.camera.zoom
                );
                this.audio.playBounce(event.force, pan);
                if (event.force > 400) {
                    this.renderer.camera.shake(Math.min(15, event.force * 0.003));
                }
            }
        }

        const activeMarbles = this.engine.marbles.filter(m => m.alive && !m.finished);
        if (activeMarbles.length === 0 && this.raceState === 'racing') {
            for (const m of this.engine.marbles) {
                if (!m.finished) {
                    m.finished = true;
                    m.finishTime = this.raceTimer;
                    m.rank = this.nextRank++;
                    this.rankings.push(m);
                }
            }
            this.raceState = 'finished';
            this.replay.stopRecording();
            this.updateRankingsDOM();
        }

        const speeds = this.engine.marbles.filter(m => m.alive).map(m => m.getSpeed());
        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
        this.audio.updateMusicIntensity(maxSpeed / 600);
        this.replay.captureFrame(this.engine.marbles, this.engine.time);
        this.renderer.camera.update(dt, this.engine.marbles);
    }

    applyReplayFrame(frame) {
        for (const mData of frame.marbles) {
            const marble = this.engine.marbles.find(m => m.id === mData.id);
            if (marble) {
                marble.x = mData.x;
                marble.y = mData.y;
                marble.angle = mData.angle;
                marble.alive = mData.alive;
                marble.finished = mData.finished;
                marble.squash = mData.squash;
                marble.updateTrail();
            }
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
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        if (this.raceState === 'countdown' && this.countdownTimer > 0) {
            const num = Math.ceil(this.countdownTimer);
            const frac = 1 - (this.countdownTimer % 1);
            const scale = 1 + frac * 0.5;
            const alpha = num > 0 ? 1 : frac;
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.scale(scale, scale);
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${Math.round(140 * this.dpr)}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#6366f1';
            ctx.shadowBlur = 40 * this.dpr;
            ctx.fillText(num > 0 ? String(num) : 'GO!', 0, 0);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        const fontSize = 15 * this.dpr;
        if (this.raceState === 'racing' || this.raceState === 'finished') {
            ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const mins = Math.floor(this.raceTimer / 60);
            const secs = (this.raceTimer % 60).toFixed(1);
            ctx.fillText(`${mins}:${secs.padStart(4, '0')}`, 12 * this.dpr, 48 * this.dpr);
        }

        if (this.raceState === 'finished' && this.rankings.length > 0) {
            ctx.save();
            ctx.font = `bold ${Math.round(42 * this.dpr)}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 25 * this.dpr;
            ctx.fillText('RACE COMPLETE!', w / 2, 60 * this.dpr);
            ctx.shadowBlur = 0;
            ctx.font = `bold ${Math.round(24 * this.dpr)}px system-ui, sans-serif`;
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`${this.rankings[0].name} WINS!`, w / 2, 110 * this.dpr);
            ctx.restore();
        }

        if (this.raceState === 'replay') {
            ctx.font = `bold ${Math.round(18 * this.dpr)}px system-ui, sans-serif`;
            ctx.fillStyle = '#ff4466';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`REPLAY (${Math.round(this.replay.getProgress() * 100)}%)`, w / 2, 48 * this.dpr);
        }

        if (this.showLeaderboard && this.raceState !== 'idle') {
            this.renderLeaderboard(ctx, w, h);
        }

        if (this.showFPS) {
            const sz = 12 * this.dpr;
            ctx.font = `${sz}px monospace`;
            ctx.fillStyle = this.perf.getFPS() < 30 ? '#ff4444' : '#44ff44';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(
                `${this.perf.getFPS()} FPS | ${this.perf.qualityLevel.toUpperCase()}`,
                w - 12 * this.dpr, 48 * this.dpr
            );
        }
    }

    renderLeaderboard(ctx, w, h) {
        const marbles = [...this.engine.marbles]
            .filter(m => m.alive || m.finished)
            .sort((a, b) => {
                if (a.finished && b.finished) return a.rank - b.rank;
                if (a.finished) return -1;
                if (b.finished) return 1;
                return b.y - a.y;
            });

        const d = this.dpr;
        const lbWidth = 170 * d;
        const lbX = w - lbWidth - 12 * d;
        const lbY = 50 * d;
        const rowH = 22 * d;
        const maxShow = Math.min(marbles.length, 10);
        const lbHeight = 28 * d + maxShow * rowH;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(lbX, lbY, lbWidth, lbHeight, 10 * d);
        } else {
            ctx.rect(lbX, lbY, lbWidth, lbHeight);
        }
        ctx.fill();

        ctx.font = `bold ${12 * d}px system-ui, sans-serif`;
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('STANDINGS', lbX + 10 * d, lbY + 8 * d);

        ctx.font = `${11 * d}px system-ui, sans-serif`;
        for (let i = 0; i < maxShow; i++) {
            const m = marbles[i];
            const y = lbY + 26 * d + i * rowH;

            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.arc(lbX + 14 * d, y + 4 * d, 4 * d, 0, Math.PI * 2);
            ctx.fill();

            const rank = m.finished ? `#${m.rank}` : `${i + 1}.`;
            ctx.fillStyle = m.finished ? '#ffd700' : '#ccc';
            ctx.textAlign = 'left';
            ctx.fillText(`${rank} ${m.name}`, lbX + 22 * d, y);

            if (m.finished) {
                ctx.fillStyle = '#888';
                ctx.textAlign = 'right';
                ctx.fillText(`${m.finishTime.toFixed(1)}s`, lbX + lbWidth - 10 * d, y);
            }
        }
    }

    updateRankingsDOM() {
        const el = document.getElementById('rankingsList');
        if (!el) return;
        el.innerHTML = '';
        if (this.rankings.length === 0) return;
        const title = document.createElement('div');
        title.style.cssText = 'font-weight:800;font-size:11px;color:#aaa;margin-bottom:6px;letter-spacing:1px;';
        title.textContent = 'RESULTS';
        el.appendChild(title);
        for (const m of this.rankings) {
            const div = document.createElement('div');
            div.className = 'ranking-item';
            div.innerHTML = `<span class="rank">#${m.rank}</span>
                <span class="marble-dot" style="background:${m.color}"></span>
                <span class="name">${m.name}</span>
                <span class="time">${m.finishTime.toFixed(2)}s</span>`;
            el.appendChild(div);
        }
    }
}

let appInstance = null;
function boot() {
    if (appInstance) return;
    appInstance = new MarbleRaceApp();
    appInstance.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
