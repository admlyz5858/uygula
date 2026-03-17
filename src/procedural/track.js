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

const WALL = 'metal';

export class TrackGenerator {
    constructor(seed = 42) {
        this.rng = new SeededRandom(seed);
        this.segments = [];
        this.obstacles = [];
        this.forceZones = [];
        this.startPositions = [];
        this.finishY = 0;
        this.trackWidth = 0;
        this.trackHeight = 0;
        this.trackMinX = 0;
        this.trackMaxX = 0;
    }

    generate(marbleCount = 12) {
        this.segments = [];
        this.obstacles = [];
        this.startPositions = [];

        const W = 500;
        const H = 900;
        const wallThick = 5;
        const channelW = 130;
        this.trackWidth = W;
        this.trackHeight = H;

        this.addWall(-W / 2, 0, -W / 2, H);
        this.addWall(W / 2, 0, W / 2, H);
        this.addWall(-W / 2, 0, W / 2, 0);
        this.addWall(-W / 2, H, W / 2, H);

        const funnelW = Math.min(W - 40, marbleCount * 26);
        const funnelL = -funnelW / 2;
        const funnelR = funnelW / 2;
        const funnelBottom = 100;
        const neckW = 80;

        this.addWall(funnelL, 20, -neckW / 2, funnelBottom);
        this.addWall(funnelR, 20, neckW / 2, funnelBottom);

        const cols = Math.ceil(Math.sqrt(marbleCount));
        const spacingX = (funnelW - 30) / Math.max(cols - 1, 1);
        for (let i = 0; i < marbleCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            this.startPositions.push({
                x: funnelL + 15 + col * spacingX + this.rng.range(-2, 2),
                y: 30 + row * 24,
            });
        }

        let y = funnelBottom;

        const pegRows = this.rng.int(3, 5);
        for (let r = 0; r < pegRows; r++) {
            const py = y + 25 + r * 35;
            const pegCols = this.rng.int(3, 6);
            const pegSpread = W * 0.6;
            for (let c = 0; c < pegCols; c++) {
                const offset = (r % 2 === 0) ? 0 : pegSpread / pegCols / 2;
                const px = -pegSpread / 2 + offset + c * (pegSpread / pegCols);
                this.addPeg(px, py, this.rng.range(8, 14), this.rng.pick(['rubber', 'bouncy', 'metal']));
            }
        }
        y += pegRows * 35 + 40;

        const rampCount = this.rng.int(3, 5);
        for (let i = 0; i < rampCount; i++) {
            const dir = (i % 2 === 0) ? 1 : -1;
            const rampY = y + i * 60;
            const rampLen = W * 0.75;
            const gap = 50;
            if (dir > 0) {
                this.addWall(-W / 2 + 20, rampY, W / 2 - gap, rampY + 20, this.rng.pick(['metal', 'ice', 'wood']));
            } else {
                this.addWall(-W / 2 + gap, rampY + 20, W / 2 - 20, rampY, this.rng.pick(['metal', 'ice', 'wood']));
            }
        }
        y += rampCount * 60 + 30;

        if (this.rng.chance(0.7)) {
            const spinY = y + 30;
            const spinR = Math.min(50, W * 0.15);
            this.obstacles.push({
                type: 'spinner',
                x: this.rng.range(-40, 40),
                y: spinY,
                radius: spinR,
                speed: this.rng.range(1.5, 3),
                arms: this.rng.int(2, 3),
                material: 'metal',
            });
            y += 80;
        }

        const pegRows2 = this.rng.int(2, 4);
        for (let r = 0; r < pegRows2; r++) {
            const py = y + 15 + r * 30;
            const pegCols = this.rng.int(2, 5);
            const spread = W * 0.5;
            for (let c = 0; c < pegCols; c++) {
                const offset = (r % 2 === 0) ? 0 : spread / pegCols / 2;
                const px = -spread / 2 + offset + c * (spread / pegCols);
                this.addPeg(px, py, this.rng.range(6, 12), this.rng.pick(['rubber', 'bouncy']));
            }
        }
        y += pegRows2 * 30 + 30;

        if (this.rng.chance(0.6)) {
            const bumpCount = this.rng.int(2, 4);
            for (let i = 0; i < bumpCount; i++) {
                this.obstacles.push({
                    type: 'bumper',
                    x: this.rng.range(-W / 3, W / 3),
                    y: y + this.rng.range(10, 60),
                    radius: this.rng.range(12, 20),
                    force: this.rng.range(150, 300),
                });
            }
            y += 70;
        }

        if (y < H - 150) {
            const funnelY = y;
            const funnelEndY = H - 80;
            const collectW = 60;
            this.addWall(-W / 3, funnelY, -collectW / 2, funnelEndY);
            this.addWall(W / 3, funnelY, collectW / 2, funnelEndY);
        }

        this.finishY = H - 50;
        this.addWall(-W / 2 + 10, H - 10, W / 2 - 10, H - 10, 'rubber');

        this.trackMinX = -W / 2;
        this.trackMaxX = W / 2;

        return {
            segments: this.segments,
            obstacles: this.obstacles,
            forceZones: this.forceZones,
            startPositions: this.startPositions,
            finishY: this.finishY,
            bounds: { minX: -W / 2, maxX: W / 2, minY: 0, maxY: H },
        };
    }

    addWall(x1, y1, x2, y2, material = WALL) {
        this.segments.push({ x1, y1, x2, y2, material });
    }

    addPeg(x, y, size, material = 'metal') {
        this.segments.push({ x1: x - size, y1: y, x2: x + size, y2: y, material });
    }
}

export function buildTrack(engine, renderer, seed, marbleCount) {
    const gen = new TrackGenerator(seed);
    const data = gen.generate(marbleCount);

    for (const seg of data.segments) {
        engine.addSegment(seg.x1, seg.y1, seg.x2, seg.y2, seg.material);
    }

    for (const cfg of data.obstacles) {
        const obs = createObstacle(cfg);
        if (obs) engine.addKinematicBody(obs);
    }

    for (const zc of data.forceZones) {
        engine.addForceZone(new ForceZone(zc.type, zc));
    }

    if (renderer) renderer.finishLineY = data.finishY;

    return {
        startPositions: data.startPositions,
        finishY: data.finishY,
        bounds: data.bounds,
    };
}
