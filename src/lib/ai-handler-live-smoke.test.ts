import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  getCurrentUser: vi.fn(async () => ({ id: "live-smoke-user" })),
  createSupabaseServerClient: vi.fn(async () => null),
}));
vi.mock("@/lib/ai-limit", () => ({
  consumeAiAllowance: vi.fn(async () => "ok"),
}));
vi.mock("@/lib/route", () => ({
  getDrivingMatrix: vi.fn(async () => null),
  getDrivingRoute: vi.fn(async (_stops: unknown, preference: "fastest" | "shortest") => preference === "fastest"
    ? { distanceKm: 155, durationMinutes: 205, geometry: [[10.95, 106.82], [10.93, 107.24]], fetchedAt: "2026-10-15T00:00:00.000Z" }
    : { distanceKm: 143, durationMinutes: 240, geometry: [[10.95, 106.82], [10.93, 107.24]], fetchedAt: "2026-10-15T00:00:00.000Z" }),
}));

import { getCurrentUser } from "@/lib/supabase/server";
import { consumeAiAllowance } from "@/lib/ai-limit";
import { POST as postConditions } from "@/app/api/ai/conditions/route";
import { POST as postRouteAssist } from "@/app/api/ai/route-assist/route";
import { getDrivingMatrix, getDrivingRoute } from "@/lib/route";
import { isImmediateDanger } from "@/lib/safety";

const liveHandlersRequested = process.env.RUN_LIVE_AI_HANDLERS_SMOKE === "true";
if (liveHandlersRequested) process.loadEnvFile(".env");
const enabled = liveHandlersRequested && Boolean(process.env.DEEPSEEK_API_KEY);

function dateInVietnam(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

describe.skipIf(!enabled)("live AI API handler smoke (provider real; auth and Redis isolated)", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "live-smoke-user" } as Awaited<ReturnType<typeof getCurrentUser>>);
    vi.mocked(consumeAiAllowance).mockResolvedValue("ok");
  });

  it.each([
    ["vi", "Đi bộ tham quan ngoài trời"],
    ["en", "Outdoor walking"],
  ] as const)("runs the authenticated weather endpoint end to end in %s", async (locale, activity) => {
    const travelDate = dateInVietnam(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const request = new Request("http://localhost/api/ai/conditions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "weather",
        locale,
        consent: true,
        latitude: 10.87,
        longitude: 106.87,
        travelDate,
        activity,
      }),
    });

    const response = await postConditions(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.aiUsed).toBe(true);
    expect(payload.urgent).toBe(false);
    expect(payload.weather.forecast.date).toBe(travelDate);
    expect(payload.weather.locationPrecision).toBe("rounded_to_0.1_degree");
    expect(payload.sources[0].url).toContain("open-meteo.com");
    expect(payload.advice.summary.length).toBeGreaterThan(8);
    expect(payload.advice.incidentCategory).toBe("weather");
    expect(payload.advice.practicalSteps.length).toBeLessThanOrEqual(5);
    expect(payload.advice.greenAdvice.length).toBeLessThanOrEqual(4);
  }, 45_000);

  it("runs the route assistant endpoint with live DeepSeek and isolated route metrics", async () => {
    const previousOrsKey = process.env.OPENROUTESERVICE_API_KEY;
    process.env.OPENROUTESERVICE_API_KEY = "route-metrics-fixture-only";
    const request = new Request("http://localhost/api/ai/route-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: "vi",
        consent: true,
        purpose: "green",
        stops: [
          { name: "Biên Hòa test pin", latitude: 10.95, longitude: 106.82 },
          { name: "Xuân Lộc test pin", latitude: 10.93, longitude: 107.24 },
        ],
      }),
    });

    try {
      const response = await postRouteAssist(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.aiUsed).toBe(true);
      expect(payload.routes.fastest.distanceKm).toBe(155);
      expect(payload.routes.shortest.distanceKm).toBe(143);
      expect(["fastest", "shortest"]).toContain(payload.selectedProfile);
      expect(payload.advice.explanation.length).toBeGreaterThan(8);
      expect(payload.limits).toContain("Matrix optimization was unavailable; the entered stop order was preserved.");
      expect(payload.optimization.applied).toBe(false);
      expect(getDrivingMatrix).toHaveBeenCalledTimes(1);
      expect(getDrivingRoute).toHaveBeenCalledTimes(2);
    } finally {
      if (previousOrsKey === undefined) delete process.env.OPENROUTESERVICE_API_KEY;
      else process.env.OPENROUTESERVICE_API_KEY = previousOrsKey;
    }
  }, 45_000);
});

describe("conditions API handler emergency bypass", () => {
  it("returns local emergency guidance without authentication, Redis, weather or AI calls", async () => {
    vi.mocked(getCurrentUser).mockClear();
    vi.mocked(consumeAiAllowance).mockClear();
    const response = await postConditions(new Request("http://localhost/api/ai/conditions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "incident", locale: "vi", consent: true, incident: "Tôi đang khó thở và ngất xỉu." }),
    }));
    const payload = await response.json();

    expect(isImmediateDanger("Tôi đang khó thở và ngất xỉu.")).toBe(true);
    expect(response.status).toBe(200);
    expect(payload.urgent).toBe(true);
    expect(payload.aiUsed).toBe(false);
    expect(payload.hotlines.map((item: { number: string }) => item.number)).toEqual(["113", "114", "115"]);
    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(consumeAiAllowance).not.toHaveBeenCalled();
  });
});
