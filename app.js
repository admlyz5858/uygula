import { PhysicsEngine } from './src/physics/engine.js';
import { Marble } from './src/physics/marble.js';
import { Renderer } from './src/render/renderer.js';
import { Camera } from './src/render/camera.js';
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
];

const AI_TYPES = ['aggressive', 'balanced', 'safe', 'random'];

class MarbleRaceApp {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.engine = new PhysicsEngine();
        this.renderer = new Renderer(this.canvas);
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
        this.seed = Date.now();
        this.marbleCount = 12;
        this.lastFrameTime = 0;
        this.running = false;
        this.paused = false;
        this.showLeaderboard = true;
        this.showFPS = false;
        this.autoRestart = false;
        this.uiElements = {};
    }

    async init() {
        this.setupCanvas();
        this.setupUI();
        this.touch = new TouchController(this.canvas, this.renderer.camera);
        this.touch.onTap = (x, y) => this.handleTap(x, y);

        this.perf.onQualityChange = (level) => {
            this.renderer.setQuality(level);
        };

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
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.scale(dpr, dpr);
        this.renderer.resize(w * dpr, h * dpr);
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
        };

        const ui = this.uiElements;

        if (ui.startBtn) ui.startBtn.addEventListener('click', () => this.startRace());
        if (ui.restartBtn) ui.restartBtn.addEventListener('click', () => this.startNewRace());
        if (ui.newSeedBtn) ui.newSeedBtn.addEventListener('click', () => {
            this.seed = Date.now();
            if (ui.seedInput) ui.seedInput.value = this.seed;
            this.startNewRace();
        });
        if (ui.cameraSelect) ui.cameraSelect.addEventListener('change', (e) => {
            this.renderer.camera.setMode(e.target.value);
            this.renderer.camera.panOffsetX = 0;
            this.renderer.camera.panOffsetY = 0;
        });
        if (ui.speedSelect) ui.speedSelect.addEventListener('change', (e) => {
            this.engine.slowMotion = parseFloat(e.target.value);
        });
        if (ui.muteBtn) ui.muteBtn.addEventListener('click', () => {
            this.audio.setMuted(!this.audio.muted);
            ui.muteBtn.textContent = this.audio.muted ? '🔇' : '🔊';
        });
        if (ui.fpsToggle) ui.fpsToggle.addEventListener('click', () => {
            this.showFPS = !this.showFPS;
        });
        if (ui.leaderboardToggle) ui.leaderboardToggle.addEventListener('click', () => {
            this.showLeaderboard = !this.showLeaderboard;
        });
        if (ui.replayBtn) ui.replayBtn.addEventListener('click', () => this.toggleReplay());
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

        if (this.uiElements.seedInput) {
            const val = parseInt(this.uiElements.seedInput.value);
            if (!isNaN(val)) this.seed = val;
        }
        if (this.uiElements.marbleCountInput) {
            const val = parseInt(this.uiElements.marbleCountInput.value);
            if (!isNaN(val) && val >= 2 && val <= 30) this.marbleCount = val;
        }

        const trackData = buildTrack(this.engine, this.renderer, this.seed, this.marbleCount);
        this.finishY = trackData.finishY;

        for (let i = 0; i < this.marbleCount; i++) {
            const pos = trackData.startPositions[i] || { x: (Math.random() - 0.5) * 200, y: -50 - i * 25 };
            const color = this.renderer.getMarbleColor(i);
            const marble = new Marble(pos.x, pos.y, 10 + Math.random() * 4, {
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
        this.renderer.camera.x = 0;
        this.renderer.camera.y = trackData.startPositions[0]?.y || 0;

        this.replay.startRecording();

        this.audio.init().then(() => {
            this.audio.startMusic();
        });

        this.updateRankingsUI();
    }

    startRace() {
        if (this.raceState === 'countdown' || this.raceState === 'idle') {
            this.raceState = 'countdown';
            this.countdownTimer = 3;
            this.engine.paused = true;
        }
    }

    handleTap(x, y) {
        if (this.raceState === 'idle') {
            this.startRace();
            return;
        }
        const closest = this.findClosestMarble(x, y);
        if (closest && this.raceState === 'racing') {
            this.renderer.camera.focusOn(closest);
            setTimeout(() => {
                this.renderer.camera.setMode('follow_leader');
            }, 3000);
        }
    }

    findClosestMarble(x, y) {
        let best = null;
        let bestDist = Infinity;
        for (const m of this.engine.marbles) {
            if (!m.alive) continue;
            const dx = m.x - x;
            const dy = m.y - y;
            const d = dx * dx + dy * dy;
            if (d < bestDist) {
                bestDist = d;
                best = m;
            }
        }
        return bestDist < 2500 ? best : null;
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

        this.raceTimer += dt;
        const timeScale = this.renderer.slowMo.getScale();
        this.engine.slowMotion = timeScale;
        this.engine.update(dt);

        for (const ai of this.ais) {
            ai.update(dt, this.engine.time, this.engine);
        }

        for (const marble of this.engine.marbles) {
            if (!marble.alive) continue;
            marble.updateTrail();

            if (!marble.finished && marble.y >= this.finishY) {
                marble.finished = true;
                marble.finishTime = this.raceTimer;
                marble.rank = this.nextRank++;
                this.rankings.push(marble);
                this.updateRankingsUI();

                if (marble.rank === 1) {
                    this.renderer.slowMo.trigger(0.3, 2);
                    this.renderer.camera.shake(15);
                    this.renderer.flash.trigger('#fff', 0.2);
                    this.audio.playFinish(1);
                    this.renderer.camera.dramaticFinishZoom = true;
                    setTimeout(() => {
                        this.renderer.camera.dramaticFinishZoom = false;
                    }, 3000);
                } else {
                    this.audio.playFinish(marble.rank);
                }
            }

            if (marble.y > this.finishY + 500 || marble.y < -1000 ||
                marble.x < -2000 || marble.x > 2000) {
                if (!marble.finished) {
                    marble.alive = false;
                }
            }
        }

        for (const event of this.engine.events) {
            if (event.type === 'collision' && event.force > 100) {
                this.renderer.particles.emitCollision(
                    event.x, event.y, event.nx, event.ny, event.force, event.marble.color
                );
                const impactSquash = Math.min(0.7, event.force * 0.0003);
                event.marble.squashTarget = 1 - impactSquash;
                const pan = this.audio.getSpatialPan(event.marble.x, this.renderer.camera.x, this.canvas.width / this.renderer.camera.zoom);
                this.audio.playBounce(event.force, pan);
                if (event.force > 500) {
                    this.renderer.camera.shake(event.force * 0.005);
                }
            }
        }

        const activeMarbles = this.engine.marbles.filter(m => m.alive && !m.finished);
        if (activeMarbles.length === 0 && this.raceState === 'racing') {
            this.raceState = 'finished';
            this.replay.stopRecording();
            this.updateRankingsUI();
        }

        const maxSpeed = Math.max(...this.engine.marbles.filter(m => m.alive).map(m => m.getSpeed()), 0);
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
        this.renderer.render(this.engine, dt);
        this.renderUI();
    }

    renderUI() {
        const ctx = this.ctx;
        const w = this.canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
        const h = this.canvas.height / (Math.min(window.devicePixelRatio || 1, 2));

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ctx.scale(dpr, dpr);

        if (this.raceState === 'countdown' && this.countdownTimer > 0) {
            const num = Math.ceil(this.countdownTimer);
            const scale = 1 + (1 - (this.countdownTimer % 1)) * 0.3;
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.scale(scale, scale);
            ctx.font = 'bold 120px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#6366f1';
            ctx.shadowBlur = 30;
            ctx.fillText(num > 0 ? String(num) : 'GO!', 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        if (this.raceState === 'racing' || this.raceState === 'finished') {
            ctx.font = 'bold 16px system-ui, sans-serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            const mins = Math.floor(this.raceTimer / 60);
            const secs = (this.raceTimer % 60).toFixed(1);
            ctx.fillText(`⏱ ${mins}:${secs.padStart(4, '0')}`, 10, 30);
        }

        if (this.raceState === 'finished') {
            ctx.save();
            ctx.font = 'bold 48px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 20;
            ctx.fillText('RACE COMPLETE!', w / 2, 80);
            ctx.shadowBlur = 0;

            if (this.rankings.length > 0) {
                ctx.font = 'bold 24px system-ui, sans-serif';
                ctx.fillStyle = '#ffd700';
                ctx.fillText(`🏆 ${this.rankings[0].name} WINS!`, w / 2, 120);
            }
            ctx.restore();
        }

        if (this.raceState === 'replay') {
            ctx.font = 'bold 20px system-ui, sans-serif';
            ctx.fillStyle = '#ff4466';
            ctx.textAlign = 'center';
            ctx.fillText(`⏪ REPLAY (${Math.round(this.replay.getProgress() * 100)}%)`, w / 2, 30);
        }

        if (this.showLeaderboard) {
            this.renderLeaderboard(ctx, w, h);
        }

        if (this.showFPS) {
            ctx.font = '12px monospace';
            ctx.fillStyle = this.perf.getFPS() < 30 ? '#ff4444' : '#44ff44';
            ctx.textAlign = 'right';
            ctx.fillText(`${this.perf.getFPS()} FPS | ${this.perf.qualityLevel.toUpperCase()}`, w - 10, 20);
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
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

        const lbWidth = 180;
        const lbX = w - lbWidth - 10;
        const lbY = 40;
        const rowH = 24;
        const maxShow = Math.min(marbles.length, 10);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(lbX, lbY, lbWidth, 30 + maxShow * rowH, 10);
        ctx.fill();

        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText('LEADERBOARD', lbX + 10, lbY + 20);

        ctx.font = '13px system-ui, sans-serif';
        for (let i = 0; i < maxShow; i++) {
            const m = marbles[i];
            const y = lbY + 35 + i * rowH;
            const rank = m.finished ? `#${m.rank}` : `${i + 1}.`;
            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.arc(lbX + 16, y - 3, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = m.finished ? '#ffd700' : '#ccc';
            ctx.fillText(`${rank} ${m.name}`, lbX + 26, y);
            if (m.finished) {
                ctx.fillStyle = '#888';
                ctx.textAlign = 'right';
                ctx.fillText(`${m.finishTime.toFixed(1)}s`, lbX + lbWidth - 10, y);
                ctx.textAlign = 'left';
            }
        }
    }

    updateRankingsUI() {
        const el = document.getElementById('rankingsList');
        if (!el) return;
        el.innerHTML = '';
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

const app = new MarbleRaceApp();
document.addEventListener('DOMContentLoaded', () => app.init());
if (document.readyState !== 'loading') app.init();
