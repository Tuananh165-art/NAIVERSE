-- Add location-specific archival images with their Commons attribution.
insert into public.place_media
  (place_id,image_url,alt_vi,alt_en,credit,source_url,license,license_url,checked_at,is_archival,approved)
values
  (
    'bu-lach-grassland',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Tr%E1%BA%A3ng%20c%E1%BB%8F%20B%C3%B9%20L%E1%BA%A1ch%20b%C3%ACnh%20ph%C6%B0%E1%BB%9Bc%20m%C3%B9a%20kh%C3%B4%20bu%E1%BB%95i%20t%E1%BB%91i%20-%20panoramio%20(8).jpg?width=1100',
    'Trảng cỏ Bù Lạch trong mùa khô, ảnh tư liệu năm 2015',
    'Bu Lach grassland in the dry season, archival photo from 2015',
    'Lam Tr Th',
    'https://commons.wikimedia.org/wiki/File:Trảng_cỏ_Bù_Lạch_bình_phước_mùa_khô_buổi_tối_-_panoramio_(8).jpg',
    'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', '2026-10-15', true, true
  ),
  (
    'war-zone-d',
    'https://commons.wikimedia.org/wiki/Special:FilePath/%C4%90%C6%B0%E1%BB%9Dng%20Chi%E1%BA%BFn%20Khu%20D%20-%20panoramio.jpg?width=1100',
    'Con đường ở Chiến khu D, ảnh tư liệu năm 2015',
    'A road in War Zone D, archival photo from 2015',
    'Lam Tr Th',
    'https://commons.wikimedia.org/wiki/File:Đường_Chiến_Khu_D_-_panoramio.jpg',
    'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', '2026-10-15', true, true
  )
on conflict (place_id,source_url) do nothing;
