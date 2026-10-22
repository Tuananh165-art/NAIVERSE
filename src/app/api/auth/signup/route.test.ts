import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServerClient: vi.fn(),
  cookies: vi.fn(),
  consumeSignupAllowance: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/auth-limit", () => ({ consumeSignupAllowance: mocks.consumeSignupAllowance }));

import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "192.0.2.20" },
    body: JSON.stringify(body),
  });
}

const signupBody = {
  email: "naiverse-test@example.com",
  password: "correct-horse-battery",
  fullName: "NaiVerse Test",
  username: "naiverse_test",
  locale: "vi",
};

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-test-key");
    mocks.consumeSignupAllowance.mockResolvedValue("ok");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  });

  it("creates an account with the requested confirmation redirect using Supabase Auth email", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: { identities: [{ id: "identity-1" }] }, session: null },
      error: null,
    });
    mocks.createClient.mockReturnValue({ auth: { signUp } });

    const response = await POST(request(signupBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, session: false });
    expect(signUp).toHaveBeenCalledWith({
      email: signupBody.email,
      password: signupBody.password,
      options: {
        emailRedirectTo: "https://naiverse.vercel.app/",
        data: { full_name: signupBody.fullName, username: signupBody.username, locale: "vi" },
      },
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("handles an existing account without making external mail requests", async () => {
    mocks.createClient.mockReturnValue({ auth: { signUp: vi.fn().mockResolvedValue({
      data: { user: { identities: [] }, session: null },
      error: null,
    }) } });

    const response = await POST(request(signupBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, session: false });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not require Resend credentials to create an account", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    const signUp = vi.fn().mockResolvedValue({
      data: { user: { identities: [{ id: "identity-1" }] }, session: null },
      error: null,
    });
    mocks.createClient.mockReturnValue({ auth: { signUp } });

    const response = await POST(request(signupBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, session: false });
    expect(signUp).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });
});
