# Thiết lập dịch vụ NaiVerse từng bước

## Một file SQL để cài trên Supabase mới

Nếu bạn muốn dán một file duy nhất vào SQL Editor, cách này thay thế hoàn toàn quy trình chạy migration rời ở mục 2:

1. Từ PowerShell tại thư mục dự án chạy npm.cmd run db:bundle-sql.
2. Mở NAIVERSE_SETUP_ALL.sql ở thư mục gốc repository. Đây là file được sinh từ 34 migration hiện có và seed 36 địa điểm; chạy lại lệnh sau khi migration/catalog thay đổi để cập nhật bundle.
3. Chỉ dùng trên Supabase project mới, chưa có bảng NaiVerse. Trong SQL Editor, dán toàn bộ file rồi bấm Run một lần. Đợi kết quả thành công trước khi làm bước Auth/kiểm tra dịch vụ.
4. Sau bundle, KHÔNG chạy riêng migration 0001–0034 và KHÔNG chạy seed:catalog. Seed nằm trong bundle.
5. Không chạy bundle lên project đã cài một phần hoặc đang có dữ liệu. Bundle không tạo migration ledger. Với project cũ, backup trước, xác định migration nào đã áp dụng và chỉ chạy những file còn thiếu theo số thứ tự; nếu không xác định chắc, tạo project mới.

Bundle seed bằng ON CONFLICT DO NOTHING, do đó không ghi đè hồ sơ địa điểm đã có. Điều đó không làm toàn bộ migration lặp an toàn: hãy coi bundle là thao tác một lần trên database trống.

Nếu một lần chạy bundle trước đây dừng tại migration 0001 với `42P17`, lấy bản `NAIVERSE_SETUP_ALL.sql` mới nhất sau khi pull/cập nhật repository. Trên project mới vừa chạy lỗi, dùng truy vấn preflight trong `docs/HUONG_DAN.md`; chỉ chạy lại toàn file nếu kết quả cho thấy database trống hoặc chỉ có phần đầu migration 0001. Không dùng bundle này để sửa project đã có bảng NaiVerse/data.

> Dùng cho repository hiện tại, Next.js 16 và Node.js 24. Tạo tài khoản dịch vụ bằng email của bạn; không gửi API key, database password hay file `.env` cho người hỗ trợ. Giao diện dashboard có thể thay đổi, nên nếu tên menu khác hãy theo tài liệu chính thức đã liên kết.

## 1. Chuẩn bị ứng dụng local

1. Cài Node.js 24.x và Git trên Windows; mở PowerShell ở `F:\NAIVERSE`.
2. Cài đúng dependency theo lockfile và tạo cấu hình riêng:

   ```powershell
   npm.cmd ci
   Copy-Item .env.example .env
   ```

3. Giữ `.env` ngoài Git. Điền biến theo bảng ở mục 7; không chép giá trị bí mật vào source code, issue, ảnh chụp hoặc tài liệu.

## 2. Tạo project Supabase và bật username/password

1. Đăng nhập [Supabase Dashboard](https://supabase.com/dashboard), chọn tổ chức rồi bấm **New project**. Chọn tên `naiverse`, region gần người dùng dự kiến và database password riêng; lưu password an toàn. Chờ project báo sẵn sàng.
2. Trong project, mở **Connect** để lấy Project URL và publishable key; mở **Project Settings → API Keys** để tạo/lấy publishable key (`sb_publishable_...`) và secret key (`sb_secret_...`). Điền lần lượt vào `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. Publishable key có thể ở client nhưng dữ liệu vẫn phải được bảo vệ bằng RLS; secret key chỉ chạy phía server và có quyền cao.
3. Mở **SQL Editor**. Chạy `supabase/migrations/0001_naiverse_core.sql` trước. Tại PowerShell chạy `npm.cmd run seed:catalog` để nạp 36 hồ sơ. Sau đó chạy lần lượt mọi migration `0002` đến migration có số lớn nhất trong `supabase/migrations/` (hiện là `0034`), theo thứ tự tên. Mỗi migration chạy một lần, đợi kết quả thành công rồi mới chạy tệp kế tiếp. Không seed trước migration 0001.
4. Mở **Authentication → URL Configuration**. Đặt Site URL local là `http://localhost:3000`, thêm redirect local theo host/port thực tế. Tắt email confirmation chỉ khi demo local; môi trường public nên bật lại. Đăng ký tại `/vi/auth` cần tên hiển thị, username, email và mật khẩu từ 10 ký tự; đăng nhập chấp nhận username + password hoặc email + password.
5. Chạy kiểm tra chỉ đọc:

   ```powershell
   npm.cmd run services:probe
   ```

   Kết quả mong đợi: Auth settings HTTP 200, bảng `public.places` HTTP 200, Upstash PING trả PONG. `404/PGRST205` ở `places` nghĩa là migration chưa chạy xong hoặc schema `public` chưa được expose trong Data API. Probe không tạo tài khoản hoặc sửa dữ liệu. Hướng dẫn role demo và kiểm tra RLS nằm trong [HUONG_DAN.md](HUONG_DAN.md).

Tài liệu chính thức: [tạo project Supabase](https://supabase.com/docs/guides/getting-started), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 3. Tạo API key DeepSeek

1. Đăng nhập [DeepSeek Platform](https://platform.deepseek.com/) và mở phần API keys; tạo key riêng cho NaiVerse rồi lưu an toàn. Tài liệu gọi API: [Your First API Call](https://api-docs.deepseek.com/guides/codex).
2. Điền `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL=deepseek-v4-flash`, `DEEPSEEK_BASE_URL=https://api.deepseek.com` vào `.env`. Key không được có tiền tố `NEXT_PUBLIC_`.
3. Khởi động lại server. Đăng nhập và thử Journey Studio, `/vi/ai/conditions` và `/vi/ai/routes`. AI thật cần Supabase session và Upstash; tình huống khẩn cấp phải hiển thị số liên hệ ngay, không gọi model.
4. Để gọi model thật từ test, dùng lệnh opt-in trong phần **Kiểm tra AI live** ở [HUONG_DAN.md](HUONG_DAN.md). Mỗi lần chạy tạo request thật theo tài khoản và có thể phát sinh chi phí.

**Tên model:** ứng dụng giữ alias `deepseek-v4-flash` theo `.env` bạn đang dùng. [Tài liệu DeepSeek về model/API](https://api-docs.deepseek.com/guides/codex) hiện ghi alias cũ vẫn được chấp nhận nhưng request được phục vụ bằng `deepseek-flash` / V4.1 Flash. Smoke test hiện tại không in key hoặc prompt; kiểm tra model provider trả về và giá/điều khoản trước buổi demo.

## 4. Tạo Upstash Redis REST

1. Đăng nhập [Upstash Console](https://console.upstash.com/), vào **Redis → Create Database**, đặt tên `naiverse-rate-limit`, chọn region gần Vercel function rồi tạo database.
2. Mở database → **Details** hoặc **Connect → REST API**. Sao chép HTTPS REST URL và token thường (read/write), không dùng Read-Only Token vì limiter cần ghi bộ đếm.
3. Điền `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` vào `.env`. Token chỉ ở server.
4. Chạy `npm.cmd run services:probe`; cần có `PASS Upstash Redis REST: HTTP 200; PONG`. Sau đó gửi một vài request AI khi đã đăng nhập. Có thể hạ giới hạn trong `.env` để kiểm thử 429 ở local rồi khôi phục trước deploy. Thiếu Redis trên deployment thì AI fail-closed để tránh request không hạn mức.

Tham khảo: [tạo Redis database](https://upstash.com/docs/redis/overall/getstarted), [lấy REST URL/token](https://upstash.com/docs/redis/howto/connect-with-upstash-redis), [REST API](https://upstash.com/docs/redis/features/restapi).

## 5. Tạo API key OpenRouteService

1. Đăng ký/đăng nhập [HeiGIT Account](https://account.heigit.org/), sau đó tạo API key OpenRouteService.
2. Điền `OPENROUTESERVICE_API_KEY` vào `.env`, không đặt tiền tố `NEXT_PUBLIC_`.
3. Mở `/vi/ai/routes`, chọn ít nhất hai pin do bạn tự đặt, đồng ý gửi tên và metric tuyến tới DeepSeek rồi so sánh. Tọa độ được gửi tới ORS; DeepSeek chỉ nhận tên điểm và số liệu. Kết quả ước lượng theo mạng đường, không có traffic realtime.
4. App gọi `https://api.heigit.org/openrouteservice/v2`. Key ORS cũ được nhà cung cấp xác nhận dùng được với host mới. Không đổi về `api.openrouteservice.org`: host cũ đã bị giảm quota và sẽ ngừng hoạt động trong lịch tắt 02–06/11/2026. Nếu provider báo 401/403, kiểm tra key; nếu 429, xem quota endpoint trong HeiGIT Account và giảm request. Tham khảo [thông báo đổi host](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912), [ORS restrictions](https://openrouteservice.org/restrictions/) và [API docs](https://openrouteservice.org/dev/).

## 6. Import GitHub vào Vercel

1. Trước khi stage, chạy `git status --short`. Workspace hiện có thể chứa file DOCX/PDF riêng ngoài project; **không dùng `git add .`**. Stage đúng các phần của ứng dụng rồi xem lại danh sách:

   ```powershell
   git add .github .gitignore .env.example README.md docs e2e next.config.ts next-env.d.ts package.json package-lock.json playwright.config.ts postcss.config.mjs proxy.ts public scripts src supabase tsconfig.json vitest.config.mjs
   git status --short
   git check-ignore .env
   ```

   Chỉ commit nếu `git status` không có `.env`, document cá nhân, build output hoặc file khác ngoài project. Tạo repository tại [GitHub](https://github.com/new), rồi push branch chính.
2. Mở [Vercel New Project](https://vercel.com/new), kết nối GitHub nếu được hỏi, chọn đúng repository NaiVerse rồi Import. Framework preset **Next.js**, Root Directory `./`, Node.js **24.x**.
3. Trong bước Import hoặc **Project → Settings → Environment Variables**, khai báo biến ở mục 7. Chọn **Production** và **Preview** theo nhu cầu; chỉ URL/publishable key là public. Không dùng tiền tố `NEXT_PUBLIC_` cho DeepSeek, Redis, ORS hay Supabase secret.
4. Deploy. Vercel cấp URL HTTPS dạng `https://<project>.<team>.vercel.app`. Cập nhật `NEXT_PUBLIC_APP_URL` thành URL production. Trong Supabase **Authentication → URL Configuration**, đổi Site URL sang domain production và thêm redirect URL cho domain production; kiểm tra preview riêng. Redeploy sau khi thay đổi environment variables.
5. Smoke test URL public: `/vi`, `/en`, `/vi/ai/conditions`, `/vi/ai/routes`, `/vi/auth`; đăng ký user thử nghiệm, rồi thử AI, lưu chuyến và workflow báo giá demo. Xem Function Logs, xác nhận không có API key hoặc prompt chứa thông tin cá nhân.
6. Nếu deployment lỗi, mở **Deployments → Build Logs**. Khắc phục environment/config rồi redeploy; rollback code bằng **Deployments → chọn bản trước → Promote to Production**. Rollback code không tự hoàn nguyên migration hoặc database.

Tài liệu: [Import Git repository](https://vercel.com/docs/git), [quản lý project](https://vercel.com/docs/projects/managing-projects), [Environment Variables](https://vercel.com/docs/environment-variables), [Node.js runtimes](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). Vercel Hobby giới hạn mục đích cá nhân/phi thương mại; kiểm tra lại plan và điều khoản trước khi dùng thương mại.

## 7. Bảng biến môi trường

| Biến | Nơi lấy/giá trị | Bắt buộc cho | Phạm vi |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek Platform → API keys | Mọi tính năng LLM | Server secret |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` theo alias cấu hình hiện tại | Mọi tính năng LLM | Server |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | Mọi tính năng LLM | Server |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Connect | Auth, catalog, trip, inquiry | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Connect / API Keys | Auth, truy vấn có RLS | Public; RLS phải bật |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys | Seed và username lookup phía server | Server secret; quyền cao |
| `UPSTASH_REDIS_REST_URL` | Upstash database → Details/Connect | AI/auth rate limits | Server config |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash database → Connect → REST API | AI/auth rate limits | Server secret |
| `OPENROUTESERVICE_API_KEY` | ORS developer dashboard | AI route assistant | Server secret |
| `NEXT_PUBLIC_MAP_TILE_URL` | Mặc định `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Bản đồ | Public; tuân thủ OSM attribution/policy |
| `NEXT_PUBLIC_APP_URL` | Local `http://localhost:3000`, production URL Vercel | Callback/link ứng dụng | Public |
| `AI_USER_MINUTE_LIMIT` | Mặc định `5` | Giới hạn AI | Server config |
| `AI_USER_DAILY_LIMIT` | Mặc định `20` | Giới hạn AI | Server config |
| `AI_GLOBAL_DAILY_LIMIT` | Mặc định `200` | Giới hạn AI toàn app | Server config |
| `DEMO_MODE` | `true` cho doanh nghiệp giả lập | Gắn nhãn quote/inquiry DEMO | Server config |

MVP không cần API key cho Open-Meteo free forecast; free endpoint chỉ phù hợp phi thương mại. Vercel Hobby cũng chỉ dành cho mục đích cá nhân/phi thương mại. Xem rà soát dịch vụ và quota đã cập nhật tại [SERVICE_LIMITS.md](SERVICE_LIMITS.md). Bản đồ dùng OpenStreetMap với [tile usage policy](https://operations.osmfoundation.org/policies/tiles/); không tải trước/offline hoặc chạy crawler.

## 8. Tiêu chí xác nhận xong cấu hình

- `npm.cmd run services:probe`: Supabase Auth/schema và Upstash phản hồi như mong đợi.
- `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` và `npm.cmd run build` đạt local.
- DeepSeek, Open-Meteo và ORS có bằng chứng smoke thật riêng; tests mock không được tính là provider/RLS proof.
- Đăng ký/đăng nhập, profile và RLS A/B chỉ được đánh dấu đạt sau khi áp migrations vào project thật và thử hai user riêng.
- Vercel chỉ được ghi “đã deploy/kiểm chứng” khi có URL thật và hoàn thành smoke test sau deploy.
