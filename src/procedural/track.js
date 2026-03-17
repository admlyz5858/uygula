import { createObstacle } from './obstacles.js';
import { ForceZone } from '../physics/forces.js';

class SeededRandom {
    constructor(seed) { this.seed = Math.abs(seed) || 1; }
    next() { this.seed = (this.seed * 16807) % 2147483647; return (this.seed - 1) / 2147483646; }
    range(min, max) { return min + this.next() * (max - min); }
    int(min, max) { return Math.floor(this.range(min, max + 0.999)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
}

export const LEVELS = [];
for (let i = 1; i <= 50; i++) {
    const diff = (i - 1) / 49;
    LEVELS.push({
        id: i,
        seed: 1000 + i * 7,
        marbles: Math.min(4 + Math.floor(i * 0.4), 16),
        pegRows: Math.min(2 + Math.floor(i * 0.12), 8),
        rampCount: Math.min(1 + Math.floor(i * 0.1), 7),
        hasSpinner: i >= 8,
        spinnerCount: i >= 8 ? Math.min(1 + Math.floor((i - 8) * 0.08), 3) : 0,
        hasBumpers: i >= 5,
        bumperCount: i >= 5 ? Math.min(1 + Math.floor((i - 5) * 0.12), 6) : 0,
        hasPendulum: i >= 15,
        pendulumCount: i >= 15 ? Math.min(1 + Math.floor((i - 15) * 0.06), 3) : 0,
        hasNarrow: i >= 12,
        narrowFactor: i >= 12 ? Math.min(0.4 + diff * 0.4, 0.75) : 0,
        trackWidth: Math.max(350, 500 - Math.floor(diff * 120)),
        rampGap: Math.max(35, 60 - Math.floor(diff * 25)),
        name: getLevelName(i),
    });
}

function getLevelName(n) {
    if (n <= 5) return ['Beginner Run', 'Easy Pegs', 'First Ramps', 'Gentle Curves', 'Bumper Intro'][n - 1];
    if (n <= 10) return ['Peg Maze', 'Double Ramp', 'Spinner!', 'Speed Run', 'Challenge'][n - 6];
    if (n <= 20) return `Track ${n}`;
    if (n <= 30) return `Hard ${n}`;
    if (n <= 40) return `Expert ${n}`;
    return `Master ${n}`;
}

export class TrackGenerator {
    constructor(levelConfig) {
        this.rng = new SeededRandom(levelConfig.seed);
        this.cfg = levelConfig;
        this.segments = [];
        this.obstacles = [];
        this.forceZones = [];
        this.startPositions = [];
        this.finishY = 0;
    }

    generate() {
        const W = this.cfg.trackWidth;
        const H = 900;
        const mc = this.cfg.marbles;

        this.addWall(-W / 2, 0, -W / 2, H);
        this.addWall(W / 2, 0, W / 2, H);
        this.addWall(-W / 2, 0, W / 2, 0);
        this.addWall(-W / 2, H, W / 2, H);

        const funnelW = W - 20;
        const neckW = Math.max(60, W * 0.4);
        const funnelDepth = Math.min(120, 40 + mc * 0.1);
        this.addWall(-funnelW / 2, 10, -neckW / 2, funnelDepth);
        this.addWall(funnelW / 2, 10, neckW / 2, funnelDepth);

        const cols = Math.max(2, Math.ceil(Math.sqrt(mc * (funnelW / (funnelDepth - 15)))));
        const rows = Math.ceil(mc / cols);
        const sx = (funnelW - 10) / Math.max(cols - 1, 1);
        const sy = Math.min(20, (funnelDepth - 25) / Math.max(rows, 1));
        for (let i = 0; i < mc; i++) {
            this.startPositions.push({
                x: -funnelW / 2 + 5 + (i % cols) * sx + this.rng.range(-1, 1),
                y: 15 + Math.floor(i / cols) * sy + this.rng.range(-0.5, 0.5),
            });
        }

        let y = funnelDepth + 10;

        const pegRows = this.cfg.pegRows;
        for (let r = 0; r < pegRows; r++) {
            const py = y + r * 40;
            const pegCols = this.rng.int(3, 6);
            const spread = W * 0.65;
            for (let c = 0; c < pegCols; c++) {
                const off = (r % 2 === 0) ? 0 : spread / pegCols / 2;
                const px = -spread / 2 + off + c * (spread / pegCols);
                this.addPeg(px, py, this.rng.range(7, 13));
            }
        }
        y += pegRows * 40 + 20;

        const rc = this.cfg.rampCount;
        const gap = this.cfg.rampGap;
        for (let i = 0; i < rc; i++) {
            const ry = y + i * 50;
            const dir = (i % 2 === 0) ? 1 : -1;
            const margin = 15;
            if (dir > 0) {
                this.addWall(-W / 2 + margin, ry, W / 2 - gap, ry + 15, this.rng.pick(['metal', 'wood', 'ice']));
            } else {
                this.addWall(-W / 2 + gap, ry + 15, W / 2 - margin, ry, this.rng.pick(['metal', 'wood', 'ice']));
            }
        }
        y += rc * 50 + 15;

        if (this.cfg.hasSpinner) {
            for (let s = 0; s < this.cfg.spinnerCount; s++) {
                const sy = y + s * 90 + 30;
                if (sy > H - 150) break;
                this.obstacles.push({
                    type: 'spinner',
                    x: this.rng.range(-W * 0.2, W * 0.2),
                    y: sy,
                    radius: this.rng.range(30, Math.min(55, W * 0.15)),
                    speed: this.rng.range(1.5, 3),
                    arms: this.rng.int(2, 3),
                    material: 'metal',
                });
            }
            y += this.cfg.spinnerCount * 90 + 10;
        }

        if (this.cfg.hasBumpers) {
            for (let b = 0; b < this.cfg.bumperCount; b++) {
                const by = Math.min(y + this.rng.range(5, 80), H - 120);
                if (by > H - 100) break;
                this.obstacles.push({
                    type: 'bumper',
                    x: this.rng.range(-W / 3, W / 3),
                    y: by,
                    radius: this.rng.range(10, 18),
                    force: this.rng.range(150, 300),
                });
            }
            y += 80;
        }

        if (this.cfg.hasPendulum) {
            for (let p = 0; p < this.cfg.pendulumCount; p++) {
                const py = Math.min(y + p * 80, H - 140);
                if (py > H - 120) break;
                this.obstacles.push({
                    type: 'pendulum',
                    x: this.rng.range(-W * 0.15, W * 0.15),
                    y: py - 40,
                    length: this.rng.range(40, 60),
                    speed: this.rng.range(1.5, 2.5),
                    maxAngle: this.rng.range(0.4, 0.7),
                    material: 'metal',
                });
            }
            y += this.cfg.pendulumCount * 80;
        }

        if (this.cfg.hasNarrow && y < H - 160) {
            const nw = W * (1 - this.cfg.narrowFactor);
            const ny = Math.min(y, H - 160);
            this.addWall(-W / 2 + 10, ny, -nw / 2, ny + 30);
            this.addWall(W / 2 - 10, ny, nw / 2, ny + 30);
            this.addWall(-nw / 2, ny + 30, -nw / 2, ny + 80);
            this.addWall(nw / 2, ny + 30, nw / 2, ny + 80);
            this.addWall(-nw / 2, ny + 80, -W / 2 + 10, ny + 110);
            this.addWall(nw / 2, ny + 80, W / 2 - 10, ny + 110);
        }

        this.finishY = H - 40;
        this.addWall(-W / 2 + 5, H - 5, W / 2 - 5, H - 5, 'rubber');

        return {
            segments: this.segments,
            obstacles: this.obstacles,
            forceZones: this.forceZones,
            startPositions: this.startPositions,
            finishY: this.finishY,
            bounds: { minX: -W / 2, maxX: W / 2, minY: 0, maxY: H },
        };
    }

    addWall(x1, y1, x2, y2, material = 'metal') {
        this.segments.push({ x1, y1, x2, y2, material });
    }
    addPeg(x, y, size) {
        this.segments.push({ x1: x - size, y1: y, x2: x + size, y2: y, material: this.rng.pick(['rubber', 'bouncy', 'metal']) });
    }
}

export function buildTrack(engine, renderer, levelConfig) {
    const gen = new TrackGenerator(levelConfig);
    const data = gen.generate();

    for (const seg of data.segments) engine.addSegment(seg.x1, seg.y1, seg.x2, seg.y2, seg.material);
    for (const cfg of data.obstacles) { const obs = createObstacle(cfg); if (obs) engine.addKinematicBody(obs); }
    for (const zc of data.forceZones) engine.addForceZone(new ForceZone(zc.type, zc));
    if (renderer) renderer.finishLineY = data.finishY;

    return { startPositions: data.startPositions, finishY: data.finishY, bounds: data.bounds };
}
