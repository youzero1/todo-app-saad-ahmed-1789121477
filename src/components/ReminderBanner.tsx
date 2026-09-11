import { useEffect, useState } from 'react';
import {
  getNotificationPermission,
  getReminderCounts,
  notifyDueTasks,
  requestPermission,
} from '@/lib/reminders';
import type { NotificationPermissionState } from '@/lib/reminders';
import { useToday } from '@/hooks/useToday';
import { useTaskStore } from '@/components/TasksProvider';

export function ReminderBanner() {
  const today = useToday();
  const { tasks, isLoaded } = useTaskStore();
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getNotificationPermission(),
  );

  const counts = getReminderCounts(tasks, today);

  // Fire the once-per-task-per-day notifications when granted. No-ops otherwise.
  useEffect(() => {
    if (!isLoaded || permission !== 'granted') return;
    notifyDueTasks(tasks, today);
  }, [isLoaded, permission, tasks, today]);

  if (!isLoaded || counts.total === 0) return null;

  const parts: string[] = [];
  if (counts.overdue > 0) {
    parts.push(`${counts.overdue} overdue`);
  }
  if (counts.dueToday > 0) {
    parts.push(`${counts.dueToday} due today`);
  }

  const urgent = counts.overdue > 0;

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
        urgent
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {urgent ? '!' : '★'}
      </span>
      <span className="mr-auto font-medium">
        You have {parts.join(' and ')}
        {counts.total === 1 ? ' task.' : ' tasks.'}
      </span>

      {permission === 'default' ? (
        <button
          type="button"
          onClick={async () => setPermission(await requestPermission())}
          className={`rounded-lg border bg-white px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            urgent
              ? 'border-red-300 text-red-800 hover:bg-red-100 focus-visible:ring-red-600'
              : 'border-amber-300 text-amber-900 hover:bg-amber-100 focus-visible:ring-amber-600'
          }`}
        >
          Enable notifications
        </button>
      ) : null}
    </div>
  );
}
