import { Camera } from './camera.js';
import { ParticleSystem, BloomEffect, ScreenFlash, SlowMotionController } from './effects.js';
import { MATERIAL_DEFS } from '../physics/materials.js';

const MARBLE_COLORS = [
    '#ff4466', '#44ff88', '#4488ff', '#ffaa22', '#ff44ff',
    '#44ffff', '#ff8844', '#88ff44', '#8844ff', '#ff4488',
    '#44ffaa', '#ffff44', '#ff6644', '#44aaff', '#aa44ff',
    '#ff4444', '#44ff44', '#4444ff', '#ffaa44', '#ff44aa',
];

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.camera = new Camera(canvas);
        this.particles = new ParticleSystem();
        this.bloom = null;
        this.flash = new ScreenFlash();
        this.slowMo = new SlowMotionController();
        this.qualityLevel = 'high';
        this.bgGradientPhase = 0;
        this.frameCount = 0;
        this.showDebug = false;
        this.finishLineY = Infinity;
        this.trackBounds = { minX: -500, maxX: 500, minY: -100, maxY: 5000 };
        this.initBloom();
    }

    initBloom() {
        try {
            this.bloom = new BloomEffect(this.canvas.width, this.canvas.height);
        } catch (e) {
            this.bloom = null;
        }
    }

    resize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        if (this.bloom) this.bloom.resize(w, h);
    }

    setQuality(level) {
        this.qualityLevel = level;
        if (this.bloom) {
            this.bloom.enabled = level === 'high';
            this.bloom.intensity = level === 'high' ? 0.6 : 0.3;
        }
    }

    render(engine, dt) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.frameCount++;
        this.bgGradientPhase += dt * 0.3;

        this.particles.update(dt);
        this.flash.update(dt);
        this.slowMo.update(dt);

        this.renderBackground(ctx, w, h);
        this.camera.applyTransform(ctx);
        this.renderTrack(ctx, engine);
        this.renderForceZones(ctx, engine.forceZones);
        this.renderKinematicBodies(ctx, engine.kinematicBodies);
        this.renderMarbles(ctx, engine.marbles);
        this.particles.render(ctx);
        this.renderFinishLine(ctx);

        if (this.bloom && this.bloom.enabled && this.qualityLevel === 'high') {
            this.bloom.apply(this.canvas, ctx);
        }

        this.flash.render(ctx, w, h);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    renderBackground(ctx, w, h) {
        const phase = this.bgGradientPhase;
        const r1 = Math.floor(8 + Math.sin(phase) * 4);
        const g1 = Math.floor(10 + Math.sin(phase * 0.7) * 5);
        const b1 = Math.floor(28 + Math.sin(phase * 1.3) * 8);
        const r2 = Math.floor(15 + Math.cos(phase * 0.5) * 6);
        const g2 = Math.floor(8 + Math.cos(phase * 0.8) * 4);
        const b2 = Math.floor(32 + Math.cos(phase * 1.1) * 10);

        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, `rgb(${r1},${g1},${b1})`);
        grad.addColorStop(0.5, `rgb(${r2},${g2},${b2})`);
        grad.addColorStop(1, `rgb(${r1 + 5},${g1},${b1 + 10})`);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        if (this.qualityLevel !== 'low') {
            ctx.globalAlpha = 0.03;
            for (let i = 0; i < 5; i++) {
                const ox = Math.sin(phase * 0.2 + i) * 200;
                const oy = Math.cos(phase * 0.15 + i * 1.5) * 200;
                const gradient = ctx.createRadialGradient(w / 2 + ox, h / 2 + oy, 0, w / 2 + ox, h / 2 + oy, 400);
                gradient.addColorStop(0, i % 2 === 0 ? '#6366f1' : '#ec4899');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, w, h);
            }
            ctx.globalAlpha = 1;
        }
    }

    renderTrack(ctx, engine) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const seg of engine.segments) {
            const mat = seg.material || MATERIAL_DEFS.default;
            ctx.strokeStyle = mat.color || '#556';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            if (this.qualityLevel !== 'low') {
                ctx.strokeStyle = mat.color || '#556';
                ctx.lineWidth = 8;
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        for (const arc of engine.arcs) {
            const mat = arc.material || MATERIAL_DEFS.default;
            ctx.strokeStyle = mat.color || '#556';
            ctx.lineWidth = arc.thickness || 6;
            ctx.beginPath();
            ctx.arc(arc.cx, arc.cy, arc.radius, arc.startAngle, arc.endAngle);
            ctx.stroke();
        }
    }

    renderForceZones(ctx, zones) {
        for (const zone of zones) {
            if (!zone.active) continue;
            ctx.globalAlpha = 0.15;
            switch (zone.type) {
                case 'fluid':
                    ctx.fillStyle = '#2244aa';
                    ctx.fillRect(zone.x - zone.width / 2, zone.y - zone.height / 2, zone.width, zone.height);
                    break;
                case 'gravityInvert':
                    ctx.fillStyle = '#aa22aa';
                    ctx.fillRect(zone.x - zone.width / 2, zone.y - zone.height / 2, zone.width, zone.height);
                    break;
                case 'vortex':
                    ctx.fillStyle = '#aa4400';
                    ctx.beginPath();
                    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'magnetic':
                    ctx.fillStyle = '#4444ff';
                    ctx.beginPath();
                    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'wind':
                    ctx.fillStyle = '#22aa88';
                    ctx.fillRect(zone.x - zone.width / 2, zone.y - zone.height / 2, zone.width, zone.height);
                    break;
                case 'randomForce':
                    ctx.fillStyle = '#ff44ff';
                    ctx.fillRect(zone.x - zone.width / 2, zone.y - zone.height / 2, zone.width, zone.height);
                    break;
            }
            ctx.globalAlpha = 1;
        }
    }

    renderKinematicBodies(ctx, bodies) {
        for (const body of bodies) {
            if (body.render) {
                body.render(ctx);
            }
        }
    }

    renderMarbles(ctx, marbles) {
        for (const marble of marbles) {
            if (!marble.alive) continue;

            if (this.qualityLevel !== 'low' && marble.getSpeed() > 30) {
                this.renderTrail(ctx, marble);
            }

            ctx.save();
            ctx.translate(marble.x, marble.y);

            const squashX = marble.squash;
            const squashY = 2 - marble.squash;
            ctx.scale(squashX, squashY);
            ctx.rotate(marble.angle);

            if (this.qualityLevel !== 'low') {
                ctx.shadowColor = marble.glowColor;
                ctx.shadowBlur = 15 + marble.getSpeed() * 0.02;
            }

            const grad = ctx.createRadialGradient(-marble.radius * 0.3, -marble.radius * 0.3, marble.radius * 0.1, 0, 0, marble.radius);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(0.3, marble.color);
            grad.addColorStop(1, this.darkenColor(marble.color, 0.4));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, marble.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;

            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, marble.radius - 1, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(-marble.radius * 0.25, -marble.radius * 0.25, marble.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-marble.radius * 0.5, 0);
            ctx.lineTo(marble.radius * 0.5, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -marble.radius * 0.5);
            ctx.lineTo(0, marble.radius * 0.5);
            ctx.stroke();

            ctx.restore();
        }
    }

    renderTrail(ctx, marble) {
        const trail = marble.trailPoints;
        if (trail.length < 2) return;
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = marble.color;
        ctx.lineWidth = marble.radius * 0.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
            ctx.globalAlpha = 0.4 * (1 - i / trail.length);
            ctx.lineWidth = marble.radius * 0.8 * (1 - i / trail.length);
            ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    renderFinishLine(ctx) {
        if (this.finishLineY >= 100000) return;
        const y = this.finishLineY;
        ctx.save();
        const checkerSize = 15;
        const numCheckers = 40;
        for (let i = 0; i < numCheckers; i++) {
            const x = -numCheckers * checkerSize / 2 + i * checkerSize;
            ctx.fillStyle = i % 2 === 0 ? '#fff' : '#111';
            ctx.fillRect(x, y - checkerSize, checkerSize, checkerSize);
            ctx.fillStyle = i % 2 === 1 ? '#fff' : '#111';
            ctx.fillRect(x, y, checkerSize, checkerSize);
        }
        ctx.restore();
    }

    darkenColor(color, amount) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const c = canvas.getContext('2d');
        c.fillStyle = color;
        c.fillRect(0, 0, 1, 1);
        const d = c.getImageData(0, 0, 1, 1).data;
        const r = Math.floor(d[0] * (1 - amount));
        const g = Math.floor(d[1] * (1 - amount));
        const b = Math.floor(d[2] * (1 - amount));
        return `rgb(${r},${g},${b})`;
    }

    getMarbleColor(index) {
        return MARBLE_COLORS[index % MARBLE_COLORS.length];
    }
}
