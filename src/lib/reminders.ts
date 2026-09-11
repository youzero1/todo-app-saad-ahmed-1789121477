import type { Task } from '@/types/task';
import { getDueBucket, todayKey } from '@/lib/dates';
import { readJson, writeJson } from '@/lib/storage';

export interface ReminderCounts {
  overdue: number;
  dueToday: number;
  total: number;
}

/** Derive reminder counts from the task list. Completed tasks are ignored. */
export function getReminderCounts(tasks: Task[], fromKey: string = todayKey()): ReminderCounts {
  let overdue = 0;
  let dueToday = 0;
  for (const task of tasks) {
    if (task.completed) continue;
    const bucket = getDueBucket(task, fromKey);
    if (bucket === 'overdue') overdue += 1;
    else if (bucket === 'today') dueToday += 1;
  }
  return { overdue, dueToday, total: overdue + dueToday };
}

export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/** Ask for permission. Resolves to the resulting state; never throws. */
export async function requestPermission(): Promise<NotificationPermissionState> {
  if (!isSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return getNotificationPermission();
  }
}

const DEDUPE_KEY = 'todo.v1.notified';

interface DedupeStore {
  /** the local day these keys belong to */
  day: string;
  /** task ids already notified today */
  ids: string[];
}

function readDedupe(day: string): Set<string> {
  const stored = readJson<DedupeStore | null>(DEDUPE_KEY, null);
  if (!stored || stored.day !== day || !Array.isArray(stored.ids)) return new Set();
  return new Set(stored.ids.filter((id): id is string => typeof id === 'string'));
}

function writeDedupe(day: string, ids: Set<string>): void {
  writeJson(DEDUPE_KEY, { day, ids: [...ids] } satisfies DedupeStore);
}

/**
 * Notify once per task per local day for anything overdue or due today.
 * No-ops silently when notifications are unsupported or not granted.
 * Returns how many notifications were actually shown.
 */
export function notifyDueTasks(tasks: Task[], fromKey: string = todayKey()): number {
  if (getNotificationPermission() !== 'granted') return 0;

  const alreadyNotified = readDedupe(fromKey);
  let shown = 0;

  for (const task of tasks) {
    if (task.completed || alreadyNotified.has(task.id)) continue;
    const bucket = getDueBucket(task, fromKey);
    if (bucket !== 'overdue' && bucket !== 'today') continue;

    try {
      new Notification(bucket === 'overdue' ? 'Task overdue' : 'Task due today', {
        body: task.title,
        tag: `${task.id}:${fromKey}`,
      });
      alreadyNotified.add(task.id);
      shown += 1;
    } catch {
      // Some browsers throw when constructing notifications outside a service
      // worker; treat as unsupported and stop trying for this pass.
      break;
    }
  }

  if (shown > 0) writeDedupe(fromKey, alreadyNotified);
  return shown;
}
