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
