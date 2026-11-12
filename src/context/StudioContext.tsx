import { createContext, useContext, useMemo, useState } from 'react';
import type { StudioProject } from '../types/daw';

const defaultProject: StudioProject = {
  id: 'studio-default',
  name: 'Crhimastiano Session',
  bpm: 118,
  key: 'C',
  tracks: [
    { id: 'drums', name: 'Drums', type: 'drums', color: '#8b5cf6' },
    { id: 'bass', name: 'Bass', type: 'bass', color: '#22c55e' },
    { id: 'vocals', name: 'Vocals', type: 'vocals', color: '#f59e0b' },
  ],
};

type StudioContextValue = {
  project: StudioProject;
  setProject: (project: StudioProject) => void;
  updateTempo: (bpm: number) => void;
};

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<StudioProject>(defaultProject);

  const value = useMemo<StudioContextValue>(
    () => ({
      project,
      setProject,
      updateTempo: (bpm: number) => setProject((current) => ({ ...current, bpm })),
    }),
    [project],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);

  if (!context) {
    throw new Error('useStudio must be used inside StudioProvider');
  }

  return context;
}
