-- Operator product page prices for the Hanh Tinh La nighttime combo.
-- The page does not state the child ticket's age/height criteria, so retain that caveat.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'son-tien-amazing-world', v.item_label, v.audience, v.amount_vnd, 'verified',
  'https://www.sontien.com/products/tham-quan-amazing-world', 'Sơn Tiên official product page', '2026-10-15', v.terms, true
from (values
  ('Combo Hành Tinh Lạ khung giờ đêm (17:00–21:00)','Trẻ em (trang chưa nêu tuổi/chiều cao)',45000::bigint,'Trang sản phẩm của đơn vị vận hành hiển thị giá 45.000 ₫ mỗi vé và ghi combo khung giờ đêm 17:00–21:00. Trang chưa nêu tiêu chí tuổi/chiều cao cho loại vé trẻ em; xác nhận điều kiện và giá theo ngày trên hệ thống đặt vé trước khi mua.'),
  ('Combo Hành Tinh Lạ khung giờ đêm (17:00–21:00)','Người lớn',90000::bigint,'Trang sản phẩm của đơn vị vận hành hiển thị giá 90.000 ₫ mỗi vé cho combo khung giờ đêm 17:00–21:00. Giá có thể thay đổi theo ngày; xác nhận trên hệ thống đặt vé trước khi mua.')
) as v(item_label,audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='son-tien-amazing-world' and p.item_label=v.item_label and p.audience=v.audience
    and p.source_url='https://www.sontien.com/products/tham-quan-amazing-world' and p.checked_at='2026-10-15'
);
