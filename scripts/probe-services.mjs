import process from "node:process";

try {
  process.loadEnvFile(".env");
} catch {
  // Deployment environments may supply variables without a local .env file.
}

const env = process.env;
let failed = false;

function report(name, ok, detail) {
  console.log(`${ok ? "PASS" : "CHECK"} ${name}: ${detail}`);
  if (!ok) failed = true;
}

async function jsonRequest(url, init) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000), cache: "no-store" });
  const body = await response.json().catch(() => null);
  return { response, body };
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();

if (!supabaseUrl || !supabaseKey) {
  report("Supabase Auth settings", false, "missing NEXT_PUBLIC_SUPABASE_URL or publishable/anon key");
  report("Supabase public.places", false, "missing NEXT_PUBLIC_SUPABASE_URL or publishable/anon key");
} else {
  let origin;
  try {
    origin = new URL(supabaseUrl).origin;
  } catch {
    origin = null;
  }

  if (!origin) {
    report("Supabase Auth settings", false, "NEXT_PUBLIC_SUPABASE_URL is not a valid URL");
    report("Supabase public.places", false, "NEXT_PUBLIC_SUPABASE_URL is not a valid URL");
  } else {
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
    try {
      const { response } = await jsonRequest(`${origin}/auth/v1/settings`, { headers });
      report("Supabase Auth settings", response.ok, `HTTP ${response.status}`);
    } catch (error) {
      report("Supabase Auth settings", false, `request failed (${error instanceof Error ? error.name : "unknown error"})`);
    }

    const publicTableChecks = [
      { table: "price_references", columns: "id,place_id,item_label,status,source_url,checked_at,approved" },
      { table: "organizations", columns: "id,slug,is_demo,status" },
      { table: "place_media", columns: "id,place_id,credit,license,license_url,approved" },
      { table: "place_hours", columns: "id,place_id,note,note_en,approved" },
    ];
    try {
      const { response, body } = await jsonRequest(`${origin}/rest/v1/places?select=id&limit=100`, {
        headers: { ...headers, Prefer: "count=exact" },
      });
      const code = typeof body?.code === "string" && /^PGRST\d+$/.test(body.code) ? ` ${body.code}` : "";
      const total = response.headers.get("content-range")?.match(/\/(\d+)$/)?.[1];
      const ok = response.ok && total !== undefined;
      const detail = ok
        ? `HTTP ${response.status}; ${total} public place rows (seed expected: 36; does not verify RLS)`
        : `HTTP ${response.status}${code}; count unavailable; check migrations, schema exposure and API key`;
      report("Supabase public.places", ok, detail);
    } catch (error) {
      report("Supabase public.places", false, `request failed (${error instanceof Error ? error.name : "unknown error"})`);
    }

    for (const { table, columns } of publicTableChecks) {
      try {
        const { response, body } = await jsonRequest(`${origin}/rest/v1/${table}?select=${columns}&limit=0`, { headers });
        const code = typeof body?.code === "string" && /^PGRST\d+$/.test(body.code) ? ` ${body.code}` : "";
        const detail = response.ok
          ? `HTTP ${response.status}; required columns are visible (zero rows requested; does not verify RLS)`
          : `HTTP ${response.status}${code}; table or expected columns missing; check migrations, schema exposure and API key`;
        report(`Supabase public.${table}`, response.ok, detail);
      } catch (error) {
        report(`Supabase public.${table}`, false, `request failed (${error instanceof Error ? error.name : "unknown error"})`);
      }
    }
  }
}

const redisUrl = env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = env.UPSTASH_REDIS_REST_TOKEN?.trim();
if (!redisUrl || !redisToken) {
  report("Upstash Redis REST", false, "missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
} else {
  try {
    const { response, body } = await jsonRequest(redisUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(["PING"]),
    });
    const ok = response.ok && body?.result === "PONG";
    const detail = ok
      ? "HTTP 200; PONG"
      : `HTTP ${response.status}; ${typeof body?.error === "string" ? "Redis rejected the command" : "unexpected response"}`;
    report("Upstash Redis REST", ok, detail);
  } catch (error) {
    report("Upstash Redis REST", false, `request failed (${error instanceof Error ? error.name : "unknown error"})`);
  }
}

if (failed) process.exitCode = 1;
