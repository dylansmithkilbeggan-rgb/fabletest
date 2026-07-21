-- Faithfull Stickers — locked-down security rules.
-- Run this in the Supabase SQL editor AFTER schema.sql. It replaces the
-- open prototype policies with rules that only let the admin account
-- (identified by email) read orders or change stock.
--
-- IMPORTANT — two more steps in the dashboard to complete the setup:
--   1. Authentication -> Users -> Add user:
--      email dylansmithkilbeggan@gmail.com, a strong password,
--      and tick "Auto Confirm User".
--   2. Authentication -> Sign In / Providers: turn OFF
--      "Allow new users to sign up".
--
-- If the admin email ever changes, update it in the three places below
-- and re-run this file.

-- Remove the prototype policies
drop policy if exists "prototype read products" on public.products;
drop policy if exists "prototype write products" on public.products;
drop policy if exists "prototype read sections" on public.sections;
drop policy if exists "prototype write sections" on public.sections;
drop policy if exists "prototype insert orders" on public.orders;
drop policy if exists "prototype read orders" on public.orders;
drop policy if exists "prototype update orders" on public.orders;

-- Also drop these in case this file is re-run
drop policy if exists "anyone can read products" on public.products;
drop policy if exists "admin manages products" on public.products;
drop policy if exists "anyone can read sections" on public.sections;
drop policy if exists "admin manages sections" on public.sections;
drop policy if exists "anyone can place an order" on public.orders;
drop policy if exists "admin reads orders" on public.orders;
drop policy if exists "admin updates orders" on public.orders;
drop policy if exists "admin deletes orders" on public.orders;

-- PRODUCTS: the whole world can browse the shop; only the logged-in
-- admin can add, edit or remove stock.
create policy "anyone can read products" on public.products
  for select using (true);

create policy "admin manages products" on public.products
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'dylansmithkilbeggan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'dylansmithkilbeggan@gmail.com');

-- SECTIONS: same idea — the world can see the shop's collections, only the
-- admin can create, rename or remove them.
create policy "anyone can read sections" on public.sections
  for select using (true);

create policy "admin manages sections" on public.sections
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'dylansmithkilbeggan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'dylansmithkilbeggan@gmail.com');

-- ORDERS: anyone can place one (that's checkout), but only the admin can
-- see them, change their status, or delete them.
create policy "anyone can place an order" on public.orders
  for insert to anon, authenticated with check (true);

create policy "admin reads orders" on public.orders
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'dylansmithkilbeggan@gmail.com');

create policy "admin updates orders" on public.orders
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'dylansmithkilbeggan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'dylansmithkilbeggan@gmail.com');

create policy "admin deletes orders" on public.orders
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'dylansmithkilbeggan@gmail.com');
