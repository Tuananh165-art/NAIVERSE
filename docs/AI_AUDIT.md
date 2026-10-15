# Kiểm toán AI NaiVerse

## Phạm vi và kết luận

Rà soát repository và provider thật ngày 16/10/2026. Mọi lời gọi mô hình của ứng dụng đi qua server và DeepSeek Chat Completions; model lấy từ `DEEPSEEK_MODEL` (mặc định `deepseek-v4-flash`), key không đưa xuống client. JSON đầu ra được kiểm tra bằng Zod, có tối đa một lần sửa schema, timeout và giới hạn output. Không có LangChain, vector database hoặc nhà cung cấp LLM thứ hai.

Trong smoke thật, 20/22 test của lượt tổng hợp đầu tiên đạt; hai ca thời tiết nhận HTTP 503. Chạy lại riêng luồng Weather VI/EN ngay sau đó đạt 2/2; các luồng AI còn lại đã đạt trong lượt tổng hợp. Bộ đánh giá Trip DNA có 60 case (40 development, 20 holdout; 30 Việt/30 Anh). Sau khi bổ sung transport `bicycle` và đặt temperature 0 cho parser, lần đo mới nhất đạt 353/358 trường development (**98,6%**, 40 prompt) và 173/180 holdout (**96,1%**, 20 prompt), trên ngưỡng 90% cho từng mẫu. Các điểm số này chỉ mô tả bộ câu hỏi hiện có, không đại diện mọi yêu cầu thực tế; mismatch thay đổi giữa lần chạy, do đó không xem một lần đo là bảo đảm ổn định. Auth, quota Redis và ghi/đọc Supabase trong handler smoke dùng mock.

## Ma trận tính năng

| Tính năng | DeepSeek làm gì | Logic/dữ liệu do ứng dụng giữ | Trạng thái và giới hạn |
|---|---|---|---|
| Trip DNA / Journey Studio | Trích số ngày, nhóm khách, ngân sách, sở thích, phương tiện, điều kiện gia đình từ mô tả | Kiểm tra schema; chọn điểm từ catalog; tạo tối đa ba phương án; tính chi phí, cảnh báo và eligibility bằng code | Smoke VI/EN và endpoint kế hoạch thật đạt. Đây chưa phải timeline theo giờ: chưa lập thời lượng dừng, bữa ăn hoặc bảo đảm kịp giờ mở cửa. |
| Weather Brief / Rain Plan / an toàn / du lịch xanh | Tóm tắt forecast vùng, gợi ý chuẩn bị, xử lý sự cố không khẩn cấp | Open-Meteo cung cấp forecast; logic nhận diện nguy hiểm tức thời chuyển thẳng sang hướng dẫn/số liên hệ, không chờ AI | Smoke VI/EN đạt sau lần chạy lại Weather 2/2; dữ liệu dự báo ngoài cửa sổ không được bịa. Đây không phải cảnh báo chính thức, chẩn đoán y tế hoặc xác nhận điểm đang mở. |
| So sánh tuyến | Giải thích đánh đổi nhanh nhất/ngắn nhất từ metric được cung cấp | OpenRouteService tạo matrix, thứ tự waypoint và geometry; tọa độ không gửi cho model | Smoke tuyến bản đồ→ORS→DeepSeek đạt. Không có giao thông realtime, transit, đóng đường, giờ mở cửa hoặc thời lượng tham quan; pin không mặc định là cổng vào. |
| AI Guide VI/EN | Viết câu trả lời ngắn từ tài liệu đã truy xuất và chọn citation ID | Câu hỏi chọn sẵn; retrieval từ catalog; server chỉ trả citation nằm trong tập nguồn | Smoke VI/EN đạt. Đây là retrieval có cấu trúc/lexical, không phải chatbot tự do hay vector RAG; dữ liệu gốc vẫn giới hạn. |
| AI Packing Assistant | Chọn mã món và mức ưu tiên trong danh sách đã cho | Code giới hạn mã/lý do; nhãn, chi tiết và disclaimer song ngữ là copy tĩnh | Smoke VI/EN đạt. Checklist chung, không phải forecast, quy định của cơ sở, tư vấn y tế hoặc bảo đảm tiếp cận. |
| FairPrice Lens | Trích các trường trong đoạn báo giá người dùng dán; gợi ý ID giá catalog có thể liên quan | Đăng nhập, consent, Upstash, Zod, kiểm tra đoạn trích exact-substring; chỉ giữ field đúng bằng chứng, giá tham khảo hiển thị riêng kèm nguồn/trạng thái | UI/route VI/EN và live DeepSeek fixture đạt 2/2; không upload, không lưu nội dung, không chấm giá tốt/xấu, không xác nhận nhà cung cấp/booking. Chưa có live test xuyên suốt Supabase + Redis + DeepSeek; mọi so sánh cần người dùng xác nhận. |
| Operator Copilot | Chưa có luồng LLM | Nhân viên có thể nhập báo giá thủ công, lưu nháp và duyệt trước khi gửi | Chưa hoàn thành; không trình diễn như AI đã hoạt động. Cần đối tác thật và quy trình duyệt rõ trước khi xây. |
| Thuyết minh/TTS | Chưa gọi mô hình | Trình duyệt có thể hỗ trợ Web Speech ở bước sau | Chưa hoàn thành; không cần thêm API trả phí cho bản TTS cơ bản. |

## Privacy và độ tin cậy

- Consent, đăng nhập và hạn mức Upstash được kiểm tra ở API trước khi gọi model; khi thiếu Redis, AI fail-closed. Smoke handler không dùng tài khoản/Redis thật.
- Trước khi serialize đầu vào gửi DeepSeek, ứng dụng che email, số điện thoại và cặp tọa độ trong text; loại bỏ các field tọa độ (`latitude`, `longitude`, `lat`, `lng`, `coordinates`, `gps`). Regression kiểm tra payload HTTP gửi đi cho Trip DNA và AI dạng JSON.
- Tên tự nhập trong mô tả chưa được nhận diện/loại bỏ tổng quát. UI nên nhắc người dùng không nhập tên, số giấy tờ hoặc ghi chú nhạy cảm khi không cần.
- DeepSeek chỉ được gọi từ server tại host API chính thức. Các API thời tiết/định tuyến là nguồn dữ liệu, không phải model LLM thay thế.
- LLM không làm phép cộng giá, xác nhận vé/booking, tạo pin hoặc xác minh giờ. Giá chưa rõ vẫn `unknown`; thời gian tuyến đến từ ORS, không từ model.

## Đánh giá và hướng cải tiến

22 smoke case thật đã đi qua Trip DNA VI/EN, planner, thời tiết/an toàn/route assistant, route ORS, Guide và Packing. Hai ca thời tiết gặp 503 trong lượt tổng hợp nhưng đạt 2/2 khi chạy lại riêng. FairPrice fixture quote VI/EN riêng đạt 2/2 với DeepSeek thật; đây chỉ kiểm tra trích xuất/schema, không đi qua Supabase Auth, Redis hoặc lưu usage thật. Sau khi thêm `bicycle` vào schema Trip DNA, form Journey Studio và packing input, development đạt 353/358 expected fields (98,6%) trên 40 prompt; năm mismatch của lần đo mới nhất là `vi-development-11.interests`, `vi-development-20.interests`, `en-development-11.interests`, `en-development-17.interests`, `en-development-20.interests`. Temperature 0 được gửi riêng cho parser. Holdout sau thay đổi đạt 173/180 (96,1%) trên 20 prompt; bảy mismatch của lần đo mới nhất là `vi-holdout-03.interests`, `vi-holdout-06.transport`, `vi-holdout-09.rainyDay`, `vi-holdout-10.interests`, `en-holdout-02.transport`, `en-holdout-10.lowMobility`, `en-holdout-10.interests`. Các prompt có thể đóng góp số trường khác nhau; interests/regions được tính là khớp nếu chứa các nhãn mong đợi. Mismatch dao động giữa lần chạy cùng bộ; đây là đánh giá trích xuất có giới hạn, không chấm độ đúng về giờ/giá/hoạt động ngoài catalog hoặc chất lượng tư vấn toàn diện.

Ưu tiên tiếp theo:

1. Dùng 40 prompt development để cải thiện Trip DNA; không điều chỉnh dựa trên 20 holdout hiện tại. Bổ sung ca adversarial và các kiểm tra không bịa nguồn/giá/giờ, privacy, độ trễ và lỗi provider rồi đánh giá lại heldout. Công bố tỷ lệ đo thực tế, không đặt trước kết quả.
2. Giữ Guide ở dạng chọn intent + retrieval có nguồn. Catalog 36 hồ sơ chưa cần LangChain/vector store; lexical/structured retrieval đơn giản hơn để truy vết, dễ chạy rẻ và hạn chế câu trả lời ngoài dữ liệu.
3. Hoàn thiện Stress Test lịch trình bằng phép tính xác định sau khi có dữ liệu thời lượng dừng, giờ hoạt động và buffer tuyến đủ tin cậy; DeepSeek chỉ giải thích cảnh báo, không tự chấm tính khả thi.
4. Bổ sung test adversarial cho FairPrice (prompt injection trong báo giá, field không có trong bằng chứng, nguồn giá hết hạn/mâu thuẫn) và xác nhận live sau khi Supabase schema đã áp dụng.
5. Chỉ làm Operator Copilot khi có đối tác/nhân viên thử nghiệm; mọi phản hồi/báo giá vẫn phải được con người duyệt.

## Lặp lại live smoke

Chạy trong PowerShell sau khi `.env` đã cấu hình DeepSeek và các provider cần thiết. Lệnh gọi model/provider thật và có thể phát sinh chi phí; không dùng dữ liệu cá nhân:

```powershell
$env:RUN_LIVE_AI_SMOKE='true'
$env:RUN_LIVE_ROUTE_SMOKE='true'
$env:RUN_LIVE_AI_HANDLERS_SMOKE='true'
$env:RUN_LIVE_AI_PLAN_SMOKE='true'
$env:RUN_LIVE_AI_FULL_ROUTE_SMOKE='true'
$env:RUN_LIVE_AI_GUIDE_SMOKE='true'
$env:RUN_LIVE_AI_PACKING_SMOKE='true'
npm.cmd test -- --maxWorkers=1 src/lib/ai-live-smoke.test.ts src/lib/ai-handler-live-smoke.test.ts src/lib/plan-live-smoke.test.ts src/lib/route-assist-live-smoke.test.ts src/lib/guide-live-smoke.test.ts src/lib/packing-live-smoke.test.ts
$env:RUN_LIVE_AI_FAIR_PRICE_SMOKE = 'true'
npm.cmd test -- --maxWorkers=1 src/lib/fair-price-live-smoke.test.ts
Remove-Item Env:\RUN_LIVE_AI_FAIR_PRICE_SMOKE -ErrorAction SilentlyContinue
Remove-Item Env:\RUN_LIVE_AI_SMOKE,Env:\RUN_LIVE_ROUTE_SMOKE,Env:\RUN_LIVE_AI_HANDLERS_SMOKE,Env:\RUN_LIVE_AI_PLAN_SMOKE,Env:\RUN_LIVE_AI_FULL_ROUTE_SMOKE,Env:\RUN_LIVE_AI_GUIDE_SMOKE,Env:\RUN_LIVE_AI_PACKING_SMOKE -ErrorAction SilentlyContinue
```

Kết quả mới nhất của Trip DNA holdout: 173/180 (96,1%). Đoạn đầu gọi model 20 lần; phần smoke feature gọi model/provider thật, còn Auth/Redis/DB trong handler vẫn mock. Ghi kèm ca retry thời tiết và trạng thái tích hợp; đừng dùng các pass này làm bằng chứng deployment hoặc RLS production.

Mặc định, evaluator chạy holdout trên dữ liệu giả lập (20 request DeepSeek, có thể phát sinh chi phí). Để đo 40 prompt development, đặt thêm `RUN_LIVE_AI_TRIP_DNA_SPLIT=development`. Parser dùng `temperature: 0` để giảm ngẫu nhiên; không bảo đảm các lần chạy giống hệt nhau.

    $env:RUN_LIVE_AI_TRIP_DNA_EVAL = 'true'
    npm.cmd test -- --maxWorkers=1 src/lib/trip-dna-live-eval.test.ts -t 'meets the 90%'
    Remove-Item Env:\RUN_LIVE_AI_TRIP_DNA_EVAL -ErrorAction SilentlyContinue

Với development, đặt biến split trước lệnh test và gỡ cả hai biến sau đó. Evaluator chỉ in số field đúng và ID mismatch; chỉ chạy sau khi cấu hình DeepSeek. Không dùng 20 holdout để tinh chỉnh prompt hoặc parser.
