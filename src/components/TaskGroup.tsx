import { useId, useState } from 'react';
import type { Task } from '@/types/task';
import { TaskItem } from '@/components/TaskItem';

interface TaskGroupProps {
  title: string;
  tone?: 'danger' | 'warning' | 'neutral';
  tasks: Task[];
  today: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  /** Renders the group as a collapsible section, closed by default. */
  collapsible?: boolean;
}

const toneClasses: Record<'danger' | 'warning' | 'neutral', string> = {
  danger: 'text-red-700',
  warning: 'text-amber-700',
  neutral: 'text-slate-700',
};

export function TaskGroup({
  title,
  tone = 'neutral',
  tasks,
  today,
  onToggle,
  onDelete,
  collapsible = false,
}: TaskGroupProps) {
  const listId = useId();
  const [open, setOpen] = useState(!collapsible);
  if (tasks.length === 0) return null;

  const heading = (
    <span className={`text-sm font-semibold uppercase tracking-wide ${toneClasses[tone]}`}>
      {title}
      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium normal-case tracking-normal text-slate-600">
        {tasks.length}
      </span>
    </span>
  );

  return (
    <section aria-label={`${title} (${tasks.length})`} className="flex flex-col gap-3">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={listId}
          className="flex w-fit items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true" className="text-xs text-slate-400">
            {open ? '▾' : '▸'}
          </span>
          {heading}
        </button>
      ) : (
        <h2>{heading}</h2>
      )}

      {open ? (
        <ul id={listId} className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              today={today}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
