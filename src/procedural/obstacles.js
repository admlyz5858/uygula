import { getMaterial } from '../physics/materials.js';
import { ForceZone } from '../physics/forces.js';

export class Spinner {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.radius = config.radius || 80;
        this.speed = config.speed || 2;
        this.arms = config.arms || 3;
        this.armWidth = config.armWidth || 8;
        this.angle = config.startAngle || 0;
        this.material = getMaterial(config.material || 'metal');
        this.materialName = config.material || 'metal';
        this.clockwise = config.clockwise !== false;
    }

    update(time, dt) {
        this.angle = time * this.speed * (this.clockwise ? 1 : -1);
    }

    getCollisionGeometry() {
        const segs = [];
        for (let i = 0; i < this.arms; i++) {
            const a = this.angle + (i / this.arms) * Math.PI * 2;
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            segs.push({
                x1: this.x + cos * 10,
                y1: this.y + sin * 10,
                x2: this.x + cos * this.radius,
                y2: this.y + sin * this.radius,
                material: this.material,
            });
        }
        return { segments: segs };
    }

    getVelocityAt(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const omega = this.speed * (this.clockwise ? 1 : -1);
        return {
            x: -dy * omega * 0.5,
            y: dx * omega * 0.5,
        };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = this.material.color || '#aab';
        ctx.lineWidth = this.armWidth;
        ctx.lineCap = 'round';
        for (let i = 0; i < this.arms; i++) {
            const a = (i / this.arms) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
            ctx.lineTo(Math.cos(a) * this.radius, Math.sin(a) * this.radius);
            ctx.stroke();
        }
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class Pendulum {
    constructor(config) {
        this.pivotX = config.x;
        this.pivotY = config.y;
        this.length = config.length || 120;
        this.maxAngle = config.maxAngle || Math.PI / 3;
        this.speed = config.speed || 2;
        this.ballRadius = config.ballRadius || 20;
        this.angle = 0;
        this.material = getMaterial(config.material || 'metal');
        this.bobX = 0;
        this.bobY = 0;
    }

    update(time) {
        this.angle = Math.sin(time * this.speed) * this.maxAngle;
        this.bobX = this.pivotX + Math.sin(this.angle) * this.length;
        this.bobY = this.pivotY + Math.cos(this.angle) * this.length;
    }

    getCollisionGeometry() {
        return {
            segments: [{
                x1: this.pivotX, y1: this.pivotY,
                x2: this.bobX, y2: this.bobY,
                material: this.material,
            }],
        };
    }

    getVelocityAt(px, py) {
        const omega = Math.cos(performance.now() / 1000 * this.speed) * this.maxAngle * this.speed;
        return {
            x: Math.cos(this.angle) * this.length * omega * 0.3,
            y: -Math.sin(this.angle) * this.length * omega * 0.3,
        };
    }

    render(ctx) {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.pivotX, this.pivotY);
        ctx.lineTo(this.bobX, this.bobY);
        ctx.stroke();

        ctx.fillStyle = this.material.color || '#aab';
        ctx.beginPath();
        ctx.arc(this.bobX, this.bobY, this.ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(this.pivotX, this.pivotY, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class Oscillator {
    constructor(config) {
        this.x1 = config.x;
        this.y1 = config.y;
        this.x2 = config.x + (config.dx || 0);
        this.y2 = config.y + (config.dy || 0);
        this.length = config.length || 80;
        this.speed = config.speed || 2;
        this.thickness = config.thickness || 8;
        this.material = getMaterial(config.material || 'metal');
        this.phase = config.phase || 0;
        this.currentX = this.x1;
        this.currentY = this.y1;
    }

    update(time) {
        const t = (Math.sin(time * this.speed + this.phase) + 1) / 2;
        this.currentX = this.x1 + (this.x2 - this.x1) * t;
        this.currentY = this.y1 + (this.y2 - this.y1) * t;
    }

    getCollisionGeometry() {
        const angle = Math.atan2(this.y2 - this.y1, this.x2 - this.x1) + Math.PI / 2;
        const perpX = Math.cos(angle) * this.length / 2;
        const perpY = Math.sin(angle) * this.length / 2;
        return {
            segments: [{
                x1: this.currentX - perpX,
                y1: this.currentY - perpY,
                x2: this.currentX + perpX,
                y2: this.currentY + perpY,
                material: this.material,
            }],
        };
    }

    getVelocityAt() {
        const omega = Math.cos(performance.now() / 1000 * this.speed + this.phase) * this.speed;
        return {
            x: (this.x2 - this.x1) * omega * 0.3,
            y: (this.y2 - this.y1) * omega * 0.3,
        };
    }

    render(ctx) {
        const geom = this.getCollisionGeometry();
        const s = geom.segments[0];
        ctx.strokeStyle = this.material.color || '#aab';
        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
    }
}

export class Bumper {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.radius = config.radius || 20;
        this.force = config.force || 500;
        this.material = getMaterial('bouncy');
        this.flashTimer = 0;
    }

    update(time, dt) {
        this.flashTimer = Math.max(0, this.flashTimer - dt);
    }

    getCollisionGeometry() {
        const n = 8;
        const segs = [];
        for (let i = 0; i < n; i++) {
            const a1 = (i / n) * Math.PI * 2;
            const a2 = ((i + 1) / n) * Math.PI * 2;
            segs.push({
                x1: this.x + Math.cos(a1) * this.radius,
                y1: this.y + Math.sin(a1) * this.radius,
                x2: this.x + Math.cos(a2) * this.radius,
                y2: this.y + Math.sin(a2) * this.radius,
                material: this.material,
            });
        }
        return { segments: segs };
    }

    getVelocityAt() {
        return { x: 0, y: 0 };
    }

    render(ctx) {
        const glow = this.flashTimer > 0 ? 1 : 0.3;
        ctx.fillStyle = `rgba(255, 100, 150, ${glow})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff6699';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

export class Trapdoor {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width || 80;
        this.openInterval = config.openInterval || 3;
        this.openDuration = config.openDuration || 1;
        this.material = getMaterial(config.material || 'wood');
        this.isOpen = false;
    }

    update(time) {
        const cycle = time % (this.openInterval + this.openDuration);
        this.isOpen = cycle > this.openInterval;
    }

    getCollisionGeometry() {
        if (this.isOpen) return { segments: [] };
        return {
            segments: [{
                x1: this.x - this.width / 2, y1: this.y,
                x2: this.x + this.width / 2, y2: this.y,
                material: this.material,
            }],
        };
    }

    getVelocityAt() { return { x: 0, y: 0 }; }

    render(ctx) {
        if (this.isOpen) {
            ctx.strokeStyle = 'rgba(150,120,80,0.3)';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - this.width / 2, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            ctx.strokeStyle = this.material.color || '#a86';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(this.x - this.width / 2, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y);
            ctx.stroke();
        }
    }
}

export class ConveyorBelt {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width || 120;
        this.speed = config.speed || 150;
        this.angle = config.angle || 0;
        this.material = getMaterial('conveyor');
        this.animPhase = 0;
    }

    update(time, dt) {
        this.animPhase += this.speed * dt * 0.05;
    }

    getCollisionGeometry() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const hw = this.width / 2;
        return {
            segments: [{
                x1: this.x - cos * hw, y1: this.y - sin * hw,
                x2: this.x + cos * hw, y2: this.y + sin * hw,
                material: this.material,
            }],
        };
    }

    getVelocityAt() {
        return {
            x: Math.cos(this.angle) * this.speed,
            y: Math.sin(this.angle) * this.speed,
        };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#555';
        ctx.fillRect(-this.width / 2, -6, this.width, 12);
        ctx.strokeStyle = '#fa0';
        ctx.lineWidth = 1;
        const spacing = 15;
        for (let i = 0; i < this.width / spacing; i++) {
            const ox = -this.width / 2 + ((i * spacing + this.animPhase) % this.width);
            ctx.beginPath();
            ctx.moveTo(ox, -5);
            ctx.lineTo(ox + 8, 5);
            ctx.stroke();
        }
        ctx.restore();
    }
}

export class ElasticPad {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width || 60;
        this.bounceMult = config.bounceMult || 2.5;
        this.material = getMaterial('bouncy');
        this.compressionAnim = 0;
    }

    update(time, dt) {
        this.compressionAnim *= 0.9;
    }

    getCollisionGeometry() {
        return {
            segments: [{
                x1: this.x - this.width / 2, y1: this.y,
                x2: this.x + this.width / 2, y2: this.y,
                material: this.material,
            }],
        };
    }

    getVelocityAt() {
        return { x: 0, y: -this.bounceMult * 100 };
    }

    render(ctx) {
        const comp = this.compressionAnim;
        ctx.fillStyle = '#ff6699';
        ctx.fillRect(this.x - this.width / 2, this.y - 4 + comp * 3, this.width, 8 - comp * 3);
        ctx.strokeStyle = '#ff99bb';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width / 2, this.y - 4 + comp * 3, this.width, 8 - comp * 3);
    }
}

export function createObstacle(config) {
    switch (config.type) {
        case 'spinner': return new Spinner(config);
        case 'pendulum': return new Pendulum(config);
        case 'oscillator': return new Oscillator(config);
        case 'bumper': return new Bumper(config);
        case 'trapdoor': return new Trapdoor(config);
        case 'conveyor': return new ConveyorBelt(config);
        case 'elastic': return new ElasticPad(config);
        default: return null;
    }
}
