export class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameTimes = [];
        this.maxSamples = 60;
        this.lastTime = 0;
        this.qualityLevel = 'high';
        this.lowFpsCount = 0;
        this.highFpsCount = 0;
        this.adaptiveEnabled = true;
        this.idleTimeout = null;
        this.isIdle = false;
        this.onQualityChange = null;
        this.frameCount = 0;
        this.measureInterval = 1000;
        this.lastMeasure = 0;
        this.measuredFps = 60;
    }

    startFrame() {
        const now = performance.now();
        if (this.lastTime > 0) {
            const dt = now - this.lastTime;
            this.frameTimes.push(dt);
            if (this.frameTimes.length > this.maxSamples) {
                this.frameTimes.shift();
            }
        }
        this.lastTime = now;
        this.frameCount++;

        if (now - this.lastMeasure >= this.measureInterval) {
            this.measuredFps = this.frameCount * 1000 / (now - this.lastMeasure);
            this.frameCount = 0;
            this.lastMeasure = now;
            this.fps = this.measuredFps;
            if (this.adaptiveEnabled) {
                this.adaptQuality();
            }
        }
    }

    adaptQuality() {
        if (this.fps < 25) {
            this.lowFpsCount++;
            this.highFpsCount = 0;
        } else if (this.fps > 50) {
            this.highFpsCount++;
            this.lowFpsCount = 0;
        } else {
            this.lowFpsCount = Math.max(0, this.lowFpsCount - 1);
            this.highFpsCount = Math.max(0, this.highFpsCount - 1);
        }

        let newLevel = this.qualityLevel;
        if (this.lowFpsCount >= 3) {
            if (this.qualityLevel === 'high') newLevel = 'medium';
            else if (this.qualityLevel === 'medium') newLevel = 'low';
            this.lowFpsCount = 0;
        }
        if (this.highFpsCount >= 10) {
            if (this.qualityLevel === 'low') newLevel = 'medium';
            else if (this.qualityLevel === 'medium') newLevel = 'high';
            this.highFpsCount = 0;
        }

        if (newLevel !== this.qualityLevel) {
            this.qualityLevel = newLevel;
            if (this.onQualityChange) this.onQualityChange(newLevel);
        }
    }

    getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 16.67;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        return sum / this.frameTimes.length;
    }

    getFPS() {
        return Math.round(this.fps);
    }

    setIdle(idle) {
        this.isIdle = idle;
    }

    shouldReduceWork() {
        return this.qualityLevel === 'low' || this.isIdle;
    }
}

export function setupVisibilityHandler(onVisible, onHidden) {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            onHidden();
        } else {
            onVisible();
        }
    });
}
