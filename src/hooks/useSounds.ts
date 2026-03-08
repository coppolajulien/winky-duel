"use client";

// ── Global mute state (persisted in localStorage) ──
let _muted = false;
if (typeof window !== "undefined") {
  _muted = localStorage.getItem("blinkit-muted") === "true";
}

export function isMuted(): boolean {
  return _muted;
}

export function setMuted(m: boolean) {
  _muted = m;
  if (typeof window !== "undefined") {
    localStorage.setItem("blinkit-muted", String(m));
  }
  // Mute/unmute background music immediately
  if (bgAudio) bgAudio.muted = m;
}

// ── Web Audio API (synth sounds) ──
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function beep(freq: number, duration: number, volume = 0.15) {
  if (_muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/** Countdown tick — ascending pitch for 3, 2, 1 */
export function playCountdown(num: number) {
  const freqs: Record<number, number> = { 3: 440, 2: 523, 1: 659 };
  beep(freqs[num] ?? 440, 0.15, 0.12);
}

/** Go! — ascending arpeggio */
export function playGo() {
  if (_muted) return;
  const ctx = getCtx();
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

/** Overtake — short rising sweep */
export function playOvertake() {
  if (_muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

/** Win — happy major chord arpeggio */
export function playWin() {
  if (_muted) return;
  const ctx = getCtx();
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(0.13, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

/** Lose — descending minor chord */
export function playLose() {
  if (_muted) return;
  const ctx = getCtx();
  [392, 349, 311].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  });
}

// ── Background music (pulse.mp3) ──
let bgAudio: HTMLAudioElement | null = null;

export function startMusic() {
  if (typeof window === "undefined") return;
  if (!bgAudio) {
    bgAudio = new Audio("/pulse.mp3");
    bgAudio.loop = true;
    bgAudio.volume = 0.3;
  }
  bgAudio.muted = _muted;
  bgAudio.currentTime = 0;
  bgAudio.play().catch(() => {});
}

export function stopMusic() {
  if (!bgAudio) return;
  bgAudio.pause();
  bgAudio.currentTime = 0;
}
