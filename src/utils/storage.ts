import { Project } from '../types/creator';
import { sampleProject } from '../data/sampleProject';

const STORAGE_KEY = 'creatorkit_projects_v1';
const ACTIVE_PROJECT_KEY = 'creatorkit_active_project_id';

export function getSavedProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time initialization with sample project
      const initial = [sampleProject];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [sampleProject];
  } catch (e) {
    console.error('Failed to read projects from localStorage:', e);
    return [sampleProject];
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to write projects to localStorage:', e);
  }
}

export function getActiveProjectId(projects: Project[]): string {
  try {
    const saved = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (saved && projects.some((p) => p.id === saved)) {
      return saved;
    }
  } catch (e) {
    // ignore
  }
  return projects[0]?.id || sampleProject.id;
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch (e) {
    // ignore
  }
}
