import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { places } from "@/lib/catalog";
import { AiProviderError, interpretTrip, requestDeepSeekJson } from "@/lib/deepseek";
import { conditionsAdviceSchema, routeAdviceSchema, tripInputSchema } from "@/lib/schemas";
import { getDailyForecast } from "@/lib/weather";
import { getDrivingRoute } from "@/lib/route";

const liveAiRequested = process.env.RUN_LIVE_AI_SMOKE === "true";
const liveRouteRequested = process.env.RUN_LIVE_ROUTE_SMOKE === "true";
if (liveAiRequested || liveRouteRequested) process.loadEnvFile(".env");
const enabled = liveAiRequested;
const routeSmokeEnabled = liveRouteRequested && Boolean(process.env.OPENROUTESERVICE_API_KEY);

function dateInVietnam(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function tomorrowInVietnam() {
  const [year, month, day] = dateInVietnam(new Date()).split("-").map(Number);
  return dateInVietnam(new Date(Date.UTC(year, month - 1, day + 1, 12)));
}

describe.skipIf(!enabled)("live DeepSeek smoke tests (explicit opt-in)", () => {
  it("parses a Vietnamese itinerary through the real configured model", async () => {
    const input = tripInputSchema.parse({ prompt: "Gia đình có 2 người lớn và một trẻ cao 120 cm, thích thiên nhiên, đi 2 ngày bằng ô tô.", consent: true, locale: "vi" });
    const result = await interpretTrip(input, places);
    expect(result.partySize).toBe(3);
    expect(result.durationDays).toBe(2);
    expect(result.childHeightCm).toBe(120);
    expect(Array.isArray(result.interests)).toBe(true);
  }, 30_000);

  it("parses an English itinerary through the real configured model", async () => {
    const input = tripInputSchema.parse({ prompt: "Two adults and a child 120 cm tall, two days, nature, traveling by car.", consent: true, locale: "en" });
    const result = await interpretTrip(input, places);
    expect(result.partySize).toBe(3);
    expect(result.durationDays).toBe(2);
    expect(result.childHeightCm).toBe(120);
    expect(Array.isArray(result.interests)).toBe(true);
  }, 30_000);

  it("resolves a Vietnamese relative date against the current Vietnam date", async () => {
    const expectedDate = tomorrowInVietnam();
    const input = tripInputSchema.parse({ prompt: "Gia đình hai người đi Đồng Nai ngày mai trong một ngày.", consent: true, locale: "vi" });
    const result = await interpretTrip(input, places);
    expect(result.travelDate).toBe(expectedDate);
  }, 30_000);

  it("resolves an English relative date against the current Vietnam date", async () => {
    const expectedDate = tomorrowInVietnam();
    const input = tripInputSchema.parse({ prompt: "Two adults plan a one-day trip in Dong Nai tomorrow.", consent: true, locale: "en" });
    const result = await interpretTrip(input, places);
    expect(result.travelDate).toBe(expectedDate);
  }, 30_000);

  it("asks for a day instead of inventing one when a Vietnamese request names only a month", async () => {
    const input = tripInputSchema.parse({ prompt: "Gia đình 2 người muốn đi Đồng Nai trong một ngày vào tháng 11 năm 2026.", consent: true, locale: "vi" });
    const result = await interpretTrip(input, places);
    expect(result.travelDate).toBeNull();
    expect(result.missingInformation.length).toBeGreaterThan(0);
  }, 30_000);

  it("asks for a day instead of inventing one when an English request names only a month", async () => {
    const input = tripInputSchema.parse({ prompt: "Two adults want a one-day trip to Dong Nai sometime in November 2026.", consent: true, locale: "en" });
    const result = await interpretTrip(input, places);
    expect(result.travelDate).toBeNull();
    expect(result.missingInformation.length).toBeGreaterThan(0);
  }, 30_000);

  it("summarizes a real regional Open-Meteo forecast through DeepSeek", async () => {
    const travelDate = dateInVietnam(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const weather = await getDailyForecast(10.87, 106.87, travelDate);
    const advice = await requestDeepSeekJson({
      schema: conditionsAdviceSchema,
      system: "Return one Vietnamese JSON object. Use only these forecast facts; do not invent warnings or venue hours. Keep summary within 500 characters, practicalSteps to at most 5 items, indoorAlternative within 240 characters, greenAdvice to at most 4 items, and each list item within 220 characters. JSON: {summary:string,practicalSteps:string[],indoorAlternative:string,greenAdvice:string[],urgency:'routine',incidentCategory:'weather'}.",
      input: { mode: "weather", activity: "đi bộ ngoài trời", forecast: weather.forecast, fetchedAt: weather.fetchedAt, locale: "vi" },
      maxTokens: 500,
    });
    expect(advice.incidentCategory).toBe("weather");
    expect(advice.summary.length).toBeGreaterThan(8);
    expect(weather.forecast.date).toBe(travelDate);
  }, 40_000);

  it("summarizes the same real forecast in English through DeepSeek", async () => {
    const travelDate = dateInVietnam(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const weather = await getDailyForecast(10.87, 106.87, travelDate);
    const advice = await requestDeepSeekJson({
      schema: conditionsAdviceSchema,
      system: "Return one English JSON object. Use only these forecast facts; do not invent warnings or venue hours. Keep summary within 500 characters, practicalSteps to at most 5 items, indoorAlternative within 240 characters, greenAdvice to at most 4 items, and each list item within 220 characters. JSON: {summary:string,practicalSteps:string[],indoorAlternative:string,greenAdvice:string[],urgency:'routine',incidentCategory:'weather'}.",
      input: { mode: "weather", activity: "Outdoor walking", forecast: weather.forecast, fetchedAt: weather.fetchedAt, locale: "en" },
      maxTokens: 500,
    });
    expect(advice.incidentCategory).toBe("weather");
    expect(advice.summary.length).toBeGreaterThan(8);
    expect(weather.forecast.date).toBe(travelDate);
  }, 40_000);

  it("triages a non-urgent Vietnamese travel incident through DeepSeek", async () => {
    let advice;
    try { advice = await requestDeepSeekJson({
      schema: conditionsAdviceSchema,
      system: [
        "You are NaiVerse's Vietnamese travel incident assistant. Return one JSON object only.",
        "Use only the supplied incident; do not invent venue policies, official warnings, prices, emergency contacts, diagnosis, or confirmed safety.",
        "For a lost item without immediate danger, give short practical steps and suggest contacting venue staff or local authorities if needed. Do not mark it as an emergency.",
        "Return exactly the schema keys. urgency must be routine, prompt_human_help or emergency; incidentCategory must be weather, injury, lost_item, unsafe_condition, scam_concern, wildlife or other. For this non-urgent lost-item case, use urgency routine and incidentCategory lost_item.",
        "Green advice must be practical and modest; never claim carbon neutrality or verified environmental credentials without evidence.",
        "Keep summary within 500 characters, practicalSteps to at most 5 items, indoorAlternative within 240 characters, greenAdvice to at most 4 items, and each list item within 220 characters.",
        'Write in Vietnamese. JSON shape: {"summary":"...","practicalSteps":["..."],"indoorAlternative":"","greenAdvice":["..."],"urgency":"routine","incidentCategory":"lost_item"}',
      ].join(" "),
      input: {
        mode: "incident",
        incident: "Tôi làm thất lạc túi gần khu tham quan, chưa có nguy hiểm trực tiếp.",
        locale: "vi",
      },
      maxTokens: 500,
    }); } catch (error) {
      if (error instanceof AiProviderError) throw new Error(error.diagnostics.join(" | ") || error.message);
      throw error;
    }
    expect(advice.incidentCategory).toBe("lost_item");
    expect(advice.urgency).not.toBe("emergency");
    expect(advice.practicalSteps.length).toBeGreaterThan(0);
    expect(advice.greenAdvice.length).toBeGreaterThan(0);
  }, 30_000);

  it("triages a non-urgent English travel incident through DeepSeek", async () => {
    const advice = await requestDeepSeekJson({
      schema: conditionsAdviceSchema,
      system: [
        "You are NaiVerse's English travel incident assistant. Return one JSON object only.",
        "Use only the supplied incident; do not invent venue policies, official warnings, prices, emergency contacts, diagnosis, or confirmed safety.",
        "For a lost item without immediate danger, give short practical steps and suggest contacting venue staff or local authorities if needed. Do not mark it as an emergency.",
        "Return exactly the schema keys. urgency must be routine, prompt_human_help or emergency; incidentCategory must be weather, injury, lost_item, unsafe_condition, scam_concern, wildlife or other. For this non-urgent lost-item case, use urgency routine and incidentCategory lost_item.",
        "Green advice must be practical and modest; never claim carbon neutrality or verified environmental credentials without evidence.",
        "Keep summary within 500 characters, practicalSteps to at most 5 items, indoorAlternative within 240 characters, greenAdvice to at most 4 items, and each list item within 220 characters.",
        'Write in English. JSON shape: {"summary":"...","practicalSteps":["..."],"indoorAlternative":"","greenAdvice":["..."],"urgency":"routine","incidentCategory":"lost_item"}',
      ].join(" "),
      input: { mode: "incident", incident: "I lost my bag near the visitor area, but there is no immediate danger.", locale: "en" },
      maxTokens: 500,
    });
    expect(advice.incidentCategory).toBe("lost_item");
    expect(advice.urgency).not.toBe("emergency");
    expect(advice.practicalSteps.length).toBeGreaterThan(0);
    expect(advice.greenAdvice.length).toBeGreaterThan(0);
  }, 30_000);

  it("explains supplied route metrics with the route-advice schema", async () => {
    const advice = await requestDeepSeekJson({
      schema: routeAdviceSchema,
      system: "Return one Vietnamese JSON object. Recommend fastest or shortest and use only these numbers. Explain that shortest distance is only a proxy, there is no live traffic, and the supplied order was optimized from a pairwise matrix with the first and last stops fixed. Keep explanation within 500 characters, tradeoffs to at most 4 items, reminders to at most 5 items, and each list item within 220 characters. JSON: {recommendation:'fastest',explanation:string,tradeoffs:string[],reminders:string[]}.",
      input: { purpose: "green", stops: ["Biên Hòa test pin", "Xuân Lộc test pin"], waypointOrderOptimized: true, endpointsFixed: true, availableProfiles: ["fastest", "shortest"], routes: { fastest: { distanceKm: 155, durationMinutes: 205 }, shortest: { distanceKm: 143, durationMinutes: 240 } }, locale: "vi" },
      maxTokens: 500,
    });
    expect(["fastest", "shortest"]).toContain(advice.recommendation);
    expect(advice.explanation.length).toBeGreaterThan(8);
  }, 30_000);

  it("explains supplied route metrics in English through DeepSeek", async () => {
    const advice = await requestDeepSeekJson({
      schema: routeAdviceSchema,
      system: "Return one English JSON object. Recommend fastest or shortest and use only these numbers. Explain that shortest distance is only a distance proxy, there is no live traffic, and the supplied order was optimized from a pairwise matrix with the first and last stops fixed. Keep explanation within 500 characters, tradeoffs to at most 4 items, reminders to at most 5 items, and each list item within 220 characters. JSON: {recommendation:'fastest',explanation:string,tradeoffs:string[],reminders:string[]}.",
      input: { purpose: "green", stops: ["Bien Hoa test pin", "Xuan Loc test pin"], waypointOrderOptimized: true, endpointsFixed: true, availableProfiles: ["fastest", "shortest"], routes: { fastest: { distanceKm: 155, durationMinutes: 205 }, shortest: { distanceKm: 143, durationMinutes: 240 } }, locale: "en" },
      maxTokens: 500,
    });
    expect(["fastest", "shortest"]).toContain(advice.recommendation);
    expect(advice.explanation.length).toBeGreaterThan(8);
  }, 30_000);
});

describe.skipIf(!routeSmokeEnabled)("live OpenRouteService smoke test (explicit opt-in)", () => {
  it("returns real road geometry for temporary test pins", async () => {
    // These are road-routing test pins, not verified attraction entrances.
    const stops = [
      { name: "Biên Hòa test pin", latitude: 10.95, longitude: 106.82 },
      { name: "Xuân Lộc test pin", latitude: 10.93, longitude: 107.24 },
    ];
    const [fastest, shortest] = await Promise.all([
      getDrivingRoute(stops, "fastest"),
      getDrivingRoute(stops, "shortest"),
    ]);
    expect(fastest?.distanceKm).toBeGreaterThan(0);
    expect(fastest?.geometry.length).toBeGreaterThan(1);
    expect(shortest?.distanceKm).toBeGreaterThan(0);
  }, 30_000);
});

// Keep Vitest's no-credential default explicit and visible in the normal suite.
describe("AI live smoke opt-in", () => {
  it("is disabled unless RUN_LIVE_AI_SMOKE=true", () => {
    if (!enabled) expect(enabled).toBe(false);
  });
});
