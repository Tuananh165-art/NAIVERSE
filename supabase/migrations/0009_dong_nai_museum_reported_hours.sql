-- The museum's official page still publishes a schedule dated 2023-12-18.
-- Store the schedule as unverified because it has not been reconfirmed recently.
insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'dong-nai-museum',v.weekday,null,null,'unknown',
  'Trang chính thức đăng ngày 18/12/2023 nêu giờ hành chính từ Thứ Ba đến Thứ Sáu: 07:00–11:00 và 13:30–17:00; Thứ Hai, Thứ Bảy và Chủ Nhật cần liên hệ đặt lịch. Lịch chưa được bảo tàng xác nhận lại; vui lòng gọi trước khi đi.',
  'The official page published on 18 Dec 2023 lists administrative visiting hours Tuesday–Friday, 07:00–11:00 and 13:30–17:00; Monday, Saturday and Sunday require prior contact. The schedule has not been reconfirmed by the museum; call before visiting.',
  'https://www.baotangdongnai.com.vn/gio-mo-cua',
  'Website chính thức Bảo tàng Đồng Nai; lịch đăng năm 2023, chưa xác minh lại','2026-10-15',true
from generate_series(0,6) as v(weekday)
where not exists (
  select 1 from public.place_hours h
  where h.place_id='dong-nai-museum' and h.weekday=v.weekday
    and h.source_url='https://www.baotangdongnai.com.vn/gio-mo-cua'
    and h.checked_at='2026-10-15'
);
