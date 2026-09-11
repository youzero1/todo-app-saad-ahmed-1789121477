---
status: pending
title: Personal Todo App with Due Dates and Reminders
---

## Scope

Single-user, offline-first todo app. Tasks are created, edited, completed, and deleted locally, persisted to `localStorage`, and organised primarily by due date with clear overdue / due-today / upcoming signalling plus optional browser notifications. No accounts, no backend, no tags, no subtasks, no priorities, no stats, no multiple lists.

## Phase 1 — Foundations

1. Verify/scaffold the base app files: `index.html`, `src/main.tsx`, `vite.config.ts`, `tsconfig.json`, `package.json`. Confirm the Vite config registers the TanStack Router plugin and the Tailwind Vite plugin, and that `tsconfig.json` maps the `@/` alias to `src/`. Expected outcome: `npm run dev` boots an empty app with no console errors.
2. Create `src/styles/global.css` containing only the Tailwind import as its first line, and import it exactly once from `src/main.tsx`. Expected outcome: a Tailwind utility class applied anywhere visibly takes effect.
3. Create `src/routes/__root.tsx` as the app shell: page background, centred max-width container, an app header with the title and a slot for the reminder summary badge, and the child route outlet. Expected outcome: shell renders on every route; `src/routeTree.gen.ts` is generated automatically and is never hand-edited.

## Phase 2 — Data model and persistence

4. Create `src/types/task.ts` defining the `Task` shape: `id` (string, crypto-random), `title` (string, required, trimmed), `notes` (optional short string), `dueDate` (ISO date string `YYYY-MM-DD`, nullable so undated tasks are allowed), `completed` (boolean), `completedAt` (nullable ISO timestamp), `createdAt` (ISO timestamp), `updatedAt` (ISO timestamp). Also export a `DueBucket` union: `overdue | today | tomorrow | upcoming | someday`. Expected outcome: one shared source of truth for task typing; no `any` anywhere downstream.
5. Create `src/lib/storage.ts` handling the `localStorage` read/write layer under a single versioned key (e.g. `todo.v1`). It must: parse defensively inside try/catch, validate that the parsed value is an array of objects with the required fields, drop malformed entries rather than throwing, return an empty array on any failure, and write with a debounce or on-change-effect so rapid edits do not thrash storage. Expected outcome: corrupt or absent storage yields an empty list instead of a white screen.
6. Create `src/hooks/useTasks.ts` as the single state owner. It exposes `tasks`, `isLoaded`, and actions `addTask`, `updateTask`, `toggleComplete`, `deleteTask`. It hydrates from storage inside an effect on mount (so first paint is deterministic and SSR-safe), sets `isLoaded` true after hydration, and persists on every mutation. All mutations stamp `updatedAt`. Expected outcome: reloading the browser restores the exact task list.

## Phase 3 — Date and reminder logic

7. Create `src/lib/dates.ts` with pure, unit-testable helpers: `todayKey()` returning the local `YYYY-MM-DD`; `parseDateKey()`; `diffInDays(dateKey)` computed on local calendar-day boundaries rather than raw millisecond subtraction, so DST shifts and late-evening edits do not mis-bucket a task; `getDueBucket(task)` returning the `DueBucket` for a task (completed tasks never report as overdue); and `formatRelativeDue(dateKey)` producing "Overdue by 2 days", "Due today", "Due tomorrow", "In 4 days", or a short absolute date beyond a week. Expected outcome: a task dated yesterday reads as overdue, one dated today reads as due today, and the labels update after midnight.
8. Add a day-rollover mechanism in `src/hooks/useToday.ts`: hold today's date key in state and schedule a timeout for the next local midnight, re-running on fire. Expected outcome: an app left open overnight re-buckets "today" into "overdue" without a manual refresh.
9. Create `src/lib/reminders.ts` deriving reminder counts (overdue count, due-today count) from the task list, and wrapping optional browser notifications: a `requestPermission` helper, a guard that checks `"Notification" in window` and that permission is `granted`, and a fire-once-per-task-per-day dedupe key kept in `localStorage`. Every path must no-op silently when notifications are unsupported or denied. Expected outcome: the in-app badge always works; notifications are strictly additive.

## Phase 4 — Components

10. Create `src/components/TaskForm.tsx`: controlled inputs for title (required), optional notes, and an optional native date input for the due date, with a submit button and inline validation for empty titles. Reused for both create and edit by accepting an optional initial task. Expected outcome: submitting adds or updates a task and resets or closes the form.
11. Create `src/components/TaskItem.tsx`: a completion checkbox, the title with strikethrough when complete, the relative due label rendered as a colour-coded pill (red for overdue, amber for today, neutral otherwise) with a non-colour cue such as an icon or the text itself for accessibility, plus edit and delete controls. Delete asks for confirmation inline rather than via `window.confirm`. Expected outcome: each row communicates urgency at a glance.
12. Create `src/components/TaskGroup.tsx`: a labelled section rendering a heading, a count, and its list of `TaskItem`s. Expected outcome: reusable grouping wrapper with consistent spacing.
13. Create `src/components/ReminderBanner.tsx`: shown in the shell header when there is at least one overdue or due-today task, summarising the counts and offering the "Enable notifications" action only when permission is still `default`. Expected outcome: banner disappears entirely when nothing is due.
14. Create `src/components/EmptyState.tsx` and a lightweight skeleton/placeholder for the pre-hydration state. Expected outcome: no layout flash between mount and hydration.

## Phase 5 — Screens and wiring

15. Create `src/routes/index.tsx` as the main list screen: consumes `useTasks` and `useToday`, renders `TaskForm` at the top, then groups in fixed order — Overdue, Today, Tomorrow, Upcoming, Someday (no due date), Completed (collapsed, most recently completed first). Within each group sort by due date ascending then `createdAt`. Hide empty groups. Show `EmptyState` when there are zero tasks and the skeleton while `isLoaded` is false. Expected outcome: the single primary screen fully drives the app.
16. Create `src/routes/task.$taskId.tsx` as an edit screen reusing `TaskForm`, with a back link to `/` and a redirect to `/` when the id does not resolve. Expected outcome: deep-linking to a deleted task fails gracefully.
17. Wire `ReminderBanner` into `src/routes/__root.tsx` using the derived counts from `src/lib/reminders.ts`. Expected outcome: reminder state is visible from any route.

## Phase 6 — Polish and verification

18. Accessibility and interaction pass: label every input, give the checkbox an accessible name including the task title, ensure focus returns sensibly after add/delete, support Enter-to-submit in the form, and confirm all interactive elements are keyboard reachable with visible focus rings.
19. Responsive pass: verify the layout at narrow mobile widths and on desktop — form stacks on small screens, task rows never overflow, long titles wrap.
20. Manual verification checklist: add a task with no date, one dated yesterday, one today, one next week; confirm bucketing and labels; toggle complete and confirm the overdue styling clears; edit a due date and confirm the task moves group; delete and confirm removal; hard-reload and confirm everything persists; manually corrupt the storage key and confirm the app still loads empty rather than crashing.
