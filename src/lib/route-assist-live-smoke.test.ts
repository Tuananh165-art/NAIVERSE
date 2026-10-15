import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  getCurrentUser: vi.fn(async () => ({ id: "live-route-smoke-user" })),
  createSupabaseServerClient: vi.fn(async () => null),
}));
vi.mock("@/lib/ai-limit", () => ({ consumeAiAllowance: vi.fn(async () => "ok") }));

import { POST } from "@/app/api/ai/route-assist/route";

const requested = process.env.RUN_LIVE_AI_FULL_ROUTE_SMOKE === "true";
if (requested) process.loadEnvFile(".env");
const enabled = requested && Boolean(process.env.DEEPSEEK_API_KEY && process.env.OPENROUTESERVICE_API_KEY);

describe.skipIf(!enabled)("live map route -> OpenRouteService -> DeepSeek smoke", () => {
  it("returns real road alternatives and a schema-checked DeepSeek explanation", async () => {
    const response = await POST(new Request("http://localhost/api/ai/route-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: "vi",
        consent: true,
        purpose: "green",
        partySize: 2,
        childSeatNeeded: false,
        stops: [
          { name: "Biên Hòa live smoke pin", latitude: 10.95, longitude: 106.82 },
          { name: "Xuân Lộc live smoke pin", latitude: 10.93, longitude: 107.24 },
        ],
      }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.aiUsed).toBe(true);
    expect(payload.source.label).toBe("openrouteservice");
    expect(payload.routes.fastest.distanceKm).toBeGreaterThan(0);
    expect(payload.routes.fastest.geometry.length).toBeGreaterThan(1);
    expect(payload.routes.shortest.distanceKm).toBeGreaterThan(0);
    expect(["fastest", "shortest"]).toContain(payload.selectedProfile);
    expect(payload.advice.explanation.length).toBeGreaterThan(8);
    expect(payload.limits).toContain("No live traffic, transit or road-closure data.");
  }, 60_000);
});

describe("live route integration smoke opt-in", () => {
  it("stays disabled unless explicitly requested", () => {
    if (!requested) expect(enabled).toBe(false);
  });
});
