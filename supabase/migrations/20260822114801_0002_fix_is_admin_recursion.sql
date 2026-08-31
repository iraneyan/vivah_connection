/*
# Fix is_admin recursion and harden handle_new_user

## Problem
The `is_admin()` function is SECURITY DEFINER and queries `public.profiles`.
During auth token grant, Supabase evaluates RLS policies on `profiles`, which
call `is_admin()`, which queries `profiles` again — creating a recursive
loop that surfaces as "Database error querying schema" (HTTP 500).

## Fix
1. Use CREATE OR REPLACE to change `is_admin()` to SECURITY INVOKER without
   dropping it (avoids cascade-dropping all dependent policies).
2. Recreate `handle_new_user` with the same ON CONFLICT guard.
*/

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
