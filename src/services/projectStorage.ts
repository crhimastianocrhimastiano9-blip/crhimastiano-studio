/**
 * CRHIMASTIANO STUDIO — Project Storage Service
 * Handles persistence via IndexedDB and LocalStorage with server-side sync support.
 */

import { Project, Track, BeatGrid, DrumInstrument, AudioClip } from '../types/daw';
import { audioStorage } from './audioStorage';

const STORAGE_KEY = 'crhimastiano_projects_index';
const CURRENT_PROJECT_ID_KEY = 'crhimastiano_current_project_id';

export function createDefaultBeatGrid(): BeatGrid {
  const instruments: DrumInstrument[] = [
    'sub808',
    'kick',
    'snare',
    'hihat_closed',
    'hihat_open',
    'clap',
    'djembe',
    'talking_drum',
    'shekere',
  ];

  const grid: Partial<BeatGrid> = {};

  instruments.forEach((inst) => {
    grid[inst] = Array.from({ length: 16 }, () => ({
      active: false,
      velocity: 0.85,
    }));
  });

  // Default Afrobeat / Fusion rhythm preset
  // Kick 4 on the floor + syncopations
  [0, 6, 8, 14].forEach((s) => {
    grid.kick![s].active = true;
  });

  // 808 sub on main accents
  [0, 8].forEach((s) => {
    grid.sub808![s].active = true;
    grid.sub808![s].velocity = 0.95;
  });

  // Snare / Rimshot on steps 4, 12
  [4, 12].forEach((s) => {
    grid.snare![s].active = true;
  });

  // Shaker / Shekere on all odd/even 16ths for continuous African groove
  [0, 2, 4, 6, 8, 10, 12, 14].forEach((s) => {
    grid.shekere![s].active = true;
    grid.shekere![s].velocity = s % 4 === 0 ? 0.9 : 0.65;
  });

  // Djembe accents
  [2, 7, 10, 13].forEach((s) => {
    grid.djembe![s].active = true;
    grid.djembe![s].velocity = 0.88;
  });

  // Talking drum melodic sweep
  [5, 11].forEach((s) => {
    grid.talking_drum![s].active = true;
  });

  // Hi-Hat Closed syncopation
  [2, 6, 10, 14].forEach((s) => {
    grid.hihat_closed![s].active = true;
  });

  return grid as BeatGrid;
}

export function createDefaultTracks(): Track[] {
  return [
    {
      id: 'track-1-drums',
      name: '01. Rythmique & Percus Afro',
      type: 'beat',
      color: '#14B8A6', // Turquoise
      volume: 0.85,
      pan: 0,
      mute: false,
      solo: false,
      armed: false,
      effects: {
        eqLow: 1.5,
        eqMid: 0,
        eqHigh: 2.0,
        reverb: 0.15,
        delay: 0.05,
        distortion: 0.1,
        compression: 0.4,
      },
      clips: [],
    },
    {
      id: 'track-2-bass',
      name: '02. Basse 808 Profonde',
      type: 'synth',
      color: '#E5C158', // Metallic Gold
      volume: 0.9,
      pan: 0,
      mute: false,
      solo: false,
      armed: false,
      effects: {
        eqLow: 3.0,
        eqMid: -1.5,
        eqHigh: -4.0,
        reverb: 0,
        delay: 0,
        distortion: 0.25,
        compression: 0.6,
      },
      clips: [],
    },
    {
      id: 'track-3-keys',
      name: '03. Clavier Rhodes & Nappes',
      type: 'synth',
      color: '#38BDF8', // Cyan
      volume: 0.75,
      pan: -0.2,
      mute: false,
      solo: false,
      armed: false,
      effects: {
        eqLow: -1.0,
        eqMid: 1.0,
        eqHigh: 1.5,
        reverb: 0.4,
        delay: 0.25,
        distortion: 0.05,
        compression: 0.2,
      },
      clips: [],
    },
    {
      id: 'track-4-lead',
      name: '04. Synthé Lead Turquoise',
      type: 'synth',
      color: '#2DD4BF', // Turquoise Glow
      volume: 0.8,
      pan: 0.25,
      mute: false,
      solo: false,
      armed: false,
      effects: {
        eqLow: -2.0,
        eqMid: 2.0,
        eqHigh: 3.0,
        reverb: 0.5,
        delay: 0.35,
        distortion: 0.15,
        compression: 0.3,
      },
      clips: [],
    },
    {
      id: 'track-5-vocal',
      name: '05. Voix Lead (Micro 1)',
      type: 'vocal',
      color: '#F5D77F', // Bright Gold
      volume: 0.95,
      pan: 0,
      mute: false,
      solo: false,
      armed: true, // Armed by default for fast vocal tracking!
      effects: {
        eqLow: -2.5,
        eqMid: 1.5,
        eqHigh: 3.5,
        reverb: 0.35,
        delay: 0.2,
        distortion: 0.08,
        compression: 0.65,
      },
      clips: [],
    },
    {
      id: 'track-6-choir',
      name: '06. Chœur Polyphonique & Harmonies',
      type: 'choir',
      color: '#A78BFA', // Purple soft
      volume: 0.7,
      pan: 0,
      mute: false,
      solo: false,
      armed: false,
      effects: {
        eqLow: -3.0,
        eqMid: 0.5,
        eqHigh: 2.5,
        reverb: 0.6,
        delay: 0.3,
        distortion: 0.02,
        compression: 0.45,
      },
      clips: [],
    },
  ];
}

export function createInitialDemoProjects(): Project[] {
  return [
    {
      id: 'demo-afro-fusion',
      name: 'Afro-Fusion Rêverie (Démo)',
      bpm: 112,
      timeSignature: '4/4',
      key: 'Fa# mineur',
      genre: 'Afro-Fusion / Amapiano',
      masterVolume: 0.9,
      masterPan: 0,
      tracks: createDefaultTracks(),
      beatGrid: createDefaultBeatGrid(),
      notes: 'Session officielle CRHIMASTIANO STUDIO. Percussions africaines synthétisées avec résonance de djembe, Talking drum et sub 808.',
      lyricsDraft: 'Crhimastiano au contrôle, le futur dans les mains...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-nuit-dor',
      name: 'Nuit d\'Or — Amapiano',
      bpm: 113,
      timeSignature: '4/4',
      key: 'Ré majeur',
      genre: 'Amapiano / Deep House',
      masterVolume: 0.88,
      masterPan: 0,
      tracks: createDefaultTracks().map((t, idx) => ({
        ...t,
        volume: idx === 1 ? 1.0 : t.volume, // Boost bass
      })),
      beatGrid: (() => {
        const bg = createDefaultBeatGrid();
        // Amapiano log drum feel on steps
        [0, 3, 6, 9, 12, 15].forEach((s) => {
          bg.shekere[s].active = true;
        });
        return bg;
      })(),
      notes: 'Rythmique sud-africaine Amapiano avec shakers précis et voicings Rhodes ouverts.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-duo-urbain',
      name: 'Duo Urbain Acoustique',
      bpm: 96,
      timeSignature: '4/4',
      key: 'La mineur',
      genre: 'R&B / Duo Acoustique',
      masterVolume: 0.92,
      masterPan: 0,
      tracks: [
        ...createDefaultTracks().slice(0, 4),
        {
          id: 'track-duo-art1',
          name: '05. Artiste 1 — Voix A (Lead)',
          type: 'duo',
          color: '#E5C158',
          volume: 0.9,
          pan: -0.25,
          mute: false,
          solo: false,
          armed: true,
          effects: {
            eqLow: -2.0,
            eqMid: 1.2,
            eqHigh: 2.8,
            reverb: 0.3,
            delay: 0.15,
            distortion: 0.05,
            compression: 0.6,
          },
          clips: [],
        },
        {
          id: 'track-duo-art2',
          name: '06. Artiste 2 — Voix B (Harmonie)',
          type: 'duo',
          color: '#2DD4BF',
          volume: 0.9,
          pan: 0.25,
          mute: false,
          solo: false,
          armed: false,
          effects: {
            eqLow: -2.5,
            eqMid: 1.0,
            eqHigh: 3.2,
            reverb: 0.45,
            delay: 0.25,
            distortion: 0.05,
            compression: 0.6,
          },
          clips: [],
        },
      ],
      beatGrid: createDefaultBeatGrid(),
      notes: 'Session dédiée à la collaboration de deux interprètes avec pistes stéréo séparées et réglages de balance.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

class ProjectStorageService {
  private projects: Map<string, Project> = new Map();
  private currentProjectId: string = 'demo-afro-fusion';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const list: Project[] = JSON.parse(serialized);
        list.forEach((p) => this.projects.set(p.id, p));
      }
    } catch (e) {
      console.warn('Impossible de charger les projets depuis localStorage', e);
    }

    // Seed defaults if empty
    if (this.projects.size === 0) {
      const defaults = createInitialDemoProjects();
      defaults.forEach((p) => this.projects.set(p.id, p));
      this.saveToStorage();
    }

    const savedCurId = localStorage.getItem(CURRENT_PROJECT_ID_KEY);
    if (savedCurId && this.projects.has(savedCurId)) {
      this.currentProjectId = savedCurId;
    } else {
      this.currentProjectId = this.projects.keys().next().value || 'demo-afro-fusion';
    }
  }

  private saveToStorage() {
    try {
      // Stripping heavy non-serializable properties (like active AudioBuffer in clips) for JSON storage
      const sanitized = Array.from(this.projects.values()).map((p) => ({
        ...p,
        tracks: p.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) => ({
            ...c,
            audioBuffer: undefined, // buffer reconstructed or in IndexedDB
          })),
        })),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      localStorage.setItem(CURRENT_PROJECT_ID_KEY, this.currentProjectId);
    } catch (e) {
      console.warn('Erreur lors de la sauvegarde locale du projet', e);
    }
  }

  public getProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  public getCurrentProject(): Project {
    const cur = this.projects.get(this.currentProjectId);
    if (cur) return cur;
    const first = this.projects.values().next().value;
    if (first) {
      this.currentProjectId = first.id;
      return first;
    }
    const fresh = createInitialDemoProjects()[0];
    this.saveProject(fresh);
    return fresh;
  }

  public setCurrentProject(id: string): Project | null {
    const p = this.projects.get(id);
    if (p) {
      this.currentProjectId = id;
      this.saveToStorage();
      return p;
    }
    return null;
  }

  public saveProject(project: Project): void {
    project.updatedAt = new Date().toISOString();
    this.projects.set(project.id, project);
    this.currentProjectId = project.id;
    this.saveToStorage();

    // Persist all clip audio buffers in IndexedDB
    project.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (clip.audioBuffer) {
          audioStorage.saveClipAudio(clip.id, clip.audioBuffer);
        }
      });
    });

    // Sync in background to server endpoint for Android / multi-device parity
    this.syncToServer(project);
  }

  /**
   * Rehydrate clip audio buffers from IndexedDB into Web Audio AudioBuffers
   */
  public async restoreClipsAudio(project: Project, ctx: AudioContext): Promise<Project> {
    let modified = false;
    for (const track of project.tracks) {
      for (const clip of track.clips) {
        if (!clip.audioBuffer) {
          const restored = await audioStorage.loadClipAudio(clip.id, ctx);
          if (restored) {
            clip.audioBuffer = restored;
            modified = true;
          }
        }
      }
    }
    if (modified) {
      this.projects.set(project.id, project);
    }
    return project;
  }

  private async syncToServer(project: Project) {
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.id,
          name: project.name,
          bpm: project.bpm,
          timeSignature: project.timeSignature,
          genre: project.genre,
          key: project.key,
          notes: project.notes,
        }),
      });
    } catch (e) {
      // Silent catch: offline or dev preview
    }
  }

  public createNewProject(name: string, bpm = 112, genre = 'Afrobeats / Urbain'): Project {
    const id = `prj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newPrj: Project = {
      id,
      name,
      bpm,
      timeSignature: '4/4',
      key: 'Do majeur',
      genre,
      masterVolume: 0.9,
      masterPan: 0,
      tracks: createDefaultTracks(),
      beatGrid: createDefaultBeatGrid(),
      notes: `Projet créé dans CRHIMASTIANO STUDIO le ${new Date().toLocaleDateString('fr-FR')}.`,
      lyricsDraft: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.saveProject(newPrj);
    return newPrj;
  }

  public duplicateProject(id: string): Project | null {
    const orig = this.projects.get(id);
    if (!orig) return null;
    const copyId = `prj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const copy: Project = {
      ...orig,
      id: copyId,
      name: `${orig.name} (Copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.saveProject(copy);
    return copy;
  }

  public deleteProject(id: string): boolean {
    if (this.projects.size <= 1) {
      return false; // keep at least 1
    }
    const existed = this.projects.delete(id);
    if (existed) {
      if (this.currentProjectId === id) {
        this.currentProjectId = this.projects.keys().next().value || '';
      }
      this.saveToStorage();
      fetch(`/api/projects/${id}`, { method: 'DELETE' }).catch(() => {});
    }
    return existed;
  }
}

export const projectStorage = new ProjectStorageService();
