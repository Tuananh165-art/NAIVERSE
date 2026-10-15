import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  consumeAiAllowance: vi.fn(),
  requestDeepSeekJson: vi.fn(),
  getPlaceCatalog: vi.fn(),
  ProviderError: class ProviderError extends Error {
    constructor(readonly code: string, message: string) { super(message); }
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ getCurrentUser: mocks.getCurrentUser, createSupabaseServerClient: mocks.createSupabaseServerClient }));
vi.mock("@/lib/ai-limit", () => ({ consumeAiAllowance: mocks.consumeAiAllowance }));
vi.mock("@/lib/deepseek", () => ({ AiProviderError: mocks.ProviderError, requestDeepSeekJson: mocks.requestDeepSeekJson }));
vi.mock("@/lib/catalog-server", () => ({ getPlaceCatalog: mocks.getPlaceCatalog }));

import { POST } from "@/app/api/ai/packing/route";
import { places } from "@/lib/catalog";

function request(body: unknown) {
  return new Request("http://localhost/api/ai/packing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validInput = {
  locale: "vi",
  consent: true,
  durationDays: 2,
  partySize: 3,
  transport: "car",
  interests: ["nature"],
  childHeightCm: 120,
  lowMobility: false,
  rainyDay: true,
  placeIds: ["cat-tien"],
};

const validOutput = {
  items: [
    { code: "water_bottle", priority: 2, reason: "general_preparedness" },
    { code: "rain_layer", priority: 1, reason: "rain_plan" },
    { code: "child_snacks", priority: 2, reason: "child_specific" },
    { code: "sun_protection", priority: 2, reason: "outdoor_activity" },
  ],
};

describe("AI packing route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.createSupabaseServerClient.mockResolvedValue(null);
    mocks.consumeAiAllowance.mockResolvedValue("ok");
    mocks.getPlaceCatalog.mockResolvedValue(places);
    mocks.requestDeepSeekJson.mockImplementation(async (options) => {
      const parsed = options.schema.safeParse(validOutput);
      if (!parsed.success) throw new mocks.ProviderError("invalid_output", "Invalid packed response");
      return parsed.data;
    });
  });

  it("requires a signed-in user before calling the model", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null);
    const response = await POST(request(validInput));
    expect(response.status).toBe(401);
    expect(mocks.consumeAiAllowance).not.toHaveBeenCalled();
    expect(mocks.requestDeepSeekJson).not.toHaveBeenCalled();
  });

  it("rejects free-form prompts and unexpected fields", async () => {
    const response = await POST(request({ ...validInput, prompt: "My name is Sam, here is my phone number..." }));
    expect(response.status).toBe(400);
    expect(mocks.requestDeepSeekJson).not.toHaveBeenCalled();
  });

  it("sends only structured trip facts and returns localized controlled labels", async () => {
    const response = await POST(request(validInput));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.aiUsed).toBe(true);
    expect(body.items).toHaveLength(4);
    expect(body.items.find((item: { code: string }) => item.code === "rain_layer").label).toContain("Áo mưa");
    expect(body.items.find((item: { code: string }) => item.code === "rain_layer").priorityLabel).toBe("Ưu tiên");
    const modelInput = mocks.requestDeepSeekJson.mock.calls[0][0].input;
    expect(modelInput.tripFacts).toMatchObject({ durationDays: 2, partySize: 3, childTraveling: true, rainPlanRequested: true });
    expect(JSON.stringify(modelInput)).not.toContain("prompt");
    expect(JSON.stringify(modelInput)).not.toContain("latitude");
    expect(JSON.stringify(modelInput)).not.toContain("budget");
    expect(JSON.stringify(modelInput)).not.toContain("cat-tien");
  });

  it("rejects items or reasons unsupported by the chosen trip facts", async () => {
    mocks.requestDeepSeekJson.mockImplementationOnce(async (options) => {
      const parsed = options.schema.safeParse({
        items: [
          { code: "water_bottle", priority: 2, reason: "general_preparedness" },
          { code: "rain_layer", priority: 1, reason: "rain_plan" },
          { code: "child_snacks", priority: 2, reason: "child_specific" },
          { code: "personal_mobility_aid", priority: 1, reason: "limited_mobility" },
        ],
      });
      if (!parsed.success) throw new mocks.ProviderError("invalid_output", "Unsupported reason");
      return parsed.data;
    });
    const response = await POST(request(validInput));
    expect(response.status).toBe(502);
  });

  it("rejects groups and unknown stops", async () => {
    const response = await POST(request({ ...validInput, placeIds: ["not-a-place"] }));
    expect(response.status).toBe(400);
    expect(mocks.requestDeepSeekJson).not.toHaveBeenCalled();
  });
});
