export function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <p className="text-base font-medium text-slate-700">Nothing on your list yet</p>
      <p className="mt-1 text-sm text-slate-500">
        Add your first task above. Give it a due date and it will show up under Today, Tomorrow, or
        Upcoming.
      </p>
    </div>
  );
}

/** Placeholder shown before localStorage hydration, sized like real rows. */
export function TaskListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="h-[70px] rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-4 w-1/2 rounded bg-slate-200" />
        <div className="mt-3 h-3 w-24 rounded bg-slate-100" />
      </div>
      <div className="h-[70px] rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-4 w-2/3 rounded bg-slate-200" />
        <div className="mt-3 h-3 w-20 rounded bg-slate-100" />
      </div>
    </div>
  );
}
