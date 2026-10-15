import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  getCurrentUser: vi.fn(async () => ({ id: "route-test-user" })),
  createSupabaseServerClient: vi.fn(async () => null),
}));
vi.mock("@/lib/ai-limit", () => ({ consumeAiAllowance: vi.fn(async () => "ok") }));
vi.mock("@/lib/deepseek", () => ({
  AiProviderError: class AiProviderError extends Error { code = "unavailable"; diagnostics: string[] = []; },
  requestDeepSeekJson: vi.fn(async () => ({
    recommendation: "fastest",
    explanation: "Ưu tiên thời gian ước tính theo tuyến đường bộ.",
    tradeoffs: ["Không có dữ liệu kẹt xe trực tiếp."],
    reminders: ["Thời gian thực tế có thể khác."],
  })),
}));
vi.mock("@/lib/route", () => ({
  getDrivingMatrix: vi.fn(async () => ({
    durations: [[0, 20, 1, 0], [0, 0, 1, 2], [0, 1, 0, 20], [0, 0, 0, 0]],
    distances: [[0, 1000, 100, 0], [0, 0, 1000, 100], [0, 100, 0, 1000], [0, 0, 0, 0]],
  })),
  optimizeRouteOrder: vi.fn(() => ({ order: [0, 2, 1, 3], estimatedDistanceKm: 0.3, estimatedDurationMinutes: 1, objective: "duration" })),
  getDrivingRoute: vi.fn(async (_stops: Array<{ name: string }>, preference: "fastest" | "shortest") => ({
    distanceKm: preference === "fastest" ? 12.3 : 11.7,
    durationMinutes: preference === "fastest" ? 20 : 26,
    geometry: [[10.9, 106.8], [11, 106.9]],
  })),
}));

import { POST } from "@/app/api/ai/route-assist/route";
import { getDrivingRoute } from "@/lib/route";
import { requestDeepSeekJson } from "@/lib/deepseek";

describe("route assistant handler stop optimization", () => {
  it("routes the ORS matrix order into both directions and asks DeepSeek to explain that order", async () => {
    const previousKey = process.env.OPENROUTESERVICE_API_KEY;
    process.env.OPENROUTESERVICE_API_KEY = "unit-test-key";
    const stops = [
      { name: "Origin", latitude: 10.9, longitude: 106.8 },
      { name: "Cafe", latitude: 10.91, longitude: 106.81 },
      { name: "Park", latitude: 10.92, longitude: 106.82 },
      { name: "Destination", latitude: 10.93, longitude: 106.83 },
    ];

    try {
      const response = await POST(new Request("http://localhost/api/ai/route-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "fastest", consent: true, stops }),
      }));
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.optimization).toMatchObject({ applied: true, objective: "duration", anchorsFixed: true });
      expect(payload.waypointOrder.map((stop: { originalIndex: number }) => stop.originalIndex)).toEqual([0, 2, 1, 3]);
      expect(payload.waypointOrder.map((stop: { name: string }) => stop.name)).toEqual(["Origin", "Park", "Cafe", "Destination"]);
      expect(vi.mocked(getDrivingRoute)).toHaveBeenCalledTimes(2);
      for (const [orderedStops] of vi.mocked(getDrivingRoute).mock.calls) {
        expect(orderedStops.map((stop) => stop.name)).toEqual(["Origin", "Park", "Cafe", "Destination"]);
      }
      const modelCall = vi.mocked(requestDeepSeekJson).mock.calls[0][0] as { input: { stops: string[]; dataLimits: string } };
      expect(modelCall.input.stops).toEqual(["Origin", "Park", "Cafe", "Destination"]);
      expect(modelCall.input.dataLimits).toContain("first and last stops were kept fixed");
      expect(payload.limits.some((limit: string) => limit.includes("Order minimizes the selected ORS pairwise matrix metric"))).toBe(true);
    } finally {
      if (previousKey === undefined) delete process.env.OPENROUTESERVICE_API_KEY;
      else process.env.OPENROUTESERVICE_API_KEY = previousKey;
    }
  });
});
