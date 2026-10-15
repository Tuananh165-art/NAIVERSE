import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

const statusSchema = z.object({ status: z.enum(["in_review", "closed"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ inquiryId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in to update a customer request.");
  const { inquiryId } = await params;
  if (!z.string().uuid().safeParse(inquiryId).success) return jsonError(404, "not_found", "Request not found.");
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "Choose a valid request status."); }
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid_request", "Choose a valid request status.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase before updating requests.");
  const { data, error } = await supabase.from("inquiries").update({ status: parsed.data.status }).eq("id", inquiryId).select("id,status").maybeSingle();
  if (error) return jsonError(503, "database_unavailable", "The request was not updated. Check organization membership.");
  if (!data) return jsonError(404, "not_found", "Request not found.");
  return NextResponse.json({ inquiry: data });
}
