import "server-only";
import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let ipLimiter: Ratelimit | null = null;
let usernameLimiter: Ratelimit | null = null;
let redis: Redis | null = null;

export async function consumeUsernameLoginAllowance(ip: string, username: string): Promise<"ok" | "limited" | "unconfigured" | "unavailable"> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return "unconfigured";
  redis ??= new Redis({ url, token });
  ipLimiter ??= new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(12, "1 m"), prefix: "naiverse:auth:ip", analytics: false });
  usernameLimiter ??= new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m"), prefix: "naiverse:auth:username", analytics: false });
  const digest = createHash("sha256").update(username).digest("hex");
  try {
    const [byIp, byUsername] = await Promise.all([ipLimiter.limit(ip.slice(0, 100)), usernameLimiter.limit(digest)]);
    return byIp.success && byUsername.success ? "ok" : "limited";
  } catch {
    return "unavailable";
  }
}
