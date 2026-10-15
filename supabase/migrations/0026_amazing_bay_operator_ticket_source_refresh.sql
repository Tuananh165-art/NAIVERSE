-- Refresh Amazing Bay price provenance to the operator's live ticket product.
-- Preserve the child-price conflict with the separate ticket-guide source.
update public.price_references
set source_url = 'https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay',
    source_label = 'Trang bán vé chính thức Sơn Tiên — The Amazing Bay',
    checked_at = date '2026-10-15',
    terms = 'Tại thời điểm đối chiếu, trang bán vé chính thức hiển thị 490.000 ₫ cho người lớn cao từ 1,4 m. Giá/ưu đãi theo ngày có thể đổi; kiểm tra giá ở bước chọn ngày và thanh toán.'
where place_id = 'amazing-bay'
  and item_label = 'Vé trọn gói The Amazing Bay'
  and audience = 'Người lớn (trên 1,4 m)'
  and amount_vnd = 490000
  and status = 'verified'
  and source_url = 'https://www.sontien.com/blogs/faq';

update public.price_references
set source_url = 'https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay',
    source_label = 'Trang bán vé chính thức Sơn Tiên — The Amazing Bay',
    checked_at = date '2026-10-15',
    terms = 'Trang bán vé chính thức hiển thị 270.000 ₫ cho trẻ cao 1 m–1 m 39; hướng dẫn trên cổng bán vé amazingbay.vn ghi 279.000 ₫. Giữ trạng thái mâu thuẫn và không dùng làm giá chắc chắn đến khi đối soát; xác nhận mức theo ngày trước khi mua.'
where place_id = 'amazing-bay'
  and item_label = 'Vé trọn gói The Amazing Bay'
  and audience = 'Trẻ em cao từ 1 m đến 1,4 m'
  and amount_vnd = 270000
  and status = 'conflicting'
  and source_url = 'https://www.sontien.com/blogs/faq';
