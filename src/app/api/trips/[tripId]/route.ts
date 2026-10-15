import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

const updateSchema = z.object({ title: z.string().trim().min(2).max(90) }).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in before updating a trip.");
  const { tripId } = await params;
  if (!z.string().uuid().safeParse(tripId).success) return jsonError(404, "not_found", "Trip not found.");
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "Request body must be valid JSON."); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return jsonError(400, "invalid_request", "No valid trip changes were provided.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase before saving changes.");
  const { data, error } = await supabase.from("trips").update(parsed.data).eq("id", tripId).eq("user_id", user.id).select("id,title,updated_at").maybeSingle();
  if (error) return jsonError(503, "database_unavailable", "The trip could not be updated.");
  if (!data) return jsonError(404, "not_found", "Trip not found.");
  return NextResponse.json({ trip: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in before deleting a trip.");
  const { tripId } = await params;
  if (!z.string().uuid().safeParse(tripId).success) return jsonError(404, "not_found", "Trip not found.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase before deleting a trip.");
  const { data, error } = await supabase.from("trips").delete().eq("id", tripId).eq("user_id", user.id).select("id").maybeSingle();
  if (error) return jsonError(503, "database_unavailable", "The trip could not be deleted.");
  if (!data) return jsonError(404, "not_found", "Trip not found.");
  return NextResponse.json({ success: true });
}
