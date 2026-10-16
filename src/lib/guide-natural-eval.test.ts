import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { requestDeepSeekJson } from "@/lib/deepseek";
import { buildGuideSystemPrompt, rankGuideDocumentsByQuestion, type GuideDocument } from "@/lib/guide-retrieval";
import { guideAnswerSchema } from "@/lib/schemas";

type Locale = "vi" | "en";
type NaturalCase = {
  id: string;
  question: Record<Locale, string>;
  expectedRef: string;
  expected: Record<Locale, { label: string; content: string }>;
};

const developmentCases: NaturalCase[] = [
  {
    id: "adult-ticket",
    question: { vi: "Giá vé người lớn hiện được ghi là bao nhiêu?", en: "What adult admission price is listed in the catalog?" },
    expectedRef: "price:adult-ticket",
    expected: {
      vi: { label: "Vé vào cổng người lớn", content: "Giá vé người lớn tham khảo: 250.000 đồng. Trạng thái: cần xác nhận với đơn vị trước chuyến đi." },
      en: { label: "Adult admission ticket", content: "Reference adult admission price: 250,000 VND. Status: confirm with the operator before travel." },
    },
  },
  {
    id: "weekend-hours",
    question: { vi: "Giờ mở cửa cuối tuần có được xác nhận không?", en: "Are the reported weekend opening hours confirmed?" },
    expectedRef: "hours:weekend-reported",
    expected: {
      vi: { label: "Giờ được nguồn nêu cuối tuần", content: "Giờ cuối tuần được nguồn nêu: 08:00 đến 17:00. Trạng thái: hai nguồn đang mâu thuẫn; chưa xác nhận giờ hiện tại." },
      en: { label: "Reported weekend opening hours", content: "Reported weekend hours: 08:00 to 17:00. Status: two sources conflict; current hours are not confirmed." },
    },
  },
  {
    id: "child-height",
    question: { vi: "Vé trẻ em cao 120 cm được áp dụng điều kiện nào?", en: "What ticket condition is listed for a 120 cm child?" },
    expectedRef: "price:child-height-condition",
    expected: {
      vi: { label: "Điều kiện vé trẻ em theo chiều cao", content: "Bản ghi tham khảo nêu trẻ cao dưới 120 cm được áp dụng mức vé trẻ em; cần xác nhận lại điều kiện hiện hành với cơ sở." },
      en: { label: "Child ticket height condition", content: "The reference record says children under 120 cm use the child ticket; confirm the current condition with the venue." },
    },
  },
  {
    id: "step-free-access",
    question: { vi: "Có lối đi không bậc cho khách dùng xe lăn không?", en: "Is step-free access available for wheelchair users?" },
    expectedRef: "place:accessibility-caveat",
    expected: {
      vi: { label: "Khả năng tiếp cận", content: "Catalog chưa khảo sát lối đi không bậc hoặc khả năng sử dụng xe lăn. Hãy hỏi cơ sở về địa hình và khu vực tiếp cận được; chưa thể xác nhận phù hợp." },
      en: { label: "Accessibility", content: "The catalog has not surveyed step-free routes or wheelchair access. Ask the operator about terrain and accessible areas; suitability cannot be confirmed." },
    },
  },
  {
    id: "source-check-date",
    question: { vi: "Nguồn chính thức nào được đối chiếu và vào ngày nào?", en: "Which official source was checked, and on what date?" },
    expectedRef: "evidence:operator-page",
    expected: {
      vi: { label: "Trang công khai của đơn vị", content: "Tên nguồn: Trang sản phẩm công khai của đơn vị quản lý. Ngày đối chiếu: 2026-10-12. Tham chiếu này không tự chứng minh điểm đang hoạt động." },
      en: { label: "Public operator page", content: "Source label: Public product page of the managing operator. Checked date: 2026-10-12. This reference alone does not prove the site is currently operating." },
    },
  },
];

// New holdout cases; do not tune retrieval or prompts from their outcomes.
const holdoutCases: NaturalCase[] = [
  {
    id: "historical-price",
    question: { vi: "Mức phí cũ này còn hiệu lực hay chỉ là giá lịch sử?", en: "Is this old fee still valid or only historical?" },
    expectedRef: "price:archived-fee",
    expected: {
      vi: { label: "Phí lưu trữ", content: "Mức phí 40.000 đồng được ghi trong bảng lịch sử năm 2024. Trạng thái: hết hiệu lực; không xem là giá hiện hành." },
      en: { label: "Archived fee", content: "The 40,000 VND fee appears in a 2024 historical price list. Status: expired; do not treat it as the current price." },
    },
  },
  {
    id: "boat-operation",
    question: { vi: "Dịch vụ thuyền ra đảo có đang hoạt động hôm nay không?", en: "Is the boat service to the island operating today?" },
    expectedRef: "place:boat-service-unknown",
    expected: {
      vi: { label: "Tình trạng dịch vụ thuyền", content: "Catalog chưa xác minh dịch vụ thuyền ra đảo hoặc lịch chạy hiện tại. Hãy liên hệ đơn vị quản lý; không thể xác nhận dịch vụ đang hoạt động." },
      en: { label: "Boat service status", content: "The catalog has not verified the island boat service or its current schedule. Contact the operator; service availability cannot be confirmed." },
    },
  },
  {
    id: "group-booking",
    question: { vi: "Nhóm 12 người có đặt được trải nghiệm làm nghề này không?", en: "Can a group of 12 book this community craft experience?" },
    expectedRef: "place:community-group-caveat",
    expected: {
      vi: { label: "Nhóm trải nghiệm cộng đồng", content: "Đây là nhóm trải nghiệm cộng đồng, không phải một cơ sở cung cấp dịch vụ cụ thể. Catalog chưa có đơn vị nhận đặt chỗ hoặc sức chứa đoàn." },
      en: { label: "Community experience group", content: "This is a community-experience category, not a specific service provider. The catalog has no booking operator or group-capacity record." },
    },
  },
  {
    id: "food-allergy",
    question: { vi: "Nhà hàng có bảo đảm món ăn an toàn cho người dị ứng đậu phộng không?", en: "Does the restaurant guarantee meals are safe for a peanut allergy?" },
    expectedRef: "place:allergy-caveat",
    expected: {
      vi: { label: "Thông tin dị ứng thực phẩm", content: "Catalog không có hồ sơ thành phần món ăn hoặc quy trình xử lý dị ứng. Không thể xác nhận an toàn; khách cần hỏi trực tiếp nhà hàng về đậu phộng và lây nhiễm chéo." },
      en: { label: "Food allergy information", content: "The catalog has no ingredient list or allergy-handling procedure. Safety cannot be confirmed; ask the restaurant directly about peanuts and cross-contact." },
    },
  },
  {
    id: "holiday-hours",
    question: { vi: "Nguồn xác nhận giờ mở cửa vào ngày lễ chưa?", en: "Has a source confirmed opening hours on public holidays?" },
    expectedRef: "hours:holiday-unknown",
    expected: {
      vi: { label: "Giờ ngày lễ", content: "Catalog chưa có giờ hoạt động đã đối chiếu cho ngày lễ. Giờ ngày thường không xác nhận lịch ngày lễ; cần hỏi đơn vị vận hành." },
      en: { label: "Holiday hours", content: "The catalog has no verified operating hours for public holidays. Weekday hours do not confirm holiday schedules; ask the operator." },
    },
  },
];

const noise: Record<Locale, Array<{ ref: string; label: string; content: string }>> = {
  vi: [
    { ref: "place:destination", label: "Mô tả địa điểm", content: "Khu tham quan có hoạt động ngoài trời và cảnh quan tự nhiên." },
    { ref: "price:parking", label: "Phí gửi xe", content: "Phí gửi xe tham khảo; chưa xác minh điều kiện áp dụng." },
    { ref: "hours:weekday", label: "Giờ ngày thường", content: "Giờ ngày thường được nguồn nêu từ 09:00 đến 16:00; trạng thái tham khảo." },
    { ref: "evidence:map", label: "Nguồn bản đồ", content: "Bản đồ chỉ nêu vị trí tham khảo, không xác nhận hoạt động hoặc lối vào." },
    { ref: "place:restaurant", label: "Ẩm thực", content: "Khu vực có lựa chọn ăn uống; thành phần món cần hỏi cơ sở." },
    { ref: "price:adult", label: "Vé người lớn", content: "Mức vé người lớn trong bảng cũ đã hết hiệu lực." },
    { ref: "place:transport", label: "Di chuyển", content: "Khách có thể tự tìm tuyến đường phù hợp; không có dữ liệu giao thông thời gian thực." },
    { ref: "price:child-ticket", label: "Vé trẻ em", content: "Mức vé trẻ em trong bảng tham khảo khác với điều kiện vé người lớn." },
    { ref: "hours:seasonal", label: "Lịch mùa", content: "Lịch hoạt động theo mùa trước đây chưa được xác nhận cho năm nay." },
    { ref: "place:nearby-group", label: "Nhóm địa điểm lân cận", content: "Mô tả nhóm không xác nhận dịch vụ của một cơ sở cụ thể." },
  ],
  en: [
    { ref: "place:destination", label: "Destination description", content: "The visitor area has outdoor activities and natural scenery." },
    { ref: "price:parking", label: "Parking fee", content: "Reference parking fee; applicable conditions are not verified." },
    { ref: "hours:weekday", label: "Weekday hours", content: "Reported weekday hours are 09:00 to 16:00; reference status." },
    { ref: "evidence:map", label: "Map source", content: "The map shows a reference location; it does not confirm operation or entrance access." },
    { ref: "place:restaurant", label: "Food options", content: "The area has food options; ask the venue about meal ingredients." },
    { ref: "price:adult", label: "Adult ticket", content: "The adult amount in the old price list has expired." },
    { ref: "place:transport", label: "Travel route", content: "Visitors can choose a route; real-time traffic data is unavailable." },
    { ref: "price:child-ticket", label: "Child ticket", content: "The reference child fare differs from adult admission conditions." },
    { ref: "hours:seasonal", label: "Seasonal schedule", content: "The previous seasonal schedule has not been confirmed for this year." },
    { ref: "place:nearby-group", label: "Nearby destination group", content: "The group description does not confirm a specific service provider." },
  ],
};

function buildDocuments(locale: Locale, testCase: NaturalCase): GuideDocument[] {
  const expected = testCase.expected[locale];
  return [
    { ref: testCase.expectedRef, label: expected.label, href: "/vi/places/demo", checkedAt: "2026-10-12", status: "reference", content: expected.content },
    ...noise[locale].map((item) => ({ ...item, href: "/vi/places/demo", checkedAt: null, status: "unknown" })),
  ];
}

const requested = process.env.RUN_LIVE_AI_GUIDE_NATURAL_EVAL === "true";
if (requested) process.loadEnvFile(".env");
const requestedSplit = process.env.RUN_LIVE_AI_GUIDE_NATURAL_SPLIT;
if (requested && requestedSplit !== "development" && requestedSplit !== "holdout") {
  throw new Error("RUN_LIVE_AI_GUIDE_NATURAL_SPLIT must be development or holdout.");
}
const activeCases = requestedSplit === "holdout" ? holdoutCases : developmentCases;

describe("natural-question Guide retrieval fixtures", () => {
  for (const locale of ["vi", "en"] as const) {
    for (const testCase of activeCases) {
      it(`${testCase.id} ${locale} retrieves the expected record within the prompt budget`, () => {
        const candidates = rankGuideDocumentsByQuestion(buildDocuments(locale, testCase), testCase.question[locale], 8);
        expect(candidates.map(({ ref }) => ref)).toContain(testCase.expectedRef);
        expect(candidates.length).toBeLessThanOrEqual(8);
      });
    }
  }
});

describe.skipIf(!requested)(`live DeepSeek natural-question Guide evaluation (${requestedSplit})`, () => {
  for (const locale of ["vi", "en"] as const) {
    for (const testCase of activeCases) {
      it(`${locale}/${testCase.id} retrieves and cites the expected excerpt`, async () => {
        const question = testCase.question[locale];
        const documents = rankGuideDocumentsByQuestion(buildDocuments(locale, testCase), question, 8);
        const documentByRef = new Map(documents.map((item) => [item.ref, item]));
        expect(documentByRef.has(testCase.expectedRef)).toBe(true);
        const schema = guideAnswerSchema.superRefine((result, context) => {
          result.excerpts.forEach((excerpt, index) => {
            const source = documentByRef.get(excerpt.citationRef);
            if (!source || !source.content.includes(excerpt.text)) {
              context.addIssue({ code: "custom", path: ["excerpts", index], message: "Excerpt must be an exact substring of its cited source." });
            }
          });
        });
        const result = await requestDeepSeekJson({
          schema,
          maxTokens: 450,
          system: buildGuideSystemPrompt(),
          input: {
            locale,
            selectedPlaceId: "demo-place",
            question,
            retrievedDocuments: documents.map(({ ref, label, checkedAt, status, content }) => ({ ref, label, checkedAt, status, content })),
          },
        });
        expect(result.excerpts.some((excerpt) => excerpt.citationRef === testCase.expectedRef)).toBe(true);
        expect(result.excerpts.every((excerpt) => documentByRef.get(excerpt.citationRef)?.content.includes(excerpt.text))).toBe(true);
      }, 30_000);
    }
  }
});
