import { useEffect } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { TaskForm } from '@/components/TaskForm';
import { useTaskStore } from '@/components/TasksProvider';

export const Route = createFileRoute('/task/$taskId')({
  component: EditTaskPage,
});

function EditTaskPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const { tasks, isLoaded, updateTask } = useTaskStore();

  const task = tasks.find((t) => t.id === taskId);

  // Deep-linking to a deleted/unknown task falls back to the list instead of
  // rendering a broken form. Only after hydration, or we'd bounce on reload.
  useEffect(() => {
    if (isLoaded && !task) navigate({ to: '/', replace: true });
  }, [isLoaded, task, navigate]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/"
        className="w-fit rounded text-sm text-slate-600 underline underline-offset-4 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      >
        ← Back to all tasks
      </Link>

      <h1 className="text-lg font-semibold text-slate-900">Edit task</h1>

      {!isLoaded ? (
        <div className="h-48 rounded-2xl bg-slate-200/60" aria-hidden="true" />
      ) : task ? (
        <TaskForm
          initialTask={task}
          autoFocus
          onSubmit={(values) => {
            updateTask(task.id, {
              title: values.title,
              notes: values.notes,
              dueDate: values.dueDate,
            });
            navigate({ to: '/' });
          }}
          onCancel={() => navigate({ to: '/' })}
        />
      ) : (
        <p className="text-sm text-slate-500">That task no longer exists. Returning to the list…</p>
      )}
    </div>
  );
}
