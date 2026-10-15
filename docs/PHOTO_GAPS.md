# Kiểm kê và quy trình bổ sung ảnh địa điểm

## Cập nhật mới nhất — 16/10/2026

Người dùng xác nhận trực tiếp quyền sử dụng các ảnh trong `images/NaiVerse/`. Cả **14 ảnh** đã được đưa vào `public/images/places/` và gắn vào hồ sơ đúng nội dung; catalog có **43 lượt dùng ảnh trên 35 hồ sơ cần ảnh**. Nhóm trải nghiệm nghề/ẩm thực cộng đồng là danh mục trải nghiệm, không phải một địa điểm/cơ sở đã xác định; theo yêu cầu người dùng, ảnh địa điểm **không bắt buộc** cho nhóm này và không được tính là ảnh còn thiếu. Nhóm tiếp tục dùng artwork minh họa có nhãn. Đây là 29 lượt dùng ảnh có license công khai và 14 lượt dùng ảnh theo xác nhận quyền trực tiếp của người dùng; không gộp hai căn cứ này. Với ảnh cấp quyền trực tiếp, catalog ghi “Người dùng NaiVerse cung cấp; tác giả chưa được cung cấp”, không tạo URL nguồn hoặc trang license giả. Các watermark sẵn có được giữ nguyên.

Tệp `trai_nghiem_nghe_va_am_thuc_cong_dong.jpeg` là ảnh trảng cỏ Bù Lạch, nên được gắn vào `bu-lach-grassland`, không gắn vào `community-cultural-experiences`. Nhóm cộng đồng được chủ động miễn yêu cầu ảnh và tiếp tục dùng artwork có nhãn minh họa; không cần thu thập ảnh thay thế. Ảnh hái chôm chôm ở Long Khánh chỉ mô tả hoạt động trong vườn, không xác nhận thời điểm/chương trình lễ hội. Các ảnh vườn Phú Điền, Tân Triều, Bình Lộc, Mỹ Lệ và thác nước cũng không xác minh chủ cơ sở, quyền vào cửa, giờ hoặc hiện trạng hoạt động.

Kiểm tra trực quan đã thực hiện trước khi nhập. Cần bổ sung tên tác giả/credit, ngày chụp và thông tin phạm vi cho phép lưu trữ/phân phối nếu muốn công bố đầy đủ provenance. Quyền đã được người dùng xác nhận trong hội thoại; chưa có văn bản cấp quyền độc lập lưu trong repository. Không commit bản gốc trong `images/NaiVerse/`; thư mục này được gitignore. Bản website dùng các file tại `public/images/places/`.

## Báo cáo lịch sử trước khi nhận bộ ảnh trong workspace

Các số liệu và danh sách bên dưới được ghi trước khi nhận các ảnh do người dùng cấp quyền; chúng không phản ánh trạng thái hiện tại. Hãy dùng mục “Cập nhật mới nhất” ở đầu tài liệu; nhóm community-cultural-experiences vẫn không dùng ảnh địa điểm thật vì ảnh Bù Lạch không khớp nội dung.

Ngày 15/10/2026, catalog có 29 lượt dùng ảnh trên 22/36 hồ sơ; ảnh rừng Mã Đà dùng ở hai hồ sơ với alt text khác nhau, nên có 28 URL ảnh duy nhất. `npm.cmd run catalog:check-photos` đã kiểm tra HEAD và cả 28 URL đều trả `image/*`. Còn 14 hồ sơ chưa có ảnh đã duyệt, có nguồn và license phù hợp. Giao diện hiện hiển thị artwork riêng do NaiVerse vẽ cho 14 hồ sơ này, luôn gắn nhãn **Minh họa · không phải ảnh thực địa**; artwork không được tính là ảnh địa điểm, không làm bằng chứng cho lối vào, hoạt động hay hiện trạng.

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

Ảnh do chủ sở hữu cấp quyền có thể dùng khi phạm vi cấp phép bao gồm cách lưu trữ/phân phối mà NaiVerse sẽ dùng. Hướng dẫn đặt tên, metadata cần gửi và phân biệt quyền commit với quyền chỉ hiển thị trên website nằm tại [`public/images/places/README.md`](../public/images/places/README.md). Hiện 14 ảnh được cấp quyền trực tiếp đã gắn vào hồ sơ đúng nội dung; nhóm `community-cultural-experiences` tiếp tục dùng artwork có nhãn minh họa. Ảnh Bù Lạch được gắn vào hồ sơ `bu-lach-grassland`.

1. Ưu tiên ảnh do đơn vị quản lý/chủ sở hữu cung cấp kèm văn bản đồng ý cho NaiVerse hiển thị; hoặc ảnh có license tái sử dụng đã được xác minh trên trang tệp gốc như CC BY, CC BY-SA, CC0 hay Pexels License. Không suy luận rằng ảnh có thể tái sử dụng chỉ vì ảnh xuất hiện trên website hoặc kết quả tìm kiếm.
2. Xác minh ảnh mô tả đúng địa điểm, tác giả/creator, nguồn gốc, ngày chụp nếu biết và license. Ảnh cũ phải ghi `archival`; ảnh tư liệu không làm bằng chứng cho hoạt động hiện tại, cổng vào, khả năng tiếp cận hoặc giá.
3. Bổ sung metadata bắt buộc vào `licensedPhotos` trong `src/lib/catalog.ts`: URL tải ảnh, alt text VI/EN, creator, trang nguồn ảnh, license, URL license, ngày đối chiếu; đặt `archival: true` khi ảnh không phản ánh hiện trạng. Alt text mô tả điều nhìn thấy và không khẳng định điều không có trong ảnh.
4. Tạo migration mới tiếp sau migration mới nhất trong `supabase/migrations/` (hiện là `0034_ai_packing_usage_feature.sql`) để thêm dòng vào `place_media` với `approved=false` mặc định. Chỉ platform admin mới duyệt ảnh sau khi rà đủ nguồn và giấy phép. Không sửa migration đã áp dụng ở project khác.
5. Chạy `npm.cmd run catalog:photo-gaps`, `npm.cmd run catalog:check-photos`, `npm.cmd test -- --maxWorkers=1`, `npm.cmd run lint`, `npm.cmd run typecheck` và production build. Lưu kết quả kiểm tra; nếu URL lỗi hoặc license không còn xác minh được thì không duyệt.

`catalog:check-photos` chỉ kiểm tra URL có trả `image/*`; nó không kiểm tra giấy phép, chất lượng ảnh, mô tả địa điểm hay hiện trạng. Kết quả pass của URL không phải bằng chứng quyền sử dụng.

## Tìm kiếm đã thử

Ngày 15/10/2026, truy vấn Commons theo các tên `Thác Đá Hàn`, `Thác Đắk Mai`, `Tà Thiết`, `Nhà Giao tế Lộc Ninh`, `Thất phủ cổ miếu Biên Hòa`, `Amazing Bay Đồng Nai` và `Sơn Tiên Đồng Nai`; kết quả hiện có rỗng hoặc không khớp địa điểm. Openverse lọc license dùng được cho thương mại với các truy vấn `Thác Đá Hàn Đồng Nai`, `Thác Đắk Mai Bình Phước`, `Tà Thiết Bù Đốp` trả 0 kết quả. Geosearch Commons quanh feature points hiện có của Amazing Bay, Đắk Mai và Chùa Ông không tìm thấy ảnh được geotag trong phạm vi truy vấn.

Rà lại tìm kiếm web cùng ngày vẫn chưa tạo ra ảnh đủ điều kiện để thêm: Commons có các ảnh mang tên `Quan Công Miếu (Chùa Ông) 01/05`, nhưng metadata định vị 15.8776, 108.3313 và category ghi Hoi An, nên không phải Chùa Ông ở Biên Hòa dù ảnh mang license CC BY 4.0. [Tệp Commons 01](https://commons.wikimedia.org/wiki/File:Quan_C%C3%B4ng_Mi%E1%BA%BFu_(Ch%C3%B9a_%C3%94ng)_01.jpg). Một kết quả “Tân Triều” là lễ hội Triều Khúc tại Hà Nội, không phải làng bưởi Tân Triều ở Đồng Nai. Cổng thông tin Bình Phước có ảnh Nhà Giao Tế đúng di tích, nhưng trang không nêu license tái sử dụng; ảnh bài báo/thương mại về thác Đá Hàn, Đắk Mai và vườn bưởi cũng không có căn cứ tái sử dụng từ trang kết quả. [Trang di tích Nhà Giao Tế](https://binhphuoc.gov.vn/en/news/news/the-historical-sites-in-loc-ninh-160.html). Vì vậy chưa nhập các ảnh này vào ứng dụng; Openverse/Wikimedia metadata và kết quả tìm kiếm chỉ là điểm bắt đầu rà soát, cần kiểm tra trang gốc và license từng ảnh.

Rà soát bổ sung tìm hình Amazing Bay trong kết quả ảnh cho thấy có ảnh đúng địa điểm trên trang bán vé và báo chí, nhưng các trang đó không cấp license tái sử dụng rõ ràng; không đưa ảnh vào catalog chỉ dựa trên việc ảnh đang hiển thị công khai. Ảnh vẫn phải do nhà vận hành/chủ ảnh cấp quyền hoặc tìm được bản gốc có license phù hợp.

Tra cứu hình ảnh bổ sung ngày 15/10/2026 tìm thấy ảnh đúng thác Đắk Mai trong [Báo Bình Phước](https://baobinhphuoc.com.vn/news/19/93375/thac-dak-mai---ve-dep-nguyen-so-hung-vi) và ảnh Đá Hàn trên [VietFriend](https://vietfriendtour.com/du-lich-teambuilding-le-2-9-tai-khu-du-lich-thac-da-han-trang-bom/); cả hai trang không nêu license tái sử dụng. [Cổng thông tin Bình Phước có ảnh Tà Thiết](https://binhphuoc.gov.vn/vi/binh-phuoc-portal/new-event/ta-thiet-relic-area-110.html), nhưng cũng không cấp license mở. Một tệp mang tên Nhà Giao tế Lộc Ninh từng bị phản đối trên Commons vì nguồn gốc ghi bản quyền “All Rights Reserved”, không phải ảnh tự do: [ghi chú tại trang thảo luận Commons](https://commons.wikimedia.org/wiki/User_talk:K1eprongbuon812#File:Di_t%C3%ADch_L%E1%BB%8Bch_s%E1%BB%AD_-_Nh%C3%A0_Giao_t%E1%BA%BF_L%E1%BB%99c_Ninh.jpg). Không thêm các ảnh này vào catalog khi chưa có quyền tái sử dụng được chứng minh.

Đây chỉ là kết quả các truy vấn đã chạy, không chứng minh rằng không tồn tại ảnh hợp lệ ở nơi khác. Do chưa tìm được ảnh thỏa đồng thời tính đúng địa điểm và giấy phép trong các nguồn này, 14 hồ sơ trên tiếp tục để không ảnh; không dùng ảnh minh họa hoặc ảnh phong cảnh không liên quan để tăng số liệu phủ.

Tra cứu hình ảnh bổ sung ngày 15/10/2026 tiếp tục thấy ảnh đúng Chùa Ông trên [Báo Đồng Nai](https://baodongnai.com.vn/van-hoa/202506/xay-dung-phuong-an-bao-ve-4-con-lan-da-khu-vuc-ii-di-tich-chua-ong-c4409d4/) và ảnh Nhà Giao Tế trên [cổng thông tin Bình Phước](https://binhphuoc.gov.vn/en/news/news/the-historical-sites-in-loc-ninh-160.html), nhưng trang bài viết không cấp license tái sử dụng. Ảnh cổng Sơn Tiên tìm được trên [trang tin HTV/Digital Business Challenge](https://htv.vn/doanhnhansaigon/khu-du-lich-son-tien-dinh-hinh-mo-hinh-all-in-exclusive-tam-co-but-pha-tai-nguyen-du-lich-tp-dong-nai-337014.html) cũng không nêu giấy phép mở. Không lấy URL ảnh trực tiếp từ kết quả tìm kiếm để đưa vào catalog; cần quyền bằng văn bản từ chủ ảnh/đơn vị hoặc bản gốc có license dùng lại.
