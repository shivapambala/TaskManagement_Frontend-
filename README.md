# TaskFlow – React frontend for TaskManagement1

React 19 + Vite + JavaScript + ESLint 9 frontend for the Spring Boot **TaskManagement1** backend.

## Run it

```bash
# 1. start the backend (port 8989) – MySQL must be running
# 2. start the frontend
npm install
npm run dev        # http://localhost:5173
```

`/api/*` is proxied to `http://localhost:8989` (see `vite.config.js`; override with `VITE_API_TARGET`),
so no CORS configuration is needed in development.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `npm run preview` | Production build / local preview |
| `npm run lint` / `npm run lint:fix` | ESLint (react, react-hooks, jsx-a11y), zero warnings allowed |

## Features
- JWT sign in / register / forgot + reset password, auto sign-out on expiry
- Dashboard with live stats, progress donut, priority bars, recent activity
- Issues: search, filters, sorting, pagination, detail drawer (status, attachments, comments)
- Kanban board: drag & drop **and** keyboard-accessible "Move to…" menu, optimistic updates with rollback
- Sprints: create, start, complete, add backlog issues
- Reports: burndown, completion, workload, flow, velocity, epic progress (pure SVG charts)
- Team directory, workflow builder
- Light/dark theme, responsive layout, skeleton loaders, toasts, focus-trapped dialogs,
  skip link, shortcuts (`c` = new issue, `/` = search)

## Backend issues found while building (not changed – the frontend works around what it can)
1. **CORS is not configured** → use the Vite proxy in dev; add a `CorsConfigurationSource` for production.
2. `IssueService.createIssue` saves with a null `issueKey` (column is `NOT NULL`) → the UI sends a temporary
   `TMP-<timestamp>` key which the backend then replaces with `PROJECT-<id>`.
3. Path-variable name mismatches make these endpoints fail at runtime:
   `POST /api/issues/comment/{id}` (`issueId`), `GET /api/attachments/issue/{issueId}` (`id`),
   `/api/user_profile_update/{email}` and `/updateUserProfile/{email}` (`userOfficialEmail`).
4. `SprintService.assignIssueToSpring` looks the sprint up with `issueId`; `endSprint` compares an enum name to an
   enum (`!i.getIssueStatus().name().equals(IssueStatus.DONE)`) and sets the *start* date when ending.
5. `WorkFlow`↔`WorkFlowTransaction` and `Board`↔`BoardColumn` are bidirectional without `@JsonIgnore`, so listing
   workflows may overflow during JSON serialisation.
6. There is no "list sprints" endpoint, so sprints created in the UI are remembered in `localStorage`.
7. `UserProfileUpdateService.toDTO` omits `userOfficialEmail`; `/forgot_password` does not send an email;
   `/logOut` does not blacklist the token (the call is commented out).
8. **Security:** `application.properties` contains a DB password, Cloudinary secret and Gmail password.
   Rotate them and move them to environment variables.
