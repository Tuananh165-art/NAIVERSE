import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

const updateSchema = z.union([
  z.object({ title: z.string().trim().min(2).max(90) }).strict(),
  z.object({
    stopOrder: z.array(z.string().regex(/^[a-z0-9-]{2,80}$/)).min(1).max(9)
      .refine((ids) => new Set(ids).size === ids.length, "Stop IDs must be unique."),
  }).strict(),
]);
const savedPlanSchema = z.object({
  selectedOption: z.string().max(40).optional(),
  options: z.array(z.record(z.string(), z.unknown())).min(1).max(3),
}).passthrough();
const savedStopsSchema = z.array(z.record(z.string(), z.unknown()).refine((stop) =>
  typeof stop.id === "string" && /^[a-z0-9-]{2,80}$/.test(stop.id),
)).min(1).max(9);

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
  if ("title" in parsed.data) {
    const { data, error } = await supabase.from("trips").update(parsed.data).eq("id", tripId).eq("user_id", user.id).select("id,title,updated_at").maybeSingle();
    if (error) return jsonError(503, "database_unavailable", "The trip could not be updated.");
    if (!data) return jsonError(404, "not_found", "Trip not found.");
    return NextResponse.json({ trip: data });
  }

  const { data: current, error: readError } = await supabase.from("trips").select("id,plan_data").eq("id", tripId).eq("user_id", user.id).maybeSingle();
  if (readError) return jsonError(503, "database_unavailable", "The saved trip could not be loaded.");
  if (!current) return jsonError(404, "not_found", "Trip not found.");
  const savedPlan = savedPlanSchema.safeParse(current.plan_data);
  if (!savedPlan.success) return jsonError(409, "trip_plan_not_editable", "This saved trip does not contain an editable itinerary.");

  const selectedOption = savedPlan.data.options.find((option) => option.id === savedPlan.data.selectedOption) ?? savedPlan.data.options[0];
  const optionId = selectedOption.id;
  if (typeof optionId !== "string") return jsonError(409, "trip_plan_not_editable", "This saved trip does not contain a selected itinerary.");
  const parsedStops = savedStopsSchema.safeParse(selectedOption.stops);
  if (!parsedStops.success) return jsonError(409, "trip_plan_not_editable", "This saved itinerary cannot be safely reordered.");
  const stopsById = new Map(parsedStops.data.map((stop) => [stop.id as string, stop]));
  const requestedIds = parsed.data.stopOrder;
  if (requestedIds.length !== stopsById.size || requestedIds.some((id) => !stopsById.has(id))) {
    return jsonError(400, "invalid_stop_order", "Reorder only the stops already in this saved itinerary.");
  }

  const nextOption = {
    ...selectedOption,
    stops: requestedIds.map((id) => stopsById.get(id)),
    route: null,
    orderManuallyChanged: true,
  };
  const nextPlan = {
    ...savedPlan.data,
    options: savedPlan.data.options.map((option) => option.id === optionId ? nextOption : option),
  };
  const { data, error } = await supabase.from("trips").update({ plan_data: nextPlan }).eq("id", tripId).eq("user_id", user.id).select("id,updated_at").maybeSingle();
  if (error) return jsonError(503, "database_unavailable", "The trip order could not be saved.");
  if (!data) return jsonError(404, "not_found", "Trip not found.");
  return NextResponse.json({ trip: data, routeRecalculated: false });
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
