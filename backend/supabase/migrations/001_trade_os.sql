-- FastLedger Trade Operating System schema.
-- Run in Supabase SQL Editor as a project owner.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  company_name text,
  country text default 'Ecuador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = case
        when excluded.full_name <> '' then excluded.full_name
        else public.profiles.full_name
      end,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  direction text not null check (direction in ('import', 'export')),
  status text not null default 'draft'
    check (status in ('draft','analysis','planned','in_transit','customs','delivered','cancelled')),
  product text not null,
  origin_country text not null,
  destination_country text not null default 'Ecuador',
  quantity numeric,
  quantity_unit text,
  fob_value numeric,
  currency char(3) not null default 'USD',
  incoterm text,
  notes text,
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  estimated_total numeric,
  estimated_days integer,
  analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operations_user_created_idx
  on public.operations(user_id, created_at desc);

create table if not exists public.ai_consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid references public.operations(id) on delete cascade,
  request text not null,
  response jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_consultations_user_created_idx
  on public.ai_consultations(user_id, created_at desc);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  document_type text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 char(64) not null,
  storage_path text,
  status text not null default 'hashed'
    check (status in ('pending','hashed','verified','rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists documents_operation_hash_idx
  on public.documents(operation_id, sha256);
create index if not exists documents_user_created_idx
  on public.documents(user_id, created_at desc);

create table if not exists public.operation_events (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  location text,
  event_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists operation_events_operation_idx
  on public.operation_events(operation_id, event_at desc);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country text not null,
  city text,
  categories text[] not null default '{}',
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  risk_score integer not null default 50 check (risk_score between 0 and 100),
  verified boolean not null default false,
  certifications text[] not null default '{}',
  minimum_order text,
  lead_time_days integer,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.operations enable row level security;
alter table public.ai_consultations enable row level security;
alter table public.documents enable row level security;
alter table public.operation_events enable row level security;
alter table public.suppliers enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "operations_select_own" on public.operations;
create policy "operations_select_own" on public.operations
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "operations_insert_own" on public.operations;
create policy "operations_insert_own" on public.operations
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "operations_update_own" on public.operations;
create policy "operations_update_own" on public.operations
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "operations_delete_own" on public.operations;
create policy "operations_delete_own" on public.operations
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "consultations_select_own" on public.ai_consultations;
create policy "consultations_select_own" on public.ai_consultations
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "consultations_insert_own" on public.ai_consultations;
create policy "consultations_insert_own" on public.ai_consultations
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own" on public.documents
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "events_select_own" on public.operation_events;
create policy "events_select_own" on public.operation_events
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "events_insert_own" on public.operation_events;
create policy "events_insert_own" on public.operation_events
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "suppliers_public_read" on public.suppliers;
create policy "suppliers_public_read" on public.suppliers
  for select to anon, authenticated using (verified = true);

grant usage on schema public to anon, authenticated;
grant select on public.suppliers to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.operations to authenticated;
grant select, insert on public.ai_consultations to authenticated;
grant select, insert, update on public.documents to authenticated;
grant select, insert on public.operation_events to authenticated;

insert into public.suppliers
  (name, country, city, categories, rating, risk_score, verified,
   certifications, minimum_order, lead_time_days)
values
  ('SkyVision Robotics', 'China', 'Shenzhen', array['technology','drones'],
   4.8, 22, true, array['ISO 9001','OEM'], '100 units', 18),
  ('Anatolia Steel Works', 'Turquia', 'Izmir', array['industrial','steel'],
   4.7, 28, true, array['EN 10025','SGS'], '5 tons', 24),
  ('Verde Brasil Foods', 'Brasil', 'Sao Paulo', array['food','coffee'],
   4.9, 16, true, array['HACCP','Organic'], '1 pallet', 12),
  ('Jaipur Textile Collective', 'India', 'Jaipur', array['textile'],
   4.6, 39, true, array['GOTS','OEKO-TEX'], '500 units', 21),
  ('Northstar Components', 'Estados Unidos', 'Miami',
   array['technology','electronics'], 4.8, 14, true,
   array['RoHS','UL'], '50 units', 7)
on conflict (name) do update set
  rating = excluded.rating,
  risk_score = excluded.risk_score,
  verified = excluded.verified,
  certifications = excluded.certifications,
  updated_at = now();
