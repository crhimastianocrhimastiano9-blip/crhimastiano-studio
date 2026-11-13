import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { StudioProject, StudioTab, TrackType } from '../types/daw';
import { loadProject, saveProject } from '../services/projectStorage';

const defaultProject: StudioProject = {
  id: 'studio-default',
  name: 'Crhimastiano Session',
  bpm: 118,
  key: 'C',
  timeSignature: '4/4',
  masterVolume: 0.82,
  monitorEnabled: true,
  tracks: [
    { id: 'drums', name: 'Drums', type: 'drums', color: '#8b5cf6', level: 78 },
    { id: 'bass', name: 'Bass', type: 'bass', color: '#22c55e', level: 66 },
    { id: 'vocals', name: 'Vocals', type: 'vocals', color: '#f59e0b', level: 88 },
    { id: 'synth', name: 'Synth', type: 'synth', color: '#38bdf8', level: 55 },
  ],
};

type StudioContextValue = {
  project: StudioProject;
  setProject: (project: StudioProject) => void;
  updateTempo: (bpm: number) => void;
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  setTrackLevel: (trackId: string, level: number) => void;
  addTrack: (name: string, type: TrackType) => void;
  removeTrack: (trackId: string) => void;
};

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<StudioProject>(() => loadProject() ?? defaultProject);
  const [activeTab, setActiveTab] = useState<StudioTab>('home');

  useEffect(() => {
    saveProject(project);
  }, [project]);

  const value = useMemo<StudioContextValue>(
    () => ({
      project,
      setProject,
      updateTempo: (bpm) => setProject((current) => ({ ...current, bpm })),
      activeTab,
      setActiveTab,
      toggleTrackMute: (trackId) => setProject((current) => ({
        ...current,
        tracks: current.tracks.map((track) => track.id === trackId ? { ...track, muted: !track.muted } : track),
      })),
      toggleTrackSolo: (trackId) => setProject((current) => ({
        ...current,
        tracks: current.tracks.map((track) => track.id === trackId ? { ...track, solo: !track.solo } : track),
      })),
      setTrackLevel: (trackId, level) => setProject((current) => ({
        ...current,
        tracks: current.tracks.map((track) => track.id === trackId ? { ...track, level } : track),
      })),
      addTrack: (name, type) => setProject((current) => {
        const colors = ['#8b5cf6', '#22c55e', '#f59e0b', '#38bdf8', '#ec4899', '#14b8a6'];
        const id = `track-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        return {
          ...current,
          tracks: [...current.tracks, { id, name, type, color: colors[current.tracks.length % colors.length], level: 75 }],
        };
      }),
      removeTrack: (trackId) => setProject((current) => ({
        ...current,
        tracks: current.tracks.filter((track) => track.id !== trackId),
      })),
    }),
    [activeTab, project],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used inside StudioProvider');
  return context;
}
