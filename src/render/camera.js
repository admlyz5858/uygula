export class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.minZoom = 0.15;
        this.maxZoom = 3;
        this.smoothing = 0.06;
        this.zoomSmoothing = 0.05;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeDecay = 0.9;
        this.shakeIntensity = 0;
        this.mode = 'follow_leader';
        this.focusMarble = null;
        this.focusIndex = 0;
        this.cinematicTimer = 0;
        this.autoSwitchInterval = 5;
        this.dramaticFinishZoom = false;
        this.panOffsetX = 0;
        this.panOffsetY = 0;
    }

    shake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    setMode(mode) {
        this.mode = mode;
    }

    focusOn(marble) {
        this.focusMarble = marble;
        this.mode = 'focus_single';
    }

    update(dt, marbles) {
        this.cinematicTimer += dt;
        const activeMarbles = marbles.filter(m => m.alive && !m.finished);
        if (activeMarbles.length === 0 && marbles.length > 0) {
            const last = marbles.filter(m => m.alive).sort((a, b) => a.y - b.y);
            if (last.length > 0) {
                this.targetX = last[0].x;
                this.targetY = last[0].y;
            }
        }

        switch (this.mode) {
            case 'follow_leader': {
                if (activeMarbles.length > 0) {
                    const leader = activeMarbles.reduce((best, m) => m.y > best.y ? m : best, activeMarbles[0]);
                    this.targetX = leader.x;
                    this.targetY = leader.y;
                    this.focusMarble = leader;
                    const spread = this.getMarbleSpread(activeMarbles);
                    this.targetZoom = Math.max(this.minZoom, Math.min(1.2, 600 / Math.max(spread, 200)));
                }
                break;
            }
            case 'follow_pack': {
                if (activeMarbles.length > 0) {
                    let cx = 0, cy = 0;
                    for (const m of activeMarbles) { cx += m.x; cy += m.y; }
                    this.targetX = cx / activeMarbles.length;
                    this.targetY = cy / activeMarbles.length;
                    const spread = this.getMarbleSpread(activeMarbles);
                    this.targetZoom = Math.max(this.minZoom, Math.min(1.5, 800 / Math.max(spread, 200)));
                }
                break;
            }
            case 'focus_single': {
                if (this.focusMarble && this.focusMarble.alive) {
                    this.targetX = this.focusMarble.x;
                    this.targetY = this.focusMarble.y;
                    this.targetZoom = 1.5;
                }
                break;
            }
            case 'cinematic': {
                if (this.cinematicTimer > this.autoSwitchInterval) {
                    this.cinematicTimer = 0;
                    if (activeMarbles.length > 0) {
                        this.focusIndex = (this.focusIndex + 1) % activeMarbles.length;
                    }
                }
                if (activeMarbles.length > 0) {
                    const m = activeMarbles[this.focusIndex % activeMarbles.length];
                    this.targetX = m.x;
                    this.targetY = m.y;
                    this.targetZoom = 1.2;
                }
                break;
            }
            case 'overview': {
                if (marbles.length > 0) {
                    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                    for (const m of marbles) {
                        if (!m.alive) continue;
                        minX = Math.min(minX, m.x);
                        maxX = Math.max(maxX, m.x);
                        minY = Math.min(minY, m.y);
                        maxY = Math.max(maxY, m.y);
                    }
                    this.targetX = (minX + maxX) / 2;
                    this.targetY = (minY + maxY) / 2;
                    const w = maxX - minX + 400;
                    const h = maxY - minY + 400;
                    this.targetZoom = Math.max(this.minZoom, Math.min(1, Math.min(this.canvas.width / w, this.canvas.height / h)));
                }
                break;
            }
            case 'free':
                break;
        }

        if (this.dramaticFinishZoom) {
            this.targetZoom = 2.0;
            this.smoothing = 0.03;
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

    getMarbleSpread(marbles) {
        if (marbles.length < 2) return 100;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const m of marbles) {
            minX = Math.min(minX, m.x);
            maxX = Math.max(maxX, m.x);
            minY = Math.min(minY, m.y);
            maxY = Math.max(maxY, m.y);
        }
        return Math.max(maxX - minX, maxY - minY);
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
