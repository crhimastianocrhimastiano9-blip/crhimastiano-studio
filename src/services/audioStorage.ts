export class AudioEngine {
  private context: AudioContext | null = null;

  init() {
    if (!this.context) {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) {
        return;
      }
      this.context = new AudioCtor();
    }

    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
  }

  getContext() {
    if (!this.context) {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) {
        throw new Error('Web Audio API is not supported in this browser.');
      }
      this.context = new AudioCtor();
    }

    return this.context;
  }

  playTone(frequency: number, duration = 0.3) {
    this.init();
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gainNode.gain.value = 0.03;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);

    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  }

  destroy() {
    void this.context?.close();
    this.context = null;
  }
}
