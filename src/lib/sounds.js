let audioCtx;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  return audioCtx;
}

function playTone({ frequencyStart, frequencyEnd, duration = 0.18, volume = 0.15 }) {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  const now = ctx.currentTime + 0.01;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequencyStart, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(frequencyEnd, 1), now + duration * 0.7);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

export function playSoftClick() {
  playTone({ frequencyStart: 280, frequencyEnd: 520, duration: 0.16, volume: 0.12 });
}

export function playTabSwitch() {
  playTone({ frequencyStart: 480, frequencyEnd: 760, duration: 0.2, volume: 0.15 });
}
