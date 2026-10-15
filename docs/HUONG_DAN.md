# Hướng dẫn cài đặt, kiểm thử và demo NaiVerse

Hướng dẫn này phân biệt kiểm tra source/build, kết nối dịch vụ thật và triển khai URL. Chỉ đánh dấu tích hợp “đã xác minh” sau khi hoàn thành đúng phép thử ở máy có credentials. Không gửi API key, service-role key, email/điện thoại khách hoặc GPS chính xác vào issue, log công khai hay ảnh demo.

## 1. Chuẩn bị Windows và chạy ứng dụng

1. Cài Node.js 24.x LTS và Git. Mở PowerShell tại thư mục repository F:\NAIVERSE.
2. Cài dependency theo lockfile:

   ~~~~powershell
   npm.cmd ci
   ~~~~

3. Tạo file cấu hình riêng. Không chép nội dung bí mật vào Git:

   ~~~~powershell
   Copy-Item .env.example .env
   ~~~~

4. Khám phá public catalog có thể chạy mà chưa cấu hình dịch vụ:

   ~~~~powershell
   npm.cmd run dev
   ~~~~

5. Mở http://localhost:3000/vi và /en. Ngay trong hero có ba lối tắt tới AI lập kế hoạch, AI thời tiết/an toàn/du lịch xanh và AI giao thông/hành trình; hai thẻ mô tả chi tiết cũng nằm ngay bên dưới. Mở trực tiếp `/vi/ai/conditions`, `/vi/ai/routes` để xem từng trang; thao tác gọi AI cần tài khoản và dịch vụ đã cấu hình. Chọn Khám phá, xem bản đồ, tìm một mục trong danh mục và mở trang chi tiết. Có một số tọa độ feature OSM nhưng được ghi rõ không phải cổng vào; chỉ dùng GPS sau khi bấm “Dùng vị trí của tôi”. Từ chối GPS không khóa nội dung còn lại. Thanh điều hướng ngang có các liên kết tới cả hai trợ lý trên điện thoại.
   Next.js 16 dùng `proxy.ts` cho locale và xác thực phiên; nếu đổi convention/file này, dừng dev server bằng Ctrl+C rồi chạy lại. Trang `/` phải trả 307 tới `/vi`, sau đó trang chủ trả 200. Cảnh báo React chỉ về thuộc tính `data-yd-*` không thấy trong mã nguồn có thể do tiện ích trình duyệt sửa `<html>`; thử cửa sổ ẩn danh/tắt tiện ích dịch và chỉ so sánh sau khi tải lại.
6. Dừng máy dev bằng Ctrl+C. Trước khi push, kiểm tra git status --short; .env phải bị .gitignore bỏ qua. Nếu key từng được commit, thu hồi và tạo key mới từ dashboard nhà cung cấp.

Các lệnh kiểm tra repository:

~~~~powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
~~~~

Nếu cần build trong khi `next dev` đang chạy và giữ thư mục `.next`, có thể dùng thư mục build riêng (chỉ nhận tên bắt đầu `.next-`; không đặt path ngoài repository):

~~~~powershell
$env:NAIVERSE_BUILD_DIST_DIR = '.next-local-build'
npm.cmd run build
Remove-Item Env:\NAIVERSE_BUILD_DIST_DIR
~~~~

## 2. Tạo Supabase, áp schema và nạp danh mục

1. Tạo project mới trong Supabase Dashboard. Chọn region phù hợp, đặt database password mạnh và lưu an toàn.
2. Vào **Connect** để lấy Project URL và publishable key, hoặc vào **Project Settings → API Keys**. Điền vào `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (dạng `sb_publishable_...`, dùng được ở trình duyệt cùng RLS)
   - `SUPABASE_SECRET_KEY` (dạng `sb_secret_...`, server-only; cần cho seed và tra username)
   Supabase đang chuyển từ `anon`/`service_role` sang `publishable`/`secret`. Code vẫn nhận `NEXT_PUBLIC_SUPABASE_ANON_KEY` và `SUPABASE_SERVICE_ROLE_KEY` làm tên tương thích cũ. Secret/service-role có quyền cao, bỏ qua RLS; tuyệt đối không đặt dưới tiền tố `NEXT_PUBLIC_`, đưa vào browser, commit hoặc log.
3. Vào SQL Editor và chạy toàn bộ `supabase/migrations/0001_naiverse_core.sql`. Migration này tạo bảng `places` và RLS nền tảng.
4. Trong `.env`, xác nhận URL, publishable key và secret key đã cấu hình. `SUPABASE_SECRET_KEY` (hoặc khóa cũ `SUPABASE_SERVICE_ROLE_KEY`) chỉ được dùng phía server để nạp catalog/tra username; không đưa vào client bundle hoặc log.
5. Nạp 36 hồ sơ trước các migration có khóa ngoại tới địa điểm:

   ~~~~powershell
   npm.cmd run seed:catalog
   ~~~~

   Lệnh dùng upsert ignoreDuplicates: chạy lại không ghi đè hồ sơ đã sửa. Kết quả mong đợi: `Đã seed danh mục lần đầu (36 hồ sơ)`.
6. Sau khi seed thành công, chạy lần lượt `supabase/migrations/0002_ai_features_and_usernames.sql`, `0003_place_evidence_refresh.sql`, `0004_suoi_mo_price_refresh.sql`, `0005_destination_media_and_reported_hours.sql`, `0006_add_sourced_osm_features.sql`, `0007_buu_long_hung_kings_day_prices.sql`, `0008_amazing_bay_published_hours.sql`, `0009_dong_nai_museum_reported_hours.sql`, `0010_war_zone_and_bu_lach_photos.sql` và `0011_thac_mo_archival_photo.sql`. Thứ tự này bắt buộc: các migration thêm dòng ảnh/giá/giờ có khóa ngoại tới `places`. Migration 3 bổ sung ảnh có giấy phép, 8 điểm feature OSM không phải cổng vào, vé Cát Tiên theo bảng có hiệu lực đến khi thay thế và giá Bửu Long lịch sử ngày 02/01/2026. Migration 2 thêm username, bảng ảnh/giờ, RLS và giá Amazing Bay. Migration 4 thêm bảng giá Suối Mơ chính thức: 130.000/150.000 ₫ người lớn ngày thường/Lễ Tết; 60.000/70.000 ₫ trẻ 1–1,4 m; dưới 1 m miễn phí. Nguồn ghi áp dụng từ 25/01/2025 đến khi có chính sách khác thay thế, được kiểm tra ngày 15/10/2026; xác nhận với cơ sở trước khi mua. Migration 5 thêm ảnh Cát Tiên có license và lưu lịch Bửu Long là `unknown` vì website cho biết nội dung có thể do AI viết; không chuyển lịch này sang `verified`. Migration 6 bổ sung thêm 2 điểm, nâng tổng lên 10 feature OSM (không phải cổng vào/trailhead), gồm The Amazing Bay (way 1163348358) và đỉnh Chứa Chan (node 6961182026). Migration 7 lưu giá Bửu Long được cổng thông tin Đồng Nai dẫn trong dịp 26/04/2026 dưới nhãn `historical`; đây không phải giá hiện tại. Migration 8 thêm giờ tuần 09:00–17:00 cho The Amazing Bay theo trang sản phẩm chính thức; giờ ngày lễ có thể khác. Migration 9 thêm lịch do Bảo tàng Đồng Nai đăng năm 2023: 07:00–11:00 và 13:30–17:00 Thứ Ba–Thứ Sáu, các ngày còn lại liên hệ đặt lịch; NaiVerse giữ `unknown` đến khi cơ sở xác nhận lại. Migration 10 thêm ảnh tư liệu có license cho Bù Lạch và con đường ở Chiến khu D; migration 11 thêm ảnh tư liệu hồ Thác Mơ chụp năm 2015, ghi công Lam Tr Th, CC BY-SA 3.0. Kiểm tra `profiles`, `places`, `place_media`, `place_hours`, `price_references`, `trips`, `trip_shares`, `organizations`, `organization_members`, `inquiries`, `quotes`, `place_reports`, `ai_usage`.
Sau các migration liệt kê ở bước 6, chạy lần lượt `supabase/migrations/0012_son_tien_amazing_world_prices.sql`, `0013_soc_bom_bo_archival_photo.sql`, `0014_bilingual_place_hours.sql`, `0015_bu_gia_map_archival_photo.sql`, `0016_suoi_mo_licensed_photo.sql`, `0017_suoi_mo_reported_hours.sql`, `0018_war_zone_ma_da_archival_photo.sql` và `0019_la_nga_landscape_photo.sql`. Migration 0012 lưu giá 45.000 ₫ vé trẻ em và 90.000 ₫ vé người lớn cho combo Hành Tinh Lạ khung giờ đêm 17:00–21:00; trang chưa nêu tiêu chí tuổi/chiều cao cho vé trẻ em, nên xác nhận trên hệ thống bán vé. Migration 0013 thêm ảnh tư liệu tượng Điểu Ong ở Sóc Bom Bo năm 2017, tác giả Kieprongbuon812, CC BY-SA 4.0. Migration 0014 thêm ghi chú giờ hoạt động tiếng Anh và backfill các hồ sơ Amazing Bay, Bửu Long, Bảo tàng Đồng Nai; chạy migration này để truy vấn `note_en` hoạt động sau khi kết nối Supabase. Migration 0015 thêm ảnh Bù Gia Mập chụp năm 2012, tác giả TuanUt, CC BY-SA 3.0; ảnh tư liệu không xác nhận quyền tiếp cận hoặc tình trạng hoạt động hiện nay. Migration 0016 thêm ảnh Công viên Suối Mơ của Chàng Trai Nông Thôn; trang Pexels ghi địa điểm Tân Phú, Đồng Nai và Pexels License. Migration 0017 lưu giờ 07:30–17:00 mà danh bạ Viet-Biz nêu ở cả bảy ngày, luôn với trạng thái `unknown`; không dùng lịch này để khẳng định điểm đang mở hoặc lập tuyến khả thi. Migration 0018 thêm ảnh rừng Mã Đà tại Chiến khu D chụp năm 2019, tác giả Phương Huy, CC BY-SA 4.0; ảnh tư liệu không xác nhận tình trạng rừng hoặc lối tiếp cận hiện nay. Migration 0019 thêm ảnh cảnh quan khu vực La Ngà năm 2015, Lam Tr Th, CC BY-SA 3.0; chú thích nêu rõ ảnh không mô tả một cơ sở lưu trú cụ thể.
7. Trong Authentication → URL Configuration, đặt Site URL local là http://localhost:3000 và thêm redirect URL cần dùng khi test. Khi có domain Vercel mới, thêm domain đó tại Supabase.
8. Email confirmation: để bật trên môi trường thật. Khi demo local, có thể tắt tạm Email confirmations trong Authentication → Providers → Email; bật lại trước deploy public. Đăng ký tại `/vi/auth` bằng tên hiển thị, username (3–24 ký tự chữ/số/gạch dưới), email và mật khẩu ít nhất 10 ký tự. Email dùng xác nhận/khôi phục tài khoản; lần sau đăng nhập được bằng username + password hoặc email + password. Username lưu chữ thường và có unique index; không tạo mật khẩu riêng ngoài Supabase.
9. Xác nhận RLS: Table Editor phải hiển thị RLS enabled trên các bảng. Không thêm policy using true cho dữ liệu chuyến, yêu cầu, báo giá, thành viên hoặc hồ sơ.

### Cấp tài khoản nhân viên demo

Đăng ký riêng một tài khoản nhân viên qua giao diện, xác nhận email nếu được yêu cầu, rồi chạy SQL sau trong Dashboard SQL Editor. Thay email bằng tài khoản demo của bạn; không dùng email khách thật. SQL Editor chạy với quyền quản trị dự án:

~~~~sql
insert into public.organization_members (organization_id, user_id, role)
select '00000000-0000-4000-8000-000000000001'::uuid, id, 'agent'
from auth.users
where email = 'staff-demo@example.com'
on conflict (organization_id, user_id) do update set role = excluded.role;
~~~~

Đăng nhập bằng tài khoản đó, mở /vi/partner. Hộp thư không có yêu cầu lúc đầu là bình thường. Thành viên chỉ thấy tổ chức được cấp; không cấp role owner/manager cho tài khoản tự phục vụ. Thành viên tổ chức không có quyền tự ghi/sửa role qua giao diện ứng dụng.

### Cấp quyền quản trị dữ liệu

Chỉ chủ project cấp quyền admin qua SQL Editor sau khi đăng ký một tài khoản riêng dùng cho admin:

~~~~sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'admin-demo@example.com'
on conflict (user_id) do nothing;
~~~~

Tài khoản đó mở `/vi/admin` (hoặc `/en/admin`) để cập nhật trạng thái, ghi chú, nguồn kiểm tra, tọa độ có căn cứ và xử lý báo cáo. Muốn đặt status reference phải điền URL nguồn và ngày kiểm tra. Phần **Độ phủ dữ liệu có nguồn** đếm ảnh/giờ/giá đã duyệt và cổng vào `entrance_verified`, đồng thời liệt kê hồ sơ còn thiếu. Chỉ tính bản ghi đã duyệt; mục giá/giờ đã duyệt nhưng chưa xác minh vẫn được tách khỏi số verified. Nhóm trải nghiệm không có một cổng vào duy nhất nên không tính vào mẫu số cổng. Trong khu vực **Ảnh, giờ hoạt động và giá**:

1. Chọn đúng địa điểm và loại bản ghi. Với ảnh, nhập URL ảnh HTTPS, trang nguồn, alt tiếng Việt/Anh, tác giả, tên giấy phép, URL điều khoản và ngày kiểm tra. Chỉ nhập ảnh bạn có quyền sử dụng; bật nhãn tư liệu khi ảnh cũ hoặc không thể hiện hiện trạng.
2. Với giờ, chọn đúng thứ trong tuần. Nếu giờ chưa biết thì để trống cả giờ mở và đóng, đặt trạng thái `Chưa xác minh`, ghi chú hai ngôn ngữ và nguồn đang có. Trạng thái `Đã xác minh` yêu cầu giờ, URL nguồn và ngày kiểm tra. Nếu thời gian chỉ có hiệu lực trong giai đoạn nhất định, điền cả ngày bắt đầu/kết thúc.
3. Với giá, để ô số tiền trống khi chưa biết; không nhập 0 trừ khi nguồn xác nhận miễn phí. Ghi rõ đối tượng, điều kiện, nguồn, ngày kiểm tra, hiệu lực và nhãn `Lịch sử`/`Mâu thuẫn` nếu áp dụng. Giá đã xác minh cần số tiền, URL nguồn và ngày kiểm tra.
4. Bấm **Lưu bản ghi chờ duyệt**. Bản ghi mới mặc định chưa được công khai. Đọc lại nguồn và nội dung trong danh sách bên dưới, rồi bấm **Duyệt** để công khai; dùng **Gỡ công khai** để ẩn lại. **Xóa** cần xác nhận và xóa vĩnh viễn bản ghi.
5. Tọa độ ở biểu mẫu địa điểm phải gắn đúng loại: chỉ chọn “Cổng vào đã xác minh” nếu nguồn thật sự xác định cổng; pin OSM tại thân công trình phải ghi là feature, không phải cổng. Không dùng tâm vùng, GPS của người dùng hay ảnh minh họa để điền tọa độ cổng.

Khách chỉ đọc được ảnh/giờ/giá đã được duyệt bằng policy RLS và các query public. Không cấp quyền admin cho tài khoản khách hoặc nhân viên thông thường. Nếu trang báo cần migration `0014_bilingual_place_hours.sql`, hãy áp lần lượt toàn bộ migrations theo bước 6 trước khi thử lại.

## 3. Cấu hình DeepSeek và hạn mức Upstash

### DeepSeek

1. Tạo API key trong tài khoản DeepSeek của bạn.
2. Điền phía server trong .env: DEEPSEEK_API_KEY, DEEPSEEK_MODEL=deepseek-v4-flash, DEEPSEEK_BASE_URL=https://api.deepseek.com.
3. Khởi động lại Next dev server. Đăng nhập, mở Journey Studio, nhập ví dụ:

   Gia đình 2 người lớn và 1 trẻ cao 120 cm, đi 2 ngày, ngân sách 3 triệu, thích thiên nhiên và cần phương án nếu mưa.

4. Đọc/điều chỉnh ràng buộc trước khi dùng kết quả. Kết quả thành công cần có 1–3 phương án, số ngày/khách đã trích xuất, điểm tham khảo, cảnh báo về dữ liệu chưa xác minh. Giá thiếu phải hiện là chưa xác nhận; tuyệt đối không kết luận đủ ngân sách khi chưa có dữ liệu giá.
5. Nếu báo chưa cấu hình: kiểm tra key/model/base URL, khởi động lại server. Nếu lỗi provider: kiểm tra key còn hiệu lực, quota/số dư và tình trạng model trên console DeepSeek. 401/403 thường cần kiểm tra key/quyền; 429 cần chờ hoặc kiểm tra quota. Ứng dụng không lưu prompt vào lịch sử server.
6. Ứng dụng gửi yêu cầu tới endpoint chat completions bằng JSON mode, thời gian chờ giới hạn, response giới hạn kích thước, kiểm tra schema bằng Zod và chỉ thử sửa đầu ra JSON/schema một lần. Nếu API báo JSON bị cắt do hết token, lần thử sửa duy nhất được tăng trần token gấp đôi nhưng không vượt 2.400. Không nhập thông tin cá nhân, contact hoặc GPS vào prompt. DeepSeek có thể đổi model được phục vụ phía provider; kiểm tra trang model/API khi xác nhận tích hợp.

7. Kiểm tra kết nối thật mà không in key/prompt: trong PowerShell đặt `$env:RUN_LIVE_AI_SMOKE='true'`, sau đó chạy `npm.cmd test -- src/lib/ai-live-smoke.test.ts`. Bộ này gọi model thật cho parser chuyến đi, forecast Open-Meteo, phân loại một sự cố không khẩn cấp, và giải thích số liệu tuyến bằng Zod. Mỗi lần chạy tạo vài request có tính phí; chỉ chạy chủ động, không bật trong CI.

8. Kiểm tra handler thời tiết bằng provider thật (DeepSeek + Open-Meteo), nhưng cô lập xác thực Supabase và giới hạn Upstash: đặt `$env:RUN_LIVE_AI_HANDLERS_SMOKE='true'`, rồi chạy `npm.cmd test -- src/lib/ai-handler-live-smoke.test.ts`. Test tạo 2 yêu cầu thời tiết (VI/EN) và một ca khẩn cấp bypass auth/Redis/model. Bộ này không kiểm tra định tuyến thật; để test ORS → geometry → DeepSeek, bật `RUN_LIVE_AI_FULL_ROUTE_SMOKE` như phần cập nhật live ở cuối tài liệu. Mỗi lần chạy có thể tốn phí model; không bật trong CI.

Probe phiên kiểm tra này nhận HTTP 200, JSON hợp lệ, provider báo model `deepseek-flash` cho alias cấu hình `deepseek-v4-flash`. Provider có thể đổi cách định tuyến; luôn kiểm tra lại trước buổi demo.

### Upstash Redis

1. Tạo database Redis REST trong Upstash Console, chọn region gần app.
2. Mở database vừa tạo, vào **Connect → REST API** (hoặc tab Details), sao chép HTTPS URL và token. Điền `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` trong `.env`. Không dùng read-only token vì ứng dụng cần ghi bộ đếm giới hạn.
3. Mặc định: AI_USER_MINUTE_LIMIT=5, AI_USER_DAILY_LIMIT=20, AI_GLOBAL_DAILY_LIMIT=200. Server khóa yêu cầu AI khi Redis thiếu hoặc lỗi; đây là fail-closed để tránh chi phí không giới hạn.
4. Gửi 1 yêu cầu AI rồi kiểm tra logs/usage của Redis. Để thử giới hạn, hạ tạm giới hạn trong .env, khởi động lại, gửi quá số lần và xác nhận nhận thông báo giới hạn; phục hồi giá trị sau thử. Không ghi token Redis vào ảnh hoặc log.

### AI thời tiết, an toàn và du lịch xanh

1. Áp migration 0002, cấu hình Supabase, Upstash và DeepSeek rồi đăng nhập. Mở `/vi/ai/conditions` hoặc `/en/ai/conditions`.
2. Chọn GPS gần đúng hoặc nhập tọa độ/ghim đại diện khu vực; đặt ngày trong phạm vi forecast Open-Meteo (tối đa 7 ngày theo cấu hình hiện tại) và hoạt động ngoài trời; tích consent rồi gửi. Tọa độ được làm tròn 0,1 độ (~11 km) chỉ gửi Open-Meteo, không gửi vào prompt model hoặc lưu hồ sơ. Màn hình phải hiện forecast, xác suất mưa, thời gian lấy nguồn, gợi ý chuẩn bị/phương án trong nhà và cảnh báo đây là forecast theo vùng, không phải thông báo chính thức.
3. Thử sự cố chưa khẩn cấp: “Tôi bị thất lạc túi ở điểm tham quan.” AI trả hướng dẫn cơ bản, không chẩn đoán y tế. Thử “Tôi đang khó thở”: phản hồi phải hiện 113/114/115 ngay và `aiUsed=false`, không gọi DeepSeek. Khi nguy hiểm hãy gọi trực tiếp; không dựa vào nhận diện tự động từ khóa để phân loại mọi tình huống.
4. Thử yêu cầu mua bán động vật hoang dã/tìm tổ chim; AI phải từ chối hướng dẫn gây hại và không gợi vị trí nhạy cảm. Gợi ý xanh chỉ nói giảm quãng đường/đi chung xe/mang bình nước; không khẳng định carbon-neutral hay nhà cung cấp xanh đã xác minh.
5. Khi Open-Meteo timeout/ngày không có dự báo hoặc DeepSeek lỗi, cần có thông báo lỗi, không hiển thị kết quả giả. Kiểm tra điều khoản free/non-commercial trước public thương mại.

### AI giao thông và bản đồ

1. Tạo key OpenRouteService trong developer dashboard, đặt `OPENROUTESERVICE_API_KEY` chỉ ở server, rồi mở `/vi/ai/routes` sau khi đăng nhập.
2. Nhấp ít nhất hai điểm trên bản đồ; điểm đầu và cuối được giữ cố định, các điểm ở giữa được sắp thứ tự qua ma trận ORS. Chọn ưu tiên thời gian hoặc quãng đường; nhập số khách, giờ khởi hành và nhắc ghế trẻ em nếu cần; tích consent rồi so sánh.
3. Kết quả gồm geometry nhanh/ngắn theo cùng thứ tự đã gợi ý, km/phút, bảng thứ tự điểm, ước lượng ma trận, giải thích DeepSeek và nguồn. Nút **Áp dụng thứ tự gợi ý** đổi thứ tự các pin hiện tại. Tối đa 8 điểm, nên server có thể xét toàn bộ hoán vị bên trong với hai đầu cố định.
4. Matrix lỗi thì app giữ thứ tự nhập và nói rõ chưa tối ưu; không vẽ đường thẳng thay tuyến. Matrix tối ưu theo tổng pairwise duration hoặc distance của ORS, nhưng đây chỉ là tối ưu trên các metric của matrix, không bảo đảm tối ưu trên mọi điều kiện đường thực tế. Quãng ngắn chỉ là proxy giảm đường vòng, không phải số phát thải.
5. Ghim do người dùng chọn, không phải cổng đã xác minh. DeepSeek chỉ nhận tên điểm và số liệu tuyến; tọa độ chỉ gửi ORS. Không có traffic realtime, lịch bus, chỗ đỗ, đường đóng, thời lượng dịch vụ hoặc giờ đóng cửa được xác minh; lựa chọn “tránh đến muộn” không bảo đảm đến trước giờ đóng hay tránh đi ban đêm.
6. Thiếu ORS key trả `routing_not_configured`. Khi lỗi, kiểm tra quota, key/profile, vị trí ghim và phản hồi provider. Public ORS giới hạn từng dịch vụ; xem [ORS API restrictions](https://openrouteservice.org/restrictions/) và [API docs](https://openrouteservice.org/dev/) trước khi tăng tải.

### Có cần LangChain/RAG không?

Chưa cần LangChain/vector database cho 36 hồ sơ có cấu trúc. API truy xuất nguồn (Open-Meteo forecast, ORS route metrics, danh mục/giá đã duyệt) nạp phần liên quan thành context giới hạn rồi DeepSeek giải thích bằng JSON; tính toán và nguồn do server quyết định. Đây là retrieval có căn cứ, chưa phải kho RAG embedding tổng quát. Chỉ bổ sung LangChain/vector search khi corpus nguồn tăng đáng kể và đã có bài đánh giá recall, phiên bản tài liệu, lọc quyền, trích dẫn; RAG không thay nguồn realtime thời tiết/tuyến.

## 4. Định tuyến, bản đồ và dịch vụ miễn phí

- Map dùng Leaflet và OpenStreetMap tiles, luôn hiển thị attribution. Tuân thủ tile policy: không tải trước/offline, không quét tile tự động, đổi nhà cung cấp nếu lưu lượng tăng. Danh mục hiện chưa có cổng vào đã đối chiếu; route assistant dùng pin do khách chọn chứ không tự gán pin cho điểm đến.
- Không dùng public Nominatim cho autocomplete. Search hiện lọc catalog NaiVerse, hỗ trợ alias hiện có; không gửi truy vấn địa chỉ đến Nominatim.
- ORS trả ước tính mạng đường, không có kẹt xe realtime; route assistant tối ưu hoán vị các điểm trung gian từ ma trận ORS, giữ điểm đầu/cuối. Nó không dùng giờ xe buýt, bãi đỗ hay giờ mở để tối ưu.
- GPS chỉ được đọc sau thao tác chủ động và quyền trình duyệt. Trợ lý forecast làm tròn tọa độ đến 0,1 độ, chỉ gửi Open-Meteo; model không nhận GPS. Route pins chỉ gửi ORS.
- Open-Meteo đã được nối cho forecast theo ngày, trong phạm vi 7 ngày và tại vùng tọa độ làm tròn. Dự báo không phải cảnh báo chính thức, không phải phép đo tại cửa điểm đến; xem điều khoản free/non-commercial.

## 5. Test tính năng theo vai trò

| Vai trò / thao tác | Dữ liệu demo | Kết quả cần thấy |
|---|---|---|
| Khách chưa đăng nhập mở /vi, /en, /vi/places | Không cần dữ liệu cá nhân | Catalog và bộ lọc chạy; AI yêu cầu đăng nhập; link locale đổi đúng ngôn ngữ. |
| Đăng ký/đăng nhập | Username `demo_khach01`, email thử nghiệm, mật khẩu >=10 ký tự | Đăng ký gửi username vào metadata/profile; sau khi xác nhận email đăng nhập bằng username+password; thử email+password vẫn hoạt động. Username sai/mật khẩu sai trả thông báo chung; thiếu Upstash hoặc service role thì username login fail-closed. |
| Khách đăng nhập, mở Journey Studio | Gia đình 2 người lớn, trẻ cao 120 cm, 2 ngày, 3 triệu | DeepSeek trích nhu cầu; mã ứng dụng tạo các hướng gợi ý; thông tin giá/tuyến/giờ thiếu được cảnh báo. |
| Weather Brief/Rain Plan/Green Trip Advisor | Ngày mai, GPS thử hoặc tọa độ khu vực, “đi bộ ngoài trời” | Open-Meteo trả forecast, nguồn/thời điểm; DeepSeek gợi ý chuẩn bị, phương án trong nhà và hành vi xanh; không tự gắn cảnh báo chính thức/carbon-neutral. |
| Incident triage khẩn cấp | Nhập “Tôi đang khó thở” | Hiện 113/114/115 trực tiếp, `aiUsed=false`, không chờ hoặc gọi LLM. Sự cố thường như thất lạc túi mới cần đăng nhập/Upstash/DeepSeek. |
| AI route assistant | Thêm 4 pin, để điểm đầu/cuối làm mốc, chọn “ít km” | Matrix ORS xếp lại hai điểm giữa; directions tạo geometry theo thứ tự đó; có thể áp dụng thứ tự, vẫn nêu thiếu traffic realtime và giờ hoạt động. |
| Khách gửi yêu cầu | Lưu hành trình; nhập tên/email demo và tích consent | Trang hiển thị rõ tổ chức DEMO và dữ liệu chia sẻ trước gửi; yêu cầu xuất hiện trong /vi/trips và hộp thư nhân viên. Không ghi nhận booking. |
| Khách chia sẻ trip | Bấm Chia sẻ | Clipboard có link chứa token ở fragment URL; người nhận chỉ xem; API hỗ trợ kiểm tra token hết hạn/không hợp lệ. |
| Nhân viên DEMO | Email đã cấp membership theo SQL | /vi/partner đọc yêu cầu; đổi trạng thái; lưu quote nháp; nút Duyệt và chia sẻ khiến quote xuất hiện phía khách. |
| Khách nhận báo giá | Quote có status shared | Thấy cấu phần, điều kiện, giá chưa biết; draft không hiển thị cho khách. |
| Khách A/B và tổ chức A/B | Tạo hai user/two memberships trên Supabase riêng | Dùng API bằng session A để đọc trip B và dùng member A để đọc lead B; cần nhận 404/không có hàng do RLS. Không lấy một lần chạy đơn lẻ làm chứng nhận kiểm thử bảo mật. |
| Dịch vụ lỗi | Gỡ key trong môi trường local hoặc dùng key thử không hợp lệ | AI/Redis/route báo lỗi rõ; prompt chưa lưu và không có kết quả thành công giả. Không thử phá dịch vụ trên production. |

### Checklist dữ liệu nêu trong ý tưởng

- Amazing Bay: FAQ chính thức Sơn Tiên được kiểm tra ngày 15/10/2026 nêu 490.000đ người lớn trên 1,4 m, 270.000đ trẻ 1–1,4 m, dưới 1 m miễn phí. Đây là ảnh chụp nguồn theo ngày, có thể thay đổi; xác nhận trước khi mua.
- VQG Cát Tiên: bảng giá do Trung tâm Giáo dục Môi trường và Dịch vụ công bố nêu giá vào vườn người lớn 60.000đ, người cao tuổi đủ điều kiện 30.000đ, sinh viên 20.000đ, trẻ dưới 16 tuổi 10.000đ; tài liệu ghi hiệu lực đến khi có bảng mới. Vé không bao gồm dịch vụ khác; xác nhận với VQG trước khi đi.
- Bửu Long: UBND phường Trấn Biên công bố 150.000đ người lớn, 60.000đ trẻ cao 1–1,4 m, miễn phí dưới 1 m cho dịp Tết Dương lịch 2026; cổng thông tin Đồng Nai dẫn mức giá tương tự cho ngày 26/04/2026. Trong app đây là **giá lịch sử**, không khẳng định còn hiện hành vào tháng 10/2026.
- Suối Mơ: nguồn 2025 chỉ là lịch sử; không hiển thị là giá hiện tại.
- Đảo Ó – Đồng Trường: hồ sơ ở trạng thái paused reference; không chèn vào lịch trình như dịch vụ đang bán.
- Khách cần xe lăn: catalog chưa có khảo sát tiếp cận nên không xác nhận phù hợp.
- Dị ứng: nội dung form hướng khách yêu cầu cơ sở xác nhận trực tiếp; app không cam kết món ăn an toàn.
- Đoàn 40 người: parser chấp nhận tối đa 40, nhưng chưa có capacity/booking realtime; báo giá là nháp DEMO cần người duyệt.
- Ngày đi: forecast Open-Meteo trong phạm vi 7 ngày, nhưng giờ mở cửa/khả năng nhận khách vẫn chưa xác minh; lịch trình là gợi ý, không phải lịch khả thi đã chứng thực.

## 6. Đưa code lên GitHub và import Vercel

1. Kiểm tra .env không nằm trong staging. Khởi tạo repository Git cục bộ và commit code:

   ~~~~powershell
   git init
   git add .
   git status --short
   git commit -m "Build NaiVerse tourism MVP"
   ~~~~

2. Tạo repository GitHub riêng, thêm remote theo URL do GitHub cung cấp, rồi push branch. Không chép .env lên GitHub.
3. Trong Vercel, Add New → Project → Import Git Repository. Framework preset Next.js; Node.js version 24.x.
4. Mở Project Settings → Environment Variables và khai báo `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (server-only cho seed/username lookup), `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_BASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `OPENROUTESERVICE_API_KEY`, `NEXT_PUBLIC_MAP_TILE_URL`, `NEXT_PUBLIC_APP_URL`, các AI limits và `DEMO_MODE=true`. Chỉ URL và publishable key được đưa vào client. Secret key, DeepSeek, Redis và ORS phải để server-only/encrypted; không dùng secret/service-role ở client.
5. Chọn Production/Preview scopes phù hợp và Deploy. Thêm URL HTTPS Vercel vào Supabase Auth redirect allowlist. Redeploy sau khi sửa env.
6. Smoke test trên URL công khai: /vi, /en, đăng ký/đăng nhập, AI sau khi có Redis, lưu trip, gửi yêu cầu, member DEMO lập và chia sẻ quote. Kiểm tra Cloud logs không chứa secrets. Lưu URL, timestamp, kết quả và ảnh đã che dữ liệu cá nhân.
7. Nếu deploy lỗi: mở Deployment → Build Logs; kiểm tra Node 24, env server-only, migration/schema, Supabase URL allowlist và CI. Rollback bằng Vercel Deployments → chọn deployment trước đó → Promote to Production. Cấu hình provider/database không tự rollback theo phiên bản app.

## 7. Cập nhật dữ liệu và dọn demo

- Sửa địa điểm qua migration/SQL có review; tọa độ cần độ chính xác (`entrance_verified`, `venue_feature`, `approximate`), URL nguồn, nhãn và ngày kiểm tra. Chỉ `entrance_verified` mới được gọi là tọa độ cổng. Không coi vị trí tâm khu vực là cổng vào.
- Khi sửa hồ sơ đã seed, seed script sẽ giữ nguyên hàng đã có; cập nhật có chủ ý bằng migration SQL hoặc quy trình quản trị có backup/review. Ghi riêng nguồn, ngày kiểm tra, thời gian hiệu lực và trạng thái.
- Chạy `npm.cmd run catalog:photo-gaps` để xem tên và mã hồ sơ chưa có ảnh có nguồn; lệnh chỉ kiểm kê catalog, không tải ảnh hoặc tự gán ảnh. Chỉ thêm file/migration sau khi đã kiểm tra trang nguồn và giấy phép.
- Chỉ thêm giá status verified khi có số tiền, URL nguồn và checked_at; UI không coi giá quá 30 ngày là hiện hành, dù vẫn giữ mục đó để tham khảo. Historical/conflicting/unknown không được dùng để khẳng định giá hiện tại. Suối Mơ có giá theo bảng chính thức 2025, ghi áp dụng đến khi thay thế; rà soát nguồn 15/10/2026 nhưng vẫn khuyến nghị xác nhận trực tiếp.
- Cập nhật sau kiểm kê: migration `0022_ma_da_archival_forest_photo.sql` thêm ảnh CC BY-SA 4.0 cho Khu Bảo tồn Mã Đà; migration `0024_tran_bien_main_gate_photo.sql` thêm ảnh tư liệu cổng chính Văn Miếu Trấn Biên. Tổng mới nhất là 29 ảnh (28 Wikimedia, 1 Pexels) cho 22/36 hồ sơ. Chi tiết giấy phép và trình tự migration ở cuối tài liệu.
- Danh mục hiện có 26 ảnh Wikimedia và 1 ảnh Pexels cho 21/36 hồ sơ: Cát Tiên, hồ Trị An, Đảo Ó, Bửu Long, Giang Điền, Văn miếu Trấn Biên, đền Nguyễn Hữu Cảnh, Bảo tàng Đồng Nai, Bò Cạp Vàng, Bù Lạch, Chiến khu D, hồ Thác Mơ, Sóc Bom Bo, Tà Lài, Thác Mai, núi Chứa Chan, núi Bà Rá, Đá Ba Chồng, Bù Gia Mập, Công viên Suối Mơ và nhóm lưu trú ven hồ La Ngà. Ảnh La Ngà do Lam Tr Th chụp năm 2015, CC BY-SA 3.0, chỉ mô tả cảnh quan khu vực và được ghi rõ không phải ảnh cơ sở lưu trú. Ảnh Suối Mơ của Chàng Trai Nông Thôn; trang Pexels ghi địa điểm Tân Phú, Đồng Nai, cấp phép theo Pexels License. Ảnh Bảo tàng Đồng Nai là mặt tiền nhìn từ quảng trường, chụp năm 2022, tác giả Hoangkid, CC BY-SA 4.0; ảnh Bò Cạp Vàng do Prenn chụp năm 2008, CC BY-SA 3.0. Ảnh Bù Lạch, ảnh con đường Chiến khu D và hồ Thác Mơ do Lam Tr Th chụp năm 2015, CC BY-SA 3.0; hồ sơ Chiến khu D có thêm ảnh rừng Mã Đà năm 2019 của Phương Huy, CC BY-SA 4.0. Ảnh tượng Điểu Ong tại khu bảo tồn văn hóa Sóc Bom Bo do Kieprongbuon812 chụp năm 2017, CC BY-SA 4.0. Ảnh Bù Gia Mập chụp ngày 29/03/2012 do TuanUt, CC BY-SA 3.0; không dùng ảnh tư liệu này làm bằng chứng quyền tiếp cận/hiện trạng. Cát Tiên có ảnh hồ Cá Sấu chụp năm 2021, license CC BY-SA 4.0. Thẻ địa điểm hiển thị ảnh/credit; trang chi tiết có gallery và giấy phép. Ảnh lưu trữ được gắn nhãn, không dùng làm bằng chứng hiện trạng. Các trang mô tả/credit/license đã được đối chiếu ngày 15/10/2026; tải ảnh trực tiếp cần kiểm tra thêm trong trình duyệt khi demo.
- Tọa độ từ OSM hiện có cho 10/36 hồ sơ dưới dạng đối tượng địa lý (feature), không phải cổng vào đã khảo sát; trang ghi độ chính xác và link đối tượng OSM. Hai điểm mới là The Amazing Bay (water-park way 1163348358) và đỉnh Chứa Chan (natural-peak node 6961182026). **0/36 cổng vào được xác minh**. Ngày 15/10/2026, truy vấn OSM API theo các bbox nhỏ quanh 10 feature hiện có không trả về phần tử được gắn thẻ `entrance` hoặc `barrier=gate`; đây chỉ là rà soát quanh các pin, không chứng minh toàn bộ lối vào đã được map. OSM có way 607285058 tên “Đường Vào Khu Du Lịch Sơn Tiên”, tag `highway=tertiary`; tên đường này chưa xác định điểm cổng nên không dùng làm tọa độ cổng. Pin Chứa Chan là đỉnh núi, không phải bãi xe hay trailhead. Nhóm trải nghiệm và điểm chưa có đối tượng OSM cụ thể không bị gán pin.
- Lịch tuần có nguồn: 4/36; chỉ 1 lịch được xác minh. Trang sản phẩm The Amazing Bay ghi Thứ Hai–Chủ Nhật 09:00–17:00; giờ ngày lễ có thể khác. FAQ Sơn Tiên nêu giờ kéo dài vào một số dịp, không ghi đè lịch tuần. Trang Bửu Long ghi 07:00–17:00, nghỉ thứ Ba trừ lễ/Tết, nhưng footer website nói nội dung được viết bằng AI; NaiVerse giữ status `unknown`. Trang Bảo tàng Đồng Nai đăng ngày 18/12/2023 nêu giờ hành chính Thứ Ba–Thứ Sáu, 07:00–11:00 và 13:30–17:00; các ngày khác cần liên hệ đặt lịch. NaiVerse giữ lịch này `unknown` do đã lâu chưa được xác nhận. Danh bạ Viet-Biz liệt kê Suối Mơ mở hàng ngày 07:30–17:00; đây không phải nguồn của nhà vận hành, nên NaiVerse giữ `unknown` và khuyến nghị gọi xác nhận. Không dùng ba lịch chưa xác minh để tính lịch trình khả thi.
- `place_hours`, `place_media` và `price_references` chỉ hiển thị các dòng `approved=true`. Quản trị viên nhập, xem nguồn và duyệt tại `/vi/admin` theo quy trình ở mục cấp quyền; bản ghi tạo mới chưa công khai. Tuyệt đối không đánh dấu `verified` nếu nguồn không có thông tin tương ứng.
- Xóa dữ liệu demo qua Supabase Table Editor/SQL theo thứ tự phụ thuộc và chỉ trên project demo đã xác nhận. Không chạy lệnh xóa hàng loạt trên database production.

## 8. Nhật ký bằng chứng hiện tại

Bảng dưới đây ghi nhận các kiểm tra trong workspace ngày 15/10/2026. Build/test chứng minh mã trong repository; chúng không thay cho tích hợp dịch vụ hoặc deploy.

| Hạng mục | Trạng thái đã kiểm tra | Còn cần bằng chứng |
|---|---|---|
| Lint và TypeScript | Sau UI quản trị và migration ảnh: `npm.cmd run lint` và `npx.cmd tsc --noEmit --incremental false` đạt ngày 15/10/2026 | CI trên GitHub sau khi push |
| Unit test | Chạy lại ngày 15/10/2026 lúc 17:55: `npm.cmd test -- --maxWorkers=1` đạt 46, bỏ qua 14 live smoke (60 test, 12 file); test coverage chỉ tính ảnh/evidence đã duyệt và không coi feature point là cổng vào | Live smoke chỉ bật chủ động; CI chưa chạy trên GitHub |
| DeepSeek thật | Ngày 15/10/2026: chạy 4 file live smoke đạt 18 bài; kiểm tra parser/lập lịch, tư vấn thời tiết/sự cố VI–EN và giải thích tuyến. `plan-live-smoke` chạy endpoint với catalog; các bài full route lấy geometry thật từ OpenRouteService. | Auth/Upstash/database được mock; smoke không chứng minh đăng nhập hoặc giới hạn Redis thật. Kết quả phụ thuộc quota/model routing; chạy lại trước demo |
| Sửa JSON lệch schema | Unit test chứng minh sửa một lần thành công khi model trả sai schema, tăng trần token một lần khi `finish_reason=length`, và dừng sau đúng một lần sửa nếu vẫn sai | Theo dõi tỷ lệ lỗi/độ trễ trên cấu hình dịch vụ thật; không log prompt hoặc dữ liệu liên hệ |
| Weather + AI | Chạy handler smoke ngày 15/10/2026 đạt 4/4: DeepSeek/Open-Meteo thật qua POST handler cho VI/EN; urgent handler trả hotline 113/114/115 và bypass auth/Redis/model. Test cô lập mock user + limiter, không ghi prompt vào log | Không chứng minh session hoặc RLS thật |
| AI tuyến | Live full-route smoke ngày 15/10/2026 lấy geometry nhanh/ngắn thật từ OpenRouteService rồi gọi DeepSeek giải thích; các bài ORS riêng cũng đạt. Unit test xác nhận tối ưu matrix giữ điểm đầu/cuối; API nêu rõ không có traffic realtime hay cổng vào đã xác minh | Luồng browser, session và giới hạn Redis thật chưa kiểm chứng |
| Production build | Chạy lại ngày 15/10/2026 với dist riêng `.next-naiverse-photo-verify-20261015`: biên dịch, TypeScript và sinh 40/40 route đạt; output riêng đã dọn và tham chiếu TypeScript generated được hoàn nguyên, `npm.cmd run typecheck` đạt lại | Build GitHub Actions/Vercel sau khi repository được push |
| Trang chạy local | Dev server `/vi` và `/en` trả 200; `/` chuyển hướng 307; trang chi tiết Bù Gia Mập render được credit TuanUt, CC BY-SA 3.0 và nhãn ảnh tư liệu | URL Vercel, kiểm tra tải ảnh bytes trực tiếp và smoke test sau deploy; extension trình duyệt có thể chèn thuộc tính ngoài app vào `<html>` |
| API admin dữ liệu | 4 unit tests kiểm tra cần platform admin, ảnh mặc định pending, từ chối client tự public và yêu cầu source/date cho giá verified | Auth endpoint có phản hồi nhưng bảng REST `places` trả 404; chưa chứng minh migrations/schema/RLS đã áp dụng trên project thật |
| Supabase Auth/Postgres/RLS | Auth `/health` và `/settings` trả HTTP 200 ngày 15/10/2026 bằng cấu hình `.env`; source có migration, seed, username login và RLS. GET REST ngày 15/10/2026 trả HTTP 404 `PGRST205` cho `places?select=id&limit=1` | Bảng chưa có trong schema cache project đang cấu hình hoặc migrations chưa được áp dụng; chưa có bằng chứng schema/RLS thật. Chưa tạo tài khoản test hoặc xác minh đăng ký, xác nhận email, đăng nhập hay RLS A/B |
| Upstash rate limit | Redis REST `PING` trả `PONG` ngày 15/10/2026; code giới hạn và fail-closed đã có | Chưa chạy quota limiter thật theo user/ngày/phút hoặc kiểm thử Redis lỗi |
| OpenRouteService | Tích hợp directions nhanh/ngắn đã chạy với geometry thật trong live smoke; catalog chưa có cổng vào đã xác minh | Luồng browser/session chưa kiểm chứng; route pin là do người dùng chọn, không đại diện cổng thật |
| Khách → nhân viên → báo giá | API/màn hình và dữ liệu demo có trong repository | Kiểm thử workflow bằng khách và thành viên doanh nghiệp thật trên Supabase, gồm ngăn truy cập chéo |
| E2E, mobile, accessibility | Chưa có kết quả Playwright/accessibility/thiết bị thật trong phiên này | Chạy browser/device audit và lưu báo cáo |
| Vercel | Chưa deploy | Import repository, cấu hình encrypted environment variables, lưu URL và smoke-test |

Lưu ý: handler smoke gọi endpoint trực tiếp trong tiến trình test và mock session/Redis để tập trung kiểm tra điều phối provider; nó không chứng minh người dùng đã gọi endpoint qua browser với xác thực thật. Cấu hình Supabase Auth và Upstash có phản hồi sức khỏe; OpenRouteService đã trả route thật; tuy vậy REST catalog `places` trả 404, quota limiter thật chưa chạy, và đăng ký/đăng nhập/RLS/workflow khách–doanh nghiệp chưa được xác minh. Không chụp hoặc chia sẻ giá trị trong `.env`.

Kiểm tra dependency được ghi nhận ngày 15/10/2026: `npm audit --omit=dev --audit-level=moderate` báo 0 lỗ hổng production; `npm audit` báo 5 mức high do advisory `braces` được kéo gián tiếp qua `micromatch` và `fast-glob` của `eslint-config-next` (dependency development). Đây là kết quả cũ cần chạy lại trước khi phát hành. Theo dõi [GitHub Advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
## 9. Tài liệu nhà cung cấp cần đối chiếu khi cấu hình

- Next.js App Router và thành phần client-only: https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
- Supabase SSR cho Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase tạo/lấy API keys publishable và secret: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase RLS và kết hợp grants/policies: https://supabase.com/docs/guides/database/postgres/row-level-security
- DeepSeek JSON mode và trường hợp output rỗng: https://api-docs.deepseek.com/guides/json_mode
- DeepSeek thinking toggle: https://api-docs.deepseek.com/guides/thinking_mode/
- Upstash Ratelimit TypeScript: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
- Upstash lấy REST URL/token: https://upstash.com/docs/redis/howto/connect-with-upstash-redis
- Vercel import repository GitHub: https://vercel.com/docs/git/vercel-for-github
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel Node.js versions: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Vercel Hobby là non-commercial/personal: https://vercel.com/docs/plans/hobby
- OpenStreetMap tile usage: https://operations.osmfoundation.org/policies/tiles/
- Nominatim public API cấm autocomplete: https://operations.osmfoundation.org/policies/nominatim/

### Bổ sung bảng giá dịch vụ Thác Giang Điền

Trang [Bảng Giá Dịch Vụ Khu Du Lịch](https://giangdien.vn/dich-vu/bang-gia-dich-vu-khu-du-lich/) của nhà vận hành liên kết các bảng ảnh về combo camping và thuê lều. Bản ghi được rà soát ngày 15/10/2026, gồm 5 combo camping (449.000–999.000 ₫/khách) và 6 mức thuê lều (180.000–500.000 ₫/lều theo điều kiện ghi trên bảng). Các tệp không ghi ngày hiệu lực, vì vậy tất cả được lưu `unknown`, không dùng để tính tổng dự toán và phải được cơ sở xác nhận. Nguồn từng dòng là tệp bảng giá trực tiếp tại `giangdien.vn/wp-content/uploads/2024/08/`.

Sau migration `0019_la_nga_landscape_photo.sql`, chạy `supabase/migrations/0020_giang_dien_camping_price_notes.sql` trong SQL Editor. Migration chạy lặp an toàn; nó thêm 11 bản ghi đã duyệt để khách xem được, nhưng trạng thái hiệu lực vẫn là `unknown`. Không nâng trạng thái lên `verified` nếu chưa có ngày hiệu lực hoặc xác nhận mới từ nhà vận hành. Trang chính thức công bố số liên hệ 0251 392 3930 và 0923 035 115.

Sau migration `0020`, chạy tiếp `supabase/migrations/0021_giang_dien_current_price_and_general_hours.sql`. Trang sản phẩm [Combo 1 Lều A](https://giangdien.vn/san-pham/leu-san-a/) hiện công bố 449.000 ₫/khách, áp dụng từ 2 khách, cùng điều kiện chiều cao và dịch vụ đi kèm; riêng khoản này được lưu `verified` theo nguồn operator và tự hết nhãn mới sau 30 ngày nếu không rà soát lại. Cùng trang ghi giờ hoạt động khu vui chơi 07:30–17:00 nhưng không nêu ngoại lệ theo thứ; migration lưu như giờ chung `weekday=-1`, trạng thái `unknown`. Không diễn giải thành lịch hàng ngày đã xác nhận. Chạy migration 0021 sau 0020 vì nó cập nhật giá combo 01 và nới ràng buộc `place_hours.weekday` để nhận giá trị `-1` cho lịch chung.

### Ảnh tư liệu Khu Bảo tồn Mã Đà

Kiểm kê mới nhất ngày 15/10/2026 có 29 ảnh nguồn mở cho 22/36 hồ sơ (28 ảnh Wikimedia Commons, 1 ảnh Pexels). Có 28 URL ảnh duy nhất vì ảnh rừng Mã Đà được dùng ở hai hồ sơ với alt text riêng. Để kiểm tra ảnh còn trả nội dung ảnh trước demo, chạy `npm.cmd run catalog:check-photos`; lần kiểm tra ngày 15/10/2026 đạt **28/28 URL duy nhất trả `image/*`**. Lệnh chỉ gửi HEAD với tối đa hai kết nối đồng thời, không tải nội dung ảnh; nó không xác minh lại license hoặc hiện trạng địa điểm. Danh sách 14 hồ sơ còn thiếu và quy trình bổ sung ảnh có license được ghi ở [docs/PHOTO_GAPS.md](PHOTO_GAPS.md). Ảnh rừng Mã Đà năm 2019 của Phương Huy, CC BY-SA 4.0, được dùng cho hồ sơ Chiến khu D và Khu Bảo tồn Mã Đà vì trang tệp ghi rõ rừng Mã Đà và phân loại tại Chiến khu D. Ảnh tư liệu cổng chính Văn Miếu Trấn Biên năm 2009 của Thuydaonguyen, CC BY-SA 3.0, thuộc gallery Văn Miếu; không xác nhận cổng vào hiện dùng. Ảnh tư liệu không chứng minh quyền tiếp cận hoặc hiện trạng. Sau migration `0021`, chạy `supabase/migrations/0022_ma_da_archival_forest_photo.sql`; sau đó chạy `0023_buu_long_2026_summer_report.sql` và `0024_tran_bien_main_gate_photo.sql` theo thứ tự.

Sau migration `0022`, chạy `supabase/migrations/0023_buu_long_2026_summer_report.sql`. Báo Đồng Nai ngày 07/08/2026 dẫn Ban Giám đốc KDL Bửu Long về lịch 07:00–17:00, nghỉ thứ Ba trừ lễ/Tết; dữ liệu vẫn để `unknown` vì chưa xác nhận lại sau ngày đăng. Migration lưu năm mức giá/ưu đãi được bài báo nêu ở trạng thái `historical`; khuyến mãi mùa hè hết hạn 31/08/2026. Không dùng chúng làm giá hiện hành. Nguồn: https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/.

Để gọi DeepSeek thật theo bộ smoke test (phát sinh các request model), chạy tại PowerShell trong repository:

~~~~powershell
$env:RUN_LIVE_AI_SMOKE = 'true'
npm.cmd test -- src/lib/ai-live-smoke.test.ts
Remove-Item Env:\RUN_LIVE_AI_SMOKE

$env:RUN_LIVE_AI_HANDLERS_SMOKE = 'true'
npm.cmd test -- src/lib/ai-handler-live-smoke.test.ts
Remove-Item Env:\RUN_LIVE_AI_HANDLERS_SMOKE

$env:RUN_LIVE_ROUTE_SMOKE = 'true'
npm.cmd test -- src/lib/ai-live-smoke.test.ts
Remove-Item Env:\RUN_LIVE_ROUTE_SMOKE
~~~~

Kết quả lần chạy ngày 15/10/2026: DeepSeek trực tiếp 9 passed/1 skipped; endpoint handlers 4 passed, trong đó Open-Meteo lấy dự báo thật nhưng đăng nhập/Upstash được cô lập và route metrics dùng fixture; ORS riêng 2 passed/8 skipped, có geometry đường thật. Đây là bằng chứng provider ở thời điểm kiểm tra, không chứng minh Supabase Auth, Redis, RLS hoặc người dùng Vercel đã hoạt động thật.

### Lối tắt tính năng AI và kiểm tra mới nhất — 15/10/2026

Trang chủ có ba lối tắt ngay trong hero: **AI lập kế hoạch chuyến đi**, **AI thời tiết, an toàn & du lịch xanh**, và **AI giao thông & hành trình**. Có thể mở trực tiếp `/vi/ai/conditions`, `/en/ai/conditions`, `/vi/ai/routes`, `/en/ai/routes`; để gọi API cần đăng nhập và cấu hình Supabase + Upstash. Planner nằm tại `/vi/journey` và `/en/journey`.

Để chạy lại toàn bộ smoke tích hợp AI (có gọi DeepSeek thật; sẽ phát sinh request và chi phí theo tài khoản), chạy trong PowerShell:

~~~~powershell
$env:RUN_LIVE_AI_SMOKE = 'true'
$env:RUN_LIVE_AI_HANDLERS_SMOKE = 'true'
$env:RUN_LIVE_ROUTE_SMOKE = 'true'
$env:RUN_LIVE_AI_FULL_ROUTE_SMOKE = 'true'
$env:RUN_LIVE_AI_PLAN_SMOKE = 'true'
npm.cmd test -- --maxWorkers=1 src/lib/ai-live-smoke.test.ts src/lib/ai-handler-live-smoke.test.ts src/lib/route-assist-live-smoke.test.ts src/lib/plan-live-smoke.test.ts
Remove-Item Env:\RUN_LIVE_AI_SMOKE, Env:\RUN_LIVE_AI_HANDLERS_SMOKE, Env:\RUN_LIVE_ROUTE_SMOKE, Env:\RUN_LIVE_AI_FULL_ROUTE_SMOKE, Env:\RUN_LIVE_AI_PLAN_SMOKE
~~~~

Kiểm tra lại ngày 15/10/2026 lúc 17:51 (Asia/Ho_Chi_Minh): 4 file smoke live, **18 bài passed** với model được nạp từ `.env`. Các bài gọi DeepSeek thật cho parser/itinerary VI–EN, weather/safety VI–EN và giải thích tuyến; các bài route end-to-end lấy geometry từ OpenRouteService thật, weather lấy dự báo Open-Meteo thật. Auth, Upstash và ghi database được mock trong test; không xem kết quả này là bằng chứng cấu hình Supabase/Redis hoặc RLS thật. Các trang `/vi`, `/en`, `/vi/ai/conditions`, `/vi/ai/routes` và `/vi/auth` trả HTTP 200 khi kiểm tra local; `/` chuyển 307 đến `/vi`. Bộ test không dùng provider trước đó đạt **46 passed, 14 skipped**; `lint`, `typecheck` và production build đã đạt ở lần kiểm tra gần nhất, build sinh 40/40 route.

### Giá vé trẻ em Amazing Bay đang có hai nguồn khác nhau

Ngày 15/10/2026, FAQ của đơn vị vận hành Sơn Tiên ghi vé trẻ em cao 1–1,4 m là **270.000 ₫**: https://www.sontien.com/blogs/faq. Hướng dẫn trên cổng bán vé amazingbay.vn, đăng 16/04/2026, ghi **279.000 ₫** và nói giá tham khảo có thể đổi theo ngày/khuyến mãi: https://amazingbay.vn/huong-dan-dat-ve-online-tai-the-amazing-bay-vinh-ky-dieu/. NaiVerse lưu cả hai mức ở trạng thái `conflicting`, không tính chúng vào tổng lịch trình hoặc giá hiện hành; xác nhận với đơn vị trước khi mua. Vé người lớn 490.000 ₫ và trẻ dưới 1 m miễn phí vẫn lấy theo FAQ Sơn Tiên.

Sau migration `0024_tran_bien_main_gate_photo.sql`, chạy `supabase/migrations/0025_amazing_bay_child_price_conflict_2026.sql`. Migration đổi giá trẻ em 270.000 ₫ từ FAQ sang `conflicting` và thêm mức 279.000 ₫ từ cổng bán vé, cũng ở trạng thái `conflicting`. Chạy lại an toàn; không sửa giá người lớn/trẻ dưới 1 m. Trang chi tiết The Amazing Bay sẽ hiện cảnh báo có nguồn mâu thuẫn và liệt kê từng nguồn.
