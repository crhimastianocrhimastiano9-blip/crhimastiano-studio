import type { StudioProject } from '../types/daw';

const PROJECT_STORAGE_KEY = 'crhimastiano-project';

export function loadProject(): StudioProject | null {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StudioProject) : null;
  } catch {
    return null;
  }
}

export function saveProject(project: StudioProject) {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
  } catch {
    // Storage can be unavailable or full.
  }
}

export function clearProject() {
  try {
    localStorage.removeItem(PROJECT_STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
