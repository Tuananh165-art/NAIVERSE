# NaiVerse — Du lịch AI Đồng Nai

NaiVerse là ứng dụng web song ngữ Việt–Anh giúp khám phá 36 mục trong danh mục ý tưởng, đăng nhập bằng username/email và password qua Supabase, lập hành trình với DeepSeek, nhận tư vấn thời tiết/an toàn/du lịch xanh, so sánh tuyến đường trên bản đồ và chuyển yêu cầu tới hộp thư doanh nghiệp giả lập có nhãn **DEMO**.

Các nguyên tắc dữ liệu: chỉ hiển thị ảnh có ghi tác giả/giấy phép; hiện có 29 ảnh có nguồn/giấy phép cho 22/36 hồ sơ (28 Wikimedia, 1 Pexels); 28 URL ảnh duy nhất đã qua kiểm tra tải, còn thiếu 14 hồ sơ. Danh sách và quy trình thu thập ảnh đúng địa điểm kèm license nằm ở [docs/PHOTO_GAPS.md](docs/PHOTO_GAPS.md). Ảnh cổng Văn Miếu Trấn Biên là tư liệu năm 2009, không xác nhận cổng vào hiện dùng; ảnh cảnh quan La Ngà không phải ảnh cơ sở lưu trú. 10 hồ sơ có điểm feature OSM nhưng 0 cổng vào đã xác minh; lịch tuần có nguồn cho 4/36 điểm, trong đó 1 lịch được xác minh (The Amazing Bay 09:00–17:00) và 3 lịch chưa xác minh lại (Bửu Long, Bảo tàng Đồng Nai, Suối Mơ). Nguồn Báo Đồng Nai dẫn giờ Bửu Long được đăng 07/08/2026 và chưa xác nhận lại; lịch Bảo tàng Đồng Nai được đăng năm 2023; lịch Suối Mơ do danh bạ Viet-Biz nêu. Giá có nguồn/ngày rà soát và tự rời nhãn hiện hành sau 30 ngày. Bửu Long hiện chỉ có giá lịch sử (02/01, 26/04 và bài báo hè 07/08/2026; chương trình khuyến mãi đã hết hạn), không có giá hiện hành đã xác minh; Amazing Bay, Amazing World, Cát Tiên và Suối Mơ có nguồn giá được rà soát ngày 15/10/2026. Vé Amazing World được ghi rõ là combo khung giờ đêm; điều kiện vé trẻ em chưa nêu trên trang. Bảng Suối Mơ ghi hiệu lực đến khi được thay thế; vẫn cần xác nhận với cơ sở trước khi mua. Gợi ý AI không phải booking hoặc cảnh báo chính thức.

## Chạy local

Yêu cầu Node.js 24.x. Trên Windows PowerShell:

~~~~powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
~~~~

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

MVP chưa có traffic realtime, cổng vào đã khảo sát, giờ hàng ngày được xác minh, ảnh cho đủ 36 điểm, giá hiện hành cho toàn catalog, thanh toán, booking tồn chỗ, OCR, giọng nói, AI Guide, FairPrice tự phân tích báo giá hoặc Operator Copilot bằng LLM. Các mục còn thiếu được ghi ở docs/PLAN_TODO.md. Không dùng Nominatim công cộng cho autocomplete.

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
