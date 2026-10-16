import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { places } from "@/lib/catalog";
import { buildGuideSystemPrompt, buildPlaceGuideDocuments, filterGuideDocumentsByIntent, rankGuideDocumentsByQuestion } from "@/lib/guide-retrieval";
import { requestDeepSeekJson } from "@/lib/deepseek";
import { guideAnswerSchema } from "@/lib/schemas";

const liveRequested = process.env.RUN_LIVE_AI_GUIDE_SMOKE === "true";
if (liveRequested) process.loadEnvFile(".env");

describe.skipIf(!liveRequested)("live DeepSeek AI guide smoke (explicit opt-in)", () => {
  for (const locale of ["vi", "en"] as const) {
    it("answers from a retrieved Amazing Bay catalog record in " + locale, async () => {
      const place = places.find((item) => item.id === "amazing-bay")!;
      const documents = filterGuideDocumentsByIntent(buildPlaceGuideDocuments([place], locale), "overview");
      const documentByRef = new Map(documents.map((document) => [document.ref, document]));
      const schema = guideAnswerSchema.superRefine((result, context) => {
        result.excerpts.forEach((excerpt, index) => {
          const source = documentByRef.get(excerpt.citationRef);
          if (!source || !source.content.includes(excerpt.text)) {
            context.addIssue({ code: "custom", path: ["excerpts", index], message: "Answer must be an exact excerpt from its cited record." });
          }
        });
      });
      let output: { excerpts: Array<{ text: string; citationRef: string }> };
      try {
        output = await requestDeepSeekJson({
          schema,
          maxTokens: 1200,
          system: buildGuideSystemPrompt(),
          input: {
            locale,
            selectedPlaceId: place.id,
            task: locale === "en" ? "Select source excerpts that summarize the destination and note what visitors should confirm." : "Chọn trích đoạn nguồn tóm tắt địa điểm và nêu điều khách nên xác nhận.",
            retrievedDocuments: documents.map(({ ref, label, checkedAt, status, content }) => ({ ref, label, checkedAt, status, content })),
          },
        });
      } catch (error) {
        const diagnostics = error && typeof error === "object" && "diagnostics" in error && Array.isArray(error.diagnostics)
          ? error.diagnostics.join("; ")
          : "no safe schema diagnostics available";
        throw new Error("Live guide smoke failed: " + diagnostics);
      }
      expect(output.excerpts.length).toBeGreaterThan(0);
      expect(output.excerpts.every((excerpt) => documentByRef.get(excerpt.citationRef)?.content.includes(excerpt.text))).toBe(true);
    }, 30_000);
  }

  for (const locale of ["vi", "en"] as const) {
    it("answers a natural question from a matching excerpt in " + locale, async () => {
      const place = places.find((item) => item.id === "amazing-bay")!;
      const question = locale === "en" ? "What area is listed for this destination?" : "Khu vực được ghi là gì?";
      const documents = rankGuideDocumentsByQuestion(buildPlaceGuideDocuments([place], locale), question);
      expect(documents.length).toBeGreaterThan(0);
      const documentByRef = new Map(documents.map((document) => [document.ref, document]));
      const schema = guideAnswerSchema.superRefine((result, context) => {
        result.excerpts.forEach((excerpt, index) => {
          const source = documentByRef.get(excerpt.citationRef);
          if (!source || !source.content.includes(excerpt.text)) {
            context.addIssue({ code: "custom", path: ["excerpts", index], message: "Answer must be an exact excerpt from its cited record." });
          }
        });
      });
      let output: { excerpts: Array<{ text: string; citationRef: string }> };
      try {
        output = await requestDeepSeekJson({
          schema,
          maxTokens: 1200,
          system: buildGuideSystemPrompt(),
          input: {
            locale,
            selectedPlaceId: place.id,
            question,
            retrievedDocuments: documents.map(({ ref, label, checkedAt, status, content }) => ({ ref, label, checkedAt, status, content })),
          },
        });
      } catch (error) {
        const diagnostics = error && typeof error === "object" && "diagnostics" in error && Array.isArray(error.diagnostics)
          ? error.diagnostics.join("; ")
          : "no safe schema diagnostics available";
        throw new Error("Live natural-question guide smoke failed: " + diagnostics);
      }
      expect(output.excerpts.length).toBeGreaterThan(0);
      expect(output.excerpts.every((excerpt) => documentByRef.get(excerpt.citationRef)?.content.includes(excerpt.text))).toBe(true);
    }, 30_000);
  }
});
