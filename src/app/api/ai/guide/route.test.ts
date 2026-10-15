import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  consumeAiAllowance: vi.fn(),
  requestDeepSeekJson: vi.fn(),
  getPlaceCatalog: vi.fn(),
  getPlaceHours: vi.fn(),
  getPlacePriceReferences: vi.fn(),
  ProviderError: class ProviderError extends Error {
    constructor(readonly code: string, message: string) { super(message); }
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  getCurrentUser: mocks.getCurrentUser,
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock("@/lib/ai-limit", () => ({ consumeAiAllowance: mocks.consumeAiAllowance }));
vi.mock("@/lib/deepseek", () => ({
  AiProviderError: mocks.ProviderError,
  requestDeepSeekJson: mocks.requestDeepSeekJson,
}));
vi.mock("@/lib/catalog-server", () => ({
  getPlaceCatalog: mocks.getPlaceCatalog,
  getPlaceHours: mocks.getPlaceHours,
  getPlacePriceReferences: mocks.getPlacePriceReferences,
}));

import { POST } from "@/app/api/ai/guide/route";
import { places } from "@/lib/catalog";

function request(body: unknown) {
  return new Request("http://localhost/api/ai/guide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("AI guide route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.createSupabaseServerClient.mockResolvedValue(null);
    mocks.consumeAiAllowance.mockResolvedValue("ok");
    mocks.getPlaceCatalog.mockResolvedValue(places);
    mocks.getPlaceHours.mockResolvedValue([]);
    mocks.getPlacePriceReferences.mockResolvedValue([]);
    mocks.requestDeepSeekJson.mockImplementation(async (options) => {
      const output = { answer: "Check the operator before visiting.", followUpQuestions: [], citations: ["place:amazing-bay"] };
      const parsed = options.schema.safeParse(output);
      if (!parsed.success) throw new mocks.ProviderError("invalid_output", "invalid mocked model response");
      return parsed.data;
    });
  });

  it("requires a signed-in user and a configured allowance", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null);
    const response = await POST(request({ placeId: "amazing-bay", intent: "overview", locale: "en", consent: true }));
    expect(response.status).toBe(401);
    expect(mocks.consumeAiAllowance).not.toHaveBeenCalled();
  });

  it("rejects free-form text instead of forwarding it to DeepSeek", async () => {
    const response = await POST(request({
      placeId: "amazing-bay",
      intent: "overview",
      question: "My name is Sam and I am staying at a hotel; what should I visit?",
      locale: "en",
      consent: true,
    }));
    expect(response.status).toBe(400);
    expect(mocks.requestDeepSeekJson).not.toHaveBeenCalled();
  });

  it("sends only the fixed task and retrieved public records to DeepSeek", async () => {
    const response = await POST(request({ placeId: "amazing-bay", intent: "overview", locale: "en", consent: true }));
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.aiUsed).toBe(true);
    expect(result.citations[0].ref).toBe("place:amazing-bay");
    const modelInput = mocks.requestDeepSeekJson.mock.calls[0][0].input;
    expect(modelInput).toMatchObject({ placeId: "amazing-bay", locale: "en" });
    expect(modelInput.selectedTask).toContain("Summarize");
    expect(JSON.stringify(modelInput)).not.toContain("question");
    expect(JSON.stringify(modelInput)).not.toContain("Sam");
  });

  it("rejects references to sources that were not retrieved", async () => {
    mocks.requestDeepSeekJson.mockImplementationOnce(async (options) => {
      const output = { answer: "Unsupported source claim.", followUpQuestions: [], citations: ["place:somewhere-else"] };
      const parsed = options.schema.safeParse(output);
      if (!parsed.success) throw new mocks.ProviderError("invalid_output", "invalid mocked model response");
      return parsed.data;
    });
    const response = await POST(request({ placeId: "amazing-bay", intent: "overview", locale: "en", consent: true }));
    expect(response.status).toBe(502);
  });
});
