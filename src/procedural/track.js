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
    range(min, max) {
        return min + this.next() * (max - min);
    }
    int(min, max) {
        return Math.floor(this.range(min, max + 0.999));
    }
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }
    chance(p) {
        return this.next() < p;
    }
}

const WALL_MAT = 'metal';

export class TrackGenerator {
    constructor(seed = 42) {
        this.rng = new SeededRandom(seed);
        this.leftWall = [];
        this.rightWall = [];
        this.extraSegments = [];
        this.obstacles = [];
        this.forceZones = [];
        this.startPositions = [];
        this.finishY = 0;
        this.cx = 0;
        this.cy = 0;
        this.width = 280;
    }

    generate(marbleCount = 12) {
        this.cx = 0;
        this.cy = 0;
        this.width = 280;
        this.leftWall = [{ x: -this.width / 2, y: 0 }];
        this.rightWall = [{ x: this.width / 2, y: 0 }];

        this.buildFunnel(marbleCount);
        this.buildStraight(120);
        this.buildChaosZone();
        this.buildNarrowSection();
        this.buildStraight(100);
        this.buildObstacleGauntlet();
        this.buildCheckpoint();
        this.buildSteepDrop();
        this.buildSplitPath();
        this.buildChaosZone2();
        this.buildFinishArena();

        const segments = this.buildSegments();
        return {
            segments,
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
        const w = newWidth !== null ? newWidth : this.width;
        const newCx = this.cx + dxShift;
        const y = this.cy + dy;
        this.pushWalls(newCx - w / 2, newCx + w / 2, y);
        this.cx = newCx;
        this.width = w;
        return y;
    }

    buildStraight(length, material) {
        return this.extend(length);
    }

    buildFunnel(marbleCount) {
        const funnelW = 380;
        const narrowW = 200;
        this.pushWalls(-funnelW / 2, funnelW / 2, this.cy);

        const ceilY = this.cy - 5;
        this.extraSegments.push(
            { x1: -funnelW / 2, y1: ceilY, x2: funnelW / 2, y2: ceilY, material: WALL_MAT }
        );

        const cols = Math.ceil(Math.sqrt(marbleCount));
        const spacing = (funnelW - 80) / Math.max(cols, 1);
        for (let i = 0; i < marbleCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            this.startPositions.push({
                x: -funnelW / 2 + 50 + col * spacing + this.rng.range(-3, 3),
                y: ceilY - 20 - row * 28,
            });
        }

        this.extend(180, 0, narrowW);
        this.width = narrowW;
    }

    buildChaosZone() {
        this.buildStraight(60);

        const pegs = this.rng.int(4, 8);
        for (let row = 0; row < pegs; row++) {
            const py = this.cy + 30 + row * 50;
            const cols = this.rng.int(2, 4);
            for (let c = 0; c < cols; c++) {
                const px = this.cx - this.width / 3 + (c / (cols - 1 || 1)) * (this.width * 2 / 3);
                const size = this.rng.range(12, 22);
                const mat = this.rng.pick(['rubber', 'metal', 'bouncy']);
                this.extraSegments.push({
                    x1: px - size, y1: py, x2: px + size, y2: py, material: mat,
                });
            }
        }
        this.extend(pegs * 50 + 60);

        if (this.rng.chance(0.7)) {
            this.obstacles.push({
                type: 'spinner',
                x: this.cx + this.rng.range(-40, 40),
                y: this.cy - 60,
                radius: this.rng.range(50, 100),
                speed: this.rng.range(1.5, 3.5),
                arms: this.rng.int(2, 4),
                material: 'metal',
            });
        }

        const shift = this.rng.range(-60, 60);
        this.extend(150, shift);
        this.buildStraight(60);
    }

    buildNarrowSection() {
        const narrowW = this.rng.range(50, 80);
        this.extend(40, 0, narrowW);
        this.buildStraight(160);
        this.extend(40, 0, this.rng.range(180, 260));
        this.buildStraight(60);

        if (this.rng.chance(0.7)) {
            this.obstacles.push({
                type: 'trapdoor',
                x: this.cx,
                y: this.cy - 100,
                width: narrowW + 20,
                openInterval: this.rng.range(2, 4),
                openDuration: this.rng.range(0.8, 1.5),
            });
        }
    }

    buildObstacleGauntlet() {
        this.buildStraight(40);
        const count = this.rng.int(2, 4);
        for (let i = 0; i < count; i++) {
            const py = this.cy + 40 + i * 120;
            const side = i % 2 === 0 ? -1 : 1;
            this.obstacles.push({
                type: 'pendulum',
                x: this.cx + side * this.rng.range(20, 60),
                y: py - 60,
                length: this.rng.range(60, 100),
                speed: this.rng.range(1.5, 3),
                maxAngle: this.rng.range(0.5, 1.0),
                material: 'metal',
            });
        }
        this.extend(count * 120 + 60);
    }

    buildCheckpoint() {
        const wideW = this.width + 120;
        this.extend(30, 0, wideW);

        this.extraSegments.push({
            x1: this.cx - wideW / 2, y1: this.cy,
            x2: this.cx + wideW / 2, y2: this.cy,
            material: 'rubber',
        });

        this.buildStraight(80);
        this.extend(30, 0, this.width - 40);
        this.buildStraight(60);
    }

    buildSteepDrop() {
        const dropLen = this.rng.range(250, 400);
        const zigzags = this.rng.int(2, 4);
        const zigW = this.width * 0.7;

        for (let i = 0; i < zigzags; i++) {
            const dir = (i % 2 === 0 ? 1 : -1) * this.rng.range(60, 120);
            this.extend(dropLen / zigzags, dir, zigW);
        }

        if (this.rng.chance(0.6)) {
            this.obstacles.push({
                type: 'spinner',
                x: this.cx,
                y: this.cy - dropLen / 2,
                radius: this.rng.range(70, 120),
                speed: this.rng.range(2, 5),
                arms: this.rng.int(2, 4),
                material: 'metal',
                clockwise: this.rng.chance(0.5),
            });
        }

        if (this.rng.chance(0.5)) {
            this.forceZones.push({
                type: 'vortex',
                x: this.cx + this.rng.range(-50, 50),
                y: this.cy - this.rng.range(80, 180),
                radius: this.rng.range(50, 90),
                strength: this.rng.range(200, 400),
            });
        }

        this.extend(30, 0, this.rng.range(200, 280));
        this.buildStraight(80);
    }

    buildSplitPath() {
        const splitLen = 200;
        const w = this.width;
        const y0 = this.cy;

        this.extraSegments.push({
            x1: this.cx, y1: y0,
            x2: this.cx, y2: y0 + splitLen,
            material: WALL_MAT,
        });
        this.extend(splitLen);

        if (this.rng.chance(0.6)) {
            this.obstacles.push({
                type: 'conveyor',
                x: this.cx - w / 4,
                y: y0 + splitLen / 2,
                width: w / 3,
                speed: this.rng.range(100, 200),
                angle: 0,
            });
        }

        this.buildStraight(60);
    }

    buildChaosZone2() {
        const numBumpers = this.rng.int(3, 6);
        for (let i = 0; i < numBumpers; i++) {
            this.obstacles.push({
                type: 'bumper',
                x: this.cx + this.rng.range(-this.width / 3, this.width / 3),
                y: this.cy + 20 + this.rng.range(0, 150),
                radius: this.rng.range(15, 28),
                force: this.rng.range(300, 600),
            });
        }
        this.extend(200);

        if (this.rng.chance(0.6)) {
            this.forceZones.push({
                type: 'wind',
                x: this.cx,
                y: this.cy - 100,
                width: 260,
                height: 120,
                strength: this.rng.range(150, 350),
                direction: { x: this.rng.range(-1, 1), y: 0 },
            });
        }

        if (this.rng.chance(0.5)) {
            this.forceZones.push({
                type: 'fluid',
                x: this.cx,
                y: this.cy - 40,
                width: 250,
                height: 60,
                strength: 1,
                config: { viscosity: 0.03, buoyancy: -0.2 },
            });
        }

        if (this.rng.chance(0.5)) {
            this.forceZones.push({
                type: 'randomForce',
                x: this.cx,
                y: this.cy + 20,
                width: 200,
                height: 100,
                strength: this.rng.range(200, 500),
            });
        }

        this.buildStraight(120);

        if (this.rng.chance(0.5)) {
            this.obstacles.push({
                type: 'elastic',
                x: this.cx + this.rng.range(-60, 60),
                y: this.cy - 60,
                width: this.rng.range(50, 90),
                bounceMult: this.rng.range(1.5, 3),
            });
        }

        this.buildStraight(80);
    }

    buildFinishArena() {
        const arenaW = this.width + 150;
        this.extend(40, 0, arenaW);
        this.buildStraight(180);

        this.finishY = this.cy;

        const floorY = this.cy + 60;
        this.extraSegments.push({
            x1: this.cx - arenaW / 2, y1: floorY,
            x2: this.cx + arenaW / 2, y2: floorY,
            material: 'rubber',
        });
        this.pushWalls(this.cx - arenaW / 2, this.cx + arenaW / 2, floorY);
    }

    buildSegments() {
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

        for (const seg of this.extraSegments) {
            segments.push(seg);
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

    const obstacleInstances = [];
    for (const cfg of data.obstacles) {
        const obs = createObstacle(cfg);
        if (obs) {
            engine.addKinematicBody(obs);
            obstacleInstances.push(obs);
        }
    }

    for (const zoneConfig of data.forceZones) {
        const zone = new ForceZone(zoneConfig.type, zoneConfig);
        engine.addForceZone(zone);
    }

    if (renderer) {
        renderer.finishLineY = data.finishY;
    }

    return {
        startPositions: data.startPositions,
        finishY: data.finishY,
        obstacles: obstacleInstances,
    };
}
