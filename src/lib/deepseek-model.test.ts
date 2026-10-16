import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

import { interpretTrip, requestDeepSeekJson } from "@/lib/deepseek";
import { tripInputSchema } from "@/lib/schemas";

const intent = {
  durationDays: 1,
  partySize: 2,
  travelDate: null,
  transport: "unknown",
  budgetVnd: null,
  interests: [],
  regions: [],
  requiredPlaceIds: [],
  childHeightCm: null,
  lowMobility: false,
  rainyDay: false,
  missingInformation: [],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configure(model = "deepseek-v4-flash") {
  vi.stubEnv("DEEPSEEK_API_KEY", "unit-test-key");
  vi.stubEnv("DEEPSEEK_MODEL", model);
}

describe("DeepSeek model contract", () => {
  it("uses only the configured deepseek-v4-flash alias for shared JSON features", async () => {
    configure();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ answer: "A source-backed answer." }) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await requestDeepSeekJson({
      schema: z.object({ answer: z.string() }),
      system: "Return JSON.",
      input: { question: "What can I visit?" },
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).model).toBe("deepseek-v4-flash");
  });

  it("uses only the configured deepseek-v4-flash alias for Trip DNA", async () => {
    configure();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(intent) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await interpretTrip(tripInputSchema.parse({
      prompt: "Two adults visiting Dong Nai for one day.",
      consent: true,
      locale: "en",
    }));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).model).toBe("deepseek-v4-flash");
  });

  it("fails closed instead of calling a different model for shared JSON features", async () => {
    configure("deepseek-chat");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestDeepSeekJson({
      schema: z.object({ answer: z.string() }),
      system: "Return JSON.",
      input: { question: "What can I visit?" },
    })).rejects.toMatchObject({ code: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed instead of calling a different model for Trip DNA", async () => {
    configure("deepseek-chat");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(interpretTrip(tripInputSchema.parse({
      prompt: "Two adults visiting Dong Nai for one day.",
      consent: true,
      locale: "en",
    }))).rejects.toMatchObject({ code: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
