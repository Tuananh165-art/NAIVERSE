import { z } from "zod";

export const localeSchema = z.enum(["vi", "en"]);
export const externalHttpUrlSchema = z.url().max(2048).refine((value) => {
  const url = new URL(value);
  return url.protocol === "http:" || url.protocol === "https:";
}, "Only HTTP or HTTPS evidence URLs are allowed.");

export const tripInputSchema = z.object({
  prompt: z.string().trim().min(12).max(1200),
  consent: z.literal(true),
  durationDays: z.number().int().min(1).max(3).optional(),
  partySize: z.number().int().min(1).max(40).optional(),
  travelDate: z.iso.date().optional(),
  transport: z.enum(["car", "private_vehicle", "motorbike", "bus", "bicycle", "walking", "unknown"]).optional(),
  budgetVnd: z.number().int().min(0).max(500_000_000).nullable().optional(),
  startPlaceId: z.string().max(80).nullable().optional(),
  locale: localeSchema.default("vi"),
});

export const tripIntentSchema = z.object({
  durationDays: z.number().int().min(1).max(3),
  partySize: z.number().int().min(1).max(40),
  travelDate: z.iso.date().nullable(),
  transport: z.enum(["car", "private_vehicle", "motorbike", "bus", "bicycle", "walking", "unknown"]),
  budgetVnd: z.number().int().min(0).max(500_000_000).nullable(),
  interests: z.array(z.enum(["nature", "culture", "family", "food", "stay", "experience"])).max(6),
  regions: z.array(z.string().max(100)).max(5),
  requiredPlaceIds: z.array(z.string().max(80)).max(5),
  childHeightCm: z.number().int().min(50).max(220).nullable(),
  lowMobility: z.boolean(),
  rainyDay: z.boolean(),
  missingInformation: z.array(z.string().max(160)).max(5),
});

export const inquirySchema = z.object({
  tripId: z.string().uuid(),
  contactName: z.string().trim().min(2).max(100),
  contactEmail: z.email().max(254),
  message: z.string().trim().max(1400).default(""),
  consent: z.literal(true),
});

export const quoteSchema = z.object({
  inquiryId: z.string().uuid(),
  currency: z.literal("VND"),
  items: z.array(z.object({
    label: z.string().trim().min(2).max(160),
    quantity: z.number().positive().max(10000),
    unitPriceVnd: z.number().int().min(0).max(500_000_000).nullable(),
  sourceUrl: externalHttpUrlSchema.nullable(),
    note: z.string().max(300).default(""),
  })).min(1).max(30),
  terms: z.string().trim().max(1600).default(""),
});

export const conditionsInputSchema = z.object({
  mode: z.enum(["weather", "incident"]),
  locale: localeSchema.default("vi"),
  consent: z.literal(true),
  latitude: z.number().min(8).max(24).optional(),
  longitude: z.number().min(102).max(110).optional(),
  travelDate: z.iso.date().optional(),
  activity: z.string().trim().max(240).default(""),
  incident: z.string().trim().max(1000).optional(),
}).strict().refine((value) => value.mode !== "weather" || (
  value.latitude !== undefined && value.longitude !== undefined && value.travelDate !== undefined
), "Weather requests need a coarse location and date.").refine((value) => value.mode !== "incident" || Boolean(value.incident && value.incident.length >= 1), "Describe the incident briefly.");

export const conditionsAdviceSchema = z.object({
  summary: z.string().trim().min(8).max(500),
  practicalSteps: z.array(z.string().trim().min(3).max(220)).max(5),
  indoorAlternative: z.string().trim().max(240),
  greenAdvice: z.array(z.string().trim().min(3).max(220)).max(4),
  urgency: z.enum(["routine", "prompt_human_help", "emergency"]),
  incidentCategory: z.enum(["weather", "injury", "lost_item", "unsafe_condition", "scam_concern", "wildlife", "other"]),
}).strict();

export const routeAssistInputSchema = z.object({
  locale: localeSchema.default("vi"),
  consent: z.literal(true),
  purpose: z.enum(["fastest", "shortest", "easy", "avoid_night", "green"]),
  departureTime: z.iso.datetime().optional(),
  partySize: z.number().int().min(1).max(40).default(2),
  childSeatNeeded: z.boolean().default(false),
  stops: z.array(z.object({
    name: z.string().trim().min(2).max(100),
    latitude: z.number().min(8).max(24),
    longitude: z.number().min(102).max(110),
  }).strict()).min(2).max(8),
}).strict();

export const routeAdviceSchema = z.object({
  recommendation: z.enum(["fastest", "shortest"]),
  explanation: z.string().trim().min(8).max(500),
  tradeoffs: z.array(z.string().trim().min(3).max(220)).max(4),
  reminders: z.array(z.string().trim().min(3).max(220)).max(5),
}).strict();

export const guideInputSchema = z.object({
  placeId: z.string().regex(/^[a-z0-9-]{2,80}$/),
  intent: z.enum(["overview", "price", "hours", "family_access", "source_status"]),
  locale: localeSchema.default("vi"),
  consent: z.literal(true),
}).strict();

export const guideAnswerSchema = z.object({
  answer: z.string().trim().min(8).max(1400),
  followUpQuestions: z.array(z.string().trim().min(5).max(180)).max(3),
  citations: z.array(z.string().trim().min(3).max(120)).min(1).max(6),
}).strict();

export const priceReviewInputSchema = z.object({
  placeId: z.string().regex(/^[a-z0-9-]{2,80}$/),
  quoteText: z.string().trim().min(30).max(4000),
  locale: localeSchema.default("vi"),
  consent: z.literal(true),
}).strict();

const boundedQuoteDetailsSchema = z.preprocess(
  (value: unknown) => Array.isArray(value) ? value.slice(0, 6) : typeof value === "string" ? [value] : [],
  z.array(z.string().trim().min(2).max(140)).max(6).catch([]),
);

export const priceReviewItemSchema = z.object({
  label: z.string().trim().min(2).max(120),
  priceText: z.string().trim().max(100),
  audience: z.string().trim().max(180),
  validity: z.string().trim().max(180),
  included: boundedQuoteDetailsSchema,
  excluded: boundedQuoteDetailsSchema,
  evidence: z.string().trim().max(260),
  possibleReferenceId: z.string().regex(/^[a-z0-9-]{2,120}$/).nullable(),
  missingFields: z.array(z.enum(["audience", "unit", "validity", "included", "excluded", "taxes_fees", "cancellation"])).max(7),
}).strict();

export const priceReviewOutputSchema = z.object({
  items: z.array(priceReviewItemSchema).min(1).max(10),
  questions: z.array(z.string().trim().min(5).max(180)).max(5),
}).strict();

export const packingInputSchema = z.object({
  locale: localeSchema.default("vi"),
  consent: z.literal(true),
  durationDays: z.number().int().min(1).max(3),
  partySize: z.number().int().min(1).max(40),
  transport: z.enum(["car", "private_vehicle", "motorbike", "bus", "bicycle", "walking", "unknown"]),
  interests: z.array(z.enum(["nature", "culture", "family", "food", "stay", "experience"])).max(6),
  childHeightCm: z.number().int().min(50).max(220).nullable(),
  lowMobility: z.boolean(),
  rainyDay: z.boolean(),
  placeIds: z.array(z.string().regex(/^[a-z0-9-]{2,80}$/)).min(1).max(9),
}).strict().refine((value) => new Set(value.placeIds).size === value.placeIds.length, "Place IDs must be unique.");

export const packingItemCodeSchema = z.enum([
  "sun_protection", "water_bottle", "comfortable_shoes", "rain_layer", "waterproof_bag",
  "insect_repellent", "personal_medication", "small_first_aid", "power_bank", "change_clothes",
  "child_snacks", "child_spare_clothes", "personal_mobility_aid", "reusable_bag", "personal_id",
]);
export const packingReasonCodeSchema = z.enum([
  "general_preparedness", "multi_day", "child_specific", "outdoor_activity", "rain_plan",
  "personal_health", "limited_mobility", "group_organization",
]);
export const packingOutputSchema = z.object({
  items: z.array(z.object({
    code: packingItemCodeSchema,
    priority: z.number().int().min(1).max(3),
    reason: packingReasonCodeSchema,
  }).strict()).min(4).max(8),
}).strict();

export type TripInput = z.infer<typeof tripInputSchema>;
export type TripIntent = z.infer<typeof tripIntentSchema>;
