# Kiểm toán AI NaiVerse

## Phạm vi và kết luận

Rà soát repository và provider thật ngày 16/10/2026. Mọi lời gọi mô hình của ứng dụng đi qua server và DeepSeek Chat Completions; `.env` đang chọn `deepseek-v4-flash`, key không đưa xuống client. JSON đầu ra được kiểm tra bằng Zod, có tối đa một lần sửa schema, timeout và giới hạn output. Không có LangChain, vector database hoặc nhà cung cấp LLM thứ hai.

**Trả lời trực tiếp:** chưa thể nói toàn bộ tính năng AI “đúng tuyệt đối và chạy end-to-end”. Sáu nhóm đã có trong code vượt qua live smoke bằng fixture hiện tại; Trip DNA còn ba mismatch holdout, hai evaluator Guide đều có mẫu nhỏ, và tích hợp authenticated handler vẫn chưa dùng Supabase/Upstash thật. Weather/Rain Plan và route assistant có ranh giới dữ liệu rõ, nhưng không phải cảnh báo thời tiết chính thức, giao thông realtime hoặc kiểm tra giờ mở cửa. LLM duy nhất là DeepSeek; các phép tính tiền, kiểm tra schema/evidence, giới hạn dữ liệu và điều kiện an toàn vẫn do code quyết định.

Live smoke mới nhất ngày **16/10/2026** đạt **32/32 trên 7 file** với DeepSeek/Open-Meteo/ORS thật. Coverage gồm Trip DNA VI/EN, ngày tương đối và yêu cầu chỉ có tháng, Journey Studio, weather, incident không khẩn cấp qua API VI/EN, nhánh emergency không gọi AI, route assistant, AI Guide intent và câu hỏi tự nhiên VI/EN, Packing và FairPrice VI/EN với prompt injection. Smoke handler mock Supabase session, Upstash limiter và ghi DB; vì vậy chưa chứng minh AI chạy end-to-end với Auth/Redis/Supabase thật. Trong lần tổng hợp đầu, model chọn trích dẫn FairPrice chỉ chứa giá vé nhưng gán thêm điều kiện xe đưa đón, và một đáp án sự cố tiếng Việt vượt giới hạn độ dài. Prompt đã được làm rõ về evidence span và câu trả lời ngắn; sau đó bộ tổng hợp đạt 30/30 trước khi thêm hai ca Guide Q&A. API FairPrice vốn đã lọc field không được evidence hỗ trợ và đưa chúng vào missing fields. Đầu ra LLM vẫn có thể biến thiên, nên kết quả smoke không chứng minh mọi prompt đúng.

Bộ đánh giá Trip DNA có 60 case (40 development, 20 holdout; 30 Việt/30 Anh). Development đạt **358/358** trường. Regression re-run trên holdout đạt **177/180 (98,3%)**; ba mismatch: `vi-holdout-09.rainyDay`, `en-holdout-02.transport`, `en-holdout-10.lowMobility`. Không tiếp tục tinh chỉnh bằng holdout. Guide source-selection adversarial đạt **10/10 development và 10/10 holdout** trên intent cố định. Một bộ đánh giá riêng cho câu hỏi tự nhiên đạt **10/10 development và 10/10 holdout** (mỗi split 5 câu VI + 5 câu EN), với retrieval top-8 trên fixture nguồn tổng hợp và kiểm tra citation chính xác. Holdout tự nhiên được chạy riêng một lần, không dùng để tinh chỉnh. Cả hai bộ Guide đều nhỏ; bộ câu hỏi tự nhiên chưa dùng corpus catalog production hay truy vấn đại diện từ người dùng, nên không đo recall/độ chính xác tổng quát và không bảo đảm lần gọi sau giống hệt.

Evaluator `guide-catalog-eval.test.ts` kiểm tra thêm 3 câu mỗi split bằng hồ sơ seed Amazing Bay, Bửu Long, Sơn Tiên Amazing World, Mã Đà và Cát Tiên. Development đạt **6/6**, holdout độc lập đạt **6/6**; mỗi lượt kiểm tra retrieval nguồn kỳ vọng và DeepSeek trả citation chứa excerpt nguyên văn. Holdout chạy một lần. Đây vẫn là sáu lượt mỗi split trên catalog seed tĩnh, không gồm các bản ghi giá/giờ từ Supabase và chưa đo truy vấn production/người dùng.

**Kết luận theo phạm vi:** sáu nhóm AI đã được tích hợp (Trip DNA/Journey Studio, thời tiết–sự cố, route assistant, Guide có nguồn, Packing và FairPrice) và live smoke hiện tại đạt. Điều đó không có nghĩa mọi đầu ra luôn đúng: Trip DNA còn 3 mismatch trên 180 field holdout, FairPrice vẫn phụ thuộc độ chính xác của trích đoạn nhưng API lọc field ngoài evidence, bộ câu hỏi tự nhiên Guide mới có 20 ca synthetic, và bài handler thật vẫn mock Auth/Redis/DB. AI Guide hiện hỗ trợ câu hỏi tự nhiên có giới hạn; upload tài liệu, Operator Copilot, TTS và Stress Test theo timeline chưa triển khai. Số unit/integration, lint, typecheck và production build phải được cập nhật theo lần chạy mới nhất ở phần trạng thái cuối tài liệu.

## Ma trận tính năng

| Tính năng | DeepSeek làm gì | Logic/dữ liệu do ứng dụng giữ | Trạng thái và giới hạn |
|---|---|---|---|
| Trip DNA / Journey Studio | Trích số ngày, nhóm khách, ngày đi, ngân sách, sở thích, phương tiện, điều kiện gia đình từ mô tả | Kiểm tra schema; gửi ngày hiện tại `Asia/Ho_Chi_Minh` để phân giải ngày tương đối rõ ràng; chọn điểm từ catalog; tạo tối đa ba phương án; tính chi phí, cảnh báo và eligibility bằng code | Smoke VI/EN và endpoint kế hoạch thật đạt; ngày “ngày mai/tomorrow” được phân giải đúng, hai ca chỉ nêu tháng để `travelDate=null` và yêu cầu làm rõ. JSON/schema không hợp lệ được thử lại tối đa một lần; nếu DeepSeek báo `finish_reason=length`, lần thử lại tăng `max_tokens` từ 1.400 lên tối đa 2.400. Đây chưa phải timeline theo giờ: chưa lập thời lượng dừng, bữa ăn hoặc bảo đảm kịp giờ mở cửa. |
| Weather Brief / Rain Plan / an toàn / du lịch xanh | Tóm tắt forecast vùng, gợi ý chuẩn bị, xử lý sự cố không khẩn cấp | Open-Meteo cung cấp forecast; logic nhận diện nguy hiểm tức thời chuyển thẳng sang hướng dẫn/số liên hệ, không chờ AI | Live smoke VI/EN cho forecast và incident endpoint đạt; giới hạn prompt bước/ý ở 160 ký tự để giảm lỗi schema (schema cứng là 220). Ngày ngoài cửa sổ forecast không được bịa. Đây không phải cảnh báo chính thức, chẩn đoán y tế hoặc xác nhận điểm đang mở. Rain Plan hiện là gợi ý indoorAlternative trong weather brief, chưa tự cập nhật một itinerary nhiều ngày theo forecast. |
| So sánh tuyến | Giải thích đánh đổi nhanh nhất/ngắn nhất từ metric được cung cấp | OpenRouteService tạo matrix, thứ tự waypoint và geometry; tọa độ không gửi cho model | Smoke tuyến bản đồ→ORS→DeepSeek đạt. Không có giao thông realtime, transit, đóng đường, giờ mở cửa hoặc thời lượng tham quan; pin không mặc định là cổng vào. |
| AI Guide VI/EN | Hiểu câu hỏi ngắn về địa điểm đã chọn; DeepSeek chỉ chọn tối đa ba trích đoạn nguyên văn từ nguồn công khai | Retrieval lexical từ nhãn/nội dung hồ sơ, giá và giờ; giới hạn 240 ký tự, consent, che email/điện thoại, ID giấy tờ có nhãn và GPS; tối đa 8 tài liệu; thiếu nguồn thì không gọi model; Zod kiểm tra citation/exact substring; trạng thái cũ/mâu thuẫn được giữ nguyên | Live smoke DeepSeek đạt **4/4** gồm hai intent cũ và hai câu hỏi tự nhiên VI/EN. Route regression kiểm tra injection, câu hỏi không liên quan, no-source không gọi model, redaction, giá/giờ hết hạn và citation sai. Evaluator source-selection cố định đạt 10/10 mỗi split; câu hỏi tự nhiên synthetic đạt 10/10 mỗi split; catalog seed đạt 6/6 mỗi split. Các mẫu nhỏ, chưa đại diện catalog production. |
| AI Packing Assistant | Chọn mã món và mức ưu tiên trong danh sách đã cho | Code giới hạn mã/lý do; nhãn, chi tiết và disclaimer song ngữ là copy tĩnh | Smoke VI/EN đạt. Checklist chung, không phải forecast, quy định của cơ sở, tư vấn y tế hoặc bảo đảm tiếp cận. |
| FairPrice Lens | Trích các trường trong đoạn báo giá người dùng dán; gợi ý ID giá catalog có thể liên quan | Đăng nhập, consent, Upstash, Zod, kiểm tra đoạn trích exact-substring; so sánh số chỉ bằng code sau khi khách xác nhận cùng sản phẩm, đơn vị, đối tượng, ngày/hiệu lực và điều khoản; chỉ nhận VND rõ ràng và giá catalog `verified` còn hiệu lực | Live DeepSeek fixture VI/EN đạt 2/2 sau khi nêu rõ evidence phải bao trọn câu liền kề hỗ trợ field; API lọc các field không nằm trong evidence. Unit regression gồm prompt injection, field không có exact evidence và reference ID ngoài địa điểm. Phép tính không gọi model, không kết luận đáng tiền/đắt/rẻ. Không upload/không lưu quote. Chưa có live test xuyên suốt Supabase + Redis + DeepSeek. |
| Operator Copilot | Chưa có luồng LLM | Nhân viên có thể nhập báo giá thủ công, lưu nháp và duyệt trước khi gửi | Chưa hoàn thành; không trình diễn như AI đã hoạt động. Cần đối tác thật và quy trình duyệt rõ trước khi xây. |
| Thuyết minh/TTS | Chưa gọi mô hình | Trình duyệt có thể hỗ trợ Web Speech ở bước sau | Chưa hoàn thành; không cần thêm API trả phí cho bản TTS cơ bản. |

## Privacy và độ tin cậy

- Consent, đăng nhập và hạn mức Upstash được kiểm tra ở API trước khi gọi model; khi thiếu Redis, AI fail-closed. Smoke handler không dùng tài khoản/Redis thật.
- Trước khi serialize đầu vào gửi DeepSeek, ứng dụng che email, số điện thoại, ID hộ chiếu/giấy tờ có nhãn, cặp tọa độ thập phân và tọa độ DMS có hướng N/S/E/W hoặc ký hiệu Bắc/Đông trong text; loại bỏ các field tọa độ (`latitude`, `longitude`, `lat`, `lng`, `coordinates`, `gps`). Regression đọc payload HTTP thực gửi, gồm DMS ASCII/tiếng Việt và số hộ chiếu dạng chữ-số.
- Tên tự nhập trong mô tả chưa được nhận diện/loại bỏ tổng quát. UI nên nhắc người dùng không nhập tên, số giấy tờ hoặc ghi chú nhạy cảm khi không cần.
- DeepSeek chỉ được gọi từ server tại host API chính thức. Các API thời tiết/định tuyến là nguồn dữ liệu, không phải model LLM thay thế.
- LLM không làm phép cộng giá, xác nhận vé/booking, tạo pin hoặc xác minh giờ. Giá chưa rõ vẫn `unknown`; thời gian tuyến đến từ ORS, không từ model.

## Đánh giá và hướng cải tiến

Regression unit chứng minh Trip DNA phân loại JSON sai cú pháp là đầu ra không hợp lệ, thử lại tối đa một lần và tăng giới hạn token khi provider báo `finish_reason=length`. Bộ mặc định mới nhất ngày 16/10/2026 đạt **144 test passed, 65 live/opt-in test skipped**; các evaluator Guide chỉ gọi DeepSeek khi bật cờ opt-in.

Live smoke mới nhất ngày 16/10/2026 đạt **32/32 trên 7 file**: Trip DNA VI/EN, Journey Studio, thời tiết/an toàn, incident VI/EN, route assistant, AI Guide gồm Q&A tự nhiên VI/EN, Packing và FairPrice. Bốn case Trip DNA kiểm tra ngày rõ ràng “ngày mai/tomorrow” và câu hỏi chỉ nêu tháng. Đây vẫn là smoke tests với input mẫu; handler cô lập session, Upstash và ghi DB, không chứng minh luồng production end-to-end. Khi rà 40 ca development, năm mismatch ban đầu đều thuộc `interests`; làm rõ cách ánh xạ nature/culture/family/food/stay/experience giảm còn một mismatch. `en-development-17` chỉ nói đi Lộc Ninh, không yêu cầu lịch sử/văn hóa, nên nhãn mong đợi `culture` được sửa thành `family` theo nguyên tắc không suy đoán sở thích từ tên địa phương. Development đạt **358/358 (100%)**. Lần đánh giá holdout mới nhất đạt **177/180 (98,3%)** với ba mismatch: `vi-holdout-09.rainyDay`, `en-holdout-02.transport`, `en-holdout-10.lowMobility`. Không dùng holdout để tinh chỉnh. Temperature 0 được gửi cho parser. Các prompt có thể đóng góp số trường khác nhau; interests/regions được tính là khớp nếu chứa nhãn mong đợi. Đây là đánh giá trích xuất có giới hạn, không chấm độ đúng về giờ/giá/hoạt động ngoài catalog hoặc chất lượng tư vấn toàn diện. Bộ chọn nguồn Guide intent cố định đạt 10/10 development và 10/10 holdout. Bộ đánh giá câu hỏi tự nhiên tách riêng đạt **10/10 development và 10/10 holdout**, mỗi split có 5 câu VI + 5 câu EN, retrieval top-8 trên fixture nguồn tổng hợp, kỳ vọng nguồn được lấy và citation exact-substring. Holdout tự nhiên chạy một lần riêng, không dùng để tinh chỉnh. Mẫu 20 ca nhỏ, chưa dùng catalog production hay truy vấn đại diện, nên không đo recall/độ chính xác tổng quát.

Trong lần xác minh lại sau khi thêm evaluator và regression privacy, unit/integration mặc định đạt **144 passed, 65 skipped**; lint và typecheck đạt. Production build chạy thành công trên bản sao cô lập của source hiện tại: compile, TypeScript và **47/47 static pages** đạt, lệnh thoát mã 0. Các lần chạy trong sandbox trực tiếp gặp EPERM; bản sao build đã được dọn sau khi xác minh đúng đường dẫn. Next.js có cảnh báo nhận diện thêm lockfile do bản sao nằm trong workspace, nhưng build hoàn tất.

Ưu tiên tiếp theo:

1. Dùng 40 prompt development để cải thiện Trip DNA; không điều chỉnh dựa trên 20 holdout hiện tại. Bổ sung ca adversarial và các kiểm tra không bịa nguồn/giá/giờ, privacy, độ trễ và lỗi provider rồi đánh giá lại heldout. Công bố tỷ lệ đo thực tế, không đặt trước kết quả.
2. Tiếp tục đánh giá Guide Q&A bằng câu hỏi VI/EN độc lập trên toàn bộ catalog đã duyệt và snapshot dữ liệu production; đo recall nguồn, citation và tỷ lệ “không có căn cứ”. Các bộ hiện tại đạt 20/20 câu fixture và 12/12 lượt catalog seed, nhưng mẫu còn rất nhỏ. Corpus hiện chưa cần LangChain/vector store; chỉ cân nhắc full-text/embeddings nếu có bằng chứng lexical retrieval bỏ sót đáng kể.
3. Hoàn thiện Stress Test lịch trình bằng phép tính xác định sau khi có dữ liệu thời lượng dừng, giờ hoạt động và buffer tuyến đủ tin cậy; DeepSeek chỉ giải thích cảnh báo, không tự chấm tính khả thi.
4. FairPrice tiếp tục giữ exact evidence cho từng field. AI Guide chỉ hiển thị trích đoạn nguyên văn đã kiểm tra theo citation; smoke extractive đạt 2/2 và các evaluator source-selection/câu hỏi tự nhiên đạt 10/10 mỗi split trên fixture nhỏ. Chưa đo recall trên yêu cầu người dùng thật; tiếp tục rà catalog để bảo đảm giá/giờ cũ hoặc mâu thuẫn luôn có trạng thái. Trích dẫn nguồn không thay xác nhận từ nhà cung cấp.
5. Chỉ làm Operator Copilot khi có đối tác/nhân viên thử nghiệm; mọi phản hồi/báo giá vẫn phải được con người duyệt.

### Có nên thêm chatbot RAG bằng LangChain?

AI Guide đã có RAG tối giản phù hợp MVP: khách chọn một địa điểm rồi nhập câu hỏi ngắn; ứng dụng xếp hạng hồ sơ công khai bằng từ khóa, alias chủ đề và nhãn nguồn; DeepSeek chỉ chọn trích đoạn nguyên văn từ tối đa 8 tài liệu phù hợp. Citation được xác thực server-side. Nếu không tìm thấy nguồn đạt ngưỡng, model không được gọi. Email, điện thoại, giấy tờ có nhãn và tọa độ bị che trước khi gửi; giao diện yêu cầu consent và nhắc không nhập tên hoặc ghi chú riêng.

Chưa cần LangChain hoặc vector database cho catalog vài chục hồ sơ có cấu trúc. Thêm framework không tự tăng độ đúng; retrieval hiện tại rẻ, dễ kiểm tra và ít thành phần vận hành hơn. Bộ câu hỏi tự nhiên có 10 ca development và 10 holdout trên fixture tổng hợp, thêm 3 case mỗi split trên hồ sơ seed thật; các lượt DeepSeek đều đạt nguồn kỳ vọng/citation. Mẫu này chưa đo recall toàn catalog production hoặc truy vấn người dùng độc lập. Hạn chế vẫn là truy vấn đồng nghĩa/ngữ cảnh dài có thể bị bỏ sót; bước tiếp theo là tạo câu hỏi độc lập trên catalog đã duyệt, đo recall nguồn, tỷ lệ abstain và citation, rồi mới cân nhắc full-text PostgreSQL hoặc embeddings nếu lexical retrieval hụt rõ rệt.

Không cho Guide tự xác nhận booking, giờ mở cửa, giá hiện hành, an toàn món ăn/dị ứng hoặc tiếp cận xe lăn nếu hồ sơ không có bằng chứng. Tên người, số định danh và nội dung nhạy cảm không được tự động nhận diện đầy đủ; không nhập các dữ liệu này. TTS, Operator Copilot và stress test theo giờ vẫn là backlog riêng, không được coi là đã triển khai.

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
