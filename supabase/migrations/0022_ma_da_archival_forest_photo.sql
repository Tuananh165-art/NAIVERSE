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
