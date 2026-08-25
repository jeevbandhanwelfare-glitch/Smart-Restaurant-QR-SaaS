# Smart Restaurant QR Menu

Smart Restaurant QR Menu is a mobile-first guest ordering experience with live kitchen tickets, waiter service calls, and role-based operations screens.

## Supabase setup

1. Create a Supabase project.
2. Copy the contents of `supabase/schema.sql` into the Supabase SQL Editor and run it.
3. Add the project URL and anon key to the app environment as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It is required for the admin “Add Staff” flow and must never be prefixed with `NEXT_PUBLIC_`.

The schema seeds twelve QR table records and starter menu content. The public menu is readable without an account, and guests can place orders and request service without signing in.

## First admin account

Public signup always creates a customer. To create the first administrator:

1. Sign up once through `/login`.
2. Find that user’s UUID in Supabase Authentication.
3. Run this one-time SQL update:

```sql
update public.profiles
set role = 'admin'
where id = '<your-user-id>';
```

## Run locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/smart-restaurant-qr run dev
```

The root route is the customer menu. Add `?table=5` to simulate a QR scan; without it the app uses table 1 in Demo Mode.

## Deploy to Vercel

Deploy the web artifact from the repository root and add:

- `NEXT_PUBLIC_SUPABASE_URL` — public Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — server-only Supabase service role key

Run the schema in Supabase before deploying. Staff routes are `/kitchen`, `/waiter`, and `/admin`; `/login` is shared by all roles.