import "server-only";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let redis: Redis | null = null;
let userMinute: Ratelimit | null = null;
let userDaily: Ratelimit | null = null;
let globalDaily: Ratelimit | null = null;

function getLimiters() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis ??= new Redis({ url, token });
  userMinute ??= new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(Number(process.env.AI_USER_MINUTE_LIMIT || 5), "1 m"), prefix: "naiverse:ai:user-minute", analytics: false });
  userDaily ??= new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(Number(process.env.AI_USER_DAILY_LIMIT || 20), "1 d"), prefix: "naiverse:ai:user-daily", analytics: false });
  globalDaily ??= new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(Number(process.env.AI_GLOBAL_DAILY_LIMIT || 200), "1 d"), prefix: "naiverse:ai:global-daily", analytics: false });
  return { userMinute, userDaily, globalDaily };
}

export async function consumeAiAllowance(userId: string): Promise<"ok" | "limited" | "unconfigured" | "unavailable"> {
  const limiters = getLimiters();
  if (!limiters) return "unconfigured";
  try {
    const minute = await limiters.userMinute.limit(userId);
    const daily = minute.success ? await limiters.userDaily.limit(userId) : null;
    const global = daily?.success ? await limiters.globalDaily.limit("all") : null;
    if (!minute.success || !daily?.success || !global?.success) return "limited";
    return "ok";
  } catch {
    return "unavailable";
  }
}
