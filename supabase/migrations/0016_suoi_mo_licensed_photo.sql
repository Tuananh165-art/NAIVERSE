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
