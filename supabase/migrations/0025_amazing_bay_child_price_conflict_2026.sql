-- Two sources show different child ticket prices; preserve both and exclude them
-- from current-price calculations until the operator reconciles the difference.
update public.price_references
set status = 'conflicting',
    terms = 'FAQ chính thức Sơn Tiên ghi 270.000 ₫ cho trẻ cao 1–1,4 m; hướng dẫn trên cổng bán vé amazingbay.vn ghi 279.000 ₫. Hai nguồn chưa được đơn vị vận hành đối soát; chưa dùng mức này làm giá hiện hành, hãy xác nhận khi đặt vé.'
where place_id = 'amazing-bay'
  and item_label = 'Vé trọn gói The Amazing Bay'
  and audience = 'Trẻ em cao từ 1 m đến 1,4 m'
  and source_url = 'https://www.sontien.com/blogs/faq'
  and checked_at::date = date '2026-10-15';

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select
  'amazing-bay',
  'Vé trọn gói The Amazing Bay',
  'Trẻ em cao từ 1 m đến 1,4 m',
  279000,
  'conflicting',
  'https://amazingbay.vn/huong-dan-dat-ve-online-tai-the-amazing-bay-vinh-ky-dieu/',
  'Hướng dẫn trên cổng bán vé amazingbay.vn (đăng 16/04/2026)',
  timestamptz '2026-10-15 00:00:00+00',
  'Hướng dẫn nêu giá quầy tham khảo 279.000 ₫ và cảnh báo giá có thể đổi theo khuyến mãi/ngày lễ. FAQ chính thức Sơn Tiên ghi 270.000 ₫; chưa đối soát với đơn vị vận hành, không dùng làm báo giá chắc chắn.',
  true
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'amazing-bay'
    and p.item_label = 'Vé trọn gói The Amazing Bay'
    and p.audience = 'Trẻ em cao từ 1 m đến 1,4 m'
    and p.source_url = 'https://amazingbay.vn/huong-dan-dat-ve-online-tai-the-amazing-bay-vinh-ky-dieu/'
);
