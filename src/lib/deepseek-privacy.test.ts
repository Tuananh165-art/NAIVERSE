import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

import { interpretTrip, requestDeepSeekJson } from "@/lib/deepseek";
import { tripInputSchema } from "@/lib/schemas";

const validIntent = {
  durationDays: 2,
  partySize: 2,
  travelDate: null,
  transport: "walking",
  budgetVnd: null,
  interests: ["nature"],
  regions: ["Đồng Nai"],
  requiredPlaceIds: [],
  childHeightCm: null,
  lowMobility: false,
  rainyDay: false,
  missingInformation: [],
};

const previousApiKey = process.env.DEEPSEEK_API_KEY;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  if (previousApiKey === undefined) delete process.env.DEEPSEEK_API_KEY;
  else process.env.DEEPSEEK_API_KEY = previousApiKey;
});

describe("DeepSeek request privacy boundary", () => {
  it("removes contact details and exact coordinates from generic AI inputs", async () => {
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ answer: "Please contact venue staff." }) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await requestDeepSeekJson({
      schema: z.object({ answer: z.string() }),
      system: "Return a short JSON answer.",
      input: {
        incident: "Email minh@example.com, call +84 912 345 678, and meet at 10.87485° N, 106.87036° E.",
        exactPosition: { latitude: 10.87485, longitude: 106.87036 },
        activity: "Lost item at Đồng Nai.",
      },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { messages: Array<{ content: string }> };
    const serializedInput = body.messages[1].content;
    expect(serializedInput).toContain("Lost item at Đồng Nai");
    expect(serializedInput).not.toContain("minh@example.com");
    expect(serializedInput).not.toContain("+84 912 345 678");
    expect(serializedInput).not.toContain("10.87485");
    expect(serializedInput).not.toContain("106.87036");
    expect(serializedInput).not.toContain("latitude");
    expect(serializedInput).not.toContain("longitude");
  });

  it("redacts degree-minute-second GPS coordinates before sending free-form text", async () => {
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ answer: "I can help plan the trip." }) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await requestDeepSeekJson({
      schema: z.object({ answer: z.string() }),
      system: "Return a short JSON answer.",
      input: { activity: "Meet at 10°52'29.46\"N, 106°52'12.90\"E or 10°52′29″B; 106°52′13″Đ." },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { messages: Array<{ content: string }> };
    expect(body.messages[1].content).toContain("[coordinates redacted]");
    expect(body.messages[1].content).not.toContain("10°52'29.46");
    expect(body.messages[1].content).not.toContain("106°52'12.90");
    expect(body.messages[1].content).not.toContain("10°52′29″B");
    expect(body.messages[1].content).not.toContain("106°52′13″Đ");
  });

  it("redacts contact details and GPS from Trip DNA while preserving travel intent", async () => {
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(validIntent) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const input = tripInputSchema.parse({
      prompt: "Gia đình 2 người đi Đồng Nai 2 ngày, gọi 0912345678 hoặc minh@example.com; điểm đón 10.87485, 106.87036.",
      consent: true,
      locale: "vi",
    });
    await interpretTrip(input);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { messages: Array<{ content: string }>; temperature: number };
    const modelInput = JSON.parse(body.messages[1].content) as { prompt: string };
    expect(body.temperature).toBe(0);
    expect(modelInput.prompt).toContain("Gia đình 2 người đi Đồng Nai 2 ngày");
    expect(modelInput.prompt).not.toContain("0912345678");
    expect(modelInput.prompt).not.toContain("minh@example.com");
    expect(modelInput.prompt).not.toContain("10.87485");
    expect(modelInput.prompt).not.toContain("106.87036");
  });

  it("gives Trip DNA a deterministic Vietnam-local date for relative travel dates", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-16T17:30:00.000Z"));
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ ...validIntent, travelDate: "2026-10-17" }) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await interpretTrip(tripInputSchema.parse({
      prompt: "Gia đình 2 người đi Đồng Nai ngày mai trong 2 ngày.", consent: true, locale: "vi",
    }));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { messages: Array<{ content: string }> };
    expect(body.messages[0].content).toContain("2026-10-17");
    expect(body.messages[0].content).toContain("Asia/Ho_Chi_Minh");
    expect(body.messages[0].content).toContain("relative travel dates");
  });

  it("increases Trip DNA output limit once when DeepSeek reports truncated JSON", async () => {
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ finish_reason: "length", message: { content: '{"durationDays":2' } }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(validIntent) } }],
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await interpretTrip(tripInputSchema.parse({
      prompt: "Two adults visiting Dong Nai for two days.", consent: true, locale: "en",
    }));

    expect(result.durationDays).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstRequest = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { max_tokens: number };
    const retryRequest = JSON.parse(fetchMock.mock.calls[1][1].body as string) as { max_tokens: number };
    expect(firstRequest.max_tokens).toBe(1400);
    expect(retryRequest.max_tokens).toBe(2400);
  });
});
