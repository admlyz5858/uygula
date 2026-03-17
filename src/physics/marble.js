import { getMaterial } from './materials.js';

let nextId = 0;

export class Marble {
    constructor(x, y, radius = 12, opts = {}) {
        this.id = nextId++;
        this.x = x;
        this.y = y;
        this.vx = opts.vx || 0;
        this.vy = opts.vy || 0;
        this.angle = 0;
        this.angularVelocity = 0;
        this.radius = radius;
        this.mass = opts.mass || (Math.PI * radius * radius * 0.01);
        this.invMass = 1 / this.mass;
        this.inertia = (2 / 5) * this.mass * radius * radius;
        this.invInertia = 1 / this.inertia;
        this.material = getMaterial(opts.material || 'default');
        this.materialName = opts.material || 'default';
        this.color = opts.color || this.generateColor();
        this.glowColor = opts.glowColor || this.color;
        this.name = opts.name || `Marble ${this.id}`;
        this.aiType = opts.aiType || 'balanced';
        this.finished = false;
        this.finishTime = 0;
        this.rank = 0;
        this.alive = true;
        this.trailPoints = [];
        this.maxTrailLength = 30;
        this.squash = 1.0;
        this.squashTarget = 1.0;
        this.lastImpactForce = 0;
        this.contactNormal = null;
        this.isOnGround = false;
        this.spinEffect = 0;
        this.fx = 0;
        this.fy = 0;
        this.torque = 0;
        this.prevX = x;
        this.prevY = y;
    }

    generateColor() {
        const hue = (this.id * 137.508) % 360;
        return `hsl(${hue}, 85%, 60%)`;
    }

    applyForce(fx, fy) {
        this.fx += fx;
        this.fy += fy;
    }

    applyTorque(t) {
        this.torque += t;
    }

    applyImpulse(jx, jy, rx, ry) {
        this.vx += jx * this.invMass;
        this.vy += jy * this.invMass;
        this.angularVelocity += (rx * jy - ry * jx) * this.invInertia;
    }

    updateTrail() {
        this.trailPoints.unshift({ x: this.x, y: this.y });
        if (this.trailPoints.length > this.maxTrailLength) {
            this.trailPoints.pop();
        }
    }

    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    getKineticEnergy() {
        const linear = 0.5 * this.mass * (this.vx * this.vx + this.vy * this.vy);
        const rotational = 0.5 * this.inertia * this.angularVelocity * this.angularVelocity;
        return linear + rotational;
    }
}
