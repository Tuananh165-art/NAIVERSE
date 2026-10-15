-- Historical Buu Long ticket rates reported by the official Dong Nai portal
-- for the 2026-04-26 Hung Kings holiday. These are not current prices.
insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,valid_to,source_url,source_label,checked_at,terms,approved)
select 'buu-long','Vé vào cổng Bửu Long',v.audience,v.amount_vnd,'historical','2026-04-26','2026-04-26',
  'https://dongnai.gov.vn/vi/news/tin-tuc-su-kien/khu-du-lich-buu-long-don-tren-3-ngan-luot-du-khach-trong-ngay-dau-ky-nghi-le-gio-to-hung-vuong-61212.html',
  'Cổng thông tin Đồng Nai dẫn thông tin từ KDL Bửu Long','2026-04-26',v.terms,true
from (values
  ('Người lớn từ 1,4 m',150000::bigint,'Giá được công bố trong dịp Giỗ Tổ Hùng Vương ngày 26/04/2026; không phải báo giá hiện hành. Vé mô tả bao gồm các hạng mục trọn gói nêu trong bài; một số trò chơi tính riêng.'),
  ('Trẻ em cao từ 1 m đến dưới 1,4 m',60000::bigint,'Giá được công bố trong dịp Giỗ Tổ Hùng Vương ngày 26/04/2026; không phải báo giá hiện hành. Xác nhận điều kiện chiều cao với cơ sở.'),
  ('Trẻ em dưới 1 m',0::bigint,'Bài báo nêu miễn vé cho trẻ dưới 1 m trong ngày 26/04/2026; không phải chính sách hiện hành.')
) as v(audience,amount_vnd,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='buu-long' and p.audience=v.audience
    and p.source_url='https://dongnai.gov.vn/vi/news/tin-tuc-su-kien/khu-du-lich-buu-long-don-tren-3-ngan-luot-du-khach-trong-ngay-dau-ky-nghi-le-gio-to-hung-vuong-61212.html'
    and p.checked_at='2026-04-26'
);
