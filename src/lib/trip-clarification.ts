import { tripIntentSchema, type TripInterpretation, type TripIntent } from "@/lib/schemas";

type QuestionTopic = "days" | "travelers" | "budget" | "date" | "transport";

function questionTopic(question: string): QuestionTopic | null {
  const normalized = question.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();
  if (/\b(days?|duration|so ngay|may ngay)\b/.test(normalized)) return "days";
  if (/\b(travelers?|people are traveling|how many people|group size|so khach|bao nhieu nguoi|may nguoi)\b/.test(normalized)) return "travelers";
  if (/\b(budget|ngan sach|chi phi)\b/.test(normalized)) return "budget";
  if (/\b(depart|departure|travel date|date|ngay khoi hanh|khoi hanh)\b/.test(normalized)) return "date";
  if (/\b(transport|vehicle|phuong tien|di bang gi|di bang xe)\b/.test(normalized)) return "transport";
  return null;
}

export function tripClarificationQuestions(intent: TripInterpretation, locale: "vi" | "en"): string[] {
  const questions: string[] = [];
  const seenTopics = new Set<QuestionTopic>();
  const seenText = new Set<string>();
  const addQuestion = (question: string) => {
    const topic = questionTopic(question);
    const normalized = question.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if ((topic && seenTopics.has(topic)) || seenText.has(normalized)) return;
    questions.push(question);
    seenText.add(normalized);
    if (topic) seenTopics.add(topic);
  };

  if (intent.durationDays === null) addQuestion(locale === "en" ? "How many days will you travel?" : "Bạn dự định đi mấy ngày?");
  if (intent.partySize === null) addQuestion(locale === "en" ? "How many people are traveling, including adults and children?" : "Có bao nhiêu người đi, gồm người lớn và trẻ em?");
  if (intent.budgetVnd === null && !intent.budgetFlexible) addQuestion(locale === "en" ? "What is your estimated total budget in VND? If you have not decided, say “not decided yet.”" : "Ngân sách dự kiến cho chuyến đi là bao nhiêu VND? Nếu chưa xác định, bạn có thể ghi “chưa xác định”.");
  if (intent.travelDate === null && !intent.travelDateFlexible) addQuestion(locale === "en" ? "When do you plan to depart? If your dates are flexible, say “flexible.”" : "Bạn dự định khởi hành ngày nào? Nếu ngày đi linh hoạt, hãy ghi “linh hoạt”.");
  if (intent.transport === "unknown" && !intent.transportFlexible) addQuestion(locale === "en" ? "Which transport do you prefer: car, motorbike, bus, bicycle, walking, or no preference?" : "Bạn muốn đi bằng phương tiện nào: ô tô, xe máy, xe khách, xe đạp, đi bộ hay không có ưu tiên?");
  intent.missingInformation.forEach(addQuestion);
  return questions.slice(0, 8);
}

export function toTripIntent(interpretation: TripInterpretation): TripIntent | null {
  if (interpretation.durationDays === null || interpretation.partySize === null) return null;
  return tripIntentSchema.parse({
    durationDays: interpretation.durationDays,
    partySize: interpretation.partySize,
    travelDate: interpretation.travelDate,
    transport: interpretation.transport,
    budgetVnd: interpretation.budgetVnd,
    interests: interpretation.interests,
    regions: interpretation.regions,
    requiredPlaceIds: interpretation.requiredPlaceIds,
    childHeightCm: interpretation.childHeightCm,
    lowMobility: interpretation.lowMobility,
    rainyDay: interpretation.rainyDay,
    missingInformation: interpretation.missingInformation,
  });
}
