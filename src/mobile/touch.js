export class TouchController {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        this.touches = new Map();
        this.lastPinchDist = 0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.onTap = null;
        this.onSwipe = null;
        this.tapTimeout = null;
        this.tapX = 0;
        this.tapY = 0;
        this.enabled = true;
        this.bindEvents();
    }

    bindEvents() {
        const c = this.canvas;
        const opts = { passive: false };
        c.addEventListener('touchstart', e => this.onTouchStart(e), opts);
        c.addEventListener('touchmove', e => this.onTouchMove(e), opts);
        c.addEventListener('touchend', e => this.onTouchEnd(e), opts);
        c.addEventListener('touchcancel', e => this.onTouchEnd(e), opts);
        c.addEventListener('wheel', e => this.onWheel(e), opts);
        c.addEventListener('mousedown', e => this.onMouseDown(e));
        c.addEventListener('mousemove', e => this.onMouseMove(e));
        c.addEventListener('mouseup', e => this.onMouseUp(e));
    }

    onTouchStart(e) {
        if (!this.enabled) return;
        e.preventDefault();
        for (const t of e.changedTouches) {
            this.touches.set(t.identifier, { x: t.clientX, y: t.clientY, startX: t.clientX, startY: t.clientY, startTime: performance.now() });
        }
        if (this.touches.size === 1) {
            const t = [...this.touches.values()][0];
            this.tapX = t.x;
            this.tapY = t.y;
        }
        if (this.touches.size === 2) {
            const pts = [...this.touches.values()];
            this.lastPinchDist = this.getPinchDist(pts[0], pts[1]);
        }
    }

    onTouchMove(e) {
        if (!this.enabled) return;
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (this.touches.has(t.identifier)) {
                this.touches.get(t.identifier).x = t.clientX;
                this.touches.get(t.identifier).y = t.clientY;
            }
        }
        if (this.touches.size === 1) {
            const t = [...this.touches.values()][0];
            const dx = t.x - t.startX;
            const dy = t.y - t.startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                this.camera.panOffsetX -= dx * 0.5 / this.camera.zoom;
                this.camera.panOffsetY -= dy * 0.5 / this.camera.zoom;
                t.startX = t.x;
                t.startY = t.y;
                this.isPanning = true;
            }
        }
        if (this.touches.size === 2) {
            const pts = [...this.touches.values()];
            const dist = this.getPinchDist(pts[0], pts[1]);
            if (this.lastPinchDist > 0) {
                const scale = dist / this.lastPinchDist;
                this.camera.adjustZoom((scale - 1) * 0.5);
            }
            this.lastPinchDist = dist;
        }
    }

    onTouchEnd(e) {
        if (!this.enabled) return;
        for (const t of e.changedTouches) {
            const touch = this.touches.get(t.identifier);
            if (touch) {
                const elapsed = performance.now() - touch.startTime;
                const dx = t.clientX - touch.startX;
                const dy = t.clientY - touch.startY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (elapsed < 300 && dist < 15 && !this.isPanning) {
                    if (this.onTap) {
                        const world = this.camera.screenToWorld(t.clientX, t.clientY);
                        this.onTap(world.x, world.y);
                    }
                }
                this.touches.delete(t.identifier);
            }
        }
        if (this.touches.size === 0) {
            this.isPanning = false;
            this.lastPinchDist = 0;
        }
    }

    getPinchDist(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    onWheel(e) {
        e.preventDefault();
        this.camera.adjustZoom(-e.deltaY * 0.001);
    }

    onMouseDown(e) {
        this.mouseDown = true;
        this.mouseStartX = e.clientX;
        this.mouseStartY = e.clientY;
        this.mouseMoved = false;
    }

    onMouseMove(e) {
        if (!this.mouseDown) return;
        const dx = e.clientX - this.mouseStartX;
        const dy = e.clientY - this.mouseStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            this.mouseMoved = true;
            this.camera.panOffsetX -= dx * 0.5 / this.camera.zoom;
            this.camera.panOffsetY -= dy * 0.5 / this.camera.zoom;
            this.mouseStartX = e.clientX;
            this.mouseStartY = e.clientY;
        }
    }

    onMouseUp(e) {
        if (this.mouseDown && !this.mouseMoved && this.onTap) {
            const rect = this.canvas.getBoundingClientRect();
            const world = this.camera.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
            this.onTap(world.x, world.y);
        }
        this.mouseDown = false;
    }
}
