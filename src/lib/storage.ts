import type { Task } from '@/types/task';

/** Single versioned storage key. Bump the suffix if the Task shape changes. */
export const STORAGE_KEY = 'todo.v1';

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Narrow an unknown parsed entry to a Task, repairing tolerable gaps
 * (missing timestamps, absent `completedAt`) and rejecting anything
 * without a usable id + title.
 */
function coerceTask(value: unknown): Task | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === 'string' ? value.id : null;
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  if (!id || title.length === 0) return null;

  const dueDate =
    typeof value.dueDate === 'string' && DATE_KEY_RE.test(value.dueDate) ? value.dueDate : null;

  const completed = value.completed === true;
  const completedAt =
    completed && typeof value.completedAt === 'string' ? value.completedAt : null;

  const now = new Date().toISOString();
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : now;
  const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : createdAt;

  const notes =
    typeof value.notes === 'string' && value.notes.trim().length > 0
      ? value.notes
      : undefined;

  return { id, title, notes, dueDate, completed, completedAt, createdAt, updatedAt };
}

/**
 * Read the task list. Never throws: absent, unparsable, or corrupt storage
 * all yield an empty array, and individual malformed entries are dropped.
 */
export function loadTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const tasks: Task[] = [];
    const seen = new Set<string>();
    for (const entry of parsed) {
      const task = coerceTask(entry);
      if (task && !seen.has(task.id)) {
        seen.add(task.id);
        tasks.push(task);
      }
    }
    return tasks;
  } catch {
    return [];
  }
}

/** Write immediately. Silently no-ops if storage is unavailable or full. */
export function saveTasksNow(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* quota exceeded or storage disabled — nothing useful to do */
  }
}

const WRITE_DELAY_MS = 200;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced write so rapid edits do not thrash localStorage. */
export function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  if (writeTimer !== null) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    saveTasksNow(tasks);
  }, WRITE_DELAY_MS);
}

/** Flush any pending debounced write (e.g. on pagehide). */
export function flushTasks(tasks: Task[]): void {
  if (writeTimer !== null) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  saveTasksNow(tasks);
}

/** Generic guarded JSON read/write used by the reminder dedupe store. */
export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
