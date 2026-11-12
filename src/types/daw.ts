export type TrackType = 'drums' | 'bass' | 'vocals' | 'synth' | 'fx';

export type StudioTab =
  | 'home'
  | 'multitrack'
  | 'beatmaker'
  | 'voice'
  | 'choir'
  | 'duo'
  | 'mix'
  | 'ai'
  | 'export';

export type StudioTrack = {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  muted?: boolean;
  solo?: boolean;
  level?: number;
};

export type StudioProject = {
  id: string;
  name: string;
  bpm: number;
  key: string;
  timeSignature: string;
  masterVolume: number;
  monitorEnabled: boolean;
  tracks: StudioTrack[];
};
