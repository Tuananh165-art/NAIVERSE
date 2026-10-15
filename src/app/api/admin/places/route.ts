import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";
import { externalHttpUrlSchema } from "@/lib/schemas";

const placeIdSchema = z.string().regex(/^[a-z0-9-]{2,80}$/);
const httpsUrlSchema = z.url().max(2048).refine((value) => new URL(value).protocol === "https:");
const nullableDateSchema = z.iso.date().nullable();
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable();
const mediaSchema = z.object({
  type: z.literal("media"), placeId: placeIdSchema, imageUrl: httpsUrlSchema,
  altVi: z.string().trim().min(3).max(240), altEn: z.string().trim().min(3).max(240),
  credit: z.string().trim().min(2).max(160), sourceUrl: httpsUrlSchema,
  license: z.string().trim().min(2).max(80), licenseUrl: httpsUrlSchema,
  checkedAt: z.iso.date(), isArchival: z.boolean(),
}).strict();
const hoursSchema = z.object({
  type: z.literal("hours"), placeId: placeIdSchema, weekdays: z.array(z.number().int().min(-1).max(6)).min(1).max(7),
  opensLocal: timeSchema, closesLocal: timeSchema, status: z.enum(["verified", "historical", "conflicting", "unknown"]),
  note: z.string().trim().max(1000), noteEn: z.string().trim().max(1000),
  validFrom: nullableDateSchema.optional(), validTo: nullableDateSchema.optional(),
  sourceUrl: externalHttpUrlSchema.nullable(), sourceLabel: z.string().trim().min(3).max(200), checkedAt: nullableDateSchema,
}).strict().superRefine((value, ctx) => {
  if (new Set(value.weekdays).size !== value.weekdays.length) ctx.addIssue({ code: "custom", message: "Weekdays must be unique.", path: ["weekdays"] });
  if (value.weekdays.includes(-1) && value.weekdays.length > 1) ctx.addIssue({ code: "custom", message: "General hours cannot be combined with weekday-specific hours.", path: ["weekdays"] });
  if ((value.opensLocal === null) !== (value.closesLocal === null)) ctx.addIssue({ code: "custom", message: "Provide both hours or leave both empty.", path: ["closesLocal"] });
  if (value.validFrom && value.validTo && value.validTo < value.validFrom) ctx.addIssue({ code: "custom", message: "End date must follow start date.", path: ["validTo"] });
  if (value.status === "verified" && (!value.opensLocal || !value.sourceUrl || !value.checkedAt)) ctx.addIssue({ code: "custom", message: "Verified hours need times, a source and a check date.", path: ["status"] });
});
const priceSchema = z.object({
  type: z.literal("price"), placeId: placeIdSchema, itemLabel: z.string().trim().min(2).max(140),
  audience: z.string().trim().min(1).max(160), amountVnd: z.number().int().min(0).max(500_000_000).nullable(),
  status: z.enum(["verified", "historical", "conflicting", "unknown"]),
  validFrom: nullableDateSchema.optional(), validTo: nullableDateSchema.optional(), sourceUrl: externalHttpUrlSchema.nullable(),
  sourceLabel: z.string().trim().min(3).max(200), checkedAt: nullableDateSchema,
  terms: z.string().trim().max(1600), demoLabel: z.string().trim().max(100).nullable().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.validFrom && value.validTo && value.validTo < value.validFrom) ctx.addIssue({ code: "custom", message: "End date must follow start date.", path: ["validTo"] });
  if (value.status === "verified" && (value.amountVnd === null || !value.sourceUrl || !value.checkedAt)) ctx.addIssue({ code: "custom", message: "Verified prices need amount, source and check date.", path: ["status"] });
});
const createRecordSchema = z.discriminatedUnion("type", [mediaSchema, hoursSchema, priceSchema]);
const recordActionSchema = z.object({ type: z.enum(["media", "hours", "price"]), id: z.uuid(), approved: z.boolean().optional() }).strict();
const recordTable = { media: "place_media", hours: "place_hours", price: "price_references" } as const;

const reviewSchema = z.object({ placeId: z.string().min(2).max(80), status: z.enum(["reference", "needs_confirmation", "paused_reference"]), latitude: z.number().min(-90).max(90).nullable(), longitude: z.number().min(-180).max(180).nullable(), coordinatePrecision: z.enum(["entrance_verified", "venue_feature", "approximate"]).nullable(), sourceUrl: externalHttpUrlSchema.nullable(), sourceLabel: z.string().trim().min(3).max(200), checkedAt: z.iso.date().nullable(), statusNote: z.string().trim().min(5).max(500), statusNoteEn: z.string().trim().min(5).max(500) }).strict();
async function adminContext() {
  const user = await getCurrentUser(); if (!user) return { error: jsonError(401, "sign_in_required", "Sign in to open data administration.") };
  const supabase = await createSupabaseServerClient(); if (!supabase) return { error: jsonError(503, "database_not_configured", "Configure Supabase before administering catalog data.") };
  const { data, error } = await supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error) return { error: jsonError(503, "database_unavailable", "Administrator access could not be checked.") };
  if (!data) return { error: jsonError(403, "admin_required", "A platform administrator must provision this account.") };
  return { user, supabase };
}
export async function GET() {
  const context = await adminContext(); if ("error" in context) return context.error;
  const [placesResult, reportsResult, mediaResult, hoursResult, pricesResult] = await Promise.all([
    context.supabase.from("places").select("id,name,name_en,region,region_en,status,status_note,status_note_en,latitude,longitude,coordinate_precision,coordinate_source_url,coordinate_source_label,coordinate_checked_at,evidence,is_group,published,updated_at").order("name"),
    context.supabase.from("place_reports").select("id,place_id,category,message,evidence_url,status,moderator_note,created_at").order("created_at", { ascending: false }).limit(100),
    context.supabase.from("place_media").select("id,place_id,image_url,alt_vi,alt_en,credit,source_url,license,license_url,checked_at,is_archival,approved").order("created_at", { ascending: false }).limit(500),
    context.supabase.from("place_hours").select("id,place_id,weekday,opens_local,closes_local,status,note,note_en,valid_from,valid_to,source_url,source_label,checked_at,approved").order("created_at", { ascending: false }).limit(500),
    context.supabase.from("price_references").select("id,place_id,item_label,audience,amount_vnd,status,valid_from,valid_to,source_url,source_label,checked_at,terms,demo_label,approved").order("created_at", { ascending: false }).limit(500),
  ]);
  if (placesResult.error || reportsResult.error || mediaResult.error || hoursResult.error || pricesResult.error) {
    if (hoursResult.error?.code === "42703") return jsonError(503, "hours_translation_migration_required", "Apply migration 0014_bilingual_place_hours.sql before managing place hours.");
    return jsonError(503, "admin_data_unavailable", "Catalog, reports or evidence records are not available.");
  }
  return NextResponse.json({ places: placesResult.data ?? [], reports: reportsResult.data ?? [], media: mediaResult.data ?? [], hours: hoursResult.data ?? [], prices: pricesResult.data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const context = await adminContext(); if ("error" in context) return context.error;
  let input: unknown; try { input = await request.json(); } catch { return jsonError(400, "invalid_json", "Place evidence data is invalid."); }
  const parsed = createRecordSchema.safeParse(input);
  if (!parsed.success) return jsonError(400, "invalid_request", "Check required evidence, translations, dates and values.");
  const value = parsed.data;
  const { data: place, error: placeError } = await context.supabase.from("places").select("id").eq("id", value.placeId).maybeSingle();
  if (placeError || !place) return jsonError(404, "place_not_found", "Catalog record not found.");

  if (value.type === "media") {
    const { data, error } = await context.supabase.from("place_media").insert({
      place_id: value.placeId, image_url: value.imageUrl, alt_vi: value.altVi, alt_en: value.altEn,
      credit: value.credit, source_url: value.sourceUrl, license: value.license, license_url: value.licenseUrl,
      checked_at: value.checkedAt, is_archival: value.isArchival, approved: false,
    }).select("id,place_id,source_url,approved").single();
    if (error?.code === "23505") return jsonError(409, "duplicate_evidence", "This source is already recorded for the place.");
    if (error) return jsonError(503, "place_media_save_failed", "Photo evidence was not saved.");
    return NextResponse.json({ record: data }, { status: 201 });
  }

  if (value.type === "hours") {
    const rows = value.weekdays.map((weekday) => ({
      place_id: value.placeId, weekday, opens_local: value.opensLocal, closes_local: value.closesLocal,
      status: value.status, note: value.note, note_en: value.noteEn,
      valid_from: value.validFrom ?? null, valid_to: value.validTo ?? null,
      source_url: value.sourceUrl, source_label: value.sourceLabel, checked_at: value.checkedAt ?? null,
      approved: false, updated_by: context.user.id,
    }));
    const { data, error } = await context.supabase.from("place_hours").insert(rows).select("id,place_id,weekday,approved");
    if (error?.code === "42703") return jsonError(503, "hours_translation_migration_required", "Apply migration 0014_bilingual_place_hours.sql before managing place hours.");
    if (error) return jsonError(503, "place_hours_save_failed", "Opening hours were not saved.");
    return NextResponse.json({ records: data ?? [] }, { status: 201 });
  }

  const { data, error } = await context.supabase.from("price_references").insert({
    place_id: value.placeId, item_label: value.itemLabel, audience: value.audience, amount_vnd: value.amountVnd,
    status: value.status, valid_from: value.validFrom ?? null, valid_to: value.validTo ?? null,
    source_url: value.sourceUrl, source_label: value.sourceLabel, checked_at: value.checkedAt ?? null,
    terms: value.terms, demo_label: value.demoLabel ?? null, approved: false, updated_by: context.user.id,
  }).select("id,place_id,item_label,status,approved").single();
  if (error) return jsonError(503, "price_reference_save_failed", "Price evidence was not saved.");
  return NextResponse.json({ record: data }, { status: 201 });
}
export async function PATCH(request: Request) {
  const context = await adminContext(); if ("error" in context) return context.error;
  let input: unknown; try { input = await request.json(); } catch { return jsonError(400, "invalid_json", "Review data is invalid."); }
  const action = recordActionSchema.safeParse(input);
  if (action.success && action.data.approved !== undefined) {
    const { type, id, approved } = action.data;
    const values: Record<string, unknown> = { approved };
    if (type !== "media") values.updated_by = context.user.id;
    const { data, error } = await context.supabase.from(recordTable[type]).update(values).eq("id", id).select("id,approved").maybeSingle();
    if (error) return jsonError(503, "place_record_review_failed", "Place evidence review was not saved.");
    if (!data) return jsonError(404, "place_record_not_found", "Place evidence record not found.");
    return NextResponse.json({ record: data });
  }
  const parsed = reviewSchema.safeParse(input); if (!parsed.success) return jsonError(400, "invalid_request", "Check the source, status and coordinate fields.");
  const value = parsed.data;
  if ((value.latitude === null) !== (value.longitude === null)) return jsonError(400, "coordinate_pair_required", "Provide both coordinates or leave both blank.");
  if ((value.latitude === null) !== (value.coordinatePrecision === null)) return jsonError(400, "coordinate_precision_required", "Coordinates require a position precision label.");
  if (value.latitude !== null && (!value.sourceUrl || !value.checkedAt)) return jsonError(400, "coordinate_evidence_required", "Coordinates require a source URL and check date.");
  if (value.status === "reference" && (!value.sourceUrl || !value.checkedAt)) return jsonError(400, "evidence_required", "A reference status requires a source URL and check date.");
  const { data: current, error: readError } = await context.supabase.from("places").select("evidence").eq("id", value.placeId).maybeSingle();
  if (readError || !current) return jsonError(404, "place_not_found", "Catalog record not found.");
  const evidence = value.sourceUrl ? [...(Array.isArray(current.evidence) ? current.evidence : []), { label: value.sourceLabel, url: value.sourceUrl, checkedAt: value.checkedAt }] : current.evidence;
  const { data, error } = await context.supabase.from("places").update({ status: value.status, latitude: value.latitude, longitude: value.longitude, coordinate_precision: value.coordinatePrecision, coordinate_source_url: value.latitude === null ? null : value.sourceUrl, coordinate_source_label: value.latitude === null ? null : value.sourceLabel, coordinate_checked_at: value.latitude === null ? null : value.checkedAt, status_note: value.statusNote, status_note_en: value.statusNoteEn, evidence, updated_by: context.user.id }).eq("id", value.placeId).select("id,status,latitude,longitude,coordinate_precision,coordinate_source_url,coordinate_checked_at,updated_at").maybeSingle();
  if (error) return jsonError(503, "catalog_update_failed", "Catalog review was not saved.");
  return NextResponse.json({ place: data });
}

export async function DELETE(request: Request) {
  const context = await adminContext(); if ("error" in context) return context.error;
  const parsed = recordActionSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return jsonError(400, "invalid_request", "Choose a valid place evidence record.");
  const { type, id } = parsed.data;
  const { data, error } = await context.supabase.from(recordTable[type]).delete().eq("id", id).select("id").maybeSingle();
  if (error) return jsonError(503, "place_record_delete_failed", "Place evidence record was not deleted.");
  if (!data) return jsonError(404, "place_record_not_found", "Place evidence record not found.");
  return NextResponse.json({ deleted: true });
}
