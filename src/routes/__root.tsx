import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

// The app shell: header + centred container appear on every route.
// <Outlet /> is where the matched page renders.
function RootLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <Link to="/" className="text-2xl font-semibold tracking-tight">
              Todo
            </Link>
          </div>
          {/* Reminder summary badge slot — filled by ReminderBanner in Phase 5 */}
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-lg">This page does not exist.</p>
      <Link to="/" className="text-sm underline underline-offset-4">
        Go to the home page
      </Link>
    </div>
  );
}
