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
      const documentByRef = new Map(documents.map((document) => [document.ref, document]));
      const schema = guideAnswerSchema.superRefine((result, context) => {
        result.claims.forEach((claim, index) => {
          const source = documentByRef.get(claim.citationRef);
          if (!source || !source.content.includes(claim.evidence)) {
            context.addIssue({ code: "custom", path: ["claims", index], message: "Claim evidence must be an exact excerpt from its cited record." });
          }
        });
      });
      let output: { claims: Array<{ text: string; evidence: string; citationRef: string }>; followUpQuestions: string[] };
      try {
        output = await requestDeepSeekJson({
        schema,
          maxTokens: 1200,
        system: [
          "Answer only from the retrieved public destination record. Do not invent current operation, price, hours, entrance or safety.",
          "Return 1 to 3 concise atomic claims in the requested language. Each claim must include one verbatim continuous evidence excerpt and the exact citationRef of that document; do not state facts beyond the excerpt.",
          "If a fact is absent, cite the exact caveat that says it is unconfirmed. Return claims and up to 3 short followUpQuestions as JSON.",
        ].join(" "),
        input: {
          locale,
          selectedPlaceId: place.id,
          task: locale === "en" ? "Summarize the destination and what visitors should confirm." : "Tóm tắt địa điểm và điều khách nên xác nhận.",
          retrievedDocuments: documents.map(({ ref, label, checkedAt, status, content }) => ({ ref, label, checkedAt, status, content })),
        },
        });
      } catch (error) {
        const diagnostics = error && typeof error === "object" && "diagnostics" in error && Array.isArray(error.diagnostics)
          ? error.diagnostics.join("; ")
          : "no safe schema diagnostics available";
        throw new Error("Live guide smoke failed: " + diagnostics);
      }
      expect(output.claims.length).toBeGreaterThan(0);
      expect(output.claims.every((claim) => documentByRef.get(claim.citationRef)?.content.includes(claim.evidence))).toBe(true);
    }, 30_000);
  }
});
