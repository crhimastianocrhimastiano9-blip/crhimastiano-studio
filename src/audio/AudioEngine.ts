import type { AudioSettings } from '../services/audioStorage';

export type InstrumentPreset = 'piano' | 'electric-piano' | 'organ' | 'synth' | 'bass' | 'strings';

type Voice = { waveform: OscillatorType; ratio: number; level: number };

const instrumentVoices: Record<InstrumentPreset, Voice[]> = {
  piano: [
    { waveform: 'triangle', ratio: 1, level: 0.16 },
    { waveform: 'sine', ratio: 2, level: 0.045 },
    { waveform: 'sine', ratio: 3, level: 0.012 },
  ],
  'electric-piano': [
    { waveform: 'sine', ratio: 1, level: 0.17 },
    { waveform: 'sine', ratio: 2, level: 0.075 },
    { waveform: 'sine', ratio: 4, level: 0.018 },
  ],
  organ: [
    { waveform: 'sine', ratio: 1, level: 0.12 },
    { waveform: 'sine', ratio: 2, level: 0.07 },
    { waveform: 'sine', ratio: 3, level: 0.035 },
  ],
  synth: [
    { waveform: 'sawtooth', ratio: 1, level: 0.08 },
    { waveform: 'triangle', ratio: 1.005, level: 0.06 },
    { waveform: 'sine', ratio: 2, level: 0.025 },
  ],
  bass: [
    { waveform: 'triangle', ratio: 0.5, level: 0.16 },
    { waveform: 'sine', ratio: 1, level: 0.065 },
  ],
  strings: [
    { waveform: 'sawtooth', ratio: 1, level: 0.055 },
    { waveform: 'triangle', ratio: 1.005, level: 0.05 },
    { waveform: 'sine', ratio: 2, level: 0.018 },
  ],
};

type RoutableAudioContext = AudioContext & { setSinkId?: (deviceId: string) => Promise<void> };

export class AudioEngine {
  private static sharedContext: AudioContext | null = null;
  private static sharedMasterGain: GainNode | null = null;

  private getAudioContext(): AudioContext {
    if (!AudioEngine.sharedContext) {
      const AudioCtor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) throw new Error('Web Audio API non prise en charge sur cet appareil.');

      const context = new AudioCtor();
      const masterGain = context.createGain();
      masterGain.gain.value = 0.82;
      masterGain.connect(context.destination);
      AudioEngine.sharedContext = context;
      AudioEngine.sharedMasterGain = masterGain;
    }
    return AudioEngine.sharedContext;
  }

  private getMasterGain() {
    this.getAudioContext();
    if (!AudioEngine.sharedMasterGain) throw new Error('Sortie audio indisponible.');
    return AudioEngine.sharedMasterGain;
  }

  async resume() {
    const context = this.getAudioContext();
    if (context.state === 'suspended') await context.resume();
  }

  setMasterVolume(volume: number) {
    const gain = this.getMasterGain();
    const context = this.getAudioContext();
    gain.gain.setTargetAtTime(Math.min(1, Math.max(0, volume)), context.currentTime, 0.015);
  }

  async selectOutputDevice(deviceId: string) {
    const context = this.getAudioContext() as RoutableAudioContext;
    if (typeof context.setSinkId !== 'function') {
      throw new Error('La sélection directe d’une sortie audio n’est pas prise en charge ici. Utilise les réglages audio du téléphone.');
    }
    await context.setSinkId(deviceId);
  }

  supportsOutputSelection() {
    return typeof (this.getAudioContext() as RoutableAudioContext).setSinkId === 'function';
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
    oscillator.connect(gain).connect(this.getMasterGain());
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  async playInstrumentNote(frequency: number, duration = 0.35, preset: InstrumentPreset = 'piano') {
    await this.resume();
    const context = this.getAudioContext();
    const now = context.currentTime;
    const safeDuration = Math.max(0.08, duration);
    const attack = preset === 'strings' ? Math.min(0.08, safeDuration * 0.3) : 0.006;
    const releaseStart = now + Math.max(attack, safeDuration * 0.65);
    const releaseEnd = now + safeDuration;

    for (const voice of instrumentVoices[preset]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = voice.waveform;
      oscillator.frequency.setValueAtTime(frequency * voice.ratio, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(voice.level, now + attack);
      gain.gain.setValueAtTime(voice.level, releaseStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);
      oscillator.connect(gain).connect(this.getMasterGain());
      oscillator.start(now);
      oscillator.stop(releaseEnd + 0.01);
    }
  }

  async playPianoNote(frequency: number, duration = 0.35) {
    return this.playInstrumentNote(frequency, duration, 'piano');
  }

  async destroy() {
    if (AudioEngine.sharedContext) await AudioEngine.sharedContext.close();
    AudioEngine.sharedContext = null;
    AudioEngine.sharedMasterGain = null;
  }
}
