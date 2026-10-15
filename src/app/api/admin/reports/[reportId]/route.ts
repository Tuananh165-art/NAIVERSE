import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

export async function PATCH(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const user = await getCurrentUser(); if (!user) return jsonError(401, "sign_in_required", "Sign in to moderate reports.");
  const supabase = await createSupabaseServerClient(); if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase before moderating reports.");
  const { data: admin } = await supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return jsonError(403, "admin_required", "A platform administrator must provision this account.");
  const { reportId } = await params; if (!z.string().uuid().safeParse(reportId).success) return jsonError(404, "not_found", "Report not found.");
  let body: unknown; try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "Moderation data is invalid."); }
  const parsed = z.object({ status: z.enum(["investigating", "resolved", "dismissed"]), moderatorNote: z.string().trim().max(1000) }).safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid_request", "Choose a moderation decision and note.");
  const { data, error } = await supabase.from("place_reports").update({ status: parsed.data.status, moderator_note: parsed.data.moderatorNote, decided_by: user.id }).eq("id", reportId).select("id,status,moderator_note,updated_at").maybeSingle();
  if (error) return jsonError(503, "moderation_failed", "The report was not updated.");
  if (!data) return jsonError(404, "not_found", "Report not found.");
  return NextResponse.json({ report: data });
}
