import { Camera } from './camera.js';
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
        this.finishLineY = Infinity;
        this.colorCache = new Map();
    }

    resize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
    }

    setQuality() {}

    render(engine, dt) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#0c0c20';
        ctx.fillRect(0, 0, w, h);

        this.camera.applyTransform(ctx);
        this.renderTrack(ctx, engine);
        this.renderKinematics(ctx, engine.kinematicBodies);
        this.renderFinishLine(ctx);
        this.renderMarbles(ctx, engine.marbles);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    renderTrack(ctx, engine) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const seg of engine.segments) {
            const mat = seg.material || MATERIAL_DEFS.default;
            ctx.strokeStyle = mat.color || '#667';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();
        }
    }

    renderKinematics(ctx, bodies) {
        for (const b of bodies) { if (b.render) b.render(ctx); }
    }

    renderMarbles(ctx, marbles) {
        for (const m of marbles) {
            if (!m.alive) continue;
            this.renderMarble(ctx, m);
        }
        if (marbles.length <= 30) {
            for (const m of marbles) {
                if (!m.alive) continue;
                this.renderLabel(ctx, m);
            }
        }
    }

    renderMarble(ctx, m) {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.angle);

        const r = m.radius;
        const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.35, m.color);
        grad.addColorStop(1, this.darken(m.color));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-r * 0.22, -r * 0.25, r * 0.17, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderLabel(ctx, m) {
        ctx.font = 'bold 8px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = m.color;
        const label = m.finished ? `#${m.rank} ${m.name}` : m.name;
        ctx.fillText(label, m.x, m.y - m.radius - 3);
    }

    renderFinishLine(ctx) {
        if (this.finishLineY >= 10000) return;
        const y = this.finishLineY;
        const size = 10;
        for (let i = -25; i < 25; i++) {
            for (let row = 0; row < 2; row++) {
                ctx.fillStyle = (i + row) % 2 === 0 ? '#fff' : '#333';
                ctx.fillRect(i * size, y - size + row * size, size, size);
            }
        }
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FINISH', 0, y - size - 5);
    }

    darken(color) {
        if (this.colorCache.has(color)) return this.colorCache.get(color);
        const c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        const x = c.getContext('2d');
        x.fillStyle = color;
        x.fillRect(0, 0, 1, 1);
        const d = x.getImageData(0, 0, 1, 1).data;
        const result = `rgb(${d[0] >> 1},${d[1] >> 1},${d[2] >> 1})`;
        this.colorCache.set(color, result);
        return result;
    }

    getMarbleColor(i) { return MARBLE_COLORS[i % MARBLE_COLORS.length]; }
}
