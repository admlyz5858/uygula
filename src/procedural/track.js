import { createObstacle } from './obstacles.js';
import { ForceZone } from '../physics/forces.js';

class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 16807 + 0) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
    range(min, max) {
        return min + this.next() * (max - min);
    }
    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }
    chance(p) {
        return this.next() < p;
    }
}

const TRACK_WIDTH = 300;
const WALL_MATERIAL = 'metal';

export class TrackGenerator {
    constructor(seed = Date.now()) {
        this.rng = new SeededRandom(seed);
        this.seed = seed;
        this.segments = [];
        this.obstacles = [];
        this.forceZones = [];
        this.startY = 0;
        this.currentY = 0;
        this.currentX = 0;
        this.finishY = 0;
        this.marbleStartPositions = [];
    }

    generate(marbleCount = 10) {
        this.segments = [];
        this.obstacles = [];
        this.forceZones = [];
        this.currentY = 50;
        this.currentX = 0;
        this.startY = 50;

        this.generateStartFunnel(marbleCount);
        this.generateChaosZone();
        this.generateSkillSection();
        this.generateMidCheckpoint();
        this.generateExtremeSection();
        this.generateChaosZone2();
        this.generateFinalArena();

        return {
            segments: this.segments,
            obstacles: this.obstacles,
            forceZones: this.forceZones,
            startPositions: this.marbleStartPositions,
            finishY: this.finishY,
        };
    }

    addWall(x1, y1, x2, y2, material = WALL_MATERIAL) {
        this.segments.push({ x1, y1, x2, y2, material });
    }

    addRamp(startX, startY, endX, endY, width = TRACK_WIDTH) {
        const dx = endX - startX;
        const dy = endY - startY;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len * width / 2;
        const ny = dx / len * width / 2;
        this.addWall(startX + nx, startY + ny, endX + nx, endY + ny);
        this.addWall(startX - nx, startY - ny, endX - nx, endY - ny);
        this.addWall(startX + nx, startY + ny, startX - nx, startY - ny);
    }

    addFloor(x, y, width, material = WALL_MATERIAL) {
        this.addWall(x - width / 2, y, x + width / 2, y, material);
    }

    addBox(x, y, w, h, material = WALL_MATERIAL) {
        this.addWall(x - w / 2, y - h / 2, x + w / 2, y - h / 2, material);
        this.addWall(x + w / 2, y - h / 2, x + w / 2, y + h / 2, material);
        this.addWall(x + w / 2, y + h / 2, x - w / 2, y + h / 2, material);
        this.addWall(x - w / 2, y + h / 2, x - w / 2, y - h / 2, material);
    }

    generateStartFunnel(marbleCount) {
        const y = this.currentY;
        const funnelTop = 400;
        const funnelBottom = 200;

        this.addWall(-funnelTop / 2, y, -funnelBottom / 2, y + 200);
        this.addWall(funnelTop / 2, y, funnelBottom / 2, y + 200);
        this.addWall(-funnelTop / 2, y, funnelTop / 2, y);

        const cols = Math.ceil(Math.sqrt(marbleCount));
        const spacing = (funnelTop - 60) / cols;
        for (let i = 0; i < marbleCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            this.marbleStartPositions.push({
                x: -funnelTop / 2 + 40 + col * spacing + this.rng.range(-5, 5),
                y: y - 30 - row * 30,
            });
        }

        this.currentY = y + 200;
        this.addStraightSection(150, funnelBottom);
    }

    addStraightSection(length, width = TRACK_WIDTH, material = WALL_MATERIAL) {
        const y = this.currentY;
        this.addWall(this.currentX - width / 2, y, this.currentX - width / 2, y + length, material);
        this.addWall(this.currentX + width / 2, y, this.currentX + width / 2, y + length, material);
        this.currentY += length;
    }

    addSlopeSection(length, xShift, width = TRACK_WIDTH, material = WALL_MATERIAL) {
        const y = this.currentY;
        const x = this.currentX;
        this.addWall(x - width / 2, y, x + xShift - width / 2, y + length, material);
        this.addWall(x + width / 2, y, x + xShift + width / 2, y + length, material);
        this.currentX += xShift;
        this.currentY += length;
    }

    generateChaosZone() {
        const startY = this.currentY;

        this.addStraightSection(100);

        const numBumps = this.rng.int(3, 5);
        for (let i = 0; i < numBumps; i++) {
            const bx = this.currentX + this.rng.range(-100, 100);
            const by = this.currentY + 30 + i * 80;
            const peg = this.rng.range(15, 25);
            this.segments.push({
                x1: bx - peg, y1: by, x2: bx + peg, y2: by,
                material: this.rng.pick(['rubber', 'metal', 'bouncy']),
            });
        }

        this.addStraightSection(numBumps * 80 + 60);

        if (this.rng.chance(0.7)) {
            this.obstacles.push({
                type: 'spinner',
                x: this.currentX,
                y: this.currentY - 100,
                radius: this.rng.range(60, 120),
                speed: this.rng.range(1.5, 4),
                arms: this.rng.int(2, 4),
                material: 'metal',
            });
        }

        const shift = this.rng.range(-80, 80);
        this.addSlopeSection(200, shift);

        if (this.rng.chance(0.5)) {
            this.forceZones.push({
                type: 'wind',
                x: this.currentX,
                y: this.currentY - 100,
                width: 300,
                height: 150,
                strength: this.rng.range(100, 300),
                direction: { x: this.rng.range(-1, 1), y: 0 },
            });
        }

        this.addStraightSection(100);
    }

    generateSkillSection() {
        const width = TRACK_WIDTH;

        this.addStraightSection(50);
        const narrowWidth = this.rng.range(60, 100);
        const x = this.currentX;
        const y = this.currentY;

        this.addWall(x - width / 2, y, x - narrowWidth / 2, y + 30);
        this.addWall(x + width / 2, y, x + narrowWidth / 2, y + 30);
        this.currentY += 30;
        this.addStraightSection(150, narrowWidth);

        this.addWall(x - narrowWidth / 2, this.currentY, x - width / 2, this.currentY + 30);
        this.addWall(x + narrowWidth / 2, this.currentY, x + width / 2, this.currentY + 30);
        this.currentY += 30;

        this.addStraightSection(80);

        if (this.rng.chance(0.6)) {
            this.obstacles.push({
                type: 'trapdoor',
                x: this.currentX,
                y: this.currentY - 40,
                width: 120,
                openInterval: this.rng.range(2, 4),
                openDuration: this.rng.range(0.8, 1.5),
            });
        }

        this.addStraightSection(100);

        const numGates = this.rng.int(2, 4);
        for (let i = 0; i < numGates; i++) {
            const gx = this.currentX + this.rng.range(-80, 80);
            const gy = this.currentY + i * 100;
            this.obstacles.push({
                type: 'pendulum',
                x: gx,
                y: gy - 40,
                length: this.rng.range(60, 100),
                speed: this.rng.range(1.5, 3),
                maxAngle: this.rng.range(0.5, 1.2),
            });
        }

        this.addStraightSection(numGates * 100 + 50);
    }

    generateMidCheckpoint() {
        const wideWidth = TRACK_WIDTH + 100;
        const x = this.currentX;
        const y = this.currentY;

        this.addWall(x - TRACK_WIDTH / 2, y, x - wideWidth / 2, y + 30);
        this.addWall(x + TRACK_WIDTH / 2, y, x + wideWidth / 2, y + 30);
        this.currentY += 30;

        this.addFloor(x, this.currentY, wideWidth, 'rubber');
        this.addStraightSection(100, wideWidth);

        this.addWall(x - wideWidth / 2, this.currentY, x - TRACK_WIDTH / 2, this.currentY + 30);
        this.addWall(x + wideWidth / 2, this.currentY, x + TRACK_WIDTH / 2, this.currentY + 30);
        this.currentY += 30;

        this.addStraightSection(80);
    }

    generateExtremeSection() {
        const dropHeight = this.rng.range(300, 500);
        const x = this.currentX;
        const y = this.currentY;

        this.addStraightSection(dropHeight, TRACK_WIDTH * 0.7);

        if (this.rng.chance(0.5)) {
            const zigCount = this.rng.int(2, 4);
            const zigWidth = TRACK_WIDTH * 0.6;
            for (let i = 0; i < zigCount; i++) {
                const dir = i % 2 === 0 ? 1 : -1;
                this.addSlopeSection(100, dir * 100, zigWidth);
            }
        }

        if (this.rng.chance(0.6)) {
            this.obstacles.push({
                type: 'spinner',
                x: this.currentX,
                y: this.currentY - dropHeight / 2,
                radius: this.rng.range(80, 140),
                speed: this.rng.range(2, 5),
                arms: this.rng.int(2, 5),
                material: 'metal',
                clockwise: this.rng.chance(0.5),
            });
        }

        if (this.rng.chance(0.5)) {
            this.forceZones.push({
                type: 'vortex',
                x: this.currentX + this.rng.range(-60, 60),
                y: this.currentY - this.rng.range(100, 200),
                radius: this.rng.range(60, 100),
                strength: this.rng.range(200, 500),
            });
        }

        this.addStraightSection(100);
    }

    generateChaosZone2() {
        this.addStraightSection(50);

        if (this.rng.chance(0.6)) {
            this.obstacles.push({
                type: 'conveyor',
                x: this.currentX,
                y: this.currentY + 25,
                width: 200,
                speed: this.rng.range(100, 250) * (this.rng.chance(0.5) ? 1 : -1),
                angle: 0,
            });
        }
        this.addStraightSection(100);

        const splitterY = this.currentY;
        const cx = this.currentX;
        const splitWidth = 120;

        this.addWall(cx, splitterY, cx, splitterY + 200);
        this.addWall(cx - TRACK_WIDTH / 2, splitterY, cx - TRACK_WIDTH / 2, splitterY + 200);
        this.addWall(cx + TRACK_WIDTH / 2, splitterY, cx + TRACK_WIDTH / 2, splitterY + 200);
        this.currentY += 200;

        this.addWall(cx - TRACK_WIDTH / 2, this.currentY, cx + TRACK_WIDTH / 2, this.currentY + 30);
        this.currentY += 30;

        const numBumpers = this.rng.int(3, 6);
        for (let i = 0; i < numBumpers; i++) {
            this.obstacles.push({
                type: 'bumper',
                x: cx + this.rng.range(-TRACK_WIDTH / 3, TRACK_WIDTH / 3),
                y: this.currentY + this.rng.range(20, 150),
                radius: this.rng.range(15, 30),
                force: this.rng.range(300, 600),
            });
        }

        this.addStraightSection(200);

        if (this.rng.chance(0.5)) {
            this.forceZones.push({
                type: 'randomForce',
                x: this.currentX,
                y: this.currentY - 100,
                width: 250,
                height: 150,
                strength: this.rng.range(200, 500),
            });
        }

        if (this.rng.chance(0.4)) {
            this.forceZones.push({
                type: 'fluid',
                x: this.currentX,
                y: this.currentY - 50,
                width: 250,
                height: 80,
                strength: 1,
                config: { viscosity: 0.03, buoyancy: -0.2 },
            });
        }

        this.addStraightSection(100);
    }

    generateFinalArena() {
        const arenaWidth = TRACK_WIDTH + 150;
        const x = this.currentX;
        const y = this.currentY;

        this.addWall(x - TRACK_WIDTH / 2, y, x - arenaWidth / 2, y + 40);
        this.addWall(x + TRACK_WIDTH / 2, y, x + arenaWidth / 2, y + 40);
        this.currentY += 40;

        this.addStraightSection(200, arenaWidth);

        if (this.rng.chance(0.6)) {
            this.obstacles.push({
                type: 'elastic',
                x: x + this.rng.range(-80, 80),
                y: this.currentY - 100,
                width: this.rng.range(40, 80),
                bounceMult: this.rng.range(1.5, 3),
            });
        }

        this.addStraightSection(150, arenaWidth);

        this.finishY = this.currentY;

        this.addFloor(x, this.finishY + 50, arenaWidth, 'rubber');
        this.addWall(x - arenaWidth / 2, this.finishY + 50, x - arenaWidth / 2, this.finishY - 20);
        this.addWall(x + arenaWidth / 2, this.finishY + 50, x + arenaWidth / 2, this.finishY - 20);
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
