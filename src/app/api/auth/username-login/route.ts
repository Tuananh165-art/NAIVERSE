import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeUsernameLoginAllowance } from "@/lib/auth-limit";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

const loginSchema = z.object({ username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,24}$/), password: z.string().min(10).max(128) }).strict();

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "Request body must be valid JSON."); }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid_request", "Enter a valid username and password.");

  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await consumeUsernameLoginAllowance(ip, parsed.data.username);
  if (limit === "unconfigured") return jsonError(503, "auth_limits_not_configured", "Configure Upstash before enabling username sign-in.");
  if (limit === "unavailable") return jsonError(503, "auth_limits_unavailable", "Sign-in protection is temporarily unavailable.");
  if (limit === "limited") return jsonError(429, "auth_rate_limit", "Too many sign-in attempts. Please wait and try again.");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return jsonError(503, "username_auth_not_configured", "Configure Supabase username sign-in on the server.");

  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data: profile, error: profileError } = await admin.from("profiles").select("id").eq("username", parsed.data.username).maybeSingle();
    if (profileError) return jsonError(503, "username_lookup_unavailable", "Sign-in is temporarily unavailable.");
    if (!profile) return jsonError(401, "invalid_credentials", "Invalid username or password.");
    const { data: authUser, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError || !authUser.user?.email) return jsonError(503, "username_lookup_unavailable", "Sign-in is temporarily unavailable.");

    const credentialClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { data: sessionData, error: authError } = await credentialClient.auth.signInWithPassword({ email: authUser.user.email, password: parsed.data.password });
    if (authError || !sessionData.session) return jsonError(401, "invalid_credentials", "Invalid username or password.");

    const cookieStore = await cookies();
    const sessionClient = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    });
    const { error: setSessionError } = await sessionClient.auth.setSession({ access_token: sessionData.session.access_token, refresh_token: sessionData.session.refresh_token });
    if (setSessionError) return jsonError(500, "session_creation_failed", "Could not complete sign-in. Please retry.");
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError(503, "username_lookup_unavailable", "Sign-in is temporarily unavailable.");
  }
}
