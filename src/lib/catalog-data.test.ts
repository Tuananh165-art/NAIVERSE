import { beforeEach, describe, expect, it, vi } from "vitest";
import { places } from "@/lib/catalog";

const { createSupabaseServerClient } = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

describe("destination evidence coverage", () => {
  it("has sourced, licensed photos for named destinations and does not use them as current-state claims", () => {
    const withPhotos = places.filter((place) => place.photos.length > 0);
    expect(places).toHaveLength(36);
    expect(withPhotos.map((place) => place.id).sort()).toEqual([
      "ba-chong-rocks", "ba-ra-mountain", "buu-long", "cat-tien", "chua-chan", "dao-o-dong-truong", "giang-dien-waterfall", "suoimo", "la-nga-glamping",
      "bo-cap-vang", "bu-gia-map", "bu-lach-grassland", "dong-nai-museum", "ma-da-reserve", "nguyen-huu-canh-temple", "soc-bom-bo", "ta-lai", "thac-mai-bau-nuoc-soi", "thac-mo-lake", "tran-bien-temple-of-literature", "tri-an-lake", "war-zone-d",
    ].sort());
    expect(withPhotos.reduce((sum, place) => sum + place.photos.length, 0)).toBe(29);
    expect(places.find((place) => place.id === "dong-nai-museum")?.photos[0]).toMatchObject({ credit: "Hoangkid", license: "CC BY-SA 4.0", archival: true });
    expect(places.find((place) => place.id === "bo-cap-vang")?.photos[0]).toMatchObject({ credit: "Prenn", license: "CC BY-SA 3.0", archival: true });
    expect(places.find((place) => place.id === "bu-lach-grassland")?.photos[0]).toMatchObject({ credit: "Lam Tr Th", license: "CC BY-SA 3.0", archival: true });
    expect(places.find((place) => place.id === "war-zone-d")?.photos[0]).toMatchObject({ credit: "Lam Tr Th", license: "CC BY-SA 3.0", archival: true });
    expect(places.find((place) => place.id === "war-zone-d")?.photos[1]).toMatchObject({ credit: "Phương Huy", license: "CC BY-SA 4.0", archival: true });
    expect(places.find((place) => place.id === "war-zone-d")?.photos[1].sourceUrl).toContain("rừng_Mã_Đà");
    expect(places.find((place) => place.id === "ma-da-reserve")?.photos[0]).toMatchObject({ credit: "Phương Huy", license: "CC BY-SA 4.0", archival: true });
    expect(places.find((place) => place.id === "ma-da-reserve")?.photos[0].altVi).toContain("không thể hiện cổng vào");
    expect(places.find((place) => place.id === "thac-mo-lake")?.photos[0]).toMatchObject({ credit: "Lam Tr Th", license: "CC BY-SA 3.0", archival: true });
    expect(places.find((place) => place.id === "soc-bom-bo")?.photos[0]).toMatchObject({ credit: "Kieprongbuon812", license: "CC BY-SA 4.0", archival: true });
    expect(places.find((place) => place.id === "bu-gia-map")?.photos[0]).toMatchObject({ credit: "TuanUt", license: "CC BY-SA 3.0", archival: true });
    expect(places.find((place) => place.id === "la-nga-glamping")?.photos[0]).toMatchObject({ credit: "Lam Tr Th", license: "CC BY-SA 3.0", archival: true });
    expect(places.find((place) => place.id === "la-nga-glamping")?.photos[0].altEn).toContain("not a lodging property photo");
    const baRaPhoto = places.find((place) => place.id === "ba-ra-mountain")?.photos[0];
    expect(baRaPhoto).toMatchObject({ credit: "Scope72", license: "CC BY-SA 4.0", archival: true });
    expect(baRaPhoto?.sourceUrl).toContain("Thac_Mo_-_Nui_Ba_Ra");
    const baChongPhoto = places.find((place) => place.id === "ba-chong-rocks")?.photos[0];
    expect(baChongPhoto).toMatchObject({ credit: "MinhVN123", license: "CC BY-SA 4.0", archival: true });
    const tranBienGatePhoto = places.find((place) => place.id === "tran-bien-temple-of-literature")?.photos[2];
    expect(tranBienGatePhoto).toMatchObject({ credit: "Thuydaonguyen", license: "CC BY-SA 3.0", archival: true });
    expect(tranBienGatePhoto?.altEn).toContain("Main gate");
    const catTienPhotos = places.find((place) => place.id === "cat-tien")?.photos ?? [];
    expect(catTienPhotos).toHaveLength(2);
    expect(catTienPhotos[1]).toMatchObject({ credit: "1April1950", license: "CC BY-SA 4.0", archival: true });
    expect(catTienPhotos[1].sourceUrl).toContain("Cat_Tien_Nat_Park_B_2021-11-06");
    expect(places.find((place) => place.id === "suoimo")?.photos[0]).toMatchObject({
      credit: "Chàng Trai Nông Thôn",
      license: "Pexels License",
      sourceUrl: "https://www.pexels.com/photo/aerial-shot-of-a-nature-resort-11096564/",
      licenseUrl: "https://www.pexels.com/license/",
    });
    for (const place of withPhotos) {
      for (const photo of place.photos) {
        expect(photo.url).toMatch(/^https:\/\//);
        expect(photo.sourceUrl).toMatch(/^https:\/\//);
        expect(photo.licenseUrl).toMatch(/^https:\/\//);
        expect(photo.credit.length).toBeGreaterThan(1);
      }
    }
  });

  it("keeps OSM feature coordinates distinct from surveyed entrances", () => {
    const mapped = places.filter((place) => place.coordinatePrecision === "venue_feature");
    expect(mapped).toHaveLength(10);
    expect(mapped.every((place) => place.coordinateEvidence?.url?.includes("openstreetmap.org/") && place.coordinateEvidence.label.includes("không đại diện cổng vào"))).toBe(true);
    expect(places.find((place) => place.id === "amazing-bay")).toMatchObject({ latitude: 10.87485, longitude: 106.87036, coordinatePrecision: "venue_feature" });
    expect(places.find((place) => place.id === "chua-chan")).toMatchObject({ latitude: 10.94111, longitude: 107.37937, coordinatePrecision: "venue_feature" });
    expect(places.filter((place) => place.coordinatePrecision === "entrance_verified")).toHaveLength(0);
  });
});

describe("public source fallbacks", () => {
  beforeEach(() => createSupabaseServerClient.mockReset());

  it("keeps static photo sources visible when Supabase has an empty media table", async () => {
    const source = places.find((place) => place.id === "tran-bien-temple-of-literature")!;
    const placeRow = {
      id: source.id, name: source.name, name_en: source.nameEn, aliases: source.aliases,
      region: source.region, region_en: source.regionEn, category: source.category,
      description: source.description, description_en: source.descriptionEn,
      status: source.status, status_note: source.statusNote, status_note_en: source.statusNoteEn,
      latitude: source.latitude, longitude: source.longitude, coordinate_precision: source.coordinatePrecision,
      coordinate_source_url: source.coordinateEvidence?.url ?? null,
      coordinate_source_label: source.coordinateEvidence?.label ?? null,
      coordinate_checked_at: source.coordinateEvidence?.checkedAt ?? null,
      website: source.website, evidence: source.evidence, is_group: source.isGroup,
    };
    const query = (result: { data: unknown; error: null }) => {
      const builder = {
        eq: () => builder,
        order: async () => result,
        then: (resolve: (value: typeof result) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result).then(resolve, reject),
      };
      return { select: () => builder };
    };
    createSupabaseServerClient.mockResolvedValue({ from: (table: string) => table === "places"
      ? query({ data: [placeRow], error: null })
      : query({ data: [], error: null }) });

    const { getPlaceCatalog } = await import("@/lib/catalog-server");
    const loaded = await getPlaceCatalog();
    expect(loaded[0].photos).toHaveLength(3);
    expect(loaded[0].photos[0].sourceUrl).toContain("commons.wikimedia.org");
  });

  it("shows sourced Cat Tien and Suoi Mo prices and labels Buu Long prices as historical without Supabase", async () => {
    createSupabaseServerClient.mockResolvedValue(null);
    const { getPlacePriceReferences } = await import("@/lib/catalog-server");
    const catTien = await getPlacePriceReferences("cat-tien");
    const buuLong = await getPlacePriceReferences("buu-long");
    const suoiMo = await getPlacePriceReferences("suoimo");
    expect(catTien).toHaveLength(4);
    expect(catTien.every((price) => price.status === "verified" && price.amount_vnd !== null)).toBe(true);
    expect(buuLong).toHaveLength(11);
    expect(buuLong.every((price) => price.status === "historical")).toBe(true);
    const aprilEventPrices = buuLong.filter((price) => price.checked_at === "2026-04-26");
    expect(aprilEventPrices.map((price) => price.amount_vnd)).toEqual([150_000, 60_000, 0]);
    expect(aprilEventPrices.every((price) => price.source_url?.includes("dongnai.gov.vn/"))).toBe(true);
    const summerReportPrices = buuLong.filter((price) => price.checked_at === "2026-08-07");
    expect(summerReportPrices).toHaveLength(5);
    expect(summerReportPrices.every((price) => price.status === "historical" && price.source_url?.includes("baodongnai.com.vn/giai-tri/202608/"))).toBe(true);
    expect(summerReportPrices.find((price) => price.id === "buu-long-summer-child-game-promo-2026")).toMatchObject({ amount_vnd: 30_000, valid_to: "2026-08-31" });
    expect(suoiMo).toHaveLength(5);
    expect(suoiMo.every((price) => price.status === "verified" && price.checked_at === "2026-10-15")).toBe(true);
    expect(suoiMo.map((price) => price.amount_vnd)).toEqual([130_000, 150_000, 60_000, 70_000, 0]);
    expect(suoiMo.every((price) => price.source_url?.includes("suoimopark.com/uploads/BANG%20GIA/"))).toBe(true);
  });

  it("shows operator-published night-ticket prices for Son Tien Amazing World with eligibility caveat", async () => {
    createSupabaseServerClient.mockResolvedValue(null);
    const { getPlacePriceReferences } = await import("@/lib/catalog-server");
    const prices = await getPlacePriceReferences("son-tien-amazing-world");
    expect(prices).toHaveLength(2);
    expect(prices.map((price) => price.amount_vnd)).toEqual([45_000, 90_000]);
    expect(prices.every((price) => price.status === "verified" && price.checked_at === "2026-10-15")).toBe(true);
    expect(prices.every((price) => price.source_url === "https://www.sontien.com/products/tham-quan-amazing-world")).toBe(true);
    expect(prices.find((price) => price.audience.startsWith("Trẻ em"))?.terms).toContain("chưa nêu tiêu chí tuổi/chiều cao");
  });

  it("keeps the Amazing Bay child-price disagreement out of current-price calculations", async () => {
    createSupabaseServerClient.mockResolvedValue(null);
    const { getPlacePriceReferences } = await import("@/lib/catalog-server");
    const prices = await getPlacePriceReferences("amazing-bay");
    const childPrices = prices.filter((price) => price.item_label === "Vé trọn gói The Amazing Bay" && price.audience.startsWith("Trẻ em cao từ 1 m"));

    expect(childPrices.map((price) => [price.amount_vnd, price.status])).toEqual([
      [270_000, "conflicting"],
      [279_000, "conflicting"],
    ]);
    expect(childPrices.map((price) => price.source_url)).toEqual([
      "https://www.sontien.com/blogs/faq",
      "https://amazingbay.vn/huong-dan-dat-ve-online-tai-the-amazing-bay-vinh-ky-dieu/",
    ]);
    expect(prices.find((price) => price.id === "amazing-bay-adult-price-2026-10")?.status).toBe("verified");
  });

  it("shows Buu Long's reported hours as unverified and retains the venue source", async () => {
    createSupabaseServerClient.mockResolvedValue(null);
    const { getPlaceHours } = await import("@/lib/catalog-server");
    const hours = await getPlaceHours("buu-long");
    expect(hours).toHaveLength(7);
    expect(hours.every((entry) => entry.status === "unknown" && entry.source_url === "https://baodongnai.com.vn/giai-tri/202608/khu-du-lich-buu-long-duy-tri-uu-dai-mua-he-den-het-thang-8-0c5211b/")).toBe(true);
    expect(hours.every((entry) => entry.checked_at === "2026-08-07" && entry.note_en.includes("Not reconfirmed since publication"))).toBe(true);
    expect(hours.find((entry) => entry.weekday === 2)).toMatchObject({ opens_local: null, closes_local: null });
    expect(hours.find((entry) => entry.weekday === 1)).toMatchObject({ opens_local: "07:00:00", closes_local: "17:00:00" });
  });

  it("shows Amazing Bay's operator-published weekly hours with holiday caveat", async () => {
    createSupabaseServerClient.mockResolvedValue(null);
    const { getPlaceHours } = await import("@/lib/catalog-server");
    const hours = await getPlaceHours("amazing-bay");
    expect(hours).toHaveLength(7);
    expect(hours.every((entry) => entry.status === "verified" && entry.opens_local === "09:00:00" && entry.closes_local === "17:00:00")).toBe(true);
    expect(hours.every((entry) => entry.source_url === "https://www.sontien.com/products/ve-cong-vien-nuoc-vinh-ky-dieu-the-amazing-bay" && entry.checked_at === "2026-10-15")).toBe(true);
    expect(hours.every((entry) => entry.note_en.includes("09:00–17:00"))).toBe(true);
    expect(hours[0].note).toContain("Giờ ngày lễ có thể khác");
  });

  it("shows the museum's published but stale visiting schedule as unverified", async () => {
    createSupabaseServerClient.mockResolvedValue(null);
    const { getPlaceHours } = await import("@/lib/catalog-server");
    const hours = await getPlaceHours("dong-nai-museum");
    expect(hours).toHaveLength(7);
    expect(hours.every((entry) => entry.status === "unknown" && entry.opens_local === null && entry.closes_local === null)).toBe(true);
    expect(hours.every((entry) => entry.source_url === "https://www.baotangdongnai.com.vn/gio-mo-cua" && entry.checked_at === "2026-10-15")).toBe(true);
    expect(hours[0].note).toContain("07:00–11:00");
    expect(hours[0].note).toContain("13:30–17:00");
    expect(hours[0].note).toContain("18/12/2023");
    expect(hours[0].note_en).toContain("18 Dec 2023");
  });

  it("shows Suoi Mo's directory hours as reported and unverified", async () => {
    createSupabaseServerClient.mockResolvedValue(null);
    const { getPlaceHours } = await import("@/lib/catalog-server");
    const hours = await getPlaceHours("suoimo");
    expect(hours).toHaveLength(7);
    expect(hours.every((entry) => entry.status === "unknown" && entry.opens_local === "07:30:00" && entry.closes_local === "17:00:00")).toBe(true);
    expect(hours.every((entry) => entry.source_url === "https://www.viet-biz.com/c%C3%B4ng-vi%C3%AAn-su%E1%BB%91i-m%C6%A1_5d-0251-6270-777")).toBe(true);
    expect(hours.every((entry) => entry.note_en.includes("not an operator confirmation"))).toBe(true);
  });
});
