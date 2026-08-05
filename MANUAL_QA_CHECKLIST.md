# Manual QA Checklist — React Frontend

Manual test checklist scoped to this app's pages and UI-facing bonus features. A full cross-service checklist (Laravel + Node backend checks included) lives in the umbrella `task-management` repo as `MANUAL_QA_CHECKLIST.md`.

## Environment

| Service | URL |
|---|---|
| This app | https://task-management-react-frontend-spyn.onrender.com |
| Laravel API | https://task-management-laravel-api-jryf.onrender.com/api |
| Node API | https://task-management-node-services-u5bj.onrender.com/api |

**Credentials** (seeded, all `password123`): `admin@test.com` · `manager@test.com` · `member@test.com`

**Note:** free-tier Render spins down when idle — first load and first API calls can take 30–60s. Load the app once and let it wake before timed steps.

---

## Auth & login

- [ ] Load the app, confirm it lands on login when unauthenticated
- [ ] Log in as `admin@test.com` — dashboard loads, Admin-only nav shows (Users, Analytics, etc.)
- [ ] Log out, log in as `manager@test.com` — nav differs from Admin, no user management
- [ ] Log out, log in as `member@test.com` — nav is most restricted, no Analytics/Users/Teams admin
- [ ] Wrong password shows a clear error, not a blank screen
- [ ] Refresh while logged in — session persists (JWT), no bounce to login
- [ ] Navigate to a protected URL while logged out — redirects to login, doesn't render then error

## Dashboard, Tasks List, Task Detail

Seeded tasks: Setup database, Write API docs, Fix login bug, Design dashboard. Seeded teams: Engineering (4), Marketing (3), Sales (2).

- [ ] Tasks List renders tasks with status/priority/assignee/due date
- [ ] Create a task with title, description, priority, assignee, due date
- [ ] Filter by status, then priority, then assignee
- [ ] Open Task Detail, edit fields, save
- [ ] Move a `pending` task to `in_progress`, then to `completed` — UI reflects each transition immediately
- [ ] Attempt an invalid transition (e.g. reopen a `completed` task) — blocked in UI or shows the API's 422 error
- [ ] As Team Member, only tasks assigned to you are visible/editable, and delete/assign controls are absent
- [ ] Delete a task as creator/Admin; the delete control is absent for others

## Teams & Users pages

- [ ] Teams: view Engineering and confirm 4 members show; create a team; add/remove a member
- [ ] Users (Admin): full paginated list, role/status filters, create/edit/deactivate a user
- [ ] As Manager, Users only lets you create `team_member` accounts
- [ ] As Team Member, Users/Teams admin UI is hidden and not reachable by direct URL

## Analytics page

- [ ] As Admin, task summary, team productivity, and upcoming deadlines widgets render for a chosen team
- [ ] Changing the date range updates the figures
- [ ] As Manager, only your own team's data shows, no picker for other teams
- [ ] As Team Member, Analytics isn't visible/reachable

## Settings / export

- [ ] Export tasks as CSV/JSON/XLSX from the UI and confirm the download matches what's on screen
- [ ] Export with an active filter applied — the export respects it

## General frontend health

- [ ] Every page (Dashboard, Tasks List, Task Detail, Teams, Users, Analytics, Settings) loads without a 404, blank screen, or unhandled error toast, per role
- [ ] A failed request (e.g. rate-limit hit) shows a toast/error state, not a silent failure
- [ ] Loading states show on slow requests (Render cold start is a natural test)
- [ ] Logging out clears cached role-gated UI and redirects to login
- [ ] Narrow/mobile width doesn't break Tasks List or Task Detail layout

---

## Bonus features (frontend)

### Task comments

- [ ] Post a comment on a task's detail page
- [ ] A second logged-in user with task access sees the comment
- [ ] Delete a comment as its author
- [ ] The delete control is absent for a non-author, non-admin viewing someone else's comment
- [ ] As Team Member, comments are only postable on tasks assigned to you

### Socket.io real-time updates

- [ ] Open the same task in two windows/profiles (two logged-in users); change status in one — the other updates live, no refresh
- [ ] Post a comment in one window — appears live in the other
- [ ] Open the same team's Tasks List in both windows, create a task in one — the other re-fetches/updates
- [ ] Log out in one window — it stops receiving live updates

### Batch task operations

- [ ] Multi-select tasks via checkboxes on Tasks List — a bulk action bar appears
- [ ] Bulk status-change and bulk delete a selection — success toast shows the count
- [ ] As Admin/Manager, bulk-assign is available; as Team Member, it is not offered
- [ ] A selection with a mix of eligible/ineligible tasks shows a partial-success toast (succeeded/failed counts), not an all-or-nothing failure

### Saved filter presets

- [ ] Set team/status/priority filters, "Save current filters" with a name
- [ ] Clear filters, reload — the saved preset appears in the "Saved filters" dropdown
- [ ] Applying the preset snaps all filter fields back in one click
- [ ] Delete the preset — it disappears from the dropdown
- [ ] A different logged-in user doesn't see your saved presets

### API rate limiting (frontend behavior)

- [ ] Submit the login form with a wrong password 6 times in under a minute — the UI shows a readable rate-limit message on the 6th, not a generic error
- [ ] After ~60s, login works normally again
