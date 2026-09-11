import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { Task } from '@/types/task';
import { formatAbsoluteDue, formatRelativeDue, getDueBucket } from '@/lib/dates';

interface TaskItemProps {
  task: Task;
  today: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Colour + text-cue styling per urgency. Colour is never the only signal. */
function duePillClasses(bucket: string, completed: boolean): string {
  if (completed) return 'bg-slate-100 text-slate-500 border-slate-200';
  if (bucket === 'overdue') return 'bg-red-50 text-red-700 border-red-200';
  if (bucket === 'today') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export function TaskItem({ task, today, onToggle, onDelete }: TaskItemProps) {
  const [confirming, setConfirming] = useState(false);
  const bucket = getDueBucket(task, today);

  const dueLabel = task.dueDate
    ? task.completed
      ? `Was due ${formatAbsoluteDue(task.dueDate, today)}`
      : formatRelativeDue(task.dueDate, today)
    : null;

  const cue = task.completed ? '✓' : bucket === 'overdue' ? '!' : bucket === 'today' ? '★' : '•';

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 sm:p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          aria-label={
            task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`
          }
          className="mt-1 size-5 shrink-0 cursor-pointer rounded border-slate-300 accent-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        />

        <div className="min-w-0 flex-1">
          <p
            className={`break-words text-[15px] font-medium ${
              task.completed ? 'text-slate-400 line-through' : 'text-slate-900'
            }`}
          >
            {task.title}
          </p>

          {task.notes ? (
            <p className="mt-1 break-words text-sm text-slate-500">{task.notes}</p>
          ) : null}

          {dueLabel ? (
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${duePillClasses(
                bucket,
                task.completed,
              )}`}
            >
              <span aria-hidden="true">{cue}</span>
              {dueLabel}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/task/$taskId"
            params={{ taskId: task.id }}
            aria-label={`Edit "${task.title}"`}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Edit
          </Link>
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Delete "${task.title}"`}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      {confirming ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-2 text-sm text-red-800">
          <span className="mr-auto">Delete this task?</span>
          <button
            type="button"
            autoFocus
            onClick={() => onDelete(task.id)}
            className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          >
            Yes, delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          >
            Keep it
          </button>
        </div>
      ) : null}
    </li>
  );
}
