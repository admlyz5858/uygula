export const GRAVITY = 980;
const AIR_DRAG_K = 0.0002;

export class ForceZone {
    constructor(type, config) {
        this.type = type;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 100;
        this.height = config.height || 100;
        this.radius = config.radius || 0;
        this.strength = config.strength || 1;
        this.direction = config.direction || { x: 0, y: 0 };
        this.config = config;
        this.active = true;
    }

    contains(px, py) {
        if (this.radius > 0) {
            const dx = px - this.x;
            const dy = py - this.y;
            return dx * dx + dy * dy <= this.radius * this.radius;
        }
        return px >= this.x - this.width / 2 && px <= this.x + this.width / 2 &&
               py >= this.y - this.height / 2 && py <= this.y + this.height / 2;
    }
}

export function applyGravity(marble, gravityScale = 1) {
    marble.fy += marble.mass * GRAVITY * gravityScale;
}

export function applyAirDrag(marble) {
    const speed2 = marble.vx * marble.vx + marble.vy * marble.vy;
    if (speed2 < 1) return;
    const speed = Math.sqrt(speed2);
    const dragMag = AIR_DRAG_K * speed2;
    marble.fx -= (marble.vx / speed) * dragMag;
    marble.fy -= (marble.vy / speed) * dragMag;
    marble.angularVelocity *= 0.9998;
}

export function applyRollingFriction(marble, normal, material) {
    if (!marble.isOnGround) return;
    const resistance = material.rollingResistance;
    const normalForce = marble.mass * GRAVITY;
    const torqueMag = resistance * normalForce * marble.radius;
    if (Math.abs(marble.angularVelocity) > 0.01) {
        marble.angularVelocity -= Math.sign(marble.angularVelocity) * torqueMag * marble.invInertia * (1 / 120);
    }
    const tx = -normal.y;
    const ty = normal.x;
    const surfaceSpeed = marble.angularVelocity * marble.radius;
    const linearSurface = marble.vx * tx + marble.vy * ty;
    const slip = linearSurface - surfaceSpeed;
    if (Math.abs(slip) > 1) {
        const correction = -slip * 0.02 * material.dynamicFriction;
        marble.vx += correction * tx;
        marble.vy += correction * ty;
    }
}

export function applySpinEffect(marble) {
    const spin = marble.angularVelocity;
    const speed = marble.getSpeed();
    if (Math.abs(spin) < 0.5 || speed < 20) return;
    const magnusStrength = 0.0003;
    marble.fx += -marble.vy * spin * magnusStrength;
    marble.fy += marble.vx * spin * magnusStrength;
}

export function applyForceZone(marble, zone) {
    if (!zone.active || !zone.contains(marble.x, marble.y)) return false;
    switch (zone.type) {
        case 'gravity': {
            marble.fx += (zone.direction?.x ?? 0) * zone.strength * marble.mass;
            marble.fy += (zone.direction?.y ?? 0) * zone.strength * marble.mass;
            return true;
        }
        case 'magnetic': {
            const dx = zone.x - marble.x;
            const dy = zone.y - marble.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) return true;
            const force = zone.strength / (dist * 0.05 + 1);
            marble.fx += (dx / dist) * force;
            marble.fy += (dy / dist) * force;
            return true;
        }
        case 'vortex': {
            const dx = marble.x - zone.x;
            const dy = marble.y - zone.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) return true;
            const tangentX = -dy / dist;
            const tangentY = dx / dist;
            const inwardX = -dx / dist;
            const inwardY = -dy / dist;
            marble.fx += tangentX * zone.strength * 0.5 + inwardX * zone.strength * 0.15;
            marble.fy += tangentY * zone.strength * 0.5 + inwardY * zone.strength * 0.15;
            return true;
        }
        case 'wind': {
            marble.fx += (zone.direction?.x ?? 0) * zone.strength;
            marble.fy += (zone.direction?.y ?? 0) * zone.strength;
            return true;
        }
        case 'fluid': {
            const viscosity = zone.config?.viscosity || 0.03;
            marble.vx *= (1 - viscosity);
            marble.vy *= (1 - viscosity);
            marble.angularVelocity *= (1 - viscosity * 0.5);
            marble.fy += marble.mass * GRAVITY * (zone.config?.buoyancy || -0.2);
            return true;
        }
        case 'randomForce': {
            const angle = Math.random() * Math.PI * 2;
            marble.fx += Math.cos(angle) * zone.strength * 0.3;
            marble.fy += Math.sin(angle) * zone.strength * 0.3;
            return true;
        }
        default:
            return false;
    }
}
