Whitelabeling scaffold

This repo includes a minimal scaffold to support whitelabel deployments:

- Tenant configs: `backend/config/tenants.json` maps hostnames to tenant metadata (example entries: `default`, `acme.local`).
- Middleware: `backend/src/tenant.ts` resolves the tenant from the request `Host` header and attaches it as `req.tenant`.
- Endpoint: `GET /tenant/config` returns the current tenant metadata (used by the frontend to load branding).
- Frontend helper: `frontend/src/tenant.ts` contains `fetchTenant()` which calls `/tenant/config`.

How to add a tenant

1. Add a key in `backend/config/tenants.json` with the hostname your tenant will use.
2. Provide metadata: `id`, `name`, `themeColor`, `logoUrl`, optional `dbOverride`.
3. If you want DB per-tenant, extend `tenant.ts` and `backend/src/server.ts` to use `dbOverride` to create or select a pool per-tenant.

Notes & next steps

- Current middleware resolves tenant from the exact Host header. For subdomain-based mapping (e.g., `acme.example.com`), update `tenant.ts` to parse and map subdomain.
- Consider storing tenant metadata in the database and adding an admin UI to manage tenants.

