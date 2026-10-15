import { NextResponse } from "next/server";
import { quoteSchema } from "@/lib/schemas";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in before drafting a quote.");
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "Quote details are invalid."); }
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid_request", "Review the quote items and try again.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase before drafting quotes.");
  const { data: inquiry, error: inquiryError } = await supabase.from("inquiries").select("id,organization_id,status").eq("id", parsed.data.inquiryId).maybeSingle();
  if (inquiryError) return jsonError(503, "database_unavailable", "The customer request could not be checked.");
  if (!inquiry) return jsonError(404, "not_found", "Request not found.");
  const { data, error } = await supabase.from("quotes").insert({
    inquiry_id: inquiry.id, organization_id: inquiry.organization_id, author_id: user.id,
    currency: parsed.data.currency, items: parsed.data.items, terms: parsed.data.terms,
    status: "draft", is_demo: process.env.DEMO_MODE !== "false",
  }).select("id,status,created_at").single();
  if (error || !data) return jsonError(503, "quote_not_created", "The draft was not saved.");
  const { error: updateError } = await supabase.from("inquiries").update({ status: "in_review" }).eq("id", inquiry.id);
  if (updateError) return jsonError(503, "quote_saved_status_unavailable", "The quote is saved as a draft, but the request status could not be updated.");
  return NextResponse.json({ quote: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
