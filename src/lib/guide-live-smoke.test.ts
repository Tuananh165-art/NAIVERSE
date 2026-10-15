import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { places } from "@/lib/catalog";
import { buildPlaceGuideDocuments } from "@/lib/guide-retrieval";
import { requestDeepSeekJson } from "@/lib/deepseek";
import { guideAnswerSchema } from "@/lib/schemas";

const liveRequested = process.env.RUN_LIVE_AI_GUIDE_SMOKE === "true";
if (liveRequested) process.loadEnvFile(".env");

describe.skipIf(!liveRequested)("live DeepSeek AI guide smoke (explicit opt-in)", () => {
  for (const locale of ["vi", "en"] as const) {
    it("answers from a retrieved Amazing Bay catalog record in " + locale, async () => {
      const place = places.find((item) => item.id === "amazing-bay")!;
      const documents = buildPlaceGuideDocuments([place], locale);
      const allowed = new Set(documents.map((document) => document.ref));
      const schema = guideAnswerSchema.extend({
        citations: guideAnswerSchema.shape.citations.refine((refs) => refs.every((ref) => allowed.has(ref))),
      });
      const output = await requestDeepSeekJson({
        schema,
        maxTokens: 500,
        system: [
          "Answer only from the retrieved public destination record. Do not invent current operation, price, hours, entrance or safety.",
          "Cite every factual claim using one exact supplied source ID. If a fact is absent, say it needs confirmation.",
          "Return answer, followUpQuestions (up to 3) and citations (1 to 6 source IDs) as JSON.",
        ].join(" "),
        input: {
          locale,
          selectedPlaceId: place.id,
          task: locale === "en" ? "Summarize the destination and what visitors should confirm." : "Tóm tắt địa điểm và điều khách nên xác nhận.",
          retrievedDocuments: documents.map(({ ref, label, checkedAt, status, content }) => ({ ref, label, checkedAt, status, content })),
        },
      });
      expect(output.answer.length).toBeGreaterThan(8);
      expect(output.citations.length).toBeGreaterThan(0);
      expect(output.citations.every((citation) => allowed.has(citation))).toBe(true);
    }, 30_000);
  }
});
