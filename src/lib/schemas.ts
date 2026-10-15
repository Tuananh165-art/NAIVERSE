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
  transport: z.enum(["car", "private_vehicle", "motorbike", "bus", "walking", "unknown"]).optional(),
  budgetVnd: z.number().int().min(0).max(500_000_000).nullable().optional(),
  startPlaceId: z.string().max(80).nullable().optional(),
  locale: localeSchema.default("vi"),
});

export const tripIntentSchema = z.object({
  durationDays: z.number().int().min(1).max(3),
  partySize: z.number().int().min(1).max(40),
  travelDate: z.iso.date().nullable(),
  transport: z.enum(["car", "private_vehicle", "motorbike", "bus", "walking", "unknown"]),
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

export type TripInput = z.infer<typeof tripInputSchema>;
export type TripIntent = z.infer<typeof tripIntentSchema>;
