import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn(async () => null) }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { getPlaceCatalog, getPlaceHours, getPlacePriceReferences } from "@/lib/catalog-server";
import { places } from "@/lib/catalog";

beforeEach(() => {
  mocks.createSupabaseServerClient.mockReset().mockResolvedValue(null);
});

describe("database and local catalog merging", () => {
  it("retains user-granted local photos alongside approved DB photos and deduplicates sources", async () => {
    const sourcePlace = places.find((place) => place.id === "bu-lach-grassland");
    expect(sourcePlace).toBeTruthy();
    const sourcePhoto = sourcePlace!.photos[1];
    const bilingualEvidence = { label: "Nguồn kiểm tra mẫu", labelEn: "Sample verification source", url: "https://example.test/source", checkedAt: "2026-10-16" };
    const databasePlace = {
      id: sourcePlace!.id, name: sourcePlace!.name, name_en: sourcePlace!.nameEn, aliases: sourcePlace!.aliases,
      region: sourcePlace!.region, region_en: sourcePlace!.regionEn, category: sourcePlace!.category,
      description: sourcePlace!.description, description_en: sourcePlace!.descriptionEn, status: sourcePlace!.status,
      status_note: sourcePlace!.statusNote, status_note_en: sourcePlace!.statusNoteEn,
      latitude: sourcePlace!.latitude, longitude: sourcePlace!.longitude, website: sourcePlace!.website,
      evidence: [...sourcePlace!.evidence, sourcePlace!.evidence[0], bilingualEvidence], is_group: sourcePlace!.isGroup,
      coordinate_precision: null, coordinate_source_url: null, coordinate_source_label: null, coordinate_checked_at: null,
    };
    const databasePhoto = {
      place_id: sourcePlace!.id, image_url: sourcePhoto.url.startsWith("https://") ? sourcePhoto.url : "https://example.test/archive.jpg",
      alt_vi: sourcePhoto.altVi, alt_en: sourcePhoto.altEn, credit: sourcePhoto.credit,
      source_url: sourcePhoto.sourceUrl, license: sourcePhoto.license, license_url: sourcePhoto.licenseUrl,
      checked_at: sourcePhoto.checkedAt, is_archival: sourcePhoto.archival,
    };
    const supabase = {
      from: (table: string) => table === "places"
        ? { select: () => ({ eq: () => ({ order: async () => ({ data: [databasePlace], error: null }) }) }) }
        : { select: () => ({ eq: async () => ({ data: [databasePhoto], error: null }) }) },
    };
    mocks.createSupabaseServerClient.mockImplementation(async () => supabase as never);

    const catalog = await getPlaceCatalog();
    const result = catalog.find((place) => place.id === sourcePlace!.id);

    expect(result?.photos.some((photo) => photo.url === "/images/places/bu-lach-grassland.jpg")).toBe(true);
    expect(result?.photos.filter((photo) => photo.sourceUrl === sourcePhoto.sourceUrl)).toHaveLength(1);
    expect(result?.evidence.filter((entry) => entry.label === sourcePlace!.evidence[0].label && entry.url === sourcePlace!.evidence[0].url)).toHaveLength(1);
    expect(result?.evidence.find((entry) => entry.url === bilingualEvidence.url)?.labelEn).toBe("Sample verification source");
  });
});

describe("Giang Dien source-backed fallback price notes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps undated camping prices unconfirmed and verifies only the current operator listing", async () => {
    const prices = await getPlacePriceReferences("giang-dien-waterfall");

    expect(prices).toHaveLength(12);
    expect(prices.filter((price) => price.status === "unknown")).toHaveLength(11);
    expect(prices.every((price) => price.valid_from === null && price.valid_to === null)).toBe(true);
    const sourceSheetNotes = prices.filter((price) => price.status === "unknown");
    const undatedPriceSheetNotes = sourceSheetNotes.filter((price) => price.id.startsWith("giang-dien-waterfall-") && price.source_url?.includes("/uploads/2024/08/"));
    expect(undatedPriceSheetNotes).toHaveLength(9);
    expect(undatedPriceSheetNotes.every((price) => price.source_url?.startsWith("https://giangdien.vn/wp-content/uploads/2024/08/"))).toBe(true);
    expect(prices.find((price) => price.id.endsWith("combo-01"))).toMatchObject({ amount_vnd: 449_000, status: "verified", source_url: "https://giangdien.vn/san-pham/leu-san-a/" });
    expect(prices.find((price) => price.id.endsWith("combo-03"))).toMatchObject({
      amount_vnd: 599_000,
      status: "unknown",
      audience: "Đơn vị tính và sức chứa không được nêu",
      source_url: "https://giangdien.vn/san-pham/leu-san-b-combo3/",
    });
    const combo03 = prices.find((price) => price.id.endsWith("combo-03"));
    expect(combo03?.terms).toContain("không nêu ngày hiệu lực ưu đãi, đơn vị tính hay sức chứa");
    expect(combo03?.terms).toContain("không cộng vào tổng chi phí");
    expect(prices.find((price) => price.id.endsWith("camping-hourly"))?.amount_vnd).toBe(180_000);
    expect(undatedPriceSheetNotes.every((price) => price.terms.includes("không ghi ngày"))).toBe(true);
  });

  it("shows operator-reported general hours without inventing a weekday schedule", async () => {
    const hours = await getPlaceHours("giang-dien-waterfall");

    expect(hours).toHaveLength(4);
    expect(hours[0]).toMatchObject({
      weekday: -1,
      opens_local: "07:30:00",
      closes_local: "17:00:00",
      status: "unknown",
      source_url: "https://giangdien.vn/san-pham/leu-san-a/",
    });
    expect(hours[0].note).toContain("không nêu lịch/ngoại lệ theo từng ngày");
    expect(hours.find((entry) => entry.id === "giang-dien-hoa-su-restaurant-hours-2026-10")).toMatchObject({
      weekday: -1,
      opens_local: "08:00:00",
      closes_local: "21:00:00",
      status: "verified",
      source_url: "https://giangdien.vn/nha-hang/nha-hang-hoa-su/",
    });
    expect(hours.find((entry) => entry.id === "giang-dien-hoang-yen-restaurant-hours-2026-10")).toMatchObject({
      weekday: -1,
      opens_local: "08:00:00",
      closes_local: "17:00:00",
      status: "unknown",
      source_url: "https://giangdien.vn/nha-hang/nha-hang-hoang-yen/",
    });
    expect(hours.find((entry) => entry.id === "giang-dien-tre-xanh-hotel-hours-2026-10")).toMatchObject({
      weekday: -1,
      opens_local: null,
      closes_local: null,
      status: "unknown",
      source_url: "https://giangdien.vn/san-pham/leu-a/",
    });
    expect(hours.find((entry) => entry.id === "giang-dien-hoa-su-restaurant-hours-2026-10")?.note).toContain("không phải giờ mở cổng");
  });

  it("shows the hotel product's displayed nightly price without treating it as a confirmed quote", async () => {
    const prices = await getPlacePriceReferences("giang-dien-waterfall");
    const hotel = prices.find((price) => price.id === "giang-dien-waterfall-hotel-tre-xanh-price-2026-10");

    expect(hotel).toMatchObject({
      amount_vnd: 550_000,
      status: "unknown",
      source_url: "https://giangdien.vn/san-pham/leu-a/",
    });
    expect(hotel?.terms).toContain("không được cộng vào tổng chi phí");
  });
});

describe("Amazing Bay source-backed prices", () => {
  it("uses the operator ticket page and preserves the child-price conflict", async () => {
    const prices = await getPlacePriceReferences("amazing-bay");
    const operatorPage = "https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay";
    const adult = prices.find((price) => price.audience === "Người lớn (trên 1,4 m)");
    const childPrices = prices.filter((price) => price.audience === "Trẻ em cao từ 1 m đến dưới 1,4 m");

    expect(adult).toMatchObject({ amount_vnd: 490_000, status: "verified", source_url: operatorPage });
    expect(childPrices.map((price) => price.amount_vnd).sort()).toEqual([270_000, 279_000]);
    expect(childPrices.every((price) => price.status === "conflicting")).toBe(true);
    expect(childPrices.some((price) => price.source_url === operatorPage)).toBe(true);
  });
});

describe("Suoi Mo official 2026 ticket prices", () => {
  it("uses the current operator table and keeps the replaced 2025 sheet historical", async () => {
    const prices = await getPlacePriceReferences("suoimo");
    const current = prices.filter((price) => price.source_url === "https://suoimopark.com/uploads/BANG%20GIA/2026.pdf");
    const previous = prices.filter((price) => price.source_url === "https://suoimopark.com/uploads/BANG%20GIA/Bang%20Gia%20Suoi%20Mo%202025.pdf");

    expect(current).toHaveLength(5);
    expect(current.map((price) => [price.audience, price.amount_vnd])).toEqual([
      ["Người lớn (T2–CN)", 130_000],
      ["Người lớn (Lễ, Tết)", 150_000],
      ["Trẻ em cao 1 m–1,4 m (T2–CN)", 60_000],
      ["Trẻ em cao 1 m–1,4 m (Lễ, Tết)", 70_000],
      ["Trẻ em dưới 1 m (mọi ngày)", 0],
    ]);
    expect(current.every((price) => price.status === "verified" && price.valid_from === "2026-01-01" && price.checked_at === "2026-10-15")).toBe(true);
    expect(previous).toHaveLength(5);
    expect(previous.every((price) => price.status === "historical" && price.valid_to === "2025-12-31")).toBe(true);
  });
});

describe("Cat Tien operator price schedule", () => {
  it("shows sourced entry and activity fees while keeping variable guide prices unknown", async () => {
    const prices = await getPlacePriceReferences("cat-tien");
    const operatorPdf = "https://cattiennationalpark.com.vn/wp-content/uploads/2024/06/bang-gia-khach-noi-dia-2025.pdf";

    expect(prices).toHaveLength(11);
    expect(prices.every((price) => price.source_url === operatorPdf && price.valid_from === "2024-06-01")).toBe(true);
    expect(prices.find((price) => price.id === "cat-tien-entry-adult")).toMatchObject({ amount_vnd: 60_000, status: "verified" });
    expect(prices.find((price) => price.id === "cat-tien-bau-sau-day")).toMatchObject({ amount_vnd: 250_000, status: "verified" });
    expect(prices.find((price) => price.id === "cat-tien-bau-sau-guide")).toMatchObject({ amount_vnd: null, status: "unknown" });
    expect(prices.find((price) => price.id === "cat-tien-primate-island-adult")?.terms).toContain("08:30");
  });

  it("does not turn tour start slots into park opening hours", async () => {
    await expect(getPlaceHours("cat-tien")).resolves.toEqual([]);
  });
});

describe("Da Han third-party references", () => {
  it("shows the reported schedule and conflicting ticket references without claiming current prices", async () => {
    const prices = await getPlacePriceReferences("da-han-waterfall");
    const hours = await getPlaceHours("da-han-waterfall");

    expect(prices).toHaveLength(1);
    expect(prices[0]).toMatchObject({
      amount_vnd: null,
      status: "conflicting",
      source_url: "https://vietgoing.com/destination/1011-thac-da-han.html",
    });
    expect(prices[0].terms).toContain("50.000/65.000/75.000 ₫");
    expect(prices[0].terms).toContain("không dùng trong tổng chi phí");
    expect(hours).toHaveLength(2);
    expect(hours[0]).toMatchObject({
      weekday: -1,
      opens_local: "07:00:00",
      closes_local: "19:00:00",
      status: "unknown",
      source_url: "https://vietgoing.com/destination/1011-thac-da-han.html",
    });
    expect(hours[0].note).toContain("không phải lịch do nhà vận hành xác nhận");
    expect(hours[1]).toMatchObject({
      weekday: -1,
      opens_local: "07:00:00",
      closes_local: "17:00:00",
      status: "conflicting",
      source_url: "https://www.vietnamairlines.com/go/vi/plan-book/travel/travel-guide/dong-nai-co-gi-choi",
    });
    expect(hours[1].note).toContain("khác với lịch 07:00–19:00");
  });
});
