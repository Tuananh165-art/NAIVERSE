-- Reconcile the old camping price sheet with the operator's current product page.
-- Source checked 2026-10-15: https://giangdien.vn/san-pham/leu-san-a/
update public.price_references
set audience = 'Mỗi khách; áp dụng từ 2 khách',
    status = 'verified',
    source_url = 'https://giangdien.vn/san-pham/leu-san-a/',
    source_label = 'Trang sản phẩm combo 1 lều A của nhà vận hành',
    checked_at = '2026-10-15',
    terms = 'Trang sản phẩm đang hiển thị 449.000 ₫/khách (giá gạch 550.000 ₫), chỉ áp dụng từ 2 khách; trẻ dưới 1,4 m miễn phí, trên 1,4 m tính như người lớn. Gói gồm vé cổng, lều sàn qua đêm, một số dịch vụ và bữa ăn như mô tả; không gồm nước uống. Xác nhận giá theo ngày trước khi đặt.'
where place_id = 'giang-dien-waterfall'
  and item_label = 'Combo camping 01 – lều A'
  and audience = 'Mỗi khách'
  and amount_vnd = 449000
  and status = 'unknown'
  and source_url = 'https://giangdien.vn/wp-content/uploads/2024/08/1.png';

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,source_url,source_label,checked_at,terms,approved)
select 'giang-dien-waterfall','Combo camping 01 – lều A','Mỗi khách; áp dụng từ 2 khách',449000,'verified',
  'https://giangdien.vn/san-pham/leu-san-a/','Trang sản phẩm combo 1 lều A của nhà vận hành','2026-10-15',
  'Trang sản phẩm đang hiển thị 449.000 ₫/khách (giá gạch 550.000 ₫), chỉ áp dụng từ 2 khách; trẻ dưới 1,4 m miễn phí, trên 1,4 m tính như người lớn. Gói gồm vé cổng, lều sàn qua đêm, một số dịch vụ và bữa ăn như mô tả; không gồm nước uống. Xác nhận giá theo ngày trước khi đặt.',true
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'giang-dien-waterfall'
    and p.item_label = 'Combo camping 01 – lều A'
    and p.source_url = 'https://giangdien.vn/san-pham/leu-san-a/'
);

-- -1 means a source reports general hours but gives no weekday-specific schedule.
alter table public.place_hours drop constraint if exists place_hours_weekday_check;
alter table public.place_hours add constraint place_hours_weekday_check check (weekday between -1 and 6);

insert into public.place_hours
  (place_id,weekday,opens_local,closes_local,status,note,note_en,source_url,source_label,checked_at,approved)
select 'giang-dien-waterfall',-1,'07:30','17:00','unknown',
  'Trang sản phẩm của nhà vận hành ghi giờ hoạt động khu vui chơi 07:30–17:00. Trang không nêu lịch/ngoại lệ theo từng ngày; xác nhận ngày đi và ngày lễ với cơ sở.',
  'The operator product page reports park activity hours of 07:30–17:00. It does not specify a weekday schedule or exceptions; confirm your visit date and holidays with the operator.',
  'https://giangdien.vn/san-pham/leu-san-a/',
  'Trang sản phẩm chính thức Thác Giang Điền; giờ chung, ngày áp dụng chưa nêu','2026-10-15',true
where not exists (
  select 1 from public.place_hours h
  where h.place_id = 'giang-dien-waterfall' and h.weekday = -1
    and h.source_url = 'https://giangdien.vn/san-pham/leu-san-a/'
);
