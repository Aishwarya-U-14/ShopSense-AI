// Web Audio API Sound Synthesizer for UI & Commerce Interactions

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export function playClickSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
        // audio muted or unsupported
    }
}

export function playSendSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
}

export function playCartSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Double chime (E5 -> B5)
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.08);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(987.77, now + 0.07);
        gain2.gain.setValueAtTime(0.15, now + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.2);
    } catch (e) {}
}

export function playSuccessSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major arpeggio

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + (idx * 0.07);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.15, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + 0.25);
        });
    } catch (e) {}
}

export function playAlertSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.18);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    } catch (e) {}
}

// =============================================
// FUN PAYMENT SUCCESS — "Yayyy! You got it! 🎉"
// =============================================
export function playPaymentSuccessSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Joyful ascending arpeggio melody (C major pentatonic)
        const notes = [
            { freq: 523.25, t: 0,    dur: 0.18 },  // C5
            { freq: 659.25, t: 0.12, dur: 0.18 },  // E5
            { freq: 783.99, t: 0.24, dur: 0.18 },  // G5
            { freq: 1046.5, t: 0.36, dur: 0.25 },  // C6
            { freq: 1318.5, t: 0.52, dur: 0.22 },  // E6
            { freq: 1046.5, t: 0.68, dur: 0.18 },  // C6 bounce
            { freq: 1318.5, t: 0.84, dur: 0.3  },  // E6 hold
            { freq: 1568.0, t: 1.02, dur: 0.5  },  // G6 triumphant end
        ];

        notes.forEach(({ freq, t, dur }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + t;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + dur + 0.05);
        });

        // Sparkle overlay — high frequency shimmer
        [1800, 2200, 2600].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + 0.4 + i * 0.12;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.07, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.2);
        });
    } catch (e) {}
}

// =============================================
// FUN PAYMENT FAILURE — "Oops! I'm so sorry 😢"
// =============================================
export function playPaymentFailureSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Sad descending melody (minor key)
        const notes = [
            { freq: 493.88, t: 0,    dur: 0.22 },  // B4
            { freq: 440.00, t: 0.18, dur: 0.22 },  // A4
            { freq: 392.00, t: 0.36, dur: 0.22 },  // G4
            { freq: 349.23, t: 0.54, dur: 0.22 },  // F4
            { freq: 311.13, t: 0.74, dur: 0.35 },  // Eb4 hold
            { freq: 261.63, t: 1.08, dur: 0.55 },  // C4 mournful end
        ];

        notes.forEach(({ freq, t, dur }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + t;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.97, start + dur);

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.14, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + dur + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + dur + 0.1);
        });

        // Low rumble at start
        const rumble = ctx.createOscillator();
        const rumbleGain = ctx.createGain();
        rumble.type = 'sawtooth';
        rumble.frequency.setValueAtTime(80, now);
        rumble.frequency.linearRampToValueAtTime(50, now + 0.4);
        rumbleGain.gain.setValueAtTime(0.05, now);
        rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        rumble.connect(rumbleGain);
        rumbleGain.connect(ctx.destination);
        rumble.start(now);
        rumble.stop(now + 0.5);
    } catch (e) {}
}

// =============================================
// PAGE OPEN SOUND — sparkle sweep on load
// =============================================
export function playPageOpenSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Rising sparkle sweep
        const freqs = [261.63, 329.63, 392, 523.25, 659.25, 880, 1046.5, 1318.5];
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + i * 0.08;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.08, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.4);
        });
    } catch (e) {}
}

// Global click listener attachment helper
export function attachGlobalClickSounds() {
    if (typeof window === 'undefined') return;
    window.addEventListener('click', (e) => {
        const target = e.target;
        if (target.closest('button, a, input[type="button"], input[type="submit"], .feature-card, .product-card, .cat-tab, .quick-prompts button')) {
            playClickSound();
        }
    }, true);
}
