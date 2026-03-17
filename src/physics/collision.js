import { combineFriction, combineRestitution } from './materials.js';

const BAUMGARTE_FACTOR = 0.2;
const SLOP = 0.5;
const CCD_SUBSTEPS = 4;

export class Contact {
    constructor(a, b, nx, ny, depth, px, py) {
        this.a = a;
        this.b = b;
        this.nx = nx;
        this.ny = ny;
        this.depth = depth;
        this.px = px;
        this.py = py;
        this.normalImpulseAccum = 0;
        this.tangentImpulseAccum = 0;
    }
}

export function detectMarbleMarble(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = a.radius + b.radius;
    if (dist >= minDist || dist < 0.0001) return null;
    const nx = dx / dist;
    const ny = dy / dist;
    const depth = minDist - dist;
    const px = a.x + nx * a.radius;
    const py = a.y + ny * a.radius;
    return new Contact(a, b, nx, ny, depth, px, py);
}

export function detectMarbleSegment(marble, seg) {
    const ex = seg.x2 - seg.x1;
    const ey = seg.y2 - seg.y1;
    const len2 = ex * ex + ey * ey;
    if (len2 < 0.0001) return null;
    const fx = marble.x - seg.x1;
    const fy = marble.y - seg.y1;
    let t = (fx * ex + fy * ey) / len2;
    t = Math.max(0, Math.min(1, t));
    const closestX = seg.x1 + t * ex;
    const closestY = seg.y1 + t * ey;
    const dx = marble.x - closestX;
    const dy = marble.y - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= marble.radius || dist < 0.0001) return null;
    const nx = dx / dist;
    const ny = dy / dist;
    const depth = marble.radius - dist;
    return new Contact(marble, null, nx, ny, depth, closestX, closestY);
}

export function detectMarblePolygon(marble, poly) {
    let minDepth = Infinity;
    let bestNx = 0, bestNy = 0;
    let bestPx = 0, bestPy = 0;
    const verts = poly.vertices;
    const n = verts.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const ex = verts[j].x - verts[i].x;
        const ey = verts[j].y - verts[i].y;
        const len = Math.sqrt(ex * ex + ey * ey);
        if (len < 0.001) continue;
        let nx = -ey / len;
        let ny = ex / len;
        const dx = marble.x - verts[i].x;
        const dy = marble.y - verts[i].y;
        const dist = dx * nx + dy * ny;
        const depth = marble.radius - dist;
        if (depth <= 0) return null;
        if (depth < minDepth) {
            minDepth = depth;
            bestNx = nx;
            bestNy = ny;
            bestPx = marble.x - bestNx * marble.radius;
            bestPy = marble.y - bestNy * marble.radius;
        }
    }
    if (minDepth === Infinity) return null;
    return new Contact(marble, null, bestNx, bestNy, minDepth, bestPx, bestPy);
}

export function detectMarbleArc(marble, arc) {
    const dx = marble.x - arc.cx;
    const dy = marble.y - arc.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.0001) return null;
    const angle = Math.atan2(dy, dx);
    let a = angle - arc.startAngle;
    while (a < -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;
    let span = arc.endAngle - arc.startAngle;
    while (span < 0) span += 2 * Math.PI;
    let normA = a;
    while (normA < 0) normA += 2 * Math.PI;
    if (normA > span) return null;
    const innerR = arc.radius - arc.thickness / 2;
    const outerR = arc.radius + arc.thickness / 2;
    if (dist + marble.radius < innerR) return null;
    if (dist - marble.radius > outerR) return null;
    const nx = dx / dist;
    const ny = dy / dist;
    if (dist < arc.radius) {
        const penetration = innerR - (dist - marble.radius);
        if (penetration <= 0) return null;
        return new Contact(marble, null, -nx, -ny, penetration, marble.x + nx * marble.radius, marble.y + ny * marble.radius);
    } else {
        const penetration = (dist + marble.radius) - outerR;
        if (penetration <= 0) return null;
        return new Contact(marble, null, nx, ny, penetration, marble.x - nx * marble.radius, marble.y - ny * marble.radius);
    }
}

export function ccdMarbleSegment(marble, seg, dt) {
    const dx = marble.vx * dt;
    const dy = marble.vy * dt;
    const step = 1 / CCD_SUBSTEPS;
    for (let i = 1; i <= CCD_SUBSTEPS; i++) {
        const t = i * step;
        const testX = marble.x + dx * t;
        const testY = marble.y + dy * t;
        const saved = { x: marble.x, y: marble.y };
        marble.x = testX;
        marble.y = testY;
        const contact = detectMarbleSegment(marble, seg);
        marble.x = saved.x;
        marble.y = saved.y;
        if (contact) {
            return { toi: (i - 1) * step * dt, contact };
        }
    }
    return null;
}

export function resolveContact(contact, dt) {
    const { a: marble, b: other, nx, ny, depth, px, py } = contact;
    const isMarbleMarble = other !== null;
    const relVx = isMarbleMarble ? marble.vx - other.vx : marble.vx;
    const relVy = isMarbleMarble ? marble.vy - other.vy : marble.vy;
    const relVn = relVx * nx + relVy * ny;
    if (relVn > 0 && depth < SLOP) return 0;

    const tx = -ny;
    const ty = nx;
    const relVt = relVx * tx + relVy * ty;

    const rax = px - marble.x;
    const ray = py - marble.y;
    const raXn = rax * ny - ray * nx;
    const raXt = rax * ty - ray * tx;

    let rbXn = 0, rbXt = 0;
    if (isMarbleMarble) {
        const rbx = px - other.x;
        const rby = py - other.y;
        rbXn = rbx * ny - rby * nx;
        rbXt = rbx * ty - rby * tx;
    }

    const invMassSum = marble.invMass + (isMarbleMarble ? other.invMass : 0);
    const invInertiaSum = marble.invInertia * raXn * raXn + (isMarbleMarble ? other.invInertia * rbXn * rbXn : 0);
    const effectiveMassN = invMassSum + invInertiaSum;
    if (effectiveMassN < 0.0001) return 0;

    const restitution = isMarbleMarble
        ? combineRestitution(marble.material.restitution, other.material.restitution)
        : marble.material.restitution;

    const bias = (BAUMGARTE_FACTOR / dt) * Math.max(0, depth - SLOP);
    let jn = (-(1 + restitution) * relVn + bias) / effectiveMassN;
    const newAccumN = Math.max(contact.normalImpulseAccum + jn, 0);
    jn = newAccumN - contact.normalImpulseAccum;
    contact.normalImpulseAccum = newAccumN;

    marble.vx += jn * nx * marble.invMass;
    marble.vy += jn * ny * marble.invMass;
    marble.angularVelocity += (rax * (jn * ny) - ray * (jn * nx)) * marble.invInertia;

    if (isMarbleMarble) {
        other.vx -= jn * nx * other.invMass;
        other.vy -= jn * ny * other.invMass;
        const rbx = px - other.x;
        const rby = py - other.y;
        other.angularVelocity -= (rbx * (jn * ny) - rby * (jn * nx)) * other.invInertia;
    }

    const friction = isMarbleMarble
        ? combineFriction(marble.material.dynamicFriction, other.material.dynamicFriction)
        : marble.material.dynamicFriction;
    const maxFriction = friction * contact.normalImpulseAccum;

    const effectiveMassT = invMassSum + marble.invInertia * raXt * raXt + (isMarbleMarble ? other.invInertia * rbXt * rbXt : 0);
    if (effectiveMassT < 0.0001) return jn;

    let jt = -relVt / effectiveMassT;
    const newAccumT = Math.max(-maxFriction, Math.min(maxFriction, contact.tangentImpulseAccum + jt));
    jt = newAccumT - contact.tangentImpulseAccum;
    contact.tangentImpulseAccum = newAccumT;

    marble.vx += jt * tx * marble.invMass;
    marble.vy += jt * ty * marble.invMass;
    marble.angularVelocity += (rax * (jt * ty) - ray * (jt * tx)) * marble.invInertia;

    if (isMarbleMarble) {
        other.vx -= jt * tx * other.invMass;
        other.vy -= jt * ty * other.invMass;
        const rbx = px - other.x;
        const rby = py - other.y;
        other.angularVelocity -= (rbx * (jt * ty) - rby * (jt * tx)) * other.invInertia;
    }

    const impactForce = Math.abs(jn) / dt;
    marble.lastImpactForce = Math.max(marble.lastImpactForce, impactForce);
    if (isMarbleMarble) {
        other.lastImpactForce = Math.max(other.lastImpactForce, impactForce);
    }

    return jn;
}

export function positionalCorrection(contact) {
    const { a: marble, b: other, nx, ny, depth } = contact;
    const percent = 0.4;
    const slop = 0.5;
    const correction = (Math.max(depth - slop, 0) / (marble.invMass + (other ? other.invMass : 0))) * percent;
    const cx = correction * nx;
    const cy = correction * ny;
    marble.x += cx * marble.invMass;
    marble.y += cy * marble.invMass;
    if (other) {
        other.x -= cx * other.invMass;
        other.y -= cy * other.invMass;
    }
}
