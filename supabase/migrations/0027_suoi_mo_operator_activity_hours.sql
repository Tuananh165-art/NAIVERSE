-- The operator's current page lists activity hours, not confirmed gate/whole-park hours.
-- Keep the older business-directory schedule for audit, but mark it historical.
update public.place_hours
set status = 'historical',
    note = 'Lịch 07:30–17:00 do danh bạ Viet-Biz liệt kê đã được thay thế trong phần tham khảo bởi giờ hoạt động do nhà vận hành công bố. Bản ghi cũ không xác nhận giờ mở cổng/toàn khu; liên hệ Suối Mơ trước khi đi.',
    note_en = 'The Viet-Biz directory schedule of 07:30–17:00 is superseded in the reference display by activity hours published by the operator. This older record does not confirm gate/whole-park hours; contact Suoi Mo before travelling.'
where place_id = 'suoimo'
  and source_url = 'https://www.viet-biz.com/c%C3%B4ng-vi%C3%AAn-su%E1%BB%91i-m%C6%A1_5d-0251-6270-777'
  and status = 'unknown';

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'suoimo',-1,'08:00','17:00','unknown',
  'Trang chính thức Suối Mơ nêu 08:00–17:00 cho các hoạt động vui chơi, hồ bơi thiên nhiên và team building. Trang không xác nhận giờ mở cổng/toàn khu hoặc lịch ngoại lệ theo ngày; liên hệ cơ sở để xác nhận trước chuyến đi.',
  'The official Suoi Mo page lists 08:00–17:00 for recreational activities, natural pools and team building. It does not confirm whole-park/gate hours or weekday exceptions; contact the operator before travelling.',
  'https://suoimopark.com/vn/visit-picnic',
  'Trang chính thức Suối Mơ; giờ các hoạt động được nêu, chưa xác nhận giờ cổng','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'suoimo'
    and h.weekday = -1
    and h.source_url = 'https://suoimopark.com/vn/visit-picnic'
    and h.checked_at = '2026-10-15'
);
