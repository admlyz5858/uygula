export class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 4;
        this.smoothing = 0.08;
        this.zoomSmoothing = 0.06;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeDecay = 0.88;
        this.shakeIntensity = 0;
        this.mode = 'static';
        this.focusMarble = null;
        this.focusIndex = 0;
        this.cinematicTimer = 0;
        this.autoSwitchInterval = 4;
        this.dramaticFinishZoom = false;
        this.panOffsetX = 0;
        this.panOffsetY = 0;
        this.trackBounds = null;
    }

    shake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, Math.min(intensity, 12));
    }

    setMode(mode) { this.mode = mode; }

    focusOn(marble) {
        this.focusMarble = marble;
        this.mode = 'focus_single';
    }

    setTrackBounds(bounds) {
        this.trackBounds = bounds;
        if (bounds) {
            this.targetX = (bounds.minX + bounds.maxX) / 2;
            this.targetY = (bounds.minY + bounds.maxY) / 2;
            this.x = this.targetX;
            this.y = this.targetY;
            this.fitToTrack();
        }
    }

    fitToTrack() {
        if (!this.trackBounds) return;
        const b = this.trackBounds;
        const tw = b.maxX - b.minX + 60;
        const th = b.maxY - b.minY + 60;
        const zx = this.canvas.width / tw;
        const zy = this.canvas.height / th;
        this.targetZoom = Math.min(zx, zy);
        this.zoom = this.targetZoom;
    }

    update(dt, marbles) {
        this.cinematicTimer += dt;

        switch (this.mode) {
            case 'static': {
                if (this.trackBounds) {
                    const b = this.trackBounds;
                    this.targetX = (b.minX + b.maxX) / 2;
                    this.targetY = (b.minY + b.maxY) / 2;
                    const tw = b.maxX - b.minX + 60;
                    const th = b.maxY - b.minY + 60;
                    const zx = this.canvas.width / tw;
                    const zy = this.canvas.height / th;
                    this.targetZoom = Math.min(zx, zy);
                }
                break;
            }
            case 'follow_leader': {
                const active = marbles.filter(m => m.alive && !m.finished);
                if (active.length > 0) {
                    const leader = active.reduce((best, m) => m.y > best.y ? m : best, active[0]);
                    this.targetX = leader.x;
                    this.targetY = leader.y;
                    this.targetZoom = 1.5;
                }
                break;
            }
            case 'focus_single': {
                if (this.focusMarble && this.focusMarble.alive) {
                    this.targetX = this.focusMarble.x;
                    this.targetY = this.focusMarble.y;
                    this.targetZoom = 2;
                }
                break;
            }
            case 'cinematic': {
                const active = marbles.filter(m => m.alive && !m.finished);
                if (this.cinematicTimer > this.autoSwitchInterval && active.length > 0) {
                    this.cinematicTimer = 0;
                    this.focusIndex = (this.focusIndex + 1) % active.length;
                }
                if (active.length > 0) {
                    const m = active[this.focusIndex % active.length];
                    this.targetX = m.x;
                    this.targetY = m.y;
                    this.targetZoom = 1.8;
                }
                break;
            }
        }

        if (this.dramaticFinishZoom && this.focusMarble) {
            this.targetX = this.focusMarble.x;
            this.targetY = this.focusMarble.y;
            this.targetZoom = 2.5;
        }

        this.x += (this.targetX + this.panOffsetX - this.x) * this.smoothing;
        this.y += (this.targetY + this.panOffsetY - this.y) * this.smoothing;
        this.zoom += (this.targetZoom - this.zoom) * this.zoomSmoothing;

        if (this.shakeIntensity > 0.1) {
            this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeIntensity = 0;
        }
    }

    applyTransform(ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(this.canvas.width / 2 + this.shakeX, this.canvas.height / 2 + this.shakeY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.canvas.width / 2) / this.zoom + this.x,
            y: (sy - this.canvas.height / 2) / this.zoom + this.y,
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: (wx - this.x) * this.zoom + this.canvas.width / 2,
            y: (wy - this.y) * this.zoom + this.canvas.height / 2,
        };
    }

    adjustZoom(delta) {
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom * (1 + delta)));
    }
}
