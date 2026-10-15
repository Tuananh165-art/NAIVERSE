import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

export async function POST(_request: Request, { params }: { params: Promise<{ quoteId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in before sharing a quote.");
  const { quoteId } = await params;
  if (!z.string().uuid().safeParse(quoteId).success) return jsonError(404, "not_found", "Quote not found.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase before sharing quotes.");
  const { data, error } = await supabase.from("quotes").update({ status: "shared" }).eq("id", quoteId).eq("status", "draft").select("id,inquiry_id,organization_id,status,items,currency,terms,created_at").maybeSingle();
  if (error) return jsonError(503, "database_unavailable", "The quote was not shared. Check organization access.");
  if (!data) return jsonError(404, "not_found", "A draft quote was not found.");
  const { error: inquiryError } = await supabase.from("inquiries").update({ status: "quoted" }).eq("id", data.inquiry_id);
  if (inquiryError) return jsonError(503, "quote_shared_status_unavailable", "The quote is shared in the trip portal; the request status needs an administrator review.");
  return NextResponse.json({ quote: data }, { headers: { "Cache-Control": "no-store" } });
}
