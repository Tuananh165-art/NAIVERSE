# Kế hoạch, phạm vi và TODO NaiVerse

## Phạm vi MVP đã triển khai trong repository

- [x] Ứng dụng Next.js song ngữ VI/EN, giao diện responsive, trang khám phá và danh mục 36 mục.
- [x] Danh mục thận trọng: alias, group, nguồn; không gán pin cổng/giờ/đối tác thiếu căn cứ.
- [x] Trang chi tiết và thẻ danh mục có 29 ảnh có nguồn/giấy phép (28 Wikimedia, 1 Pexels) cho 22/36 điểm; gồm ảnh Công viên Suối Mơ có ghi địa điểm Tân Phú, Đồng Nai; ảnh rừng Mã Đà tại Chiến khu D năm 2019 của Phương Huy, CC BY-SA 4.0, dùng đúng chú thích ảnh tư liệu cho cả hồ sơ Chiến khu D và Khu Bảo tồn Mã Đà; ảnh cổng Văn Miếu Trấn Biên (2009) được ghi rõ là tư liệu, không xác nhận cổng vào hiện dùng; ảnh La Ngà không mô tả cơ sở lưu trú. Giá và giờ giữ kèm nguồn/trạng thái.
- [x] Có nguồn lịch tuần cho 4/36 điểm: The Amazing Bay 09:00–17:00 được nguồn sản phẩm chính thức xác nhận; Bửu Long, Bảo tàng Đồng Nai và Suối Mơ hiển thị giờ được nguồn nêu với trạng thái `unknown` vì chưa được nhà vận hành xác nhận lại.
- [x] Migration 0014 thêm `place_hours.note_en`; migration 0015 thêm ảnh tư liệu có license cho Bù Gia Mập; migration 0016 thêm ảnh Suối Mơ theo Pexels License; migration 0018 thêm ảnh rừng Mã Đà tại Chiến khu D theo CC BY-SA 4.0.
- [x] Migration `0022_ma_da_archival_forest_photo.sql` bổ sung ảnh rừng Mã Đà tư liệu 2019 vào hồ sơ khu bảo tồn, kèm credit/license; chú thích ghi rõ ảnh không chứng minh lối vào hoặc hiện trạng.
- [x] GPS phía trình duyệt chỉ sau thao tác chủ động; bản đồ OSM có attribution; không có autocomplete Nominatim.
- [x] Đăng ký Supabase email + username + password; đăng nhập email hoặc username + password qua server; migration PostgreSQL, trigger, unique index và RLS.
- [x] DeepSeek server-side parse nhu cầu chuyến đi; thêm Weather Brief/Rain Plan, AI hướng dẫn sự cố chưa khẩn cấp/urgent human escalation, Green Trip Advisor và AI so sánh tuyến nhanh/ngắn; hai thẻ trợ lý AI nằm ngay dưới hero để dễ tìm, đồng thời có liên kết trên nav mobile.
- [x] Kiểm tra JSON đầu ra bằng Zod và sửa tối đa một lần khi model trả JSON/schema lệch; live smoke xác nhận DeepSeek cho luồng thời tiết, sự cố không khẩn cấp và giải thích metric tuyến.
- [x] Live smoke gọi thẳng API handler thời tiết VI/EN với DeepSeek + Open-Meteo thật; cô lập mock session/Upstash, có kiểm tra bypass cho tình huống khẩn cấp.
- [x] Live smoke gọi API handler trợ lý tuyến với DeepSeek thật và metric tuyến fixture; chưa tính là xác minh OpenRouteService thật.
- [x] Open-Meteo forecast theo vùng, source/timestamp; ORS road route nhanh/ngắn; matrix ORS sắp xếp tối ưu chính xác thứ tự các điểm trung gian (giữ điểm đầu/cuối), rồi directions dựng geometry theo thứ tự đó; DeepSeek giải thích metrics, không nhận GPS/tọa độ route.
- [x] Giới hạn Upstash theo phút/ngày/người/toàn ứng dụng; AI bị khóa khi thiếu hoặc lỗi Redis.
- [x] Lưu/xóa hành trình, link chỉ xem 7 ngày có thu hồi, form gửi yêu cầu có consent, inbox tổ chức demo, báo giá nháp và bước nhân viên duyệt/chia sẻ.
- [x] Giá thiếu là null, không biểu diễn thành giá 0; hồ sơ demo luôn có nhãn DEMO.
- [x] README, hướng dẫn tiếng Việt, kiểm thử đơn vị, GitHub Actions.

## Giới hạn đã biết và backlog

- [ ] Xác minh cổng vào có nguồn, giờ hoạt động và giá hiện hành cho từng cơ sở; hiện 10/36 chỉ có OSM feature point và 0/36 cổng đã xác minh.
- [x] Thêm ba mức vé Amazing Bay từ FAQ operator, checked 2026-10-15; giá quá 30 ngày rời nhãn hiện hành. Bổ sung giá Bửu Long theo hai đợt lễ 02/01 và 26/04/2026 từ cổng thông tin Đồng Nai; chỉ lưu lịch sử, không nhận là giá hiện tại.
- [x] Đối chiếu hai nguồn giá trẻ em Amazing Bay và hiển thị xung đột 270.000/279.000 ₫; cả hai dòng được loại khỏi giá hiện hành và tổng lịch trình cho đến khi đơn vị vận hành xác nhận.
- [ ] FairPrice Lens nâng cao để khách dán báo giá và so sánh điều kiện; bảng Suối Mơ chính thức ghi giá áp dụng từ 25/01/2025 đến khi thay thế, vẫn cần khách xác nhận trước khi mua.
- [x] Trang quản trị platform admin cập nhật trạng thái, ghi chú, tọa độ có căn cứ và nguồn; quản lý phản ánh.
- [x] Tải catalog và nguồn giá đã duyệt từ Supabase; fallback catalog code khi chưa cấu hình/chưa seed.
- [x] Giao diện admin nhập, duyệt/gỡ duyệt và xóa ảnh (kèm credit/license), giờ theo ngày và giá; bản ghi mới mặc định pending, verified cần bằng chứng nguồn; endpoint giới hạn platform admin và public UI chỉ đọc approved.
- [x] Dashboard quản trị có bảng độ phủ ảnh, tọa độ cổng đã xác minh, giờ và giá; chỉ tính evidence đã duyệt, tách trạng thái verified khỏi bản ghi tham khảo, đồng thời liệt kê từng địa điểm còn thiếu.
- [x] Rain Plan với Open-Meteo forecast theo vùng đến 7 ngày; không phải cảnh báo chính thức, điều khoản free có thể giới hạn non-commercial.
- [ ] Official Warning Summarizer từ cơ quan chuyên môn, Service Interruption Detector và Incident Triage vào hàng chờ kiểm duyệt.
- [ ] Stress Test theo giờ thực, khoảng đệm tuyến, giờ mở cửa, bữa ăn và nghỉ; bộ tối ưu mới dùng matrix thời lượng/quãng đường, không có giờ mở cửa, giờ dừng, giao thông realtime hoặc tối ưu khoảng dừng.
- [ ] Packing Assistant, thuyết minh/hỏi đáp có trích nguồn, đọc giọng trình duyệt.
- [ ] Operator Copilot gọi LLM để đọc brief/soạn chương trình; hiện có form báo giá thủ công, lưu nháp và duyệt trước chia sẻ.
- [x] Lưu, đổi tên, sao chép, xóa, chia sẻ/thu hồi và gửi yêu cầu cho trip.
- [ ] Sửa trực tiếp thứ tự điểm dừng sau khi đã lưu trip.
- [ ] Đánh giá 60 prompt VI/EN độc lập, mục tiêu 90% trích xuất; chưa đo nên chưa công bố KPI.
- [ ] Playwright E2E/kiểm thử RLS giữa khách A/B và doanh nghiệp A/B với hai project member thật.
- [ ] Accessibility audit và kiểm thử thiết bị thật; responsive source/build không thay thế kiểm thử thiết bị.
- [x] Thêm weather provider, 29 ảnh có nguồn/giấy phép (28 Wikimedia, 1 Pexels) cho 22/36 hồ sơ, nguồn giá Amazing Bay/Amazing World/Cát Tiên/Suối Mơ và giá Bửu Long lịch sử.
- [ ] Mở rộng ảnh có giấy phép từ 22/36 lên toàn bộ điểm có ảnh phù hợp; tăng OSM features chỉ khi đúng thực thể; khảo sát cổng vào riêng biệt. Hiện còn 14 hồ sơ thiếu ảnh, 10/36 feature points, 0 cổng đã xác minh.
- [x] Lập [quy trình và danh sách ảnh còn thiếu](PHOTO_GAPS.md), phân biệt 10 địa điểm cụ thể với 4 nhóm trải nghiệm; kiểm tra Commons/Openverse/geosearch nhưng chưa có thêm ảnh đủ căn cứ địa điểm và license.
- [ ] Tái đánh giá giấy phép dịch vụ, giới hạn miễn phí, chi phí và điều kiện thương mại trước kinh doanh.

## Cập nhật nguồn Bửu Long và kiểm thử AI live — 15/10/2026

- [x] Đối chiếu bài Báo Đồng Nai ngày 07/08/2026 dẫn Ban Giám đốc về giờ 07:00–17:00, nghỉ thứ Ba trừ lễ/Tết; vẫn để lịch `unknown` vì nguồn chưa được xác nhận lại sau ngày đăng.
- [x] Thêm migration lặp an toàn `0023_buu_long_2026_summer_report.sql`, cập nhật provenance giờ và lưu 5 dòng giá/ưu đãi được báo cáo ở trạng thái `historical`; ưu đãi hè hết hạn 31/08/2026, không coi là giá hiện hành.
- [x] Thêm ảnh Wikimedia Commons có license CC BY-SA 3.0 về cổng chính Văn Miếu Trấn Biên (ảnh năm 2009) vào gallery và migration `0024_tran_bien_main_gate_photo.sql`; gắn nhãn tư liệu, không dùng ảnh làm bằng chứng cổng vào hiện hành.
- [x] Smoke DeepSeek trực tiếp: `RUN_LIVE_AI_SMOKE=true npm.cmd test -- src/lib/ai-live-smoke.test.ts` — 9 passed, 1 skipped; kiểm tra parser chuyến VI/EN, tư vấn thời tiết VI/EN, sự cố VI/EN và giải thích tuyến VI/EN.
- [x] Smoke handler: `RUN_LIVE_AI_HANDLERS_SMOKE=true npm.cmd test -- src/lib/ai-handler-live-smoke.test.ts` — 4 passed. Open-Meteo và DeepSeek thật cho weather VI/EN; session/Upstash mock và metric tuyến fixture.
- [x] Smoke ORS riêng: `RUN_LIVE_ROUTE_SMOKE=true npm.cmd test -- src/lib/ai-live-smoke.test.ts` — 2 passed, 8 skipped; có geometry đường thật.
- [ ] Kiểm tra đăng ký/username-login qua tài khoản Supabase dành riêng cho test, email xác nhận/khôi phục, RLS A/B và Upstash thật; chưa có bằng chứng E2E an toàn với hai tài khoản test riêng trong lần chạy này.
- [ ] Rà soát thêm ảnh có giấy phép và xác minh cổng/giờ/giá hiện hành với nhà vận hành; migration nguồn mở không thay thế xác nhận trực tiếp.

## Cổng nghiệm thu

Lint/typecheck/unit/build là cổng repository. Tích hợp Supabase, DeepSeek, Upstash, định tuyến, phân quyền chéo và luồng khách–nhân viên cần có dịch vụ/tài khoản chạy thật; xem trạng thái hiện hành tại docs/HUONG_DAN.md. Không coi fixtures, seed hoặc build là bằng chứng dịch vụ production.

## Cập nhật nguồn địa điểm – Thác Giang Điền

- [x] Rà soát trang giá dịch vụ chính thức và ghi nhận 11 giá combo camping/thuê lều dưới trạng thái `unknown`, do bảng không nêu thời hạn.
- [x] Thêm migration lặp an toàn `0020_giang_dien_camping_price_notes.sql` và dữ liệu dự phòng offline.
- [x] Đối chiếu trang combo hiện hành: cập nhật Combo 01 thành 449.000 ₫/khách từ 2 khách; lưu giờ chung 07:30–17:00 ở trạng thái `unknown` vì không nêu ngoại lệ theo ngày, qua migration `0021_giang_dien_current_price_and_general_hours.sql`.
- [ ] Xác nhận bảng giá, ngày hiệu lực, giờ hoạt động hiện tại và tọa độ cổng với nhà vận hành trước khi gọi là dữ liệu đã xác minh.
- [ ] Tiếp tục rà 15 hồ sơ chưa có ảnh có license/nguồn cụ thể; ưu tiên ảnh đúng địa điểm thay cho ảnh phong cảnh chung.

## Kiểm tra tiếp tục — 15/10/2026

- [x] Thêm ba lối tắt AI ngay trong hero trang chủ để khách thấy planner, trợ lý thời tiết/an toàn/du lịch xanh và trợ lý giao thông/tuyến đường mà không cần cuộn tới danh mục.
- [x] Chạy lại live smoke lúc 17:51 ngày 15/10/2026: 4 file, 18 test đạt với `.env`; DeepSeek thật cho planner VI/EN, thời tiết/sự cố VI/EN và giải thích tuyến; Open-Meteo dự báo thật; OpenRouteService route thật trong test end-to-end. Session/Upstash vẫn mock. Các trang local `/vi`, `/en`, `/vi/ai/conditions`, `/vi/ai/routes` và `/vi/auth` trả 200, `/` chuyển 307 tới `/vi`.
- [x] Thêm `npm.cmd run catalog:check-photos` để kiểm tra URL ảnh bằng HEAD giới hạn hai kết nối; chạy live ngày 15/10/2026, 28/28 URL duy nhất trả image content-type. 29 lượt dùng ảnh trên 22/36 hồ sơ; 14 hồ sơ vẫn thiếu ảnh đúng địa điểm có license.
- [x] Chạy production build riêng ngày 15/10/2026 sau thay đổi script: Next.js build thành công, TypeScript đạt và sinh 40/40 route; dọn thư mục build tạm có kiểm tra đường dẫn, hoàn nguyên tham chiếu generated trong `tsconfig.json`/`next-env.d.ts`, rồi `npm.cmd run typecheck` đạt.
- [x] Sửa assertion kiểm tra gallery Văn Miếu sau khi thêm ảnh cổng tư liệu thứ ba; toàn bộ suite đạt 46 passed, 14 skipped; lint, typecheck và production build đạt (40/40 route).
- [ ] Còn thiếu 14/36 hồ sơ ảnh có nguồn/giấy phép, 0/36 tọa độ cổng được xác minh. OSM hiện chỉ là feature point; giá/giờ ở các nguồn cũ hoặc không có thời hạn vẫn phải giữ `historical`/`unknown` đến khi đơn vị xác nhận.
- [x] Rà soát giá Amazing Bay: FAQ Sơn Tiên nêu 270.000 ₫ vé trẻ em, hướng dẫn cổng bán vé amazingbay.vn (16/04/2026) nêu 279.000 ₫. Thêm `0025_amazing_bay_child_price_conflict_2026.sql`, lưu cả hai ở trạng thái `conflicting` và cảnh báo khách trước khi mua; không tính vào chi phí hiện hành.
