const AUDIO_STORAGE_KEY = 'crhimastiano-audio-preferences';

export type AudioSettings = {
  masterVolume: number;
  monitorEnabled: boolean;
  latencyHint: number;
};

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  monitorEnabled: true,
  latencyHint: 0,
};

export function loadAudioSettings(): AudioSettings {
  try {
    const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
    return saved ? { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(saved) } : DEFAULT_AUDIO_SETTINGS;
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(settings: AudioSettings) {
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable or full.
  }
}
