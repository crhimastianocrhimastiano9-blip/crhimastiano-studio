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

  async playPianoNote(frequency: number, duration = 0.35) {
    await this.resume();
    const context = this.getAudioContext();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const overtone = context.createOscillator();
    const gain = context.createGain();
    const overtoneGain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(frequency * 2, now);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + Math.max(0.08, duration));
    overtoneGain.gain.setValueAtTime(0.035, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + Math.max(0.06, duration * 0.55));

    oscillator.connect(gain).connect(context.destination);
    overtone.connect(overtoneGain).connect(context.destination);
    oscillator.start(now);
    overtone.start(now);
    oscillator.stop(now + duration);
    overtone.stop(now + duration);
  }

  async destroy() {
    if (this.context) {
      await this.context.close();
    }
    this.context = null;
  }
}
