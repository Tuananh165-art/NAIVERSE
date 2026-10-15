import { NextResponse } from "next/server";
import { inquirySchema } from "@/lib/schemas";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

const defaultDemoOrganization = "00000000-0000-4000-8000-000000000001";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in to see your inquiries.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase to see inquiries.");
  const { data, error } = await supabase.from("inquiries").select("id,trip_id,organization_id,status,is_demo,created_at,updated_at,quotes(id,status,items,currency,terms,valid_until,created_at)").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return jsonError(503, "database_unavailable", "Your inquiries are not available right now.");
  return NextResponse.json({ inquiries: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in before sending an inquiry.");
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "Request body must be valid JSON."); }
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid_request", "Check the requested trip and consent.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase before sending an inquiry.");

  const { data: trip, error: tripError } = await supabase.from("trips").select("id,title,locale,trip_intent,plan_data,is_demo").eq("id", parsed.data.tripId).eq("user_id", user.id).maybeSingle();
  if (tripError) return jsonError(503, "database_unavailable", "The itinerary could not be checked.");
  if (!trip) return jsonError(404, "trip_not_found", "Save this itinerary before sending a request.");
  const orgId = defaultDemoOrganization;
  const { data: recipient, error: recipientError } = await supabase.from("organizations").select("id,is_demo,is_public,status").eq("id", orgId).maybeSingle();
  if (recipientError) return jsonError(503, "recipient_unavailable", "The named demo recipient could not be checked.");
  if (!recipient || !recipient.is_demo || !recipient.is_public || recipient.status !== "verified") return jsonError(503, "recipient_not_ready", "The demo travel desk is not configured as a verified demo recipient.");
  const tripSnapshot = { title: trip.title, locale: trip.locale, trip_intent: trip.trip_intent, plan_data: trip.plan_data };
  const { data, error } = await supabase.from("inquiries").insert({
    trip_id: trip.id, organization_id: orgId, customer_id: user.id,
    contact_name: parsed.data.contactName, contact_email: parsed.data.contactEmail,
    message: parsed.data.message, consented_at: new Date().toISOString(), trip_snapshot: tripSnapshot,
    is_demo: trip.is_demo || process.env.DEMO_MODE !== "false",
  }).select("id,status,is_demo,created_at").single();
  if (error || !data) return jsonError(503, "inquiry_not_created", "The request was not sent. Please check the provider configuration and retry.");
  return NextResponse.json({ inquiry: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
