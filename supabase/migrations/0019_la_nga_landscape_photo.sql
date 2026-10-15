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
