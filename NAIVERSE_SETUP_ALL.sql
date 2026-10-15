-- NAIVERSE single-run setup bundle. Generated from numbered migrations and the catalog.
-- Use only on a NEW, empty Supabase project. This file has no migration ledger.
-- Do not rerun on a populated or partially migrated database; do not run numbered migrations afterward.
-- Existing database: back up first, determine applied migrations, then apply ONLY missing files in order.
-- Catalog seed uses ON CONFLICT DO NOTHING so existing place rows are preserved.

-- ===== BEGIN 0001_naiverse_core.sql =====
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

-- ===== END 0001_naiverse_core.sql =====

-- ===== BEGIN first-run catalog seed (36 places) =====
insert into public.places
  (id, name, name_en, aliases, region, region_en, category, description, description_en,
   status, status_note, status_note_en, latitude, longitude, website, evidence, is_group, published)
values
  ('amazing-bay', 'The Amazing Bay – Vịnh Kỳ Diệu', 'The Amazing Bay', array['Sơn Tiên', 'Vịnh Kỳ Diệu', 'Amazing Bay']::text[], 'Biên Hòa – Trấn Biên', 'Bien Hoa – Tran Bien', 'family', 'Công viên nước. Điều kiện chiều cao, giờ hoạt động và giá cần xác nhận trực tiếp với đơn vị vận hành.', 'Water park. Confirm height rules, opening hours and prices with the operator.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', 10.87485, 106.87036, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://www.sontien.com/blogs/faq","checkedAt":null},{"label":"FAQ nhà vận hành: dịp lễ 30/4–1/5 thường hoạt động 08:00–21:00; không phải lịch tuần đã xác nhận","labelEn":"Operator FAQ: during the 30/4–1/5 holiday period, hours are typically 08:00–21:00; not a confirmed weekly schedule","url":"https://www.sontien.com/blogs/faq","checkedAt":"2026-10-15"},{"label":"Trang vị trí nhà vận hành nói cổng vào nằm bên phải Quốc lộ 51 theo hướng Ngã ba Vũng Tàu về Long Thành; trang không công bố tọa độ cổng, nên pin OSM vẫn chỉ là đối tượng địa lý","labelEn":"The operator''s location page says the entrance is on the right side of Highway 51 when travelling from Vung Tau Junction toward Long Thanh; it gives no gate coordinates, so the OSM pin remains a venue feature","url":"https://www.theamazingbay.com/gioi-thieu/vi-tri","checkedAt":"2026-10-15"}]'::jsonb, false, true),
  ('son-tien-amazing-world', 'Sơn Tiên Amazing World', 'Son Tien Amazing World', array['Amazing World', 'Sơn Tiên']::text[], 'Biên Hòa – Trấn Biên', 'Bien Hoa – Tran Bien', 'family', 'Trang sản phẩm chính thức có combo Hành Tinh Lạ khung giờ đêm 17:00–21:00; giá và điều kiện theo ngày cần xác nhận trên hệ thống bán vé.', 'The official product page lists a 17:00–21:00 Hanh Tinh La night combo; confirm date-specific price and eligibility on the ticket system.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null},{"label":"Trang sản phẩm chính thức ghi combo Hành Tinh Lạ khung giờ đêm 17:00–21:00, hiển thị 45.000 ₫ vé trẻ em và 90.000 ₫ vé người lớn; trang chưa nêu tiêu chí tuổi/chiều cao cho loại vé trẻ em","labelEn":"Official product page lists the Hanh Tinh La night combo 17:00–21:00 at VND 45,000 for child and VND 90,000 for adult tickets; child eligibility criteria are not stated","url":"https://www.sontien.com/products/tham-quan-amazing-world","checkedAt":"2026-10-15"}]'::jsonb, false, true),
  ('buu-long', 'Khu du lịch Bửu Long', 'Buu Long Tourist Area', array['Bửu Long', 'Hồ Long Ẩn']::text[], 'Biên Hòa – Trấn Biên', 'Bien Hoa – Tran Bien', 'nature', 'Khu hồ, núi và trải nghiệm giải trí. Giờ hoạt động và điều kiện tiếp cận cần xác nhận.', 'Lake, hills and recreational activities. Confirm hours and access.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', 10.9629837, 106.7936911, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null},{"label":"Báo Đồng Nai dẫn Ban Giám đốc công bố giờ 07:00–17:00, nghỉ thứ Ba trừ lễ/Tết ngày 07/08/2026; chưa xác nhận lại","labelEn":"Báo Đồng Nai quoted the venue director on 07:00–17:00 hours, closed Tuesdays except holidays, on 7 Aug 2026; not reconfirmed","url":"https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/","checkedAt":"2026-08-07"},{"label":"UBND phường Trấn Biên công bố giá vé dịp Tết Dương lịch 2026; đây là giá lịch sử, chưa phải giá hiện hành","labelEn":"Tran Bien Ward People''s Committee reports ticket prices for New Year 2026; historical, not a current quote","url":"https://tranbien.dongnai.gov.vn/vi/news/du-lich-am-thuc/khu-du-lich-buu-long-don-tren-2-5-ngan-luot-du-khach-trong-ngay-dau-ky-nghi-tet-duong-lich-2026-433.html","checkedAt":"2026-01-02"},{"label":"Way OSM 972604563 có tag opening_hours=Mo,We-Su 07:00-17:00, Tu off. Đây là dữ liệu cộng đồng, chưa được nhà vận hành xác nhận; way không có node entrance/barrier được gắn trên ranh giới. Không dùng tag này để xác nhận giờ hiện hành hoặc tọa độ cổng.","labelEn":"OSM way 972604563 has opening_hours=Mo,We-Su 07:00-17:00, Tu off. This is community mapping, not operator confirmation; no entrance/barrier node is tagged on the way boundary. Do not treat it as verified current hours or an entrance coordinate.","url":"https://www.openstreetmap.org/way/972604563","checkedAt":"2026-10-15"}]'::jsonb, false, true),
  ('tran-bien-temple-of-literature', 'Văn miếu Trấn Biên', 'Tran Bien Temple of Literature', array['Văn miếu', 'Trấn Biên']::text[], 'Biên Hòa – Trấn Biên', 'Bien Hoa – Tran Bien', 'culture', 'Di tích văn hóa – giáo dục trong danh mục ban đầu. Lịch mở cửa cần xác nhận.', 'Cultural and educational heritage site in the initial catalog. Confirm opening hours.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', 10.9645068, 106.8015941, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, false, true),
  ('ong-pagoda', 'Thất phủ cổ miếu (Chùa Ông)', 'Ong Pagoda (That Phu Ancient Temple)', array['Chùa Ông', 'Thất phủ cổ miếu']::text[], 'Biên Hòa – Trấn Biên', 'Bien Hoa – Tran Bien', 'culture', 'Địa điểm tín ngưỡng; khách cần tuân thủ quy tắc do nơi quản lý thông báo.', 'Religious site. Follow visiting rules posted by the site manager.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', 10.9298894, 106.8258042, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, false, true),
  ('nguyen-huu-canh-temple', 'Đền thờ Nguyễn Hữu Cảnh', 'Nguyen Huu Canh Temple', array['Đền Nguyễn Hữu Cảnh']::text[], 'Biên Hòa – Trấn Biên', 'Bien Hoa – Tran Bien', 'culture', 'Di tích lịch sử trong danh mục nghiên cứu; lịch tham quan cần xác nhận.', 'Historic site in the research catalog; confirm visiting hours.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, false, true),
  ('dong-nai-museum', 'Bảo tàng Đồng Nai', 'Dong Nai Museum', array['Bảo tàng Đồng Nai', 'gốm Biên Hòa']::text[], 'Biên Hòa – Trấn Biên', 'Bien Hoa – Tran Bien', 'culture', 'Nội dung di sản địa phương và nghề gốm cần đối chiếu tư liệu bảo tàng.', 'Local heritage and Bien Hoa pottery content should be checked against museum records.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, false, true),
  ('tan-trieu-orchards', 'Làng bưởi Tân Triều và vườn địa phương', 'Tan Trieu Pomelo Orchards', array['Tân Triều', 'bưởi Tân Triều', 'vườn bưởi']::text[], 'Tân Triều', 'Tan Trieu', 'experience', 'Nhóm trải nghiệm vườn, ẩm thực và sản phẩm địa phương; cần xác nhận chủ vườn, ngày đón khách và giá.', 'A group of orchard, food and local-product experiences. Confirm participating farms, dates and prices.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, true, true),
  ('nam-hue-orchard', 'Làng bưởi Năm Huệ', 'Nam Hue Pomelo Garden', array['Năm Huệ', 'làng bưởi']::text[], 'Tân Triều', 'Tan Trieu', 'food', 'Địa điểm ẩm thực được nêu trong tài liệu; menu, giờ và nhận khách cần xác nhận.', 'Food destination cited in the brief; confirm menu, opening hours and visitor access.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('bo-cap-vang', 'Khu du lịch sinh thái Bò Cạp Vàng', 'Bo Cap Vang Ecotourism Area', array['Bò Cạp Vàng', 'Đại Phước']::text[], 'Đại Phước – Nhơn Trạch', 'Dai Phuoc – Nhon Trach', 'experience', 'Chỉ giới thiệu hoạt động sau khi xác minh cơ sở và dịch vụ đang hoạt động hợp lệ.', 'List activities only after confirming the operator and current service status.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('giang-dien-waterfall', 'Khu du lịch Thác Giang Điền', 'Giang Dien Waterfall Tourist Area', array['Thác Giang Điền', 'Giang Điền']::text[], 'Trảng Bom', 'Trang Bom', 'nature', 'Điểm thiên nhiên; cần xác nhận lịch hoạt động và điều kiện vào.', 'Nature destination; confirm operating schedule and access.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', 10.916748, 106.9911883, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null},{"label":"Trang liên hệ nhà vận hành công bố tổng đài 0251 392 3930, hotline 0912 810 028 / 0911 980 931 và email kinhdoanh@giangdien.vn; dùng để xác nhận giờ dịch vụ, giá và chỗ trống","labelEn":"The operator''s contact page lists 0251 392 3930, hotlines 0912 810 028 / 0911 980 931 and kinhdoanh@giangdien.vn; contact them to confirm service hours, prices and availability","url":"https://giangdien.vn/lien-he/","checkedAt":"2026-10-15"}]'::jsonb, false, true),
  ('tri-an-lake', 'Hồ Trị An', 'Tri An Lake', array['Trị An', 'hồ Trị An']::text[], 'Vĩnh Cửu – Trị An', 'Vinh Cuu – Tri An', 'nature', 'Cảnh quan hồ; hoạt động ven hồ hoặc dưới nước chỉ được gợi ý khi có đơn vị và điểm tiếp cận được xác nhận.', 'Lake scenery. Suggest shore or water activities only with a confirmed operator and access point.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('dao-o-dong-truong', 'Đảo Ó – Đồng Trường', 'Dao O – Dong Truong', array['Đảo Ó', 'Đồng Trường', 'Đảo Ó Đồng Trường']::text[], 'Vĩnh Cửu – Trị An', 'Vinh Cuu – Tri An', 'nature', 'Cảnh quan tham khảo. Tài liệu nguồn ghi nhận tình trạng khai thác cần được xác minh; không tạo dịch vụ đặt chỗ.', 'Reference scenery. The supplied brief flags operating status for verification; no bookable services are listed.', 'paused_reference', 'Chỉ lưu làm điểm tham khảo; phải xác minh điều kiện hoạt động trước khi ghé hoặc đặt dịch vụ.', 'Reference only. Confirm current operations and access before visiting or booking.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":null,"checkedAt":null}]'::jsonb, false, true),
  ('ma-da-reserve', 'Khu Bảo tồn Thiên nhiên – Văn hóa Đồng Nai / Mã Đà', 'Dong Nai Nature and Culture Reserve – Ma Da', array['Mã Đà', 'Khu bảo tồn Đồng Nai']::text[], 'Mã Đà – Vĩnh Cửu', 'Ma Da – Vinh Cuu', 'nature', 'Chỉ tham quan tuyến được đơn vị quản lý cho phép; cần hướng dẫn tại chỗ.', 'Visit only routes permitted by the reserve; local guidance may be required.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', 11.1107873, 107.0520631, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null},{"label":"OSM node 9784252674 tại 11.1115345, 107.0519628 được gắn barrier=gate và là node chung với way cơ quan chính phủ cùng hai way hàng rào. Chưa có tag xác nhận khách du lịch được vào; đây chỉ là ứng viên cổng cơ sở, không phải cổng đón khách đã xác minh. Pin vẫn thể hiện đối tượng khu bảo tồn.","labelEn":"OSM node 9784252674 at 11.1115345, 107.0519628 is tagged barrier=gate and shared with the reserve government-office way and two fence ways. No tag confirms tourist access; this is only a facility-gate candidate, not a verified visitor entrance. The map pin remains the reserve feature.","url":"https://www.openstreetmap.org/node/9784252674","checkedAt":"2026-10-15"}]'::jsonb, false, true),
  ('war-zone-d', 'Chiến khu D', 'War Zone D', array['Chiến khu D', 'Căn cứ Chiến khu D']::text[], 'Vĩnh Cửu', 'Vinh Cuu', 'culture', 'Tuyến lịch sử cần tư liệu và điều kiện tham quan được đơn vị quản lý xác nhận.', 'Historic route requiring verified source material and access conditions.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, false, true),
  ('suoimo', 'Công viên Suối Mơ', 'Suoi Mo Park', array['Suối Mơ', 'Suoi Mo Park']::text[], 'Tân Phú', 'Tan Phu', 'family', 'Công viên có trải nghiệm thiên nhiên và trò chơi nước. Bảng giá chính thức 2026 áp dụng từ 01/01/2026 đến khi thay thế; bảng giá và giờ hoạt động chỉ dùng cho đúng hạng mục, hãy xác nhận trước chuyến đi.', 'Nature and water-play park. Its official 2026 price sheet applies from 1 Jan 2026 until replaced; prices and activity hours are scoped to listed services, so confirm before travelling.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', 11.2290561, 107.4432339, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://suoimopark.com/uploads/BANG%20GIA/2026.pdf","checkedAt":null}]'::jsonb, false, true),
  ('cat-tien', 'Vườn quốc gia Cát Tiên', 'Cat Tien National Park', array['Cát Tiên', 'Nam Cát Tiên', 'VQG Cát Tiên']::text[], 'Tân Phú – Cát Tiên', 'Tan Phu – Cat Tien', 'nature', 'Trải nghiệm vườn quốc gia phải tuân theo chương trình, tuyến và hướng dẫn do đơn vị quản lý xác nhận.', 'National park visits must follow programs, routes and guidance confirmed by park management.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://cattiennationalpark.com.vn/","checkedAt":null},{"label":"Bảng giá của VQG nêu giá còn hiệu lực đến khi có bảng mới; xác nhận với đơn vị trước khi đi","labelEn":"The national park''s published price schedule remains effective until replaced; confirm before travel","url":"https://cattiennationalpark.com.vn/wp-content/uploads/2025/07/Bang-gia-2024-co-moc-dau.pdf","checkedAt":"2026-10-15"}]'::jsonb, false, true),
  ('ta-lai', 'Làng du lịch cộng đồng Tà Lài', 'Ta Lai Community Tourism Village', array['Tà Lài', 'Ta Lai']::text[], 'Tà Lài – Nam Cát Tiên', 'Ta Lai – Nam Cat Tien', 'experience', 'Trải nghiệm văn hóa chỉ tổ chức với cộng đồng tự nguyện chủ trì và xác nhận nội dung.', 'Cultural experiences require willing community leadership and content approval.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, false, true),
  ('ba-chong-rocks', 'Đá Ba Chồng', 'Ba Chong Rocks', array['Đá Ba Chồng', 'Định Quán']::text[], 'Định Quán', 'Dinh Quan', 'nature', 'Cảnh quan địa chất; giữ khoảng cách an toàn, không vượt khu vực hạn chế.', 'Geological scenery; keep a safe distance and stay outside restricted areas.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', 11.190788, 107.3484014, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('thac-mai-bau-nuoc-soi', 'Thác Mai – Bàu Nước Sôi', 'Thac Mai Waterfall – Bau Nuoc Soi', array['Thác Mai', 'Bàu Nước Sôi']::text[], 'Định Quán – La Ngà', 'Dinh Quan – La Nga', 'nature', 'Tình trạng mở cửa và điều kiện tiếp cận cần xác nhận trước khi đi.', 'Confirm current access and operating status before visiting.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('phu-dien-fields', 'Trải nghiệm đồng lúa Phú Điền', 'Phu Dien Rice Fields Experience', array['Phú Điền', 'đồng lúa']::text[], 'Phú Điền', 'Phu Dien', 'experience', 'Ý tưởng trải nghiệm chỉ triển khai khi hộ dân đồng ý đón khách.', 'Experience concept only; participating households must consent to receive visitors.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":null,"checkedAt":null}]'::jsonb, true, true),
  ('la-nga-glamping', 'Lưu trú ven hồ La Ngà', 'La Nga Lakeside Stays', array['La Ngà', 'Panorama Glamping', 'Tropical Eglamping']::text[], 'La Ngà', 'La Nga', 'stay', 'Nhóm lưu trú tham khảo. Chưa xác nhận cơ sở, phòng, điều kiện an toàn hoặc đặt chỗ.', 'Reference group of stays. Operators, rooms, safety conditions and bookings are unverified.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":null,"checkedAt":null}]'::jsonb, true, true),
  ('binh-loc-orchards', 'Vườn trái cây Bình Lộc và Long Khánh', 'Binh Loc and Long Khanh Orchards', array['Bình Lộc', 'Long Khánh', 'vườn trái cây']::text[], 'Long Khánh – Bình Lộc', 'Long Khanh – Binh Loc', 'experience', 'Trải nghiệm vườn phụ thuộc mùa và sự đồng ý của từng nhà vườn; không có lịch/giá chung.', 'Orchard visits depend on season and each farm''s consent; no shared schedule or price is confirmed.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":null,"checkedAt":null}]'::jsonb, true, true),
  ('chua-chan', 'Núi Chứa Chan – Gia Lào', 'Chua Chan Mountain – Gia Lao', array['Núi Chứa Chan', 'Gia Lào', 'Xuân Lộc']::text[], 'Xuân Lộc', 'Xuan Loc', 'nature', 'Cần kiểm tra tuyến, thời tiết, tình trạng hoạt động và sức khỏe phù hợp.', 'Check routes, weather, operating status and personal fitness before visiting.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', 10.94111, 107.37937, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('da-han-waterfall', 'Thác Đá Hàn', 'Da Han Waterfall', array['Thác Đá Hàn', 'Đá Hàn']::text[], 'Trảng Bom', 'Trang Bom', 'nature', 'Cổng thông tin Đồng Nai ghi địa điểm ở xã Sông Trầu, huyện Trảng Bom trong bài năm 2019. Xác nhận lại địa chỉ, tình trạng hoạt động, đường vào và điều kiện an toàn với cơ sở trước chuyến đi.', 'A 2019 Dong Nai government article places the site in Song Trau, Trang Bom. Confirm the address, current operations, access and safety conditions with the venue before travelling.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/wcag/Chuong-trinh-Ke-hoach-phat-trien-KTXH/du-lich-dong-nai-nhieu-thac-dep-noi-tieng-2788.html","checkedAt":null}]'::jsonb, false, true),
  ('long-khanh-fruit-festival', 'Lễ hội trái cây Long Khánh', 'Long Khanh Fruit Festival', array['Mùa trái cây Long Khánh']::text[], 'Long Khánh', 'Long Khanh', 'experience', 'Sự kiện có tính thời vụ; chỉ hiển thị lịch khi nhà tổ chức công bố.', 'Seasonal event; show dates only when published by the organizer.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('bu-gia-map', 'Vườn quốc gia Bù Gia Mập', 'Bu Gia Map National Park', array['Bù Gia Mập', 'VQG Bù Gia Mập']::text[], 'Bù Gia Mập', 'Bu Gia Map', 'nature', 'Chỉ đi tuyến có hướng dẫn và chấp thuận của đơn vị quản lý vườn.', 'Use only routes and guides approved by park management.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, false, true),
  ('soc-bom-bo', 'Di tích Sóc Bom Bo', 'Soc Bom Bo Heritage Site', array['Sóc Bom Bo', 'Bom Bo', 'đồng bào S''tiêng']::text[], 'Bù Đăng – Bom Bo', 'Bu Dang – Bom Bo', 'culture', 'Hoạt động văn hóa cần cộng đồng tự nguyện tổ chức và kiểm duyệt nội dung.', 'Cultural activities must be voluntarily organized by the community, which reviews the content.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, false, true),
  ('bu-lach-grassland', 'Trảng cỏ Bù Lạch', 'Bu Lach Grassland', array['Bù Lạch', 'trảng cỏ']::text[], 'Bù Đăng', 'Bu Dang', 'nature', 'Xác minh quyền tiếp cận và tuyến vào; không đi xe vào vùng cỏ nhạy cảm.', 'Confirm access rights and routes; do not drive onto sensitive grassland.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('ba-ra-mountain', 'Núi Bà Rá', 'Ba Ra Mountain', array['Bà Rá', 'Phước Long']::text[], 'Phước Long', 'Phuoc Long', 'nature', 'Tuyến và dịch vụ hỗ trợ cần xác nhận. Không khẳng định cáp treo đang hoạt động.', 'Confirm routes and services. No cable car operation is assumed.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('thac-mo-lake', 'Hồ Thác Mơ', 'Thac Mo Lake', array['Hồ Thác Mơ', 'Thác Mơ']::text[], 'Phước Long', 'Phuoc Long', 'nature', 'Chỉ tiếp cận khu vực được phép; tránh hạ tầng vận hành.', 'Access permitted areas only; stay away from operating infrastructure.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('ta-thiet', 'Di tích Căn cứ Tà Thiết', 'Ta Thiet Base Heritage Site', array['Tà Thiết', 'Lộc Ninh']::text[], 'Lộc Ninh', 'Loc Ninh', 'culture', 'Tuyến giáo dục lịch sử; lịch tham quan cần xác nhận với đơn vị quản lý.', 'Historic learning destination; confirm visiting times with its manager.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, false, true),
  ('loc-ninh-meeting-house', 'Nhà Giao tế Lộc Ninh', 'Loc Ninh Meeting House', array['Nhà Giao tế', 'Lộc Ninh']::text[], 'Lộc Ninh', 'Loc Ninh', 'culture', 'Di tích lịch sử trong danh mục nghiên cứu; lịch mở cửa cần xác nhận.', 'Historic site in the research catalog; confirm visiting hours.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, false, true),
  ('my-le-eco-resort', 'Khu du lịch sinh thái Mỹ Lệ', 'My Le Ecotourism Area', array['Mỹ Lệ', 'Phước Long']::text[], 'Phước Long', 'Phuoc Long', 'experience', 'Chỉ thể hiện dịch vụ sau khi cơ sở xác nhận đang hoạt động và nhận khách.', 'List services only after the operator confirms that it is open to visitors.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('dak-mai-waterfall', 'Thác Đắk Mai', 'Dak Mai Waterfall', array['Đắk Mai', 'Bù Gia Mập']::text[], 'Bù Gia Mập', 'Bu Gia Map', 'nature', 'Cần đơn vị tổ chức, quyền tiếp cận và hướng dẫn phù hợp với quy định bảo tồn.', 'Requires an authorized operator, approved access and conservation-compliant guidance.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', 12.0623464, 107.1841837, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://dongnai.gov.vn/vi/news/Du-lich-Dong-Nai/goi-y-10-diem-du-lich-trai-nghiem-o-tinh-dong-nai-55427.html","checkedAt":null}]'::jsonb, false, true),
  ('community-cultural-experiences', 'Trải nghiệm nghề và ẩm thực cộng đồng', 'Community-led Crafts and Food', array['S''tiêng', 'M''nông', 'Chơro', 'Mạ']::text[], 'Nhiều địa bàn', 'Multiple areas', 'experience', 'Nhóm trải nghiệm chỉ được giới thiệu khi cộng đồng chủ trì và đồng ý nội dung, lịch.', 'Introduce experiences only when the community leads and approves their content and schedule.', 'needs_confirmation', 'Điểm có trong danh mục nghiên cứu. Chưa xác minh vị trí cổng vào, giờ mở cửa, giá và khả năng nhận khách.', 'Listed for research. Entrance coordinates, hours, prices and availability have not been confirmed.', null, null, null, '[{"label":"Danh mục gợi ý du lịch Đồng Nai; cần kiểm tra lại với đơn vị quản lý","url":"https://svhttdl.dongnai.gov.vn/vi/news/du-lich/","checkedAt":null}]'::jsonb, true, true)
on conflict (id) do nothing;
-- ===== END first-run catalog seed =====

-- ===== BEGIN 0002_ai_features_and_usernames.sql =====
-- Incremental additions for username login and the weather/route AI features.
do $$ begin
  if not exists (select 1 from public.places) then
    raise exception 'Seed the 36 place rows after migration 0001 before running migration 0002; it inserts source-linked media and prices.';
  end if;
end $$;

alter table public.profiles add column if not exists username text;
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,24}$');
create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username)) where username is not null;

alter table public.places add column if not exists coordinate_precision text;
alter table public.places add column if not exists coordinate_source_url text;
alter table public.places add column if not exists coordinate_source_label text;
alter table public.places add column if not exists coordinate_checked_at date;
alter table public.places drop constraint if exists places_coordinate_evidence;
alter table public.places add constraint places_coordinate_evidence check (
  (latitude is null and longitude is null and coordinate_precision is null)
  or (latitude is not null and longitude is not null
      and coordinate_precision in ('entrance_verified','venue_feature','approximate')
      and coordinate_source_url is not null and coordinate_source_label is not null and coordinate_checked_at is not null)
) not valid;

create table if not exists public.place_media (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places(id) on delete cascade,
  image_url text not null check (image_url ~ '^https://'),
  alt_vi text not null check (char_length(alt_vi) between 3 and 240),
  alt_en text not null check (char_length(alt_en) between 3 and 240),
  credit text not null check (char_length(credit) between 2 and 160),
  source_url text not null check (source_url ~ '^https://'),
  license text not null check (char_length(license) between 2 and 80),
  license_url text not null check (license_url ~ '^https://'),
  checked_at date not null,
  is_archival boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (place_id, source_url)
);
alter table public.place_media enable row level security;
drop policy if exists "public reads approved place media" on public.place_media;
create policy "public reads approved place media" on public.place_media for select to anon, authenticated using (approved = true or public.is_platform_admin());
drop policy if exists "admins manage place media" on public.place_media;
create policy "admins manage place media" on public.place_media for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create table if not exists public.place_hours (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_local time,
  closes_local time,
  status text not null check (status in ('verified','historical','conflicting','unknown')),
  note text not null default '',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  valid_from date,
  valid_to date,
  source_url text,
  source_label text not null,
  checked_at date,
  approved boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((opens_local is null) = (closes_local is null)),
  check (status <> 'verified' or (opens_local is not null and source_url is not null and checked_at is not null))
);
create index if not exists place_hours_current_idx on public.place_hours (place_id, weekday, checked_at desc);
alter table public.place_hours enable row level security;
drop policy if exists "public reads approved place hours" on public.place_hours;
create policy "public reads approved place hours" on public.place_hours for select to anon, authenticated using (approved = true or public.is_platform_admin());
drop policy if exists "admins manage place hours" on public.place_hours;
create policy "admins manage place hours" on public.place_hours for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.place_media, public.place_hours to anon, authenticated;
grant insert, update, delete on public.place_media, public.place_hours to authenticated;

insert into public.place_media
  (place_id,image_url,alt_vi,alt_en,credit,source_url,license,license_url,checked_at,is_archival,approved)
values
  ('cat-tien','https://commons.wikimedia.org/wiki/Special:FilePath/Cat_Tien_National_Park,_Vietnam.jpg?width=1100','Cảnh quan tại Vườn quốc gia Cát Tiên','Landscape in Cát Tiên National Park','Vyacheslav Argenberg','https://commons.wikimedia.org/wiki/File:Cat_Tien_National_Park,_Vietnam.jpg','CC BY 2.0','https://creativecommons.org/licenses/by/2.0/','2026-10-15',false,true),
  ('tri-an-lake','https://commons.wikimedia.org/wiki/Special:FilePath/Ho_Tri_An.jpg?width=1100','Hồ Trị An','Hồ Trị An','Thien1908','https://commons.wikimedia.org/wiki/File:Ho_Tri_An.jpg','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','2026-10-15',false,true),
  ('dao-o-dong-truong','https://commons.wikimedia.org/wiki/Special:FilePath/%C4%90%E1%BA%A3o_%C3%93_%E1%BB%9F_%C4%90%E1%BB%93ng_Nai_th9n2019_%28h%E1%BB%93_Tr%E1%BB%8B_An%2C_b%E1%BA%BFn_thuy%E1%BB%81n%29_%287%29.jpg?width=1100','Ảnh tư liệu năm 2019 về Đảo Ó và bến thuyền hồ Trị An','Archival 2019 photo of Đảo Ó and a hồ Trị An landing','Phương Huy','https://commons.wikimedia.org/wiki/File:Đảo_Ó_ở_Đồng_Nai_th9n2019_(hồ_Trị_An,_bến_thuyền)_(7).jpg','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','2026-10-15',true,true),
  ('buu-long','https://commons.wikimedia.org/wiki/Special:FilePath/B%E1%BB%ADu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_%2810%29.jpg?width=1100','Bửu Long, Biên Hòa, Đồng Nai (ảnh tư liệu)','Bửu Long, Biên Hòa, Đồng Nai (archival photo)','Lam Tr Th','https://commons.wikimedia.org/wiki/File:Bửu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(10).jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('giang-dien-waterfall','https://commons.wikimedia.org/wiki/Special:FilePath/Giang_%C4%90i%E1%BB%81n,_Tr%E1%BA%A3ng_Bom,_%C4%90%E1%BB%93ng_Nai,_Vietnam_-_panoramio.jpg?width=1100','Thác Giang Điền, Trảng Bom, Đồng Nai (ảnh tư liệu)','Thác Giang Điền, Trảng Bom, Đồng Nai (archival photo)','Lam Tr Th','https://commons.wikimedia.org/wiki/File:Giang_Điền,_Trảng_Bom,_Đồng_Nai,_Vietnam_-_panoramio.jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true)
on conflict (place_id,source_url) do nothing;

-- Current operator-published ticket conditions checked on 2026-10-15.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'amazing-bay', v.item_label, v.audience, v.amount_vnd, 'verified',
  'https://www.sontien.com/blogs/faq', 'Sơn Tiên official FAQ', '2026-10-15', v.terms, true
from (values
  ('Vé trọn gói The Amazing Bay','Người lớn (trên 1,4 m)',490000::bigint,'Giá FAQ; bao gồm các trò chơi công viên nước theo nội dung trang. Xác nhận trước khi mua.'),
  ('Vé trọn gói The Amazing Bay','Trẻ em cao từ 1 m đến 1,4 m',270000::bigint,'Giá FAQ; điều kiện theo chiều cao được nêu trên trang. Xác nhận trước khi mua.'),
  ('Vé trọn gói The Amazing Bay','Trẻ em dưới 1 m',0::bigint,'Trang FAQ nêu miễn phí; kiểm tra điều kiện đo chiều cao tại quầy.')
) as v(item_label,audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='amazing-bay' and p.item_label=v.item_label and p.audience=v.audience
    and p.source_url='https://www.sontien.com/blogs/faq' and p.checked_at='2026-10-15'
);

create or replace function public.create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  requested_username text := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
begin
  if requested_username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'A username with 3-24 letters, digits, or underscores is required.';
  end if;
  insert into public.profiles (id, full_name, locale, username)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100), ''),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'vi' end,
    requested_username
  ) on conflict (id) do nothing;
  return new;
end;
$$;

alter table public.ai_usage drop constraint if exists ai_usage_feature_check;
alter table public.ai_usage add constraint ai_usage_feature_check
  check (feature in ('trip_plan','guide','quote_draft','price_compare','weather_safety','route_assist'));

-- ===== END 0002_ai_features_and_usernames.sql =====

-- ===== BEGIN 0003_place_evidence_refresh.sql =====
-- Source-backed destination updates checked on 2026-10-15.
-- Coordinates are OSM feature points, not surveyed entrance coordinates.
update public.places as p
set latitude = v.latitude,
    longitude = v.longitude,
    coordinate_precision = 'venue_feature',
    coordinate_source_url = v.source_url,
    coordinate_source_label = 'OpenStreetMap mapped feature; not a verified entrance',
    coordinate_checked_at = '2026-10-15'
from (values
  ('buu-long', 10.9629837::double precision, 106.7936911::double precision, 'https://www.openstreetmap.org/way/972604563'),
  ('tran-bien-temple-of-literature', 10.9645068::double precision, 106.8015941::double precision, 'https://www.openstreetmap.org/way/972604565'),
  ('ong-pagoda', 10.9298894::double precision, 106.8258042::double precision, 'https://www.openstreetmap.org/node/11123066994'),
  ('giang-dien-waterfall', 10.9167480::double precision, 106.9911883::double precision, 'https://www.openstreetmap.org/way/59986402'),
  ('ma-da-reserve', 11.1107873::double precision, 107.0520631::double precision, 'https://www.openstreetmap.org/way/1065375337'),
  ('suoimo', 11.2290561::double precision, 107.4432339::double precision, 'https://www.openstreetmap.org/way/1195398460'),
  ('ba-chong-rocks', 11.1907880::double precision, 107.3484014::double precision, 'https://www.openstreetmap.org/node/9974267816'),
  ('dak-mai-waterfall', 12.0623464::double precision, 107.1841837::double precision, 'https://www.openstreetmap.org/node/11898330382')
) as v(id, latitude, longitude, source_url)
where p.id = v.id;

insert into public.place_media
  (place_id,image_url,alt_vi,alt_en,credit,source_url,license,license_url,checked_at,is_archival,approved)
values
  ('buu-long','https://commons.wikimedia.org/wiki/Special:FilePath/B%E1%BB%ADu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(3).jpg?width=1100','Cảnh quan Bửu Long, Biên Hòa (ảnh tư liệu)','Bửu Long landscape, Biên Hòa (archival photo)','Lam Tr Th','https://commons.wikimedia.org/wiki/File:B%E1%BB%ADu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(3).jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('buu-long','https://commons.wikimedia.org/wiki/Special:FilePath/B%E1%BB%ADu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(6).jpg?width=1100','Hồ và núi đá tại Bửu Long (ảnh tư liệu)','Lake and limestone hills at Bửu Long (archival photo)','Lam Tr Th','https://commons.wikimedia.org/wiki/File:B%E1%BB%ADu_Long,_Bien_Hoa,_Dong_Nai,_Vietnam_-_panoramio_(6).jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('tran-bien-temple-of-literature','https://commons.wikimedia.org/wiki/Special:FilePath/Nh%C3%A0_th%E1%BB%9D_ch%C3%ADnh_V%C4%83n_mi%E1%BA%BFu_Tr%E1%BA%A5n_Bi%C3%AAn.jpg?width=1100','Chính điện Văn miếu Trấn Biên','Main sanctuary of Tran Bien Temple of Literature','Bùi Thụy Đào Nguyên','https://commons.wikimedia.org/wiki/File:Nh%C3%A0_th%E1%BB%9F_ch%C3%ADnh_V%C4%83n_mi%E1%BA%BFu_Tr%E1%BA%A5n_Bi%C3%AAn.jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',false,true),
  ('tran-bien-temple-of-literature','https://commons.wikimedia.org/wiki/Special:FilePath/Van_mieu_Tran_Bien_Bien_Hoa.jpg?width=1100','Văn miếu Trấn Biên, Biên Hòa (ảnh tư liệu)','Tran Bien Temple of Literature, Bien Hoa (archival photo)','Thuydaonguyen','https://commons.wikimedia.org/wiki/File:Van_mieu_Tran_Bien_Bien_Hoa.jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('nguyen-huu-canh-temple','https://commons.wikimedia.org/wiki/Special:FilePath/%C4%90%E1%BB%81n_th%E1%BB%9D_Nguy%E1%BB%85n_H%E1%BB%AFu_C%E1%BA%A3nh_t%E1%BA%A1i_C%C3%B9_lao_Ph%E1%BB%91.jpg?width=1100','Đền thờ Nguyễn Hữu Cảnh tại Cù lao Phố (ảnh tư liệu)','Nguyen Huu Canh Temple on Cu Lao Pho (archival photo)','Bùi Thụy Đào Nguyên','https://commons.wikimedia.org/wiki/File:%C4%90%E1%BB%81n_th%E1%BB%9F_Nguy%E1%BB%85n_H%E1%BB%AFu_C%E1%BA%A3nh_t%E1%BA%A1i_C%C3%B9_lao_Ph%E1%BB%91.jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('ta-lai','https://commons.wikimedia.org/wiki/Special:FilePath/T%C3%A0_L%C3%A0i,_T%C3%A2n_Ph%C3%BA,_%C4%90%E1%BB%93ng_Nai,_Vietnam_-_panoramio.jpg?width=1100','Cảnh quan Tà Lài, Tân Phú (ảnh tư liệu)','Ta Lai landscape, Tan Phu (archival photo)','Lam Tr Th','https://commons.wikimedia.org/wiki/File:T%C3%A0_L%C3%A0i,_T%C3%A2n_Ph%C3%BA,_%C4%90%E1%BB%93ng_Nai,_Vietnam_-_panoramio.jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('thac-mai-bau-nuoc-soi','https://commons.wikimedia.org/wiki/Special:FilePath/TH%C3%81C_MAI-%C4%90%E1%BB%8ANH_QU%C3%81N-%C4%90%E1%BB%92NG_NAI_-_panoramio.jpg?width=1100','Thác Mai, Định Quán (ảnh tư liệu)','Thac Mai Waterfall, Dinh Quan (archival photo)','pqthong0911','https://commons.wikimedia.org/wiki/File:TH%C3%81C_MAI-%C4%90%E1%BB%8ANH_QU%C3%81N-%C4%90%E1%BB%92NG_NAI_-_panoramio.jpg','CC BY 3.0','https://creativecommons.org/licenses/by/3.0/','2026-10-15',true,true),
  ('chua-chan','https://commons.wikimedia.org/wiki/Special:FilePath/Chua_Chan_mount..JPG?width=1100','Núi Chứa Chan (ảnh tư liệu)','Chua Chan Mountain (archival photo)','Cheers!','https://commons.wikimedia.org/wiki/File:Chua_Chan_mount..JPG','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true),
  ('ba-ra-mountain','https://commons.wikimedia.org/wiki/Special:FilePath/Thac%20Mo%20-%20Nui%20Ba%20Ra.JPG?width=1100','Núi Bà Rá nhìn từ khu Thác Mơ (ảnh tư liệu năm 2015)','Ba Ra Mountain seen from the Thac Mo area (archival photo from 2015)','Scope72','https://commons.wikimedia.org/wiki/File:Thac_Mo_-_Nui_Ba_Ra.JPG','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','2026-10-15',true,true),
  ('ba-chong-rocks','https://commons.wikimedia.org/wiki/Special:FilePath/%C4%90%C3%A1%20Ba%20Ch%E1%BB%93ng%20in%20%C4%90%E1%BB%8Bnh%20Qu%C3%A1n.jpg?width=1100','Đá Ba Chồng ở Định Quán, ảnh tư liệu năm 2025','Ba Chong Rocks in Dinh Quan, archival photo from 2025','MinhVN123','https://commons.wikimedia.org/wiki/File:%C4%90%C3%A1_Ba_Ch%E1%BB%93ng_in_%C4%90%E1%BB%8Bnh_Qu%C3%A1n.jpg','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','2026-10-15',true,true),
  ('giang-dien-waterfall','https://commons.wikimedia.org/wiki/Special:FilePath/Giang_Dien_Waterfall.JPG?width=1100','Thác Giang Điền, Trảng Bom (ảnh tư liệu)','Giang Dien Waterfall, Trang Bom (archival photo)','Prenn','https://commons.wikimedia.org/wiki/File:Giang_Dien_Waterfall.JPG','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','2026-10-15',true,true)
on conflict (place_id,source_url) do nothing;

-- The national park's published schedule states it remains effective until replaced.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,source_url,source_label,checked_at,terms,approved)
select 'cat-tien', v.item_label, v.audience, v.amount_vnd, 'verified', '2024-06-01',
  'https://cattiennationalpark.com.vn/wp-content/uploads/2025/07/Bang-gia-2024-co-moc-dau.pdf',
  'Bảng giá Trung tâm Giáo dục Môi trường và Dịch vụ VQG Cát Tiên; hiệu lực đến khi có bảng mới', '2026-10-15', v.terms, true
from (values
  ('Vé vào Vườn (gồm một lượt phà vào và đón về)','Người lớn từ 16 tuổi',60000::bigint,'Không bao gồm các dịch vụ khác. Bảng do đơn vị quản lý công bố; xác nhận trước ngày đi.'),
  ('Vé vào Vườn','Người cao tuổi Việt Nam trên 60 tuổi có CCCD',30000::bigint,'Điều kiện và giấy tờ theo bảng giá. Xác nhận với đơn vị trước ngày đi.'),
  ('Vé vào Vườn','Sinh viên có thẻ hoặc giấy giới thiệu của trường',20000::bigint,'Điều kiện và giấy tờ theo bảng giá. Xác nhận với đơn vị trước ngày đi.'),
  ('Vé vào Vườn','Học sinh, trẻ em dưới 16 tuổi',10000::bigint,'Không bao gồm các dịch vụ khác. Xác nhận với đơn vị trước ngày đi.')
) as v(item_label,audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='cat-tien' and p.item_label=v.item_label and p.audience=v.audience
    and p.source_url='https://cattiennationalpark.com.vn/wp-content/uploads/2025/07/Bang-gia-2024-co-moc-dau.pdf'
);

-- Most recent official local-government price publication found for Bửu Long is for New Year 2026.
-- Keep it historical so it is useful as a reference but never presented as a current quote.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,valid_to,source_url,source_label,checked_at,terms,approved)
select 'buu-long','Vé vào cổng Bửu Long',v.audience,v.amount_vnd,'historical','2026-01-02','2026-01-02',
  'https://tranbien.dongnai.gov.vn/vi/news/du-lich-am-thuc/khu-du-lich-buu-long-don-tren-2-5-ngan-luot-du-khach-trong-ngay-dau-ky-nghi-tet-duong-lich-2026-433.html',
  'UBND phường Trấn Biên dẫn thông tin KDL Bửu Long (02/01/2026)','2026-01-02',v.terms,true
from (values
  ('Người lớn từ 1,4 m',150000::bigint,'Giá công bố dịp Tết Dương lịch 2026; chưa xác nhận lại là giá đang áp dụng hiện nay.'),
  ('Trẻ em cao 1 m–1,4 m',60000::bigint,'Giá công bố dịp Tết Dương lịch 2026; chưa xác nhận lại là giá đang áp dụng hiện nay.'),
  ('Trẻ em dưới 1 m',0::bigint,'Miễn vé theo chiều cao, công bố dịp Tết Dương lịch 2026; chưa xác nhận lại hiện nay.')
) as v(audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='buu-long' and p.audience=v.audience and p.checked_at='2026-01-02'
);

-- ===== END 0003_place_evidence_refresh.sql =====

-- ===== BEGIN 0004_suoi_mo_price_refresh.sql =====
-- Official Suoi Mo 2025 price sheet says these rates apply from 2025-01-25
-- until another policy replaces them. Rechecked on 2026-10-15; callers should
-- still confirm the amount and conditions with the operator before purchase.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,valid_to,source_url,source_label,checked_at,terms,approved)
select 'suoimo', v.item_label, v.audience, v.amount_vnd, 'verified', '2025-01-25', null,
  'https://suoimopark.com/uploads/BANG%20GIA/Bang%20Gia%20Suoi%20Mo%202025.pdf',
  'Bảng giá chính thức Suối Mơ; ghi áp dụng đến khi có chính sách thay thế', '2026-10-15', v.terms, true
from (values
  ('Vé cổng Suối Mơ','Người lớn (T2–CN)',130000::bigint,'Bảng giá ghi 130.000 ₫ ngày T2–CN và áp dụng từ 25/01/2025 đến khi có chính sách khác thay thế. Giá gồm VAT; xác nhận với đơn vị trước khi mua.'),
  ('Vé cổng Suối Mơ','Người lớn (Lễ, Tết)',150000::bigint,'Bảng giá ghi 150.000 ₫ ngày Lễ, Tết và áp dụng từ 25/01/2025 đến khi có chính sách khác thay thế. Giá gồm VAT; xác nhận với đơn vị trước khi mua.'),
  ('Vé cổng Suối Mơ','Trẻ em cao 1 m–1,4 m (T2–CN)',60000::bigint,'Bảng giá ghi 60.000 ₫ ngày T2–CN cho trẻ cao 1 m–1,4 m, áp dụng từ 25/01/2025 đến khi có chính sách khác thay thế. Xác nhận trước khi mua.'),
  ('Vé cổng Suối Mơ','Trẻ em cao 1 m–1,4 m (Lễ, Tết)',70000::bigint,'Bảng giá ghi 70.000 ₫ ngày Lễ, Tết cho trẻ cao 1 m–1,4 m, áp dụng từ 25/01/2025 đến khi có chính sách khác thay thế. Xác nhận trước khi mua.'),
  ('Vé cổng Suối Mơ','Trẻ em dưới 1 m (mọi ngày)',0::bigint,'Ghi chú bảng giá nêu miễn phí cho trẻ cao dưới 1 m. Bảng ghi áp dụng đến khi có chính sách khác thay thế; xác nhận điều kiện đo chiều cao trước khi mua.')
) as v(item_label,audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='suoimo' and p.item_label=v.item_label and p.audience=v.audience
    and p.source_url='https://suoimopark.com/uploads/BANG%20GIA/Bang%20Gia%20Suoi%20Mo%202025.pdf'
);

-- ===== END 0004_suoi_mo_price_refresh.sql =====

-- ===== BEGIN 0005_destination_media_and_reported_hours.sql =====
-- Add a recent, location-specific archival photo with its Commons attribution.
insert into public.place_media
  (place_id,image_url,alt_vi,alt_en,credit,source_url,license,license_url,checked_at,is_archival,approved)
select 'cat-tien',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Cat_Tien_Nat_Park_B_2021-11-06_by_1April1950.jpg?width=1100',
  'Hồ Cá Sấu trong Vườn quốc gia Cát Tiên, ảnh năm 2021',
  'Crocodile Lake in Cát Tiên National Park, photographed in 2021',
  '1April1950',
  'https://commons.wikimedia.org/wiki/File:Cat_Tien_Nat_Park_B_2021-11-06_by_1April1950.jpg',
  'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', '2026-10-15', true, true
where not exists (
  select 1 from public.place_media m
  where m.place_id = 'cat-tien'
    and m.source_url = 'https://commons.wikimedia.org/wiki/File:Cat_Tien_Nat_Park_B_2021-11-06_by_1April1950.jpg'
);

-- This venue page reports a schedule but also says site information is AI-written.
-- Keep the entries public as source-reported/unknown, never as verified opening hours.
alter table public.place_hours
  add column if not exists note_en text not null default '';

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'buu-long', v.weekday,
  case when v.weekday = 2 then null::time else '07:00'::time end,
  case when v.weekday = 2 then null::time else '17:00'::time end,
  'unknown',
  'Website nêu lịch 07:00–17:00; nghỉ thứ ba, trừ ngày lễ/Tết. Footer website cho biết thông tin được viết bằng AI. Hãy gọi cơ sở xác nhận trước khi đi.',
  'The website reports 07:00–17:00, closed Tuesday except public holidays. Its footer says the information is AI-written. Call the venue to confirm before travelling.',
  'https://buulong.com.vn/gio-mo-cua',
  'Website khu du lịch; lịch nguồn công bố, chưa xác minh độc lập', '2026-10-15', true
from (values (0),(1),(2),(3),(4),(5),(6)) as v(weekday)
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'buu-long'
    and h.weekday = v.weekday
    and h.source_url = 'https://buulong.com.vn/gio-mo-cua'
    and h.checked_at = '2026-10-15'
);

-- ===== END 0005_destination_media_and_reported_hours.sql =====

-- ===== BEGIN 0006_add_sourced_osm_features.sql =====
-- These are mapped feature coordinates, not surveyed entrance coordinates.
update public.places as p
set latitude = v.latitude,
    longitude = v.longitude,
    coordinate_precision = 'venue_feature',
    coordinate_source_url = v.source_url,
    coordinate_source_label = 'OpenStreetMap mapped feature; not a verified entrance or trailhead',
    coordinate_checked_at = '2026-10-15'
from (values
  ('amazing-bay', 10.87485::double precision, 106.87036::double precision, 'https://www.openstreetmap.org/way/1163348358'),
  ('chua-chan', 10.94111::double precision, 107.37937::double precision, 'https://www.openstreetmap.org/node/6961182026')
) as v(id, latitude, longitude, source_url)
where p.id = v.id;

-- ===== END 0006_add_sourced_osm_features.sql =====

-- ===== BEGIN 0007_buu_long_hung_kings_day_prices.sql =====
-- Historical Buu Long ticket rates reported by the official Dong Nai portal
-- for the 2026-04-26 Hung Kings holiday. These are not current prices.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,valid_to,source_url,source_label,checked_at,terms,approved)
select 'buu-long','Vé vào cổng Bửu Long',v.audience,v.amount_vnd,'historical','2026-04-26','2026-04-26',
  'https://dongnai.gov.vn/vi/news/tin-tuc-su-kien/khu-du-lich-buu-long-don-tren-3-ngan-luot-du-khach-trong-ngay-dau-ky-nghi-le-gio-to-hung-vuong-61212.html',
  'Cổng thông tin Đồng Nai dẫn thông tin từ KDL Bửu Long','2026-04-26',v.terms,true
from (values
  ('Người lớn từ 1,4 m',150000::bigint,'Giá được công bố trong dịp Giỗ Tổ Hùng Vương ngày 26/04/2026; không phải báo giá hiện hành. Vé mô tả bao gồm các hạng mục trọn gói nêu trong bài; một số trò chơi tính riêng.'),
  ('Trẻ em cao từ 1 m đến dưới 1,4 m',60000::bigint,'Giá được công bố trong dịp Giỗ Tổ Hùng Vương ngày 26/04/2026; không phải báo giá hiện hành. Xác nhận điều kiện chiều cao với cơ sở.'),
  ('Trẻ em dưới 1 m',0::bigint,'Bài báo nêu miễn vé cho trẻ dưới 1 m trong ngày 26/04/2026; không phải chính sách hiện hành.')
) as v(audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='buu-long' and p.audience=v.audience
    and p.source_url='https://dongnai.gov.vn/vi/news/tin-tuc-su-kien/khu-du-lich-buu-long-don-tren-3-ngan-luot-du-khach-trong-ngay-dau-ky-nghi-le-gio-to-hung-vuong-61212.html'
    and p.checked_at='2026-04-26'
);

-- ===== END 0007_buu_long_hung_kings_day_prices.sql =====

-- ===== BEGIN 0008_amazing_bay_published_hours.sql =====
-- The Amazing Bay's official product page lists a regular Mon-Sun schedule.
-- Holiday schedules may differ; the UI retains the operator confirmation note.
insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'amazing-bay',v.weekday,'09:00','17:00','verified',
  'Trang sản phẩm chính thức ghi mở cửa Thứ Hai–Chủ Nhật 09:00–17:00. Giờ ngày lễ có thể khác; xác nhận với đơn vị vận hành trước chuyến đi.',
  'The official product page lists Monday–Sunday, 09:00–17:00. Holiday hours may differ; confirm with the operator before travelling.',
  'https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay',
  'Trang sản phẩm chính thức The Amazing Bay','2026-10-15',true
from generate_series(0,6) as v(weekday)
where not exists (
  select 1 from public.place_hours h
  where h.place_id='amazing-bay' and h.weekday=v.weekday
    and h.source_url='https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay'
    and h.checked_at='2026-10-15'
);

-- ===== END 0008_amazing_bay_published_hours.sql =====

-- ===== BEGIN 0009_dong_nai_museum_reported_hours.sql =====
-- The museum's official page still publishes a schedule dated 2023-12-18.
-- Store the schedule as unverified because it has not been reconfirmed recently.
insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'dong-nai-museum',v.weekday,null,null,'unknown',
  'Trang chính thức đăng ngày 18/12/2023 nêu giờ hành chính từ Thứ Ba đến Thứ Sáu: 07:00–11:00 và 13:30–17:00; Thứ Hai, Thứ Bảy và Chủ Nhật cần liên hệ đặt lịch. Lịch chưa được bảo tàng xác nhận lại; vui lòng gọi trước khi đi.',
  'The official page published on 18 Dec 2023 lists administrative visiting hours Tuesday–Friday, 07:00–11:00 and 13:30–17:00; Monday, Saturday and Sunday require prior contact. The schedule has not been reconfirmed by the museum; call before visiting.',
  'https://www.baotangdongnai.com.vn/gio-mo-cua',
  'Website chính thức Bảo tàng Đồng Nai; lịch đăng năm 2023, chưa xác minh lại','2026-10-15',true
from generate_series(0,6) as v(weekday)
where not exists (
  select 1 from public.place_hours h
  where h.place_id='dong-nai-museum' and h.weekday=v.weekday
    and h.source_url='https://www.baotangdongnai.com.vn/gio-mo-cua'
    and h.checked_at='2026-10-15'
);

-- ===== END 0009_dong_nai_museum_reported_hours.sql =====

-- ===== BEGIN 0010_war_zone_and_bu_lach_photos.sql =====
-- Add location-specific archival images with their Commons attribution.
insert into public.place_media
  (place_id,image_url,alt_vi,alt_en,credit,source_url,license,license_url,checked_at,is_archival,approved)
values
  (
    'bu-lach-grassland',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Tr%E1%BA%A3ng%20c%E1%BB%8F%20B%C3%B9%20L%E1%BA%A1ch%20b%C3%ACnh%20ph%C6%B0%E1%BB%9Bc%20m%C3%B9a%20kh%C3%B4%20bu%E1%BB%95i%20t%E1%BB%91i%20-%20panoramio%20(8).jpg?width=1100',
    'Trảng cỏ Bù Lạch trong mùa khô, ảnh tư liệu năm 2015',
    'Bu Lach grassland in the dry season, archival photo from 2015',
    'Lam Tr Th',
    'https://commons.wikimedia.org/wiki/File:Trảng_cỏ_Bù_Lạch_bình_phước_mùa_khô_buổi_tối_-_panoramio_(8).jpg',
    'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', '2026-10-15', true, true
  ),
  (
    'war-zone-d',
    'https://commons.wikimedia.org/wiki/Special:FilePath/%C4%90%C6%B0%E1%BB%9Dng%20Chi%E1%BA%BFn%20Khu%20D%20-%20panoramio.jpg?width=1100',
    'Con đường ở Chiến khu D, ảnh tư liệu năm 2015',
    'A road in War Zone D, archival photo from 2015',
    'Lam Tr Th',
    'https://commons.wikimedia.org/wiki/File:Đường_Chiến_Khu_D_-_panoramio.jpg',
    'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', '2026-10-15', true, true
  )
on conflict (place_id,source_url) do nothing;

-- ===== END 0010_war_zone_and_bu_lach_photos.sql =====

-- ===== BEGIN 0011_thac_mo_archival_photo.sql =====
-- Add a location-specific archival photo of Thac Mo reservoir with its Commons attribution.
insert into public.place_media
  (place_id,image_url,alt_vi,alt_en,credit,source_url,license,license_url,checked_at,is_archival,approved)
values
  (
    'thac-mo-lake',
    'https://commons.wikimedia.org/wiki/Special:FilePath/H%E1%BB%93%20Th%C3%A1c%20M%C6%A1%20B%C3%ACnh%20Ph%C6%B0%E1%BB%9Bc%20-%20panoramio%20(8).jpg?width=1100',
    'Hồ Thác Mơ, ảnh tư liệu năm 2015',
    'Thac Mo reservoir, archival photo from 2015',
    'Lam Tr Th',
    'https://commons.wikimedia.org/wiki/File:Hồ_Thác_Mơ_Bình_Phước_-_panoramio_(8).jpg',
    'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', '2026-10-15', true, true
  )
on conflict (place_id,source_url) do nothing;

-- ===== END 0011_thac_mo_archival_photo.sql =====

-- ===== BEGIN 0012_son_tien_amazing_world_prices.sql =====
-- Operator product page prices for the Hanh Tinh La nighttime combo.
-- The page does not state the child ticket's age/height criteria, so retain that caveat.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'son-tien-amazing-world', v.item_label, v.audience, v.amount_vnd, 'verified',
  'https://www.sontien.com/products/tham-quan-amazing-world', 'Sơn Tiên official product page', '2026-10-15', v.terms, true
from (values
  ('Combo Hành Tinh Lạ khung giờ đêm (17:00–21:00)','Trẻ em (trang chưa nêu tuổi/chiều cao)',45000::bigint,'Trang sản phẩm của đơn vị vận hành hiển thị giá 45.000 ₫ mỗi vé và ghi combo khung giờ đêm 17:00–21:00. Trang chưa nêu tiêu chí tuổi/chiều cao cho loại vé trẻ em; xác nhận điều kiện và giá theo ngày trên hệ thống đặt vé trước khi mua.'),
  ('Combo Hành Tinh Lạ khung giờ đêm (17:00–21:00)','Người lớn',90000::bigint,'Trang sản phẩm của đơn vị vận hành hiển thị giá 90.000 ₫ mỗi vé cho combo khung giờ đêm 17:00–21:00. Giá có thể thay đổi theo ngày; xác nhận trên hệ thống đặt vé trước khi mua.')
) as v(item_label,audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='son-tien-amazing-world' and p.item_label=v.item_label and p.audience=v.audience
    and p.source_url='https://www.sontien.com/products/tham-quan-amazing-world' and p.checked_at='2026-10-15'
);

-- ===== END 0012_son_tien_amazing_world_prices.sql =====

-- ===== BEGIN 0013_soc_bom_bo_archival_photo.sql =====
-- Add a location-specific archival photo of the Soc Bom Bo cultural reserve.
insert into public.place_media
  (place_id,image_url,alt_vi,alt_en,credit,source_url,license,license_url,checked_at,is_archival,approved)
values
  (
    'soc-bom-bo',
    'https://commons.wikimedia.org/wiki/Special:FilePath/%C4%90i%E1%BB%83u%20Ong.jpg?width=1100',
    'Tượng Anh hùng lực lượng vũ trang Điểu Ong tại khu bảo tồn văn hóa Sóc Bom Bo, ảnh tư liệu năm 2017',
    'Statue of armed forces hero Dieu Ong at the Soc Bom Bo cultural reserve, archival photo from 2017',
    'Kieprongbuon812',
    'https://commons.wikimedia.org/wiki/File:Điểu_Ong.jpg',
    'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', '2026-10-15', true, true
  )
on conflict (place_id,source_url) do nothing;

-- ===== END 0013_soc_bom_bo_archival_photo.sql =====

-- ===== BEGIN 0014_bilingual_place_hours.sql =====
-- Keep opening-hours evidence readable in both supported UI locales.
alter table public.place_hours
  add column if not exists note_en text not null default '';

update public.place_hours
set note_en = case place_id
  when 'amazing-bay' then 'The official product page lists Monday–Sunday, 09:00–17:00. Holiday hours may differ; confirm with the operator before travelling.'
  when 'buu-long' then 'The venue website reports 07:00–17:00 and closure on Tuesday except public holidays. Its footer says the information is AI-written; call the venue to confirm before travelling.'
  when 'dong-nai-museum' then 'The museum page published on 18 Dec 2023 reports administrative visiting hours Tuesday–Friday, 07:00–11:00 and 13:30–17:00; other days require prior contact. The schedule has not been reconfirmed; call before visiting.'
  else note_en
end
where place_id in ('amazing-bay', 'buu-long', 'dong-nai-museum')
  and coalesce(note_en, '') = '';

-- ===== END 0014_bilingual_place_hours.sql =====

-- ===== BEGIN 0015_bu_gia_map_archival_photo.sql =====
-- Archival landscape image of Bù Gia Mập. The image does not prove current access or operations.
insert into public.place_media
  (place_id, image_url, alt_vi, alt_en, credit, source_url, license, license_url, checked_at, is_archival, approved)
values
  ('bu-gia-map',
   'https://commons.wikimedia.org/wiki/Special:FilePath/B%C3%B9_Gia_M%E1%BA%ADp%2C_Binh_Phuoc_province%2C_Vietnam.jpg?width=1100',
   'Cảnh quan Bù Gia Mập, ảnh tư liệu chụp ngày 29/03/2012',
   'Landscape in Bu Gia Map, archival photograph from 29 March 2012',
   'TuanUt',
   'https://commons.wikimedia.org/wiki/File:Bù_Gia_Mập,_Binh_Phuoc_province,_Vietnam.jpg',
   'CC BY-SA 3.0',
   'https://creativecommons.org/licenses/by-sa/3.0/',
   '2026-10-15', true, true)
on conflict (place_id, source_url) do nothing;

-- ===== END 0015_bu_gia_map_archival_photo.sql =====

-- ===== BEGIN 0016_suoi_mo_licensed_photo.sql =====
-- Location-specific Suoi Mo Park photograph with Pexels licensing metadata.
-- The source page identifies the depicted place as Tân Phú, Đồng Nai.
insert into public.place_media
  (place_id, image_url, alt_vi, alt_en, credit, source_url, license, license_url, checked_at, is_archival, approved)
values
  (
    'suoimo',
    'https://images.pexels.com/photos/11096564/pexels-photo-11096564.jpeg?auto=compress&dpr=1&h=750&w=1260',
    'Ảnh chụp từ trên cao Công viên Suối Mơ với khu vực vui chơi dưới nước',
    'Aerial photo of Suoi Mo Park and its water recreation area',
    'Chàng Trai Nông Thôn',
    'https://www.pexels.com/photo/aerial-shot-of-a-nature-resort-11096564/',
    'Pexels License',
    'https://www.pexels.com/license/',
    '2026-10-15',
    false,
    true
  )
on conflict (place_id, source_url) do nothing;

-- ===== END 0016_suoi_mo_licensed_photo.sql =====

-- ===== BEGIN 0017_suoi_mo_reported_hours.sql =====
-- A business directory reports the schedule. Keep it explicitly unverified
-- until the park operator confirms current weekday and holiday hours.
insert into public.place_hours
  (place_id, weekday, opens_local, closes_local, status, note, note_en, source_url, source_label, checked_at, approved)
select
  'suoimo', v.weekday, '07:30'::time, '17:00'::time, 'unknown',
  'Danh bạ Viet-Biz liệt kê giờ 07:30–17:00 hàng ngày. Đây không phải xác nhận từ đơn vị vận hành; hãy gọi Suối Mơ để kiểm tra lịch ngày đi, nhất là lễ/Tết.',
  'The Viet-Biz directory lists daily hours as 07:30–17:00. This is not an operator confirmation; call Suoi Mo to verify the schedule for your date, especially public holidays.',
  'https://www.viet-biz.com/c%C3%B4ng-vi%C3%AAn-su%E1%BB%91i-m%C6%A1_5d-0251-6270-777',
  'Danh bạ Viet-Biz; lịch chưa được Suối Mơ xác nhận', '2026-10-15', true
from generate_series(0, 6) as v(weekday)
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'suoimo'
    and h.weekday = v.weekday
    and h.source_url = 'https://www.viet-biz.com/c%C3%B4ng-vi%C3%AAn-su%E1%BB%91i-m%C6%A1_5d-0251-6270-777'
    and h.checked_at = '2026-10-15'
);

-- ===== END 0017_suoi_mo_reported_hours.sql =====

-- ===== BEGIN 0018_war_zone_ma_da_archival_photo.sql =====
-- A second archival image specifically described as War Zone D in Ma Da forest.
insert into public.place_media
  (place_id, image_url, alt_vi, alt_en, credit, source_url, license, license_url, checked_at, is_archival, approved)
values
  (
    'war-zone-d',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Chi%E1%BA%BFn_Khu_%C4%90_n%C4%83m_2019_%28r%E1%BB%ABng_M%C3%A3_%C4%90%C3%A0%29.jpg?width=1100',
    'Rừng Mã Đà tại Chiến khu D, ảnh tư liệu chụp năm 2019',
    'Ma Da forest in War Zone D, archival photo taken in 2019',
    'Phương Huy',
    'https://commons.wikimedia.org/wiki/File:Chi%E1%BA%BFn_Khu_%C4%90_n%C4%83m_2019_%28r%E1%BB%ABng_M%C3%A3_%C4%90%C3%A0%29.jpg',
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0/',
    '2026-10-15',
    true,
    true
  )
on conflict (place_id, source_url) do nothing;

-- ===== END 0018_war_zone_ma_da_archival_photo.sql =====

-- ===== BEGIN 0019_la_nga_landscape_photo.sql =====
-- Archival La Nga landscape photo, clearly not a lodging-property image.
insert into public.place_media
  (place_id, image_url, alt_vi, alt_en, credit, source_url, license, license_url, checked_at, is_archival, approved)
values
  (
    'la-nga-glamping',
    'https://commons.wikimedia.org/wiki/Special:FilePath/La_Ng%C3%A0%2C%20%C4%90%E1%BB%8Bnh%20Qu%C3%A1n%2C%20%C4%90%E1%BB%93ng%20Nai%2C%20Vietnam%20-%20panoramio%20%281%29.jpg?width=1100',
    'Cảnh quan khu vực La Ngà, ảnh tư liệu năm 2015; không phải ảnh cơ sở lưu trú',
    'Archival landscape of the La Nga area from 2015; not a lodging property photo',
    'Lam Tr Th',
    'https://commons.wikimedia.org/wiki/File:La_Ng%C3%A0,_Đ%E1%BB%8Bnh_Qu%C3%A1n,_Đ%E1%BB%93ng_Nai,_Vietnam_-_panoramio_(1).jpg',
    'CC BY-SA 3.0',
    'https://creativecommons.org/licenses/by-sa/3.0/',
    '2026-10-15',
    true,
    true
  )
on conflict (place_id, source_url) do nothing;

-- ===== END 0019_la_nga_landscape_photo.sql =====

-- ===== BEGIN 0020_giang_dien_camping_price_notes.sql =====
-- Operator-published Giang Dien camping package and tent prices checked 2026-10-15.
-- The official page links undated image files from its August 2024 uploads directory.
-- Preserve them as unknown validity: display as unconfirmed notes, never as current trip costs.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'giang-dien-waterfall', v.item_label, v.audience, v.amount_vnd, 'unknown',
  'https://giangdien.vn/wp-content/uploads/2024/08/' || v.image_file,
  'Bảng dịch vụ chính thức Thác Giang Điền; tệp không ghi ngày hiệu lực', '2026-10-15', v.terms, true
from (values
  ('Combo camping 01 – lều A','Mỗi khách',449000::bigint,'1.png','Bảng ghi 449.000 ₫/khách, gồm vé cổng và dịch vụ lưu trú/ăn uống theo combo. Tệp bảng giá không ghi ngày áp dụng; không coi là giá hiện hành, cần xác nhận với cơ sở.'),
  ('Combo camping 02 – lều A','Mỗi khách',649000::bigint,'2.png','Bảng ghi 649.000 ₫/khách, gồm vé cổng và dịch vụ lưu trú/ăn uống theo combo. Tệp bảng giá không ghi ngày áp dụng; không coi là giá hiện hành, cần xác nhận với cơ sở.'),
  ('Combo camping 03 – sân B','Mỗi khách',599000::bigint,'3.png','Bảng ghi 599.000 ₫/khách, gồm vé cổng và dịch vụ lưu trú/ăn uống theo combo. Tệp bảng giá không ghi ngày áp dụng; không coi là giá hiện hành, cần xác nhận với cơ sở.'),
  ('Combo camping 04 – sân B','Mỗi khách',799000::bigint,'4.png','Bảng ghi 799.000 ₫/khách, gồm vé cổng và dịch vụ lưu trú/ăn uống theo combo. Tệp bảng giá không ghi ngày áp dụng; không coi là giá hiện hành, cần xác nhận với cơ sở.'),
  ('Combo camping 05 – sân B','Mỗi khách',999000::bigint,'5.png','Bảng ghi 999.000 ₫/khách, gồm vé cổng và dịch vụ lưu trú/ăn uống theo combo. Tệp bảng giá không ghi ngày áp dụng; không coi là giá hiện hành, cần xác nhận với cơ sở.'),
  ('Thuê lều sàn qua đêm','Mỗi lều, 1–2 khách',500000::bigint,'6.png','Bảng ghi 500.000 ₫/lều, nhận phòng 14:00, trả phòng 12:00; phụ thu khách thứ ba từ 200.000 ₫/khách. Tệp không ghi ngày hiệu lực; xác nhận với cơ sở.'),
  ('Thuê lều sàn trong ngày','Mỗi lều, 1–2 khách',400000::bigint,'6.png','Bảng ghi 400.000 ₫/lều, nhận phòng 08:00, trả phòng 17:00; phụ thu khách thứ ba từ 150.000 ₫/khách. Tệp không ghi ngày hiệu lực; xác nhận với cơ sở.'),
  ('Thuê lều sàn theo giờ','Mỗi lều, tối đa 2 khách; 1–2 giờ',200000::bigint,'6.png','Bảng ghi 200.000 ₫/lều cho 1–2 giờ, mỗi giờ tiếp theo phụ thu 100.000 ₫. Tệp không ghi ngày hiệu lực và không nêu rõ vé cổng đã bao gồm; xác nhận với cơ sở.'),
  ('Thuê lều cắm trại qua đêm','Mỗi lều, 1–2 khách',400000::bigint,'6.png','Bảng ghi 400.000 ₫/lều, nhận phòng 14:00, trả phòng 12:00; phụ thu khách thứ ba từ 150.000 ₫/khách. Tệp không ghi ngày hiệu lực; xác nhận với cơ sở.'),
  ('Thuê lều cắm trại trong ngày','Mỗi lều, 1–2 khách',350000::bigint,'6.png','Bảng ghi 350.000 ₫/lều, nhận phòng 08:00, trả phòng 17:00; phụ thu khách thứ ba từ 150.000 ₫/khách. Tệp không ghi ngày hiệu lực; xác nhận với cơ sở.'),
  ('Thuê lều cắm trại theo giờ','Mỗi lều, tối đa 2 khách; 1–2 giờ',180000::bigint,'6.png','Bảng ghi 180.000 ₫/lều cho 1–2 giờ, mỗi giờ tiếp theo phụ thu 100.000 ₫; giá chưa gồm vé cổng. Tệp không ghi ngày hiệu lực; xác nhận với cơ sở.')
) as v(item_label,audience,amount_vnd,image_file,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='giang-dien-waterfall' and p.item_label=v.item_label
    and p.audience=v.audience
    and (
      p.source_url=('https://giangdien.vn/wp-content/uploads/2024/08/' || v.image_file)
      or (v.item_label='Combo camping 01 – lều A' and p.source_url='https://giangdien.vn/san-pham/leu-san-a/')
    )
);

-- ===== END 0020_giang_dien_camping_price_notes.sql =====

-- ===== BEGIN 0021_giang_dien_current_price_and_general_hours.sql =====
-- Reconcile the old camping price sheet with the operator's current product page.
-- Source checked 2026-10-15: https://giangdien.vn/san-pham/leu-san-a/
update public.price_references
set audience = 'Mỗi khách; áp dụng từ 2 khách',
    status = 'verified',
    source_url = 'https://giangdien.vn/san-pham/leu-san-a/',
    source_label = 'Trang sản phẩm combo 1 lều A của nhà vận hành',
    checked_at = '2026-10-15',
    terms = 'Trang sản phẩm đang hiển thị 449.000 ₫/khách (giá gạch 550.000 ₫), chỉ áp dụng từ 2 khách; trẻ dưới 1,4 m miễn phí, trên 1,4 m tính như người lớn. Gói gồm vé cổng, lều sàn qua đêm, một số dịch vụ và bữa ăn như mô tả; không gồm nước uống. Xác nhận giá theo ngày trước khi đặt.'
where place_id = 'giang-dien-waterfall'
  and item_label = 'Combo camping 01 – lều A'
  and audience = 'Mỗi khách'
  and amount_vnd = 449000
  and status = 'unknown'
  and source_url = 'https://giangdien.vn/wp-content/uploads/2024/08/1.png';

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'giang-dien-waterfall','Combo camping 01 – lều A','Mỗi khách; áp dụng từ 2 khách',449000,'verified',
  'https://giangdien.vn/san-pham/leu-san-a/','Trang sản phẩm combo 1 lều A của nhà vận hành','2026-10-15',
  'Trang sản phẩm đang hiển thị 449.000 ₫/khách (giá gạch 550.000 ₫), chỉ áp dụng từ 2 khách; trẻ dưới 1,4 m miễn phí, trên 1,4 m tính như người lớn. Gói gồm vé cổng, lều sàn qua đêm, một số dịch vụ và bữa ăn như mô tả; không gồm nước uống. Xác nhận giá theo ngày trước khi đặt.',true
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'giang-dien-waterfall'
    and p.item_label = 'Combo camping 01 – lều A'
    and p.source_url = 'https://giangdien.vn/san-pham/leu-san-a/'
);

-- -1 means a source reports general hours but gives no weekday-specific schedule.
alter table public.place_hours drop constraint if exists place_hours_weekday_check;
alter table public.place_hours add constraint place_hours_weekday_check check (weekday between -1 and 6);

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'giang-dien-waterfall',-1,'07:30','17:00','unknown',
  'Trang sản phẩm của nhà vận hành ghi giờ hoạt động khu vui chơi 07:30–17:00. Trang không nêu lịch/ngoại lệ theo từng ngày; xác nhận ngày đi và ngày lễ với cơ sở.',
  'The operator product page reports park activity hours of 07:30–17:00. It does not specify a weekday schedule or exceptions; confirm your visit date and holidays with the operator.',
  'https://giangdien.vn/san-pham/leu-san-a/',
  'Trang sản phẩm chính thức Thác Giang Điền; giờ chung, ngày áp dụng chưa nêu','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'giang-dien-waterfall' and h.weekday = -1
    and h.source_url = 'https://giangdien.vn/san-pham/leu-san-a/'
);

-- ===== END 0021_giang_dien_current_price_and_general_hours.sql =====

-- ===== BEGIN 0022_ma_da_archival_forest_photo.sql =====
-- The source explicitly names this 2019 archival photograph as Ma Da forest.
-- It illustrates the area only; it is not an entrance point or current-condition evidence.
insert into public.place_media
  (place_id, image_url, alt_vi, alt_en, credit, source_url, license, license_url, checked_at, is_archival, approved)
values
  (
    'ma-da-reserve',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Chi%E1%BA%BFn_Khu_%C4%90_n%C4%83m_2019_%28r%E1%BB%ABng_M%C3%A3_%C4%90%C3%A0%29.jpg?width=1100',
    'Rừng Mã Đà trong khu vực Chiến khu D, ảnh tư liệu chụp năm 2019; không thể hiện cổng vào hay hiện trạng hiện nay',
    'Ma Da forest in the War Zone D area, archival photo from 2019; not an entrance or a current-condition image',
    'Phương Huy',
    'https://commons.wikimedia.org/wiki/File:Chi%E1%BA%BFn_Khu_%C4%90_n%C4%83m_2019_%28r%E1%BB%ABng_M%C3%A3_%C4%90%C3%A0%29.jpg',
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0/',
    '2026-10-15',
    true,
    true
  )
on conflict (place_id, source_url) do nothing;

-- ===== END 0022_ma_da_archival_forest_photo.sql =====

-- ===== BEGIN 0023_buu_long_2026_summer_report.sql =====
-- Báo Đồng Nai quoted Bửu Long management on 2026-08-07. The listed summer
-- promotion ended on 2026-08-31. Preserve it as historical evidence; do not
-- present any of these amounts as current prices.
update public.place_hours
set status = 'unknown',
    note = 'Báo Đồng Nai ngày 07/08/2026 dẫn Ban Giám đốc: mở cửa 07:00–17:00 các ngày trừ thứ Ba; thứ Ba vẫn mở dịp lễ/Tết. Chưa được xác nhận lại sau ngày đăng; hãy liên hệ cơ sở trước khi đi.',
    note_en = 'On 7 Aug 2026, Báo Đồng Nai quoted the venue director: open 07:00–17:00 except Tuesdays, with Tuesday openings on public holidays. Not reconfirmed since publication; contact the venue before travelling.',
    source_url = 'https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/',
    source_label = 'Báo Đồng Nai dẫn Ban Giám đốc; lịch được nêu ngày 07/08/2026, chưa xác nhận lại',
    checked_at = '2026-08-07'
where place_id = 'buu-long'
  and source_url = 'https://buulong.com.vn/gio-mo-cua'
  and checked_at = '2026-10-15';

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_to,source_url,source_label,checked_at,terms,approved)
select 'buu-long', v.item_label, v.audience, v.amount_vnd, 'historical', v.valid_to,
  'https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/',
  'Báo Đồng Nai dẫn thông tin Ban Giám đốc KDL Bửu Long', '2026-08-07', v.terms, true
from (values
  ('Vé vào cổng tham quan Bửu Long','Người lớn cao trên 1,4 m',100000::bigint,null::date,'Bài báo ngày 07/08/2026 dẫn giá tại thời điểm đưa tin; bài không xác định thời hạn áp dụng giá cơ bản này. Chỉ là giá lịch sử, không phải giá hiện hành; xác nhận với cơ sở.'),
  ('Combo trò chơi Bửu Long','Người lớn cao trên 1,4 m',50000::bigint,null::date,'Bài báo ngày 07/08/2026 mô tả combo trò chơi bán riêng; thời hạn áp dụng mức giá này không được nêu. Chỉ là giá lịch sử, không phải giá hiện hành.'),
  ('Combo tham quan và vui chơi Bửu Long','Trẻ em cao từ 1 m đến 1,4 m',60000::bigint,null::date,'Bài báo ngày 07/08/2026 nêu combo tham quan, vui chơi cho trẻ cao 1–1,4 m tại thời điểm đưa tin; không phải giá hiện hành.'),
  ('Combo trò chơi ưu đãi mùa hè Bửu Long','Trẻ em dưới 1,4 m; chương trình mùa hè 2026',30000::bigint,'2026-08-31'::date,'Bài báo cho biết ưu đãi mùa hè áp dụng đến hết tháng 08/2026. Mức giá và điều kiện đã hết hạn; không sử dụng làm giá hiện tại.'),
  ('Vé vào cổng ưu đãi mùa hè Bửu Long','Trẻ em dưới 1,4 m; chương trình mùa hè 2026',0::bigint,'2026-08-31'::date,'Bài báo cho biết miễn vé vào cổng cho trẻ dưới 1,4 m trong chương trình mùa hè 2026 đến hết tháng 08. Ưu đãi đã hết hạn; không dùng làm chính sách hiện tại.')
) as v(item_label,audience,amount_vnd,valid_to,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'buu-long'
    and p.item_label = v.item_label
    and p.audience = v.audience
    and p.source_url = 'https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/'
    and p.checked_at = '2026-08-07'
);

-- ===== END 0023_buu_long_2026_summer_report.sql =====

-- ===== BEGIN 0024_tran_bien_main_gate_photo.sql =====
-- Archival Wikimedia Commons photo explicitly describes the main gate of
-- Tran Bien Temple of Literature. It is not evidence of the current entrance.
insert into public.place_media
  (place_id, image_url, alt_vi, alt_en, credit, source_url, license, license_url, checked_at, is_archival, approved)
values
  (
    'tran-bien-temple-of-literature',
    'https://commons.wikimedia.org/wiki/Special:FilePath/V%C4%83n_Mi%E1%BA%BFu_M%C3%B4n.jpg?width=1100',
    'Cổng chính Văn Miếu Trấn Biên, ảnh tư liệu từ năm 2009',
    'Main gate of Tran Bien Temple of Literature, archival photo from 2009',
    'Thuydaonguyen',
    'https://commons.wikimedia.org/wiki/File:V%C4%83n_Mi%E1%BA%BFu_M%C3%B4n.jpg',
    'CC BY-SA 3.0',
    'https://creativecommons.org/licenses/by-sa/3.0/',
    '2026-10-15',
    true,
    true
  )
on conflict (place_id, source_url) do nothing;

-- ===== END 0024_tran_bien_main_gate_photo.sql =====

-- ===== BEGIN 0025_amazing_bay_child_price_conflict_2026.sql =====
-- Two sources show different child ticket prices; preserve both and exclude them
-- from current-price calculations until the operator reconciles the difference.
update public.price_references
set status = 'conflicting',
    terms = 'FAQ chính thức Sơn Tiên ghi 270.000 ₫ cho trẻ cao 1–1,4 m; hướng dẫn trên cổng bán vé amazingbay.vn ghi 279.000 ₫. Hai nguồn chưa được đơn vị vận hành đối soát; chưa dùng mức này làm giá hiện hành, hãy xác nhận khi đặt vé.'
where place_id = 'amazing-bay'
  and item_label = 'Vé trọn gói The Amazing Bay'
  and audience = 'Trẻ em cao từ 1 m đến 1,4 m'
  and source_url = 'https://www.sontien.com/blogs/faq'
  and checked_at::date = date '2026-10-15';

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select
  'amazing-bay',
  'Vé trọn gói The Amazing Bay',
  'Trẻ em cao từ 1 m đến 1,4 m',
  279000,
  'conflicting',
  'https://amazingbay.vn/huong-dan-dat-ve-online-tai-the-amazing-bay-vinh-ky-dieu/',
  'Hướng dẫn trên cổng bán vé amazingbay.vn (đăng 16/04/2026)',
  timestamptz '2026-10-15 00:00:00+00',
  'Hướng dẫn nêu giá quầy tham khảo 279.000 ₫ và cảnh báo giá có thể đổi theo khuyến mãi/ngày lễ. FAQ chính thức Sơn Tiên ghi 270.000 ₫; chưa đối soát với đơn vị vận hành, không dùng làm báo giá chắc chắn.',
  true
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'amazing-bay'
    and p.item_label = 'Vé trọn gói The Amazing Bay'
    and p.audience = 'Trẻ em cao từ 1 m đến 1,4 m'
    and p.source_url = 'https://amazingbay.vn/huong-dan-dat-ve-online-tai-the-amazing-bay-vinh-ky-dieu/'
);

-- ===== END 0025_amazing_bay_child_price_conflict_2026.sql =====

-- ===== BEGIN 0026_amazing_bay_operator_ticket_source_refresh.sql =====
-- Refresh Amazing Bay price provenance to the operator's live ticket product.
-- Preserve the child-price conflict with the separate ticket-guide source.
update public.price_references
set source_url = 'https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay',
    source_label = 'Trang bán vé chính thức Sơn Tiên — The Amazing Bay',
    checked_at = date '2026-10-15',
    terms = 'Tại thời điểm đối chiếu, trang bán vé chính thức hiển thị 490.000 ₫ cho người lớn cao từ 1,4 m. Giá/ưu đãi theo ngày có thể đổi; kiểm tra giá ở bước chọn ngày và thanh toán.'
where place_id = 'amazing-bay'
  and item_label = 'Vé trọn gói The Amazing Bay'
  and audience = 'Người lớn (trên 1,4 m)'
  and amount_vnd = 490000
  and status = 'verified'
  and source_url = 'https://www.sontien.com/blogs/faq';

update public.price_references
set source_url = 'https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay',
    source_label = 'Trang bán vé chính thức Sơn Tiên — The Amazing Bay',
    checked_at = date '2026-10-15',
    terms = 'Trang bán vé chính thức hiển thị 270.000 ₫ cho trẻ cao 1 m–1 m 39; hướng dẫn trên cổng bán vé amazingbay.vn ghi 279.000 ₫. Giữ trạng thái mâu thuẫn và không dùng làm giá chắc chắn đến khi đối soát; xác nhận mức theo ngày trước khi mua.'
where place_id = 'amazing-bay'
  and item_label = 'Vé trọn gói The Amazing Bay'
  and audience = 'Trẻ em cao từ 1 m đến 1,4 m'
  and amount_vnd = 270000
  and status = 'conflicting'
  and source_url = 'https://www.sontien.com/blogs/faq';

-- ===== END 0026_amazing_bay_operator_ticket_source_refresh.sql =====

-- ===== BEGIN 0027_suoi_mo_operator_activity_hours.sql =====
-- The operator's current page lists activity hours, not confirmed gate/whole-park hours.
-- Keep the older business-directory schedule for audit, but mark it historical.
update public.place_hours
set status = 'historical',
    note = 'Lịch 07:30–17:00 do danh bạ Viet-Biz liệt kê đã được thay thế trong phần tham khảo bởi giờ hoạt động do nhà vận hành công bố. Bản ghi cũ không xác nhận giờ mở cổng/toàn khu; liên hệ Suối Mơ trước khi đi.',
    note_en = 'The Viet-Biz directory schedule of 07:30–17:00 is superseded in the reference display by activity hours published by the operator. This older record does not confirm gate/whole-park hours; contact Suoi Mo before travelling.'
where place_id = 'suoimo'
  and source_url = 'https://www.viet-biz.com/c%C3%B4ng-vi%C3%AAn-su%E1%BB%91i-m%C6%A1_5d-0251-6270-777'
  and status = 'unknown';

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'suoimo',-1,'08:00','17:00','unknown',
  'Trang chính thức Suối Mơ nêu 08:00–17:00 cho các hoạt động vui chơi, hồ bơi thiên nhiên và team building. Trang không xác nhận giờ mở cổng/toàn khu hoặc lịch ngoại lệ theo ngày; liên hệ cơ sở để xác nhận trước chuyến đi.',
  'The official Suoi Mo page lists 08:00–17:00 for recreational activities, natural pools and team building. It does not confirm whole-park/gate hours or weekday exceptions; contact the operator before travelling.',
  'https://suoimopark.com/vn/visit-picnic',
  'Trang chính thức Suối Mơ; giờ các hoạt động được nêu, chưa xác nhận giờ cổng','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'suoimo'
    and h.weekday = -1
    and h.source_url = 'https://suoimopark.com/vn/visit-picnic'
    and h.checked_at = '2026-10-15'
);

-- ===== END 0027_suoi_mo_operator_activity_hours.sql =====

-- ===== BEGIN 0028_suoi_mo_2026_operator_prices.sql =====
-- The operator's 2026 price PDF replaces the earlier 2025 ticket schedule.
-- Source: https://suoimopark.com/uploads/BANG%20GIA/2026.pdf
update public.price_references
set status = 'historical',
    valid_to = '2025-12-31',
    source_label = 'Bảng giá Suối Mơ 2025; đã được thay bằng bảng giá 2026',
    terms = terms || ' Bản giá 2025 được giữ làm lịch sử sau khi nhà vận hành công bố bảng giá 2026.'
where place_id = 'suoimo'
  and source_url = 'https://suoimopark.com/uploads/BANG%20GIA/Bang%20Gia%20Suoi%20Mo%202025.pdf'
  and status = 'verified';

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,valid_to,source_url,source_label,checked_at,terms,approved)
select 'suoimo',v.item_label,v.audience,v.amount_vnd,'verified','2026-01-01',null,
  'https://suoimopark.com/uploads/BANG%20GIA/2026.pdf',
  'Bảng giá chính thức Suối Mơ 2026; áp dụng đến khi có chính sách thay thế','2026-10-15',v.terms,true
from (values
  ('Vé cổng Suối Mơ','Người lớn (T2–CN)',130000::bigint,'Bảng giá 2026 ghi vé người lớn 130.000 ₫ từ Thứ Hai đến Chủ Nhật, đã gồm VAT; vé gồm tắm hồ bơi và tắm lại miễn phí. Xác nhận giá theo ngày trước khi mua.'),
  ('Vé cổng Suối Mơ','Người lớn (Lễ, Tết)',150000::bigint,'Bảng giá 2026 ghi vé người lớn 150.000 ₫ ngày Lễ, Tết, đã gồm VAT; vé gồm tắm hồ bơi và tắm lại miễn phí. Xác nhận giá theo ngày trước khi mua.'),
  ('Vé cổng Suối Mơ','Trẻ em cao 1 m–1,4 m (T2–CN)',60000::bigint,'Bảng giá 2026 ghi vé trẻ em cao 1 m–1,4 m là 60.000 ₫ từ Thứ Hai đến Chủ Nhật, đã gồm VAT. Xác nhận điều kiện đo chiều cao tại quầy.'),
  ('Vé cổng Suối Mơ','Trẻ em cao 1 m–1,4 m (Lễ, Tết)',70000::bigint,'Bảng giá 2026 ghi vé trẻ em cao 1 m–1,4 m là 70.000 ₫ ngày Lễ, Tết, đã gồm VAT. Xác nhận điều kiện đo chiều cao tại quầy.'),
  ('Vé cổng Suối Mơ','Trẻ em dưới 1 m (mọi ngày)',0::bigint,'Ghi chú bảng giá 2026 nêu trẻ em cao dưới 1 m được miễn phí. Xác nhận điều kiện đo chiều cao tại quầy.')
) as v(item_label,audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'suoimo'
    and p.item_label = v.item_label
    and p.audience = v.audience
    and p.source_url = 'https://suoimopark.com/uploads/BANG%20GIA/2026.pdf'
);

-- ===== END 0028_suoi_mo_2026_operator_prices.sql =====

-- ===== BEGIN 0029_cat_tien_2025_operator_price_refresh.sql =====
-- Reconcile Cat Tien public rates against the operator's latest domestic
-- visitor PDF found on 2026-10-15. The PDF states these rates remain effective
-- from 2024-06-01 until replaced; this does not prove date-specific inventory.
update public.price_references
set source_url = 'https://cattiennationalpark.com.vn/wp-content/uploads/2024/06/bang-gia-khach-noi-dia-2025.pdf',
    source_label = 'Bảng giá khách nội địa do Trung tâm GDMT và Dịch vụ VQG Cát Tiên công bố; hiệu lực đến khi có bảng mới',
    terms = case
      when item_label like 'Vé vào Vườn%'
        and position('Bảng chính thức dành cho khách nội địa nêu hiệu lực từ 01/06/2024' in terms) = 0
        then terms || ' Bảng chính thức dành cho khách nội địa nêu hiệu lực từ 01/06/2024 đến khi có bảng mới thay thế; xác nhận lại trước chuyến đi.'
      else terms
    end
where place_id = 'cat-tien'
  and source_url = 'https://cattiennationalpark.com.vn/wp-content/uploads/2025/07/Bang-gia-2024-co-moc-dau.pdf';

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,source_url,source_label,checked_at,terms,approved)
select 'cat-tien', v.item_label, v.audience, v.amount_vnd, v.status, '2024-06-01',
  'https://cattiennationalpark.com.vn/wp-content/uploads/2024/06/bang-gia-khach-noi-dia-2025.pdf',
  'Bảng giá khách nội địa do Trung tâm GDMT và Dịch vụ VQG Cát Tiên công bố; hiệu lực đến khi có bảng mới',
  '2026-10-15', v.terms, true
from (values
  ('Tham quan Bảo tàng thiên nhiên và Trung tâm cứu hộ động vật','Người lớn, mỗi vé',50000::bigint,'verified','Bảng nêu khung giờ bắt đầu 08:30, 10:00, 13:30 và 15:00 hằng ngày. Khoản vé tham quan riêng, ngoài vé vào Vườn; xác nhận lịch và chỗ trước khi đi.'),
  ('Tham quan Bảo tàng thiên nhiên và Trung tâm cứu hộ động vật','Trẻ em dưới 1,5 m, mỗi vé',25000::bigint,'verified','Bảng nêu khung giờ bắt đầu 08:30, 10:00, 13:30 và 15:00 hằng ngày. Khoản vé tham quan riêng, ngoài vé vào Vườn; xác nhận lịch và chỗ trước khi đi.'),
  ('Tour Trung tâm cứu hộ Linh trưởng – Đảo Tiên','Người lớn, mỗi vé',100000::bigint,'verified','Bảng nêu một tour lúc 08:30 hằng ngày, tối đa 30 khách, cần đặt trước 07:30. Vé là khoản riêng ngoài vé vào Vườn; xác nhận chỗ và điều kiện trước khi đi.'),
  ('Tour Trung tâm cứu hộ Linh trưởng – Đảo Tiên','Trẻ em dưới 1,5 m, mỗi vé',50000::bigint,'verified','Bảng nêu một tour lúc 08:30 hằng ngày, tối đa 30 khách, cần đặt trước 07:30. Vé là khoản riêng ngoài vé vào Vườn; xác nhận chỗ và điều kiện trước khi đi.'),
  ('Phí tham quan Bàu Sấu trong ngày','Mỗi khách; chưa gồm xe và hướng dẫn viên',250000::bigint,'verified','Bảng mô tả tuyến khoảng 14 km, gồm 9 km có thể đi ô tô/xe đạp và 5 km đi bộ trong rừng; không nêu phương thức thay thế cho đoạn đi bộ. Nên khởi hành buổi sáng; xác nhận điều kiện tuyến và thời tiết với Vườn.'),
  ('Xe ô tô tuyến Bàu Sấu khứ hồi','Nhóm 1–7 khách; giá nhóm, có thể đi ghép xe',700000::bigint,'verified','Giá xe chưa gồm phí tham quan Bàu Sấu và hướng dẫn viên. Bảng lưu ý nhóm có thể đi chung xe, không phải bao trọn chuyến; xác nhận phương tiện, chỗ và lịch thực tế.'),
  ('Hướng dẫn viên tuyến Bàu Sấu trong ngày','Mỗi hướng dẫn viên, khoảng 5 giờ',null::bigint,'unknown','Bảng giá nêu khoảng 550.000–650.000 ₫/hướng dẫn viên, không có một số tiền cố định. Xác nhận giá cuối cùng; không dùng một đầu khoảng làm báo giá chắc chắn.')
) as v(item_label,audience,amount_vnd,status,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='cat-tien'
    and p.item_label=v.item_label
    and p.audience=v.audience
    and p.source_url='https://cattiennationalpark.com.vn/wp-content/uploads/2024/06/bang-gia-khach-noi-dia-2025.pdf'
);

-- ===== END 0029_cat_tien_2025_operator_price_refresh.sql =====

-- ===== BEGIN 0030_da_han_third_party_price_and_hours.sql =====
-- Publish only explicitly unverified third-party references for Da Han.
-- Sources checked on 2026-10-15; no operator confirmation was found.

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'da-han-waterfall',
  'Vé cổng Thác Đá Hàn (nguồn thứ cấp, giá mâu thuẫn)',
  'Người lớn/trẻ em; điều kiện chiều cao giữa các nguồn không thống nhất',
  null,'conflicting',
  'https://vietgoing.com/destination/1011-thac-da-han.html',
  'Vietgoing (tham khảo 2026), đối chiếu với bài giá INTOUR (tham khảo 2025)',
  '2026-10-15',
  'Vietgoing nêu vé người lớn 50.000 VND, trẻ 1–1,4 m 25.000 VND, dưới 1 m miễn phí. Bài INTOUR ghi giá người lớn 50.000/65.000/75.000 VND theo ngày thường/cuối tuần/lễ; trẻ em 35.000/45.000 VND và ngưỡng chiều cao khác. Hai nguồn du lịch thứ cấp không phải bảng giá do nhà vận hành xác nhận; để số tiền null, không dùng trong tổng chi phí, hãy hỏi cơ sở trước chuyến đi. Nguồn đối chiếu: https://intour.vn/kinh-nghiem-du-lich/update-bang-gia-ve-cac-diem-tham-quan-tai-dong-nai-moi-nhat-1695.html',
  true
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'da-han-waterfall'
    and p.item_label = 'Vé cổng Thác Đá Hàn (nguồn thứ cấp, giá mâu thuẫn)'
    and p.source_url = 'https://vietgoing.com/destination/1011-thac-da-han.html'
);

alter table public.place_hours drop constraint if exists place_hours_weekday_check;
alter table public.place_hours add constraint place_hours_weekday_check check (weekday between -1 and 6);

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'da-han-waterfall',-1,'07:00','19:00','unknown',
  'Vietgoing nêu giờ 07:00–19:00 mỗi ngày trong trang tham khảo năm 2026. Đây không phải lịch do nhà vận hành xác nhận; liên hệ cơ sở để kiểm tra ngày đi, ngày lễ và tình trạng hoạt động.',
  'Vietgoing lists 07:00–19:00 daily on its 2026 reference page. This is not an operator-confirmed schedule; contact the venue to confirm your date, holidays and operating status.',
  'https://vietgoing.com/destination/1011-thac-da-han.html',
  'Vietgoing, nguồn du lịch thứ cấp; chưa được nhà vận hành xác nhận','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'da-han-waterfall' and h.weekday = -1
    and h.source_url = 'https://vietgoing.com/destination/1011-thac-da-han.html'
);

-- ===== END 0030_da_han_third_party_price_and_hours.sql =====

-- ===== BEGIN 0031_da_han_schedule_and_price_source_conflicts.sql =====
-- Add another secondary guide that conflicts with Da Han hours and ticket rates.
-- This keeps the price unknown to calculations and preserves both reported schedules.
update public.price_references
set source_label = 'Vietgoing (tham khảo 2026), INTOUR (tham khảo 2025), Vietnam Airlines (tham khảo 2026)',
    terms = 'Vietgoing nêu vé người lớn 50.000 VND, trẻ 1–1,4 m 25.000 VND, dưới 1 m miễn phí. Bài INTOUR ghi giá người lớn 50.000/65.000/75.000 VND theo ngày thường/cuối tuần/lễ; trẻ em 35.000/45.000 VND và ngưỡng chiều cao khác. Cẩm nang Vietnam Airlines ghi vé người lớn 30.000–40.000 VND, trẻ em 20.000–30.000 VND. Các nguồn du lịch thứ cấp không phải bảng giá do nhà vận hành xác nhận; để số tiền null, không dùng trong tổng chi phí, hãy hỏi cơ sở trước chuyến đi. Nguồn đối chiếu: https://intour.vn/kinh-nghiem-du-lich/update-bang-gia-ve-cac-diem-tham-quan-tai-dong-nai-moi-nhat-1695.html và https://www.vietnamairlines.com/go/vi/plan-book/travel/travel-guide/dong-nai-co-gi-choi'
where place_id = 'da-han-waterfall'
  and item_label = 'Vé cổng Thác Đá Hàn (nguồn thứ cấp, giá mâu thuẫn)'
  and source_url = 'https://vietgoing.com/destination/1011-thac-da-han.html'
  and status = 'conflicting';

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'da-han-waterfall',-1,'07:00','17:00','conflicting',
  'Cẩm nang Vietnam Airlines nêu giờ 07:00–17:00, khác với lịch 07:00–19:00 của Vietgoing. Cả hai là nguồn du lịch thứ cấp, chưa được nhà vận hành xác nhận; hỏi cơ sở trước chuyến đi.',
  'Vietnam Airlines lists 07:00–17:00, differing from Vietgoing’s 07:00–19:00 schedule. Both are secondary travel sources and are not operator-confirmed; contact the venue before travelling.',
  'https://www.vietnamairlines.com/go/vi/plan-book/travel/travel-guide/dong-nai-co-gi-choi',
  'Vietnam Airlines travel guide, secondary source; conflicting schedule','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'da-han-waterfall' and h.weekday = -1
    and h.source_url = 'https://www.vietnamairlines.com/go/vi/plan-book/travel/travel-guide/dong-nai-co-gi-choi'
);

-- ===== END 0031_da_han_schedule_and_price_source_conflicts.sql =====

-- ===== BEGIN 0032_giang_dien_operator_services.sql =====
-- Add scoped operator-published hours and a hotel price reference.
-- These are services within Giang Dien, not opening hours for the whole park.

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'giang-dien-waterfall',-1,'08:00','21:00','verified',
  'Nhà vận hành công bố Nhà hàng Hoa Sứ phục vụ từ Thứ Hai đến Chủ Nhật, 08:00–21:00. Giờ này chỉ áp dụng cho nhà hàng, không phải giờ mở cổng hoặc toàn khu; xác nhận ngày lễ và tình trạng phục vụ với cơ sở.',
  'The operator lists Hoa Su Restaurant as open Monday through Sunday, 08:00–21:00. These hours apply only to the restaurant, not the park gate or entire site; confirm holiday service and availability with the venue.',
  'https://giangdien.vn/nha-hang/nha-hang-hoa-su/',
  'Trang nhà hàng chính thức Thác Giang Điền; giờ áp dụng riêng cho Nhà hàng Hoa Sứ','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'giang-dien-waterfall' and h.weekday = -1
    and h.source_url = 'https://giangdien.vn/nha-hang/nha-hang-hoa-su/'
);

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'giang-dien-waterfall',-1,'08:00','17:00','unknown',
  'Trang nhà vận hành liệt kê giờ Nhà hàng Hoàng Yến 08:00–17:00 nhưng không nêu ngày trong tuần. Chỉ áp dụng cho nhà hàng, không phải giờ mở cổng hoặc toàn khu; liên hệ cơ sở để xác nhận ngày phục vụ và ngày lễ.',
  'The operator lists Hoang Yen Restaurant hours as 08:00–17:00 but does not specify weekdays. These hours apply only to the restaurant, not the park gate or entire site; confirm operating days and holidays with the venue.',
  'https://giangdien.vn/nha-hang/nha-hang-hoang-yen/',
  'Trang nhà hàng chính thức Thác Giang Điền; ngày áp dụng chưa nêu','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'giang-dien-waterfall' and h.weekday = -1
    and h.source_url = 'https://giangdien.vn/nha-hang/nha-hang-hoang-yen/'
);

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'giang-dien-waterfall',-1,null,null,'unknown',
  'Trang sản phẩm Khách sạn Tre Xanh nói dịch vụ đón khách 24/24. Thông tin này không xác nhận phòng còn trống, giờ nhận/trả phòng hoặc điều kiện nhận khách; liên hệ trước khi đặt.',
  'The Tre Xanh Hotel product page says it welcomes guests 24/24. This does not confirm room availability, check-in/check-out times or eligibility; contact the operator before booking.',
  'https://giangdien.vn/san-pham/leu-a/',
  'Trang sản phẩm Khách sạn Tre Xanh của nhà vận hành; chưa xác nhận chỗ trống','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'giang-dien-waterfall' and h.weekday = -1
    and h.source_url = 'https://giangdien.vn/san-pham/leu-a/'
    and h.source_label = 'Trang sản phẩm Khách sạn Tre Xanh của nhà vận hành; chưa xác nhận chỗ trống'
);

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'giang-dien-waterfall',
  'Phòng Khách sạn Tre Xanh (giá đang hiển thị)',
  'Một đêm; đơn vị phòng/sức chứa và điều kiện áp dụng chưa nêu rõ',
  550000,'unknown',
  'https://giangdien.vn/san-pham/leu-a/',
  'Trang sản phẩm Khách sạn Tre Xanh của nhà vận hành','2026-10-15',
  'Trang sản phẩm hiển thị giá gạch 650.000 ₫ và giá 550.000 ₫, đồng thời mô tả lưu trú một đêm. Trang không nêu ngày áp dụng ưu đãi, sức chứa/đơn vị tính giá hay điều kiện đặt phòng; đây chỉ là giá tham khảo đang hiển thị, chưa xác minh và không được cộng vào tổng chi phí. Liên hệ nhà vận hành để xác nhận.',
  true
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'giang-dien-waterfall'
    and p.item_label = 'Phòng Khách sạn Tre Xanh (giá đang hiển thị)'
    and p.source_url = 'https://giangdien.vn/san-pham/leu-a/'
);

-- ===== END 0032_giang_dien_operator_services.sql =====

-- ===== BEGIN 0033_giang_dien_combo3_current_operator_page.sql =====
-- Refresh Combo 3 from the operator's product page, which currently displays
-- 599,000 VND (crossed-out 699,000 VND) but does not state the price unit,
-- package capacity or promotion validity. Keep it unknown and out of totals.
update public.price_references
set audience = 'Đơn vị tính và sức chứa không được nêu',
    source_url = 'https://giangdien.vn/san-pham/leu-san-b-combo3/',
    source_label = 'Trang sản phẩm chính thức Combo 3; thời hạn và đơn vị giá chưa nêu',
    checked_at = '2026-10-15',
    terms = 'Trang sản phẩm đang hiển thị 599.000 ₫ (giá gạch 699.000 ₫), nhưng không nêu ngày hiệu lực ưu đãi, đơn vị tính hay sức chứa; không khẳng định đây là giá mỗi khách/phòng và không cộng vào tổng chi phí. Mô tả gồm vé cổng (tắm thác + nước ngọt), lều sàn qua đêm, phí lưu trú, bàn ghế theo số lượng, dụng cụ ăn uống, lò nướng, bình nước 20 lít và tiện ích vệ sinh/điện; phần mô tả còn liệt kê bữa trưa, BBQ tối và bữa sáng. Xác nhận giá, số người, ngày áp dụng và chi tiết gói với nhà vận hành trước khi đặt.'
where place_id = 'giang-dien-waterfall'
  and item_label = 'Combo camping 03 – sân B'
  and source_url = 'https://giangdien.vn/wp-content/uploads/2024/08/3.png';

-- ===== END 0033_giang_dien_combo3_current_operator_page.sql =====

-- ===== BEGIN 0034_ai_packing_usage_feature.sql =====
-- Track the bounded DeepSeek packing checklist feature in ai_usage.
alter table public.ai_usage drop constraint if exists ai_usage_feature_check;
alter table public.ai_usage add constraint ai_usage_feature_check
  check (feature in ('trip_plan','guide','quote_draft','price_compare','weather_safety','route_assist','packing'));

-- ===== END 0034_ai_packing_usage_feature.sql =====
