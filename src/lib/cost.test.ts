import { describe, expect, it } from "vitest";
import { places } from "@/lib/catalog";
import { placeMatches } from "@/lib/catalog";
import { priceBreakdown } from "@/lib/cost";
import { packingInputSchema, tripIntentSchema } from "@/lib/schemas";

describe("NaiVerse source and price invariants", () => {
  it("keeps all 36 initial entries and distinguishes mapped venue features from verified entrances", () => {
    expect(places).toHaveLength(36);
    expect(places.every((place) => (place.latitude === null) === (place.longitude === null))).toBe(true);
    const mappedFeatures = places.filter((place) => place.coordinatePrecision === "venue_feature");
    expect(mappedFeatures).toHaveLength(10);
    expect(mappedFeatures.map((place) => place.id)).toContain("amazing-bay");
    expect(mappedFeatures.map((place) => place.id)).toContain("chua-chan");
    expect(places.filter((place) => place.coordinatePrecision === "entrance_verified")).toHaveLength(0);
    expect(places.every((place) => place.latitude === null || (place.coordinateEvidence?.url?.includes("openstreetmap.org/") && place.coordinatePrecision === "venue_feature"))).toBe(true);
  });

  it("keeps missing ticket costs unknown instead of presenting a free visit", () => {
    const breakdown = priceBreakdown(places.slice(0, 2));
    expect(breakdown.knownSubtotalVnd).toBeNull();
    expect(breakdown.unknownCount).toBe(2);
    expect(breakdown.lines.every((line) => line.amountVnd === null && line.status === "unknown")).toBe(true);
  });

  it("keeps Dao O in reference-only paused status", () => {
    expect(places.find((place) => place.id === "dao-o-dong-truong")?.status).toBe("paused_reference");
  });

  it("matches Vietnamese place aliases without accent marks", () => {
    const amazingBay = places.find((place) => place.id === "amazing-bay")!;
    expect(placeMatches(amazingBay, "vinh ky dieu")).toBe(true);
  });

  it("requires a safe, bounded bilingual trip intent", () => {
    const valid = {
      durationDays: 2, partySize: 3, travelDate: "2026-12-01", transport: "car", budgetVnd: 3_000_000,
      interests: ["nature"], regions: [], requiredPlaceIds: ["amazing-bay"], childHeightCm: 120,
      lowMobility: false, rainyDay: true, missingInformation: [],
    };
    expect(tripIntentSchema.safeParse(valid).success).toBe(true);
    expect(tripIntentSchema.safeParse({ ...valid, transport: "bicycle" }).success).toBe(true);
    expect(tripIntentSchema.safeParse({ ...valid, partySize: 41 }).success).toBe(false);
    expect(tripIntentSchema.safeParse({ ...valid, transport: "helicopter" }).success).toBe(false);
    expect(packingInputSchema.safeParse({
      locale: "en", consent: true, durationDays: 1, partySize: 3, transport: "bicycle",
      interests: ["nature"], childHeightCm: null, lowMobility: false, rainyDay: false, placeIds: ["tri-an"],
    }).success).toBe(true);
  });
});
