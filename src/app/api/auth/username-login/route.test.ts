import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServerClient: vi.fn(),
  cookies: vi.fn(),
  consumeUsernameLoginAllowance: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/auth-limit", () => ({ consumeUsernameLoginAllowance: mocks.consumeUsernameLoginAllowance }));

import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/auth/username-login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "192.0.2.10" },
    body: JSON.stringify(body),
  });
}

function configureSupabase() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-test-key");
  vi.stubEnv("SUPABASE_SECRET_KEY", "secret-test-key");
}

describe("POST /api/auth/username-login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects malformed usernames and short passwords before calling providers", async () => {
    const response = await POST(request({ username: "has space", password: "short" }));

    expect(response.status).toBe(400);
    expect(mocks.consumeUsernameLoginAllowance).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("fails closed when the Upstash auth limiter is not configured", async () => {
    mocks.consumeUsernameLoginAllowance.mockResolvedValue("unconfigured");

    const response = await POST(request({ username: "traveler_01", password: "correct-horse-battery" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "auth_limits_not_configured" } });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("returns the same credential error for an unknown username", async () => {
    mocks.consumeUsernameLoginAllowance.mockResolvedValue("ok");
    configureSupabase();
    mocks.createClient.mockReturnValue({
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    });

    const response = await POST(request({ username: "unknown_user", password: "correct-horse-battery" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "invalid_credentials" } });
  });

  it("creates an SSR session after username lookup and password verification succeed", async () => {
    mocks.consumeUsernameLoginAllowance.mockResolvedValue("ok");
    configureSupabase();
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "user-123" }, error: null });
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: { session: { access_token: "access-test", refresh_token: "refresh-test" } }, error: null,
    });
    const setSession = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient
      .mockReturnValueOnce({
        from: () => ({ select: () => ({ eq: (_column: string, username: string) => {
          expect(username).toBe("traveler_01");
          return { maybeSingle };
        } }) }),
        auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: { email: "traveler@example.com" } }, error: null }) } },
      })
      .mockReturnValueOnce({ auth: { signInWithPassword } });
    mocks.cookies.mockResolvedValue({ getAll: () => [], set: vi.fn() });
    mocks.createServerClient.mockReturnValue({ auth: { setSession } });

    const response = await POST(request({ username: "TRAVELER_01", password: "correct-horse-battery" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "traveler@example.com", password: "correct-horse-battery" });
    expect(setSession).toHaveBeenCalledWith({ access_token: "access-test", refresh_token: "refresh-test" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
