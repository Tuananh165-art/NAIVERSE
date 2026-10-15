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
