-- Faithfull Stickers — run this once in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run).

-- Shop catalog. `image` holds a data URL for the prototype; when images get
-- big, move them to a Supabase Storage bucket and store the public URL here.
create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric not null,
  size text,
  tag text,
  image text,
  created_at timestamptz not null default now()
);

-- Orders. shipping/items/totals are stored as JSON exactly as the app
-- builds them, so the admin page can render them without any mapping.
create table if not exists public.orders (
  id text primary key,
  placed_at timestamptz not null default now(),
  status text not null default 'new',
  shipping jsonb not null,
  items jsonb not null,
  totals jsonb not null
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- ============================================================
-- PROTOTYPE POLICIES — open access with the anon key.
--
-- !! Before taking real customer orders, replace these with
-- !! auth-based policies. As written, anyone with your site's
-- !! public key can read orders (customer names + addresses)
-- !! and edit products. Fine for testing, not for launch.
-- ============================================================

create policy "prototype read products" on public.products
  for select using (true);
create policy "prototype write products" on public.products
  for all using (true) with check (true);

create policy "prototype insert orders" on public.orders
  for insert with check (true);
create policy "prototype read orders" on public.orders
  for select using (true);
create policy "prototype update orders" on public.orders
  for update using (true) with check (true);
