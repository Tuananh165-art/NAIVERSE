-- NaiVerse MVP schema. Apply this file in Supabase SQL Editor or with the Supabase CLI.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 100),
  locale text not null default 'vi' check (locale in ('vi','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.platform_admins a where a.user_id = (select auth.uid()));
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  description text not null default '',
  website text,
  is_demo boolean not null default false,
  is_public boolean not null default false,
  status text not null default 'pending' check (status in ('pending','verified','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','editor','agent','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create or replace function public.is_organization_member(target uuid, allowed_roles text[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target
      and m.user_id = (select auth.uid())
      and (allowed_roles is null or m.role = any(allowed_roles))
  );
$$;

create table if not exists public.places (
  id text primary key check (id ~ '^[a-z0-9-]{2,80}$'),
  name text not null,
  name_en text not null,
  aliases text[] not null default '{}',
  region text not null,
  region_en text not null,
  category text not null check (category in ('nature','culture','family','food','stay','experience')),
  description text not null,
  description_en text not null,
  status text not null default 'needs_confirmation' check (status in ('reference','needs_confirmation','paused_reference')),
  status_note text not null,
  status_note_en text not null,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  website text,
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  is_group boolean not null default false,
  published boolean not null default true,
  demo_label text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null)),
  check (status <> 'reference' or jsonb_array_length(evidence) > 0)
);

create index if not exists places_region_idx on public.places (region);
create index if not exists places_category_idx on public.places (category);
create index if not exists places_aliases_idx on public.places using gin (aliases);
create index if not exists places_search_idx on public.places using gin (
  -- The regconfig overload is immutable; the text-config overload is only stable.
  to_tsvector('simple'::regconfig, name || ' ' || name_en || ' ' || region || ' ' || region_en)
);

create table if not exists public.price_references (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places(id) on delete cascade,
  item_label text not null check (char_length(item_label) <= 140),
  audience text not null default 'all',
  amount_vnd bigint check (amount_vnd is null or amount_vnd between 0 and 500000000),
  status text not null check (status in ('verified','historical','conflicting','unknown')),
  currency text not null default 'VND' check (currency = 'VND'),
  valid_from date,
  valid_to date,
  source_url text,
  source_label text not null,
  checked_at timestamptz,
  terms text not null default '',
  demo_label text,
  approved boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (status <> 'verified' or (amount_vnd is not null and source_url is not null and checked_at is not null))
);
create index if not exists price_references_place_idx on public.price_references (place_id, checked_at desc);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 90),
  locale text not null default 'vi' check (locale in ('vi','en')),
  trip_intent jsonb not null default '{}'::jsonb check (jsonb_typeof(trip_intent) = 'object'),
  plan_data jsonb not null default '{}'::jsonb check (jsonb_typeof(plan_data) = 'object'),
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trips_owner_idx on public.trips (user_id, updated_at desc);

create table if not exists public.trip_shares (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists trip_shares_expiry_idx on public.trip_shares (expires_at);

create or replace function public.get_public_shared_trip(requested_token_hash text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'title', t.title,
    'locale', t.locale,
    'trip_intent', t.trip_intent,
    'plan_data', t.plan_data,
    'is_demo', t.is_demo,
    'expires_at', s.expires_at
  )
  from public.trip_shares s
  join public.trips t on t.id = s.trip_id
  where s.token_hash = requested_token_hash
    and s.expires_at > now()
  limit 1;
$$;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  customer_id uuid not null references auth.users(id) on delete cascade,
  contact_name text not null check (char_length(contact_name) between 2 and 100),
  contact_email text not null check (char_length(contact_email) <= 254),
  message text not null default '' check (char_length(message) <= 1400),
  trip_snapshot jsonb not null check (jsonb_typeof(trip_snapshot) = 'object'),
  consented_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','in_review','quoted','closed','cancelled')),
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inquiries_owner_idx on public.inquiries (customer_id, created_at desc);
create index if not exists inquiries_org_idx on public.inquiries (organization_id, status, created_at desc);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  author_id uuid not null references auth.users(id) on delete restrict,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 30),
  currency text not null default 'VND' check (currency = 'VND'),
  terms text not null default '' check (char_length(terms) <= 1600),
  status text not null default 'draft' check (status in ('draft','shared','withdrawn')),
  valid_until date,
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quotes_inquiry_idx on public.quotes (inquiry_id, created_at desc);

create table if not exists public.place_reports (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('hours','price','access','safety','location','copyright','other')),
  message text not null check (char_length(message) between 10 and 1600),
  evidence_url text check (evidence_url is null or length(evidence_url) <= 2048),
  status text not null default 'pending_review' check (status in ('pending_review','investigating','resolved','dismissed')),
  moderator_note text not null default '',
  decided_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null check (feature in ('trip_plan','guide','quote_draft','price_compare')),
  model_name text not null,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  outcome text not null check (outcome in ('success','error','limited')),
  created_at timestamptz not null default now()
);

create or replace function public.owns_trip(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.trips t where t.id = target and t.user_id = (select auth.uid()));
$$;

-- Seed one conspicuously named demo inbox so the customer-to-business workflow can run.
insert into public.organizations (id, name, slug, description, is_demo, is_public, status)
values ('00000000-0000-4000-8000-000000000001', 'NaiVerse Demo Travel Desk', 'naiverse-demo-desk', 'Synthetic demo organization. No real travel operator or partnership is represented.', true, true, 'verified')
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.places enable row level security;
alter table public.price_references enable row level security;
alter table public.trips enable row level security;
alter table public.trip_shares enable row level security;
alter table public.inquiries enable row level security;
alter table public.quotes enable row level security;
alter table public.place_reports enable row level security;
alter table public.ai_usage enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_platform_admin());
drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "profiles own edit" on public.profiles;
create policy "profiles own edit" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists "platform admins read" on public.platform_admins;
create policy "platform admins read" on public.platform_admins for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "public places read" on public.places;
create policy "public places read" on public.places for select to anon, authenticated using (published or public.is_platform_admin());
drop policy if exists "admins edit places" on public.places;
create policy "admins edit places" on public.places for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
drop policy if exists "public approved prices read" on public.price_references;
create policy "public approved prices read" on public.price_references for select to anon, authenticated using (approved or public.is_platform_admin());
drop policy if exists "admins edit prices" on public.price_references;
create policy "admins edit prices" on public.price_references for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists "public organizations read" on public.organizations;
create policy "public organizations read" on public.organizations for select to anon, authenticated using ((is_public and status = 'verified') or public.is_organization_member(id) or public.is_platform_admin());
drop policy if exists "admins manage organizations" on public.organizations;
create policy "admins manage organizations" on public.organizations for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
drop policy if exists "members list team" on public.organization_members;
create policy "members list team" on public.organization_members for select to authenticated using (user_id = (select auth.uid()) or public.is_organization_member(organization_id, array['owner','manager']) or public.is_platform_admin());
drop policy if exists "admins manage team" on public.organization_members;
create policy "admins manage team" on public.organization_members for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
drop policy if exists "owners manage team" on public.organization_members;
-- Membership roles are provisioned by a platform administrator. Organization users
-- cannot promote themselves or another member through direct table access.

drop policy if exists "owners manage trips" on public.trips;
create policy "owners manage trips" on public.trips for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "owners manage trip shares" on public.trip_shares;
create policy "owners manage trip shares" on public.trip_shares for all to authenticated using (public.owns_trip(trip_id)) with check (public.owns_trip(trip_id));
drop policy if exists "customers create inquiries" on public.inquiries;
create policy "customers create inquiries" on public.inquiries for insert to authenticated with check (
  customer_id = (select auth.uid()) and public.owns_trip(trip_id) and exists(select 1 from public.organizations o where o.id = organization_id and o.status = 'verified' and o.is_public)
);
drop policy if exists "customers read own inquiries" on public.inquiries;
create policy "customers read own inquiries" on public.inquiries for select to authenticated using (customer_id = (select auth.uid()) or public.is_organization_member(organization_id) or public.is_platform_admin());
drop policy if exists "organization staff update inquiries" on public.inquiries;
create policy "organization staff update inquiries" on public.inquiries for update to authenticated using (public.is_organization_member(organization_id, array['owner','manager','agent']) or public.is_platform_admin()) with check (public.is_organization_member(organization_id, array['owner','manager','agent']) or public.is_platform_admin());
drop policy if exists "staff create quotes" on public.quotes;
create policy "staff create quotes" on public.quotes for insert to authenticated with check (
  author_id = (select auth.uid()) and public.is_organization_member(organization_id, array['owner','manager','agent']) and exists(select 1 from public.inquiries i where i.id = inquiry_id and i.organization_id = quotes.organization_id)
);
drop policy if exists "staff edit quotes" on public.quotes;
create policy "staff edit quotes" on public.quotes for update to authenticated using (public.is_organization_member(organization_id, array['owner','manager','agent']) or public.is_platform_admin()) with check (public.is_organization_member(organization_id, array['owner','manager','agent']) or public.is_platform_admin());
drop policy if exists "quote parties read" on public.quotes;
create policy "quote parties read" on public.quotes for select to authenticated using (
  public.is_organization_member(organization_id) or public.is_platform_admin() or (status = 'shared' and exists(select 1 from public.inquiries i where i.id = inquiry_id and i.customer_id = (select auth.uid())))
);
drop policy if exists "customers submit place reports" on public.place_reports;
create policy "customers submit place reports" on public.place_reports for insert to authenticated with check (reporter_id = (select auth.uid()));
drop policy if exists "reporters view own reports" on public.place_reports;
create policy "reporters view own reports" on public.place_reports for select to authenticated using (reporter_id = (select auth.uid()) or public.is_platform_admin());
drop policy if exists "admins moderate reports" on public.place_reports;
create policy "admins moderate reports" on public.place_reports for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
drop policy if exists "users read own ai metrics" on public.ai_usage;
create policy "users read own ai metrics" on public.ai_usage for select to authenticated using (user_id = (select auth.uid()) or public.is_platform_admin());
drop policy if exists "server inserts ai metrics" on public.ai_usage;
create policy "server inserts ai metrics" on public.ai_usage for insert to authenticated with check (user_id = (select auth.uid()));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at before update on public.places for each row execute function public.set_updated_at();
drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at before update on public.trips for each row execute function public.set_updated_at();
drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at before update on public.inquiries for each row execute function public.set_updated_at();
drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at before update on public.quotes for each row execute function public.set_updated_at();
drop trigger if exists reports_set_updated_at on public.place_reports;
create trigger reports_set_updated_at before update on public.place_reports for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100), ''),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'vi' end
  ) on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function public.create_profile_for_auth_user();

-- RLS decides which rows are visible; SQL grants also decide which operations
-- the API roles can attempt. Keep all sensitive writes behind authenticated RLS.
grant select on public.places, public.price_references, public.organizations to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.platform_admins, public.organization_members to authenticated;
grant select, insert, update, delete on public.places, public.price_references, public.organizations, public.organization_members to authenticated;
grant select, insert, update, delete on public.trips, public.trip_shares to authenticated;
grant select, insert on public.inquiries to authenticated;
grant update (status) on public.inquiries to authenticated;
grant select, insert on public.quotes to authenticated;
grant update (status) on public.quotes to authenticated;
grant select, insert, update on public.place_reports to authenticated;
grant select, insert on public.ai_usage to authenticated;

revoke all on function public.get_public_shared_trip(text) from public;
grant execute on function public.get_public_shared_trip(text) to anon, authenticated;
revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to anon, authenticated;
revoke all on function public.is_organization_member(uuid,text[]) from public;
grant execute on function public.is_organization_member(uuid,text[]) to anon, authenticated;
revoke all on function public.owns_trip(uuid) from public;
grant execute on function public.owns_trip(uuid) to authenticated;
revoke all on function public.create_profile_for_auth_user() from public;

drop policy if exists "owners manage trip shares" on public.trip_shares;
create policy "owners manage trip shares" on public.trip_shares for all to authenticated
  using (public.owns_trip(trip_id))
  with check (public.owns_trip(trip_id) and expires_at > now() and expires_at <= now() + interval '7 days 1 minute');
