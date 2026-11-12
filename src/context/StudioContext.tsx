/**
 * CRHIMASTIANO STUDIO — Global Studio Context
 * Central reactive state for multitrack audio, transport, project management, and views.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  StudioTab,
  Track,
  TrackType,
  BeatGrid,
  DrumInstrument,
  AudioClip,
  AudioSettings,
  HardwareLatencyInfo,
  StorageEstimateInfo,
} from '../types/daw';
import { AudioEngine } from '../audio/AudioEngine';
import { projectStorage, createDefaultTracks } from '../services/projectStorage';
import { audioStorage } from '../services/audioStorage';

const SETTINGS_KEY = 'crhimastiano_audio_settings';

const defaultAudioSettings: AudioSettings = {
  hardwareMode: 'bluetooth',
  latencyCompensationMs: 160, // Standard Android Bluetooth A2DP latency compensation
  directMonitoring: false, // Disabled by default on Bluetooth to avoid acoustic disorientation
  rawStudioMic: true,
};

interface StudioContextType {
  project: Project;
  projectsList: Project[];
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  isPlaying: boolean;
  currentTime: number;
  currentStep: number;
  isRecording: boolean;
  recordingTrackId: string | null;
  metronome: boolean;
  selectedTrackId: string;
  setSelectedTrackId: (id: string) => void;
  audioEngine: AudioEngine;

  // Hardware, Latency & Storage
  audioSettings: AudioSettings;
  updateAudioSettings: (updates: Partial<AudioSettings>) => void;
  hardwareLatencyInfo: HardwareLatencyInfo;
  isAudioInterrupted: boolean;
  resumeAudio: () => Promise<void>;
  storageInfo: StorageEstimateInfo | null;
  refreshStorageInfo: () => Promise<void>;
  maxTakeDurationReached: boolean;
  dismissTakeLimitWarning: () => void;

  // Transport actions
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  toggleMetronome: () => void;
  setBpm: (bpm: number) => void;
  startRecording: (trackId: string) => Promise<void>;
  stopRecording: () => Promise<AudioClip | null>;

  // Track manipulation
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  updateTrackFx: (trackId: string, fxUpdates: Partial<Track['effects']>) => void;
  addTrack: (type: TrackType, name?: string) => void;
  deleteTrack: (trackId: string) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
  toggleArm: (trackId: string) => void;

  // Beat machine manipulation
  toggleBeatStep: (inst: DrumInstrument, stepIndex: number) => void;
  clearBeatGrid: () => void;
  loadBeatPreset: (presetName: 'afrobeat' | 'amapiano' | 'coupe_decale' | 'trap') => void;

  // Project management
  loadProject: (id: string) => void;
  createNewProject: (name: string, bpm?: number, genre?: string) => Project;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  saveProject: () => void;
  updateProjectMetadata: (updates: Partial<Project>) => void;

  // Export
  exportWav: (duration?: number) => Promise<Blob>;
  exportMidi: () => Blob;

  // Clip audition
  playClip: (clip: AudioClip) => void;
  stopClip: () => void;
}

const StudioContext = createContext<StudioContextType | null>(null);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<Project>(() => projectStorage.getCurrentProject());
  const [projectsList, setProjectsList] = useState<Project[]>(() => projectStorage.getProjects());
  const [activeTab, setActiveTab] = useState<StudioTab>('home');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTrackId, setRecordingTrackId] = useState<string | null>(null);
  const [metronome, setMetronome] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(() => project.tracks[0]?.id || '');

  // Hardware & storage state
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) return { ...defaultAudioSettings, ...JSON.parse(stored) };
    } catch (e) {}
    return defaultAudioSettings;
  });

  const [isAudioInterrupted, setIsAudioInterrupted] = useState(false);
  const [maxTakeDurationReached, setMaxTakeDurationReached] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageEstimateInfo | null>(null);
  const [hardwareLatencyInfo, setHardwareLatencyInfo] = useState<HardwareLatencyInfo>({
    baseLatencyMs: 5,
    outputLatencyMs: 20,
    totalEstimatedLatencyMs: 25,
    sampleRate: 44100,
  });

  const audioEngineRef = useRef<AudioEngine>(AudioEngine.getInstance());
  const projectRef = useRef<Project>(project);
  projectRef.current = project;

  // Sync AudioEngine parameters with project & audio settings
  useEffect(() => {
    const engine = audioEngineRef.current;
    engine.bpm = project.bpm;
    engine.metronomeEnabled = metronome;
    engine.latencyCompensationMs = audioSettings.latencyCompensationMs;
    engine.setDirectMonitoring(audioSettings.directMonitoring);

    // Sync all track channels
    project.tracks.forEach((t) => engine.syncTrackChannel(t));

    // Update live playback state in engine
    engine.updateLivePlaybackState(project.beatGrid, project.tracks);
  }, [project.bpm, project.tracks, project.beatGrid, metronome, audioSettings]);

  // Listen to OS audio state (interrupted/suspended on incoming call or background)
  useEffect(() => {
    const engine = audioEngineRef.current;
    const handleState = (state: AudioContextState) => {
      setIsAudioInterrupted(state === 'suspended');
      if (engine.ctx) {
        setHardwareLatencyInfo(engine.getHardwareLatencyInfo());
      }
    };
    engine.onStateChange(handleState);
    return () => engine.removeStateChangeListener(handleState);
  }, []);

  // Update storage usage estimate
  const refreshStorageInfo = useCallback(async () => {
    const est = await audioStorage.getStorageEstimate();
    setStorageInfo(est);
  }, []);

  useEffect(() => {
    refreshStorageInfo();
  }, [refreshStorageInfo]);

  const updateAudioSettings = useCallback((updates: Partial<AudioSettings>) => {
    setAudioSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const resumeAudio = useCallback(async () => {
    const engine = audioEngineRef.current;
    if (engine.ctx) {
      await engine.ctx.resume();
      setIsAudioInterrupted(false);
      setHardwareLatencyInfo(engine.getHardwareLatencyInfo());
    }
  }, []);

  const dismissTakeLimitWarning = useCallback(() => {
    setMaxTakeDurationReached(false);
  }, []);

  // Rehydrate clip buffers from IndexedDB once audio context is created/resumed
  useEffect(() => {
    const rehydrate = async () => {
      const engine = audioEngineRef.current;
      if (engine.ctx) {
        const rehydrated = await projectStorage.restoreClipsAudio(projectRef.current, engine.ctx);
        setProject((prev) => ({ ...prev, tracks: rehydrated.tracks }));
      }
    };
    rehydrate();
  }, []);

  // Subscribe to AudioEngine clock updates
  useEffect(() => {
    const engine = audioEngineRef.current;
    const handleTimeUpdate = (time: number, step: number) => {
      setCurrentTime(time);
      setCurrentStep(step);
    };

    engine.onTimeUpdate(handleTimeUpdate);
    return () => {
      engine.removeTimeUpdateListener(handleTimeUpdate);
    };
  }, []);

  const play = useCallback(async () => {
    const engine = audioEngineRef.current;
    await engine.startPlayback(projectRef.current.beatGrid, projectRef.current.tracks);
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    const engine = audioEngineRef.current;
    engine.pausePlayback();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    const engine = audioEngineRef.current;
    engine.stopPlayback();
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentStep(0);
  }, []);

  const seek = useCallback((seconds: number) => {
    const engine = audioEngineRef.current;
    engine.seek(seconds, projectRef.current.beatGrid, projectRef.current.tracks);
  }, []);

  const toggleMetronome = useCallback(() => {
    setMetronome((prev) => {
      const next = !prev;
      audioEngineRef.current.metronomeEnabled = next;
      return next;
    });
  }, []);

  const setBpm = useCallback((newBpm: number) => {
    const clamped = Math.max(40, Math.min(240, Math.round(newBpm)));
    audioEngineRef.current.bpm = clamped;
    setProject((prev) => {
      const updated = { ...prev, bpm: clamped };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const stopRecording = useCallback(async (): Promise<AudioClip | null> => {
    const engine = audioEngineRef.current;
    if (!isRecording || !recordingTrackId) return null;

    engine.pausePlayback();
    setIsPlaying(false);

    const track = projectRef.current.tracks.find((t) => t.id === recordingTrackId);
    const trackName = track ? track.name : 'Piste Enregistrée';

    try {
      const newClip = await engine.stopRecording(recordingTrackId, trackName);
      setIsRecording(false);
      setRecordingTrackId(null);

      // Add clip to track
      setProject((prev) => {
        const nextTracks = prev.tracks.map((t) => {
          if (t.id === recordingTrackId) {
            return {
              ...t,
              clips: [...t.clips, newClip],
            };
          }
          return t;
        });
        const updated = { ...prev, tracks: nextTracks };
        projectStorage.saveProject(updated);
        return updated;
      });

      refreshStorageInfo();
      return newClip;
    } catch (err) {
      console.error('Erreur arrêt enregistrement:', err);
      setIsRecording(false);
      setRecordingTrackId(null);
      return null;
    }
  }, [isRecording, recordingTrackId, refreshStorageInfo]);

  const startRecording = useCallback(
    async (trackId: string) => {
      const engine = audioEngineRef.current;
      await engine.initAudio();
      await engine.startRecording(() => {
        setMaxTakeDurationReached(true);
        stopRecording();
      });
      setIsRecording(true);
      setRecordingTrackId(trackId);

      // Also start playback so the artist records over the beat/backing tracks
      await engine.startPlayback(projectRef.current.beatGrid, projectRef.current.tracks);
      setIsPlaying(true);
    },
    [stopRecording]
  );

  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    setProject((prev) => {
      const nextTracks = prev.tracks.map((t) => {
        if (t.id === trackId) {
          const mod = { ...t, ...updates };
          audioEngineRef.current.syncTrackChannel(mod);
          return mod;
        }
        return t;
      });
      const updated = { ...prev, tracks: nextTracks };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const updateTrackFx = useCallback((trackId: string, fxUpdates: Partial<Track['effects']>) => {
    setProject((prev) => {
      const nextTracks = prev.tracks.map((t) => {
        if (t.id === trackId) {
          const mod = {
            ...t,
            effects: { ...t.effects, ...fxUpdates },
          };
          audioEngineRef.current.syncTrackChannel(mod);
          return mod;
        }
        return t;
      });
      const updated = { ...prev, tracks: nextTracks };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const toggleMute = useCallback((trackId: string) => {
    setProject((prev) => {
      const nextTracks = prev.tracks.map((t) => {
        if (t.id === trackId) {
          const mod = { ...t, mute: !t.mute };
          audioEngineRef.current.syncTrackChannel(mod);
          return mod;
        }
        return t;
      });
      const updated = { ...prev, tracks: nextTracks };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const toggleSolo = useCallback((trackId: string) => {
    setProject((prev) => {
      const target = prev.tracks.find((t) => t.id === trackId);
      const targetSoloNext = target ? !target.solo : false;

      const nextTracks = prev.tracks.map((t) => {
        if (t.id === trackId) {
          return { ...t, solo: targetSoloNext, mute: false };
        }
        // If target is now soloed, mute others; if un-soloed, unmute
        return { ...t, mute: targetSoloNext ? true : false, solo: false };
      });

      nextTracks.forEach((t) => audioEngineRef.current.syncTrackChannel(t));
      const updated = { ...prev, tracks: nextTracks };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const toggleArm = useCallback((trackId: string) => {
    setProject((prev) => {
      const nextTracks = prev.tracks.map((t) => ({
        ...t,
        armed: t.id === trackId ? !t.armed : false, // single track arm for clarity
      }));
      const updated = { ...prev, tracks: nextTracks };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const addTrack = useCallback((type: TrackType, customName?: string) => {
    setProject((prev) => {
      const index = prev.tracks.length + 1;
      const typeLabels: Record<TrackType, string> = {
        audio: 'Piste Audio',
        beat: 'Percussions & Rythme',
        synth: 'Synthétiseur / Clavier',
        vocal: 'Voix Microphone',
        choir: 'Chœur & Harmonies',
        duo: 'Piste Duo Artiste',
      };
      const colors: Record<TrackType, string> = {
        audio: '#38BDF8',
        beat: '#14B8A6',
        synth: '#E5C158',
        vocal: '#F5D77F',
        choir: '#A78BFA',
        duo: '#F43F5E',
      };

      const newTrack: Track = {
        id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: customName || `0${index}. ${typeLabels[type]}`,
        type,
        color: colors[type] || '#14B8A6',
        volume: 0.85,
        pan: 0,
        mute: false,
        solo: false,
        armed: false,
        effects: {
          eqLow: 0,
          eqMid: 0,
          eqHigh: 0,
          reverb: 0.2,
          delay: 0.1,
          distortion: 0,
          compression: 0.3,
        },
        clips: [],
      };

      audioEngineRef.current.syncTrackChannel(newTrack);
      const updated = { ...prev, tracks: [...prev.tracks, newTrack] };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const deleteTrack = useCallback((trackId: string) => {
    setProject((prev) => {
      if (prev.tracks.length <= 1) return prev;
      const nextTracks = prev.tracks.filter((t) => t.id !== trackId);
      const updated = { ...prev, tracks: nextTracks };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const toggleBeatStep = useCallback((inst: DrumInstrument, stepIndex: number) => {
    setProject((prev) => {
      const currentList = prev.beatGrid[inst] || [];
      const updatedList = currentList.map((step, idx) => {
        if (idx === stepIndex) {
          const nextActive = !step.active;
          // Play sound on click for immediate audition
          if (nextActive) {
            audioEngineRef.current.playDrum(inst, step.velocity || 0.85);
          }
          return { ...step, active: nextActive };
        }
        return step;
      });

      const nextGrid: BeatGrid = {
        ...prev.beatGrid,
        [inst]: updatedList,
      };

      const updated = { ...prev, beatGrid: nextGrid };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const clearBeatGrid = useCallback(() => {
    setProject((prev) => {
      const cleared: Partial<BeatGrid> = {};
      (Object.keys(prev.beatGrid) as DrumInstrument[]).forEach((inst) => {
        cleared[inst] = Array.from({ length: 16 }, () => ({
          active: false,
          velocity: 0.85,
        }));
      });
      const updated = { ...prev, beatGrid: cleared as BeatGrid };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const loadBeatPreset = useCallback((preset: 'afrobeat' | 'amapiano' | 'coupe_decale' | 'trap') => {
    setProject((prev) => {
      const grid: Partial<BeatGrid> = {};
      (Object.keys(prev.beatGrid) as DrumInstrument[]).forEach((inst) => {
        grid[inst] = Array.from({ length: 16 }, () => ({
          active: false,
          velocity: 0.85,
        }));
      });

      if (preset === 'afrobeat') {
        [0, 6, 8, 14].forEach((s) => (grid.kick![s].active = true));
        [0, 8].forEach((s) => (grid.sub808![s].active = true));
        [4, 12].forEach((s) => (grid.snare![s].active = true));
        [0, 2, 4, 6, 8, 10, 12, 14].forEach((s) => (grid.shekere![s].active = true));
        [2, 7, 10, 13].forEach((s) => (grid.djembe![s].active = true));
        [5, 11].forEach((s) => (grid.talking_drum![s].active = true));
      } else if (preset === 'amapiano') {
        [0, 4, 8, 12].forEach((s) => (grid.kick![s].active = true));
        [0, 3, 6, 9, 12, 15].forEach((s) => (grid.shekere![s].active = true));
        [2, 5, 8, 11, 14].forEach((s) => (grid.djembe![s].active = true));
        [4, 12].forEach((s) => (grid.clap![s].active = true));
        [0, 6, 10].forEach((s) => (grid.sub808![s].active = true));
      } else if (preset === 'coupe_decale') {
        [0, 4, 8, 12].forEach((s) => (grid.kick![s].active = true));
        [2, 6, 10, 14].forEach((s) => (grid.snare![s].active = true));
        [1, 3, 5, 7, 9, 11, 13, 15].forEach((s) => (grid.hihat_closed![s].active = true));
        [0, 3, 6, 8, 11, 14].forEach((s) => (grid.djembe![s].active = true));
      } else {
        // Trap / Urban
        [0, 7, 10].forEach((s) => (grid.kick![s].active = true));
        [0, 7].forEach((s) => (grid.sub808![s].active = true));
        [4, 12].forEach((s) => (grid.clap![s].active = true));
        [0, 2, 4, 6, 8, 10, 12, 14].forEach((s) => (grid.hihat_closed![s].active = true));
        [3, 7, 11, 15].forEach((s) => (grid.hihat_open![s].active = true));
      }

      const updated = { ...prev, beatGrid: grid as BeatGrid };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const loadProject = useCallback((id: string) => {
    stop();
    const p = projectStorage.setCurrentProject(id);
    if (p) {
      setProject(p);
      setSelectedTrackId(p.tracks[0]?.id || '');
    }
  }, [stop]);

  const createNewProject = useCallback((name: string, bpm = 112, genre = 'Afrobeats / Urbain') => {
    stop();
    const created = projectStorage.createNewProject(name, bpm, genre);
    setProject(created);
    setProjectsList(projectStorage.getProjects());
    setSelectedTrackId(created.tracks[0]?.id || '');
    return created;
  }, [stop]);

  const duplicateProject = useCallback((id: string) => {
    projectStorage.duplicateProject(id);
    setProjectsList(projectStorage.getProjects());
  }, []);

  const deleteProject = useCallback((id: string) => {
    const success = projectStorage.deleteProject(id);
    if (success) {
      setProjectsList(projectStorage.getProjects());
      setProject(projectStorage.getCurrentProject());
    }
  }, []);

  const saveProject = useCallback(() => {
    projectStorage.saveProject(projectRef.current);
    setProjectsList(projectStorage.getProjects());
  }, []);

  const updateProjectMetadata = useCallback((updates: Partial<Project>) => {
    setProject((prev) => {
      const updated = { ...prev, ...updates };
      projectStorage.saveProject(updated);
      return updated;
    });
  }, []);

  const exportWav = useCallback(async (duration = 16): Promise<Blob> => {
    const engine = audioEngineRef.current;
    return await engine.renderProjectToWav(duration, projectRef.current.tracks, projectRef.current.beatGrid);
  }, []);

  const exportMidi = useCallback((): Blob => {
    const engine = audioEngineRef.current;
    return engine.exportMidiFile(projectRef.current.beatGrid);
  }, []);

  const playClip = useCallback((clip: AudioClip) => {
    const engine = audioEngineRef.current;
    engine.initAudio().then(() => {
      engine.playSingleClip(clip);
    });
  }, []);

  const stopClip = useCallback(() => {
    const engine = audioEngineRef.current;
    engine.stopSingleClip();
  }, []);

  return (
    <StudioContext.Provider
      value={{
        project,
        projectsList,
        activeTab,
        setActiveTab,
        isPlaying,
        currentTime,
        currentStep,
        isRecording,
        recordingTrackId,
        metronome,
        selectedTrackId,
        setSelectedTrackId,
        audioEngine: audioEngineRef.current,
        audioSettings,
        updateAudioSettings,
        hardwareLatencyInfo,
        isAudioInterrupted,
        resumeAudio,
        storageInfo,
        refreshStorageInfo,
        maxTakeDurationReached,
        dismissTakeLimitWarning,
        play,
        pause,
        stop,
        seek,
        toggleMetronome,
        setBpm,
        startRecording,
        stopRecording,
        updateTrack,
        updateTrackFx,
        addTrack,
        deleteTrack,
        toggleMute,
        toggleSolo,
        toggleArm,
        toggleBeatStep,
        clearBeatGrid,
        loadBeatPreset,
        loadProject,
        createNewProject,
        duplicateProject,
        deleteProject,
        saveProject,
        updateProjectMetadata,
        exportWav,
        exportMidi,
        playClip,
        stopClip,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio doit être utilisé au sein d\'un StudioProvider');
  }
  return context;
};
