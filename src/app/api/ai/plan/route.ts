import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { consumeAiAllowance } from "@/lib/ai-limit";
import { AiProviderError, interpretTrip } from "@/lib/deepseek";
import { buildPlans } from "@/lib/planner";
import { tripInputSchema } from "@/lib/schemas";
import { jsonError } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlaceCatalog } from "@/lib/catalog-server";
import { toTripIntent, tripClarificationQuestions } from "@/lib/trip-clarification";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "sign_in_required", "Sign in to create an AI itinerary.");

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError(400, "invalid_json", "Request body must be valid JSON."); }
  const parsed = tripInputSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "invalid_request", "Check the trip description and try again.");

  const limit = await consumeAiAllowance(user.id);
  if (limit === "unconfigured") return jsonError(503, "ai_limits_not_configured", "Configure Upstash before enabling AI on this deployment.");
  if (limit === "unavailable") return jsonError(503, "ai_limits_unavailable", "The AI safety limit service is not available yet. Please try again later.");
  if (limit === "limited") return jsonError(429, "rate_limit", "AI request limit reached. Please try again later.");

  try {
    const startedAt = Date.now();
    const catalog = await getPlaceCatalog();
    const interpretation = await interpretTrip(parsed.data, catalog);
    const questions = tripClarificationQuestions(interpretation, parsed.data.locale);
    if (questions.length) {
      return NextResponse.json({ status: "needs_clarification", questions }, { headers: { "Cache-Control": "no-store" } });
    }
    const intent = toTripIntent(interpretation);
    if (!intent) return jsonError(502, "ai_invalid_output", "AI needs more trip details before it can prepare suggestions.");
    const planningPrompt = [
      parsed.data.prompt,
      ...parsed.data.clarificationHistory.map((turn) => `Questions: ${turn.questions.join(" ")}\nUser answer: ${turn.answer}`),
    ].join("\n");
    const options = await buildPlans(intent, planningPrompt, catalog);
    const warnings = [...new Set(options.flatMap((option) => option.warnings))];
    const supabase = await createSupabaseServerClient();
    if (supabase) { try { await supabase.from("ai_usage").insert({ user_id: user.id, feature: "trip_plan", model_name: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash", duration_ms: Date.now() - startedAt, outcome: "success" }); } catch { /* Usage logging is best-effort and never logs request content. */ } }
    return NextResponse.json({ status: "ready", intent, options, warnings, generatedAt: new Date().toISOString(), demo: process.env.DEMO_MODE !== "false" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AiProviderError) {
      const status = error.code === "not_configured" ? 503 : error.code === "invalid_output" ? 502 : 502;
      const code = error.code === "not_configured" ? "ai_not_configured" : error.code === "invalid_output" ? "ai_invalid_output" : "ai_unavailable";
      return jsonError(status, code, error.message);
    }
    return jsonError(500, "plan_failed", "The itinerary could not be completed. No trip was saved.");
  }
}
