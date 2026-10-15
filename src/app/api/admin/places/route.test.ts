import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => mocks);

import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/admin/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function configureAdmin() {
  const inserts: Array<{ table: string; rows: unknown }> = [];
  const from = vi.fn((table: string) => {
    const query: Record<string, unknown> = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.maybeSingle = vi.fn(async () => table === "platform_admins"
      ? { data: { user_id: "admin-1" }, error: null }
      : { data: { id: "cat-tien" }, error: null });
    query.insert = vi.fn((rows: unknown) => { inserts.push({ table, rows }); return query; });
    query.single = vi.fn(async () => ({ data: { id: "media-1", place_id: "cat-tien", approved: false }, error: null }));
    return query;
  });
  mocks.getCurrentUser.mockResolvedValue({ id: "admin-1" });
  mocks.createSupabaseServerClient.mockResolvedValue({ from });
  return { from, inserts };
}

describe("POST /api/admin/places evidence records", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires an authenticated platform administrator", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await POST(request({ type: "media" }));
    expect(response).toBeDefined();
    expect(response!.status).toBe(401);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("saves sourced photo metadata as pending, never public by default", async () => {
    const { inserts } = configureAdmin();
    const response = await POST(request({
      type: "media", placeId: "cat-tien", imageUrl: "https://images.example/photo.jpg",
      altVi: "Ảnh rừng tại Vườn quốc gia Cát Tiên", altEn: "Forest in Cat Tien National Park",
      credit: "Photographer", sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      checkedAt: "2026-10-15", isArchival: true,
    }));
    expect(response).toBeDefined();
    expect(response!.status).toBe(201);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].table).toBe("place_media");
    expect(inserts[0].rows).toMatchObject({ approved: false, is_archival: true, license: "CC BY-SA 4.0" });
  });

  it("rejects verified price data without dated source evidence", async () => {
    const { from, inserts } = configureAdmin();
    const response = await POST(request({
      type: "price", placeId: "cat-tien", itemLabel: "Entry ticket", audience: "Adult",
      amountVnd: 50000, status: "verified", sourceUrl: null, sourceLabel: "No source", checkedAt: null,
      terms: "",
    }));
    expect(response).toBeDefined();
    expect(response!.status).toBe(400);
    expect(from).not.toHaveBeenCalledWith("price_references");
    expect(inserts).toHaveLength(0);
  });

  it("accepts one general, source-backed hours record without inventing weekdays", async () => {
    const { inserts } = configureAdmin();
    const response = await POST(request({
      type: "hours", placeId: "giang-dien-waterfall", weekdays: [-1],
      opensLocal: "07:30", closesLocal: "17:00", status: "unknown",
      note: "Giờ chung do nhà vận hành công bố; chưa rõ ngoại lệ từng ngày.",
      noteEn: "General operator-published hours; weekday exceptions are unspecified.",
      sourceUrl: "https://giangdien.vn/san-pham/leu-san-a/",
      sourceLabel: "Official operator product page", checkedAt: "2026-10-15",
    }));

    expect(response).toBeDefined();
    expect(response!.status).toBe(201);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].table).toBe("place_hours");
    expect(inserts[0].rows).toMatchObject([{ weekday: -1, status: "unknown", approved: false }]);
  });

  it("rejects mixing general hours with weekday-specific entries", async () => {
    configureAdmin();
    const response = await POST(request({
      type: "hours", placeId: "giang-dien-waterfall", weekdays: [-1, 1],
      opensLocal: "07:30", closesLocal: "17:00", status: "unknown",
      note: "General hours.", noteEn: "General hours.", sourceUrl: null, sourceLabel: "Directory", checkedAt: null,
    }));
    expect(response).toBeDefined();
    expect(response!.status).toBe(400);
  });

  it("does not accept client attempts to mark new media public", async () => {
    const { from } = configureAdmin();
    const response = await POST(request({
      type: "media", placeId: "cat-tien", imageUrl: "https://images.example/photo.jpg",
      altVi: "Ảnh rừng tại Vườn quốc gia Cát Tiên", altEn: "Forest in Cat Tien National Park",
      credit: "Photographer", sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      checkedAt: "2026-10-15", isArchival: false, approved: true,
    }));
    expect(response).toBeDefined();
    expect(response!.status).toBe(400);
    expect(from).not.toHaveBeenCalledWith("place_media");
  });
});
