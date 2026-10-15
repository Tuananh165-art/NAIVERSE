import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => null,
}));

import { getPlaceHours, getPlacePriceReferences } from "@/lib/catalog-server";

describe("Giang Dien source-backed fallback price notes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps undated camping prices unconfirmed and verifies only the current operator listing", async () => {
    const prices = await getPlacePriceReferences("giang-dien-waterfall");

    expect(prices).toHaveLength(11);
    expect(prices.filter((price) => price.status === "unknown")).toHaveLength(10);
    expect(prices.every((price) => price.valid_from === null && price.valid_to === null)).toBe(true);
    const sourceSheetNotes = prices.filter((price) => price.status === "unknown");
    expect(sourceSheetNotes.every((price) => price.source_url?.startsWith("https://giangdien.vn/wp-content/uploads/2024/08/"))).toBe(true);
    expect(prices.find((price) => price.id.endsWith("combo-01"))).toMatchObject({ amount_vnd: 449_000, status: "verified", source_url: "https://giangdien.vn/san-pham/leu-san-a/" });
    expect(prices.find((price) => price.id.endsWith("camping-hourly"))?.amount_vnd).toBe(180_000);
    expect(sourceSheetNotes.every((price) => price.terms.includes("không ghi ngày"))).toBe(true);
  });

  it("shows operator-reported general hours without inventing a weekday schedule", async () => {
    const hours = await getPlaceHours("giang-dien-waterfall");

    expect(hours).toHaveLength(1);
    expect(hours[0]).toMatchObject({
      weekday: -1,
      opens_local: "07:30:00",
      closes_local: "17:00:00",
      status: "unknown",
      source_url: "https://giangdien.vn/san-pham/leu-san-a/",
    });
    expect(hours[0].note).toContain("không nêu lịch/ngoại lệ theo từng ngày");
  });
});
