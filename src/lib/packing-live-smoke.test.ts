import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { AiProviderError, requestDeepSeekJson } from "@/lib/deepseek";
import { packingInputSchema, packingOutputSchema } from "@/lib/schemas";
import { allowedPackingItems, allowedPackingReasons, allowedReasonsForPackingItem, validPackingItemReason } from "@/lib/packing";

const liveRequested = process.env.RUN_LIVE_AI_PACKING_SMOKE === "true";
if (liveRequested) process.loadEnvFile(".env");

describe.skipIf(!liveRequested)("live DeepSeek packing checklist smoke (explicit opt-in)", () => {
  for (const locale of ["vi", "en"] as const) {
    it("returns only supported item and reason codes in " + locale, async () => {
      const input = packingInputSchema.parse({
        locale,
        consent: true,
        durationDays: 2,
        partySize: 3,
        transport: "private_vehicle",
        interests: ["nature", "family"],
        childHeightCm: 120,
        lowMobility: false,
        rainyDay: true,
        placeIds: ["cat-tien"],
      });
      const reasons = allowedPackingReasons(input, ["nature"]);
      const itemCodes = allowedPackingItems(reasons);
      const allowedItems = itemCodes.map((code) => ({ code, allowedReasonCodes: allowedReasonsForPackingItem(code, reasons) }));
      const outputSchema = packingOutputSchema.superRefine((output, context) => {
        const seen = new Set<string>();
        output.items.forEach((item, index) => {
          if (!itemCodes.includes(item.code) || !validPackingItemReason(item.code, item.reason, reasons) || seen.has(item.code)) {
            context.addIssue({ code: "custom", path: ["items", index], message: "Unsupported item, duplicate code or unsupported reason." });
          }
          seen.add(item.code);
        });
      });
      let result;
      try {
        result = await requestDeepSeekJson({
          schema: outputSchema,
          maxTokens: 650,
          system: 'Return JSON only. Select 4 to 8 distinct allowed item codes. Choose the reason only from the allowedReasonCodes attached to each item. Use integer priority 1 (top priority), 2 (recommended) or 3 (optional). Do not invent weather, venue rules, accessibility or medical advice. Example: {"items":[{"code":"water_bottle","priority":2,"reason":"general_preparedness"}]}.',
          input: {
            locale,
            tripFacts: { durationDays: input.durationDays, partySize: input.partySize, transport: input.transport, interests: input.interests, childTraveling: true, mobilityNeeds: false, rainPlanRequested: true, stopCategories: ["nature"] },
            allowedReasons: reasons,
          allowedItems,
          },
        });
      } catch (error) {
        if (error instanceof AiProviderError) throw new Error("Packing output validation failed: " + error.diagnostics.join(" | "));
        throw error;
      }
      expect(result.items.length).toBeGreaterThanOrEqual(4);
      expect(new Set(result.items.map((item) => item.code)).size).toBe(result.items.length);
      expect(result.items.every((item) => itemCodes.includes(item.code) && validPackingItemReason(item.code, item.reason, reasons))).toBe(true);
    }, 30_000);
  }
});
