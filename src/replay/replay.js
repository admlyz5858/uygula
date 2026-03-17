const SNAPSHOT_INTERVAL = 1 / 30;

export class ReplaySystem {
    constructor() {
        this.recording = false;
        this.playing = false;
        this.snapshots = [];
        this.playbackIndex = 0;
        this.playbackSpeed = 1;
        this.timer = 0;
        this.maxDuration = 300;
        this.snapshotTimer = 0;
    }

    startRecording() {
        this.recording = true;
        this.playing = false;
        this.snapshots = [];
        this.timer = 0;
        this.snapshotTimer = 0;
    }

    stopRecording() {
        this.recording = false;
    }

    captureFrame(marbles, time) {
        if (!this.recording) return;
        this.snapshotTimer += 1 / 60;
        if (this.snapshotTimer < SNAPSHOT_INTERVAL) return;
        this.snapshotTimer = 0;

        const frame = {
            time,
            marbles: marbles.map(m => ({
                id: m.id,
                x: Math.round(m.x * 10) / 10,
                y: Math.round(m.y * 10) / 10,
                vx: Math.round(m.vx * 10) / 10,
                vy: Math.round(m.vy * 10) / 10,
                angle: Math.round(m.angle * 100) / 100,
                angularVelocity: Math.round(m.angularVelocity * 100) / 100,
                alive: m.alive,
                finished: m.finished,
                squash: Math.round(m.squash * 100) / 100,
            })),
        };
        this.snapshots.push(frame);

        if (this.snapshots.length > this.maxDuration / SNAPSHOT_INTERVAL) {
            this.snapshots.shift();
        }
    }

    startPlayback(speed = 1) {
        if (this.snapshots.length === 0) return;
        this.playing = true;
        this.recording = false;
        this.playbackIndex = 0;
        this.playbackSpeed = speed;
        this.timer = 0;
    }

    stopPlayback() {
        this.playing = false;
    }

    getPlaybackFrame(dt) {
        if (!this.playing || this.snapshots.length === 0) return null;
        this.timer += dt * this.playbackSpeed;
        const targetTime = this.snapshots[0].time + this.timer;

        while (this.playbackIndex < this.snapshots.length - 1 &&
               this.snapshots[this.playbackIndex + 1].time <= targetTime) {
            this.playbackIndex++;
        }

        if (this.playbackIndex >= this.snapshots.length - 1) {
            this.playing = false;
            return this.snapshots[this.snapshots.length - 1];
        }

        const a = this.snapshots[this.playbackIndex];
        const b = this.snapshots[Math.min(this.playbackIndex + 1, this.snapshots.length - 1)];
        const timeDiff = b.time - a.time;
        const t = timeDiff > 0 ? (targetTime - a.time) / timeDiff : 0;

        return this.interpolateFrames(a, b, Math.max(0, Math.min(1, t)));
    }

    interpolateFrames(a, b, t) {
        return {
            time: a.time + (b.time - a.time) * t,
            marbles: a.marbles.map((am, i) => {
                const bm = b.marbles[i] || am;
                return {
                    ...am,
                    x: am.x + (bm.x - am.x) * t,
                    y: am.y + (bm.y - am.y) * t,
                    angle: am.angle + (bm.angle - am.angle) * t,
                    squash: am.squash + (bm.squash - am.squash) * t,
                };
            }),
        };
    }

    setPlaybackSpeed(speed) {
        this.playbackSpeed = Math.max(0.1, Math.min(4, speed));
    }

    rewind(seconds) {
        if (this.snapshots.length === 0) return;
        const framesToRewind = Math.floor(seconds / SNAPSHOT_INTERVAL);
        this.playbackIndex = Math.max(0, this.playbackIndex - framesToRewind);
        this.timer = this.snapshots[this.playbackIndex].time - this.snapshots[0].time;
    }

    getDuration() {
        if (this.snapshots.length < 2) return 0;
        return this.snapshots[this.snapshots.length - 1].time - this.snapshots[0].time;
    }

    getProgress() {
        if (this.snapshots.length < 2) return 0;
        return this.playbackIndex / (this.snapshots.length - 1);
    }
}
