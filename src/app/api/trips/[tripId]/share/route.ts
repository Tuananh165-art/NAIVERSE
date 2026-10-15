import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in to list share links.");
  const { tripId } = await params;
  if (!z.string().uuid().safeParse(tripId).success) return jsonError(404, "not_found", "Trip not found.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase to manage share links.");
  const { data, error } = await supabase.from("trip_shares").select("id,expires_at").eq("trip_id", tripId).order("expires_at", { ascending: false });
  if (error) return jsonError(503, "database_unavailable", "Share links are not available right now.");
  return NextResponse.json({ shares: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in before sharing a trip.");
  const { tripId } = await params;
  if (!z.string().uuid().safeParse(tripId).success) return jsonError(404, "not_found", "Trip not found.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase before sharing a trip.");
  const { data: trip, error: lookupError } = await supabase.from("trips").select("id").eq("id", tripId).eq("user_id", user.id).maybeSingle();
  if (lookupError) return jsonError(503, "database_unavailable", "Sharing is not available right now.");
  if (!trip) return jsonError(404, "not_found", "Trip not found.");

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("trip_shares").insert({ trip_id: tripId, token_hash: tokenHash, expires_at: expiresAt }).select("id").single();
  if (error || !data) return jsonError(503, "database_unavailable", "A share link could not be created.");
  return NextResponse.json({ token, shareId: data.id, expiresAt }, { status: 201, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
