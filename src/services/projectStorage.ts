const AUDIO_STORAGE_KEY = 'crhimastiano-audio-preferences';

export type AudioSettings = {
  masterVolume: number;
  monitorEnabled: boolean;
  latencyHint: number;
};

export function loadAudioSettings(): AudioSettings {
  const saved = localStorage.getItem(AUDIO_STORAGE_KEY);

  return saved
    ? { ...{ masterVolume: 0.8, monitorEnabled: true, latencyHint: 0 }, ...JSON.parse(saved) }
    : { masterVolume: 0.8, monitorEnabled: true, latencyHint: 0 };
}

export function saveAudioSettings(settings: AudioSettings) {
  localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
}
