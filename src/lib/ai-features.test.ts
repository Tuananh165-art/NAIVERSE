import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { conditionsAdviceSchema, conditionsInputSchema, routeAssistInputSchema } from "@/lib/schemas";
import { getEmergencyGuidance, isImmediateDanger } from "@/lib/safety";
import { getDailyForecast, WeatherProviderError } from "@/lib/weather";
import { getDrivingMatrix, getDrivingRoute, optimizeRouteOrder } from "@/lib/route";
import { requestDeepSeekJson } from "@/lib/deepseek";

describe("weather, safety and route AI contracts", () => {
  it("routes imminent danger directly to human hotlines in both locales", () => {
    expect(isImmediateDanger("Tôi bị ngất và khó thở" )).toBe(true);
    expect(isImmediateDanger("Someone is unconscious and cannot breathe")).toBe(true);
    expect(isImmediateDanger("I lost a bag at the lake")).toBe(false);
    expect(getEmergencyGuidance("vi").hotlines.map((item) => item.number)).toEqual(["113", "114", "115"]);
    expect(getEmergencyGuidance("en").message).toContain("Do not wait for an AI response");
  });

  it("validates weather mode needs date and paired coarse coordinates", () => {
    expect(conditionsInputSchema.safeParse({ mode: "weather", consent: true, latitude: 10.9, longitude: 106.9, travelDate: "2026-10-16" }).success).toBe(true);
    expect(conditionsInputSchema.safeParse({ mode: "weather", consent: true, latitude: 10.9, travelDate: "2026-10-16" }).success).toBe(false);
    expect(conditionsInputSchema.safeParse({ mode: "incident", consent: true, incident: "Túi của tôi bị thất lạc ở khu tham quan." }).success).toBe(true);
  });

  it("requires at least two and at most eight valid route pins", () => {
    const stop = { name: "Biên Hòa", latitude: 10.95, longitude: 106.82 };
    const base = { consent: true, purpose: "green" as const, stops: [stop, { ...stop, name: "Cát Tiên", latitude: 11.42, longitude: 107.43 }] };
    expect(routeAssistInputSchema.safeParse(base).success).toBe(true);
    expect(routeAssistInputSchema.safeParse({ ...base, stops: [stop] }).success).toBe(false);
    expect(routeAssistInputSchema.safeParse({ ...base, stops: Array.from({ length: 9 }, (_, i) => ({ ...stop, name: `Stop ${i}` })) }).success).toBe(false);
  });

  it("rounds forecast coordinates to one decimal and returns source timestamp", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ daily: { time: ["2026-10-16"], weather_code: [61], temperature_2m_max: [31], temperature_2m_min: [25], precipitation_probability_max: [65], wind_speed_10m_max: [18] } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await getDailyForecast(10.87485, 106.87036, "2026-10-16");
    const requestUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestUrl.searchParams.get("latitude")).toBe("10.9");
    expect(requestUrl.searchParams.get("longitude")).toBe("106.9");
    expect(result.forecast.precipitationProbabilityMax).toBe(65);
    expect(result.locationPrecision).toBe("rounded_to_0.1_degree");
    expect(result.sourceUrl).toContain("open-meteo.com");
    vi.unstubAllGlobals();
  });

  it("does not manufacture a forecast when date is outside provider data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ daily: { time: ["2026-10-16"], weather_code: [0] } }), { status: 200 })));
    await expect(getDailyForecast(10.9, 106.9, "2030-01-01")).rejects.toBeInstanceOf(WeatherProviderError);
    vi.unstubAllGlobals();
  });

  it("uses the selected ORS routing preference and provider route geometry", async () => {
    const priorKey = process.env.OPENROUTESERVICE_API_KEY;
    process.env.OPENROUTESERVICE_API_KEY = "unit-test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ features: [{ geometry: { coordinates: [[106.8, 10.9], [106.9, 11.0]] }, properties: { summary: { distance: 12_345, duration: 2_401 } } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const route = await getDrivingRoute([{ name: "A", latitude: 10.9, longitude: 106.8 }, { name: "B", latitude: 11.0, longitude: 106.9 }], "shortest");
    expect(fetchMock.mock.calls[0][0]).toContain("preference=shortest");
    expect(route?.distanceKm).toBe(12.3);
    expect(route?.durationMinutes).toBe(41);
    expect(route?.geometry[0]).toEqual([10.9, 106.8]);
    if (priorKey === undefined) delete process.env.OPENROUTESERVICE_API_KEY;
    else process.env.OPENROUTESERVICE_API_KEY = priorKey;
    vi.unstubAllGlobals();
  });

  it("optimizes intermediate stops by the requested matrix metric while keeping endpoints fixed", () => {
    const durations = [
      [0, 20, 1, 0],
      [0, 0, 1, 2],
      [0, 1, 0, 20],
      [0, 0, 0, 0],
    ];
    const distances = [
      [0, 100, 1000, 0],
      [0, 0, 100, 1000],
      [0, 1000, 0, 100],
      [0, 0, 0, 0],
    ];
    expect(optimizeRouteOrder({ durations, distances }, "duration")).toMatchObject({ order: [0, 2, 1, 3], estimatedDurationMinutes: 1, objective: "duration" });
    expect(optimizeRouteOrder({ durations, distances }, "distance")).toMatchObject({ order: [0, 1, 2, 3], estimatedDistanceKm: 0.3, objective: "distance" });
    expect(optimizeRouteOrder({ durations, distances }, "duration")?.order[0]).toBe(0);
    expect(optimizeRouteOrder({ durations, distances }, "duration")?.order.at(-1)).toBe(3);
  });

  it("returns no matrix optimization if every complete order has a missing road segment", () => {
    const matrix = {
      durations: [[0, null, null], [null, 0, 20], [20, null, 0]],
      distances: [[0, null, null], [null, 0, 1000], [1000, null, 0]],
    };
    expect(optimizeRouteOrder(matrix, "duration")).toBeNull();
    expect(optimizeRouteOrder({ durations: [[0]], distances: [[0]] }, "duration")).toBeNull();
  });

  it("requests real pairwise ORS duration and distance matrices with lon/lat ordering", async () => {
    const previousKey = process.env.OPENROUTESERVICE_API_KEY;
    process.env.OPENROUTESERVICE_API_KEY = "unit-test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      durations: [[0, 120], [180, 0]],
      distances: [[0, 1500], [2000, 0]],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const stops = [{ name: "A", latitude: 10.9, longitude: 106.8 }, { name: "B", latitude: 11, longitude: 106.9 }];
      await expect(getDrivingMatrix(stops)).resolves.toEqual({ durations: [[0, 120], [180, 0]], distances: [[0, 1500], [2000, 0]] });
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.openrouteservice.org/v2/matrix/driving-car");
      expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ locations: [[106.8, 10.9], [106.9, 11]], metrics: ["duration", "distance"], units: "m" });
    } finally {
      vi.unstubAllGlobals();
      if (previousKey === undefined) delete process.env.OPENROUTESERVICE_API_KEY;
      else process.env.OPENROUTESERVICE_API_KEY = previousKey;
    }
  });

  it("repairs a schema-invalid DeepSeek response once and accepts the corrected JSON", async () => {
    const priorKey = process.env.DEEPSEEK_API_KEY;
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const validAdvice = {
      summary: "Báo nhân viên khu tham quan để được hỗ trợ tìm túi.",
      practicalSteps: ["Kiểm tra quầy thất lạc."],
      indoorAlternative: "",
      greenAdvice: ["Đi chung xe nếu cần quay lại khu tham quan."],
      urgency: "routine",
      incidentCategory: "lost_item",
    };
    const invalidAdvice = { ...validAdvice, practicalSteps: Array(6).fill("Kiểm tra quầy thất lạc.") };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(invalidAdvice) } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAdvice) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const result = await requestDeepSeekJson({
        schema: conditionsAdviceSchema,
        system: "Return one JSON object matching the response schema.",
        input: { mode: "incident", incident: "Lost a bag at a venue." },
      });
      expect(result.incidentCategory).toBe("lost_item");
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const secondRequest = JSON.parse(fetchMock.mock.calls[1][1].body as string) as { messages: Array<{ role: string; content: string }> };
      expect(secondRequest.messages.map((message) => message.role)).toEqual(["system", "user", "user"]);
      expect(secondRequest.messages[2].content).toContain("practicalSteps: too_big");
    } finally {
      vi.unstubAllGlobals();
      if (priorKey === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = priorKey;
    }
  });

  it("doubles the bounded token allowance once when DeepSeek marks JSON as truncated", async () => {
    const priorKey = process.env.DEEPSEEK_API_KEY;
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const validAdvice = { summary: "Notify venue staff about the missing bag.", practicalSteps: ["Check the lost-property desk."], indoorAlternative: "", greenAdvice: [], urgency: "routine", incidentCategory: "lost_item" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ finish_reason: "length", message: { content: '{"summary":' } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(validAdvice) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const result = await requestDeepSeekJson({
        schema: conditionsAdviceSchema,
        system: "Return one JSON object matching the response schema.",
        input: { mode: "incident", incident: "Lost a bag at a venue." },
        maxTokens: 500,
      });
      expect(result.incidentCategory).toBe("lost_item");
      const requestBodies = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body as string) as { max_tokens: number });
      expect(requestBodies.map((body) => body.max_tokens)).toEqual([500, 1000]);
    } finally {
      vi.unstubAllGlobals();
      if (priorKey === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = priorKey;
    }
  });

  it("does not retry schema-invalid DeepSeek output more than once", async () => {
    const priorKey = process.env.DEEPSEEK_API_KEY;
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const invalidAdvice = {
      summary: "Báo nhân viên khu tham quan để được hỗ trợ tìm túi.",
      practicalSteps: Array(6).fill("Kiểm tra quầy thất lạc."),
      indoorAlternative: "",
      greenAdvice: ["Đi chung xe nếu cần quay lại khu tham quan."],
      urgency: "routine",
      incidentCategory: "lost_item",
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(invalidAdvice) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(requestDeepSeekJson({
        schema: conditionsAdviceSchema,
        system: "Return one JSON object matching the response schema.",
        input: { mode: "incident", incident: "Lost a bag at a venue." },
      })).rejects.toMatchObject({ code: "invalid_output" });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
      if (priorKey === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = priorKey;
    }
  });
});
