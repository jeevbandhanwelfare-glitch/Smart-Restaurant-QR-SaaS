# Smart Restaurant QR Menu

Guest QR ordering and live restaurant operations for diners, kitchen staff, waiters, and administrators.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/smart-restaurant-qr` — customer menu and role-based operations UI
- `artifacts/api-server/src/routes/restaurant.ts` — menu, order, waiter-call, and summary API
- `supabase/schema.sql` — Supabase schema, trigger, RLS policies, realtime publication, and seed data
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- The root route is always the customer menu; table context comes from `?table=` and defaults to Demo Mode table 1.
- Public signup is customer-only; staff roles are assigned by an admin.
- The API keeps a small in-memory preview store so the app is usable before Supabase credentials are configured; production persistence is defined in `supabase/schema.sql`.

## Product

Guests browse a categorized menu, customize items, place orders, track progress, and call for waiter service. Kitchen staff manage ticket status, waiters claim and resolve table calls, and admins oversee menu, tables, staff, and orders.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
