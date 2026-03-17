const MAX_PARTICLES = 500;

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
            this.pool.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: 0, y: 0, vx: 0, vy: 0,
            life: 0, maxLife: 1, size: 3,
            color: '#fff', alpha: 1, type: 'spark', gravity: 300,
        };
    }

    emit(x, y, count, config = {}) {
        for (let i = 0; i < count && this.pool.length > 0; i++) {
            const p = this.pool.pop();
            p.x = x + (Math.random() - 0.5) * (config.spread || 10);
            p.y = y + (Math.random() - 0.5) * (config.spread || 10);
            const angle = config.angle !== undefined
                ? config.angle + (Math.random() - 0.5) * (config.angleSpread || Math.PI)
                : Math.random() * Math.PI * 2;
            const speed = (config.speed || 100) * (0.5 + Math.random() * 0.5);
            p.vx = Math.cos(angle) * speed + (config.baseVx || 0);
            p.vy = Math.sin(angle) * speed + (config.baseVy || 0);
            p.life = 0;
            p.maxLife = config.life || (0.3 + Math.random() * 0.5);
            p.size = config.size || (2 + Math.random() * 4);
            p.color = config.color || '#fff';
            p.alpha = 1;
            p.type = config.type || 'spark';
            p.gravity = config.gravity !== undefined ? config.gravity : 300;
            this.particles.push(p);
        }
    }

    emitCollision(x, y, nx, ny, force, color) {
        const count = Math.min(15, Math.floor(force * 0.004));
        const angle = Math.atan2(-ny, -nx);
        this.emit(x, y, count, {
            angle,
            angleSpread: Math.PI * 0.6,
            speed: 40 + force * 0.25,
            life: 0.25 + force * 0.001,
            color,
            size: 2 + force * 0.004,
            type: 'spark',
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life += dt;
            if (p.life >= p.maxLife) {
                this.pool.push(p);
                this.particles[i] = this.particles[this.particles.length - 1];
                this.particles.pop();
                continue;
            }
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha = 1 - (p.life / p.maxLife);
            if (p.size > 0.5) p.size *= 0.995;
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha * 0.8;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

export class BloomEffect {
    constructor(width, height) {
        this.enabled = true;
        this.intensity = 0.5;
        this.offscreen = null;
        this.offCtx = null;
        this.resize(width, height);
    }

    resize(width, height) {
        const w = Math.max(1, Math.floor(width / 4));
        const h = Math.max(1, Math.floor(height / 4));
        try {
            if (typeof OffscreenCanvas !== 'undefined') {
                this.offscreen = new OffscreenCanvas(w, h);
                this.offCtx = this.offscreen.getContext('2d');
            } else {
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                this.offscreen = c;
                this.offCtx = c.getContext('2d');
            }
        } catch (e) {
            this.enabled = false;
        }
    }

    apply(sourceCanvas, destCtx) {
        if (!this.enabled || !this.offscreen || !this.offCtx) return;
        try {
            const ow = this.offscreen.width;
            const oh = this.offscreen.height;
            this.offCtx.clearRect(0, 0, ow, oh);
            this.offCtx.drawImage(sourceCanvas, 0, 0, ow, oh);
            destCtx.save();
            destCtx.setTransform(1, 0, 0, 1, 0, 0);
            destCtx.filter = 'blur(8px) brightness(1.4)';
            destCtx.globalCompositeOperation = 'screen';
            destCtx.globalAlpha = this.intensity;
            destCtx.drawImage(this.offscreen, 0, 0, sourceCanvas.width, sourceCanvas.height);
            destCtx.filter = 'none';
            destCtx.globalCompositeOperation = 'source-over';
            destCtx.globalAlpha = 1;
            destCtx.restore();
        } catch (e) {
            this.enabled = false;
        }
    }
}

export class ScreenFlash {
    constructor() {
        this.active = false;
        this.alpha = 0;
        this.color = '#fff';
        this.duration = 0.15;
        this.timer = 0;
    }

    trigger(color = '#fff', duration = 0.15) {
        this.active = true;
        this.color = color;
        this.duration = duration;
        this.timer = 0;
        this.alpha = 0.5;
    }

    update(dt) {
        if (!this.active) return;
        this.timer += dt;
        this.alpha = 0.5 * Math.max(0, 1 - this.timer / this.duration);
        if (this.timer >= this.duration) {
            this.active = false;
            this.alpha = 0;
        }
    }

    render(ctx, width, height) {
        if (!this.active || this.alpha <= 0.01) return;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

export class SlowMotionController {
    constructor() {
        this.active = false;
        this.scale = 1;
        this.targetScale = 1;
        this.duration = 0;
        this.timer = 0;
    }

    trigger(scale = 0.3, duration = 1.5) {
        this.active = true;
        this.targetScale = scale;
        this.duration = duration;
        this.timer = 0;
    }

    update(dt) {
        if (!this.active) {
            this.scale += (1 - this.scale) * 0.1;
            if (Math.abs(this.scale - 1) < 0.01) this.scale = 1;
            return;
        }
        this.timer += dt;
        const progress = this.timer / this.duration;
        if (progress < 0.3) {
            this.scale += (this.targetScale - this.scale) * 0.15;
        } else {
            this.scale += (1 - this.scale) * 0.04;
        }
        if (this.timer >= this.duration) {
            this.active = false;
        }
    }

    getScale() {
        return Math.max(0.1, Math.min(1, this.scale));
    }
}
