-- The Amazing Bay's official product page lists a regular Mon-Sun schedule.
-- Holiday schedules may differ; the UI retains the operator confirmation note.
insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'amazing-bay',v.weekday,'09:00','17:00','verified',
  'Trang sản phẩm chính thức ghi mở cửa Thứ Hai–Chủ Nhật 09:00–17:00. Giờ ngày lễ có thể khác; xác nhận với đơn vị vận hành trước chuyến đi.',
  'The official product page lists Monday–Sunday, 09:00–17:00. Holiday hours may differ; confirm with the operator before travelling.',
  'https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay',
  'Trang sản phẩm chính thức The Amazing Bay','2026-10-15',true
from generate_series(0,6) as v(weekday)
where not exists (
  select 1 from public.place_hours h
  where h.place_id='amazing-bay' and h.weekday=v.weekday
    and h.source_url='https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay'
    and h.checked_at='2026-10-15'
);
