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
- **Tasks** — team-scoped list with status/priority filters, create (Admin/Manager), CSV/JSON/XLSX export
- **Task Detail** — view/edit, status transitions (respecting the pending→in_progress→completed state machine), delete (creator/Admin)
- **Teams** — list, create, view/add/remove members (Admin/Manager)
- **Users** — list, create, change role, toggle active status (Admin only)
- **Analytics** — task summary, team productivity, upcoming deadlines, powered by the Node service (Admin/Manager only)
- **Settings** — current account info

## Tests

Manually verified end-to-end in a real browser against both running backends (login for all three roles, dashboard data, task CRUD and status transitions, team/user management, analytics, exports, and role-based route/UI gating) — no automated frontend test suite for this repo, per the build plan (PHPUnit covers Laravel, Jest covers Node).

## Deployment

Live on Render: **https://task-management-react-frontend-spyn.onrender.com**

- Render Static Site. Build `npm install && npm run build`, publish directory `dist`.
- `VITE_LARAVEL_API_URL` / `VITE_NODE_API_URL` are Vite build-time env vars pointing at the production Laravel/Node URLs above — set in Render's dashboard, baked into the build output.
- Confirmed working against production: login for all three seeded roles, dashboard, task CRUD/status transitions, teams/users management, analytics, and CSV/JSON export.
