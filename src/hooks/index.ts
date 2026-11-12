import type { StudioProject } from '../types/daw';

const PROJECT_STORAGE_KEY = 'crhimastiano-project';

export function loadProject(): StudioProject | null {
  const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as StudioProject) : null;
}

export function saveProject(project: StudioProject) {
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
}

export function clearProject() {
  localStorage.removeItem(PROJECT_STORAGE_KEY);
}
