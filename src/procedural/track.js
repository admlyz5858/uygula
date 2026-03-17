import { createObstacle } from './obstacles.js';
import { ForceZone } from '../physics/forces.js';

class SeededRandom {
    constructor(seed) {
        this.seed = Math.abs(seed) || 1;
    }
    next() {
        this.seed = (this.seed * 16807 + 0) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
    range(min, max) { return min + this.next() * (max - min); }
    int(min, max) { return Math.floor(this.range(min, max + 0.999)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
}

const WALL_MAT = 'metal';
const MIN_WIDTH = 120;

export class TrackGenerator {
    constructor(seed = 42) {
        this.rng = new SeededRandom(seed);
        this.leftWall = [];
        this.rightWall = [];
        this.pegs = [];
        this.obstacles = [];
        this.forceZones = [];
        this.startPositions = [];
        this.finishY = 0;
        this.cx = 0;
        this.cy = 0;
        this.width = 300;
    }

    generate(marbleCount = 12) {
        this.cx = 0;
        this.cy = 0;
        this.width = 300;
        this.leftWall = [{ x: this.cx - this.width / 2, y: 0 }];
        this.rightWall = [{ x: this.cx + this.width / 2, y: 0 }];

        this.buildStartZone(marbleCount);
        this.buildStraight(150);
        this.buildPegBoard();
        this.buildStraight(80);
        this.buildCurve();
        this.buildStraight(80);
        this.buildObstacleSection();
        this.buildStraight(100);
        this.buildNarrowAndWiden();
        this.buildStraight(80);
        this.buildSteepDrop();
        this.buildStraight(80);
        this.buildSplitMerge();
        this.buildStraight(80);
        this.buildFinalRun();
        this.buildFinish();

        return {
            segments: this.buildAllSegments(),
            obstacles: this.obstacles,
            forceZones: this.forceZones,
            startPositions: this.startPositions,
            finishY: this.finishY,
        };
    }

    pushWalls(leftX, rightX, y) {
        this.leftWall.push({ x: leftX, y });
        this.rightWall.push({ x: rightX, y });
        this.cy = y;
    }

    extend(dy, dxShift = 0, newWidth = null) {
        const w = Math.max(MIN_WIDTH, newWidth !== null ? newWidth : this.width);
        const newCx = this.cx + dxShift;
        const y = this.cy + dy;
        this.pushWalls(newCx - w / 2, newCx + w / 2, y);
        this.cx = newCx;
        this.width = w;
        return y;
    }

    buildStraight(length) {
        return this.extend(length);
    }

    buildStartZone(marbleCount) {
        const startW = Math.max(350, marbleCount * 28);
        this.pushWalls(this.cx - startW / 2, this.cx + startW / 2, this.cy);

        const cols = Math.ceil(Math.sqrt(marbleCount));
        const rows = Math.ceil(marbleCount / cols);
        const spacingX = (startW - 60) / Math.max(cols - 1, 1);
        const spacingY = 26;

        for (let i = 0; i < marbleCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            this.startPositions.push({
                x: this.cx - startW / 2 + 30 + col * spacingX + this.rng.range(-2, 2),
                y: this.cy + 20 + row * spacingY,
            });
        }

        const gateY = this.cy + rows * spacingY + 40;
        this.extend(gateY - this.cy, 0, this.width);
    }

    buildPegBoard() {
        const rowCount = this.rng.int(4, 7);
        const startY = this.cy;
        for (let r = 0; r < rowCount; r++) {
            const py = startY + 30 + r * 55;
            const pegCount = this.rng.int(2, 4);
            const totalW = this.width * 0.6;
            for (let c = 0; c < pegCount; c++) {
                const px = this.cx - totalW / 2 + (c + 0.5) * (totalW / pegCount);
                if (r % 2 === 1) {
                    const offset = totalW / pegCount / 2;
                    this.pegs.push({
                        x1: px + offset - 15, y1: py,
                        x2: px + offset + 15, y2: py,
                        material: this.rng.pick(['rubber', 'metal', 'bouncy']),
                    });
                } else {
                    this.pegs.push({
                        x1: px - 15, y1: py,
                        x2: px + 15, y2: py,
                        material: this.rng.pick(['rubber', 'metal', 'bouncy']),
                    });
                }
            }
        }
        this.extend(rowCount * 55 + 60);
    }

    buildCurve() {
        const dir = this.rng.chance(0.5) ? 1 : -1;
        const shift = dir * this.rng.range(80, 150);
        this.extend(120, shift * 0.4);
        this.extend(120, shift * 0.4);
        this.extend(80, -shift * 0.3);

        if (this.rng.chance(0.5)) {
            this.forceZones.push({
                type: 'wind',
                x: this.cx, y: this.cy - 100,
                width: this.width * 0.8, height: 80,
                radius: 0,
                strength: this.rng.range(40, 100),
                direction: { x: dir * 0.8, y: 0 },
            });
        }
    }

    buildObstacleSection() {
        const maxObstacleR = Math.min(this.width * 0.3, 80);

        if (this.rng.chance(0.7)) {
            this.obstacles.push({
                type: 'spinner',
                x: this.cx,
                y: this.cy + 60,
                radius: this.rng.range(40, maxObstacleR),
                speed: this.rng.range(1.5, 3),
                arms: this.rng.int(2, 3),
                material: 'metal',
            });
            this.extend(150);
        }

        const pendCount = this.rng.int(1, 3);
        for (let i = 0; i < pendCount; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            this.obstacles.push({
                type: 'pendulum',
                x: this.cx + side * this.rng.range(10, 40),
                y: this.cy + 20 + i * 130,
                length: this.rng.range(50, 80),
                speed: this.rng.range(1.5, 2.5),
                maxAngle: this.rng.range(0.4, 0.8),
                material: 'metal',
            });
        }
        this.extend(pendCount * 130 + 60);
    }

    buildNarrowAndWiden() {
        const narrowW = Math.max(MIN_WIDTH, this.rng.range(120, 160));
        this.extend(60, 0, narrowW);
        this.buildStraight(200);

        if (this.rng.chance(0.5)) {
            this.obstacles.push({
                type: 'trapdoor',
                x: this.cx,
                y: this.cy - 100,
                width: narrowW * 0.6,
                openInterval: this.rng.range(2.5, 4),
                openDuration: this.rng.range(1, 2),
            });
        }

        this.extend(60, 0, this.rng.range(250, 350));
        this.buildStraight(80);
    }

    buildSteepDrop() {
        const zigCount = this.rng.int(2, 4);
        const zigW = Math.max(MIN_WIDTH, this.width * 0.75);

        for (let i = 0; i < zigCount; i++) {
            const dir = (i % 2 === 0 ? 1 : -1) * this.rng.range(50, 100);
            this.extend(this.rng.range(100, 160), dir, zigW);
        }

        if (this.rng.chance(0.5)) {
            this.obstacles.push({
                type: 'spinner',
                x: this.cx,
                y: this.cy - 80,
                radius: Math.min(zigW * 0.25, 60),
                speed: this.rng.range(2, 4),
                arms: this.rng.int(2, 3),
                material: 'metal',
                clockwise: this.rng.chance(0.5),
            });
        }

        this.extend(60, 0, Math.max(MIN_WIDTH, this.rng.range(200, 300)));
    }

    buildSplitMerge() {
        const splitH = 200;
        const w = this.width;
        const dividerGap = 40;
        const topY = this.cy;

        this.pegs.push({
            x1: this.cx, y1: topY + dividerGap,
            x2: this.cx, y2: topY + splitH - dividerGap,
            material: WALL_MAT,
        });

        if (this.rng.chance(0.6)) {
            this.obstacles.push({
                type: 'conveyor',
                x: this.cx - w / 4,
                y: topY + splitH / 2,
                width: w / 3.5,
                speed: this.rng.range(80, 160),
                angle: 0,
            });
        }

        this.extend(splitH);
        this.buildStraight(60);
    }

    buildFinalRun() {
        const bumperCount = this.rng.int(2, 5);
        for (let i = 0; i < bumperCount; i++) {
            this.obstacles.push({
                type: 'bumper',
                x: this.cx + this.rng.range(-this.width / 3, this.width / 3),
                y: this.cy + 20 + this.rng.range(0, 130),
                radius: this.rng.range(12, 22),
                force: this.rng.range(200, 400),
            });
        }
        this.extend(180);

        if (this.rng.chance(0.5)) {
            this.obstacles.push({
                type: 'elastic',
                x: this.cx + this.rng.range(-50, 50),
                y: this.cy - 50,
                width: this.rng.range(50, 80),
                bounceMult: this.rng.range(1.5, 2.5),
            });
        }

        this.buildStraight(100);
    }

    buildFinish() {
        const arenaW = this.width + 100;
        this.extend(40, 0, arenaW);
        this.buildStraight(200);

        this.finishY = this.cy;

        const catchY = this.cy + 80;
        this.pegs.push({
            x1: this.cx - arenaW / 2, y1: catchY,
            x2: this.cx + arenaW / 2, y2: catchY,
            material: 'rubber',
        });
        this.pushWalls(this.cx - arenaW / 2, this.cx + arenaW / 2, catchY + 20);
    }

    buildAllSegments() {
        const segments = [];
        for (let i = 0; i < this.leftWall.length - 1; i++) {
            const a = this.leftWall[i];
            const b = this.leftWall[i + 1];
            segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, material: WALL_MAT });
        }
        for (let i = 0; i < this.rightWall.length - 1; i++) {
            const a = this.rightWall[i];
            const b = this.rightWall[i + 1];
            segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, material: WALL_MAT });
        }
        for (const peg of this.pegs) {
            segments.push(peg);
        }
        return segments;
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

    for (const zoneConfig of data.forceZones) {
        const zone = new ForceZone(zoneConfig.type, zoneConfig);
        engine.addForceZone(zone);
    }

    if (renderer) renderer.finishLineY = data.finishY;

    return {
        startPositions: data.startPositions,
        finishY: data.finishY,
    };
}
