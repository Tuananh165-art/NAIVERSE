import { describe, expect, it } from "vitest";
import { getCatalogEvidenceCoverage } from "@/lib/catalog-coverage";

describe("catalog evidence coverage", () => {
  it("counts only approved evidence and requires both coordinates for a verified entrance", () => {
    const coverage = getCatalogEvidenceCoverage(
      [
        { id: "park", name: "Park", name_en: "Park", is_group: false, latitude: 10, longitude: 106, coordinate_precision: "entrance_verified" },
        { id: "orchards", name: "Orchards", name_en: "Orchards", is_group: true, latitude: null, longitude: null, coordinate_precision: null },
      ],
      [{ place_id: "park", approved: true }, { place_id: "orchards", approved: false }],
      [{ place_id: "park", status: "unknown", approved: true }],
      [{ place_id: "park", status: "historical", approved: true }],
    );

    expect(coverage.photos).toEqual({ covered: 1, total: 2 });
    expect(coverage.entrances).toEqual({ covered: 1, total: 1 });
    expect(coverage.hours).toEqual({ covered: 1, verified: 0, total: 2 });
    expect(coverage.prices).toEqual({ covered: 1, verified: 0, total: 2 });
    expect(coverage.incomplete).toEqual([{ id: "orchards", name: "Orchards", nameEn: "Orchards", gaps: ["photo", "hours", "price"] }]);
  });

  it("does not count a feature point or a partial coordinate pair as a verified entrance", () => {
    const coverage = getCatalogEvidenceCoverage(
      [
        { id: "feature", name: "Feature", name_en: "Feature", is_group: false, latitude: 10, longitude: 106, coordinate_precision: "venue_feature" },
        { id: "partial", name: "Partial", name_en: "Partial", is_group: false, latitude: 10, longitude: null, coordinate_precision: "entrance_verified" },
      ], [], [], [],
    );

    expect(coverage.entrances).toEqual({ covered: 0, total: 2 });
    expect(coverage.incomplete.every((place) => place.gaps.includes("entrance"))).toBe(true);
  });
});
