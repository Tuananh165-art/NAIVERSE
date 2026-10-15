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
