/**
 * In-memory rate limiter for Vercel (serverless).
 * Resets on cold starts, but works without bun:sqlite.
 */

import { Pool } from "pg";

const IS_VERCEL = process.env.VERCEL === "1";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: parseInt(process.env.RATE_LIMIT_ANONYMOUS ?? "50", 10),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "3600000", 10),
};

const API_KEY_CONFIG: RateLimitConfig = {
  limit: parseInt(process.env.RATE_LIMIT_API_KEY ?? "5000", 10),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours for daily limits
};

// Cache for API key bonus tokens (key -> bonus tokens)
const apiKeyBonusCache = new Map<string, number>();

let bonusPool: Pool | null = null;
function getBonusPool(): Pool {
  if (!bonusPool) {
    bonusPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return bonusPool;
}

async function getBonusTokens(apiKey: string): Promise<number> {
  if (apiKeyBonusCache.has(apiKey)) {
    return apiKeyBonusCache.get(apiKey)!;
  }

  try {
    const pool = getBonusPool();
    const client = await pool.connect();
    const result = await client.query(
      `SELECT "bonusTokens" FROM "user" WHERE "apiKey" = $1`,
      [apiKey]
    );
    client.release();

    const bonus = result.rows[0]?.bonusTokens ?? 0;
    apiKeyBonusCache.set(apiKey, bonus);
    return bonus;
  } catch {
    return 0;
  }
}

function getWindowStart(windowMs: number): number {
  return Math.floor(Date.now() / windowMs) * windowMs;
}

export async function getRateLimitConfig(
  hasApiKey: boolean,
  apiKey?: string
): Promise<RateLimitConfig> {
  if (!hasApiKey || !apiKey) {
    return DEFAULT_CONFIG;
  }

  const bonus = await getBonusTokens(apiKey);
  return {
    limit: API_KEY_CONFIG.limit + bonus,
    windowMs: API_KEY_CONFIG.windowMs,
  };
}

const rateLimitMap = new Map<string, Map<number, number>>();

export async function checkRateLimit(
  identifier: string,
  hasApiKey: boolean,
  apiKey?: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const config = await getRateLimitConfig(hasApiKey, apiKey);
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

export async function getRateLimitInfo(
  identifier: string,
  hasApiKey: boolean,
  apiKey?: string
) {
  const config = await getRateLimitConfig(hasApiKey, apiKey);
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