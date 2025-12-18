# Copilot instructions for TH_insights

This project is a small two-folder monorepo: a TypeScript Express backend (`backend/`) and a TypeScript React frontend (`frontend/`). Keep suggestions specific, actionable, and limited to discoverable patterns in the code.

- **Big picture:** `backend/src/server.ts` is the single Express app. It connects to Postgres via `pg` (see `backend/src/db.ts`) and exposes endpoints used by the frontend: `POST /auth/login`, `GET /dashboard/cards`, `POST /dashboard/cards/:id/data`, and admin endpoints used by the admin UI (`/admin/cards`). The frontend fetches these endpoints (see `frontend/src/api.ts` and pages under `frontend/src/pages`).

- **Environment & run-time:** Backend uses env vars: `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. The DB `Pool` is configured with `ssl: { rejectUnauthorized: false }` (see `backend/src/db.ts` and `backend/src/server.ts`). The backend `package.json` scripts of interest: `npm run dev` (runs `ts-node src/server.ts`), `npm run build` (`tsc`), and `npm start` (`node dist/server.js`). Frontend expects a Vite-style env var `VITE_API_URL` (see `frontend/src/api.ts`) and the backend CORS origin is set to `http://localhost:5173` in `backend/src/server.ts` (update this when changing frontend dev port).

- **Auth & tokens:** Authentication uses JWT signed with `process.env.JWT_SECRET`. Middleware is in `backend/src/middleware.ts` (function `auth`) — it expects an `Authorization: Bearer <token>` header. The frontend stores the token in `localStorage` and the axios `api` instance attaches it automatically (see `frontend/src/api.ts`).

- **Data flow & important pattern:** Dashboard cards are stored in the DB with an `sql_query` field and executed directly in `server.ts` (`SELECT sql_query FROM dashboard_cards WHERE id = $1` then `pool.query(sql)`). When changing or adding card types be aware that card SQL is executed server-side as-is.

- **Where to edit:**
  - Add backend HTTP behaviour: `backend/src/server.ts` (or add new route files but keep consistent with existing pattern).
  - Shared DB access: use `backend/src/db.ts`'s `Pool` pattern.
  - Auth helpers: `backend/src/auth.ts`, `backend/src/middleware.ts`.
  - Frontend API usage: `frontend/src/api.ts`, pages in `frontend/src/pages` and components like `frontend/src/DashboardCard.tsx`.

- **Conventions & patterns to follow:**
  - Use the existing JWT shape `{ id, role }` and 8h expiry when issuing tokens (`auth.signToken`).
  - Frontend expects `token` in `localStorage` and uses `Authorization: Bearer <token>`; preserve that for compatibility.
  - Keep CORS origin aligned with frontend dev port (`http://localhost:5173`).

- **Testing / debugging tips (discoverable from code):**
  - To run backend quickly in dev: `cd backend && npm install && npm run dev` (uses `ts-node`).
  - If `JWT_SECRET` is missing the backend will throw on startup (see `server.ts`).
  - Health endpoint: `GET /health` returns `{ status: "ok" }`.

- **Security notes for contributors (factual):**
  - Card `sql_query` values are executed directly; reviewers should validate SQL and limit who can create/edit cards.

If anything here is unclear or you'd like the instructions to include examples (curl, typical env files, or a brief frontend run command), tell me which area to expand and I'll iterate. 

- **CI:** The repository includes `.github/workflows/ci.yml` which runs `scripts/validate-env.js` to ensure `.env.example` files include required keys and builds the backend TypeScript.

- **Whitelabel / multi-tenant scaffold:**
  - Tenant configs live in `backend/config/tenants.json` mapping hostnames to tenant metadata (see example entries `default` and `acme.local`).
  - Middleware `backend/src/tenant.ts` resolves a tenant by `Host` header and attaches it to requests as `req.tenant`.
  - The backend exposes `GET /tenant/config` which returns tenant metadata for the current host. The frontend can call this at startup to load branding (see `frontend/src/tenant.ts`).
