import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { interpretTrip } from "@/lib/deepseek";
import { tripInputSchema } from "@/lib/schemas";
import { tripDnaEvalCases, type TripDnaEvalCase } from "@/lib/trip-dna-eval-cases";

const requested = process.env.RUN_LIVE_AI_TRIP_DNA_EVAL === "true";
if (requested) process.loadEnvFile(".env");
const enabled = requested && Boolean(process.env.DEEPSEEK_API_KEY);
const requestedSplit = process.env.RUN_LIVE_AI_TRIP_DNA_SPLIT;
if (requestedSplit && requestedSplit !== "development" && requestedSplit !== "holdout") {
  throw new Error("RUN_LIVE_AI_TRIP_DNA_SPLIT must be development or holdout.");
}
const selectedSplit = requestedSplit === "development" ? "development" : "holdout";
const selectedCases = tripDnaEvalCases.filter((item) => item.split === selectedSplit);
const heldoutCases = tripDnaEvalCases.filter((item) => item.split === "holdout");

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function fieldMatches(testCase: TripDnaEvalCase, actual: Awaited<ReturnType<typeof interpretTrip>>, key: keyof TripDnaEvalCase["expected"]): boolean {
  const expected = testCase.expected[key];
  const value: unknown = (actual as unknown as Record<string, unknown>)[key];
  if (key === "interests") return (expected as string[]).every((item) => (value as string[]).includes(item));
  if (key === "regions") return (expected as string[]).every((item) => (value as string[]).some((actualRegion) => normalize(actualRegion).includes(normalize(item))));
  if (key === "transport") {
    const accepted: string[] = expected === "car" || expected === "private_vehicle" ? ["car", "private_vehicle"] : [String(expected)];
    return accepted.includes(value as string);
  }
  return value === expected;
}

describe("Trip DNA evaluation data", () => {
  it("keeps the held-out set evenly divided by language", () => {
    expect(heldoutCases).toHaveLength(20);
    expect(heldoutCases.filter((item) => item.locale === "vi")).toHaveLength(10);
    expect(heldoutCases.filter((item) => item.locale === "en")).toHaveLength(10);
  });
});

describe.skipIf(!enabled)(`DeepSeek Trip DNA ${selectedSplit} evaluation (live, explicit opt-in)`, () => {
  it("meets the 90% field accuracy target without logging prompts or model output", async () => {
    let correct = 0;
    let checked = 0;
    const mismatches: string[] = [];

    for (const testCase of selectedCases) {
      const input = tripInputSchema.parse({ prompt: testCase.prompt, consent: true, locale: testCase.locale });
      const actual = await interpretTrip(input);
      for (const key of Object.keys(testCase.expected) as Array<keyof TripDnaEvalCase["expected"]>) {
        checked += 1;
        if (fieldMatches(testCase, actual, key)) correct += 1;
        else mismatches.push(testCase.id + "." + key);
      }
    }

    const accuracy = checked === 0 ? 0 : correct / checked;
    process.stdout.write("[AI-EVAL] Trip DNA " + selectedSplit + ": " + correct + "/" + checked + " fields; accuracy=" + (accuracy * 100).toFixed(1) + "%; mismatches=" + (mismatches.length ? mismatches.join(",") : "none") + "\n");
    expect(accuracy, selectedSplit + " field accuracy " + (accuracy * 100).toFixed(1) + "%; target 90%; mismatches: " + mismatches.join(", ")).toBeGreaterThanOrEqual(0.9);
  }, 900_000);
});
