import { detectMarbleMarble, detectMarbleSegment, detectMarblePolygon, detectMarbleArc, resolveContact, positionalCorrection } from './collision.js';
import { applyGravity, applyAirDrag, applyRollingFriction, applySpinEffect, applyForceZone, GRAVITY } from './forces.js';
import { getMaterial } from './materials.js';

const FIXED_DT = 1 / 120;
const MAX_SUBSTEPS = 4;
const SOLVER_ITERATIONS = 10;
const MAX_VELOCITY = 3000;
const SLEEP_THRESHOLD = 0.5;
const SLEEP_TIME = 1.0;

export class PhysicsEngine {
    constructor() {
        this.marbles = [];
        this.segments = [];
        this.polygons = [];
        this.arcs = [];
        this.forceZones = [];
        this.kinematicBodies = [];
        this.accumulator = 0;
        this.time = 0;
        this.paused = false;
        this.slowMotion = 1.0;
        this.contacts = [];
        this.events = [];
        this.onCollision = null;
    }

    addMarble(marble) {
        this.marbles.push(marble);
        return marble;
    }

    removeMarble(marble) {
        const idx = this.marbles.indexOf(marble);
        if (idx >= 0) this.marbles.splice(idx, 1);
    }

    addSegment(x1, y1, x2, y2, materialName = 'default') {
        const seg = { x1, y1, x2, y2, material: getMaterial(materialName), materialName };
        this.segments.push(seg);
        return seg;
    }

    addPolygon(vertices, materialName = 'default') {
        const poly = { vertices, material: getMaterial(materialName), materialName };
        this.polygons.push(poly);
        return poly;
    }

    addArc(cx, cy, radius, startAngle, endAngle, thickness = 10, materialName = 'default') {
        const arc = { cx, cy, radius, startAngle, endAngle, thickness, material: getMaterial(materialName), materialName };
        this.arcs.push(arc);
        return arc;
    }

    addForceZone(zone) {
        this.forceZones.push(zone);
        return zone;
    }

    addKinematicBody(body) {
        this.kinematicBodies.push(body);
        return body;
    }

    update(rawDt) {
        if (this.paused) return;
        const dt = rawDt * this.slowMotion;
        this.accumulator += dt;
        this.accumulator = Math.min(this.accumulator, FIXED_DT * MAX_SUBSTEPS);
        while (this.accumulator >= FIXED_DT) {
            this.step(FIXED_DT);
            this.accumulator -= FIXED_DT;
        }
    }

    step(dt) {
        this.time += dt;
        this.events = [];

        for (const kb of this.kinematicBodies) {
            if (kb.update) kb.update(this.time, dt);
        }

        for (const marble of this.marbles) {
            if (!marble.alive) continue;
            marble.prevX = marble.x;
            marble.prevY = marble.y;
            marble.fx = 0;
            marble.fy = 0;
            marble.torque = 0;
            marble.isOnGround = false;
            marble.contactNormal = null;
            marble.lastImpactForce = 0;

            applyGravity(marble);
            applyAirDrag(marble);
            applySpinEffect(marble);

            for (const zone of this.forceZones) {
                applyForceZone(marble, zone);
            }
        }

        for (const marble of this.marbles) {
            if (!marble.alive) continue;
            marble.vx += (marble.fx * marble.invMass) * dt;
            marble.vy += (marble.fy * marble.invMass) * dt;
            marble.angularVelocity += (marble.torque * marble.invInertia) * dt;
        }

        this.contacts = [];
        this.detectAllCollisions();

        for (let iter = 0; iter < SOLVER_ITERATIONS; iter++) {
            for (const contact of this.contacts) {
                resolveContact(contact, dt);
            }
        }

        for (const contact of this.contacts) {
            positionalCorrection(contact);
            const marble = contact.a;
            if (contact.ny < -0.3) {
                marble.isOnGround = true;
                marble.contactNormal = { x: contact.nx, y: contact.ny };
            }
            if (marble.lastImpactForce > 50) {
                this.events.push({
                    type: 'collision',
                    marble,
                    other: contact.b,
                    force: marble.lastImpactForce,
                    x: contact.px,
                    y: contact.py,
                    nx: contact.nx,
                    ny: contact.ny,
                });
            }
        }

        for (const marble of this.marbles) {
            if (!marble.alive) continue;

            if (marble.isOnGround && marble.contactNormal) {
                applyRollingFriction(marble, marble.contactNormal, marble.material);
            }

            const speed = Math.sqrt(marble.vx * marble.vx + marble.vy * marble.vy);
            if (speed > MAX_VELOCITY) {
                const scale = MAX_VELOCITY / speed;
                marble.vx *= scale;
                marble.vy *= scale;
            }

            marble.x += marble.vx * dt;
            marble.y += marble.vy * dt;
            marble.angle += marble.angularVelocity * dt;

            marble.squash += (marble.squashTarget - marble.squash) * 0.15;
            marble.squashTarget += (1.0 - marble.squashTarget) * 0.1;
        }
    }

    detectAllCollisions() {
        const marbles = this.marbles.filter(m => m.alive);
        const n = marbles.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const contact = detectMarbleMarble(marbles[i], marbles[j]);
                if (contact) this.contacts.push(contact);
            }
        }

        for (const marble of marbles) {
            for (const seg of this.segments) {
                const contact = detectMarbleSegment(marble, seg);
                if (contact) {
                    contact.surfaceMaterial = seg.material;
                    this.contacts.push(contact);
                }
            }
            for (const poly of this.polygons) {
                const contact = detectMarblePolygon(marble, poly);
                if (contact) {
                    contact.surfaceMaterial = poly.material;
                    this.contacts.push(contact);
                }
            }
            for (const arc of this.arcs) {
                const contact = detectMarbleArc(marble, arc);
                if (contact) {
                    contact.surfaceMaterial = arc.material;
                    this.contacts.push(contact);
                }
            }
            for (const kb of this.kinematicBodies) {
                if (!kb.getCollisionGeometry) continue;
                const geom = kb.getCollisionGeometry();
                for (const seg of geom.segments || []) {
                    const contact = detectMarbleSegment(marble, seg);
                    if (contact) {
                        contact.surfaceMaterial = kb.material || getMaterial('default');
                        if (kb.getVelocityAt) {
                            const kv = kb.getVelocityAt(contact.px, contact.py);
                            marble.vx += kv.x * 0.3;
                            marble.vy += kv.y * 0.3;
                        }
                        this.contacts.push(contact);
                    }
                }
            }
        }
    }

    getInterpolationAlpha() {
        return this.accumulator / FIXED_DT;
    }
}

