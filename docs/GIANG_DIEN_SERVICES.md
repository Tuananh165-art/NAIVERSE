# Thác Giang Điền: giờ và giá dịch vụ

Đối chiếu ngày 15/10/2026 từ website nhà vận hành. Các giờ bên dưới thuộc dịch vụ con, không đại diện giờ mở cổng hoặc toàn khu du lịch.

| Dịch vụ | Dữ liệu website nhà vận hành | Trạng thái NaiVerse |
|---|---|---|
| Nhà hàng Hoa Sứ | Thứ Hai–Chủ Nhật, 08:00–21:00 | `verified`; vẫn xác nhận ngày lễ và tình trạng phục vụ |
| Nhà hàng Hoàng Yến | 08:00–17:00; không nêu ngày trong tuần | `unknown`; hỏi cơ sở về ngày phục vụ |
| Khách sạn Tre Xanh | Nói đón khách 24/24; không xác nhận phòng còn trống hay giờ nhận/trả phòng | `unknown`; cần xác nhận trực tiếp |
| Phòng Khách sạn Tre Xanh | Trang hiển thị 650.000 ₫ gạch giá và 550.000 ₫; mô tả lưu trú một đêm | `unknown`; đơn vị tính, sức chứa và hạn ưu đãi không rõ; không cộng vào dự toán |
| Combo camping 03 – sân B | Trang sản phẩm hiển thị 699.000 ₫ gạch giá và 599.000 ₫; liệt kê vé cổng/tắm thác, lều qua đêm, tiện ích và các bữa ăn | `unknown`; không nêu đơn vị giá, sức chứa hoặc hạn ưu đãi; không cộng vào dự toán |

## Áp dụng migration và kiểm tra

1. Áp dụng các migration từ `0001` đến `0031` theo [Hướng dẫn cài đặt](HUONG_DAN.md), sau đó lần lượt chạy `0032_giang_dien_operator_services.sql` và `0033_giang_dien_combo3_current_operator_page.sql` trong Supabase SQL Editor.
2. Mở `/vi/places/giang-dien-waterfall` và kiểm tra các mục giờ, giá, trạng thái, ngày rà soát và liên kết nguồn.
3. Đối chiếu bảng `place_hours`: ba bản ghi có URL nguồn là `nha-hang-hoa-su`, `nha-hang-hoang-yen` và trang sản phẩm `leu-a`; chỉ Hoa Sứ mang trạng thái `verified`.
4. Đối chiếu `price_references`: giá 550.000 ₫ khách sạn và 599.000 ₫ Combo 3 đều có `status = 'unknown'`; không được dùng làm tổng chi phí chuyến đi.
5. Nếu trang không có Supabase hoặc migration chưa chạy, fallback offline phải hiển thị cùng các bản ghi và nhãn như trên.

## Nguồn sơ cấp

- [Nhà hàng Hoa Sứ](https://giangdien.vn/nha-hang/nha-hang-hoa-su/): ghi rõ hoạt động từ Thứ Hai đến Chủ Nhật, 08:00–21:00.
- [Nhà hàng Hoàng Yến](https://giangdien.vn/nha-hang/nha-hang-hoang-yen/): nêu 08:00–17:00, không nêu lịch ngày.
- [Phòng Khách sạn Tre Xanh](https://giangdien.vn/san-pham/leu-a/): giá hiển thị, mô tả một đêm, 18 phòng và 2 phòng tập thể; nói đón khách 24/24.
- [Lều Combo 3 Sàn B](https://giangdien.vn/san-pham/leu-san-b-combo3/): đang hiển thị 599.000 ₫ (giá gạch 699.000 ₫), mô tả thành phần lưu trú và bữa ăn; trang không nêu đơn vị giá, sức chứa hoặc ngày hết hạn ưu đãi. Đối chiếu 15/10/2026; giữ `unknown` và hỏi nhà vận hành trước khi đặt.
- [Liên hệ nhà vận hành](https://giangdien.vn/lien-he/): tổng đài 0251 392 3930, hotline 0912 810 028 / 0911 980 931, email kinhdoanh@giangdien.vn. Gọi để xác nhận giờ, chỗ trống và giá trước chuyến đi.

Trang nguồn hiện không nêu quyền tái sử dụng ảnh, ngày áp dụng của giá khách sạn, hay giờ mở cổng toàn khu; NaiVerse không suy diễn các dữ liệu đó.
