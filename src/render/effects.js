const MAX_PARTICLES = 500;
const TRAIL_POOL_SIZE = 2000;

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
            this.pool.push(this.createParticle());
        }
    }

    createParticle() {
        return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 3, color: '#fff', alpha: 1, type: 'spark' };
    }

    emit(x, y, count, config = {}) {
        for (let i = 0; i < count && this.pool.length > 0; i++) {
            const p = this.pool.pop();
            p.x = x + (Math.random() - 0.5) * (config.spread || 10);
            p.y = y + (Math.random() - 0.5) * (config.spread || 10);
            const angle = config.angle !== undefined ? config.angle + (Math.random() - 0.5) * (config.angleSpread || Math.PI) : Math.random() * Math.PI * 2;
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
        const count = Math.min(20, Math.floor(force * 0.005));
        const angle = Math.atan2(-ny, -nx);
        this.emit(x, y, count, {
            angle,
            angleSpread: Math.PI * 0.6,
            speed: 50 + force * 0.3,
            life: 0.3 + force * 0.001,
            color,
            size: 2 + force * 0.005,
            type: 'spark',
        });
    }

    emitTrail(x, y, color) {
        this.emit(x, y, 1, {
            speed: 5,
            life: 0.4,
            color,
            size: 3,
            spread: 3,
            gravity: 50,
            type: 'trail',
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
            p.size *= 0.99;
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha * 0.8;
            if (p.type === 'spark') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'trail') {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha * 0.4;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
}

export class BloomEffect {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.offscreen = null;
        this.offCtx = null;
        this.enabled = true;
        this.intensity = 0.6;
        this.resize(width, height);
    }

    resize(width, height) {
        this.width = Math.max(1, Math.floor(width / 4));
        this.height = Math.max(1, Math.floor(height / 4));
        this.offscreen = new OffscreenCanvas(this.width, this.height);
        this.offCtx = this.offscreen.getContext('2d');
    }

    apply(sourceCanvas, destCtx) {
        if (!this.enabled) return;
        this.offCtx.clearRect(0, 0, this.width, this.height);
        this.offCtx.drawImage(sourceCanvas, 0, 0, this.width, this.height);
        destCtx.save();
        destCtx.setTransform(1, 0, 0, 1, 0, 0);
        destCtx.filter = `blur(8px) brightness(1.5)`;
        destCtx.globalCompositeOperation = 'screen';
        destCtx.globalAlpha = this.intensity;
        destCtx.drawImage(this.offscreen, 0, 0, sourceCanvas.width, sourceCanvas.height);
        destCtx.filter = 'none';
        destCtx.globalCompositeOperation = 'source-over';
        destCtx.globalAlpha = 1;
        destCtx.restore();
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
        this.alpha = 0.6;
    }

    update(dt) {
        if (!this.active) return;
        this.timer += dt;
        this.alpha = 0.6 * (1 - this.timer / this.duration);
        if (this.timer >= this.duration) {
            this.active = false;
            this.alpha = 0;
        }
    }

    render(ctx, width, height) {
        if (!this.active || this.alpha <= 0) return;
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
            return;
        }
        this.timer += dt;
        if (this.timer < this.duration * 0.3) {
            this.scale += (this.targetScale - this.scale) * 0.15;
        } else {
            this.scale += (1 - this.scale) * 0.05;
        }
        if (this.timer >= this.duration) {
            this.active = false;
        }
    }

    getScale() {
        return Math.max(0.1, Math.min(1, this.scale));
    }
}
