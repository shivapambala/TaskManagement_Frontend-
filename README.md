# TaskFlow Frontend

A Jira-style project management UI built with **React 19**, **Vite** and plain JavaScript. It is the web client for the Spring Boot **TaskManagement1** backend and covers issues, a Kanban board, sprints, reports, team directory and workflow management.

## Features

- **Authentication**: JWT sign in, register, forgot / reset password, and automatic sign-out when the token expires
- **Dashboard**: live stats, progress donut, priority bars and recent activity
- **Issues**: search, filters, sorting, pagination, and a detail drawer with status changes, attachments and comments
- **Kanban board**: drag and drop plus a keyboard-accessible "Move to…" menu, with optimistic updates and rollback on failure
- **Sprints**: create, start, complete, and assign backlog issues
- **Reports**: burndown, sprint completion, workload, flow, velocity and epic progress (all pure SVG, no chart library)
- **Team directory** and **workflow builder** (statuses, transitions and allowed roles)
- **UX details**: light/dark theme, responsive layout, skeleton loaders, toasts, focus-trapped dialogs and a skip link

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `c` | Create a new issue |
| `/` | Focus search |
| `Esc` | Close dialogs and menus |

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19 |
| Routing | React Router 7 (all pages lazy-loaded) |
| Build tool | Vite |
| Linting | ESLint 9 with react, react-hooks and jsx-a11y plugins |
| Styling | Hand-written CSS with design tokens (`src/index.css`) |
| State | React context (auth, toasts) and small custom hooks, no state library |

## Prerequisites

- Node.js 20.19+ (or 22.12+), required by Vite 8
- npm
- The **TaskManagement1** backend running on port `8989` (it needs MySQL)

## Getting started

```bash
# 1. Start the backend first (port 8989, MySQL running)

# 2. Install dependencies
npm install

# 3. (Optional) create a local env file
cp .env.example .env

# 4. Start the dev server
npm run dev
```

The app is served at **http://localhost:5173**.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally (port 4173) |
| `npm run lint` | Run ESLint, zero warnings allowed |
| `npm run lint:fix` | Run ESLint and auto-fix what it can |

## Configuration

Environment variables are read from `.env` (see `.env.example`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_TARGET` | `http://localhost:8989` | Where the Vite dev/preview server proxies `/api` requests |
| `VITE_API_BASE_URL` | *(empty)* | Full API base URL for production builds served from a different origin |

### How API access works

- **Development:** requests to `/api/*` are proxied by Vite to the backend, so the browser sees a same-origin call and **no CORS setup is needed**.
- **Production:** either serve the built files behind a reverse proxy that forwards `/api`, or set `VITE_API_BASE_URL` at build time. In the second case the backend must allow CORS for your frontend origin.

## Project structure

```
taskflow-frontend/
├── index.html
├── vite.config.js          # dev/preview server + /api proxy
├── eslint.config.js
├── .env.example
└── src/
    ├── main.jsx            # providers: ErrorBoundary, Router, Toast, Auth
    ├── App.jsx             # route table (lazy-loaded pages)
    ├── index.css           # global styles and theme tokens
    ├── api/
    │   ├── client.js       # fetch wrapper, token store, ApiError, friendly messages
    │   └── endpoints.js    # one object per backend resource (auth, issues, sprints...)
    ├── context/            # AuthProvider, ToastProvider
    ├── hooks/              # useAuth, useQuery, useIssues, useSprintStore, useTheme...
    ├── components/         # AppLayout, IssueDrawer, IssueFormModal, Charts, Overlay, ui...
    ├── pages/              # Login, Dashboard, Issues, Board, Sprints, Reports, Team, Workflows...
    └── utils/              # constants (enums), jwt, storage, format helpers
```

### Routes

| Path | Page | Access |
| --- | --- | --- |
| `/login`, `/register`, `/forgot-password` | Auth pages | Signed-out users only |
| `/reset-password` | Reset password | Public |
| `/` | Dashboard | Signed in |
| `/issues`, `/board`, `/sprints`, `/reports`, `/team`, `/workflows` | Main app | Signed in |
| `*` | Not found | Public |

## Architecture notes

- **Auth:** the JWT is stored in `localStorage` (`tf.token`) and sent as a `Bearer` header. The payload is decoded client-side (not verified) to show the user's email and role. A `401` always signs the user out; a `403` only does so if the token has actually expired.
- **Data fetching:** a small `useQuery` hook handles loading, error, reload and local updates. Fetchers must be wrapped in `useCallback`.
- **Enum spellings:** values in `src/utils/constants.js` match the backend exactly, including its typos (`IN_RIVIEW`, `CMPLETED`). Do not "fix" them on the frontend.
- **Local storage keys:** `tf.token` (session), `tf.theme` (theme), `tf.sprints` (sprints created in the UI, see below).

## Known backend issues

These were found while building the frontend. The backend was not changed, and the UI works around what it can.

1. **CORS is not configured.** Use the Vite proxy in development and add a `CorsConfigurationSource` for production.
2. **Issue creation:** `IssueService.createIssue` saves with a null `issueKey` (the column is `NOT NULL`). The UI sends a temporary `TMP-<timestamp>` key, which the backend then replaces with `PROJECT-<id>`.
3. **Path-variable name mismatches** make these endpoints fail at runtime:
   - `POST /api/issues/comment/{id}` (expects `issueId`)
   - `GET /api/attachments/issue/{issueId}` (expects `id`)
   - `/api/user_profile_update/{email}` and `/updateUserProfile/{email}` (expect `userOfficialEmail`)
4. **Sprint service bugs:** `assignIssueToSpring` looks the sprint up using `issueId`. `endSprint` compares an enum name to an enum (`!i.getIssueStatus().name().equals(IssueStatus.DONE)`) and sets the *start* date when ending.
5. **JSON recursion risk:** `WorkFlow` ↔ `WorkFlowTransaction` and `Board` ↔ `BoardColumn` are bidirectional without `@JsonIgnore`, so listing workflows may overflow during serialisation.
6. **No "list sprints" endpoint.** Sprints created in the UI are remembered in `localStorage`, and sprint ids seen on issues are merged in. Sprints created elsewhere only appear once an issue references them.
7. **Smaller gaps:** `UserProfileUpdateService.toDTO` omits `userOfficialEmail`, `/forgot_password` does not send an email, and `/logOut` does not blacklist the token (the call is commented out).
8. **Security:** `application.properties` contains a database password, a Cloudinary secret and a Gmail password. Rotate them and move them to environment variables.

## Troubleshooting

- **"Cannot reach the server"**: the backend is not running on port 8989. Start it, or point `VITE_API_TARGET` at the right host.
- **Redirected to login unexpectedly**: your token expired. Sign in again.
- **Sprint list is empty after clearing the browser**: sprints are stored in `localStorage` (`tf.sprints`); see backend issue 6.
- **Comments, attachments or profile updates fail**: see backend issue 3.

## Contributing

1. Create a branch and make your changes.
2. Run `npm run lint`. The project allows **zero warnings**.
3. Run `npm run build` to confirm the production build succeeds.
4. Open a pull request.