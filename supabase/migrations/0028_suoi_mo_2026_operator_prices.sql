-- The operator's 2026 price PDF replaces the earlier 2025 ticket schedule.
-- Source: https://suoimopark.com/uploads/BANG%20GIA/2026.pdf
update public.price_references
set status = 'historical',
    valid_to = '2025-12-31',
    source_label = 'Bảng giá Suối Mơ 2025; đã được thay bằng bảng giá 2026',
    terms = terms || ' Bản giá 2025 được giữ làm lịch sử sau khi nhà vận hành công bố bảng giá 2026.'
where place_id = 'suoimo'
  and source_url = 'https://suoimopark.com/uploads/BANG%20GIA/Bang%20Gia%20Suoi%20Mo%202025.pdf'
  and status = 'verified';

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,valid_to,source_url,source_label,checked_at,terms,approved)
select 'suoimo',v.item_label,v.audience,v.amount_vnd,'verified','2026-01-01',null,
  'https://suoimopark.com/uploads/BANG%20GIA/2026.pdf',
  'Bảng giá chính thức Suối Mơ 2026; áp dụng đến khi có chính sách thay thế','2026-10-15',v.terms,true
from (values
  ('Vé cổng Suối Mơ','Người lớn (T2–CN)',130000::bigint,'Bảng giá 2026 ghi vé người lớn 130.000 ₫ từ Thứ Hai đến Chủ Nhật, đã gồm VAT; vé gồm tắm hồ bơi và tắm lại miễn phí. Xác nhận giá theo ngày trước khi mua.'),
  ('Vé cổng Suối Mơ','Người lớn (Lễ, Tết)',150000::bigint,'Bảng giá 2026 ghi vé người lớn 150.000 ₫ ngày Lễ, Tết, đã gồm VAT; vé gồm tắm hồ bơi và tắm lại miễn phí. Xác nhận giá theo ngày trước khi mua.'),
  ('Vé cổng Suối Mơ','Trẻ em cao 1 m–1,4 m (T2–CN)',60000::bigint,'Bảng giá 2026 ghi vé trẻ em cao 1 m–1,4 m là 60.000 ₫ từ Thứ Hai đến Chủ Nhật, đã gồm VAT. Xác nhận điều kiện đo chiều cao tại quầy.'),
  ('Vé cổng Suối Mơ','Trẻ em cao 1 m–1,4 m (Lễ, Tết)',70000::bigint,'Bảng giá 2026 ghi vé trẻ em cao 1 m–1,4 m là 70.000 ₫ ngày Lễ, Tết, đã gồm VAT. Xác nhận điều kiện đo chiều cao tại quầy.'),
  ('Vé cổng Suối Mơ','Trẻ em dưới 1 m (mọi ngày)',0::bigint,'Ghi chú bảng giá 2026 nêu trẻ em cao dưới 1 m được miễn phí. Xác nhận điều kiện đo chiều cao tại quầy.')
) as v(item_label,audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'suoimo'
    and p.item_label = v.item_label
    and p.audience = v.audience
    and p.source_url = 'https://suoimopark.com/uploads/BANG%20GIA/2026.pdf'
);
