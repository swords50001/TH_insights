# TH_insights — run & dev notes

Short instructions to run the two parts of this monorepo (backend and frontend).

Backend (Express + TypeScript)

1. Copy example env and fill values:

```bash
cd backend
cp .env.example .env
# edit .env and set JWT_SECRET and DB_* values
```

2. Install and run in dev (uses `ts-node`):

```bash
npm install
npm run dev
```

3. Build for production:

```bash
npm run build
npm start
```

Frontend (Vite + React)

1. Copy example env:

```bash
cd frontend
cp .env.example .env
# edit VITE_API_URL if backend runs on different host/port
```

2. Install and run dev server (default Vite port 5173):

```bash
npm install
npm run dev
```

Notes
- Backend expects these env vars: `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (see `backend/.env.example`).
- Frontend expects `VITE_API_URL` (see `frontend/.env.example`).
- Health check: `GET /health` on backend returns `{ status: "ok" }`.
