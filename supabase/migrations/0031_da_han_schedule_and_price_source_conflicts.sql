-- Add another secondary guide that conflicts with Da Han hours and ticket rates.
-- This keeps the price unknown to calculations and preserves both reported schedules.
update public.price_references
set source_label = 'Vietgoing (tham khảo 2026), INTOUR (tham khảo 2025), Vietnam Airlines (tham khảo 2026)',
    terms = 'Vietgoing nêu vé người lớn 50.000 VND, trẻ 1–1,4 m 25.000 VND, dưới 1 m miễn phí. Bài INTOUR ghi giá người lớn 50.000/65.000/75.000 VND theo ngày thường/cuối tuần/lễ; trẻ em 35.000/45.000 VND và ngưỡng chiều cao khác. Cẩm nang Vietnam Airlines ghi vé người lớn 30.000–40.000 VND, trẻ em 20.000–30.000 VND. Các nguồn du lịch thứ cấp không phải bảng giá do nhà vận hành xác nhận; để số tiền null, không dùng trong tổng chi phí, hãy hỏi cơ sở trước chuyến đi. Nguồn đối chiếu: https://intour.vn/kinh-nghiem-du-lich/update-bang-gia-ve-cac-diem-tham-quan-tai-dong-nai-moi-nhat-1695.html và https://www.vietnamairlines.com/go/vi/plan-book/travel/travel-guide/dong-nai-co-gi-choi'
where place_id = 'da-han-waterfall'
  and item_label = 'Vé cổng Thác Đá Hàn (nguồn thứ cấp, giá mâu thuẫn)'
  and source_url = 'https://vietgoing.com/destination/1011-thac-da-han.html'
  and status = 'conflicting';

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'da-han-waterfall',-1,'07:00','17:00','conflicting',
  'Cẩm nang Vietnam Airlines nêu giờ 07:00–17:00, khác với lịch 07:00–19:00 của Vietgoing. Cả hai là nguồn du lịch thứ cấp, chưa được nhà vận hành xác nhận; hỏi cơ sở trước chuyến đi.',
  'Vietnam Airlines lists 07:00–17:00, differing from Vietgoing’s 07:00–19:00 schedule. Both are secondary travel sources and are not operator-confirmed; contact the venue before travelling.',
  'https://www.vietnamairlines.com/go/vi/plan-book/travel/travel-guide/dong-nai-co-gi-choi',
  'Vietnam Airlines travel guide, secondary source; conflicting schedule','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'da-han-waterfall' and h.weekday = -1
    and h.source_url = 'https://www.vietnamairlines.com/go/vi/plan-book/travel/travel-guide/dong-nai-co-gi-choi'
);
