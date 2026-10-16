# Kế hoạch, phạm vi và TODO NaiVerse

## Cập nhật endpoint định tuyến và điều khoản dịch vụ — 16/10/2026

- [x] Chuyển directions và matrix từ `api.openrouteservice.org` sang `api.heigit.org/openrouteservice/v2`; unit kiểm tra URL mới và route smoke gọi provider thật qua host mới đạt 4/4 test liên quan.
- [x] Cập nhật hướng dẫn tạo key tại HeiGIT Account và lịch deprecated/tắt host cũ theo thông báo nhà cung cấp.
- [x] Ghi lại quota/điều khoản demo hiện tại và các cổng cần hoàn tất trước kinh doanh trong [SERVICE_LIMITS.md](SERVICE_LIMITS.md). Review này không thay cho việc kiểm tra lại gói, giá hoặc giấy phép lúc triển khai.
- [x] Mở rộng `services:probe` thành kiểm tra chỉ đọc 36 địa điểm và các cột schema bắt buộc ở `price_references`, `organizations`, `place_media`, `place_hours` cùng Auth/Upstash. Chạy thật 16/10/2026: tất cả HTTP 200, Upstash PONG; đây không phải kiểm thử RLS theo user.

## Xác minh tổng thể mới nhất — 16/10/2026

- [x] Unit/integration mới nhất (mặc định, không bật live keys): 93 passed, 41 skipped; lint/typecheck đạt. Các test live opt-in được đếm skipped khi chạy mặc định.
- [x] Playwright Chromium: 22/22; gồm AI Guide, FairPrice discovery/consent, ảnh nhóm cộng đồng có nhãn, username registration request, username-login request/error, chặn AI API khi chưa đăng nhập và bàn phím đổi sang đăng ký/hiện mật khẩu bằng Enter. Test đăng ký/đăng nhập chặn request Supabase tại trình duyệt.
- [x] DeepSeek Trip DNA ngày 16/10: sau khi làm rõ taxonomy và sửa một nhãn expected development không có căn cứ, đo lại đạt 358/358 field; khóa prompt rồi chạy holdout một lần đạt 176/180 (97,8%). Bốn mismatch holdout được ghi trong `AI_AUDIT.md`, không dùng để tinh chỉnh.
- [x] Regression kiểm tra payload DeepSeek thực gửi đã che GPS DMS dạng ASCII và dấu prime/định hướng Bắc–Đông tiếng Việt; trước khi sửa, test chứng minh DMS bị lọt qua bộ lọc thập phân.
- [x] DeepSeek FairPrice live VI/EN: 2/2, gồm báo giá có câu lệnh prompt injection; output được kiểm tra theo exact evidence và không giữ tuyên bố “rẻ nhất/cheapest/đã xác nhận”.
- [x] AI Guide selection adversarial live VI/EN: 10/10 development và 10/10 holdout trong hai lượt DeepSeek tách riêng; nhiều loại nguồn cạnh tranh, giá cũ/mâu thuẫn, giờ lịch sử, tiếp cận và injection. Fixture nhỏ, không xem là độ chính xác tổng quát.
- [ ] Luồng authenticated còn cần tài khoản test và mailbox do chủ project kiểm soát: đăng ký/email confirmation, username-login, RLS khách A/B và doanh nghiệp A/B, ghi trip/FairPrice, cùng quota Upstash qua request thật. Probe bảng công khai không xác minh các quyền này.

## Cập nhật trạng thái 16/10/2026

Người dùng đã xác nhận quyền sử dụng đủ 14 ảnh đầu vào; hash SHA-256 khớp, catalog có 43 lượt dùng ảnh trên đủ 35 hồ sơ yêu cầu ảnh. Nhóm nghề/ẩm thực cộng đồng được miễn ảnh và dùng artwork có nhãn; ảnh Bù Lạch gắn đúng hồ sơ. Auth hỗ trợ đăng ký username/email + password, đăng nhập bằng username hoặc email + password, và đăng xuất local; unit/E2E kiểm tra luồng giao diện/endpoint, nhưng chưa đăng ký bằng tài khoản test thật hoặc xác minh RLS A/B. `NAIVERSE_SETUP_ALL.sql` được tạo lặp lại cho ra cùng nội dung, gồm 34 migration và seed 36 địa điểm. Probe chỉ đọc ngày 16/10/2026 xác nhận Auth settings, Upstash PING, các bảng chính và 36 địa điểm công khai; migration 0033 cũng được xác nhận qua dòng Combo 3 đã cập nhật. Live smoke DeepSeek/Open-Meteo/ORS đạt 24/24 trên 7 file; FairPrice prompt-injection VI/EN được chạy thêm đạt 2/2; AI Guide extractive VI/EN đạt 2/2, evaluator đạt 10/10 development + 10/10 holdout trong hai lượt riêng; handler smoke vẫn mock auth, limiter và ghi DB. Unit/integration hiện đạt **93 passed/41 skipped** ở cấu hình mặc định; E2E đạt **22/22**; lint/typecheck và production build đạt. Đánh giá Trip DNA mới nhất đạt **358/358 development, 176/180 holdout**; các bộ đánh giá đều có mẫu nhỏ. Xem [kiểm toán AI](AI_AUDIT.md), [kịch bản demo](DEMO_KICH_BAN.md), [trạng thái ảnh](PHOTO_GAPS.md) và phần TODO bên dưới.

## Cập nhật AI Guide — 16/10/2026

- [x] Thêm `/vi/ai/guide` và `/en/ai/guide`: chọn một địa điểm công khai và loại câu hỏi cố định; yêu cầu consent trước khi gửi.
- [x] Truy xuất hồ sơ địa điểm, nguồn, giá và giờ liên quan; chuẩn hóa dấu tiếng Việt và giới hạn citation vào ID nguồn thực sự đã truy xuất. Giá/giờ hết hạn, cũ, xung đột hoặc chưa xác minh được giữ nguyên trạng thái.
- [x] Không có ô prompt tự do trong AI Guide; không gửi tên, liên hệ, GPS hoặc ghi chú cá nhân. Thông tin giá và giờ do ứng dụng lấy theo intent; DeepSeek chỉ chọn đoạn nguyên văn phù hợp từ hồ sơ đã truy xuất.
- [x] Unit/route tests bao gồm auth, từ chối field câu hỏi tự do, payload privacy, citation ngoài tập nguồn và từ chối paraphrase/đoạn không khớp. AI Guide chỉ trả tối đa ba trích đoạn nguyên văn đã kiểm tra, không hiển thị phát biểu do model tự viết.
- [x] Chạy DeepSeek smoke extractive VI/EN sau khi đổi Guide; đạt 2/2 trên hồ sơ Amazing Bay tĩnh, kiểm tra output đúng schema và text là substring nguyên văn của đúng nguồn. Route unit kiểm tra giá hết hạn, giờ mâu thuẫn, injection trong source note, sai citation và paraphrase bị loại.
- [x] Thêm evaluator opt-in `RUN_LIVE_AI_GUIDE_EVAL` với hai split riêng, 10 ca mỗi split VI/EN, nhiều nguồn cạnh tranh, status cũ/mâu thuẫn, wheelchair access và prompt injection. DeepSeek đạt 10/10 development và 10/10 holdout trong hai lượt; mẫu nhỏ, chưa đo chất lượng trên truy vấn người dùng đại diện.
- [x] API thật và evaluator dùng chung bộ lọc nguồn theo intent/system prompt; hồ sơ bị lọc trước khi gửi model. Exact citation/substr checks vẫn là cổng bắt buộc, và catalog cần được con người rà soát trước công bố.
- [x] Thêm AI Packing Assistant trong Journey Studio: DeepSeek chỉ sắp xếp mã vật dụng/độ ưu tiên được phép từ trip facts có cấu trúc; nhãn, lý do, cảnh báo sức khỏe/tiếp cận do ứng dụng kiểm soát. Không gửi prompt gốc, budget, GPS hay liên hệ.
- [x] Thêm migration `0034_ai_packing_usage_feature.sql` để ghi feature usage; route kiểm tra auth, consent, Upstash, điểm dừng catalog và loại mã/lý do không phù hợp.
- [x] Bổ sung bộ lọc trước biên DeepSeek: xóa field tọa độ và che email, số điện thoại, cặp GPS khỏi text; regression kiểm tra nội dung request thực sự gửi đi.
- [x] Chuẩn bị 60 case Trip DNA song ngữ (40 development/20 holdout); lần đo ngày 16/10 đạt 176/180 holdout (97,8%, 20 prompt, 10 mỗi locale), vượt target 90% trên mẫu. Bốn mismatch và giới hạn đánh giá ghi trong [AI_AUDIT.md](AI_AUDIT.md); không điều chỉnh parser bằng holdout.
- [x] Đo 40 prompt development bằng DeepSeek thật: 358/358 field (100%) sau khi làm rõ taxonomy và hiệu chỉnh một expected label suy diễn từ địa danh; prompt không được tối ưu bằng holdout. Đây là mẫu nhỏ, không phải cam kết cho mọi input.
- [x] Hỗ trợ phương tiện xe đạp tách biệt khỏi đi bộ trong Trip DNA, Journey Studio và packing input; cập nhật enum prompt, kiểm tra schema và đo lại cả development/holdout bằng DeepSeek thật.
- [x] Tạo FairPrice Lens VI/EN: khách đăng nhập và consent, dán văn bản tối đa 4.000 ký tự, DeepSeek trích trường có schema, server chỉ giữ giá/field có exact evidence substring và chỉ cho candidate reference từ catalog cùng địa điểm.
- [ ] Kiểm chứng FairPrice end-to-end với DeepSeek + Upstash + Supabase thật sau khi người dùng áp schema; kiểm tra nguồn xung đột/hết hạn và quote có prompt injection. Tính năng không phán giá tốt/xấu, không nhận upload và không lưu quote.
- [x] Cho phép đổi thứ tự điểm dừng của chuyến đã lưu; API chỉ nhận ID nằm trong phương án đang chọn, giới hạn quyền theo chủ chuyến, xóa route cũ và gắn cờ cần tính lại.
- [ ] Hỏi đáp tự do, upload tài liệu, TTS và Operator Copilot chưa triển khai; tiếp tục giữ Guide theo câu hỏi chọn sẵn và chỉ làm Copilot khi có đối tác/nhân viên thử nghiệm.

## Cập nhật accessibility và hợp nhất catalog — 16/10/2026

- [x] Thêm axe-core vào Playwright và audit WCAG 2.1 A/AA trên 6 trạng thái trang VI/EN; sửa màu chữ phụ không đủ tương phản và accessible name của nút đổi ngôn ngữ. E2E toàn bộ hiện đạt 22/22, gồm auth request dùng stub và bài thao tác bàn phím.
- [x] Sửa catalog server để giữ ảnh local được người dùng cấp quyền khi database có ảnh đã duyệt, loại ảnh trùng theo URL/nguồn, khử evidence trùng và giữ nguyên `labelEn` từ JSONB database. Unit regression và trang Bù Lạch/Giang Điền/Mã Đà E2E xác nhận.
- [ ] Kiểm thử thủ công bằng bàn phím/đọc màn hình và thiết bị thật; audit tự động/responsive source không thay thế kiểm tra assistive technology trên thiết bị.

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
- [x] Thêm ba mức vé Amazing Bay từ nguồn Sơn Tiên, checked 2026-10-15; giá quá 30 ngày rời nhãn hiện hành. Bổ sung giá Bửu Long theo hai đợt lễ 02/01 và 26/04/2026 từ cổng thông tin Đồng Nai; chỉ lưu lịch sử, không nhận là giá hiện tại.
- [x] Đối chiếu hai nguồn giá trẻ em Amazing Bay và hiển thị xung đột 270.000/279.000 ₫; cả hai dòng được loại khỏi giá hiện hành và tổng lịch trình cho đến khi đơn vị vận hành xác nhận.
- [ ] FairPrice Lens nâng cao: xác nhận từng field với khách rồi code so sánh sản phẩm/đơn vị/đối tượng/hiệu lực; không để model xếp hạng giá. Bảng Suối Mơ ghi giá áp dụng từ 25/01/2025 đến khi thay thế, vẫn cần khách xác nhận trước khi mua.
- [x] Trang quản trị platform admin cập nhật trạng thái, ghi chú, tọa độ có căn cứ và nguồn; quản lý phản ánh.
- [x] Tải catalog và nguồn giá đã duyệt từ Supabase; fallback catalog code khi chưa cấu hình/chưa seed.
- [x] Giao diện admin nhập, duyệt/gỡ duyệt và xóa ảnh (kèm credit/license), giờ theo ngày và giá; bản ghi mới mặc định pending, verified cần bằng chứng nguồn; endpoint giới hạn platform admin và public UI chỉ đọc approved.
- [x] Dashboard quản trị có bảng độ phủ ảnh, tọa độ cổng đã xác minh, giờ và giá; chỉ tính evidence đã duyệt, tách trạng thái verified khỏi bản ghi tham khảo, đồng thời liệt kê từng địa điểm còn thiếu.
- [x] Rain Plan với Open-Meteo forecast theo vùng đến 7 ngày; không phải cảnh báo chính thức, điều khoản free có thể giới hạn non-commercial.
- [ ] Official Warning Summarizer từ cơ quan chuyên môn, Service Interruption Detector và Incident Triage vào hàng chờ kiểm duyệt.
- [ ] Stress Test theo giờ thực, khoảng đệm tuyến, giờ mở cửa, bữa ăn và nghỉ; bộ tối ưu mới dùng matrix thời lượng/quãng đường, không có giờ mở cửa, giờ dừng, giao thông realtime hoặc tối ưu khoảng dừng.
- [x] AI Packing Assistant hiển thị checklist có thể tick từ Trip Studio; không phải chỉ dẫn thời tiết, quy định địa điểm, y tế hoặc bảo đảm tiếp cận. AI Guide tra cứu địa điểm với câu hỏi cố định, có nguồn đã triển khai; không phải chatbot prompt tự do.
- [ ] Thuyết minh/đọc giọng trình duyệt; TTS chưa triển khai.
- [ ] Operator Copilot gọi LLM để đọc brief/soạn chương trình; hiện có form báo giá thủ công, lưu nháp và duyệt trước chia sẻ.
- [x] Lưu, đổi tên, sao chép, xóa, chia sẻ/thu hồi và gửi yêu cầu cho trip.
- [x] Sửa trực tiếp thứ tự điểm dừng sau khi đã lưu trip; không giữ metric tuyến cũ sau khi đổi thứ tự.
- [x] Thêm regression FairPrice cho prompt injection trong quote và loại bỏ field không có exact evidence; giữ policy quote như untrusted data.
- [x] Rà mismatch Trip DNA, làm rõ taxonomy interests, hiệu chỉnh một nhãn development suy diễn và chạy lại development 358/358; khóa prompt rồi đo holdout một lần 176/180. Thêm regression privacy cho tọa độ DMS gửi model; smoke feature 24/24 là kiểm tra mẫu, không bảo đảm mọi câu trả lời luôn đúng.
- [x] Thêm AI Guide route regression cho giá hết hạn, giờ mâu thuẫn, ghi chú nguồn có câu lệnh injection được giữ là dữ liệu, và citation/status trả về khớp nguồn đã truy xuất.
- [x] AI Guide kiểm tra mọi đoạn trả lời là exact substring của citation; không còn cho model tạo phần diễn giải tự do. FairPrice giữ exact evidence cho từng field, kèm fixture prompt injection.
- [x] Bổ sung 10 fixture holdout riêng cho việc DeepSeek chọn đoạn theo intent giữa nhiều nguồn cạnh tranh; đạt 10/10 trong lượt live riêng. Cần tiếp tục mở rộng trước khi xem đây là độ đúng đại diện.
- [ ] Playwright E2E/kiểm thử RLS giữa khách A/B và doanh nghiệp A/B với hai project member thật.
- [x] Tự động audit axe WCAG 2.1 A/AA trên trang chủ VI/EN, khám phá, đăng ký, AI Guide EN và FairPrice VI; sửa contrast màu chữ phụ và accessible name locale switcher. Chromium sạch không còn vi phạm trong sáu trạng thái trang đã kiểm tra.
- [ ] Kiểm thử thủ công bằng bàn phím/đọc màn hình và thiết bị thật; audit tự động/responsive source không thay thế kiểm tra assistive technology trên thiết bị.
- [x] Thêm weather provider, 29 lượt dùng ảnh có license công khai và 14 lượt dùng ảnh người dùng xác nhận quyền trực tiếp cho đủ 35 hồ sơ yêu cầu ảnh; nhóm `community-cultural-experiences` được miễn ảnh và giữ artwork theo yêu cầu người dùng. 10/36 feature points, 0 cổng vào đã xác minh.
- [ ] Bổ sung credit/tác giả, ngày chụp và hồ sơ/phạm vi cấp quyền cho 14 ảnh người dùng nếu muốn provenance công khai đầy đủ. Nhóm cộng đồng không nằm trong backlog ảnh. Tiếp tục khảo sát OSM/cổng vào riêng biệt, không biến feature point thành cổng.
- [x] Lập [quy trình và danh sách ảnh](PHOTO_GAPS.md), phân biệt 10 địa điểm cụ thể với 4 nhóm trải nghiệm; tích hợp đủ 14 ảnh có quyền trực tiếp vào hồ sơ khớp nội dung. Nhóm nghề/ẩm thực vẫn dùng minh họa.
- [x] Rà soát tại [SERVICE_LIMITS.md](SERVICE_LIMITS.md) điều khoản và quota demo của Vercel, Supabase, Upstash, Open-Meteo, HeiGIT/ORS, OSM và DeepSeek ngày 16/10/2026. Đây chưa phải phê duyệt kinh doanh; hoàn tất các cổng thương mại trong tài liệu trước khi public có thu phí.

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
- [x] Nhận bộ ảnh và tích hợp 14/14 file vào đúng hồ sơ; `catalog:photo-gaps` xác nhận đủ ảnh cho 35 hồ sơ bắt buộc và báo riêng nhóm cộng đồng được miễn ảnh. Ảnh Bù Lạch gắn vào hồ sơ trảng cỏ.

## Kiểm tra tiếp tục — 15/10/2026

- [x] Thêm ba lối tắt AI ngay trong hero trang chủ để khách thấy planner, trợ lý thời tiết/an toàn/du lịch xanh và trợ lý giao thông/tuyến đường mà không cần cuộn tới danh mục.
- [x] Chạy lại live smoke lúc 17:51 ngày 15/10/2026: 4 file, 18 test đạt với `.env`; DeepSeek thật cho planner VI/EN, thời tiết/sự cố VI/EN và giải thích tuyến; Open-Meteo dự báo thật; OpenRouteService route thật trong test end-to-end. Session/Upstash vẫn mock. Các trang local `/vi`, `/en`, `/vi/ai/conditions`, `/vi/ai/routes` và `/vi/auth` trả 200, `/` chuyển 307 tới `/vi`.
- [x] Thêm `npm.cmd run catalog:check-photos` để kiểm tra URL ảnh bằng HEAD giới hạn hai kết nối; chạy live ngày 15/10/2026, 28/28 URL duy nhất trả image content-type. 29 lượt dùng ảnh trên 22/36 hồ sơ; 14 hồ sơ vẫn thiếu ảnh đúng địa điểm có license.
- [x] Chạy production build riêng ngày 15/10/2026 sau thay đổi script: Next.js build thành công, TypeScript đạt và sinh 40/40 route; dọn thư mục build tạm có kiểm tra đường dẫn, hoàn nguyên tham chiếu generated trong `tsconfig.json`/`next-env.d.ts`, rồi `npm.cmd run typecheck` đạt.
- [x] Chặn Journey planner tự định tuyến khi có điểm dừng chỉ là OSM feature/approximate; chỉ dùng ORS tự động nếu tất cả điểm dừng có `entrance_verified`. Bổ sung regression 2 ca, suite mới nhất đạt 49 passed/14 skipped; pin do khách chọn ở AI tuyến vẫn là tuyến pin-to-pin.
- [x] Làm mới audit dependency: production 0 vulnerability; toàn bộ audit còn 5 high trong toolchain phát triển do `braces <=3.0.3`, hiện advisory chưa có bản vá; ghi lại để theo dõi thay vì hạ Next 16 bằng `npm audit fix --force`.
- [x] Sửa assertion kiểm tra gallery Văn Miếu sau khi thêm ảnh cổng tư liệu thứ ba; toàn bộ suite mới nhất đạt 49 passed, 14 skipped; lint, typecheck và production build đạt (40/40 route).
- [x] Bổ sung ảnh do người dùng cấp quyền vào 13 hồ sơ phù hợp; chỉ còn 1/36 hồ sơ nhóm trải nghiệm chưa có ảnh phù hợp. Tọa độ cổng đã xác minh vẫn 0/36; OSM feature point không thay thế khảo sát cổng.
- [x] Rà soát giá Amazing Bay: FAQ Sơn Tiên nêu 270.000 ₫ vé trẻ em, hướng dẫn cổng bán vé amazingbay.vn (16/04/2026) nêu 279.000 ₫. Thêm `0025_amazing_bay_child_price_conflict_2026.sql`, lưu cả hai ở trạng thái `conflicting` và cảnh báo khách trước khi mua; không tính vào chi phí hiện hành.
- [x] Chạy riêng `plan-live-smoke` sau khi thêm cổng `entrance_verified`: DeepSeek thật từ `.env`, 2/2 test đạt; endpoint vẫn trả ba phương án từ catalog và không gửi OSM feature point sang định tuyến lái xe tự động.
- [x] Kiểm tra Chromium headless trên `localhost:3000`: `/` tới `/vi`, HTTP 200, đúng title và không có lỗi console/hydration. Cảnh báo ảnh chụp có `data-yd-*` không tái hiện khi không có extension; root layout đã bật `suppressHydrationWarning`.
- [x] Thêm bộ Playwright E2E cho điều hướng tới hai trợ lý mới, hiển thị ba luồng AI ở màn hình desktop/390px, trang chi tiết phân biệt giá và giờ nguồn chưa xác minh, số khẩn cấp không cần AI, bản đồ OpenStreetMap, biểu mẫu username/password và 401 khi gọi API AI chưa đăng nhập; local Chromium đạt 6/6, nối E2E vào GitHub Actions.
- [x] Rà lại trang bán vé chính thức Sơn Tiên: người lớn 490.000 ₫, trẻ em 270.000 ₫, vé trẻ 1 m–1 m 39 và giờ 09:00–17:00 hằng ngày. Thêm migration `0026_amazing_bay_operator_ticket_source_refresh.sql` cập nhật provenance; vẫn giữ 270.000/279.000 ₫ trẻ em ở trạng thái `conflicting`.
- [x] Chạy lại bộ AI smoke ngày 15/10/2026 lúc 18:46: 4 file, 18/18 đạt với DeepSeek thật từ `.env`, Open-Meteo thật và OpenRouteService thật trong smoke định tuyến đầy đủ; auth/Redis/ghi DB vẫn là mock. Chạy lại Chromium clean đạt 4/4, unit 49 passed/14 skipped, lint, typecheck và production build 40/40 route.
- [x] Probe dịch vụ ngày 15/10/2026 lúc 18:48: Upstash REST `PING` trả HTTP 200/PONG; Supabase REST đọc bảng `places` trả HTTP 404/PGRST205, nên chưa thể test thật auth, profile, trip hoặc RLS cho tới khi schema được áp dụng.
- [x] Chạy lại `npm.cmd run catalog:check-photos` lúc 18:50: 28 URL ảnh đang dùng đều trả response ảnh; kết quả chỉ xác nhận URL hoạt động, không xác nhận license hoặc ảnh vẫn đúng hiện trạng.
- [x] Mở rộng Playwright home check sang viewport 390px, xác nhận lối tắt AI lập kế hoạch, thời tiết/an toàn/xanh, giao thông/tuyến và hai thẻ trợ lý; suite đạt 6/6 lúc 18:56 sau khi thêm kiểm tra trang chi tiết Bửu Long.
- [ ] Tạo tài khoản test riêng sau khi schema đã hiện diện, rồi kiểm chứng đăng ký/email confirmation, username-login, lưu trip, RLS giữa A/B và quota Redis thật. Probe hiện thấy bảng/36 địa điểm nhưng không thay cho kiểm tra quyền ghi/đọc có xác thực; không chạy lại bundle toàn bộ trên database đang có dữ liệu.

## Nguồn cập nhật Suối Mơ và kiểm tra provider — 15/10/2026

- [x] Đối chiếu trang chính thức Suối Mơ: 08:00–17:00 áp dụng cho các hoạt động vui chơi, hồ bơi thiên nhiên và team building; nguồn không xác nhận giờ mở cổng/toàn khu hoặc ngoại lệ theo ngày. Thêm migration `0027_suoi_mo_operator_activity_hours.sql`, vẫn để `unknown`; giờ 07:30–17:00 cũ của danh bạ được giữ lịch sử.
- [x] Cập nhật fallback offline và regression test để phân biệt giờ hoạt động do nhà vận hành nêu với giờ mở cổng chưa xác nhận.
- [x] Chạy lại 4 file live smoke từ `.env` lúc 19:02–19:03: 10 DeepSeek/parser/weather/incident/route-schema, 4 API handler, 2 ORS→DeepSeek full route và 2 planner; tổng 18/18 đạt. Auth, Upstash limiter và ghi DB trong smoke vẫn mock.
- [x] Probe chỉ đọc lúc 19:05: Upstash PING 200/PONG; Supabase `places` trả 404/PGRST205, xác nhận migrations chưa được áp dụng vào project.
- [x] Đối chiếu PDF bảng giá chính thức Suối Mơ 2026: 130.000/150.000 ₫ người lớn ngày thường/Lễ Tết, 60.000/70.000 ₫ trẻ cao 1–1,4 m, trẻ dưới 1 m miễn phí; áp dụng từ 01/01/2026 đến khi thay thế. Migration `0028_suoi_mo_2026_operator_prices.sql` giữ bảng 2025 ở trạng thái historical và thêm 5 giá 2026.
- [x] Thêm regression giá Suối Mơ; `catalog-data.test.ts` đạt 10/10; ESLint cho module/test và TypeScript `--noEmit --incremental false` đạt.
- [x] Full validation sau cập nhật: `npm.cmd test -- --maxWorkers=1` đạt 50 passed/14 skipped; `npm.cmd run lint`, `npx.cmd tsc --noEmit --incremental false` và production build đạt (40/40 route). Build tạm đã dọn và `tsconfig.json`/`next-env.d.ts` được hoàn nguyên.
- [ ] Tiếp tục xác minh ảnh có license, cổng vào, giá hiện hành và giờ theo phạm vi rõ ràng; không nâng các giá/giờ thiếu xác nhận thành dữ liệu hiện hành.

## Đối chiếu thêm giá dịch vụ VQG Cát Tiên — 15/10/2026

- [x] Mở trực tiếp PDF khách nội địa trên website VQG: bảng ghi hiệu lực từ 01/06/2024 đến khi có bảng thay thế, vé vào gồm một lượt phà vào/đón về; có giá riêng cho bảo tàng/trung tâm cứu hộ, tour Đảo Tiên và Bàu Sấu.
- [x] Thêm migration `0029_cat_tien_2025_operator_price_refresh.sql` cùng dữ liệu fallback; giữ khoản hướng dẫn viên Bàu Sấu ở `unknown` vì nguồn công bố một khoảng giá 550.000–650.000 ₫.
- [x] Ghi khung giờ bắt đầu của dịch vụ/tour trong điều kiện giá; không chuyển chúng thành giờ mở cửa toàn Vườn.
- [x] Regression `catalog-server.test.ts` đạt 6/6; full `npm.cmd test -- --maxWorkers=1` đạt 52 passed/14 skipped; `npm.cmd run lint` và `npx.cmd tsc --noEmit --incremental false` đạt.
- [x] Production build Next.js đạt, biên dịch 40/40 route; dọn riêng build output tạm và hoàn nguyên reference do Next tự ghi vào `next-env.d.ts`/`tsconfig.json`.
- [x] Chạy lại 4 file live smoke bằng key/model cấu hình trong `.env`: 18/18 pass lúc 19:18; chạy lại Playwright E2E 6/6 lúc 19:20. E2E xác nhận luồng giao diện và 401, không phải auth provider thật.
- [x] Bổ sung bằng chứng cổng Amazing Bay từ trang vị trí chính thức nhưng không nâng tọa độ map center/pin feature thành tọa độ cổng; cập nhật E2E trang Cát Tiên kiểm tra giá Bàu Sấu và khoảng giá guide; Playwright hiện đạt 7/7.
- [x] Thêm 14 minh họa SVG theo từng chủ đề cho hồ sơ chưa có ảnh license; card và trang chi tiết gắn nhãn rõ đây không phải ảnh thực địa. Regression kiểm tra đủ ID còn thiếu; ảnh chụp có nguồn vẫn được giữ nguyên.
- [x] Sau artwork: full unit suite 53 passed/14 skipped; Playwright E2E 8/8; lint, typecheck và production build 40/40 route đều đạt. Build output tạm đã dọn, reference do Next tự cập nhật trong `next-env.d.ts` và `tsconfig.json` đã hoàn nguyên.
- [x] Probe chỉ đọc lại schema hiện thời: Auth settings và các bảng `places`, `profiles.username`, `trips`, `trip_shares`, `ai_usage`, `price_references`, `place_media` đều trả HTTP 200; `places` có 36 dòng. Cần kiểm chứng tài khoản/RLS riêng, không suy ra quyền ghi từ HTTP 200.

## Tiến độ tiếp tục — 15/10/2026

- [x] Thêm migration `0030_da_han_third_party_price_and_hours.sql`, fallback offline và ghi chú song ngữ cho Thác Đá Hàn; tiếp đó thêm `0031_da_han_schedule_and_price_source_conflicts.sql` với lịch 07:00–17:00 do Vietnam Airlines nêu bên cạnh lịch 07:00–19:00 của Vietgoing. Giữ hai lịch ở trạng thái chưa xác minh/mâu thuẫn, giá `amount_vnd = null`; regression test xác nhận cả hai nguồn.
- [x] Xác minh lại sau migration 0031: unit 54 passed/14 skipped, Playwright toàn bộ 10/10 (gồm cả hai lịch Đá Hàn), lint, TypeScript và production build Next.js đạt 40/40 route. Build dist riêng đã dọn, `next-env.d.ts` và `tsconfig.json` được hoàn nguyên.
- [x] Chạy lại 4 bộ live smoke với cấu hình trong `.env`: 18/18 đạt cho DeepSeek thật, Open-Meteo thật và OpenRouteService thật. Auth, Upstash quota và ghi DB vẫn mock; chưa chứng minh Supabase Auth/RLS hoặc Redis limiter thật.
- [x] Nhận 13 ảnh có quyền trực tiếp và gắn đúng 13 hồ sơ; 1 ảnh Bù Lạch không phù hợp nhóm trải nghiệm cộng đồng nên tiếp tục dùng minh họa. Tọa độ cổng đã xác minh vẫn 0/36.
- [ ] Xác nhận migration set hiện hành trên Supabase qua SQL Editor rồi kiểm thử đăng ký/đăng nhập, dữ liệu trips và RLS giữa hai tài khoản/tổ chức; probe REST đã thấy schema và dữ liệu công khai, nhưng không chứng minh mọi constraint/migration hoặc quyền theo người dùng.

## Nguồn giờ và giá dịch vụ Giang Điền — 15/10/2026

- [x] Thêm migration `0032_giang_dien_operator_services.sql`, fallback offline và tài liệu `docs/GIANG_DIEN_SERVICES.md` cho giờ Nhà hàng Hoa Sứ/Hoàng Yến và thông tin đón khách của Khách sạn Tre Xanh; không coi giờ dịch vụ con là giờ mở cổng.
- [x] Lưu giá Khách sạn Tre Xanh 550.000 ₫ theo trang sản phẩm ở trạng thái `unknown` do thiếu đơn vị tính, sức chứa và thời hạn khuyến mãi; không cộng vào tổng chi phí.
- [x] Regression unit 56 passed/14 skipped, Playwright 11/11, lint, typecheck và production build 40/40 route đạt; unit test còn kiểm tra nguồn liên hệ nhà vận hành.
- [ ] Áp dụng migration 0032 lên Supabase thật; kiểm tra schema/bản ghi public sau migration.
- [x] (Trạng thái ngày 15/10, trước khi nhận ảnh còn lại) 13 ảnh có quyền trực tiếp được tích hợp; nhóm cộng đồng dùng minh họa. Hiện nhóm này được miễn ảnh theo yêu cầu người dùng. Tọa độ cổng đã xác minh vẫn 0/36.

## Xác minh lại các luồng AI bằng provider thật — 15/10/2026

- [x] Chạy đủ 4 file live smoke với `.env` lúc 20:19 (Asia/Ho_Chi_Minh): **18/18 passed** cho DeepSeek thật (Trip DNA VI/EN, Journey Studio, weather/safety/green VI/EN, route advice VI/EN), Open-Meteo forecast thật và OpenRouteService directions/geometry thật.
- [x] Kiểm tra redirect `/` và trang `/vi` sau cảnh báo hydration: 2/2 Playwright E2E đạt; test hydration mô phỏng hai thuộc tính `data-yd-*` do extension thêm.
- [x] Kiểm tra username/password ở mức endpoint: 4/4 unit test đạt (đầu vào sai, fail-closed khi thiếu Upstash, lỗi thông tin đăng nhập đồng nhất, tạo SSR session); E2E xác nhận form đăng ký được tìm thấy và API AI từ chối khách chưa đăng nhập (2/2). Đây vẫn là kiểm thử với provider mock, không thay cho Supabase Auth thật.
- [x] Rà lại trang `buulong.com.vn/ban-do-kdl-buu-long`: trang tự ghi nội dung được viết bằng AI và có liên kết quảng bá không liên quan; giờ 07:00–17:00, nghỉ thứ Ba chỉ được xem là đầu mối tham khảo, chưa nâng thành giờ đã xác minh và không dùng trang này để suy ra tọa độ cổng.
- [x] Đọc OSM API trực tiếp cho way Bửu Long `972604563`: tag `opening_hours=Mo,We-Su 07:00-17:00, Tu off` trùng lịch báo chí; 129 node ranh giới không có node gắn `entrance`/`barrier`. Thêm nguồn OSM song ngữ vào trang địa điểm nhưng giữ lịch `unknown` và tọa độ `venue_feature`; regression 12/12 và E2E Bửu Long 1/1 đạt.
- [x] Rà 6 way OSM đang dùng cho địa điểm: node duy nhất được gắn `barrier=gate` là ứng viên Mã Đà `9784252674` (11.1115345, 107.0519628), đồng thời nằm trên way cơ quan và các way hàng rào. Thêm ghi chú song ngữ và liên kết node để khảo sát, nhưng không thay pin trung tâm khu bảo tồn hoặc đánh dấu cổng đón khách; unit 12/12, E2E ứng viên Mã Đà 1/1 đạt.
- [x] Kiểm tra lại sau thay đổi OSM: full unit/integration 56 passed/14 skipped, E2E liên quan 1/1, lint/typecheck và production build 40/40 route đều đạt; output build tạm đã dọn.
- [x] Xác minh toàn repository 20:25–20:27: unit/integration 56 passed/14 skipped, Playwright E2E 11/11, lint, typecheck và production build 40/40 route đều đạt; build output tạm đã dọn, file cấu hình Next được khôi phục.
- [x] Probe chỉ đọc 20:28: Upstash REST `PING` 200/PONG; Supabase `places` 404/PGRST205. Không ghi dữ liệu; cần áp migrations 0001–0034 vào project để xác minh các bảng/Auth/RLS.
- [ ] Auth, Upstash rate limit và lưu/đọc dữ liệu Supabase vẫn chưa được chứng minh bằng luồng provider thật; test AI handler cô lập các phần này. Cần áp migrations 0001–0034, cấu hình dịch vụ và chạy kiểm thử tài khoản/RLS A/B.
- [x] 13 ảnh người dùng cấp quyền đã được thêm; 1 nhóm trải nghiệm cộng đồng còn minh họa. Tọa độ cổng vào đã xác minh vẫn 0/36; không nâng pin OSM thành cổng.

### Xác minh tiếp theo sau phiên rà soát người dùng — 15/10/2026

- [x] Chạy lại đủ bốn file AI live smoke với năm cờ opt-in và `.env`: **18/18 passed**. DeepSeek thật xử lý planner, tư vấn thời tiết/sự cố và giải thích tuyến; Open-Meteo dự báo thật; OpenRouteService định tuyến thật. Handler dùng session/Upstash/ghi DB cô lập, không chứng minh auth, quota hay lưu dữ liệu thật.
- [x] Chạy `npm.cmd run catalog:photo-gaps`: catalog có ảnh nguồn ở 22/36 hồ sơ, còn 14 thiếu; `npm.cmd run catalog:check-photos`: 28/28 URL ảnh đang dùng trả response ảnh. Hai kết quả này không thay thế xác minh license/đúng địa điểm, và không làm thay đổi số ảnh đã duyệt.
- [x] Thêm CTA song ngữ từ bản đồ khám phá tới AI route assistant, nêu rõ cần chọn 2–8 điểm và pin catalog chưa phải cổng vào. E2E toàn bộ đạt 13/13; unit/integration 56 passed/14 skipped; lint, TypeScript và production build Next.js đạt, build sinh 40/40 route.
- [x] Thêm `npm.cmd run services:probe` để kiểm tra Supabase Auth settings, schema `public.places` và Upstash PING mà không in secrets hoặc ghi dữ liệu; probe hiện tại xác nhận Upstash PONG, Supabase `places` vẫn HTTP 404.
- [x] Đối chiếu lại [trang Combo 3 Sàn B của nhà vận hành](https://giangdien.vn/san-pham/leu-san-b-combo3/) ngày 15/10/2026; đổi fallback khỏi ảnh bảng giá 2024 sang trang sản phẩm, giữ 599.000 ₫ ở `unknown` vì thiếu đơn vị, sức chứa và hạn ưu đãi; thêm migration `0033`, unit/E2E regression và hướng dẫn kiểm tra.
- [ ] Áp dụng bundle mới nhất/migrations đến `0034_ai_packing_usage_feature.sql` lên Supabase thật; sau đó kiểm tra giá Combo 3 không tham gia tổng chi phí và AI packing ghi usage đúng feature.
- [x] Xác minh lại live AI ngày 15/10/2026 lúc 21:05 (Asia/Ho_Chi_Minh): bốn smoke file, **18/18 passed** với DeepSeek thật, Open-Meteo và OpenRouteService. Unit/integration dùng `--configLoader native --pool=threads`: **56 passed/14 skipped**; lint và typecheck không incremental đạt; SSR `/en/places/giang-dien-waterfall` trả 200 và có giá 599.000 ₫/URL nguồn/nhãn `Unconfirmed`.
- [x] Lần chạy E2E/build trước bị `spawn EPERM`; đã chạy lại ở môi trường cho phép sau đó và đạt 14/14 E2E cùng 40/40 route production build, ghi bằng chứng chi tiết bên dưới.

### Kiểm tra lại theo phản hồi về lối vào AI/auth và hướng dẫn dịch vụ — 15/10/2026

- [x] Đối chiếu dòng 507 và 549 của tài liệu ý tưởng: AI tuyến có ở `/vi/ai/routes`; AI thời tiết/an toàn/xanh có ở `/vi/ai/conditions`. Trang chủ có ba CTA song ngữ trong hero, liên kết khám phá bản đồ tới trợ lý tuyến và nav hỗ trợ mobile; không cần LangChain/vector RAG cho catalog có cấu trúc hiện tại. Retrieval lấy dữ liệu từ provider/catalog có nguồn, phép tính tuyến/giá và xác thực do server xử lý.
- [x] Kiểm tra route local: `/` chuyển tới `/vi`; `/vi`, `/vi/ai/conditions`, `/vi/ai/routes`, `/vi/auth`, và các trang EN tương ứng đều trả HTTP 200.
- [x] Chạy lại bốn bộ live smoke bằng năm cờ opt-in và cấu hình `.env`: **18/18 passed**. DeepSeek thật chạy planner VI/EN, weather/safety/green VI/EN, route advice và giải thích itinerary; Open-Meteo lấy forecast thật; OpenRouteService trả geometry tuyến. Session Supabase, Redis quota và ghi DB trong handler smoke vẫn được mock.
- [x] Chạy unit/integration `npm.cmd test -- --configLoader native --pool=threads`: **56 passed / 14 skipped**; `npm.cmd run lint` và `npm.cmd run typecheck -- --incremental false` đạt.
- [x] Chạy Playwright toàn bộ: **14/14 passed**, gồm CTA ba tính năng trên viewport 390px, trang chi tiết có nhãn độ tin cậy, hotline khẩn cấp bypass AI, bản đồ/trợ lý tuyến, form username/password và chặn API cho khách chưa đăng nhập.
- [x] Production build Next.js 16.4.1 đạt, biên dịch và sinh **40/40** route/API. Dùng output `.next-objective-audit-20261015` riêng; khôi phục `tsconfig.json`/`next-env.d.ts` và dọn output tạm trong workspace.
- [x] Thêm [docs/THIET_LAP_DICH_VU.md](THIET_LAP_DICH_VU.md) với đường dẫn dashboard, các bước Supabase/Upstash/DeepSeek/ORS, bảng biến môi trường, GitHub → Vercel, smoke test và giới hạn gói; liên kết từ README và hướng dẫn chính.
- [x] Probe đọc-only: Supabase Auth settings HTTP 200, Upstash Redis HTTP 200/PONG; `public.places` vẫn HTTP 404/PGRST205. Chưa áp migrations lên project Supabase, nên Auth/username thật, lưu dữ liệu, RLS A/B và limiter thật **chưa kiểm chứng**.
- [x] 13/14 ảnh đầu vào đã có bản triển khai và hồ sơ catalog khớp hash; 1 ảnh Bù Lạch không phù hợp nhóm nghề/ẩm thực. [PHOTO_GAPS.md](PHOTO_GAPS.md) ghi quy trình provenance; 0/36 cổng vào đã xác minh vẫn là việc cần nguồn/khảo sát riêng.
