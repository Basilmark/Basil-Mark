-- =====================================================================
-- Basil Mark — database setup
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Admins: only users listed here can change products, categories and
-- settings. Everyone else (site visitors) can only read.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Categories (Belts, Wallets, Cufflinks ... add as many as you like)
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Products
-- `attributes` is reserved for future use (sizes, colours, variants).
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  category_id      uuid references public.categories(id) on delete set null,
  price            numeric(12,2) not null default 0,
  compare_at_price numeric(12,2),
  description      text,
  images           text[] not null default '{}',
  is_featured      boolean not null default false,
  is_active        boolean not null default true,
  in_stock         boolean not null default true,
  sort_order       int not null default 0,
  attributes       jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Settings (WhatsApp number, social links, about text ...)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Access rules (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.admins     enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.settings   enable row level security;

grant select on public.categories, public.products, public.settings to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.settings to authenticated;
grant select on public.admins to authenticated;

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories
  for select using (is_active or public.is_admin());

drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (is_active or public.is_admin());

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings
  for select using (true);

drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Photo storage
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product images admin insert" on storage.objects;
create policy "product images admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images admin update" on storage.objects;
create policy "product images admin update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images admin delete" on storage.objects;
create policy "product images admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------
-- Starting data
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, description, sort_order) values
  ('Belts',     'belts',     'Leather belts for the office, the weekend and everything between.', 1),
  ('Wallets',   'wallets',   'Slim wallets and card holders that sit flat in a pocket.',          2),
  ('Cufflinks', 'cufflinks', 'The finishing touch for a formal shirt.',                            3)
on conflict (slug) do nothing;

insert into public.settings (key, value) values
  ('store_name',      'Basil Mark'),
  ('tagline',         'Belts, wallets and cufflinks for men who notice the details.'),
  ('about_text',      'Basil Mark started with a simple idea: the small things a man carries every day should be made well and last for years.

We choose every belt, wallet and pair of cufflinks for its material, finish and feel in the hand, and we keep the range small so each piece earns its place.'),
  ('currency',        'Rs.'),
  ('whatsapp_number', ''),
  ('instagram_url',   ''),
  ('facebook_url',    ''),
  ('email',           ''),
  ('phone',           ''),
  ('city',            '')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- LAST STEP — make yourself an admin.
-- 1. Authentication > Users > Add user > Create new user
--    (enter your email + a password, tick "Auto Confirm User").
-- 2. Replace the email below with that email and run just this line:
--
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;
-- ---------------------------------------------------------------------
