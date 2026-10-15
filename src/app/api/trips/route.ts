import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

const saveTripSchema = z.object({
  title: z.string().trim().min(2).max(90),
  locale: z.enum(["vi", "en"]),
  intent: z.record(z.string(), z.unknown()),
  selectedOption: z.string().max(40),
  options: z.array(z.record(z.string(), z.unknown())).min(1).max(3),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in to see saved trips.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase to save trips.");
  const { data, error } = await supabase.from("trips").select("id,title,locale,trip_intent,plan_data,created_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(50);
  if (error) return jsonError(503, "database_unavailable", "Saved trips are not available right now.");
  return NextResponse.json({ trips: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in before saving a trip.");
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "Request body must be valid JSON."); }
  const parsed = saveTripSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid_request", "The trip could not be saved.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase to save trips.");
  const { data, error } = await supabase.from("trips").insert({
    user_id: user.id,
    title: parsed.data.title,
    locale: parsed.data.locale,
    trip_intent: parsed.data.intent,
    plan_data: { options: parsed.data.options, selectedOption: parsed.data.selectedOption },
    is_demo: process.env.DEMO_MODE !== "false",
  }).select("id,title,created_at").single();
  if (error || !data) return jsonError(503, "database_unavailable", "The trip could not be saved. Please retry.");
  return NextResponse.json({ trip: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
