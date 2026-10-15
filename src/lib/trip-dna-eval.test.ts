import { describe, expect, it } from "vitest";
import { tripDnaEvalCases } from "@/lib/trip-dna-eval-cases";

describe("Trip DNA evaluation set", () => {
  it("has 60 unique bilingual cases split into 40 development and 20 held-out", () => {
    expect(tripDnaEvalCases).toHaveLength(60);
    expect(new Set(tripDnaEvalCases.map((item) => item.id)).size).toBe(60);
    expect(tripDnaEvalCases.filter((item) => item.split === "development")).toHaveLength(40);
    expect(tripDnaEvalCases.filter((item) => item.split === "holdout")).toHaveLength(20);
    expect(tripDnaEvalCases.filter((item) => item.locale === "vi")).toHaveLength(30);
    expect(tripDnaEvalCases.filter((item) => item.locale === "en")).toHaveLength(30);
    expect(tripDnaEvalCases.filter((item) => item.split === "holdout" && item.locale === "vi")).toHaveLength(10);
    expect(tripDnaEvalCases.filter((item) => item.split === "holdout" && item.locale === "en")).toHaveLength(10);
    expect(tripDnaEvalCases.every((item) => item.prompt.length >= 12 && Object.keys(item.expected).length >= 7)).toBe(true);
  });
});
