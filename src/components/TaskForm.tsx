import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Task } from '@/types/task';

export interface TaskFormValues {
  title: string;
  notes: string;
  dueDate: string | null;
}

interface TaskFormProps {
  /** When present the form edits this task; otherwise it creates a new one. */
  initialTask?: Task;
  submitLabel?: string;
  onSubmit: (values: TaskFormValues) => void;
  onCancel?: () => void;
  /** Focus the title input on mount (used by the edit screen). */
  autoFocus?: boolean;
}

export function TaskForm({
  initialTask,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus = false,
}: TaskFormProps) {
  const fieldId = useId();
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [notes, setNotes] = useState(initialTask?.notes ?? '');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? '');
  const [error, setError] = useState<string | null>(null);

  // Keep the fields in sync when the edited task resolves or changes.
  useEffect(() => {
    setTitle(initialTask?.title ?? '');
    setNotes(initialTask?.notes ?? '');
    setDueDate(initialTask?.dueDate ?? '');
    setError(null);
  }, [initialTask?.id, initialTask?.title, initialTask?.notes, initialTask?.dueDate]);

  useEffect(() => {
    if (autoFocus) titleRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Give the task a title.');
      titleRef.current?.focus();
      return;
    }
    setError(null);
    onSubmit({ title: trimmed, notes: notes.trim(), dueDate: dueDate ? dueDate : null });

    if (!initialTask) {
      setTitle('');
      setNotes('');
      setDueDate('');
      titleRef.current?.focus();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${fieldId}-title`} className="text-sm font-medium text-slate-700">
            Task
          </label>
          <input
            id={`${fieldId}-title`}
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="What needs doing?"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          />
          {error ? (
            <p id={`${fieldId}-error`} role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={`${fieldId}-notes`} className="text-sm font-medium text-slate-700">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id={`${fieldId}-notes`}
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any detail worth remembering"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${fieldId}-due`} className="text-sm font-medium text-slate-700">
              Due date <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id={`${fieldId}-due`}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 sm:w-44"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            {submitLabel ?? (initialTask ? 'Save changes' : 'Add task')}
          </button>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
