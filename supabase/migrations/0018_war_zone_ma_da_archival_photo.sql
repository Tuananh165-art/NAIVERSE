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
