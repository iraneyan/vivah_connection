/*
# Vivah Connect — Initial Marketplace Schema

## Purpose
Foundation schema for a wedding & event services marketplace with three
roles (customer, vendor, admin) sharing one database.

## 1. New Tables
- `profiles` — extends auth.users with role, name, phone, avatar.
- `categories` — service categories.
- `vendors` — vendor business listings; approval-gated.
- `vendor_packages` — tiered pricing packages per vendor.
- `events` — a customer's planned event.
- `event_tasks` — checklist items for an event.
- `bookings` — a customer's booking request to a vendor.
- `reviews` — customer review + rating.
- `messages` — customer <-> vendor conversation.
- `notifications` — in-app notification inbox per user.
- `banners` — admin-managed promotional banners.

## 2. Security (RLS)
Sign-in app: owner-scoped tables use `TO authenticated` with `auth.uid()`.
Public-browse tables (categories, approved vendors, packages, reviews, banners)
use `TO anon, authenticated`. Admin actions gated by `public.is_admin()`.

## 3. Notes
- `profiles.id` references `auth.users.id`.
- `vendors.rating` / `vendors.review_count` maintained by trigger on reviews.
- Owner columns default to `auth.uid()`.
*/

-- ===== TABLES FIRST (no policies yet) =====

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','vendor','admin')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  icon text,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  business_name text not null,
  slug text unique,
  tagline text,
  description text,
  logo_url text,
  cover_url text,
  gallery text[] default '{}',
  city text,
  service_areas text[] default '{}',
  contact_phone text,
  contact_email text,
  website text,
  pricing_from numeric(12,2) default 0,
  rating numeric(2,1) not null default 0,
  review_count int not null default 0,
  is_verified boolean not null default false,
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_packages (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) not null default 0,
  duration text,
  includes text[] default '{}',
  is_popular boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null,
  event_type text not null check (event_type in ('wedding','engagement','reception','birthday','corporate','other')),
  event_date date,
  city text,
  venue text,
  budget numeric(12,2) default 0,
  guest_count int default 0,
  notes text,
  cover_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  category text,
  due_date date,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  package_id uuid references public.vendor_packages(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  event_date date,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled','rejected','rescheduled')),
  package_title text,
  amount numeric(12,2) default 0,
  deposit numeric(12,2) default 0,
  quoted_amount numeric(12,2),
  customer_notes text,
  vendor_notes text,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','deposit_paid','paid','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  photos text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb default '{}',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  link_url text,
  position text not null default 'home' check (position in ('home','category','detail')),
  is_active boolean not null default true,
  sort_order int not null default 0,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===== HELPER FUNCTIONS (tables now exist) =====

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.update_vendor_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vendors set
    review_count = (select count(*) from public.reviews where vendor_id = coalesce(new.vendor_id, old.vendor_id)),
    rating = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where vendor_id = coalesce(new.vendor_id, old.vendor_id)), 0)
  where id = coalesce(new.vendor_id, old.vendor_id);
  return null;
end;
$$;

-- ===== ENABLE RLS =====
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_packages enable row level security;
alter table public.events enable row level security;
alter table public.event_tasks enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.banners enable row level security;

-- ===== INDEXES =====
create index if not exists vendors_category_idx on public.vendors(category_id);
create index if not exists vendors_approved_idx on public.vendors(is_approved);
create index if not exists vendors_city_idx on public.vendors(city);
create index if not exists vendors_owner_idx on public.vendors(owner_id);
create index if not exists vendor_packages_vendor_idx on public.vendor_packages(vendor_id);
create index if not exists events_customer_idx on public.events(customer_id);
create index if not exists event_tasks_event_idx on public.event_tasks(event_id);
create index if not exists bookings_customer_idx on public.bookings(customer_id);
create index if not exists bookings_vendor_idx on public.bookings(vendor_id);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists reviews_vendor_idx on public.reviews(vendor_id);
create index if not exists reviews_customer_idx on public.reviews(customer_id);
create index if not exists messages_booking_idx on public.messages(booking_id);
create index if not exists notifications_user_idx on public.notifications(user_id);

-- ===== POLICIES =====

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id or public.is_admin());

-- categories
drop policy if exists "categories_read_public" on public.categories;
create policy "categories_read_public" on public.categories
  for select to anon, authenticated using (true);
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- vendors
drop policy if exists "vendors_select" on public.vendors;
create policy "vendors_select" on public.vendors
  for select to anon, authenticated
  using (is_approved = true or owner_id = auth.uid() or public.is_admin());
drop policy if exists "vendors_insert_own" on public.vendors;
create policy "vendors_insert_own" on public.vendors
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "vendors_update_own_or_admin" on public.vendors;
create policy "vendors_update_own_or_admin" on public.vendors
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
drop policy if exists "vendors_delete_own" on public.vendors;
create policy "vendors_delete_own" on public.vendors
  for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

-- vendor_packages
drop policy if exists "packages_select" on public.vendor_packages;
create policy "packages_select" on public.vendor_packages
  for select to anon, authenticated
  using (
    exists (select 1 from public.vendors v where v.id = vendor_id and (v.is_approved or v.owner_id = auth.uid() or public.is_admin()))
  );
drop policy if exists "packages_owner_write" on public.vendor_packages;
create policy "packages_owner_write" on public.vendor_packages
  for all to authenticated
  using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid()));

-- events
drop policy if exists "events_owner_all" on public.events;
create policy "events_owner_all" on public.events
  for all to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- event_tasks
drop policy if exists "tasks_owner_all" on public.event_tasks;
create policy "tasks_owner_all" on public.event_tasks
  for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.customer_id = auth.uid()))
  with check (exists (select 1 from public.events e where e.id = event_id and e.customer_id = auth.uid()));

-- bookings
drop policy if exists "bookings_select_parties" on public.bookings;
create policy "bookings_select_parties" on public.bookings
  for select to authenticated
  using (
    customer_id = auth.uid()
    or exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "bookings_insert_customer" on public.bookings;
create policy "bookings_insert_customer" on public.bookings
  for insert to authenticated with check (customer_id = auth.uid());
drop policy if exists "bookings_update_parties" on public.bookings;
create policy "bookings_update_parties" on public.bookings
  for update to authenticated
  using (
    customer_id = auth.uid()
    or exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    customer_id = auth.uid()
    or exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists "bookings_delete_customer" on public.bookings;
create policy "bookings_delete_customer" on public.bookings
  for delete to authenticated using (customer_id = auth.uid() or public.is_admin());

-- reviews
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public" on public.reviews
  for select to anon, authenticated using (true);
drop policy if exists "reviews_insert_customer" on public.reviews;
create policy "reviews_insert_customer" on public.reviews
  for insert to authenticated with check (customer_id = auth.uid());
drop policy if exists "reviews_update_customer" on public.reviews;
create policy "reviews_update_customer" on public.reviews
  for update to authenticated using (customer_id = auth.uid()) with check (customer_id = auth.uid());
drop policy if exists "reviews_delete_customer" on public.reviews;
create policy "reviews_delete_customer" on public.reviews
  for delete to authenticated using (customer_id = auth.uid() or public.is_admin());

drop trigger if exists trg_vendor_rating on public.reviews;
create trigger trg_vendor_rating
  after insert or delete on public.reviews
  for each row execute function public.update_vendor_rating();

-- messages
drop policy if exists "messages_select_parties" on public.messages;
create policy "messages_select_parties" on public.messages
  for select to authenticated
  using (
    sender_id = auth.uid()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id and (b.customer_id = auth.uid()
        or exists (select 1 from public.vendors v where v.id = b.vendor_id and v.owner_id = auth.uid()))
    )
  );
drop policy if exists "messages_insert_party" on public.messages;
create policy "messages_insert_party" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and (b.customer_id = auth.uid()
        or exists (select 1 from public.vendors v where v.id = b.vendor_id and v.owner_id = auth.uid()))
    )
  );

-- notifications
drop policy if exists "notifications_owner_all" on public.notifications;
create policy "notifications_owner_all" on public.notifications
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- banners
drop policy if exists "banners_read_public" on public.banners;
create policy "banners_read_public" on public.banners
  for select to anon, authenticated using (is_active = true);
drop policy if exists "banners_admin_all" on public.banners;
create policy "banners_admin_all" on public.banners
  for all to authenticated using (public.is_admin()) with check (public.is_admin());