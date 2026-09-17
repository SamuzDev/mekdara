import { Elysia } from "elysia";
import {
  checkRateLimit,
  getRateLimitConfig,
  getRateLimitInfo,
} from "./rateLimitVercel";

/**
 * Extract client IP from request headers.
 * Uses Vercel's trusted x-vercel-forwarded-for header first,
 * then falls back to X-Forwarded-For (rightmost untrusted IP).
 */
export function getClientIp(headers: Record<string, string | undefined>): string {
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
 * Rate limiting plugin for Vercel (in-memory).
 * Applies IP-based rate limiting to all routes.
 * If an Authorization header with a non-empty API key is present,
 * the limit is higher.
 */
export const rateLimitPluginVercel = new Elysia({ name: "rate-limit-vercel" })
  .onBeforeHandle(async ({ headers, set }) => {
    console.log("[RateLimit] onBeforeHandle running");
    const ip = getClientIp(headers);
    const apiKey = headers["authorization"]?.replace("Bearer ", "") ?? "";
    const hasApiKey = apiKey.length > 0;
    const identifier = hasApiKey ? `key:${apiKey}` : `ip:${ip}`;

    const result = await checkRateLimit(identifier, hasApiKey, hasApiKey ? apiKey : undefined);

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
    console.log("[RateLimit] onBeforeHandle done");
  })
  .onAfterHandle(async ({ headers, set }) => {
    console.log("[RateLimit] onAfterHandle running");
    const ip = getClientIp(headers);
    const apiKey = headers["authorization"]?.replace("Bearer ", "") ?? "";
    const hasApiKey = apiKey.length > 0;
    const identifier = hasApiKey ? `key:${apiKey}` : `ip:${ip}`;
    const info = await getRateLimitInfo(identifier, hasApiKey, hasApiKey ? apiKey : undefined);

    console.log("[RateLimit] Setting headers:", info);
    set.headers["X-RateLimit-Limit"] = String(info.limit);
    set.headers["X-RateLimit-Remaining"] = String(info.remaining);
    set.headers["X-RateLimit-Reset"] = String(Math.ceil(info.resetAt / 1000));
  });