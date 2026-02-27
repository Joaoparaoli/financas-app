export function feedback(type) {
  if (typeof window === 'undefined') return;

  // Haptic feedback via vibration API
  if (navigator.vibrate) {
    switch (type) {
      case 'success':
        navigator.vibrate([50, 30, 50]);
        break;
      case 'delete':
        navigator.vibrate([100, 50, 100, 50, 100]);
        break;
      default:
        navigator.vibrate(50);
    }
  }

  // Audio feedback
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.1;

    if (type === 'success') {
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      oscillator.start();
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
      oscillator.stop(ctx.currentTime + 0.15);
    } else if (type === 'delete') {
      oscillator.frequency.value = 400;
      oscillator.type = 'sine';
      oscillator.start();
      oscillator.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
      oscillator.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Audio not available
  }
}
