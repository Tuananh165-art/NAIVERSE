-- Operator-published Giang Dien camping package and tent prices checked 2026-10-15.
-- The official page links undated image files from its August 2024 uploads directory.
-- Preserve them as unknown validity: display as unconfirmed notes, never as current trip costs.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'giang-dien-waterfall', v.item_label, v.audience, v.amount_vnd, 'unknown',
  'https://giangdien.vn/wp-content/uploads/2024/08/' || v.image_file,
  'Bảng dịch vụ chính thức Thác Giang Điền; tệp không ghi ngày hiệu lực', '2026-10-15', v.terms, true
from (values
  ('Combo camping 01 – lều A','Mỗi khách',449000::bigint,'1.png','Bảng ghi 449.000 ₫/khách, gồm vé cổng và dịch vụ lưu trú/ăn uống theo combo. Tệp bảng giá không ghi ngày áp dụng; không coi là giá hiện hành, cần xác nhận với cơ sở.'),
  ('Combo camping 02 – lều A','Mỗi khách',649000::bigint,'2.png','Bảng ghi 649.000 ₫/khách, gồm vé cổng và dịch vụ lưu trú/ăn uống theo combo. Tệp bảng giá không ghi ngày áp dụng; không coi là giá hiện hành, cần xác nhận với cơ sở.'),
  ('Combo camping 03 – sân B','Mỗi khách',599000::bigint,'3.png','Bảng ghi 599.000 ₫/khách, gồm vé cổng và dịch vụ lưu trú/ăn uống theo combo. Tệp bảng giá không ghi ngày áp dụng; không coi là giá hiện hành, cần xác nhận với cơ sở.'),
  ('Combo camping 04 – sân B','Mỗi khách',799000::bigint,'4.png','Bảng ghi 799.000 ₫/khách, gồm vé cổng và dịch vụ lưu trú/ăn uống theo combo. Tệp bảng giá không ghi ngày áp dụng; không coi là giá hiện hành, cần xác nhận với cơ sở.'),
  ('Combo camping 05 – sân B','Mỗi khách',999000::bigint,'5.png','Bảng ghi 999.000 ₫/khách, gồm vé cổng và dịch vụ lưu trú/ăn uống theo combo. Tệp bảng giá không ghi ngày áp dụng; không coi là giá hiện hành, cần xác nhận với cơ sở.'),
  ('Thuê lều sàn qua đêm','Mỗi lều, 1–2 khách',500000::bigint,'6.png','Bảng ghi 500.000 ₫/lều, nhận phòng 14:00, trả phòng 12:00; phụ thu khách thứ ba từ 200.000 ₫/khách. Tệp không ghi ngày hiệu lực; xác nhận với cơ sở.'),
  ('Thuê lều sàn trong ngày','Mỗi lều, 1–2 khách',400000::bigint,'6.png','Bảng ghi 400.000 ₫/lều, nhận phòng 08:00, trả phòng 17:00; phụ thu khách thứ ba từ 150.000 ₫/khách. Tệp không ghi ngày hiệu lực; xác nhận với cơ sở.'),
  ('Thuê lều sàn theo giờ','Mỗi lều, tối đa 2 khách; 1–2 giờ',200000::bigint,'6.png','Bảng ghi 200.000 ₫/lều cho 1–2 giờ, mỗi giờ tiếp theo phụ thu 100.000 ₫. Tệp không ghi ngày hiệu lực và không nêu rõ vé cổng đã bao gồm; xác nhận với cơ sở.'),
  ('Thuê lều cắm trại qua đêm','Mỗi lều, 1–2 khách',400000::bigint,'6.png','Bảng ghi 400.000 ₫/lều, nhận phòng 14:00, trả phòng 12:00; phụ thu khách thứ ba từ 150.000 ₫/khách. Tệp không ghi ngày hiệu lực; xác nhận với cơ sở.'),
  ('Thuê lều cắm trại trong ngày','Mỗi lều, 1–2 khách',350000::bigint,'6.png','Bảng ghi 350.000 ₫/lều, nhận phòng 08:00, trả phòng 17:00; phụ thu khách thứ ba từ 150.000 ₫/khách. Tệp không ghi ngày hiệu lực; xác nhận với cơ sở.'),
  ('Thuê lều cắm trại theo giờ','Mỗi lều, tối đa 2 khách; 1–2 giờ',180000::bigint,'6.png','Bảng ghi 180.000 ₫/lều cho 1–2 giờ, mỗi giờ tiếp theo phụ thu 100.000 ₫; giá chưa gồm vé cổng. Tệp không ghi ngày hiệu lực; xác nhận với cơ sở.')
) as v(item_label,audience,amount_vnd,image_file,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='giang-dien-waterfall' and p.item_label=v.item_label
    and p.audience=v.audience
    and (
      p.source_url=('https://giangdien.vn/wp-content/uploads/2024/08/' || v.image_file)
      or (v.item_label='Combo camping 01 – lều A' and p.source_url='https://giangdien.vn/san-pham/leu-san-a/')
    )
);
