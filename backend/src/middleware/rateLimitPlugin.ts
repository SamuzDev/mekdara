import { Elysia } from "elysia";
import {
  checkRateLimit,
  getRateLimitConfig,
  getRateLimitInfo,
} from "./rateLimit";

/**
 * Extract client IP from request headers.
 * Behind Vercel: uses trusted x-vercel-forwarded-for.
 * Local dev: uses X-Forwarded-For (rightmost untrusted IP).
 */
function getClientIp(headers: Record<string, string | undefined>): string {
  const vercelIp = headers["x-vercel-forwarded-for"];
  if (vercelIp) return vercelIp.trim();

  const forwarded = headers["x-forwarded-for"];
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[ips.length - 1] ?? "unknown";
  }

  return headers["x-real-ip"] ?? "unknown";
}

/**
 * Rate limiting plugin.
 * Applies IP-based rate limiting to all routes.
 * If an Authorization header with a non-empty API key is present,
 * the limit is higher.
 */
export const rateLimitPlugin = new Elysia({ name: "rate-limit" })
  .onBeforeHandle(({ headers, set }) => {
    const ip = getClientIp(headers);
    const apiKey = headers["authorization"]?.replace("Bearer ", "") ?? "";
    const hasApiKey = apiKey.length > 0;
    const config = getRateLimitConfig(hasApiKey);
    const identifier = hasApiKey ? `key:${apiKey}` : `ip:${ip}`;

    const result = checkRateLimit(identifier, config);

    if (!result.allowed) {
      set.status = 429;
      set.headers["Retry-After"] = String(
        Math.ceil((result.resetAt - Date.now()) / 1000)
      );
      return {
        error: "Rate limit exceeded. Try again later.",
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      };
    }
  })
  .onAfterHandle(({ headers, set }) => {
    const ip = getClientIp(headers);
    const apiKey = headers["authorization"]?.replace("Bearer ", "") ?? "";
    const hasApiKey = apiKey.length > 0;
    const config = getRateLimitConfig(hasApiKey);
    const identifier = hasApiKey ? `key:${apiKey}` : `ip:${ip}`;
    const info = getRateLimitInfo(identifier, config);

    set.headers["X-RateLimit-Limit"] = String(info.limit);
    set.headers["X-RateLimit-Remaining"] = String(info.remaining);
    set.headers["X-RateLimit-Reset"] = String(Math.ceil(info.resetAt / 1000));
  });
