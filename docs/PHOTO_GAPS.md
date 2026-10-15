# Kiểm kê và quy trình bổ sung ảnh địa điểm

## Tình trạng hiện tại

Ngày 15/10/2026, catalog có 29 lượt dùng ảnh trên 22/36 hồ sơ; ảnh rừng Mã Đà dùng ở hai hồ sơ với alt text khác nhau, nên có 28 URL ảnh duy nhất. `npm.cmd run catalog:check-photos` đã kiểm tra HEAD và cả 28 URL đều trả `image/*`. Còn 14 hồ sơ chưa có ảnh đã duyệt, có nguồn và license phù hợp.

### Địa điểm cụ thể đang thiếu ảnh

| ID | Địa điểm | Ảnh cần thu thập |
|---|---|---|
| `amazing-bay` | The Amazing Bay – Vịnh Kỳ Diệu | Ảnh đúng công viên nước, ưu tiên khu vực nhận diện được; không dùng ảnh công viên nước khác. |
| `son-tien-amazing-world` | Sơn Tiên Amazing World | Ảnh đúng khu Amazing World hoặc hạng mục được đơn vị xác nhận. |
| `ong-pagoda` | Thất phủ cổ miếu (Chùa Ông) | Ảnh đúng miếu tại Cù lao Phố, không thay bằng một ngôi chùa cùng tên khác. |
| `nam-hue-orchard` | Làng bưởi Năm Huệ | Ảnh vườn/cơ sở cụ thể, kèm xác nhận chủ thể và quyền sử dụng. |
| `da-han-waterfall` | Thác Đá Hàn | Ảnh đúng thác và khu vực du lịch này, ghi ngày chụp nếu là ảnh tư liệu. |
| `long-khanh-fruit-festival` | Lễ hội trái cây Long Khánh | Ảnh sự kiện tại Long Khánh; ghi năm tổ chức, không hàm ý sự kiện đang diễn ra. |
| `ta-thiet` | Di tích Căn cứ Tà Thiết | Ảnh đúng di tích và khu vực được phép tiếp cận. |
| `loc-ninh-meeting-house` | Nhà Giao tế Lộc Ninh | Ảnh đúng tòa nhà/di tích, không lấy ảnh địa điểm “meeting house” khác. |
| `my-le-eco-resort` | Khu du lịch sinh thái Mỹ Lệ | Ảnh đúng cơ sở; ảnh khu du lịch Mỹ Lệ ở địa phương khác không được dùng. |
| `dak-mai-waterfall` | Thác Đắk Mai | Ảnh đúng thác tại khu vực Bù Gia Mập; OSM feature point hiện có không phải cổng vào. |

### Các nhóm trải nghiệm, chưa phải một cơ sở duy nhất

| ID | Nhóm | Cách xử lý ảnh |
|---|---|---|
| `tan-trieu-orchards` | Làng bưởi Tân Triều và vườn địa phương | Chỉ thêm ảnh sau khi xác định vườn cụ thể và được chủ vườn đồng ý. |
| `phu-dien-fields` | Trải nghiệm đồng lúa Phú Điền | Chờ hộ dân tham gia tự nguyện; không gắn ảnh một cánh đồng bất kỳ thành cơ sở đón khách. |
| `binh-loc-orchards` | Vườn trái cây Bình Lộc và Long Khánh | Ảnh phải ghi rõ vườn/nhà vườn, người chụp và quyền sử dụng. |
| `community-cultural-experiences` | Trải nghiệm nghề và ẩm thực cộng đồng | Dùng ảnh do cộng đồng/đơn vị tham gia cung cấp và duyệt nội dung, bối cảnh. |

## Quy trình xác minh và nhập ảnh

1. Ưu tiên ảnh do đơn vị quản lý/chủ sở hữu cung cấp kèm văn bản đồng ý cho NaiVerse hiển thị; hoặc ảnh có license tái sử dụng đã được xác minh trên trang tệp gốc như CC BY, CC BY-SA, CC0 hay Pexels License. Không suy luận rằng ảnh có thể tái sử dụng chỉ vì ảnh xuất hiện trên website hoặc kết quả tìm kiếm.
2. Xác minh ảnh mô tả đúng địa điểm, tác giả/creator, nguồn gốc, ngày chụp nếu biết và license. Ảnh cũ phải ghi `archival`; ảnh tư liệu không làm bằng chứng cho hoạt động hiện tại, cổng vào, khả năng tiếp cận hoặc giá.
3. Bổ sung metadata bắt buộc vào `licensedPhotos` trong `src/lib/catalog.ts`: URL tải ảnh, alt text VI/EN, creator, trang nguồn ảnh, license, URL license, ngày đối chiếu; đặt `archival: true` khi ảnh không phản ánh hiện trạng. Alt text mô tả điều nhìn thấy và không khẳng định điều không có trong ảnh.
4. Tạo migration mới tiếp sau `0025_amazing_bay_child_price_conflict_2026.sql` để thêm dòng vào `place_media` với `approved=false` mặc định. Chỉ platform admin mới duyệt ảnh sau khi rà đủ nguồn và giấy phép. Không sửa migration đã áp dụng ở project khác.
5. Chạy `npm.cmd run catalog:photo-gaps`, `npm.cmd run catalog:check-photos`, `npm.cmd test -- --maxWorkers=1`, `npm.cmd run lint`, `npm.cmd run typecheck` và production build. Lưu kết quả kiểm tra; nếu URL lỗi hoặc license không còn xác minh được thì không duyệt.

`catalog:check-photos` chỉ kiểm tra URL có trả `image/*`; nó không kiểm tra giấy phép, chất lượng ảnh, mô tả địa điểm hay hiện trạng. Kết quả pass của URL không phải bằng chứng quyền sử dụng.

## Tìm kiếm đã thử

Ngày 15/10/2026, truy vấn Commons theo các tên `Thác Đá Hàn`, `Thác Đắk Mai`, `Tà Thiết`, `Nhà Giao tế Lộc Ninh`, `Thất phủ cổ miếu Biên Hòa`, `Amazing Bay Đồng Nai` và `Sơn Tiên Đồng Nai`; kết quả hiện có rỗng hoặc không khớp địa điểm. Openverse lọc license dùng được cho thương mại với các truy vấn `Thác Đá Hàn Đồng Nai`, `Thác Đắk Mai Bình Phước`, `Tà Thiết Bù Đốp` trả 0 kết quả. Geosearch Commons quanh feature points hiện có của Amazing Bay, Đắk Mai và Chùa Ông không tìm thấy ảnh được geotag trong phạm vi truy vấn.

Đây chỉ là kết quả các truy vấn đã chạy, không chứng minh rằng không tồn tại ảnh hợp lệ ở nơi khác. Do chưa tìm được ảnh thỏa đồng thời tính đúng địa điểm và giấy phép trong các nguồn này, 14 hồ sơ trên tiếp tục để không ảnh; không dùng ảnh minh họa hoặc ảnh phong cảnh không liên quan để tăng số liệu phủ.
