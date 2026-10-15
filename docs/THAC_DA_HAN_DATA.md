# Thác Đá Hàn: dữ liệu tham khảo có giới hạn

Đối chiếu ngày 15/10/2026, [Vietgoing](https://vietgoing.com/destination/1011-thac-da-han.html) nêu giờ 07:00–19:00, vé người lớn 50.000 ₫ và vé trẻ em 25.000 ₫; cẩm nang [Vietnam Airlines](https://www.vietnamairlines.com/go/vi/plan-book/travel/travel-guide/dong-nai-co-gi-choi) nêu giờ 07:00–17:00 và giá người lớn 30.000–40.000 ₫, trẻ em 20.000–30.000 ₫; [bài INTOUR](https://intour.vn/kinh-nghiem-du-lich/update-bang-gia-ve-cac-diem-tham-quan-tai-dong-nai-moi-nhat-1695.html) nêu mức người lớn 50.000/65.000/75.000 ₫ theo ngày, trẻ em 35.000/45.000 ₫ và điều kiện chiều cao khác. Đây đều là nguồn du lịch thứ cấp, giờ và giá giữa các nguồn mâu thuẫn; chưa phải xác nhận của nhà vận hành.

NaiVerse lưu cả hai lịch để hiển thị bất đồng; lịch 07:00–19:00 ở trạng thái `unknown`, lịch 07:00–17:00 ở trạng thái `conflicting`. Giá lưu ở trạng thái `conflicting` với `amount_vnd = null`, nên không xuất hiện như giá hiện hành đã xác minh và không được cộng vào tổng. Hãy gọi đơn vị vận hành để xác nhận ngày đi, giờ, giá, điều kiện vé và tình trạng hoạt động.

Migrations `0030_da_han_third_party_price_and_hours.sql` và `0031_da_han_schedule_and_price_source_conflicts.sql` cùng fallback offline ghi các tham khảo này. Không đưa pin Google/OSM của khu tham quan thành tọa độ cổng vào. Các kết quả ảnh tìm được chưa có giấy phép tái sử dụng thương mại đã xác minh, nên ảnh thật vẫn thiếu; artwork trên trang có nhãn minh họa.

## Nguồn đối chiếu

- [Vietgoing: Thác Đá Hàn, Đồng Nai – kinh nghiệm tham quan 2026](https://vietgoing.com/destination/1011-thac-da-han.html)
- [Vietnam Airlines: Cẩm nang vui chơi tại Đồng Nai](https://www.vietnamairlines.com/go/vi/plan-book/travel/travel-guide/dong-nai-co-gi-choi)
- [INTOUR: bảng giá tham quan Đồng Nai, mục Thác Đá Hàn](https://intour.vn/kinh-nghiem-du-lich/update-bang-gia-ve-cac-diem-tham-quan-tai-dong-nai-moi-nhat-1695.html)
- [Cổng thông tin Đồng Nai: vị trí khu vực và tình hình phát triển du lịch được ghi năm 2019](https://dongnai.gov.vn/vi/wcag/Chuong-trinh-Ke-hoach-phat-trien-KTXH/du-lich-dong-nai-nhieu-thac-dep-noi-tieng-2788.html)
