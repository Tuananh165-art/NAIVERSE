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
