import { describe, expect, it } from "vitest";
import { tripInterpretationSchema } from "@/lib/schemas";
import { toTripIntent, tripClarificationQuestions } from "@/lib/trip-clarification";

const baseIntent = {
  durationDays: 2,
  partySize: 3,
  travelDate: "2026-11-01",
  travelDateFlexible: false,
  transport: "car",
  transportFlexible: false,
  budgetVnd: 2_000_000,
  budgetFlexible: false,
  interests: ["nature"],
  regions: ["Đồng Nai"],
  requiredPlaceIds: [],
  childHeightCm: null,
  lowMobility: false,
  rainyDay: false,
  missingInformation: [],
};

describe("trip clarification", () => {
  it("asks for every required trip detail that the user has not supplied", () => {
    const intent = tripInterpretationSchema.parse({
      ...baseIntent,
      durationDays: null,
      partySize: null,
      travelDate: null,
      transport: "unknown",
      budgetVnd: null,
    });

    expect(tripClarificationQuestions(intent, "vi")).toEqual([
      "Bạn dự định đi mấy ngày?",
      "Có bao nhiêu người đi, gồm người lớn và trẻ em?",
      "Ngân sách dự kiến cho chuyến đi là bao nhiêu VND? Nếu chưa xác định, bạn có thể ghi “chưa xác định”.",
      "Bạn dự định khởi hành ngày nào? Nếu ngày đi linh hoạt, hãy ghi “linh hoạt”.",
      "Bạn muốn đi bằng phương tiện nào: ô tô, xe máy, xe khách, xe đạp, đi bộ hay không có ưu tiên?",
    ]);
  });

  it("accepts explicit flexibility for budget, date and transport", () => {
    const intent = tripInterpretationSchema.parse({
      ...baseIntent,
      travelDate: null,
      travelDateFlexible: true,
      transport: "unknown",
      transportFlexible: true,
      budgetVnd: null,
      budgetFlexible: true,
    });

    expect(tripClarificationQuestions(intent, "en")).toEqual([]);
    expect(toTripIntent(intent)).toMatchObject({ durationDays: 2, partySize: 3, budgetVnd: null });
  });

  it("removes AI wording that repeats the missing date and transport questions", () => {
    const intent = tripInterpretationSchema.parse({
      ...baseIntent,
      travelDate: null,
      transport: "unknown",
      missingInformation: [
        "Bạn dự định khởi hành vào ngày nào? Nếu linh hoạt, hãy ghi 'linh hoạt'.",
        "Bạn muốn đi bằng phương tiện gì: ô tô, xe máy, xe khách, xe đạp, đi bộ hay không ưu tiên?",
      ],
    });

    expect(tripClarificationQuestions(intent, "vi").filter((question) => /khởi hành|phương tiện/.test(question))).toEqual([
      "Bạn dự định khởi hành ngày nào? Nếu ngày đi linh hoạt, hãy ghi “linh hoạt”.",
      "Bạn muốn đi bằng phương tiện nào: ô tô, xe máy, xe khách, xe đạp, đi bộ hay không có ưu tiên?",
    ]);
  });

  it("does not produce a plannable intent when days or traveler count is still unknown", () => {
    const intent = tripInterpretationSchema.parse({ ...baseIntent, durationDays: null, partySize: null });

    expect(toTripIntent(intent)).toBeNull();
    expect(tripClarificationQuestions(intent, "en")).toHaveLength(2);
  });
});
