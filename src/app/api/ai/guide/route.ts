import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeAiAllowance } from "@/lib/ai-limit";
import { AiProviderError, requestDeepSeekJson } from "@/lib/deepseek";
import { guideAnswerSchema, guideInputSchema } from "@/lib/schemas";
import { jsonError } from "@/lib/http";
import { getPlaceCatalog, getPlaceHours, getPlacePriceReferences } from "@/lib/catalog-server";
import { buildGuideSystemPrompt, buildPlaceGuideDocuments, filterGuideDocumentsByIntent, rankGuideDocumentsByQuestion, type GuideDocument, type GuideIntent } from "@/lib/guide-retrieval";

export const runtime = "nodejs";
export const maxDuration = 60;

const intentPrompts: Record<GuideIntent, { vi: string; en: string }> = {
  overview: {
    vi: "Tóm tắt địa điểm từ tài liệu được truy xuất và nêu điều kiện cần xác nhận.",
    en: "Summarize the destination from retrieved documents and state what still needs confirmation.",
  },
  price: {
    vi: "Giải thích giá, đối tượng áp dụng, hiệu lực và khoản chưa biết từ bản ghi được truy xuất.",
    en: "Explain retrieved prices, eligible audiences, validity and unknown amounts.",
  },
  hours: {
    vi: "Tóm tắt giờ được nguồn nêu, phân biệt rõ giờ đã xác minh, chưa xác minh, mâu thuẫn hoặc cũ.",
    en: "Summarize reported hours and distinguish verified, unknown, conflicting or stale records.",
  },
  family_access: {
    vi: "Tóm tắt bằng chứng về trẻ em, vận động hoặc tiếp cận. Nếu thiếu bằng chứng, nói rõ cần hỏi cơ sở; không bảo đảm an toàn hay tiếp cận.",
    en: "Summarize evidence about children, mobility or access. If evidence is missing, say what to ask the operator; do not guarantee safety or accessibility.",
  },
  source_status: {
    vi: "Đánh giá catalog đã biết gì, nguồn nào có ngày rà soát và thông tin nào chưa đủ căn cứ.",
    en: "Explain what the catalog knows, which sources have a checked date, and what remains unsupported.",
  },
};

function safeHttpUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function currentRecordStatus(status: string, checkedAt: string | null, validFrom: string | null, validTo: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  if (validFrom && validFrom > today) return "not yet effective";
  if (validTo && validTo < today) return "expired";
  if (status === "verified" && (!checkedAt || checkedAt < new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10))) return "stale; requires reconfirmation";
  return status;
}

function localizedStatus(status: string, locale: "vi" | "en") {
  if (locale === "en") return status;
  const labels: Record<string, string> = {
    verified: "đã xác minh",
    historical: "thông tin lịch sử",
    conflicting: "đang mâu thuẫn",
    unknown: "chưa xác minh",
    expired: "hết hiệu lực",
    "not yet effective": "chưa đến thời hạn áp dụng",
    "stale; requires reconfirmation": "dữ liệu cũ; cần xác nhận lại",
    "no price record listed": "chưa có bản ghi giá",
    "no hours record listed": "chưa có bản ghi giờ hoạt động",
    "needs_confirmation": "cần xác nhận",
    reference: "tham khảo",
    paused_reference: "tham khảo, tạm dừng",
  };
  return labels[status] || status;
}

function localizedRecordField(en: string, vi: string, locale: "vi" | "en") {
  return locale === "en" ? en : vi;
}

async function relatedDocuments(placeId: string, locale: "vi" | "en", intent: GuideIntent | "question", detailHref: string): Promise<GuideDocument[]> {
  const includePrices = intent === "overview" || intent === "price" || intent === "question";
  const includeHours = intent === "overview" || intent === "hours" || intent === "question";
  const [prices, hours] = await Promise.all([
    includePrices ? getPlacePriceReferences(placeId) : Promise.resolve([]),
    includeHours ? getPlaceHours(placeId) : Promise.resolve([]),
  ]);
  const documents: GuideDocument[] = [];
  if (includePrices && prices.length === 0) {
    documents.push({
      ref: "catalog:prices:" + placeId,
      label: locale === "en" ? "NaiVerse public price catalog" : "Catalog giá công khai NaiVerse",
      href: detailHref,
      checkedAt: null,
      status: locale === "en" ? "no price record listed" : "chưa có bản ghi giá",
      content: locale === "en"
        ? "The NaiVerse public catalog has no price record for this destination. This absence does not mean the service is free."
        : "Catalog công khai NaiVerse chưa có bản ghi giá cho địa điểm này. Việc thiếu bản ghi không có nghĩa dịch vụ miễn phí.",
    });
  }
  if (includeHours && hours.length === 0) {
    documents.push({
      ref: "catalog:hours:" + placeId,
      label: locale === "en" ? "NaiVerse public hours catalog" : "Catalog giờ công khai NaiVerse",
      href: detailHref,
      checkedAt: null,
      status: locale === "en" ? "no hours record listed" : "chưa có bản ghi giờ",
      content: locale === "en"
        ? "The NaiVerse public catalog has no opening-hours record for this destination. This absence does not establish that it is open or closed."
        : "Catalog công khai NaiVerse chưa có bản ghi giờ hoạt động cho địa điểm này. Việc thiếu bản ghi không xác nhận địa điểm đang mở hay đóng cửa.",
    });
  }
  for (const price of prices.slice(0, intent === "price" || intent === "question" ? 12 : 2)) {
    const status = currentRecordStatus(price.status, price.checked_at, price.valid_from, price.valid_to);
    const amount = price.amount_vnd === null
      ? localizedRecordField("unknown amount; never treat as zero", "chưa rõ số tiền; không được coi là 0 đồng", locale)
      : new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(price.amount_vnd) + (locale === "vi" ? " ₫" : " VND");
    documents.push({
      ref: "price:" + price.id,
      label: price.item_label + " — " + price.audience,
      href: safeHttpUrl(price.source_url) || detailHref,
      checkedAt: price.checked_at,
      status,
      content: locale === "en" ? [
        "Item: " + price.item_label + ".",
        "Audience/conditions: " + price.audience + ".",
        "Amount: " + amount + ".",
        "Status: " + status + ".",
        "Valid from/to: " + (price.valid_from || "not recorded") + " / " + (price.valid_to || "not recorded") + ".",
        "Source label: " + price.source_label + ".",
        "Checked date: " + (price.checked_at || "not recorded") + ".",
        "Terms: " + price.terms,
      ].join(" ") : [
        "Khoản giá: " + price.item_label + ".",
        "Đối tượng/điều kiện: " + price.audience + ".",
        "Số tiền: " + amount + ".",
        "Trạng thái: " + localizedStatus(status, locale) + ".",
        "Hiệu lực từ/đến: " + (price.valid_from || "chưa ghi nhận") + " / " + (price.valid_to || "chưa ghi nhận") + ".",
        "Tên nguồn: " + price.source_label + ".",
        "Ngày đối chiếu: " + (price.checked_at || "chưa ghi nhận") + ".",
        "Điều khoản: " + price.terms,
      ].join(" "),
    });
  }
  for (const hour of hours.slice(0, intent === "hours" || intent === "question" ? 12 : 2)) {
    const status = currentRecordStatus(hour.status, hour.checked_at, hour.valid_from, hour.valid_to);
    documents.push({
      ref: "hours:" + hour.id,
      label: hour.source_label,
      href: safeHttpUrl(hour.source_url) || detailHref,
      checkedAt: hour.checked_at,
      status,
      content: locale === "en" ? [
        "Reported hours: " + (hour.opens_local || "unknown") + " to " + (hour.closes_local || "unknown") + " local time.",
        "Status: " + status + ".",
        "Source label: " + hour.source_label + ".",
        "Checked date: " + (hour.checked_at || "not recorded") + ".",
        "Note: " + hour.note_en,
      ].join(" ") : [
        "Giờ được nguồn nêu: " + (hour.opens_local || "chưa rõ") + " đến " + (hour.closes_local || "chưa rõ") + " giờ địa phương.",
        "Trạng thái: " + localizedStatus(status, locale) + ".",
        "Tên nguồn: " + hour.source_label + ".",
        "Ngày đối chiếu: " + (hour.checked_at || "chưa ghi nhận") + ".",
        "Ghi chú: " + hour.note,
      ].join(" "),
    });
  }
  return documents;
}

async function logUsage(userId: string, startedAt: number) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  try {
    await supabase.from("ai_usage").insert({
      user_id: userId,
      feature: "guide",
      model_name: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      duration_ms: Date.now() - startedAt,
      outcome: "success",
    });
  } catch { /* Usage logging never stores the selected place or retrieved documents. */ }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "Request body must be valid JSON."); }
  const parsed = guideInputSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid_request", "Select a destination and provide one bounded question or task, then consent to AI processing.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in to use the AI travel guide.");
  const allowance = await consumeAiAllowance(user.id);
  if (allowance === "unconfigured") return jsonError(503, "ai_limits_not_configured", "Configure Upstash before enabling AI on this deployment.");
  if (allowance === "unavailable") return jsonError(503, "ai_limits_unavailable", "The AI safety limit service is not available yet. Please try again later.");
  if (allowance === "limited") return jsonError(429, "rate_limit", "AI request limit reached. Please try again later.");

  const { locale, placeId, intent, question } = parsed.data;
  const retrievalMode: GuideIntent | "question" = question ? "question" : intent!;
  const catalog = await getPlaceCatalog();
  const place = catalog.find((candidate) => candidate.id === placeId);
  if (!place) return jsonError(404, "place_not_found", "That destination is not in the public catalog.");
  const detailHref = "/" + locale + "/places/" + encodeURIComponent(place.id);
  const placeDocuments = buildPlaceGuideDocuments([place], locale);
  const related = await relatedDocuments(place.id, locale, retrievalMode, detailHref);
  const allDocuments = [
    placeDocuments[0],
    ...related,
    ...placeDocuments.slice(1),
  ];
  const documents = question
    ? rankGuideDocumentsByQuestion(allDocuments, question, 8)
    : filterGuideDocumentsByIntent(allDocuments, intent!).slice(0, 20);
  if (question && documents.length === 0) {
    return NextResponse.json({ excerpts: [], aiUsed: false, reason: "no_relevant_sources" }, { headers: { "Cache-Control": "no-store" } });
  }
  const sourceByRef = new Map(documents.map((document) => [document.ref, document]));
  const answerSchema = guideAnswerSchema.superRefine((result, context) => {
    result.excerpts.forEach((excerpt, index) => {
      const source = sourceByRef.get(excerpt.citationRef);
      if (!source) {
        context.addIssue({ code: "custom", path: ["excerpts", index, "citationRef"], message: "Excerpt citation must refer to a supplied source ID." });
      } else if (!source.content.includes(excerpt.text)) {
        context.addIssue({ code: "custom", path: ["excerpts", index, "text"], message: "Answer text must be an exact excerpt from its cited source." });
      }
    });
  });
  const startedAt = Date.now();

  try {
    const task = intent ? intentPrompts[intent][locale] : null;
    const result = await requestDeepSeekJson({
      schema: answerSchema,
      maxTokens: 1200,
      system: buildGuideSystemPrompt(),
      input: {
        locale,
        placeId,
        ...(question ? { question } : { selectedTask: task }),
        retrievedDocuments: documents.map(({ ref, label, checkedAt, status, content }) => ({ ref, label, checkedAt, status, content })),
      },
    });
    await logUsage(user.id, startedAt);
    const excerpts = result.excerpts.map(({ citationRef, ...excerpt }) => {
      const source = sourceByRef.get(citationRef)!;
      return {
        ...excerpt,
        citation: {
          ref: source.ref,
          label: source.label,
          href: source.href,
          checkedAt: source.checkedAt,
          status: source.status,
        },
      };
    });
    return NextResponse.json({ excerpts, aiUsed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AiProviderError) {
      const status = error.code === "not_configured" ? 503 : 502;
      const code = error.code === "not_configured" ? "ai_not_configured" : error.code === "invalid_output" ? "ai_invalid_output" : "ai_unavailable";
      return jsonError(status, code, error.message);
    }
    return jsonError(500, "guide_failed", "The travel guide could not complete this request.");
  }
}
