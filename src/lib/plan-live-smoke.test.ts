import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  getCurrentUser: vi.fn(async () => ({ id: "live-plan-smoke-user" })),
  createSupabaseServerClient: vi.fn(async () => null),
}));
vi.mock("@/lib/ai-limit", () => ({ consumeAiAllowance: vi.fn(async () => "ok") }));

import { POST } from "@/app/api/ai/plan/route";
import { places } from "@/lib/catalog";

const requested = process.env.RUN_LIVE_AI_PLAN_SMOKE === "true";
if (requested) process.loadEnvFile(".env");
const enabled = requested && Boolean(process.env.DEEPSEEK_API_KEY);

describe.skipIf(!enabled)("live AI trip-plan endpoint smoke", () => {
  it("parses a real request and creates three catalog-grounded itinerary options", async () => {
    const response = await POST(new Request("http://localhost/api/ai/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Gia đình 2 người lớn và một bé cao 120 cm đi một ngày, thích thiên nhiên ở Đồng Nai.",
        consent: true,
        durationDays: 1,
        partySize: 3,
        transport: "walking",
        locale: "vi",
      }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.intent.partySize).toBe(3);
    expect(payload.intent.durationDays).toBe(1);
    expect(payload.intent.childHeightCm).toBe(120);
    expect(payload.options).toHaveLength(3);
    for (const option of payload.options) {
      expect(option.stops.length).toBeGreaterThan(0);
      expect(option.stops.every((stop: { id: string }) => places.some((place) => place.id === stop.id))).toBe(true);
      expect(option.cost).toBeDefined();
    }
    expect(payload.options.every((option: { status: string }) => ["needs_confirmation", "infeasible"].includes(option.status))).toBe(true);
  }, 45_000);
});

describe("live AI plan smoke opt-in", () => {
  it("stays disabled unless explicitly requested", () => {
    if (!requested) expect(enabled).toBe(false);
  });
});
