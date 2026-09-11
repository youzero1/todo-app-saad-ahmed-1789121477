import type { DueBucket, Task } from '@/types/task';

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Format a Date as a local `YYYY-MM-DD` key (never UTC-shifted). */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's local calendar date as `YYYY-MM-DD`. */
export function todayKey(): string {
  return toDateKey(new Date());
}

export function isValidDateKey(key: string | null | undefined): key is string {
  if (typeof key !== 'string' || !DATE_KEY_RE.test(key)) return false;
  return parseDateKey(key) !== null;
}

/**
 * Parse `YYYY-MM-DD` into a local Date at midnight.
 * Returns null for malformed or non-existent dates (e.g. 2024-02-31).
 */
export function parseDateKey(key: string): Date | null {
  if (!DATE_KEY_RE.test(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Whole-calendar-day difference from `fromKey` (default today) to `dateKey`.
 * Positive = future, 0 = today, negative = past.
 *
 * Both sides are normalised to local midnight and the subtraction is rounded,
 * so a DST transition (a 23- or 25-hour day) cannot shift the result by a day
 * the way raw millisecond division would.
 */
export function diffInDays(dateKey: string, fromKey: string = todayKey()): number | null {
  const target = parseDateKey(dateKey);
  const from = parseDateKey(fromKey);
  if (!target || !from) return null;
  const MS_PER_DAY = 86_400_000;
  return Math.round((target.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * Which group a task belongs to. Completed tasks never report as overdue —
 * callers that show a "Completed" section handle those separately.
 */
export function getDueBucket(task: Task, fromKey: string = todayKey()): DueBucket {
  if (!task.dueDate) return 'someday';
  const diff = diffInDays(task.dueDate, fromKey);
  if (diff === null) return 'someday';
  if (diff < 0) return task.completed ? 'upcoming' : 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return 'upcoming';
}

/** Short absolute form, e.g. "12 Mar" or "12 Mar 2026" when in another year. */
export function formatAbsoluteDue(dateKey: string, fromKey: string = todayKey()): string {
  const date = parseDateKey(dateKey);
  if (!date) return '';
  const from = parseDateKey(fromKey);
  const sameYear = from ? from.getFullYear() === date.getFullYear() : true;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * Human label for a due date: "Overdue by 2 days", "Due today",
 * "Due tomorrow", "In 4 days", or a short absolute date beyond a week.
 */
export function formatRelativeDue(dateKey: string, fromKey: string = todayKey()): string {
  const diff = diffInDays(dateKey, fromKey);
  if (diff === null) return '';
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff === -1) return 'Overdue by 1 day';
  if (diff < -1) return `Overdue by ${Math.abs(diff)} days`;
  if (diff <= 7) return `In ${diff} days`;
  return `Due ${formatAbsoluteDue(dateKey, fromKey)}`;
}

/** Milliseconds from now until the next local midnight (always >= 1). */
export function msUntilNextMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return Math.max(1, next.getTime() - now.getTime());
}
