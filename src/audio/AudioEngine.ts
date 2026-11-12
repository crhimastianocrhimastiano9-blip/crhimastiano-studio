import type { AudioSettings } from '../services/audioStorage';

export class AudioEngine {
  private context: AudioContext | null = null;

  private getAudioContext() {
    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtor) {
      throw new Error('Web Audio API non prise en charge sur cet appareil.');
    }

    this.context ??= new AudioCtor();
    return this.context;
  }

  async resume() {
    const context = this.getAudioContext();
    if (context.state === 'suspended') {
      await context.resume();
    }
  }

  async playTone(frequency: number, duration = 0.3, settings?: AudioSettings) {
    await this.resume();
    const context = this.getAudioContext();

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(Math.max(0.0001, 0.03 * (settings?.masterVolume ?? 1)), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  async destroy() {
    if (this.context) {
      await this.context.close();
    }
    this.context = null;
  }
}
