-- Publish only explicitly unverified third-party references for Da Han.
-- Sources checked on 2026-10-15; no operator confirmation was found.

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'da-han-waterfall',
  'Vé cổng Thác Đá Hàn (nguồn thứ cấp, giá mâu thuẫn)',
  'Người lớn/trẻ em; điều kiện chiều cao giữa các nguồn không thống nhất',
  null,'conflicting',
  'https://vietgoing.com/destination/1011-thac-da-han.html',
  'Vietgoing (tham khảo 2026), đối chiếu với bài giá INTOUR (tham khảo 2025)',
  '2026-10-15',
  'Vietgoing nêu vé người lớn 50.000 VND, trẻ 1–1,4 m 25.000 VND, dưới 1 m miễn phí. Bài INTOUR ghi giá người lớn 50.000/65.000/75.000 VND theo ngày thường/cuối tuần/lễ; trẻ em 35.000/45.000 VND và ngưỡng chiều cao khác. Hai nguồn du lịch thứ cấp không phải bảng giá do nhà vận hành xác nhận; để số tiền null, không dùng trong tổng chi phí, hãy hỏi cơ sở trước chuyến đi. Nguồn đối chiếu: https://intour.vn/kinh-nghiem-du-lich/update-bang-gia-ve-cac-diem-tham-quan-tai-dong-nai-moi-nhat-1695.html',
  true
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'da-han-waterfall'
    and p.item_label = 'Vé cổng Thác Đá Hàn (nguồn thứ cấp, giá mâu thuẫn)'
    and p.source_url = 'https://vietgoing.com/destination/1011-thac-da-han.html'
);

alter table public.place_hours drop constraint if exists place_hours_weekday_check;
alter table public.place_hours add constraint place_hours_weekday_check check (weekday between -1 and 6);

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'da-han-waterfall',-1,'07:00','19:00','unknown',
  'Vietgoing nêu giờ 07:00–19:00 mỗi ngày trong trang tham khảo năm 2026. Đây không phải lịch do nhà vận hành xác nhận; liên hệ cơ sở để kiểm tra ngày đi, ngày lễ và tình trạng hoạt động.',
  'Vietgoing lists 07:00–19:00 daily on its 2026 reference page. This is not an operator-confirmed schedule; contact the venue to confirm your date, holidays and operating status.',
  'https://vietgoing.com/destination/1011-thac-da-han.html',
  'Vietgoing, nguồn du lịch thứ cấp; chưa được nhà vận hành xác nhận','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'da-han-waterfall' and h.weekday = -1
    and h.source_url = 'https://vietgoing.com/destination/1011-thac-da-han.html'
);
