/** A single todo item. The one shared source of truth for task typing. */
export interface Task {
  /** crypto-random unique id */
  id: string;
  /** required, trimmed */
  title: string;
  /** optional short note */
  notes?: string;
  /** local calendar date as `YYYY-MM-DD`; null means the task is undated */
  dueDate: string | null;
  completed: boolean;
  /** ISO timestamp of completion, or null while incomplete */
  completedAt: string | null;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp, restamped on every mutation */
  updatedAt: string;
}

/** Which due-date group a task falls into. */
export type DueBucket = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'someday';

/** Fields a caller may supply when creating a task. */
export interface NewTaskInput {
  title: string;
  notes?: string;
  dueDate?: string | null;
}

/** Fields a caller may change on an existing task. */
export type TaskUpdate = Partial<Pick<Task, 'title' | 'notes' | 'dueDate' | 'completed'>>;
