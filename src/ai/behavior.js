const RAYCAST_DISTANCE = 200;
const STEER_FORCE = 80;
const BRAKE_FORCE = 0.95;

export class MarbleAI {
    constructor(marble, type = 'balanced') {
        this.marble = marble;
        this.type = type;
        this.steerBias = 0;
        this.dangerLevel = 0;
        this.lastDecisionTime = 0;
        this.decisionInterval = 0.1 + Math.random() * 0.1;
        this.personalityNoise = Math.random() * Math.PI * 2;
        this.aggressiveness = this.getTraitValue('aggressiveness');
        this.caution = this.getTraitValue('caution');
        this.reactivity = this.getTraitValue('reactivity');
    }

    getTraitValue(trait) {
        switch (this.type) {
            case 'aggressive':
                return trait === 'aggressiveness' ? 0.9 : trait === 'caution' ? 0.2 : 0.7;
            case 'safe':
                return trait === 'aggressiveness' ? 0.2 : trait === 'caution' ? 0.9 : 0.5;
            case 'random':
                return Math.random();
            default:
                return 0.5;
        }
    }

    update(dt, time, engine) {
        const m = this.marble;
        if (!m.alive || m.finished) return;

        this.lastDecisionTime += dt;
        if (this.lastDecisionTime < this.decisionInterval) return;
        this.lastDecisionTime = 0;

        this.evaluate(engine, time);
        this.applySteer(dt);
        this.applyBraking();
        this.applySlipCorrection(dt);
    }

    evaluate(engine, time) {
        const m = this.marble;
        this.dangerLevel = 0;
        this.steerBias = 0;

        const lookAheadX = m.x + m.vx * 0.5;
        const lookAheadY = m.y + m.vy * 0.5;

        for (const seg of engine.segments) {
            const dist = this.pointToSegmentDist(lookAheadX, lookAheadY, seg);
            if (dist < m.radius * 3) {
                this.dangerLevel += (1 - dist / (m.radius * 3)) * 0.5;
                const side = this.getSide(m.x, m.y, seg);
                this.steerBias += side * (1 - dist / (m.radius * 3)) * this.reactivity;
            }
        }

        for (const other of engine.marbles) {
            if (other === m || !other.alive) continue;
            const dx = other.x - lookAheadX;
            const dy = other.y - lookAheadY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < m.radius * 4) {
                this.dangerLevel += (1 - dist / (m.radius * 4)) * 0.3;
                if (dist > 0.01) {
                    this.steerBias -= (dx / dist) * this.caution * 0.5;
                }
            }
        }

        for (const kb of engine.kinematicBodies) {
            if (!kb.getCollisionGeometry) continue;
            const geom = kb.getCollisionGeometry();
            for (const seg of geom.segments || []) {
                const dist = this.pointToSegmentDist(lookAheadX, lookAheadY, seg);
                if (dist < m.radius * 5) {
                    this.dangerLevel += 0.4;
                    const side = this.getSide(m.x, m.y, seg);
                    this.steerBias += side * this.reactivity * 0.8;
                }
            }
        }

        const noise = Math.sin(time * 3 + this.personalityNoise) * 0.3;
        this.steerBias += noise * (1 - this.caution);

        if (this.type === 'aggressive') {
            this.steerBias *= 0.5;
        }
    }

    applySteer(dt) {
        const m = this.marble;
        const force = this.steerBias * STEER_FORCE * this.reactivity;
        m.fx += force * m.mass;
    }

    applyBraking() {
        const m = this.marble;
        if (this.dangerLevel > 0.5 && this.caution > 0.3) {
            const brakeAmount = this.dangerLevel * this.caution * 0.02;
            m.vx *= (1 - brakeAmount);
            m.vy *= (1 - brakeAmount);
        }
    }

    applySlipCorrection(dt) {
        const m = this.marble;
        if (!m.isOnGround || !m.contactNormal) return;
        const surfaceSpeed = m.angularVelocity * m.radius;
        const tx = -m.contactNormal.y;
        const ty = m.contactNormal.x;
        const linearSurface = m.vx * tx + m.vy * ty;
        const slip = linearSurface - surfaceSpeed;
        if (Math.abs(slip) > 20) {
            const correction = -slip * 0.01 * this.reactivity;
            m.torque += correction * m.inertia;
        }
    }

    pointToSegmentDist(px, py, seg) {
        const ex = seg.x2 - seg.x1;
        const ey = seg.y2 - seg.y1;
        const len2 = ex * ex + ey * ey;
        if (len2 < 0.0001) return Math.sqrt((px - seg.x1) ** 2 + (py - seg.y1) ** 2);
        let t = ((px - seg.x1) * ex + (py - seg.y1) * ey) / len2;
        t = Math.max(0, Math.min(1, t));
        const cx = seg.x1 + t * ex;
        const cy = seg.y1 + t * ey;
        return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    }

    getSide(px, py, seg) {
        const ex = seg.x2 - seg.x1;
        const ey = seg.y2 - seg.y1;
        const cross = (px - seg.x1) * ey - (py - seg.y1) * ex;
        return cross > 0 ? 1 : -1;
    }
}
