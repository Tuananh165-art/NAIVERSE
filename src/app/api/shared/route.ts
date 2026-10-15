import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "A share token is required."); }
  const parsed = z.object({ token: z.string().min(30).max(80) }).safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid_request", "This share link is invalid.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return jsonError(503, "database_not_configured", "Shared trips are not configured.");
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const { data, error } = await client.rpc("get_public_shared_trip", { requested_token_hash: tokenHash });
  if (error) return jsonError(503, "database_unavailable", "The shared trip could not be loaded.");
  if (!data) return jsonError(404, "share_expired", "This share link has expired or was revoked.");
  return NextResponse.json({ trip: data }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
