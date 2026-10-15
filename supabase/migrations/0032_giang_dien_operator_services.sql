-- Add scoped operator-published hours and a hotel price reference.
-- These are services within Giang Dien, not opening hours for the whole park.

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'giang-dien-waterfall',-1,'08:00','21:00','verified',
  'Nhà vận hành công bố Nhà hàng Hoa Sứ phục vụ từ Thứ Hai đến Chủ Nhật, 08:00–21:00. Giờ này chỉ áp dụng cho nhà hàng, không phải giờ mở cổng hoặc toàn khu; xác nhận ngày lễ và tình trạng phục vụ với cơ sở.',
  'The operator lists Hoa Su Restaurant as open Monday through Sunday, 08:00–21:00. These hours apply only to the restaurant, not the park gate or entire site; confirm holiday service and availability with the venue.',
  'https://giangdien.vn/nha-hang/nha-hang-hoa-su/',
  'Trang nhà hàng chính thức Thác Giang Điền; giờ áp dụng riêng cho Nhà hàng Hoa Sứ','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'giang-dien-waterfall' and h.weekday = -1
    and h.source_url = 'https://giangdien.vn/nha-hang/nha-hang-hoa-su/'
);

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'giang-dien-waterfall',-1,'08:00','17:00','unknown',
  'Trang nhà vận hành liệt kê giờ Nhà hàng Hoàng Yến 08:00–17:00 nhưng không nêu ngày trong tuần. Chỉ áp dụng cho nhà hàng, không phải giờ mở cổng hoặc toàn khu; liên hệ cơ sở để xác nhận ngày phục vụ và ngày lễ.',
  'The operator lists Hoang Yen Restaurant hours as 08:00–17:00 but does not specify weekdays. These hours apply only to the restaurant, not the park gate or entire site; confirm operating days and holidays with the venue.',
  'https://giangdien.vn/nha-hang/nha-hang-hoang-yen/',
  'Trang nhà hàng chính thức Thác Giang Điền; ngày áp dụng chưa nêu','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'giang-dien-waterfall' and h.weekday = -1
    and h.source_url = 'https://giangdien.vn/nha-hang/nha-hang-hoang-yen/'
);

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'giang-dien-waterfall',-1,null,null,'unknown',
  'Trang sản phẩm Khách sạn Tre Xanh nói dịch vụ đón khách 24/24. Thông tin này không xác nhận phòng còn trống, giờ nhận/trả phòng hoặc điều kiện nhận khách; liên hệ trước khi đặt.',
  'The Tre Xanh Hotel product page says it welcomes guests 24/24. This does not confirm room availability, check-in/check-out times or eligibility; contact the operator before booking.',
  'https://giangdien.vn/san-pham/leu-a/',
  'Trang sản phẩm Khách sạn Tre Xanh của nhà vận hành; chưa xác nhận chỗ trống','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'giang-dien-waterfall' and h.weekday = -1
    and h.source_url = 'https://giangdien.vn/san-pham/leu-a/'
    and h.source_label = 'Trang sản phẩm Khách sạn Tre Xanh của nhà vận hành; chưa xác nhận chỗ trống'
);

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'giang-dien-waterfall',
  'Phòng Khách sạn Tre Xanh (giá đang hiển thị)',
  'Một đêm; đơn vị phòng/sức chứa và điều kiện áp dụng chưa nêu rõ',
  550000,'unknown',
  'https://giangdien.vn/san-pham/leu-a/',
  'Trang sản phẩm Khách sạn Tre Xanh của nhà vận hành','2026-10-15',
  'Trang sản phẩm hiển thị giá gạch 650.000 ₫ và giá 550.000 ₫, đồng thời mô tả lưu trú một đêm. Trang không nêu ngày áp dụng ưu đãi, sức chứa/đơn vị tính giá hay điều kiện đặt phòng; đây chỉ là giá tham khảo đang hiển thị, chưa xác minh và không được cộng vào tổng chi phí. Liên hệ nhà vận hành để xác nhận.',
  true
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'giang-dien-waterfall'
    and p.item_label = 'Phòng Khách sạn Tre Xanh (giá đang hiển thị)'
    and p.source_url = 'https://giangdien.vn/san-pham/leu-a/'
);
