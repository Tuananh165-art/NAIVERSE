-- A business directory reports the schedule. Keep it explicitly unverified
-- until the park operator confirms current weekday and holiday hours.
insert into public.place_hours
  (place_id, weekday, opens_local, closes_local, status, note, note_en, source_url, source_label, checked_at, approved)
select
  'suoimo', v.weekday, '07:30'::time, '17:00'::time, 'unknown',
  'Danh bạ Viet-Biz liệt kê giờ 07:30–17:00 hàng ngày. Đây không phải xác nhận từ đơn vị vận hành; hãy gọi Suối Mơ để kiểm tra lịch ngày đi, nhất là lễ/Tết.',
  'The Viet-Biz directory lists daily hours as 07:30–17:00. This is not an operator confirmation; call Suoi Mo to verify the schedule for your date, especially public holidays.',
  'https://www.viet-biz.com/c%C3%B4ng-vi%C3%AAn-su%E1%BB%91i-m%C6%A1_5d-0251-6270-777',
  'Danh bạ Viet-Biz; lịch chưa được Suối Mơ xác nhận', '2026-10-15', true
from generate_series(0, 6) as v(weekday)
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'suoimo'
    and h.weekday = v.weekday
    and h.source_url = 'https://www.viet-biz.com/c%C3%B4ng-vi%C3%AAn-su%E1%BB%91i-m%C6%A1_5d-0251-6270-777'
    and h.checked_at = '2026-10-15'
);
