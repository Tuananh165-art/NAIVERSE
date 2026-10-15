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
