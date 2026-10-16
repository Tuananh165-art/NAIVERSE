# Kiểm toán AI NaiVerse

## Phạm vi và kết luận

Rà soát repository và provider thật ngày 16/10/2026. Mọi lời gọi mô hình của ứng dụng đi qua server và DeepSeek Chat Completions; `.env` đang chọn `deepseek-v4-flash`, key không đưa xuống client. JSON đầu ra được kiểm tra bằng Zod, có tối đa một lần sửa schema, timeout và giới hạn output. Không có LangChain, vector database hoặc nhà cung cấp LLM thứ hai.

Live smoke mới nhất ngày **16/10/2026** đạt **30/30 trên 7 file** với DeepSeek/Open-Meteo/ORS thật. Coverage gồm Trip DNA VI/EN, ngày tương đối và yêu cầu chỉ có tháng, Journey Studio, weather, incident không khẩn cấp qua API VI/EN, nhánh emergency không gọi AI, route assistant, Guide, Packing và FairPrice VI/EN với prompt injection. Smoke handler mock Supabase session, Upstash limiter và ghi DB; vì vậy chưa chứng minh AI chạy end-to-end với Auth/Redis/Supabase thật. Trong lần tổng hợp đầu, model chọn trích dẫn FairPrice chỉ chứa giá vé nhưng gán thêm điều kiện xe đưa đón, và một đáp án sự cố tiếng Việt vượt giới hạn độ dài. Prompt đã được làm rõ về evidence span và câu trả lời ngắn; sau đó bộ tổng hợp đạt 30/30. API FairPrice vốn đã lọc field không được evidence hỗ trợ và đưa chúng vào missing fields. Đầu ra LLM vẫn có thể biến thiên, nên kết quả smoke không chứng minh mọi prompt đúng.

Bộ đánh giá Trip DNA có 60 case (40 development, 20 holdout; 30 Việt/30 Anh). Development đạt **358/358** trường. Regression re-run trên holdout đạt **177/180 (98,3%)**; ba mismatch: `vi-holdout-09.rainyDay`, `en-holdout-02.transport`, `en-holdout-10.lowMobility`. Không tiếp tục tinh chỉnh bằng holdout. Guide adversarial đạt **10/10 development và 10/10 holdout** trong hai lượt riêng, mỗi lượt chỉ 10 fixture. Các kết quả này mô tả mẫu nhỏ, không đại diện mọi yêu cầu thực tế hoặc bảo đảm lần gọi sau giống hệt.

**Kết luận theo phạm vi:** sáu nhóm AI đã được tích hợp (Trip DNA/Journey Studio, thời tiết–sự cố, route assistant, Guide có nguồn, Packing và FairPrice) và các smoke provider hiện tại đạt. Điều đó không có nghĩa mọi đầu ra luôn đúng: Trip DNA còn 3 mismatch trên 180 field holdout, FairPrice vẫn phụ thuộc độ chính xác của trích đoạn nhưng API lọc field ngoài evidence, và các bài handler thật chưa dùng Auth/Redis/DB thật. RAG hỏi tự do, Operator Copilot, TTS và Stress Test theo timeline chưa triển khai; không đưa các mục này vào tiêu chí “đã chạy”. Repo hiện có unit/integration **116 passed, 47 skipped**, ESLint, typecheck, Playwright **22/22** và production build Next.js đạt ngày 16/10/2026.

## Ma trận tính năng

| Tính năng | DeepSeek làm gì | Logic/dữ liệu do ứng dụng giữ | Trạng thái và giới hạn |
|---|---|---|---|
| Trip DNA / Journey Studio | Trích số ngày, nhóm khách, ngày đi, ngân sách, sở thích, phương tiện, điều kiện gia đình từ mô tả | Kiểm tra schema; gửi ngày hiện tại `Asia/Ho_Chi_Minh` để phân giải ngày tương đối rõ ràng; chọn điểm từ catalog; tạo tối đa ba phương án; tính chi phí, cảnh báo và eligibility bằng code | Smoke VI/EN và endpoint kế hoạch thật đạt; ngày “ngày mai/tomorrow” được phân giải đúng, hai ca chỉ nêu tháng để `travelDate=null` và yêu cầu làm rõ. JSON/schema không hợp lệ được thử lại tối đa một lần; nếu DeepSeek báo `finish_reason=length`, lần thử lại tăng `max_tokens` từ 1.400 lên tối đa 2.400. Đây chưa phải timeline theo giờ: chưa lập thời lượng dừng, bữa ăn hoặc bảo đảm kịp giờ mở cửa. |
| Weather Brief / Rain Plan / an toàn / du lịch xanh | Tóm tắt forecast vùng, gợi ý chuẩn bị, xử lý sự cố không khẩn cấp | Open-Meteo cung cấp forecast; logic nhận diện nguy hiểm tức thời chuyển thẳng sang hướng dẫn/số liên hệ, không chờ AI | Live smoke VI/EN cho forecast và incident endpoint đạt; giới hạn prompt bước/ý ở 160 ký tự để giảm lỗi schema (schema cứng là 220). Ngày ngoài cửa sổ forecast không được bịa. Đây không phải cảnh báo chính thức, chẩn đoán y tế hoặc xác nhận điểm đang mở. Rain Plan hiện là gợi ý indoorAlternative trong weather brief, chưa tự cập nhật một itinerary nhiều ngày theo forecast. |
| So sánh tuyến | Giải thích đánh đổi nhanh nhất/ngắn nhất từ metric được cung cấp | OpenRouteService tạo matrix, thứ tự waypoint và geometry; tọa độ không gửi cho model | Smoke tuyến bản đồ→ORS→DeepSeek đạt. Không có giao thông realtime, transit, đóng đường, giờ mở cửa hoặc thời lượng tham quan; pin không mặc định là cổng vào. |
| AI Guide VI/EN | Chọn tối đa ba đoạn ngắn liên quan từ tài liệu được truy xuất; chỉ trả nội dung nguyên văn, không paraphrase | Câu hỏi chọn sẵn; retrieval từ catalog; lọc nguồn theo intent; Zod kiểm tra citationRef và toàn bộ text phải là chuỗi con chính xác của đúng tài liệu; trạng thái giá/giờ hết hạn hoặc mâu thuẫn được giữ nguyên; nhãn và nội dung hồ sơ được bản địa hóa | Smoke DeepSeek extractive VI/EN đạt 2/2 ngày 16/10/2026. Bộ chọn nguồn đối kháng đạt **10/10 development và 10/10 holdout** trong hai lần chạy riêng, tổng cộng 20 fixture VI/EN qua 5 intent; có cạnh tranh loại nguồn, giá cũ/mâu thuẫn, giờ lịch sử, tiếp cận và injection. Mẫu nhỏ, không đại diện mọi truy vấn. Retrieval có cấu trúc/lexical, không phải chatbot tự do hay vector RAG. |
| AI Packing Assistant | Chọn mã món và mức ưu tiên trong danh sách đã cho | Code giới hạn mã/lý do; nhãn, chi tiết và disclaimer song ngữ là copy tĩnh | Smoke VI/EN đạt. Checklist chung, không phải forecast, quy định của cơ sở, tư vấn y tế hoặc bảo đảm tiếp cận. |
| FairPrice Lens | Trích các trường trong đoạn báo giá người dùng dán; gợi ý ID giá catalog có thể liên quan | Đăng nhập, consent, Upstash, Zod, kiểm tra đoạn trích exact-substring; so sánh số chỉ bằng code sau khi khách xác nhận cùng sản phẩm, đơn vị, đối tượng, ngày/hiệu lực và điều khoản; chỉ nhận VND rõ ràng và giá catalog `verified` còn hiệu lực | Live DeepSeek fixture VI/EN đạt 2/2 sau khi nêu rõ evidence phải bao trọn câu liền kề hỗ trợ field; API lọc các field không nằm trong evidence. Unit regression gồm prompt injection, field không có exact evidence và reference ID ngoài địa điểm. Phép tính không gọi model, không kết luận đáng tiền/đắt/rẻ. Không upload/không lưu quote. Chưa có live test xuyên suốt Supabase + Redis + DeepSeek. |
| Operator Copilot | Chưa có luồng LLM | Nhân viên có thể nhập báo giá thủ công, lưu nháp và duyệt trước khi gửi | Chưa hoàn thành; không trình diễn như AI đã hoạt động. Cần đối tác thật và quy trình duyệt rõ trước khi xây. |
| Thuyết minh/TTS | Chưa gọi mô hình | Trình duyệt có thể hỗ trợ Web Speech ở bước sau | Chưa hoàn thành; không cần thêm API trả phí cho bản TTS cơ bản. |

## Privacy và độ tin cậy

- Consent, đăng nhập và hạn mức Upstash được kiểm tra ở API trước khi gọi model; khi thiếu Redis, AI fail-closed. Smoke handler không dùng tài khoản/Redis thật.
- Trước khi serialize đầu vào gửi DeepSeek, ứng dụng che email, số điện thoại, cặp tọa độ thập phân và tọa độ DMS có hướng N/S/E/W hoặc ký hiệu Bắc/Đông trong text; loại bỏ các field tọa độ (`latitude`, `longitude`, `lat`, `lng`, `coordinates`, `gps`). Regression đọc payload HTTP thực gửi, gồm DMS dấu ASCII và dấu prime tiếng Việt.
- Tên tự nhập trong mô tả chưa được nhận diện/loại bỏ tổng quát. UI nên nhắc người dùng không nhập tên, số giấy tờ hoặc ghi chú nhạy cảm khi không cần.
- DeepSeek chỉ được gọi từ server tại host API chính thức. Các API thời tiết/định tuyến là nguồn dữ liệu, không phải model LLM thay thế.
- LLM không làm phép cộng giá, xác nhận vé/booking, tạo pin hoặc xác minh giờ. Giá chưa rõ vẫn `unknown`; thời gian tuyến đến từ ORS, không từ model.

## Đánh giá và hướng cải tiến

Regression unit mới chứng minh Trip DNA phân loại JSON sai cú pháp là đầu ra không hợp lệ, thử lại tối đa một lần và tăng giới hạn token khi provider báo `finish_reason=length`. Bộ unit hiện đạt 112 test, 45 live test được bỏ qua khi không bật biến môi trường.

28 kiểm thử live mới nhất (7 file) đã đi qua Trip DNA VI/EN, planner, weather/safety, route ORS + giải thích tuyến, Guide, Packing và FairPrice; tất cả đạt trong lần chạy này. Bốn case Trip DNA kiểm tra ngày rõ ràng “ngày mai/tomorrow” và câu hỏi thiếu ngày cụ thể khi chỉ nêu tháng. Đây vẫn là smoke tests với input mẫu; handler cô lập session, Upstash và ghi DB, không chứng minh luồng production end-to-end. Khi rà 40 ca development, năm mismatch ban đầu đều thuộc `interests`; làm rõ cách ánh xạ nature/culture/family/food/stay/experience giảm còn một mismatch. `en-development-17` chỉ nói đi Lộc Ninh, không yêu cầu lịch sử/văn hóa, nên nhãn mong đợi `culture` được sửa thành `family` theo nguyên tắc không suy đoán sở thích từ tên địa phương. Development đạt **358/358 (100%)**. Holdout được đo ban đầu **176/180**; sau khi thêm ngày hiện tại `Asia/Ho_Chi_Minh` vào prompt, regression re-run đạt **177/180 (98,3%)** với ba mismatch: `vi-holdout-09.rainyDay`, `en-holdout-02.transport`, `en-holdout-10.lowMobility`. Không dùng holdout để tinh chỉnh. Temperature 0 được gửi cho parser. Các prompt có thể đóng góp số trường khác nhau; interests/regions được tính là khớp nếu chứa nhãn mong đợi. Đây là đánh giá trích xuất có giới hạn, không chấm độ đúng về giờ/giá/hoạt động ngoài catalog hoặc chất lượng tư vấn toàn diện.

Ưu tiên tiếp theo:

1. Dùng 40 prompt development để cải thiện Trip DNA; không điều chỉnh dựa trên 20 holdout hiện tại. Bổ sung ca adversarial và các kiểm tra không bịa nguồn/giá/giờ, privacy, độ trễ và lỗi provider rồi đánh giá lại heldout. Công bố tỷ lệ đo thực tế, không đặt trước kết quả.
2. Giữ Guide ở dạng chọn intent + retrieval có nguồn. Catalog 36 hồ sơ chưa cần LangChain/vector store; lexical/structured retrieval đơn giản hơn để truy vết, dễ chạy rẻ và hạn chế câu trả lời ngoài dữ liệu.
3. Hoàn thiện Stress Test lịch trình bằng phép tính xác định sau khi có dữ liệu thời lượng dừng, giờ hoạt động và buffer tuyến đủ tin cậy; DeepSeek chỉ giải thích cảnh báo, không tự chấm tính khả thi.
4. FairPrice tiếp tục giữ exact evidence cho từng field. AI Guide chỉ hiển thị trích đoạn nguyên văn đã kiểm tra theo citation; smoke extractive đạt 2/2 và bộ chọn nguồn đối kháng đạt 10/10 development + 10/10 holdout trong hai lần chạy VI/EN riêng. Bộ này dùng fixture nhỏ, chưa đo recall trên yêu cầu người dùng thật; tiếp tục rà catalog để bảo đảm giá/giờ cũ hoặc mâu thuẫn luôn có trạng thái. Trích dẫn nguồn không thay xác nhận từ nhà cung cấp.
5. Chỉ làm Operator Copilot khi có đối tác/nhân viên thử nghiệm; mọi phản hồi/báo giá vẫn phải được con người duyệt.

### Có nên thêm chatbot RAG bằng LangChain?

Chưa nên thêm LangChain hoặc vector embedding ở quy mô catalog hiện tại (36 hồ sơ có cấu trúc). AI Guide đã dùng retrieval từ hồ sơ/nguồn/giá/giờ theo địa điểm và intent, nhưng chưa phải chatbot hỏi tự do. Thêm framework không tự làm câu trả lời chính xác hơn; cần tăng chất lượng và độ phủ nguồn trước.

Nếu cần hỏi đáp tự nhiên, hướng đơn giản tiếp theo là cho khách chọn địa điểm rồi nhập câu hỏi ngắn; server tìm các đoạn catalog liên quan bằng tên/alias và full-text PostgreSQL, chỉ gửi các đoạn đó cùng câu hỏi đã loại PII cần thiết đến DeepSeek. DeepSeek chỉ được chọn trích đoạn nguyên văn có citation; nếu không có nguồn phù hợp, trả “chưa có thông tin trong hồ sơ” và câu cần hỏi cơ sở. Giữ giá, giờ, tiếp cận và phép tính ở code; không cho chatbot tự đặt tour, xác nhận dịch vụ hoặc suy luận an toàn. Chỉ cân nhắc LangChain/vector khi corpus tài liệu tăng đáng kể và benchmark cho thấy retrieval từ khóa bỏ sót nguồn.

## Lặp lại live smoke

Chạy trong PowerShell sau khi `.env` đã cấu hình DeepSeek và các provider cần thiết. Lệnh gọi model/provider thật và có thể phát sinh chi phí; không dùng dữ liệu cá nhân:

```powershell
$flags = @('RUN_LIVE_AI_SMOKE','RUN_LIVE_ROUTE_SMOKE','RUN_LIVE_AI_HANDLERS_SMOKE','RUN_LIVE_AI_PLAN_SMOKE','RUN_LIVE_AI_FULL_ROUTE_SMOKE','RUN_LIVE_AI_GUIDE_SMOKE','RUN_LIVE_AI_PACKING_SMOKE','RUN_LIVE_AI_FAIR_PRICE_SMOKE')
foreach ($flag in $flags) { Set-Item -Path "Env:$flag" -Value 'true' }
try {
  npm.cmd test -- --configLoader native --pool=threads --maxWorkers=1 --reporter=dot src/lib/ai-live-smoke.test.ts src/lib/ai-handler-live-smoke.test.ts src/lib/plan-live-smoke.test.ts src/lib/route-assist-live-smoke.test.ts src/lib/guide-live-smoke.test.ts src/lib/packing-live-smoke.test.ts src/lib/fair-price-live-smoke.test.ts
  if ($LASTEXITCODE -ne 0) { throw "Live AI smoke failed with exit code $LASTEXITCODE" }
} finally {
  foreach ($flag in $flags) { Remove-Item -Path "Env:$flag" -ErrorAction SilentlyContinue }
}
```

Kết quả mới nhất ngày 16/10/2026: Trip DNA development 358/358 (40 prompt), holdout regression re-run 177/180 (20 prompt) sau khi thêm ngày Việt Nam hiện tại vào prompt. Mỗi lần chạy evaluator gọi model theo số prompt trong split; phần smoke feature gọi model/provider thật, còn Auth/Redis/DB trong handler vẫn mock. Các pass này không phải bằng chứng deployment hoặc RLS production.

Mặc định, evaluator chạy holdout trên dữ liệu giả lập (20 request DeepSeek, có thể phát sinh chi phí). Để đo 40 prompt development, đặt thêm `RUN_LIVE_AI_TRIP_DNA_SPLIT=development`. Parser dùng `temperature: 0` để giảm ngẫu nhiên; không bảo đảm các lần chạy giống hệt nhau.

    $env:RUN_LIVE_AI_TRIP_DNA_EVAL = 'true'
    npm.cmd test -- --configLoader native --pool=threads --reporter=dot src/lib/trip-dna-live-eval.test.ts -t 'meets the 90%'
    Remove-Item Env:\RUN_LIVE_AI_TRIP_DNA_EVAL -ErrorAction SilentlyContinue

Với development, đặt biến split trước lệnh test và gỡ cả hai biến sau đó. Evaluator chỉ in số field đúng và ID mismatch; chỉ chạy sau khi cấu hình DeepSeek. Không dùng 20 holdout để tinh chỉnh prompt hoặc parser.
