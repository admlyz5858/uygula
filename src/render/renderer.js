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
        this.colorCache = new Map();
        this.initBloom();
    }

    initBloom() {
        try {
            if (typeof OffscreenCanvas !== 'undefined') {
                this.bloom = new BloomEffect(this.canvas.width, this.canvas.height);
            }
        } catch (e) {
            this.bloom = null;
        }
    }

    resize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        if (this.bloom) {
            try { this.bloom.resize(w, h); } catch (e) { this.bloom = null; }
        }
    }

    setQuality(level) {
        this.qualityLevel = level;
        if (this.bloom) {
            this.bloom.enabled = level === 'high';
            this.bloom.intensity = level === 'high' ? 0.5 : 0.25;
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
        this.renderForceZones(ctx, engine.forceZones);
        this.renderTrack(ctx, engine);
        this.renderKinematicBodies(ctx, engine.kinematicBodies);
        this.renderFinishLine(ctx);
        this.renderMarbles(ctx, engine.marbles);
        this.particles.render(ctx);

        if (this.bloom && this.bloom.enabled && this.qualityLevel === 'high') {
            try {
                this.bloom.apply(this.canvas, ctx);
            } catch (e) {
                this.bloom = null;
            }
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

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, `rgb(${r1},${g1},${b1})`);
        grad.addColorStop(0.5, `rgb(${r2},${g2},${b2})`);
        grad.addColorStop(1, `rgb(${r1 + 5},${g1},${b1 + 10})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        if (this.qualityLevel !== 'low') {
            ctx.globalAlpha = 0.03;
            for (let i = 0; i < 3; i++) {
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
            if (this.qualityLevel !== 'low') {
                ctx.strokeStyle = mat.color || '#556';
                ctx.lineWidth = 10;
                ctx.globalAlpha = 0.12;
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            ctx.strokeStyle = mat.color || '#556';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            if (this.qualityLevel === 'high') {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
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
            ctx.globalAlpha = 0.12;
            const zoneColors = {
                fluid: '#2255cc',
                gravityInvert: '#aa22cc',
                vortex: '#cc6600',
                magnetic: '#4466ff',
                wind: '#22bb88',
                randomForce: '#cc44cc',
                repel: '#cc4444',
            };
            const color = zoneColors[zone.type] || '#888';
            ctx.fillStyle = color;

            if (zone.type === 'vortex' || zone.type === 'magnetic' || zone.type === 'repel') {
                ctx.beginPath();
                ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
                ctx.fill();
                if (this.qualityLevel !== 'low') {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.25;
                    ctx.stroke();
                }
            } else {
                ctx.fillRect(zone.x - zone.width / 2, zone.y - zone.height / 2, zone.width, zone.height);
            }
            ctx.globalAlpha = 1;
        }
    }

    renderKinematicBodies(ctx, bodies) {
        for (const body of bodies) {
            if (body.render) body.render(ctx);
        }
    }

    renderMarbles(ctx, marbles) {
        for (const marble of marbles) {
            if (!marble.alive) continue;
            if (this.qualityLevel !== 'low' && marble.getSpeed() > 30) {
                this.renderTrail(ctx, marble);
            }
            this.renderSingleMarble(ctx, marble);
        }
    }

    renderSingleMarble(ctx, marble) {
        ctx.save();
        ctx.translate(marble.x, marble.y);

        const squashX = marble.squash;
        const squashY = 2 - marble.squash;
        ctx.scale(squashX, squashY);
        ctx.rotate(marble.angle);

        if (this.qualityLevel === 'high') {
            ctx.shadowColor = marble.glowColor;
            ctx.shadowBlur = 12 + Math.min(marble.getSpeed() * 0.02, 20);
        }

        const r = marble.radius;
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, marble.color);
        grad.addColorStop(1, this.getDarkenedColor(marble.color));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, r - 0.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.28, r * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, 0);
        ctx.lineTo(r * 0.5, 0);
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(0, r * 0.5);
        ctx.stroke();

        ctx.restore();
    }

    renderTrail(ctx, marble) {
        const trail = marble.trailPoints;
        if (trail.length < 3) return;
        const len = trail.length;
        for (let i = 1; i < len; i++) {
            const t = 1 - i / len;
            ctx.globalAlpha = t * 0.35;
            ctx.strokeStyle = marble.color;
            ctx.lineWidth = marble.radius * t * 0.7;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
            ctx.lineTo(trail[i].x, trail[i].y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    renderFinishLine(ctx) {
        if (this.finishLineY >= 100000) return;
        const y = this.finishLineY;
        const size = 12;
        const count = 40;
        const startX = -count * size / 2;
        for (let i = 0; i < count; i++) {
            for (let row = 0; row < 2; row++) {
                ctx.fillStyle = (i + row) % 2 === 0 ? '#fff' : '#222';
                ctx.fillRect(startX + i * size, y - size + row * size, size, size);
            }
        }
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FINISH', 0, y - size - 8);
    }

    getDarkenedColor(color) {
        if (this.colorCache.has(color)) return this.colorCache.get(color);
        const c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        const cx = c.getContext('2d');
        cx.fillStyle = color;
        cx.fillRect(0, 0, 1, 1);
        const d = cx.getImageData(0, 0, 1, 1).data;
        const result = `rgb(${d[0] >> 1},${d[1] >> 1},${d[2] >> 1})`;
        this.colorCache.set(color, result);
        return result;
    }

    getMarbleColor(index) {
        return MARBLE_COLORS[index % MARBLE_COLORS.length];
    }
}
