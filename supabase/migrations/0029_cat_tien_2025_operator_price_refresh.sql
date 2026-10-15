-- Reconcile Cat Tien public rates against the operator's latest domestic
-- visitor PDF found on 2026-10-15. The PDF states these rates remain effective
-- from 2024-06-01 until replaced; this does not prove date-specific inventory.
update public.price_references
set source_url = 'https://cattiennationalpark.com.vn/wp-content/uploads/2024/06/bang-gia-khach-noi-dia-2025.pdf',
    source_label = 'Bảng giá khách nội địa do Trung tâm GDMT và Dịch vụ VQG Cát Tiên công bố; hiệu lực đến khi có bảng mới',
    terms = case
      when item_label like 'Vé vào Vườn%'
        and position('Bảng chính thức dành cho khách nội địa nêu hiệu lực từ 01/06/2024' in terms) = 0
        then terms || ' Bảng chính thức dành cho khách nội địa nêu hiệu lực từ 01/06/2024 đến khi có bảng mới thay thế; xác nhận lại trước chuyến đi.'
      else terms
    end
where place_id = 'cat-tien'
  and source_url = 'https://cattiennationalpark.com.vn/wp-content/uploads/2025/07/Bang-gia-2024-co-moc-dau.pdf';

insert into public.price_references
  (place_id,item_label,audience,amount_vnd,status,valid_from,source_url,source_label,checked_at,terms,approved)
select 'cat-tien', v.item_label, v.audience, v.amount_vnd, v.status, '2024-06-01',
  'https://cattiennationalpark.com.vn/wp-content/uploads/2024/06/bang-gia-khach-noi-dia-2025.pdf',
  'Bảng giá khách nội địa do Trung tâm GDMT và Dịch vụ VQG Cát Tiên công bố; hiệu lực đến khi có bảng mới',
  '2026-10-15', v.terms, true
from (values
  ('Tham quan Bảo tàng thiên nhiên và Trung tâm cứu hộ động vật','Người lớn, mỗi vé',50000::bigint,'verified','Bảng nêu khung giờ bắt đầu 08:30, 10:00, 13:30 và 15:00 hằng ngày. Khoản vé tham quan riêng, ngoài vé vào Vườn; xác nhận lịch và chỗ trước khi đi.'),
  ('Tham quan Bảo tàng thiên nhiên và Trung tâm cứu hộ động vật','Trẻ em dưới 1,5 m, mỗi vé',25000::bigint,'verified','Bảng nêu khung giờ bắt đầu 08:30, 10:00, 13:30 và 15:00 hằng ngày. Khoản vé tham quan riêng, ngoài vé vào Vườn; xác nhận lịch và chỗ trước khi đi.'),
  ('Tour Trung tâm cứu hộ Linh trưởng – Đảo Tiên','Người lớn, mỗi vé',100000::bigint,'verified','Bảng nêu một tour lúc 08:30 hằng ngày, tối đa 30 khách, cần đặt trước 07:30. Vé là khoản riêng ngoài vé vào Vườn; xác nhận chỗ và điều kiện trước khi đi.'),
  ('Tour Trung tâm cứu hộ Linh trưởng – Đảo Tiên','Trẻ em dưới 1,5 m, mỗi vé',50000::bigint,'verified','Bảng nêu một tour lúc 08:30 hằng ngày, tối đa 30 khách, cần đặt trước 07:30. Vé là khoản riêng ngoài vé vào Vườn; xác nhận chỗ và điều kiện trước khi đi.'),
  ('Phí tham quan Bàu Sấu trong ngày','Mỗi khách; chưa gồm xe và hướng dẫn viên',250000::bigint,'verified','Bảng mô tả tuyến khoảng 14 km, gồm 9 km có thể đi ô tô/xe đạp và 5 km đi bộ trong rừng; không nêu phương thức thay thế cho đoạn đi bộ. Nên khởi hành buổi sáng; xác nhận điều kiện tuyến và thời tiết với Vườn.'),
  ('Xe ô tô tuyến Bàu Sấu khứ hồi','Nhóm 1–7 khách; giá nhóm, có thể đi ghép xe',700000::bigint,'verified','Giá xe chưa gồm phí tham quan Bàu Sấu và hướng dẫn viên. Bảng lưu ý nhóm có thể đi chung xe, không phải bao trọn chuyến; xác nhận phương tiện, chỗ và lịch thực tế.'),
  ('Hướng dẫn viên tuyến Bàu Sấu trong ngày','Mỗi hướng dẫn viên, khoảng 5 giờ',null::bigint,'unknown','Bảng giá nêu khoảng 550.000–650.000 ₫/hướng dẫn viên, không có một số tiền cố định. Xác nhận giá cuối cùng; không dùng một đầu khoảng làm báo giá chắc chắn.')
) as v(item_label,audience,amount_vnd,status,terms)
where not exists (
  select 1 from public.price_references p
  where p.place_id='cat-tien'
    and p.item_label=v.item_label
    and p.audience=v.audience
    and p.source_url='https://cattiennationalpark.com.vn/wp-content/uploads/2024/06/bang-gia-khach-noi-dia-2025.pdf'
);
