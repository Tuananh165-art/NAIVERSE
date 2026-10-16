# Rà soát giới hạn và điều khoản dịch vụ

## Kiểm tra ngày 16/10/2026

Các gói và điều khoản có thể thay đổi. Bảng này là ghi chú cho MVP/demo, không phải cam kết quota hay tư vấn pháp lý. Mở trang nhà cung cấp ngay trước khi public hoặc thay đổi mục đích sử dụng.

| Dịch vụ | Phạm vi có thể dùng cho demo | Giới hạn và điều cần kiểm tra |
|---|---|---|
| Vercel Hobby | Dùng cá nhân/phi thương mại. | Không dùng Hobby cho hoạt động thương mại; chọn gói phù hợp trước khi kinh doanh. [Điều kiện Hobby](https://vercel.com/docs/plans/hobby) |
| Supabase Free | Auth/Postgres cho prototype và demo nhỏ. | Quota tính theo project/tài khoản; project Free có thể bị pause khi không hoạt động. Kiểm tra usage, backup/khôi phục và điều khoản dữ liệu trước khi dùng production. [Bảng giá](https://supabase.com/pricing), [vòng đời project](https://supabase.com/docs/guides/platform/going-into-prod#pause-and-restore-projects) |
| Upstash Redis Free | Hạn mức request cho demo và thử nghiệm. | Bảng giá hiện công bố 256 MB, 500.000 command/tháng và 10 GB bandwidth cho Free; hạn mức có thể đổi. Theo dõi usage và đặt fail-closed cho AI khi limiter không sẵn sàng. [Bảng giá Redis](https://upstash.com/pricing/redis) |
| Open-Meteo Free API | Forecast phi thương mại, có attribution CC BY 4.0. | Không có SLA cho endpoint miễn phí; trang giá hiện nêu 10.000 call/ngày và 300.000/tháng. Dùng cho demo phi thương mại; hoạt động thương mại cần giấy phép/subscription phù hợp. [Bảng giá](https://open-meteo.com/en/pricing), [điều khoản](https://open-meteo.com/en/terms) |
| OpenRouteService / HeiGIT | Routing demo qua host mới với API key. | Quota phụ thuộc plan và endpoint; kiểm tra dashboard tài khoản trước khi tăng tải. Host `api.openrouteservice.org` đã deprecated, bị giảm quota từ 27/08/2026 và có lịch dừng 02–06/11/2026. Mã NaiVerse gọi `api.heigit.org/openrouteservice/v2`; thông báo nhà cung cấp xác nhận key cũ dùng được ở host mới. [Thông báo chuyển host](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912), [giảm quota host cũ](https://ask.openrouteservice.org/t/reducing-the-quota-of-deprecated-api-api-openrouteservice-org/8013), [giới hạn API](https://openrouteservice.org/restrictions/) |
| OpenStreetMap tile servers | Hiển thị tile với attribution rõ ràng. | Dịch vụ best-effort, không có SLA; tôn trọng cache headers, không prefetch/bulk/offline, không dùng làm autocomplete. Có thể đổi sang tile provider phù hợp nếu tải tăng. [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) |
| MapTiler Cloud (tùy chọn) | Fallback tile khi máy chủ OSM không truy cập được; ứng dụng cần API key public giới hạn theo domain. | Bảng giá hiện công bố Free cho thử nghiệm/cá nhân/phi thương mại (5.000 map sessions và 100.000 API requests/tháng; dùng hết quota thì dịch vụ tạm dừng đến tháng sau). Flex hiện từ 30 USD/tháng với usage/overage theo bảng giá. Kiểm tra lại quota, điều kiện thương mại và giới hạn chi tiêu trong dashboard trước khi dùng; không cần mua nếu OSM truy cập bình thường. [Pricing](https://www.maptiler.com/cloud/pricing/), [Leaflet raster tiles](https://docs.maptiler.com/leaflet/examples/raster-tiles-in-leaflet-js/) |
| DeepSeek API | Model lấy từ biến server `.env`; key không đưa vào client. | Giá, model alias và giới hạn có thể thay đổi; xem bảng giá và rate limits ở thời điểm triển khai. `deepseek-v4-flash` là alias tương thích được nhà cung cấp phục vụ bằng V4.1 Flash theo tài liệu hiện hành. Không chốt ngân sách token cố định trong tài liệu này. [Giá API](https://api-docs.deepseek.com/quick_start/pricing/), [rate limits](https://api-docs.deepseek.com/quick_start/rate_limit/) |

## Cổng trước khi kinh doanh

1. Chọn hosting và database plan cho mục đích thương mại, tải dự kiến, backup, SLA và thời gian lưu dữ liệu.
2. Xác nhận giấy phép thương mại cho weather, map tiles, routing và nội dung/ảnh; attribution vẫn phải hiển thị theo điều khoản.
3. Kiểm tra giá model, hạn mức theo tài khoản và đặt ngân sách/alert phía nhà cung cấp; quota ứng dụng NaiVerse không thay quota provider.
4. Đo tải thực, lỗi 429/5xx, cache hit, latency và chi phí trên các luồng VI/EN; hạ hoặc tắt tính năng AI khi limiter/provider lỗi.
5. Lưu ngày kiểm tra, liên kết điều khoản và quyết định người chịu trách nhiệm trong hồ sơ vận hành.

## Cấu hình ứng dụng hiện tại

- Server secrets: `DEEPSEEK_API_KEY`, `OPENROUTESERVICE_API_KEY`, Supabase service role và Upstash token chỉ ở môi trường server.
- Không cần API key cho Open-Meteo free forecast; đây không phải giấy phép thương mại.
- Redis limiter cấu hình mặc định của app giới hạn 5 thao tác/phút, 20/người/ngày và 200 lượt model/ngày toàn app. Đây là quota nội bộ, không đồng nghĩa nhà cung cấp cấp từng ấy request.
- Bản đồ OSM tải theo nhu cầu và ghi attribution; không tải trước tile.
