# task-management-react-frontend

React + Vite + Tailwind CSS frontend for the Task Management & Analytics Platform. Consumes both `task-management-laravel-api` and `task-management-node-services`.

Part of the [task-management](https://github.com/ronizzle/task-management) umbrella project. See that repo's `plan.md` for the full spec.

## Requirements

- Node.js 20+
- `task-management-laravel-api` and `task-management-node-services` both running

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` if your backends aren't on the default ports:
- `VITE_LARAVEL_API_URL` (default `http://localhost:8000/api`)
- `VITE_NODE_API_URL` (default `http://localhost:3000/api`)

```bash
npm run dev
```

Runs on **5173** (Vite default).

## Test credentials

| Email | Password | Role |
|---|---|---|
| `admin@test.com` | `password123` | Admin |
| `manager@test.com` | `password123` | Manager |
| `member@test.com` | `password123` | Team Member |

(Seeded by the Laravel repo's `php artisan migrate --seed`.)

## Auth

`AuthContext` (Context API) holds the current user and JWT, both persisted to `localStorage`. The shared Axios instances (`src/api/client.js`) attach `Authorization: Bearer <token>` to every request, show a toast on any error response, and on a `401` clear the session and redirect to `/login`.

There are two Axios instances — `laravel` and `node` — pointed at each backend, sharing the same interceptor behavior.

## Role-based UI

- **Team Member**: sees only their own assigned tasks; nav hides Teams, Users, and Analytics; `ProtectedRoute` also blocks direct navigation to those URLs.
- **Manager**: full Teams/Tasks/Analytics access scoped to their own team by the backend; can create `team_member` users only.
- **Admin**: everything.

Team Members have no `GET /api/teams` access (Admin/Manager only per the API spec), so the frontend discovers "my teams" via `GET /api/users/{id}` instead, which the Laravel API enriches with team memberships when a user views their own record (see `useAccessibleTeams` hook).

## Pages

- **Dashboard** — accessible teams, task counts
- **Tasks** — team-scoped list with status/priority filters, create (Admin/Manager), CSV/JSON/XLSX export, live updates (bonus — task create/update/status-change/delete/archive within the viewed team refreshes the list via Socket.IO, no manual reload), batch operations (bonus — multi-select checkboxes, bulk status change/delete for any role, bulk assign for Admin/Manager, backed by `POST /api/tasks/batch`; partial failures — e.g. a Team Member selecting a task not assigned to them — surface as a toast with the succeeded/failed counts rather than blocking the whole batch), saved filter presets (bonus — save the current team/status/priority combination under a name, reapply it from a dropdown, delete it; backed by `/api/filter-presets`, scoped to the current user)
- **Task Detail** — view/edit, status transitions (respecting the pending→in_progress→completed state machine), delete (creator/Admin), comment thread (bonus — view/post per task-access rules, delete own comment or Admin), live updates (bonus — task edits/status changes and new/deleted comments from other users appear via Socket.IO without a refresh)
- **Teams** — list, create, view/add/remove members (Admin/Manager)
- **Users** — list, create, change role, toggle active status (Admin only)
- **Analytics** — task summary, team productivity, upcoming deadlines, powered by the Node service (Admin/Manager only)
- **Settings** — current account info

## Notes vs. the original spec

- **Export button**: the spec describes an "Export Tasks" button on the Dashboard that opens a modal with CSV/JSON/Excel options. This build puts three per-format export buttons directly on the Tasks List page instead (see "Pages" above) — same formats, same `POST /api/export/tasks`, just placed where the filtered task set a user wants to export is already in view, and simplified from a modal to direct buttons.
- **Register page**: not one of the spec's named pages (Dashboard, Tasks List, Task Detail, Teams, Users, Analytics, Settings), but added so the required `POST /api/register` endpoint is reachable from the UI. Always creates a `team_member` — no role field is exposed or accepted.

## Real-time updates (Socket.IO, bonus)

`src/lib/socket.js` maintains one shared, JWT-authenticated Socket.IO connection (reused across pages, reconnected fresh on login/logout with the current token). Task Detail joins that task's room on mount and leaves it on unmount; Tasks List joins the currently-viewed team's room and re-fetches the list on any task event in it. See `task-management-node-services`' README for the room/event design.

## Tests

Automated end-to-end coverage via Playwright (`e2e/`, Chromium): login (valid/invalid, role-based nav), task CRUD with status transitions and comments, team/user management, batch task operations, and saved filter presets — run against a real, locally running Laravel + Node stack, no mocking.

```bash
npx playwright install chromium   # once
npm run e2e                       # headless
npm run e2e:ui                    # interactive UI mode
```

Requires the Laravel API and Node service already running locally (Playwright only manages the React dev server itself). A `setup` project logs in as each seeded role once via the real UI and reuses that session (`e2e/.auth/*.json`) across every spec — Laravel's `/login` is throttled to 5 req/min, and logging in per test would blow through that immediately. For the same reason, running the full suite and `scripts/smoke-test.sh` back-to-back can trip Laravel's general 60-req/min API throttle too (shared across the one seeded admin session both use) — that's the rate limiter working as designed, not a suite bug; space repeated full runs out by ~60–90s.

This suite is what caught a real bug, since fixed: `TaskDetail.jsx` could render a freshly-posted comment twice, because Laravel's Socket.IO broadcast for a new comment could reach the browser before the POST's own HTTP response did, and the REST-response handler appended it unconditionally instead of deduping like the socket handler already did.

## Deployment

Live on Render: **https://task-management-react-frontend-spyn.onrender.com**

- Render, because it offers a free tier for Static Sites — no cost for this assessment.
- Render Static Site. Build `npm install && npm run build`, publish directory `dist`.
- `VITE_LARAVEL_API_URL` / `VITE_NODE_API_URL` are Vite build-time env vars pointing at the production Laravel/Node URLs above — set in Render's dashboard, baked into the build output.
- Confirmed working against production: login for all three seeded roles, dashboard, task CRUD/status transitions, teams/users management, analytics, and CSV/JSON export.
