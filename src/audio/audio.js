export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.initialized = false;
        this.musicIntensity = 0;
        this.targetIntensity = 0;
        this.muted = false;
        this.oscillators = [];
        this.musicNodes = [];
        this.spatialListener = null;
    }

    async init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.masterGain);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.6;
            this.sfxGain.connect(this.masterGain);
            this.initialized = true;
        } catch (e) {
            console.warn('Audio init failed:', e);
        }
    }

    setMuted(muted) {
        this.muted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : 0.5;
        }
    }

    playBounce(force, pan = 0) {
        if (!this.initialized || this.muted) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner();

        const freq = 100 + Math.min(force * 0.5, 400);
        const vol = Math.min(0.3, force * 0.001);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.15);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        panner.pan.value = Math.max(-1, Math.min(1, pan));

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playRoll(speed, pan = 0) {
        if (!this.initialized || this.muted || speed < 50) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const buffer = ctx.createBuffer(1, 1024, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < 1024; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.05;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200 + speed * 2;
        gain.gain.value = Math.min(0.1, speed * 0.0003);
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));

        source.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.sfxGain);
        source.start(now);
        source.stop(now + 0.05);
    }

    playFinish(rank) {
        if (!this.initialized || this.muted) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const notes = [523, 659, 784, 1047];
        for (let i = 0; i < notes.length; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = notes[i] * (rank === 1 ? 1 : 0.8);
            gain.gain.setValueAtTime(0, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.3);
        }
    }

    startMusic() {
        if (!this.initialized || this.muted) return;
        this.stopMusic();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.value = 55;
        bassGain.gain.value = 0.08;
        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start();

        const padOsc = ctx.createOscillator();
        const padGain = ctx.createGain();
        const padFilter = ctx.createBiquadFilter();
        padOsc.type = 'sawtooth';
        padOsc.frequency.value = 110;
        padFilter.type = 'lowpass';
        padFilter.frequency.value = 400;
        padGain.gain.value = 0.04;
        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.musicGain);
        padOsc.start();

        const lfoOsc = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfoOsc.frequency.value = 0.2;
        lfoGain.gain.value = 20;
        lfoOsc.connect(lfoGain);
        lfoGain.connect(padFilter.frequency);
        lfoOsc.start();

        this.musicNodes = [
            { osc: bassOsc, gain: bassGain },
            { osc: padOsc, gain: padGain, filter: padFilter },
            { osc: lfoOsc, gain: lfoGain },
        ];
    }

    stopMusic() {
        for (const node of this.musicNodes) {
            try {
                if (node.osc) node.osc.stop();
            } catch (e) {}
        }
        this.musicNodes = [];
    }

    updateMusicIntensity(intensity) {
        this.targetIntensity = Math.max(0, Math.min(1, intensity));
        this.musicIntensity += (this.targetIntensity - this.musicIntensity) * 0.02;
        if (this.musicNodes.length >= 2) {
            const bassNode = this.musicNodes[0];
            const padNode = this.musicNodes[1];
            if (bassNode.gain) {
                bassNode.gain.gain.value = 0.04 + this.musicIntensity * 0.08;
            }
            if (padNode.gain) {
                padNode.gain.gain.value = 0.02 + this.musicIntensity * 0.06;
            }
            if (padNode.filter) {
                padNode.filter.frequency.value = 300 + this.musicIntensity * 800;
            }
        }
    }

    getSpatialPan(marbleX, cameraX, viewWidth) {
        return Math.max(-1, Math.min(1, (marbleX - cameraX) / (viewWidth / 2)));
    }

    suspend() {
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend();
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}
