export type TimelineBeat = {
  id: string;
  time: number;
  velocity?: number;
};

export type TrackType = 'drums' | 'bass' | 'vocals' | 'synth' | 'fx';

export type StudioTrack = {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  muted?: boolean;
  solo?: boolean;
};

export type StudioProject = {
  id: string;
  name: string;
  bpm: number;
  key: string;
  tracks: StudioTrack[];
};
