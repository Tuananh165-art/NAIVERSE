# NaiVerse — Du lịch AI Đồng Nai

**Cập nhật 16/10/2026:** AI Guide VI/EN dùng retrieval catalog có nguồn và chỉ hiển thị trích đoạn nguyên văn đã kiểm tra theo citation; smoke extractive đạt 2/2, evaluator chọn nguồn đối kháng đạt **10/10 development và 10/10 holdout** trên hai nhóm nhỏ chạy riêng. FairPrice Lens trích báo giá theo exact evidence, không phán giá tốt/xấu; Trip DNA/AI sự cố che email, số điện thoại, tọa độ thập phân và DMS trước khi gọi DeepSeek. Trip DNA hỗ trợ xe đạp (chưa có định tuyến xe đạp), dùng temperature 0 và ngày tham chiếu `Asia/Ho_Chi_Minh` để xử lý ngày tương đối; lần đo mới nhất đạt **358/358 development** và **177/180 holdout regression re-run** trên hai mẫu nhỏ, không bảo đảm mọi yêu cầu thực tế. Live smoke DeepSeek/Open-Meteo/ORS mới nhất đạt **30/30 trên 7 file**, gồm sự cố không khẩn cấp VI/EN qua API; prompt FairPrice được tăng hướng dẫn về evidence span, prompt sự cố yêu cầu câu ngắn hơn để tránh tràn schema. FairPrice prompt injection VI/EN đạt 2/2. Unit/integration đạt **116 passed, 47 skipped**; lint/typecheck, Playwright **23/23** và production build Next.js (47 static pages) đều đạt. E2E còn xác nhận OSM tile lỗi thì chuyển sang MapTiler nếu đã cấu hình key. Mã nguồn này chưa được deploy; Auth thật và RLS A/B vẫn chờ staging. Đã tích hợp đủ 14 ảnh người dùng xác nhận quyền sử dụng, khớp hash; 43 lượt dùng ảnh phủ đủ 35 hồ sơ cần ảnh. Nhóm trải nghiệm nghề/ẩm thực cộng đồng được miễn ảnh theo yêu cầu người dùng và giữ minh họa có nhãn. File `NAIVERSE_SETUP_ALL.sql` chứa 34 migration; xem hướng dẫn preflight trước khi chạy. Xem [kịch bản demo](docs/DEMO_KICH_BAN.md), [kiểm toán AI](docs/AI_AUDIT.md), [trạng thái ảnh](docs/PHOTO_GAPS.md) và [kế hoạch](docs/PLAN_TODO.md).

NaiVerse là ứng dụng web song ngữ Việt–Anh giúp khám phá 36 mục trong danh mục ý tưởng, đăng nhập bằng username/email và password qua Supabase, lập hành trình với DeepSeek, nhận tư vấn thời tiết/an toàn/du lịch xanh, so sánh tuyến đường trên bản đồ và chuyển yêu cầu tới hộp thư doanh nghiệp giả lập có nhãn **DEMO**.

Nguyên tắc dữ liệu địa phương: 29 lượt dùng ảnh có license công khai và 14 lượt dùng ảnh được ghi nhận theo xác nhận quyền trực tiếp của người dùng; tổng 43 lượt dùng trên 35 hồ sơ yêu cầu ảnh. Nhóm trải nghiệm cộng đồng được miễn ảnh và tiếp tục dùng artwork có nhãn. Tác giả của ảnh cấp quyền chưa được cung cấp, nên ứng dụng không bịa credit hoặc URL license. Chi tiết ảnh ở [docs/PHOTO_GAPS.md](docs/PHOTO_GAPS.md). Các pin OSM là điểm địa lý, không mặc định là cổng đã khảo sát; hiện chưa có cổng vào nào được xác minh. Giá, giờ và hoạt động vẫn gắn nguồn/trạng thái; xung đột hoặc dữ liệu cũ không được hiển thị như thông tin hiện hành. Gợi ý AI không phải booking hoặc cảnh báo chính thức.

## Chạy local

Thác Đá Hàn có hai lịch tham khảo mâu thuẫn (07:00–19:00 và 07:00–17:00), đều chưa được nhà vận hành xác nhận; các giá từ nguồn thứ cấp có `amount_vnd = null` nên không ảnh hưởng tổng chi phí. Chi tiết và migration: [docs/THAC_DA_HAN_DATA.md](docs/THAC_DA_HAN_DATA.md).

Yêu cầu Node.js 24.x. Trên Windows PowerShell:

~~~~powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
~~~~

Sau khi điền `.env`, chạy `npm.cmd run services:probe` để kiểm tra kết nối Supabase Auth/schema và Upstash Redis mà không in secret. Probe ngày 16/10/2026 xác nhận Auth, Upstash PING, schema chính và 36 địa điểm công khai; kết quả này không thay cho kiểm tra đăng nhập, ghi dữ liệu hoặc RLS theo tài khoản. Nếu project mới báo `404/PGRST205`, làm theo [hướng dẫn cài đặt](docs/HUONG_DAN.md) và chỉ chạy bundle một lần trên database rỗng.

Để tạo tài khoản dịch vụ, lấy đúng API URL/key, cấu hình environment variables và import GitHub vào Vercel theo từng bước, xem [Hướng dẫn thiết lập dịch vụ](docs/THIET_LAP_DICH_VU.md). Hướng dẫn test theo vai trò và cập nhật dữ liệu nằm trong [Hướng dẫn cài đặt, kiểm thử và demo](docs/HUONG_DAN.md).

Giới hạn quota và điều kiện dùng dịch vụ cho demo/kinh doanh được rà soát tại [docs/SERVICE_LIMITS.md](docs/SERVICE_LIMITS.md); hãy kiểm tra lại với nhà cung cấp trước khi public hoặc dùng thương mại.

Mở http://localhost:3000/vi. Khám phá danh mục không cần tài khoản. Trang chủ có thẻ dẫn tới AI Thời tiết/An toàn/Xanh và AI Giao thông; hai liên kết trên thanh điều hướng vẫn cuộn ngang được trên điện thoại. Đăng ký, AI thật, lưu hành trình, chia sẻ và gửi yêu cầu cần cấu hình dịch vụ theo docs/HUONG_DAN.md.

## Tích hợp

- Next.js App Router, TypeScript, Tailwind CSS, next-intl (đường dẫn /vi, /en)
- Supabase Auth/PostgreSQL với migration RLS, username/password, Upstash Redis limits
- DeepSeek Chat Completions + JSON mode, Zod validation
- Open-Meteo forecast theo vùng (tối đa 7 ngày), DeepSeek weather/safety/green advice
- Leaflet/OpenStreetMap; ORS Matrix tối ưu thứ tự điểm trung gian (giữ điểm đầu/cuối), Directions dựng tuyến nhanh/ngắn theo thứ tự đề xuất; DeepSeek giải thích đánh đổi
- 28 ảnh Wikimedia và 1 ảnh Pexels có nguồn/giấy phép cho 22/36 địa điểm; ảnh tư liệu có license gồm Bảo tàng Đồng Nai (2022), Bò Cạp Vàng (2008), Bù Lạch, Chiến khu D (có thêm ảnh rừng Mã Đà năm 2019 của Phương Huy, CC BY-SA 4.0), hồ Thác Mơ (2015), tượng Điểu Ong ở Sóc Bom Bo (2017), Bù Gia Mập (2012), cổng Văn Miếu Trấn Biên (2009; không chứng minh cổng vào hiện dùng) và cảnh quan khu vực La Ngà (2015; không phải ảnh cơ sở lưu trú); thêm ảnh Công viên Suối Mơ của Chàng Trai Nông Thôn, trang nguồn ghi Tân Phú, Đồng Nai; ảnh tư liệu được ghi nhãn, ảnh xuất hiện cả trên thẻ và gallery; Cát Tiên có ảnh hồ Cá Sấu chụp năm 2021
- Giá có nguồn cho Amazing Bay, Amazing World, VQG Cát Tiên và Suối Mơ; giá Bửu Long được giữ nhãn lịch sử đến khi xác nhận lại
- Mười đối tượng bản đồ OSM có link nguồn và nhãn “không phải cổng vào đã xác minh”

AI Guide hiện tra cứu dữ liệu công khai theo địa điểm và loại câu hỏi cố định, DeepSeek chỉ chọn trích đoạn nguyên văn từ catalog; AI Packing Assistant ưu tiên checklist mã vật dụng từ dữ kiện cấu trúc, không phải chatbot tự do hay tư vấn y tế. FairPrice Lens dùng DeepSeek trích quote có exact evidence; phép so sánh VND là số học trong code và chỉ hiện sau khi khách xác nhận cùng sản phẩm, đơn vị, đối tượng, hiệu lực và điều khoản. MVP chưa có traffic realtime, cổng vào đã khảo sát, giờ hàng ngày được xác minh, ảnh cho đủ 36 điểm, giá hiện hành cho toàn catalog, thanh toán, booking tồn chỗ, OCR, TTS, chatbot hỏi tự do/RAG embedding hoặc Operator Copilot bằng LLM. Các mục còn thiếu được ghi ở docs/PLAN_TODO.md. Không dùng Nominatim công cộng cho autocomplete.

## Kiểm tra

~~~~powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
~~~~

Các kiểm tra mã nguồn không chứng minh dịch vụ bên ngoài đã hoạt động. Phần tích hợp cần kiểm tra theo từng bước trong hướng dẫn. Không đưa .env hoặc khóa service role vào Git/Vercel client variables.

## Triển khai Vercel

Đẩy repository lên GitHub rồi Import Project trong Vercel; framework Next.js, Node.js 24. Khai báo các biến server/public theo bảng ở docs/HUONG_DAN.md, Deploy, rồi smoke-test /vi, /en, đăng nhập, AI, lưu trip và RLS. Việc triển khai và kiểm thử URL thuộc về chủ repository; tài liệu không ghi deploy hoàn tất khi chưa có bằng chứng URL thực.

### Bổ sung dữ liệu dịch vụ Thác Giang Điền

Đã lưu 11 khoản camping/thuê lều từ trang giá chính thức vào migration `0020_giang_dien_camping_price_notes.sql` và chế độ dự phòng không cần Supabase. Vì các bảng ảnh không ghi ngày hiệu lực, UI hiển thị đây là giá tham khảo chưa xác nhận; Journey Studio không cộng các mức này vào chi phí đã biết.

Migration `0021_giang_dien_current_price_and_general_hours.sql` đối chiếu riêng Combo 01 với trang sản phẩm hiện hành: 449.000 ₫/khách, tối thiểu hai khách, trạng thái nguồn `verified`. Trang cũng nêu giờ khu vui chơi 07:30–17:00 nhưng không nêu lịch từng ngày; giờ chung được hiển thị là `unknown`, không phải lịch hằng ngày đã xác nhận.

Migration `0032_giang_dien_operator_services.sql` bổ sung giờ hoạt động theo dịch vụ của hai nhà hàng và thông tin nhận khách Khách sạn Tre Xanh; trang sản phẩm đang hiển thị giá 550.000 ₫ nhưng chưa nêu rõ đơn vị/sức chứa nên giá giữ `unknown`, không cộng vào dự toán. Chi tiết nguồn và cách xác minh: [docs/GIANG_DIEN_SERVICES.md](docs/GIANG_DIEN_SERVICES.md).

Migration `0033_giang_dien_combo3_current_operator_page.sql` cập nhật Combo 3 từ bảng ảnh cũ sang trang sản phẩm nhà vận hành đang hiển thị 599.000 ₫ (giá gạch 699.000 ₫). Trang không nêu đơn vị giá, sức chứa hay hạn ưu đãi, nên NaiVerse vẫn giữ `unknown` và không cộng vào chi phí hành trình.
