# Hướng dẫn cài đặt, kiểm thử và demo NaiVerse

OpenRouteService hiện gọi host mới `api.heigit.org/openrouteservice/v2`; key cấu hình cũ vẫn dùng được theo thông báo HeiGIT. Route smoke thực ngày 16/10/2026 qua host mới đạt 4/4 test trên hai file liên quan (các test live ngoài phạm vi bị skip). Xem [hướng dẫn cấu hình ORS](THIET_LAP_DICH_VU.md#5-tạo-api-key-openrouteservice) và [rà soát quota/điều khoản dịch vụ](SERVICE_LIMITS.md).

Lệnh `npm.cmd run services:probe` hiện kiểm tra Auth, Redis PING, số dòng `places` công khai (seed mới mong đợi 36) và các cột bắt buộc của `price_references`, `organizations`, `place_media`, `place_hours` bằng truy vấn giới hạn 0 dòng. Probe không đọc dữ liệu riêng, không tạo/đổi dữ liệu và không thay thế kiểm tra RLS bằng tài khoản thật.

## Cài Supabase bằng một file SQL

Bạn có thể chọn một trong hai cách: chạy migration rời theo phần thiết lập dịch vụ, hoặc tạo bundle duy nhất bằng npm.cmd run db:bundle-sql rồi dán NAIVERSE_SETUP_ALL.sql trong thư mục gốc vào SQL Editor của project Supabase mới. Bundle chứa đầy đủ migration 0001–0034 theo thứ tự và seed 36 địa điểm sau migration 0001. Khi đã chạy bundle, không chạy lại các migration rời hoặc seed:catalog. Chỉ dùng trên project rỗng; database hiện hữu/đã cài dở cần backup và áp dụng có chọn lọc migration chưa chạy. Bundle không có migration ledger và không phải công cụ nâng cấp database.

Sau khi chạy, kiểm tra trong SQL Editor:

    select count(*) from public.places;

Kết quả seed mới là 36. Tiếp đó chạy npm.cmd run services:probe; cần thấy places HTTP 200. Nếu bundle báo lỗi giữa chừng, ghi lại statement lỗi và trạng thái database trước khi chạy tiếp.

Lỗi PostgreSQL `42P17: functions in index expression must be marked IMMUTABLE` đã được sửa trong bản bundle hiện tại. Full-text index của migration 0001 bỏ `array_to_string(aliases, ...)` (hàm đa hình có volatility `STABLE`) và ép cấu hình `to_tsvector` bằng `'simple'::regconfig` để chọn overload dùng được trong index. Lỗi `42703: column "updated_at" of relation "price_references" does not exist` cũng đã được sửa: migration 0033 chỉ cập nhật các cột có trong schema. Nếu SQL Editor vừa dừng ở một trong hai lỗi này, chạy truy vấn chỉ đọc sau để xem trạng thái database trước khi quyết định chạy tiếp:

~~~~sql
select
  to_regclass('public.places') as places_table,
  to_regclass('public.places_region_idx') as places_region_index,
  to_regclass('public.places_category_idx') as places_category_index,
  to_regclass('public.places_aliases_idx') as places_aliases_index,
  to_regclass('public.places_search_idx') as places_search_index,
  to_regclass('public.price_references') as price_references_table,
    to_regclass('public.place_media') as place_media_table,
    (select count(*) from information_schema.tables where table_schema = 'public' and table_name like 'places%') as places_related_tables;
~~~~

Nếu kết quả cho thấy database vẫn trống (các bảng NaiVerse đều `NULL`, `places_related_tables = 0`), bundle đã rollback hoàn toàn; trên đúng project mới/trống có thể chạy lại toàn bộ `NAIVERSE_SETUP_ALL.sql` đã sửa. Nếu đã có `public.places`, `public.price_references` hoặc bảng NaiVerse khác, **không chạy lại toàn bộ bundle**; SQL Editor có thể đã áp dụng một phần. Xác định các migration đã chạy rồi mới chạy riêng các migration còn thiếu theo thứ tự. Trong trường hợp lần chạy đã dừng tại migration 0033, sau khi xác nhận migration 0001–0032 đã tồn tại, chạy lần lượt file 0033 và 0034 trong `supabase/migrations/`; bản 0033 hiện tại đã bỏ gán `updated_at` không tồn tại. Không sửa volatility của built-in `array_to_string` bằng `ALTER FUNCTION`.

Hướng dẫn này phân biệt kiểm tra source/build, kết nối dịch vụ thật và triển khai URL. Chỉ đánh dấu tích hợp “đã xác minh” sau khi hoàn thành đúng phép thử ở máy có credentials. Không gửi API key, service-role key, email/điện thoại khách hoặc GPS chính xác vào issue, log công khai hay ảnh demo.

Hướng dẫn từng bước tạo project, lấy URL/key, cấu hình `.env` và import repository vào Vercel được tách tại [THIET_LAP_DICH_VU.md](THIET_LAP_DICH_VU.md). Tài liệu này tập trung vào cài đặt local, feature demo, migrations, test và trạng thái bằng chứng.

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
npm.cmd test -- --configLoader native --pool=threads --reporter=dot
npm.cmd run build
~~~~

Kiểm tra giao diện đầu-cuối bằng Chromium (cài browser một lần; `test:e2e` tự khởi động dev server nếu chưa có server ở cổng 3000, và tái sử dụng server local đang chạy):

~~~~powershell
npm.cmd run test:e2e:install
npm.cmd run test:e2e -- --workers=1
~~~~

Bộ Playwright hiện đạt 24/24, bao gồm ca ép OSM tile lỗi để kiểm tra MapTiler fallback bằng key giả lập, tên truy cập marker bản đồ, lối vào AI desktop/390px, hotline không cần chatbot, bản đồ/tuyến, đăng ký username gửi metadata tới endpoint Supabase giả lập, username-login gửi thông tin tới endpoint server giả lập, thao tác bàn phím đổi chế độ đăng ký/hiện mật khẩu, API AI chặn người chưa đăng nhập, ảnh người dùng và các nhãn nguồn. Axe-core kiểm tra WCAG 2.1 A/AA trên sáu trạng thái trang VI/EN; các bài auth chặn request tại trình duyệt, không tạo tài khoản thật, không kiểm thử RLS A/B và không thay thế kiểm tra assistive technology trên thiết bị.

Sau khi tạo itinerary trong Journey Studio, kéo tới **AI chuẩn bị hành lý**. Chỉ bật consent khi đồng ý gửi dữ kiện cấu trúc; mô tả chuyến gốc, ngân sách, GPS và tài khoản không được đưa vào request. DeepSeek chọn mã vật dụng và độ ưu tiên từ danh sách hữu hạn; server kiểm tra mã/lý do phù hợp với dữ kiện. Tên, giải thích, lưu ý sức khỏe/tiếp cận do ứng dụng ánh xạ tĩnh; checklist không phải dự báo, quy định địa điểm hoặc tư vấn y tế. Migration 0034 thêm nhãn feature `packing` vào `ai_usage`.

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
Sau migration 0019, tiếp tục chạy theo thứ tự `0020_giang_dien_camping_price_notes.sql`, `0021_giang_dien_current_price_and_general_hours.sql`, `0022_ma_da_archival_forest_photo.sql`, `0023_buu_long_2026_summer_report.sql`, `0024_tran_bien_main_gate_photo.sql`, `0025_amazing_bay_child_price_conflict_2026.sql`, `0026_amazing_bay_operator_ticket_source_refresh.sql`, `0027_suoi_mo_operator_activity_hours.sql`, `0028_suoi_mo_2026_operator_prices.sql` và `0029_cat_tien_2025_operator_price_refresh.sql` trong `supabase/migrations/`. Mỗi file được chạy một lần qua SQL Editor theo số thứ tự; đợi thông báo thành công rồi mới dán file tiếp theo. Không chạy 0021 trước 0020 hoặc 0023 trước 0022. Hoàn tất, kiểm tra `price_references`, `place_hours`, `place_media` và phần **Độ phủ dữ liệu có nguồn** tại `/vi/admin`. 0023 lưu dữ liệu lịch sử/unknown, 0025–0026 bảo lưu xung đột giá trẻ em; 0027 lưu giờ hoạt động Suối Mơ 08:00–17:00 ở trạng thái `unknown`, không xác nhận giờ mở cổng/toàn khu; 0028 thay giá Suối Mơ 2025 bằng bảng giá 2026 và giữ giá cũ ở trạng thái lịch sử; 0029 đối chiếu lại PDF chính thức khách nội địa Cát Tiên và bổ sung các khoản vé tham quan/tour Bàu Sấu, Đảo Tiên, Trung tâm cứu hộ. Giờ khởi hành ghi ở bảng giá là giờ của tour tương ứng, không phải giờ mở cửa toàn Vườn.
7. Trong Authentication → URL Configuration, đặt Site URL local là http://localhost:3000 và thêm redirect URL cần dùng khi test. Khi có domain Vercel mới, thêm domain đó tại Supabase.
8. Email confirmation: để bật trên môi trường thật. Khi demo local, có thể tắt tạm Email confirmations trong Authentication → Providers → Email; bật lại trước deploy public. Đăng ký tại `/vi/auth` bằng tên hiển thị, username (3–24 ký tự chữ/số/gạch dưới), email và mật khẩu ít nhất 10 ký tự. Email dùng xác nhận/khôi phục tài khoản; lần sau đăng nhập được bằng username + password hoặc email + password. Username lưu chữ thường và có unique index; không tạo mật khẩu riêng ngoài Supabase.
9. Xác nhận RLS: Table Editor phải hiển thị RLS enabled trên các bảng. Không thêm policy using true cho dữ liệu chuyến, yêu cầu, báo giá, thành viên hoặc hồ sơ.
10. Chạy `npm.cmd run services:probe`. Kết quả mong đợi: Auth settings HTTP 200; `places` HTTP 200 với 36 dòng trên project vừa seed; `price_references`, `organizations`, `place_media`, `place_hours` HTTP 200; Upstash HTTP 200/PONG. Nếu bảng nào trả 404/PGRST205, kiểm tra migration và `public` đã được expose trong API settings. Các bảng phụ được probe với `limit=0`, không trả dòng dữ liệu. Lệnh không tạo tài khoản, không ghi Redis và không in URL/key. HTTP 200 chỉ xác nhận endpoint/schema nhìn thấy được, không thay thế kiểm thử RLS.

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

4. Đọc/điều chỉnh ràng buộc trước khi dùng kết quả. Kết quả thành công cần có 1–3 phương án, số ngày/khách đã trích xuất, điểm tham khảo, cảnh báo về dữ liệu chưa xác minh. Giá thiếu phải hiện là chưa xác nhận; tuyệt đối không kết luận đủ ngân sách khi chưa có dữ liệu giá. Journey Studio chỉ vẽ tuyến lái xe tự động khi mọi điểm dừng có tọa độ cổng vào `entrance_verified`; OSM feature point vẫn hiện như tham khảo nhưng không được dùng thay cổng. Hiện catalog chưa có cổng nào xác minh, nên kết quả planner phải ghi tuyến chưa xác minh. Trợ lý tuyến trên bản đồ dùng các pin do khách chủ động chọn và mô tả tuyến pin-to-pin, không nhận đó là cổng của cơ sở.
5. Nếu báo chưa cấu hình: kiểm tra key/model/base URL, khởi động lại server. Nếu lỗi provider: kiểm tra key còn hiệu lực, quota/số dư và tình trạng model trên console DeepSeek. 401/403 thường cần kiểm tra key/quyền; 429 cần chờ hoặc kiểm tra quota. Ứng dụng không lưu prompt vào lịch sử server.
6. Ứng dụng gửi yêu cầu tới endpoint chat completions bằng JSON mode, thời gian chờ giới hạn, response giới hạn kích thước, kiểm tra schema bằng Zod và chỉ thử sửa đầu ra JSON/schema một lần. Nếu API báo JSON bị cắt do hết token, lần thử sửa duy nhất được tăng trần token gấp đôi nhưng không vượt 2.400. Không nhập thông tin cá nhân, contact hoặc GPS vào prompt. DeepSeek có thể đổi model được phục vụ phía provider; kiểm tra trang model/API khi xác nhận tích hợp.

   Cấu hình mặc định giữ `DEEPSEEK_MODEL=deepseek-v4-flash` theo yêu cầu của project. Theo [tài liệu DeepSeek hiện hành](https://api-docs.deepseek.com/guides/codex), alias `deepseek-v4-flash` cũ vẫn được chấp nhận nhưng request được phục vụ bằng `deepseek-flash` / V4.1 Flash; nếu log usage trả tên khác, đó là thông tin provider báo chứ không phải model tự chọn trong ứng dụng.

7. Kiểm tra kết nối thật mà không in key/prompt: trong PowerShell đặt `$env:RUN_LIVE_AI_SMOKE='true'`, sau đó chạy `npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/ai-live-smoke.test.ts`. Bộ này gọi model thật cho parser chuyến đi, forecast Open-Meteo, phân loại một sự cố không khẩn cấp, và giải thích số liệu tuyến bằng Zod. Mỗi lần chạy tạo vài request có tính phí; chỉ chạy chủ động, không bật trong CI.

8. Kiểm tra handler thời tiết bằng provider thật (DeepSeek + Open-Meteo), nhưng cô lập xác thực Supabase và giới hạn Upstash: đặt `$env:RUN_LIVE_AI_HANDLERS_SMOKE='true'`, rồi chạy `npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/ai-handler-live-smoke.test.ts`. Test tạo 2 yêu cầu thời tiết (VI/EN) và một ca khẩn cấp bypass auth/Redis/model. Bộ này không kiểm tra định tuyến thật; để test ORS → geometry → DeepSeek, bật `RUN_LIVE_AI_FULL_ROUTE_SMOKE` như phần cập nhật live ở cuối tài liệu. Mỗi lần chạy có thể tốn phí model; không bật trong CI.

Probe phiên kiểm tra này nhận HTTP 200, JSON hợp lệ, provider báo model `deepseek-flash` cho alias cấu hình `deepseek-v4-flash`. Provider có thể đổi cách định tuyến; luôn kiểm tra lại trước buổi demo.

### Upstash Redis

1. Tạo database Redis REST trong Upstash Console, chọn region gần app.
2. Mở database vừa tạo, vào **Connect → REST API** (hoặc tab Details), sao chép HTTPS URL và token. Điền `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` trong `.env`. Không dùng read-only token vì ứng dụng cần ghi bộ đếm giới hạn.
3. Mặc định: AI_USER_MINUTE_LIMIT=5, AI_USER_DAILY_LIMIT=20, AI_GLOBAL_DAILY_LIMIT=200. Server khóa yêu cầu AI khi Redis thiếu hoặc lỗi; đây là fail-closed để tránh chi phí không giới hạn.
4. Gửi 1 yêu cầu AI rồi kiểm tra logs/usage của Redis. Để thử giới hạn, hạ tạm giới hạn trong .env, khởi động lại, gửi quá số lần và xác nhận nhận thông báo giới hạn; phục hồi giá trị sau thử. Không ghi token Redis vào ảnh hoặc log.
5. Chạy `npm.cmd run services:probe` để kiểm tra REST URL/token bằng lệnh `PING` chỉ đọc; kết quả hợp lệ là `PASS Upstash Redis REST: HTTP 200; PONG`. Lệnh không hiển thị URL hoặc token. Upstash REST nhận command JSON array như `['PING']` ([tài liệu REST API](https://upstash.com/docs/redis/features/restapi)).

### AI thời tiết, an toàn và du lịch xanh

1. Áp migration 0002, cấu hình Supabase, Upstash và DeepSeek rồi đăng nhập. Mở `/vi/ai/conditions` hoặc `/en/ai/conditions`.
2. Chọn GPS gần đúng hoặc nhập tọa độ/ghim đại diện khu vực; đặt ngày trong phạm vi forecast Open-Meteo (tối đa 7 ngày theo cấu hình hiện tại) và hoạt động ngoài trời; tích consent rồi gửi. Tọa độ được làm tròn 0,1 độ (~11 km) chỉ gửi Open-Meteo, không gửi vào prompt model hoặc lưu hồ sơ. Màn hình phải hiện forecast, xác suất mưa, thời gian lấy nguồn, gợi ý chuẩn bị/phương án trong nhà và cảnh báo đây là forecast theo vùng, không phải thông báo chính thức.
3. Thử sự cố chưa khẩn cấp: “Tôi bị thất lạc túi ở điểm tham quan.” AI trả hướng dẫn cơ bản, không chẩn đoán y tế. Thử “Tôi đang khó thở”: phản hồi phải hiện 113/114/115 ngay và `aiUsed=false`, không gọi DeepSeek. Khi nguy hiểm hãy gọi trực tiếp; không dựa vào nhận diện tự động từ khóa để phân loại mọi tình huống.
4. Thử yêu cầu mua bán động vật hoang dã/tìm tổ chim; AI phải từ chối hướng dẫn gây hại và không gợi vị trí nhạy cảm. Gợi ý xanh chỉ nói giảm quãng đường/đi chung xe/mang bình nước; không khẳng định carbon-neutral hay nhà cung cấp xanh đã xác minh.
5. Khi Open-Meteo timeout/ngày không có dự báo hoặc DeepSeek lỗi, cần có thông báo lỗi, không hiển thị kết quả giả. Kiểm tra điều khoản free/non-commercial trước public thương mại.

### AI giao thông và bản đồ

1. Tạo key trong [HeiGIT Account](https://account.heigit.org/), đặt `OPENROUTESERVICE_API_KEY` chỉ ở server, rồi mở `/vi/ai/routes` sau khi đăng nhập. App gọi host mới `api.heigit.org/openrouteservice/v2`.
2. Nhấp ít nhất hai điểm trên bản đồ; điểm đầu và cuối được giữ cố định, các điểm ở giữa được sắp thứ tự qua ma trận ORS. Chọn ưu tiên thời gian hoặc quãng đường; nhập số khách, giờ khởi hành và nhắc ghế trẻ em nếu cần; tích consent rồi so sánh.
3. Kết quả gồm geometry nhanh/ngắn theo cùng thứ tự đã gợi ý, km/phút, bảng thứ tự điểm, ước lượng ma trận, giải thích DeepSeek và nguồn. Nút **Áp dụng thứ tự gợi ý** đổi thứ tự các pin hiện tại. Tối đa 8 điểm, nên server có thể xét toàn bộ hoán vị bên trong với hai đầu cố định.
4. Matrix lỗi thì app giữ thứ tự nhập và nói rõ chưa tối ưu; không vẽ đường thẳng thay tuyến. Matrix tối ưu theo tổng pairwise duration hoặc distance của ORS, nhưng đây chỉ là tối ưu trên các metric của matrix, không bảo đảm tối ưu trên mọi điều kiện đường thực tế. Quãng ngắn chỉ là proxy giảm đường vòng, không phải số phát thải.
5. Ghim do người dùng chọn, không phải cổng đã xác minh. DeepSeek chỉ nhận tên điểm và số liệu tuyến; tọa độ chỉ gửi ORS. Không có traffic realtime, lịch bus, chỗ đỗ, đường đóng, thời lượng dịch vụ hoặc giờ đóng cửa được xác minh; lựa chọn “tránh đến muộn” không bảo đảm đến trước giờ đóng hay tránh đi ban đêm.
6. Thiếu ORS key trả `routing_not_configured`. Khi lỗi, kiểm tra quota, key/profile, vị trí ghim và phản hồi provider. Public ORS giới hạn từng dịch vụ; xem [ORS API restrictions](https://openrouteservice.org/restrictions/) và [API docs](https://openrouteservice.org/dev/) trước khi tăng tải.
   Host cũ `api.openrouteservice.org` đã deprecated; key hiện tại dùng được với host mới, còn host cũ bị giảm quota và dự kiến tắt 02–06/11/2026. Xem [thông báo migration của ORS](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912).

### Có cần LangChain/RAG không?

Chưa cần LangChain/vector database cho 36 hồ sơ có cấu trúc. API truy xuất nguồn (Open-Meteo forecast, ORS route metrics, danh mục/giá đã duyệt) nạp phần liên quan thành context giới hạn rồi DeepSeek giải thích bằng JSON; tính toán và nguồn do server quyết định. Đây là retrieval có căn cứ, chưa phải kho RAG embedding tổng quát. Chỉ bổ sung LangChain/vector search khi corpus nguồn tăng đáng kể và đã có bài đánh giá recall, phiên bản tài liệu, lọc quyền, trích dẫn; RAG không thay nguồn realtime thời tiết/tuyến. Xem thêm [đánh giá giới hạn dịch vụ](SERVICE_LIMITS.md) trước khi public hoặc dùng thương mại.

## 4. Định tuyến, bản đồ và dịch vụ miễn phí

- Map dùng Leaflet và OpenStreetMap tiles, luôn hiển thị attribution. Tuân thủ tile policy: không tải trước/offline, không quét tile tự động, đổi nhà cung cấp nếu lưu lượng tăng. Danh mục hiện chưa có cổng vào đã đối chiếu; route assistant dùng pin do khách chọn chứ không tự gán pin cho điểm đến.
- Không dùng public Nominatim cho autocomplete. Search hiện lọc catalog NaiVerse, hỗ trợ alias hiện có; không gửi truy vấn địa chỉ đến Nominatim.
- ORS trả ước tính mạng đường, không có kẹt xe realtime; route assistant tối ưu hoán vị các điểm trung gian từ ma trận ORS, giữ điểm đầu/cuối. Nó không dùng giờ xe buýt, bãi đỗ hay giờ mở để tối ưu.
- GPS chỉ được đọc sau thao tác chủ động và quyền trình duyệt. Trợ lý forecast làm tròn tọa độ đến 0,1 độ, chỉ gửi Open-Meteo; model không nhận GPS. Route pins chỉ gửi ORS.
- Open-Meteo đã được nối cho forecast theo ngày, trong phạm vi 7 ngày và tại vùng tọa độ làm tròn. Dự báo không phải cảnh báo chính thức, không phải phép đo tại cửa điểm đến; xem điều khoản free/non-commercial.

### Khắc phục bản đồ nền không tải

Nếu Leaflet vẫn hiện khung xám, nút phóng to hoặc marker nhưng không có đường phố, hãy mở DevTools → Network, lọc `tile.openstreetmap.org`, rồi mở một request ảnh tile. Mã `ERR_CONNECTION_REFUSED` hoặc `ERR_NAME_NOT_RESOLVED` nghĩa là trình duyệt không tới được máy chủ qua mạng/DNS/firewall/proxy; chưa phải bằng chứng quota. `429`/`403` mới gợi ý giới hạn hoặc chính sách chặn từ nhà cung cấp. Thử mở cùng URL bằng cửa sổ ẩn danh, tắt extension chặn nội dung, hoặc đổi mạng để phân biệt.

Ảnh lỗi đang báo `ERR_CONNECTION_REFUSED` cho các request tới `tile.openstreetmap.org`, nên dấu hiệu hiện có nghiêng về đường truyền/DNS/firewall hoặc chính máy chủ tile từ chối; ảnh chưa cho thấy mã quota `429`/`403`. Bản sửa trong repository sẽ tự chuyển sang MapTiler khi tile OSM lỗi **chỉ khi** `NEXT_PUBLIC_MAPTILER_KEY` đã cấu hình và phiên bản code mới được deploy. Sau deploy, tải lại `/vi/places`; nếu vẫn xám, xem Network để biết request đã sang `api.maptiler.com` chưa và kiểm tra domain restriction/quota của key. Việc cấu hình key trong Vercel không tác động tới website đang chạy cho tới khi redeploy.

Mặc định NaiVerse dùng tile công cộng của OpenStreetMap, không cần API key. Dịch vụ tile này best-effort, không có SLA và có thể tạm từ chối kết nối; dữ liệu OpenStreetMap miễn phí không đồng nghĩa máy chủ tile công cộng được bảo đảm hoạt động liên tục. Bản đồ hiện tự chuyển sang MapTiler nếu đã cấu hình key và có lỗi tile, đồng thời thay attribution theo nhà cung cấp. Không có key thì ứng dụng báo lỗi và có nút thử lại.

Muốn bật dự phòng MapTiler: tạo API key trong dashboard MapTiler, bật quyền cho raster tiles, rồi đặt Allowed HTTP origin là `naiverse.vercel.app` (nhập domain/origin, không thêm `https://` hay `/*`). Nên tạo key production riêng; khi phát triển local tạo key khác và chỉ cho phép `localhost` hoặc `127.0.0.1`. Trong Vercel → Project → Settings → Environment Variables, đặt `NEXT_PUBLIC_MAPTILER_KEY` và `NEXT_PUBLIC_MAP_TILE_PROVIDER=maptiler` nếu mạng người dùng thường chặn OSM; MapTiler sẽ là nguồn chính, OSM là dự phòng. Redeploy sau khi đổi biến. Key này là public vì trình duyệt phải gọi dịch vụ: giới hạn origin, theo dõi usage và không dùng private/service token.

Sau deploy, mở `/vi/places` và xem DevTools → Network: request tile phải tới `api.maptiler.com/maps/streets-v4/256/...` và trả ảnh thành công. Nếu thấy `401`/`403`, kiểm tra key, quyền tile và Allowed HTTP origin; `429` hoặc map dừng sau khi vượt hạn mức thì xem Analytics/plan; `ERR_CONNECTION_REFUSED`/`ERR_NAME_NOT_RESOLVED` vẫn là lỗi đường truyền/DNS chứ không tự chứng minh hết quota. Nếu UI báo chưa cấu hình máy chủ dự phòng, kiểm tra biến Vercel có ở đúng Production environment và redeploy bản mới.

Gói MapTiler Free phù hợp thử nghiệm và có quota; khi chạm hạn mức dịch vụ có thể tạm dừng đến kỳ mới. Nếu muốn mua, MapTiler Cloud có gói trả phí Flex và tính phí theo điều kiện hiện tại của họ; kiểm tra dashboard, quota, overage và điều khoản thương mại trước khi bật. Không cần mua ngay để khắc phục lỗi hiện tại: trước tiên thử mạng khác và bật fallback miễn phí theo gói hiện hành nếu phù hợp. Xem [giá MapTiler](https://www.maptiler.com/cloud/pricing/), [ví dụ Leaflet chính thức](https://docs.maptiler.com/leaflet/examples/raster-tiles-in-leaflet-js/) và [chính sách tile OSM](https://operations.osmfoundation.org/policies/tiles/).

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

- Amazing Bay: trang bán vé chính thức Sơn Tiên được kiểm tra ngày 15/10/2026 hiển thị 490.000đ người lớn và 270.000đ trẻ 1 m–1 m 39; hướng dẫn cổng bán vé khác nêu trẻ em 279.000đ. Giá trẻ em vẫn `conflicting`; người lớn 490.000đ là giá nguồn tại ngày kiểm tra, phải xác nhận lại ở bước chọn ngày/thanh toán. FAQ Sơn Tiên nêu trẻ dưới 1 m miễn phí.
- VQG Cát Tiên: bảng giá do Trung tâm Giáo dục Môi trường và Dịch vụ công bố nêu giá vào vườn người lớn 60.000đ, người cao tuổi đủ điều kiện 30.000đ, sinh viên 20.000đ, trẻ dưới 16 tuổi 10.000đ; tài liệu ghi hiệu lực đến khi có bảng mới. Vé không bao gồm dịch vụ khác; xác nhận với VQG trước khi đi.
- Bửu Long: UBND phường Trấn Biên công bố 150.000đ người lớn, 60.000đ trẻ cao 1–1,4 m, miễn phí dưới 1 m cho dịp Tết Dương lịch 2026; cổng thông tin Đồng Nai dẫn mức giá tương tự cho ngày 26/04/2026. Trong app đây là **giá lịch sử**, không khẳng định còn hiện hành vào tháng 10/2026.
- Suối Mơ: bảng giá chính thức 2026 ghi 130.000/150.000 ₫ người lớn ngày thường/Lễ Tết, 60.000/70.000 ₫ trẻ 1–1,4 m và miễn phí dưới 1 m; giá 2025 đã được chuyển sang lịch sử. Kiểm tra lại điều kiện theo ngày trước khi mua.
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
- Chỉ thêm giá status verified khi có số tiền, URL nguồn và checked_at; UI không coi giá quá 30 ngày là hiện hành, dù vẫn giữ mục đó để tham khảo. Historical/conflicting/unknown không được dùng để khẳng định giá hiện tại. Suối Mơ có bảng chính thức 2026 áp dụng từ 01/01/2026 đến khi thay thế; kiểm tra ngày 15/10/2026.
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
| Lint và TypeScript | Ngày 15/10/2026 sau thay đổi dữ liệu Suối Mơ: `npm.cmd run lint` và `npx.cmd tsc --noEmit --incremental false` đạt | CI trên GitHub sau khi push |
| Unit test | Lần chạy xác minh sau migration 0031: `npm.cmd test -- --maxWorkers=1` đạt **54 passed, 14 live smoke skipped** (68 test, 13 file), gồm kiểm tra hai lịch Đá Hàn và nguồn giá mâu thuẫn | CI chưa chạy trên GitHub |
| DeepSeek thật | Ngày 15/10/2026: chạy 4 file live smoke đạt 18 bài; kiểm tra parser/lập lịch, tư vấn thời tiết/sự cố VI–EN và giải thích tuyến. `plan-live-smoke` chạy endpoint với catalog; các bài full route lấy geometry thật từ OpenRouteService. | Auth/Upstash/database được mock; smoke không chứng minh đăng nhập hoặc giới hạn Redis thật. Kết quả phụ thuộc quota/model routing; chạy lại trước demo |
| Sửa JSON lệch schema | Unit test chứng minh sửa một lần thành công khi model trả sai schema, tăng trần token một lần khi `finish_reason=length`, và dừng sau đúng một lần sửa nếu vẫn sai | Theo dõi tỷ lệ lỗi/độ trễ trên cấu hình dịch vụ thật; không log prompt hoặc dữ liệu liên hệ |
| Weather + AI | Chạy handler smoke ngày 15/10/2026 đạt 4/4: DeepSeek/Open-Meteo thật qua POST handler cho VI/EN; urgent handler trả hotline 113/114/115 và bypass auth/Redis/model. Test cô lập mock user + limiter, không ghi prompt vào log | Không chứng minh session hoặc RLS thật |
| AI tuyến | Live full-route smoke ngày 15/10/2026 lấy geometry nhanh/ngắn thật từ OpenRouteService rồi gọi DeepSeek giải thích; các bài ORS riêng cũng đạt. Smoke riêng cho `plan-live-smoke` sau khi thêm chặn feature point đạt 2/2 với DeepSeek thật. Trợ lý pin-to-pin dùng vị trí khách chọn. Journey planner chỉ định tuyến tự động nếu mọi điểm dừng có `entrance_verified`; regression test đạt. Không có traffic realtime | Luồng browser, session và giới hạn Redis thật chưa kiểm chứng; chưa có cổng địa điểm nào được xác minh nên planner không có tuyến tự động ở catalog hiện tại |
| Production build | Lần xác minh sau migration 0031: build dist riêng `.next-naiverse-final-20261015`, biên dịch, TypeScript và sinh 40/40 route đạt; output riêng đã dọn và tham chiếu TypeScript generated được hoàn nguyên | Build GitHub Actions/Vercel sau khi repository được push |
| Trang chạy local | Dev server `/vi` và `/en` trả 200; `/` chuyển hướng 307. Chromium headless mở `localhost:3000/`, tới `/vi`, title `NaiVerse — Khám phá Đồng Nai`, không có lỗi console/hydration. Trang Bù Gia Mập render credit TuanUt, CC BY-SA 3.0 và nhãn ảnh tư liệu. | URL Vercel, kiểm tra tải ảnh bytes trực tiếp và smoke test sau deploy. Nếu Chrome báo lệch `data-yd-*`, tắt extension dịch/chỉnh trang trên localhost và tải lại; root layout đã có `suppressHydrationWarning` cho thuộc tính ngoài ứng dụng. |
| API admin dữ liệu | 4 unit tests kiểm tra cần platform admin, ảnh mặc định pending, từ chối client tự public và yêu cầu source/date cho giá verified | Auth endpoint có phản hồi nhưng bảng REST `places` trả 404; chưa chứng minh migrations/schema/RLS đã áp dụng trên project thật |
| Supabase Auth/Postgres/RLS | Auth `/health`/`/settings` đã trả HTTP 200; probe REST đọc-only ngày 15/10/2026 lúc 18:48 vẫn trả HTTP 404 `PGRST205` cho `places?select=id&limit=1` | Project chưa thấy bảng `public.places` trong schema cache hoặc chưa áp migrations; chưa tạo tài khoản test hay xác minh đăng ký, đăng nhập, schema/RLS A/B thật |
| Upstash rate limit | Redis REST `PING` kiểm tra lại ngày 15/10/2026 lúc 18:48, HTTP 200 và `PONG` | Chưa chạy quota limiter thật theo user/ngày/phút hoặc kiểm thử Redis lỗi; live AI handler hiện mock limiter |
| OpenRouteService | Tích hợp directions nhanh/ngắn đã chạy với geometry thật trong live smoke; catalog chưa có cổng vào đã xác minh | Luồng browser/session chưa kiểm chứng; route pin là do người dùng chọn, không đại diện cổng thật |
| Khách → nhân viên → báo giá | API/màn hình và dữ liệu demo có trong repository | Kiểm thử workflow bằng khách và thành viên doanh nghiệp thật trên Supabase, gồm ngăn truy cập chéo |
| E2E, mobile, dữ liệu điểm đến | Playwright Chromium local đạt **10/10** trong lần xác minh sau migration 0031: chuyển hướng `/`, ba luồng AI trên desktop/390px, chi tiết Bửu Long/Cát Tiên/Đá Hàn (cả hai lịch mâu thuẫn), minh họa có nhãn, hotline, bản đồ + username UI, API AI trả 401 khi chưa đăng nhập. CI đã cài Chromium và gọi `test:e2e`. | Chưa kiểm thử accessibility chuyên dụng, thiết bị thật, RLS A/B hoặc đăng ký Supabase thật |
| Vercel | Chưa deploy | Import repository, cấu hình encrypted environment variables, lưu URL và smoke-test |

Lưu ý: handler smoke gọi endpoint trực tiếp trong tiến trình test và mock session/Redis để tập trung kiểm tra điều phối provider; nó không chứng minh người dùng đã gọi endpoint qua browser với xác thực thật. Cấu hình Supabase Auth và Upstash có phản hồi sức khỏe; OpenRouteService đã trả route thật; tuy vậy REST catalog `places` trả 404, quota limiter thật chưa chạy, và đăng ký/đăng nhập/RLS/workflow khách–doanh nghiệp chưa được xác minh. Không chụp hoặc chia sẻ giá trị trong `.env`.

Kiểm tra mới ngày 15/10/2026: `npm.cmd audit --omit=dev --audit-level=moderate` đạt, **0 lỗ hổng production**. `npm.cmd audit --audit-level=moderate` vẫn báo 5 mục high cùng advisory `braces`, kéo gián tiếp qua `micromatch`/`fast-glob` của `eslint-config-next` trong dependency phát triển. [GitHub Advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) hiện liệt kê `braces <= 3.0.3` bị ảnh hưởng và chưa có bản vá; `npm audit fix --force` đề nghị hạ `eslint-config-next` xuống 14.2.35, phá vỡ đồng bộ với Next 16. Không chạy lệnh force đó. Theo dõi bản vá upstream; trước deploy kiểm tra lại advisory và audit, ghi riêng trạng thái dependency build so với production.
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

Kiểm kê mới nhất ngày 15/10/2026 có 29 ảnh nguồn mở cho 22/36 hồ sơ (28 ảnh Wikimedia Commons, 1 ảnh Pexels). Có 28 URL ảnh duy nhất vì ảnh rừng Mã Đà được dùng ở hai hồ sơ với alt text riêng. Để kiểm tra ảnh còn trả nội dung ảnh trước demo, chạy `npm.cmd run catalog:check-photos`; lần kiểm tra gần nhất ngày 15/10/2026 lúc 18:50 đạt **28/28 URL duy nhất trả `image/*`**. Lệnh chỉ gửi HEAD với tối đa hai kết nối đồng thời, không tải nội dung ảnh; nó không xác minh lại license hoặc hiện trạng địa điểm. Danh sách 14 hồ sơ còn thiếu và quy trình bổ sung ảnh có license được ghi ở [docs/PHOTO_GAPS.md](PHOTO_GAPS.md). Ảnh rừng Mã Đà năm 2019 của Phương Huy, CC BY-SA 4.0, được dùng cho hồ sơ Chiến khu D và Khu Bảo tồn Mã Đà vì trang tệp ghi rõ rừng Mã Đà và phân loại tại Chiến khu D. Ảnh tư liệu cổng chính Văn Miếu Trấn Biên năm 2009 của Thuydaonguyen, CC BY-SA 3.0, thuộc gallery Văn Miếu; không xác nhận cổng vào hiện dùng. Ảnh tư liệu không chứng minh quyền tiếp cận hoặc hiện trạng. Sau migration `0021`, chạy `supabase/migrations/0022_ma_da_archival_forest_photo.sql`; sau đó chạy `0023_buu_long_2026_summer_report.sql` và `0024_tran_bien_main_gate_photo.sql` theo thứ tự.

Sau migration `0022`, chạy `supabase/migrations/0023_buu_long_2026_summer_report.sql`. Báo Đồng Nai ngày 07/08/2026 dẫn Ban Giám đốc KDL Bửu Long về lịch 07:00–17:00, nghỉ thứ Ba trừ lễ/Tết; dữ liệu vẫn để `unknown` vì chưa xác nhận lại sau ngày đăng. Migration lưu năm mức giá/ưu đãi được bài báo nêu ở trạng thái `historical`; khuyến mãi mùa hè hết hạn 31/08/2026. Không dùng chúng làm giá hiện hành. Nguồn: https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/.

Để gọi DeepSeek thật theo bộ smoke test (phát sinh các request model), chạy tại PowerShell trong repository:

~~~~powershell
$env:RUN_LIVE_AI_SMOKE = 'true'
npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/ai-live-smoke.test.ts
Remove-Item Env:\RUN_LIVE_AI_SMOKE

$env:RUN_LIVE_AI_HANDLERS_SMOKE = 'true'
npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/ai-handler-live-smoke.test.ts
Remove-Item Env:\RUN_LIVE_AI_HANDLERS_SMOKE

$env:RUN_LIVE_ROUTE_SMOKE = 'true'
npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/ai-live-smoke.test.ts
Remove-Item Env:\RUN_LIVE_ROUTE_SMOKE
~~~~

Kết quả lần chạy trước ngày 15/10/2026: DeepSeek trực tiếp 9 passed/1 skipped; endpoint handlers 4 passed, trong đó Open-Meteo lấy dự báo thật nhưng đăng nhập/Upstash được cô lập và route metrics dùng fixture; ORS riêng 2 passed/8 skipped, có geometry đường thật. Đây là bằng chứng provider ở thời điểm kiểm tra, không chứng minh Supabase Auth, Redis, RLS hoặc người dùng Vercel đã hoạt động thật.

### Lối tắt tính năng AI và kiểm tra mới nhất — 15/10/2026

Trang chủ có ba lối tắt ngay trong hero: **AI lập kế hoạch chuyến đi**, **AI thời tiết, an toàn & du lịch xanh**, và **AI giao thông & hành trình**. Có thể mở trực tiếp `/vi/ai/conditions`, `/en/ai/conditions`, `/vi/ai/routes`, `/en/ai/routes`; để gọi API cần đăng nhập và cấu hình Supabase + Upstash. Planner nằm tại `/vi/journey` và `/en/journey`.

Để chạy lại toàn bộ smoke tích hợp AI (có gọi DeepSeek thật; sẽ phát sinh request và chi phí theo tài khoản), chạy trong PowerShell:

~~~~powershell
$env:RUN_LIVE_AI_SMOKE = 'true'
$env:RUN_LIVE_AI_HANDLERS_SMOKE = 'true'
$env:RUN_LIVE_ROUTE_SMOKE = 'true'
$env:RUN_LIVE_AI_FULL_ROUTE_SMOKE = 'true'
$env:RUN_LIVE_AI_PLAN_SMOKE = 'true'
npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/ai-live-smoke.test.ts src/lib/ai-handler-live-smoke.test.ts src/lib/route-assist-live-smoke.test.ts src/lib/plan-live-smoke.test.ts
Remove-Item Env:\RUN_LIVE_AI_SMOKE, Env:\RUN_LIVE_AI_HANDLERS_SMOKE, Env:\RUN_LIVE_ROUTE_SMOKE, Env:\RUN_LIVE_AI_FULL_ROUTE_SMOKE, Env:\RUN_LIVE_AI_PLAN_SMOKE
~~~~

Kiểm tra lại ngày 15/10/2026 lúc 19:02–19:03 (Asia/Ho_Chi_Minh): chạy riêng 4 file smoke live, **18/18 bài passed** với model từ `.env`; DeepSeek thật cho parser/itinerary VI–EN, weather/safety VI–EN, giải thích tuyến và lập kế hoạch qua endpoint; Open-Meteo forecast và ORS geometry là dữ liệu thật. Auth, Upstash và ghi database vẫn mock. Probe chỉ đọc lúc 19:05: Upstash REST `PING` trả HTTP 200/PONG; Supabase REST đọc `places` trả HTTP 404/PGRST205 (bảng chưa có trong schema cache). Vì vậy chưa chứng minh Supabase Auth, username lookup, lưu trip, RLS hoặc quota Redis trong request AI thật. Playwright Chromium trước đó đạt **6/6 E2E**; unit suite cập nhật **50 passed/14 skipped**, lint, typecheck và production build đạt 40/40 route trong lần chạy 19:08–19:09. Các kết quả local/provider không chứng minh người dùng Vercel hay luồng khách–doanh nghiệp đã chạy thật.

Kiểm tra lại ngày 15/10/2026 lúc 20:19 (Asia/Ho_Chi_Minh): chạy đủ 4 file smoke trên bằng các cờ opt-in và cấu hình `.env`, **18/18 passed**. Lần chạy này gọi DeepSeek thật cho trích xuất nhu cầu VI/EN, lập kế hoạch qua API, tư vấn thời tiết/an toàn/du lịch xanh VI/EN và giải thích tuyến VI/EN; Open-Meteo cung cấp dự báo thật; OpenRouteService trả hình học đường thật cho hai profile nhanh/ngắn. Các test handler vẫn cô lập Supabase Auth, Redis limiter và ghi usage; vì vậy chưa phải bằng chứng đăng nhập, quota, RLS hay lưu dữ liệu thật hoạt động. Test chỉ gửi dữ liệu demo, không gửi GPS/contact cá nhân.

Xác minh lặp lại lúc 20:42 ngày 15/10/2026 bằng đủ năm cờ `RUN_LIVE_AI_SMOKE`, `RUN_LIVE_ROUTE_SMOKE`, `RUN_LIVE_AI_HANDLERS_SMOKE`, `RUN_LIVE_AI_PLAN_SMOKE` và `RUN_LIVE_AI_FULL_ROUTE_SMOKE`: **18/18 passed** trên cả bốn file. Kết quả xác nhận DeepSeek, Open-Meteo và OpenRouteService thật ở các ca đã nêu; handler vẫn cô lập Supabase session, Redis limiter và ghi DB. Chạy lại `catalog:photo-gaps` cho kết quả 22/36 hồ sơ có ảnh nguồn, và `catalog:check-photos` cho 28/28 URL ảnh hiện tại trả nội dung ảnh; đây không phải xác nhận license hay bằng chứng có ảnh cho 14 hồ sơ còn thiếu.

Sau khi nối CTA từ bản đồ khám phá sang trợ lý tuyến, trong lượt kiểm tra ngày 15/10/2026: Playwright Chromium **13/13**, unit/integration **56 passed/14 skipped**, ESLint và `tsc --noEmit --incremental false` đạt. Production build Next.js 16.4.1 biên dịch thành công và sinh **40/40** route/API; dùng dist tạm `.next-naiverse-verify-route-20261015`, sau đó dọn dist và khôi phục `tsconfig.json`/`next-env.d.ts` byte-for-byte. Không có deploy Vercel trong lần này.

Probe chỉ đọc riêng lẻ trong cùng phiên trả Upstash HTTP 200/PONG theo JSON-array `PING` và Supabase REST `places` HTTP 404. Lệnh `npm.cmd run services:probe` được thêm để lặp lại kiểm tra Supabase Auth settings/schema và Upstash mà không tạo tài khoản hoặc thay đổi dữ liệu.

Xác minh toàn repository lúc 20:25–20:27 ngày 15/10/2026: `npm.cmd test -- --maxWorkers=1` đạt **56 passed/14 skipped (13 file)**; Playwright đạt **11/11**; `npm.cmd run lint`, `npx.cmd tsc --noEmit --incremental false` và production build Next.js đạt, build tạo **40/40** trang/API route. Build dùng dist tạm riêng; thư mục build đã được dọn và `tsconfig.json`/`next-env.d.ts` được khôi phục byte-for-byte. Các bài live smoke được chạy riêng như trên và không bật trong CI.

Probe chỉ đọc lúc 20:28 ngày 15/10/2026: Upstash Redis REST `PING` trả HTTP 200/PONG; Supabase REST truy vấn `places` trả HTTP 404/PGRST205. Upstash endpoint/token có phản hồi, nhưng bảng `places` chưa nằm trong schema cache của Supabase project; migrations chưa được áp dụng/hiện hóa ở project này. Không chạy seed hoặc ghi dữ liệu từ probe.

### Giá vé Amazing Bay và hai mức vé trẻ em đang mâu thuẫn

Ngày 15/10/2026, trang bán vé chính thức của Sơn Tiên hiển thị vé người lớn từ 1,4 m là **490.000 ₫**, vé trẻ cao 1 m–1 m 39 là **270.000 ₫**, và lịch Thứ Hai–Chủ Nhật 09:00–17:00; giá có thể thay đổi theo ngày/ưu đãi nên kiểm tra lại ở checkout. [Trang bán vé The Amazing Bay](https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay). Hướng dẫn trên cổng bán vé amazingbay.vn, đăng 16/04/2026, ghi **279.000 ₫** cho vé trẻ em và nêu đây là mức tham khảo có thể đổi: [Hướng dẫn đặt vé](https://amazingbay.vn/huong-dan-dat-ve-online-tai-the-amazing-bay-vinh-ky-dieu/). NaiVerse giữ cả hai mức trẻ em ở trạng thái `conflicting`, không tính vào tổng lịch trình hoặc giá hiện hành; xác nhận với đơn vị trước khi mua. FAQ Sơn Tiên nêu trẻ dưới 1 m miễn phí.

Sau migration `0025_amazing_bay_child_price_conflict_2026.sql`, chạy thêm `supabase/migrations/0026_amazing_bay_operator_ticket_source_refresh.sql`. Migration cập nhật nguồn của vé người lớn 490.000 ₫ và mức trẻ em 270.000 ₫ sang trang bán vé chính thức; giữ hai mức trẻ em là `conflicting`, không sửa giá dưới 1 m. Chạy lại an toàn; trang chi tiết liệt kê nguồn chính thức và nguồn mâu thuẫn riêng.

## Cập nhật triển khai và xác minh ngày 16/10/2026

### AI Guide VI/EN

1. Áp dụng migrations và seed theo mục cài Supabase. Với project hoàn toàn mới, chạy đúng một lần `NAIVERSE_SETUP_ALL.sql` ở thư mục gốc; không chạy thêm các migration riêng sau bundle.
2. Khởi động `npm.cmd run dev`, đăng ký/đăng nhập và mở `/vi/ai/guide` hoặc `/en/ai/guide`.
3. Chọn một địa điểm cùng loại câu hỏi cố định; đọc và chấp thuận consent trước khi gửi. Không có trường nhập prompt tự do. Request chỉ gồm ID địa điểm, enum câu hỏi, ngôn ngữ và consent; server tự lấy hồ sơ công khai liên quan trước khi gọi DeepSeek.
4. Kiểm tra tối đa ba trích đoạn ngắn. Đây là câu trả lời nguyên văn do DeepSeek chọn; server xác thực toàn bộ text là chuỗi con chính xác của đúng nguồn được dẫn và giao diện không hiển thị paraphrase của model. Đọc trạng thái và ngày đối chiếu cạnh trích đoạn; giá/giờ cũ, mâu thuẫn, hết hạn hoặc chưa xác minh không được gọi là hiện hành. Model vẫn có thể chọn đoạn chưa đủ liên quan hoặc bỏ sót dữ kiện.
5. Smoke model độc lập dùng hai request minh họa (có thể phát sinh chi phí), không dùng session/Redis/ghi DB:

       $env:RUN_LIVE_AI_GUIDE_SMOKE = 'true'
       npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/guide-live-smoke.test.ts
       Remove-Item Env:\RUN_LIVE_AI_GUIDE_SMOKE

    Lần chạy extractive ngày 16/10/2026 đạt **2/2**. Smoke chỉ xác nhận model trả JSON và đoạn trích khớp hồ sơ công khai; không chứng minh đăng nhập, giới hạn Upstash, bảng Supabase hoặc toàn luồng browser/API thật. Chất lượng chọn nguồn được đánh giá riêng bằng 10 development và 10 holdout, đều đạt 10/10 trong hai lượt; mẫu này còn nhỏ.

6. Đánh giá lựa chọn nguồn đối kháng, chỉ khi muốn gọi DeepSeek thật (mỗi split gửi 10 request và có thể phát sinh phí). Chạy development trước, sau đó chạy holdout riêng; không chỉnh prompt theo holdout:

       $env:RUN_LIVE_AI_GUIDE_EVAL = 'true'
       npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/guide-live-eval.test.ts -t development
       npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/guide-live-eval.test.ts -t holdout
       Remove-Item Env:\RUN_LIVE_AI_GUIDE_EVAL -ErrorAction SilentlyContinue

   Ngày 16/10/2026, development đạt **10/10** và lượt holdout riêng đạt **10/10** trên các ca VI/EN, gồm nguồn cạnh tranh, giá cũ/mâu thuẫn, giờ lịch sử, tiếp cận và injection. Đây là fixture nhỏ, không đại diện chất lượng trên mọi câu hỏi. Test chỉ dùng hồ sơ giả lập, không đăng nhập Supabase, không ghi DB và không gọi Upstash. Nếu test lỗi giữa chừng, vẫn gỡ biến môi trường bằng `Remove-Item Env:\RUN_LIVE_AI_GUIDE_EVAL -ErrorAction SilentlyContinue`.

AI Packing smoke (2 request DeepSeek VI/EN, opt-in):

       $env:RUN_LIVE_AI_PACKING_SMOKE = 'true'
       npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/packing-live-smoke.test.ts
       Remove-Item Env:\RUN_LIVE_AI_PACKING_SMOKE

Smoke chỉ gửi dữ kiện chuyến giả lập có cấu trúc, không gửi prompt tự do; các output code/lý do ngoài danh sách sẽ fail schema. Request live có thể phát sinh chi phí.

### Kết quả kiểm tra repository mới nhất

- ESLint: đạt; `npx.cmd tsc --noEmit --incremental false`: đạt.
- Unit/integration mới nhất ngày 16/10/2026: **145 passed, 65 skipped** (210 tổng), gồm regression prompt injection FairPrice, quote parsing/evidence, đối chiếu giá VND chỉ sau năm xác nhận, che email/điện thoại/tên có nhãn/ID giấy tờ có nhãn/GPS trước khi gửi DeepSeek, tham chiếu ngày `Asia/Ho_Chi_Minh` cho Trip DNA, retry JSON bị cắt tối đa một lần, AI Guide chỉ trả đoạn nguyên văn theo citation, kiểm soát quyền đổi thứ tự điểm dừng, và các kiểm tra dữ liệu/migration. Tên không gắn nhãn không được phát hiện tổng quát. Live smoke/evaluator DeepSeek chỉ chạy riêng khi bật biến opt-in.
- Playwright Chromium mới nhất: **24/24 E2E đạt** trên source hiện tại, gồm map/route assistant, marker có tên truy cập, fallback MapTiler khi OSM tile lỗi, AI entry points, FairPrice VI/EN, auth flow stub, API 401, thao tác bàn phím và axe-core WCAG 2.1 A/AA trên 6 trạng thái trang VI/EN. Kiểm tra bằng assistive technology/thiết bị thật vẫn đang chờ.
- Production build Next.js 16.4.1 source hiện tại: compile, TypeScript và **47/47 static pages** đạt với distDir cô lập; build output đã dọn, `tsconfig.json`/`next-env.d.ts` do Next sửa đã khôi phục. Build sandbox trực tiếp trước đây gặp `EPERM`.
- Probe dịch vụ chỉ đọc mới nhất ngày 16/10/2026: Supabase Auth settings **HTTP 200**, Upstash Redis **HTTP 200/PONG**; `places`, `profiles.username`, `trips`, `trip_shares`, `ai_usage`, `price_references`, `place_media` đều HTTP 200. REST chỉ đọc thấy 36 địa điểm, 51 price references, 27 media records và 35 hours records. Migration 0033 được đối chiếu trực tiếp qua Combo 3 có URL sản phẩm hiện hành, 599.000 ₫ và trạng thái `unknown`. Chưa xác nhận đăng ký/đăng nhập bằng tài khoản test, RLS A/B, quota AI thật hoặc ghi/đọc trip qua phiên người dùng; không chạy lại bundle trên database đang có dữ liệu.
- Live AI smoke mới nhất ngày 16/10/2026: **32/32 trên 7 file** với model `deepseek-v4-flash`, Open-Meteo và OpenRouteService thật; gồm sự cố không khẩn cấp qua endpoint VI/EN, ngày “ngày mai/tomorrow”, hỏi lại khi chỉ nêu tháng, FairPrice exact evidence, Guide và Packing. Handler smoke vẫn mock session, limiter và DB; đây chưa phải luồng AI production end-to-end.
- Cập nhật kiểm chứng sau khi khóa model cùng ngày: live AI smoke **33/33 trên 7 file**; unit/integration **149 passed, 66 skipped (215 tổng)**. Nếu đổi `DEEPSEEK_MODEL` khỏi `deepseek-v4-flash`, API fail-closed và không gửi lời gọi đến model khác.
- AI Guide adversarial selector: **10/10 development + 10/10 holdout** trong hai lần chạy riêng; evaluator mới được thêm để giữ split holdout cố định.
- AI Guide câu hỏi tự nhiên: **10/10 development + 10/10 holdout** trên fixture synthetic; evaluator hồ sơ seed catalog NaiVerse: **6/6 mỗi split** với DeepSeek và citation exact. Các bộ còn nhỏ, chưa đại diện catalog Supabase production hoặc truy vấn người dùng.
- FairPrice adversarial live smoke bổ sung sau đó: **2/2** VI/EN với câu lệnh prompt injection nằm trong quote; hai output không đưa “rẻ nhất/cheapest/đã xác nhận” vào các field trích xuất.
- `npm.cmd run catalog:photo-gaps`: **35** hồ sơ yêu cầu ảnh, đủ 35 có ảnh; 0 ảnh bắt buộc còn thiếu. Nhóm trải nghiệm nghề/ẩm thực cộng đồng được miễn ảnh và hiển thị minh họa có nhãn. Ảnh trảng cỏ Bù Lạch gắn đúng hồ sơ `bu-lach-grassland`; hash của cả 14 ảnh nguồn khớp asset triển khai.

Sau migration 0026, chạy `supabase/migrations/0027_suoi_mo_operator_activity_hours.sql`. Trang chính thức [Suối Mơ – tham quan và dã ngoại](https://suoimopark.com/vn/visit-picnic) nêu 08:00–17:00 cho hoạt động vui chơi, hồ bơi thiên nhiên và team building. Nguồn không nêu giờ mở cổng/toàn khu hoặc lịch ngoại lệ theo ngày, nên bản ghi ở trạng thái `unknown`; giờ 07:30–17:00 từ danh bạ Viet-Biz được giữ làm lịch sử, không dùng để lên lịch đến cổng.

Sau migration 0027, chạy `supabase/migrations/0028_suoi_mo_2026_operator_prices.sql`. Bảng PDF chính thức [Suối Mơ 2026](https://suoimopark.com/uploads/BANG%20GIA/2026.pdf) ghi áp dụng từ 01/01/2026 đến khi có chính sách thay thế: vé cổng người lớn 130.000 ₫ ngày Thứ Hai–Chủ Nhật/150.000 ₫ ngày Lễ Tết; trẻ cao 1 m–1,4 m 60.000/70.000 ₫; trẻ dưới 1 m miễn phí. Vé cổng gồm tắm hồ bơi và tắm lại miễn phí. Migration giữ bảng 2025 ở trạng thái `historical`, thêm 5 mức 2026 với nguồn và điều kiện riêng; xác nhận điều kiện/giá theo ngày trước khi mua.

Sau migration `0028`, chạy `supabase/migrations/0029_cat_tien_2025_operator_price_refresh.sql`. Bảng giá khách nội địa [do VQG Cát Tiên công bố](https://cattiennationalpark.com.vn/wp-content/uploads/2024/06/bang-gia-khach-noi-dia-2025.pdf) nêu hiệu lực từ 01/06/2024 đến khi có bảng thay thế. NaiVerse hiển thị riêng vé vào Vườn (gồm một lượt phà vào và đón về), vé Bảo tàng thiên nhiên/Trung tâm cứu hộ động vật, tour Đảo Tiên, phí tham quan Bàu Sấu, xe và hướng dẫn viên. Một khoản hướng dẫn viên được giữ `unknown` vì nguồn nêu khoảng 550.000–650.000 ₫ thay vì giá cố định. Khung 08:30, 10:00, 13:30, 15:00 và tour Đảo Tiên 08:30 là giờ bắt đầu dịch vụ được bảng ghi, không phải giờ mở cổng hay giờ hoạt động chung của Vườn; xác nhận lịch, chỗ, điều kiện tuyến và giá trước chuyến đi.

### Kiểm chứng source và tích hợp mới nhất

Ngày 15/10/2026: catalog giá Cát Tiên có 11 dòng fallback (10 giá cố định theo bảng khách nội địa, một khoản hướng dẫn viên `unknown` do chỉ có khoảng giá); test kiểm tra vé trẻ em, điều kiện tour và không suy diễn giờ mở cửa. `npm.cmd test -- --maxWorkers=1` đạt 53 passed/14 skipped; lint, TypeScript no-incremental và production build đạt. Bộ live AI chạy 4 file với `.env`, gồm 18/18 test DeepSeek, forecast Open-Meteo và route OpenRouteService thật. Playwright E2E cập nhật đạt 8/8, có kiểm tra trực tiếp trang Cát Tiên về phí Bàu Sấu/khoảng giá hướng dẫn viên và minh họa địa điểm không ảnh. Smoke handler vẫn mock Supabase Auth/Upstash/ghi database; các tích hợp đó chỉ được xác minh sau khi áp dụng migrations vào project Supabase và chạy đúng test A/B.

### Dữ liệu tham khảo cho Thác Đá Hàn — 15/10/2026

Sau migration `0029`, chạy lần lượt `supabase/migrations/0030_da_han_third_party_price_and_hours.sql` và `supabase/migrations/0031_da_han_schedule_and_price_source_conflicts.sql`. [Vietgoing](https://vietgoing.com/destination/1011-thac-da-han.html) nêu giờ 07:00–19:00; cẩm nang [Vietnam Airlines](https://www.vietnamairlines.com/go/vi/plan-book/travel/travel-guide/dong-nai-co-gi-choi) nêu 07:00–17:00. Giá cũng mâu thuẫn: Vietgoing nêu vé người lớn 50.000 ₫, trẻ em 25.000 ₫; Vietnam Airlines nêu người lớn 30.000–40.000 ₫, trẻ em 20.000–30.000 ₫; bài [INTOUR](https://intour.vn/kinh-nghiem-du-lich/update-bang-gia-ve-cac-diem-tham-quan-tai-dong-nai-moi-nhat-1695.html) nêu mức khác theo ngày. Đây là nguồn du lịch thứ cấp, chưa được nhà vận hành xác nhận. Migration lưu hai lịch là chưa xác minh/mâu thuẫn; giá ở `conflicting` với `amount_vnd = null`, không cộng vào tổng chi phí. Liên hệ cơ sở để xác nhận ngày đi, giờ, giá và tình trạng hoạt động. Địa điểm chỉ có thông tin khu vực ở xã Sông Trầu theo bài Cổng thông tin Đồng Nai năm 2019; chưa có tọa độ cổng vào đã xác minh. Xem [ghi chú dữ liệu Thác Đá Hàn](THAC_DA_HAN_DATA.md).

### Minh họa khi chưa có ảnh đủ quyền sử dụng

14 địa điểm chưa có ảnh đã duyệt nay có artwork SVG riêng theo chủ đề, xuất hiện ở card khám phá và trang chi tiết. Huy hiệu “Minh họa” và chú thích “không phải ảnh chụp địa điểm” luôn hiển thị để phân biệt với 29 lượt dùng ảnh có nguồn/license. Artwork chỉ giúp nhận biết nhóm chủ đề; không mô tả chính xác kiến trúc, cổng, lối tiếp cận hoặc hiện trạng. Khi có ảnh do đơn vị/chủ ảnh cấp quyền hoặc tệp license mở xác minh được, hãy duyệt ảnh qua quy trình tại [docs/PHOTO_GAPS.md](PHOTO_GAPS.md); ảnh hợp lệ sẽ thay artwork mặc định.

### Bổ sung giờ và giá dịch vụ Giang Điền

Sau migration `0031_da_han_schedule_and_price_source_conflicts.sql`, chạy `supabase/migrations/0032_giang_dien_operator_services.sql`. [Nhà hàng Hoa Sứ](https://giangdien.vn/nha-hang/nha-hang-hoa-su/) công bố Thứ Hai–Chủ Nhật 08:00–21:00; [Nhà hàng Hoàng Yến](https://giangdien.vn/nha-hang/nha-hang-hoang-yen/) nêu 08:00–17:00 nhưng không ghi ngày; [Khách sạn Tre Xanh](https://giangdien.vn/san-pham/leu-a/) nói đón khách 24/24 nhưng không xác nhận phòng trống hoặc giờ nhận/trả phòng. Đây là dữ liệu dịch vụ con, không phải giờ mở cổng/toàn khu. Trang khách sạn đang hiển thị 550.000 ₫ cho lưu trú một đêm, nhưng thiếu đơn vị tính/sức chứa và thời hạn ưu đãi; trạng thái giữ `unknown`, không cộng vào dự toán. Xem các bước kiểm tra, nguồn và giới hạn tại [docs/GIANG_DIEN_SERVICES.md](GIANG_DIEN_SERVICES.md).

Sau `0032`, chạy `supabase/migrations/0033_giang_dien_combo3_current_operator_page.sql`. Trang chính thức [Lều Combo 3 Sàn B](https://giangdien.vn/san-pham/leu-san-b-combo3/) đang hiển thị 599.000 ₫ (giá gạch 699.000 ₫), đồng thời mô tả vé cổng/tắm thác, lều qua đêm, tiện ích và bữa ăn. Trang không nói đơn vị giá, số người/sức chứa hay thời hạn ưu đãi; bản ghi vẫn là `unknown` và không được đưa vào dự toán. Kiểm tra SQL Editor để xác nhận đúng một hàng Combo 03 trỏ tới URL sản phẩm mới, sau đó mở trang `/vi/places/giang-dien-waterfall`, kiểm tra nhãn “Chưa xác minh” và nhấn “Mở nguồn”.

### Xác minh lại AI/auth và hướng dẫn triển khai — 15/10/2026

Sau phản hồi người dùng rằng các trợ lý chưa dễ thấy, đã mở trực tiếp `/vi` và các URL `/vi` + `/en` cho `/ai/conditions`, `/ai/routes`, `/auth`; tất cả trả HTTP 200 và `/` redirect tới `/vi`. E2E Chromium toàn bộ đạt 14/14, bao gồm ba lối vào AI trên màn hình desktop/390px, bản đồ tới AI route, username/password form và API AI trả 401 khi chưa đăng nhập. Lỗi hydration trong ảnh có khác biệt hai thuộc tính `data-yd-*` được chèn bởi extension; không tái hiện trong Chromium sạch.

Live smoke bằng `.env` đạt 18/18 trên bốn file: DeepSeek thật cho parser/itinerary, weather/safety/green advice và route explanations; Open-Meteo forecast và OpenRouteService geometry thật. Handler smoke mock session Supabase, Redis quota và DB writes; không tính đây là kiểm chứng auth/RLS/lưu dữ liệu.

Full unit/integration đạt 56 passed/14 skipped; lint và typecheck đạt. Production build Next.js 16.4.1 sinh đủ 40/40 route/API. `npm.cmd run services:probe` xác nhận Supabase Auth settings HTTP 200 và Upstash REST PING HTTP 200/PONG; `public.places` vẫn HTTP 404/PGRST205. Vì vậy cần chủ project áp migrations `0001`–`0033` rồi mới chạy xác minh đăng ký/đăng nhập thật, trips, RLS A/B và limiter.

Quy trình tạo dịch vụ/lấy URL-key và import GitHub vào Vercel: [THIET_LAP_DICH_VU.md](THIET_LAP_DICH_VU.md). Quyền sử dụng 14 ảnh đã được người dùng xác nhận và ảnh đã tích hợp vào hồ sơ tương ứng; nhóm trải nghiệm cộng đồng được miễn ảnh theo [PHOTO_GAPS.md](PHOTO_GAPS.md). Hiện có 0/36 tọa độ cổng đã xác minh; giá/giờ chỉ được công bố theo trạng thái nguồn tương ứng, không suy ra dữ liệu còn thiếu.
