import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

export async function DELETE(_request: Request, { params }: { params: Promise<{ tripId: string; shareId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in before revoking a link.");
  const { tripId, shareId } = await params;
  if (!z.string().uuid().safeParse(tripId).success || !z.string().uuid().safeParse(shareId).success) return jsonError(404, "not_found", "Share link not found.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase before revoking a link.");
  const { data, error } = await supabase.from("trip_shares").delete().eq("id", shareId).eq("trip_id", tripId).select("id").maybeSingle();
  if (error) return jsonError(503, "database_unavailable", "This share link could not be revoked.");
  if (!data) return jsonError(404, "not_found", "Share link not found.");
  return NextResponse.json({ success: true });
}
