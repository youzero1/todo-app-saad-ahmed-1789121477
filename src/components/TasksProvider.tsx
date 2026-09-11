import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTasks } from '@/hooks/useTasks';
import type { UseTasksResult } from '@/hooks/useTasks';

const TasksContext = createContext<UseTasksResult | null>(null);

/**
 * Owns the single `useTasks` instance for the whole app so the header
 * (reminder banner) and the routes below it always read the same list.
 */
export function TasksProvider({ children }: { children: ReactNode }) {
  const value = useTasks();
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTaskStore(): UseTasksResult {
  const value = useContext(TasksContext);
  if (!value) throw new Error('useTaskStore must be used inside <TasksProvider>');
  return value;
}
