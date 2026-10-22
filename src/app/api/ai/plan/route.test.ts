import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  consumeAiAllowance: vi.fn(),
  interpretTrip: vi.fn(),
  buildPlans: vi.fn(),
  getPlaceCatalog: vi.fn(),
  ProviderError: class ProviderError extends Error {
    constructor(readonly code: string, message: string) { super(message); }
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ getCurrentUser: mocks.getCurrentUser, createSupabaseServerClient: mocks.createSupabaseServerClient }));
vi.mock("@/lib/ai-limit", () => ({ consumeAiAllowance: mocks.consumeAiAllowance }));
vi.mock("@/lib/deepseek", () => ({ AiProviderError: mocks.ProviderError, interpretTrip: mocks.interpretTrip }));
vi.mock("@/lib/planner", () => ({ buildPlans: mocks.buildPlans }));
vi.mock("@/lib/catalog-server", () => ({ getPlaceCatalog: mocks.getPlaceCatalog }));

import { POST } from "@/app/api/ai/plan/route";
import { places } from "@/lib/catalog";

function request(body: unknown) {
  return new Request("http://localhost/api/ai/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const completeIntent = {
  durationDays: 2,
  partySize: 3,
  travelDate: "2026-11-01",
  transport: "car",
  budgetVnd: 2_000_000,
  budgetFlexible: false,
  travelDateFlexible: false,
  transportFlexible: false,
  interests: ["nature"],
  regions: ["Đồng Nai"],
  requiredPlaceIds: [],
  childHeightCm: null,
  lowMobility: false,
  rainyDay: false,
  missingInformation: [],
};

describe("AI trip plan clarification flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.createSupabaseServerClient.mockResolvedValue(null);
    mocks.consumeAiAllowance.mockResolvedValue("ok");
    mocks.getPlaceCatalog.mockResolvedValue(places);
    mocks.interpretTrip.mockResolvedValue(completeIntent);
    mocks.buildPlans.mockResolvedValue([]);
  });

  it("asks for missing core details and does not build recommendations yet", async () => {
    mocks.interpretTrip.mockResolvedValueOnce({
      ...completeIntent,
      durationDays: null,
      partySize: null,
      travelDate: null,
      transport: "unknown",
      budgetVnd: null,
    });

    const response = await POST(request({ prompt: "Muốn đi chơi ở Đồng Nai.", consent: true, locale: "vi" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("needs_clarification");
    expect(body.questions).toHaveLength(5);
    expect(mocks.buildPlans).not.toHaveBeenCalled();
  });

  it("uses clarification answers before returning itinerary recommendations", async () => {
    const clarificationHistory = [{
      questions: ["Mấy ngày?", "Bao nhiêu khách?"],
      answer: "3 ngày, 2 người; ngân sách linh hoạt, khởi hành 01/11/2026 bằng ô tô.",
    }];
    const response = await POST(request({
      prompt: "Muốn đi chơi ở Đồng Nai.", consent: true, locale: "vi", clarificationHistory,
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(mocks.interpretTrip.mock.calls[0][0].clarificationHistory).toEqual(clarificationHistory);
    expect(mocks.buildPlans.mock.calls[0][1]).toContain(clarificationHistory[0].answer);
  });
});
