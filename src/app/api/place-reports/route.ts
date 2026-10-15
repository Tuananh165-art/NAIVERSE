import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";
import { externalHttpUrlSchema } from "@/lib/schemas";

const reportSchema = z.object({ placeId: z.string().min(2).max(80), category: z.enum(["hours", "price", "access", "safety", "location", "copyright", "other"]), message: z.string().trim().min(10).max(1600), evidenceUrl: externalHttpUrlSchema.nullable().optional() });
export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return jsonError(401, "sign_in_required", "Sign in before reporting listing information.");
  let input: unknown; try { input = await request.json(); } catch { return jsonError(400, "invalid_json", "Report details are invalid."); }
  const parsed = reportSchema.safeParse(input); if (!parsed.success) return jsonError(400, "invalid_request", "Check the report category and message.");
  const supabase = await createSupabaseServerClient(); if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase before submitting reports.");
  const { data, error } = await supabase.from("place_reports").insert({ place_id: parsed.data.placeId, reporter_id: user.id, category: parsed.data.category, message: parsed.data.message, evidence_url: parsed.data.evidenceUrl ?? null }).select("id,status,created_at").single();
  if (error || !data) return jsonError(503, "report_unavailable", "The report could not be saved.");
  return NextResponse.json({ report: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
