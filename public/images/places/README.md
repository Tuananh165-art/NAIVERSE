# Tiếp nhận ảnh địa điểm NaiVerse

## Bộ ảnh đã nhận (15/10/2026)

14 ảnh người dùng xác nhận quyền sử dụng đã được đặt trong thư mục triển khai này. Ảnh `bu-lach-grassland.jpg` là trảng cỏ Bù Lạch, được gắn vào hồ sơ cùng tên; không dùng cho nhóm trải nghiệm nghề/ẩm thực cộng đồng. Các ảnh giữ nguyên watermark và được ghi credit theo quyền trực tiếp do người dùng xác nhận; tác giả/URL license riêng chưa được cung cấp.

Tác giả/credit, ngày chụp và URL công khai chứng minh phạm vi cấp quyền chưa được cung cấp. Ứng dụng hiện ghi rõ người dùng cấp quyền trực tiếp, không tạo tên tác giả hay liên kết license giả. Nếu phạm vi quyền không bao gồm lưu trữ trong repository công khai và phân phối website, hãy gỡ file triển khai khỏi Git và chuyển sang kho lưu trữ riêng có kiểm soát.

Hãy đặt ảnh được cấp quyền trong thư mục này và đặt tên theo `place_id` ở bảng dưới. Không đưa giấy tờ cấp quyền, email, thông tin cá nhân hoặc file mật vào Git.

| Tên file gợi ý | `place_id` | Địa điểm |
|---|---|---|
| `amazing-bay-01.jpg` | `amazing-bay` | The Amazing Bay – Vịnh Kỳ Diệu |
| `son-tien-amazing-world-01.jpg` | `son-tien-amazing-world` | Sơn Tiên Amazing World |
| `ong-pagoda-01.jpg` | `ong-pagoda` | Thất phủ cổ miếu (Chùa Ông) |
| `tan-trieu-orchards-01.jpg` | `tan-trieu-orchards` | Làng bưởi Tân Triều và vườn địa phương |
| `nam-hue-orchard-01.jpg` | `nam-hue-orchard` | Làng bưởi Năm Huệ |
| `phu-dien-fields-01.jpg` | `phu-dien-fields` | Trải nghiệm đồng lúa Phú Điền |
| `binh-loc-orchards-01.jpg` | `binh-loc-orchards` | Vườn trái cây Bình Lộc và Long Khánh |
| `da-han-waterfall-01.jpg` | `da-han-waterfall` | Thác Đá Hàn |
| `long-khanh-fruit-festival-01.jpg` | `long-khanh-fruit-festival` | Lễ hội trái cây Long Khánh |
| `bu-lach-grassland.jpg` | `bu-lach-grassland` | Trảng cỏ Bù Lạch |
| `ta-thiet-01.jpg` | `ta-thiet` | Di tích Căn cứ Tà Thiết |
| `loc-ninh-meeting-house-01.jpg` | `loc-ninh-meeting-house` | Nhà Giao tế Lộc Ninh |
| `my-le-eco-resort-01.jpg` | `my-le-eco-resort` | Khu du lịch sinh thái Mỹ Lệ |
| `dak-mai-waterfall-01.jpg` | `dak-mai-waterfall` | Thác Đắk Mai |

Nếu có nhiều ảnh cho một hồ sơ, dùng hậu tố `-02`, `-03`. Với các nhóm trải nghiệm có ảnh (`tan-trieu-orchards`, `phu-dien-fields`, `binh-loc-orchards`), cần ghi rõ vườn/hộ cụ thể để ảnh không bị hiểu thành một địa điểm chung hoặc một đơn vị đã tham gia NaiVerse. Nhóm `community-cultural-experiences` được miễn ảnh theo yêu cầu người dùng và tiếp tục dùng artwork minh họa có nhãn.

Khi gửi ảnh, vui lòng kèm nội dung sau cho từng tệp (có thể gửi trong tin nhắn; không cần đưa giấy tờ riêng tư vào repository):

```text
Tệp:
place_id:
Mô tả ảnh bằng tiếng Việt:
Photo alt text in English:
Người chụp/chủ sở hữu cần ghi công:
Nguồn gốc công khai của ảnh (nếu có):
Căn cứ và phạm vi quyền NaiVerse được phép sử dụng:
Ngày chụp (nếu biết):
Ảnh tư liệu cần gắn nhãn archival? (có/không):
Địa điểm/cơ sở cụ thể trong ảnh (đặc biệt với nhóm trải nghiệm):
```

Không ghi ảnh là ảnh địa điểm nếu chưa xác định đúng địa điểm. Quyền dùng ảnh không xác nhận giờ hoạt động, giá, cổng vào, an toàn hoặc khả năng tiếp cận. Sau khi nhận tệp, cần kiểm tra trực quan, tối ưu kích thước, cập nhật catalog và provenance, rồi mới chạy lại kiểm thử. Chỉ ghi vào Git các ảnh mà quyền cho phép phân phối cùng mã nguồn và hiển thị trên website công khai; nếu quyền chỉ cho phép hiển thị trên bản deploy, ảnh phải được lưu trong kho lưu trữ phù hợp thay vì commit vào repository.


## Ảnh Wikimedia Commons đã lưu cục bộ

Các ảnh Wikimedia Commons dùng trong danh mục đã được lưu trong thư mục này để trang địa điểm không phụ thuộc tải ảnh trực tiếp từ máy chủ bên ngoài. Tác giả, trang nguồn, giấy phép và nhãn ảnh tư liệu được giữ trong `PlacePhoto` ở `src/lib/catalog.ts`.
