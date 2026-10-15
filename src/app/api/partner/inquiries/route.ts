import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in to open the partner workspace.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return jsonError(503, "database_not_configured", "Configure Supabase to open partner tools.");
  const { data: memberships, error: membershipError } = await supabase.from("organization_members").select("organization_id,role,organizations(id,name,slug,is_demo,status)").eq("user_id", user.id);
  if (membershipError) return jsonError(503, "database_unavailable", "Organization access could not be checked.");
  const organizationIds = (memberships ?? []).filter((membership) => ["owner", "manager", "agent"].includes(membership.role)).map((membership) => membership.organization_id);
  if (!organizationIds.length) return NextResponse.json({ organizations: [], inquiries: [] });
  const { data, error } = await supabase.from("inquiries").select("id,trip_id,organization_id,customer_id,contact_name,contact_email,message,trip_snapshot,status,is_demo,created_at,quotes(id,status,items,currency,terms,valid_until,created_at)").in("organization_id", organizationIds).order("created_at", { ascending: false }).limit(100);
  if (error) return jsonError(503, "database_unavailable", "Partner requests are not available right now.");
  return NextResponse.json({ organizations: memberships, inquiries: data }, { headers: { "Cache-Control": "no-store" } });
}
