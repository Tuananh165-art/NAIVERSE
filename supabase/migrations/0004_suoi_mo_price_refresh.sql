-- Official Suoi Mo 2025 price sheet says these rates apply from 2025-01-25
-- until another policy replaces them. Rechecked on 2026-10-15; callers should
-- still confirm the amount and conditions with the operator before purchase.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,valid_to,source_url,source_label,checked_at,terms,approved)
select 'suoimo', v.item_label, v.audience, v.amount_vnd, 'verified', '2025-01-25', null,
  'https://suoimopark.com/uploads/BANG%20GIA/Bang%20Gia%20Suoi%20Mo%202025.pdf',
  'Bảng giá chính thức Suối Mơ; ghi áp dụng đến khi có chính sách thay thế', '2026-10-15', v.terms, true
from (values
  ('Vé cổng Suối Mơ','Người lớn (T2–CN)',130000::bigint,'Bảng giá ghi 130.000 ₫ ngày T2–CN và áp dụng từ 25/01/2025 đến khi có chính sách khác thay thế. Giá gồm VAT; xác nhận với đơn vị trước khi mua.'),
  ('Vé cổng Suối Mơ','Người lớn (Lễ, Tết)',150000::bigint,'Bảng giá ghi 150.000 ₫ ngày Lễ, Tết và áp dụng từ 25/01/2025 đến khi có chính sách khác thay thế. Giá gồm VAT; xác nhận với đơn vị trước khi mua.'),
  ('Vé cổng Suối Mơ','Trẻ em cao 1 m–1,4 m (T2–CN)',60000::bigint,'Bảng giá ghi 60.000 ₫ ngày T2–CN cho trẻ cao 1 m–1,4 m, áp dụng từ 25/01/2025 đến khi có chính sách khác thay thế. Xác nhận trước khi mua.'),
  ('Vé cổng Suối Mơ','Trẻ em cao 1 m–1,4 m (Lễ, Tết)',70000::bigint,'Bảng giá ghi 70.000 ₫ ngày Lễ, Tết cho trẻ cao 1 m–1,4 m, áp dụng từ 25/01/2025 đến khi có chính sách khác thay thế. Xác nhận trước khi mua.'),
  ('Vé cổng Suối Mơ','Trẻ em dưới 1 m (mọi ngày)',0::bigint,'Ghi chú bảng giá nêu miễn phí cho trẻ cao dưới 1 m. Bảng ghi áp dụng đến khi có chính sách khác thay thế; xác nhận điều kiện đo chiều cao trước khi mua.')
) as v(item_label,audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='suoimo' and p.item_label=v.item_label and p.audience=v.audience
    and p.source_url='https://suoimopark.com/uploads/BANG%20GIA/Bang%20Gia%20Suoi%20Mo%202025.pdf'
);
