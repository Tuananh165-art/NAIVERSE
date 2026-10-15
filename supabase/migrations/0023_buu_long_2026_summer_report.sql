-- Báo Đồng Nai quoted Bửu Long management on 2026-08-07. The listed summer
-- promotion ended on 2026-08-31. Preserve it as historical evidence; do not
-- present any of these amounts as current prices.
update public.place_hours
set status = 'unknown',
    note = 'Báo Đồng Nai ngày 07/08/2026 dẫn Ban Giám đốc: mở cửa 07:00–17:00 các ngày trừ thứ Ba; thứ Ba vẫn mở dịp lễ/Tết. Chưa được xác nhận lại sau ngày đăng; hãy liên hệ cơ sở trước khi đi.',
    note_en = 'On 7 Aug 2026, Báo Đồng Nai quoted the venue director: open 07:00–17:00 except Tuesdays, with Tuesday openings on public holidays. Not reconfirmed since publication; contact the venue before travelling.',
    source_url = 'https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/',
    source_label = 'Báo Đồng Nai dẫn Ban Giám đốc; lịch được nêu ngày 07/08/2026, chưa xác nhận lại',
    checked_at = '2026-08-07'
where place_id = 'buu-long'
  and source_url = 'https://buulong.com.vn/gio-mo-cua'
  and checked_at = '2026-10-15';

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_to,source_url,source_label,checked_at,terms,approved)
select 'buu-long', v.item_label, v.audience, v.amount_vnd, 'historical', v.valid_to,
  'https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/',
  'Báo Đồng Nai dẫn thông tin Ban Giám đốc KDL Bửu Long', '2026-08-07', v.terms, true
from (values
  ('Vé vào cổng tham quan Bửu Long','Người lớn cao trên 1,4 m',100000::bigint,null::date,'Bài báo ngày 07/08/2026 dẫn giá tại thời điểm đưa tin; bài không xác định thời hạn áp dụng giá cơ bản này. Chỉ là giá lịch sử, không phải giá hiện hành; xác nhận với cơ sở.'),
  ('Combo trò chơi Bửu Long','Người lớn cao trên 1,4 m',50000::bigint,null::date,'Bài báo ngày 07/08/2026 mô tả combo trò chơi bán riêng; thời hạn áp dụng mức giá này không được nêu. Chỉ là giá lịch sử, không phải giá hiện hành.'),
  ('Combo tham quan và vui chơi Bửu Long','Trẻ em cao từ 1 m đến 1,4 m',60000::bigint,null::date,'Bài báo ngày 07/08/2026 nêu combo tham quan, vui chơi cho trẻ cao 1–1,4 m tại thời điểm đưa tin; không phải giá hiện hành.'),
  ('Combo trò chơi ưu đãi mùa hè Bửu Long','Trẻ em dưới 1,4 m; chương trình mùa hè 2026',30000::bigint,'2026-08-31'::date,'Bài báo cho biết ưu đãi mùa hè áp dụng đến hết tháng 08/2026. Mức giá và điều kiện đã hết hạn; không sử dụng làm giá hiện tại.'),
  ('Vé vào cổng ưu đãi mùa hè Bửu Long','Trẻ em dưới 1,4 m; chương trình mùa hè 2026',0::bigint,'2026-08-31'::date,'Bài báo cho biết miễn vé vào cổng cho trẻ dưới 1,4 m trong chương trình mùa hè 2026 đến hết tháng 08. Ưu đãi đã hết hạn; không dùng làm chính sách hiện tại.')
) as v(item_label,audience,amount_vnd,valid_to,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id = 'buu-long'
    and p.item_label = v.item_label
    and p.audience = v.audience
    and p.source_url = 'https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/'
    and p.checked_at = '2026-08-07'
);
