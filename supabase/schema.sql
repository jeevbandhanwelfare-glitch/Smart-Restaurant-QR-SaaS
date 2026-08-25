-- Smart Restaurant QR Menu & Operations SaaS
-- Run this file in the Supabase SQL editor before connecting the app.

create type public.user_role as enum ('admin', 'kitchen', 'waiter', 'customer');
create type public.order_status as enum ('placed', 'preparing', 'ready', 'served', 'completed', 'cancelled');
create type public.call_type as enum ('waiter', 'water', 'bill');
create type public.call_status as enum ('pending', 'claimed', 'resolved');
create type public.waiter_status as enum ('free', 'busy', 'offline');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null unique,
  qr_slug text not null unique
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  is_veg boolean not null default true,
  is_available boolean not null default true,
  emoji text not null default '•'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null,
  customer_id uuid references public.profiles(id),
  status public.order_status not null default 'placed',
  estimated_minutes integer not null default 20,
  accepted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_name text not null,
  item_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  special_instructions text not null default '',
  is_veg boolean not null default true
);

create table public.waiter_calls (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null,
  type public.call_type not null,
  status public.call_status not null default 'pending',
  claimed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  resolved_at timestamptz
);

create table public.waiters (
  id uuid primary key references public.profiles(id) on delete cascade,
  status public.waiter_status not null default 'offline',
  updated_at timestamptz not null default now()
);

-- New signups are always customers. Admin promotes staff manually.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'customer');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.waiter_calls enable row level security;
alter table public.waiters enable row level security;

-- Public menu reads are intentional; only admins may write menu and table data.
create policy "Anyone can read menu categories" on public.menu_categories for select using (true);
create policy "Anyone can read available menu items" on public.menu_items for select using (is_available or public.current_role() = 'admin');
create policy "Admins manage menu categories" on public.menu_categories for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "Admins manage menu items" on public.menu_items for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "Anyone can read restaurant tables" on public.restaurant_tables for select using (true);
create policy "Admins manage restaurant tables" on public.restaurant_tables for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- Guests can place orders and calls without signing in. Staff can see operational data.
create policy "Guests and staff can create orders" on public.orders for insert with check (true);
create policy "Guests can see orders and staff can manage them" on public.orders for select using (true);
create policy "Kitchen and admins update order status" on public.orders for update using (public.current_role() in ('kitchen', 'admin')) with check (public.current_role() in ('kitchen', 'admin'));
create policy "Guests can create order items" on public.order_items for insert with check (true);
create policy "Guests and staff can read order items" on public.order_items for select using (true);
create policy "Guests can call service" on public.waiter_calls for insert with check (true);
create policy "Guests and staff can read calls" on public.waiter_calls for select using (true);
create policy "Waiters and admins update calls" on public.waiter_calls for update using (public.current_role() in ('waiter', 'admin')) with check (public.current_role() in ('waiter', 'admin'));
create policy "Users can read own profile" on public.profiles for select using (id = auth.uid() or public.current_role() = 'admin');
create policy "Admins manage profiles" on public.profiles for update using (public.current_role() = 'admin');
create policy "Waiters manage own status" on public.waiters for all using (id = auth.uid() or public.current_role() = 'admin') with check (id = auth.uid() or public.current_role() = 'admin');

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.waiter_calls;
alter publication supabase_realtime add table public.waiters;

insert into public.restaurant_tables (table_number, qr_slug)
select n, 'table-' || n from generate_series(1, 12) n
on conflict (table_number) do nothing;

insert into public.menu_categories (name, sort_order)
values ('To begin', 1), ('From the tandoor', 2), ('Mains', 3), ('Breads & rice', 4), ('Sweet finish', 5)
on conflict do nothing;

insert into public.menu_items (category_id, name, description, price, is_veg, emoji)
select id, 'Charred corn ribs', 'Smoky lime butter, toasted cumin', 9.5, true, '✦' from public.menu_categories where name = 'To begin'
union all select id, 'Paneer tikka', 'Tandoor-charred paneer, mint chutney', 12, true, '◆' from public.menu_categories where name = 'To begin'
union all select id, 'Butter chicken', 'Tomato, fenugreek, cultured cream', 18, false, '●' from public.menu_categories where name = 'Mains'
union all select id, 'Dal makhani', 'Slow-cooked black lentils, smoked butter', 14, true, '◈' from public.menu_categories where name = 'Mains'
union all select id, 'Garlic naan', 'Clay oven, garlic, coriander', 5, true, '≈' from public.menu_categories where name = 'Breads & rice'
union all select id, 'Mango kulfi', 'Saffron, pistachio, rose', 7, true, '◇' from public.menu_categories where name = 'Sweet finish';
