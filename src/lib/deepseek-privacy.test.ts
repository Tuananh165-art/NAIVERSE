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

  it("redacts labelled passport and identity numbers while preserving the surrounding request", async () => {
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ answer: "Please contact the operator directly." }) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await requestDeepSeekJson({
      schema: z.object({ answer: z.string() }),
      system: "Return a short JSON answer.",
      input: { question: "Can I visit the museum? Passport no: XA1234567. My Vietnamese identity card is 079123456789." },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { messages: Array<{ content: string }> };
    const modelInput = body.messages[1].content;
    expect(modelInput).toContain("Can I visit the museum?");
    expect(modelInput).toContain("[identifier redacted]");
    expect(modelInput).not.toContain("XA1234567");
    expect(modelInput).not.toContain("079123456789");
  });

  it("redacts explicitly labelled names while preserving the trip request in Vietnamese and English", async () => {
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ answer: "I can help plan that trip." }) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await requestDeepSeekJson({
      schema: z.object({ answer: z.string() }),
      system: "Return a short JSON answer.",
      input: {
        questions: [
          "Tên tôi là Nguyễn Văn An, gia đình tôi muốn đi Bửu Long 2 ngày.",
          "My name is Jane Doe; I'd like a 2-day trip to Buu Long.",
          "My name: John Smith, please plan a family outing.",
          "The place name is Buu Long and I want a two-day family trip.",
          "The place name: Buu Long is the destination.",
        ],
      },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { messages: Array<{ content: string }> };
    const serializedInput = body.messages[1].content;
    expect(serializedInput).toContain("[name redacted]");
    expect(serializedInput).toContain("gia đình tôi muốn đi Bửu Long 2 ngày");
    expect(serializedInput).toContain("I'd like a 2-day trip to Buu Long");
    expect(serializedInput).toContain("please plan a family outing");
    expect(serializedInput).toContain("The place name is Buu Long");
    expect(serializedInput).toContain("The place name: Buu Long is the destination.");
    expect(serializedInput).not.toContain("Nguyễn Văn An");
    expect(serializedInput).not.toContain("Jane Doe");
    expect(serializedInput).not.toContain("John Smith");
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

  it("redacts contact details and GPS from natural AI guide questions before sending them", async () => {
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ answer: "Please confirm the price with the venue." }) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await requestDeepSeekJson({
      schema: z.object({ answer: z.string() }),
      system: "Return a short JSON answer.",
      input: { question: "What is the ticket price? Call 0912345678 or minh@example.com. Coordinates 10.87485, 106.87036." },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { messages: Array<{ content: string }> };
    const modelInput = body.messages[1].content;
    expect(modelInput).toContain("What is the ticket price?");
    expect(modelInput).toContain("[phone redacted]");
    expect(modelInput).toContain("[email redacted]");
    expect(modelInput).toContain("[coordinates redacted]");
    expect(modelInput).not.toContain("0912345678");
    expect(modelInput).not.toContain("minh@example.com");
    expect(modelInput).not.toContain("10.87485");
    expect(modelInput).not.toContain("106.87036");
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

  it("keeps unspecified trip fields open and sends follow-up answers back to the parser", async () => {
    process.env.DEEPSEEK_API_KEY = "unit-test-key";
    const incompleteIntent = {
      ...validIntent,
      durationDays: null,
      partySize: null,
      travelDate: null,
      transport: "unknown",
      budgetVnd: null,
      budgetFlexible: false,
      travelDateFlexible: false,
      transportFlexible: false,
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(incompleteIntent) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await interpretTrip(tripInputSchema.parse({
      prompt: "Muốn đi nghỉ dưỡng ở Đồng Nai.",
      consent: true,
      locale: "vi",
      clarificationHistory: [{ questions: ["Mấy ngày?"], answer: "Tên tôi là Nguyễn Văn An, đi 3 ngày." }],
    }));

    expect(result.durationDays).toBeNull();
    expect(result.partySize).toBeNull();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { messages: Array<{ content: string }> };
    const modelInput = JSON.parse(body.messages[1].content) as { clarificationHistory: Array<{ answer: string }> };
    expect(modelInput.clarificationHistory[0].answer).toContain("[name redacted]");
    expect(modelInput.clarificationHistory[0].answer).toContain("đi 3 ngày");
    expect(modelInput.clarificationHistory[0].answer).not.toContain("Nguyễn Văn An");
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
