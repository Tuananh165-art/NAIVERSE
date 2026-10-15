-- Refresh Combo 3 from the operator's product page, which currently displays
-- 599,000 VND (crossed-out 699,000 VND) but does not state the price unit,
-- package capacity or promotion validity. Keep it unknown and out of totals.
update public.price_references
set audience = 'Đơn vị tính và sức chứa không được nêu',
    source_url = 'https://giangdien.vn/san-pham/leu-san-b-combo3/',
    source_label = 'Trang sản phẩm chính thức Combo 3; thời hạn và đơn vị giá chưa nêu',
    checked_at = '2026-10-15',
    terms = 'Trang sản phẩm đang hiển thị 599.000 ₫ (giá gạch 699.000 ₫), nhưng không nêu ngày hiệu lực ưu đãi, đơn vị tính hay sức chứa; không khẳng định đây là giá mỗi khách/phòng và không cộng vào tổng chi phí. Mô tả gồm vé cổng (tắm thác + nước ngọt), lều sàn qua đêm, phí lưu trú, bàn ghế theo số lượng, dụng cụ ăn uống, lò nướng, bình nước 20 lít và tiện ích vệ sinh/điện; phần mô tả còn liệt kê bữa trưa, BBQ tối và bữa sáng. Xác nhận giá, số người, ngày áp dụng và chi tiết gói với nhà vận hành trước khi đặt.'
where place_id = 'giang-dien-waterfall'
  and item_label = 'Combo camping 03 – sân B'
  and source_url = 'https://giangdien.vn/wp-content/uploads/2024/08/3.png';
