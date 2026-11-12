/**
 * Types & Data Structures for CRHIMASTIANO STUDIO
 * Digital Audio Workstation (DAW)
 */

export type TrackType = 'audio' | 'beat' | 'synth' | 'vocal' | 'choir' | 'duo';

export interface AudioClip {
  id: string;
  trackId: string;
  name: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  audioBuffer?: AudioBuffer;
  waveformData: number[]; // normalized peaks 0..1 for rendering
  color?: string;
  gain: number;
}

export interface TrackEffects {
  eqLow: number; // -12 to +12 dB (LowShelf ~100Hz)
  eqMid: number; // -12 to +12 dB (Peaking ~1000Hz)
  eqHigh: number; // -12 to +12 dB (HighShelf ~8000Hz)
  reverb: number; // 0 to 1 send level
  delay: number; // 0 to 1 send level
  distortion: number; // 0 to 1 tube warmth drive
  compression: number; // 0 to 1
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  volume: number; // 0 to 1.5, default 0.8
  pan: number; // -1 to +1
  mute: boolean;
  solo: boolean;
  armed: boolean; // record-enable
  effects: TrackEffects;
  clips: AudioClip[];
}

export type DrumInstrument =
  | 'kick'
  | 'sub808'
  | 'snare'
  | 'hihat_closed'
  | 'hihat_open'
  | 'clap'
  | 'djembe'
  | 'talking_drum'
  | 'shekere';

export interface DrumStep {
  active: boolean;
  velocity: number; // 0..1
}

export type BeatGrid = Record<DrumInstrument, DrumStep[]>;

export interface SynthNote {
  note: string; // e.g., 'C4', 'D#4'
  freq: number;
  time: number;
  duration: number;
}

export interface Project {
  id: string;
  name: string;
  bpm: number;
  timeSignature: '4/4' | '3/4' | '6/8';
  key: string;
  genre: string;
  masterVolume: number; // 0 to 1.5
  masterPan: number; // -1 to +1
  tracks: Track[];
  beatGrid: BeatGrid;
  lyricsDraft?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type StudioTab =
  | 'home'
  | 'multitrack'
  | 'beatmaker'
  | 'voice'
  | 'choir'
  | 'duo'
  | 'mixer'
  | 'ai_assistant'
  | 'export';

export interface AudioSettings {
  hardwareMode: 'wired' | 'bluetooth' | 'speaker';
  latencyCompensationMs: number;
  directMonitoring: boolean;
  rawStudioMic: boolean; // false: echo cancellation on, true: studio raw
}

export interface HardwareLatencyInfo {
  baseLatencyMs: number;
  outputLatencyMs: number;
  totalEstimatedLatencyMs: number;
  sampleRate: number;
}

export interface StorageEstimateInfo {
  usageMB: number;
  quotaMB: number;
  percentUsed: number;
}
