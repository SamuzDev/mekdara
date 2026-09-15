/**
 * In-memory rate limiter for Vercel (serverless).
 * Resets on cold starts, but works without bun:sqlite.
 */

const IS_VERCEL = process.env.VERCEL === "1";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: parseInt(process.env.RATE_LIMIT_ANONYMOUS ?? "20", 10),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "3600000", 10),
};

const API_KEY_CONFIG: RateLimitConfig = {
  limit: parseInt(process.env.RATE_LIMIT_API_KEY ?? "200", 10),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "3600000", 10),
};

function getWindowStart(windowMs: number): number {
  return Math.floor(Date.now() / windowMs) * windowMs;
}

export function getRateLimitConfig(hasApiKey: boolean): RateLimitConfig {
  return hasApiKey ? API_KEY_CONFIG : DEFAULT_CONFIG;
}

const rateLimitMap = new Map<string, Map<number, number>>();

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetAt: number } {
  const windowStart = getWindowStart(config.windowMs);
  const resetAt = windowStart + config.windowMs;

  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, new Map());
  }

  const windowMap = rateLimitMap.get(identifier)!;
  const count = (windowMap.get(windowStart) ?? 0) + 1;
  windowMap.set(windowStart, count);

  if (count > config.limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return {
    allowed: true,
    remaining: config.limit - count,
    resetAt,
  };
}

export function getRateLimitInfo(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
) {
  const windowStart = getWindowStart(config.windowMs);
  const resetAt = windowStart + config.windowMs;

  const windowMap = rateLimitMap.get(identifier);
  const count = windowMap?.get(windowStart) ?? 0;

  return {
    remaining: Math.max(0, config.limit - count),
    limit: config.limit,
    resetAt,
  };
}

if (IS_VERCEL) {
  setInterval(() => {
    const cutoff = Date.now() - DEFAULT_CONFIG.windowMs * 2;
    for (const [identifier, windowMap] of rateLimitMap.entries()) {
      for (const [windowStart] of windowMap.entries()) {
        if (windowStart < cutoff) {
          windowMap.delete(windowStart);
        }
      }
      if (windowMap.size === 0) {
        rateLimitMap.delete(identifier);
      }
    }
  }, 10 * 60 * 1000);
}