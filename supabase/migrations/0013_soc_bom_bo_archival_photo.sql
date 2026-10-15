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
