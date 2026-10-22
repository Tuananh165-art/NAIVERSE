import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeSignupAllowance } from "@/lib/auth-limit";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

const signupSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
  fullName: z.string().trim().min(2).max(100),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,24}$/),
  locale: z.enum(["vi", "en"]),
}).strict();

const CONFIRMATION_REDIRECT_URL = "https://naiverse.vercel.app/";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "Request body must be valid JSON."); }
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid_request", "Enter a valid name, username, email and password.");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return jsonError(503, "supabase_not_configured", "Configure Supabase before creating an account.");

  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await consumeSignupAllowance(ip, parsed.data.email);
  if (limit === "unconfigured") return jsonError(503, "auth_limits_not_configured", "Configure Upstash before enabling public sign-up.");
  if (limit === "unavailable") return jsonError(503, "auth_limits_unavailable", "Sign-up protection is temporarily unavailable.");
  if (limit === "limited") return jsonError(429, "auth_rate_limit", "Too many sign-up attempts. Please wait and try again.");

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: CONFIRMATION_REDIRECT_URL,
        data: {
          full_name: parsed.data.fullName,
          username: parsed.data.username,
          locale: parsed.data.locale,
        },
      },
    });
    if (error) return jsonError(error.status === 429 ? 429 : 400, error.code ?? "signup_failed", error.message);

    if (data.session) {
      const cookieStore = await cookies();
      const sessionClient = createServerClient(url, anonKey, {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      });
      const { error: sessionError } = await sessionClient.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) return jsonError(500, "session_creation_failed", "Could not complete sign-up. Please retry.");
    }

    return NextResponse.json({ ok: true, session: Boolean(data.session) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return jsonError(503, "signup_unavailable", "Sign-up is temporarily unavailable. Please retry later.");
  }
}
