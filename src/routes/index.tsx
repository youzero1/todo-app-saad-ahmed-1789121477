import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import type { DueBucket, Task } from '@/types/task';
import { getDueBucket } from '@/lib/dates';
import { useToday } from '@/hooks/useToday';
import { TaskForm } from '@/components/TaskForm';
import { TaskGroup } from '@/components/TaskGroup';
import { EmptyState, TaskListSkeleton } from '@/components/EmptyState';
import { useTaskStore } from '@/components/TasksProvider';

export const Route = createFileRoute('/')({
  component: HomePage,
});

/** Due date ascending (undated last), then oldest-created first. */
function byDueThenCreated(a: Task, b: Task): number {
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

function HomePage() {
  const today = useToday();
  const { tasks, isLoaded, addTask, toggleComplete, deleteTask } = useTaskStore();

  const { buckets, completed } = useMemo(() => {
    const grouped: Record<DueBucket, Task[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      upcoming: [],
      someday: [],
    };
    const done: Task[] = [];

    for (const task of tasks) {
      if (task.completed) done.push(task);
      else grouped[getDueBucket(task, today)].push(task);
    }

    for (const key of Object.keys(grouped) as DueBucket[]) {
      grouped[key].sort(byDueThenCreated);
    }
    // Most recently completed first.
    done.sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt));

    return { buckets: grouped, completed: done };
  }, [tasks, today]);

  return (
    <div className="flex flex-col gap-8">
      <TaskForm onSubmit={(values) => addTask(values)} />

      {!isLoaded ? (
        <TaskListSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-8">
          <TaskGroup
            title="Overdue"
            tone="danger"
            tasks={buckets.overdue}
            today={today}
            onToggle={toggleComplete}
            onDelete={deleteTask}
          />
          <TaskGroup
            title="Today"
            tone="warning"
            tasks={buckets.today}
            today={today}
            onToggle={toggleComplete}
            onDelete={deleteTask}
          />
          <TaskGroup
            title="Tomorrow"
            tasks={buckets.tomorrow}
            today={today}
            onToggle={toggleComplete}
            onDelete={deleteTask}
          />
          <TaskGroup
            title="Upcoming"
            tasks={buckets.upcoming}
            today={today}
            onToggle={toggleComplete}
            onDelete={deleteTask}
          />
          <TaskGroup
            title="No date"
            tasks={buckets.someday}
            today={today}
            onToggle={toggleComplete}
            onDelete={deleteTask}
          />
          <TaskGroup
            title="Completed"
            tasks={completed}
            today={today}
            onToggle={toggleComplete}
            onDelete={deleteTask}
            collapsible
          />
        </div>
      )}
    </div>
  );
}
