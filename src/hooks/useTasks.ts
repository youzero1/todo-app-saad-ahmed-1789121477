import { useCallback, useEffect, useRef, useState } from 'react';
import type { NewTaskInput, Task, TaskUpdate } from '@/types/task';
import { flushTasks, loadTasks, saveTasks } from '@/lib/storage';
import { isValidDateKey } from '@/lib/dates';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface UseTasksResult {
  tasks: Task[];
  isLoaded: boolean;
  addTask: (input: NewTaskInput) => Task | null;
  updateTask: (id: string, changes: TaskUpdate) => void;
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => void;
}

/**
 * The single owner of task state. Hydrates from localStorage in an effect on
 * mount (so first paint is deterministic) and persists on every mutation.
 */
export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Mirrors `tasks` so the unmount/pagehide flush can read the latest value
  // without re-subscribing on every change.
  const latest = useRef<Task[]>(tasks);
  latest.current = tasks;

  useEffect(() => {
    setTasks(loadTasks());
    setIsLoaded(true);
  }, []);

  // Persist after hydration only — otherwise the initial empty state would
  // overwrite stored tasks before they are read back.
  useEffect(() => {
    if (!isLoaded) return;
    saveTasks(tasks);
  }, [tasks, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const flush = () => flushTasks(latest.current);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [isLoaded]);

  const addTask = useCallback((input: NewTaskInput): Task | null => {
    const title = input.title.trim();
    if (!title) return null;
    const now = new Date().toISOString();
    const notes = input.notes?.trim();
    const task: Task = {
      id: createId(),
      title,
      notes: notes ? notes : undefined,
      dueDate: isValidDateKey(input.dueDate) ? input.dueDate : null,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback((id: string, changes: TaskUpdate) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const now = new Date().toISOString();
        const next: Task = { ...task, updatedAt: now };

        if (changes.title !== undefined) {
          const title = changes.title.trim();
          if (title) next.title = title;
        }
        if (changes.notes !== undefined) {
          const notes = changes.notes?.trim();
          next.notes = notes ? notes : undefined;
        }
        if (changes.dueDate !== undefined) {
          next.dueDate = isValidDateKey(changes.dueDate) ? changes.dueDate : null;
        }
        if (changes.completed !== undefined && changes.completed !== task.completed) {
          next.completed = changes.completed;
          next.completedAt = changes.completed ? now : null;
        }
        return next;
      }),
    );
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const now = new Date().toISOString();
        const completed = !task.completed;
        return {
          ...task,
          completed,
          completedAt: completed ? now : null,
          updatedAt: now,
        };
      }),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  return { tasks, isLoaded, addTask, updateTask, toggleComplete, deleteTask };
}
