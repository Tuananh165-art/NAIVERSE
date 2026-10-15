import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/route", () => ({
  getDrivingRoute: vi.fn(async () => ({
    distanceKm: 10,
    durationMinutes: 20,
    geometry: [[10.8, 106.8], [10.9, 106.9]],
  })),
}));

import { buildPlans } from "@/lib/planner";
import { getDrivingRoute } from "@/lib/route";
import type { Place } from "@/lib/catalog";
import type { TripIntent } from "@/lib/schemas";

const intent: TripIntent = {
  durationDays: 1,
  partySize: 2,
  travelDate: null,
  transport: "car",
  budgetVnd: null,
  interests: ["nature"],
  regions: [],
  requiredPlaceIds: ["feature-a", "feature-b"],
  childHeightCm: null,
  lowMobility: false,
  rainyDay: false,
  missingInformation: [],
};

function place(id: string, coordinatePrecision: Place["coordinatePrecision"]): Place {
  return {
    id,
    name: id,
    nameEn: id,
    aliases: [],
    region: "Đồng Nai",
    regionEn: "Dong Nai",
    category: "nature",
    description: "Nature site",
    descriptionEn: "Nature site",
    status: "reference",
    statusNote: "Reference",
    statusNoteEn: "Reference",
    latitude: 10.8,
    longitude: id === "feature-a" ? 106.8 : 106.9,
    coordinatePrecision,
    coordinateEvidence: {
      label: "OpenStreetMap mapped feature",
      url: `https://www.openstreetmap.org/node/${id === "feature-a" ? "1" : "2"}`,
      checkedAt: "2026-10-15",
    },
    website: null,
    evidence: [],
    photos: [],
    isGroup: false,
  };
}

describe("buildPlans automatic driving routes", () => {
  beforeEach(() => vi.mocked(getDrivingRoute).mockClear());

  it("does not route to OSM feature points that are not verified entrances", async () => {
    const options = await buildPlans(intent, "nature trip", [
      place("feature-a", "venue_feature"),
      place("feature-b", "venue_feature"),
    ]);

    expect(options.every((option) => option.route === null)).toBe(true);
    expect(options.every((option) => option.warnings.some((warning) => warning.includes("cổng vào đã xác minh")))).toBe(true);
    expect(getDrivingRoute).not.toHaveBeenCalled();
  });

  it("routes only when every selected stop has a verified entrance", async () => {
    const options = await buildPlans(intent, "nature trip", [
      place("feature-a", "entrance_verified"),
      place("feature-b", "entrance_verified"),
    ]);

    expect(options.every((option) => option.route?.distanceKm === 10)).toBe(true);
    expect(getDrivingRoute).toHaveBeenCalledTimes(3);
    expect(options.every((option) => !option.warnings.some((warning) => warning.includes("cổng vào đã xác minh")))).toBe(true);
  });
});
