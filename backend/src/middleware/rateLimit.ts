/**
 * SQLite-backed rate limiter.
 * Persists across restarts and works with multiple instances
 * sharing the same database file.
 */

import { Database } from "bun:sqlite";
import path from "path";
import fs from "fs";
import { Pool } from "pg";

const IS_VERCEL = process.env.VERCEL === "1";
const DB_PATH = process.env.DB_PATH ?? (IS_VERCEL ? "/tmp/mekdara.db" : "./data/mekdara.db");

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Create table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS rate_limits (
    identifier TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (identifier, window_start)
  )
`);

// Create index for cleanup queries
db.run(`
  CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON rate_limits(window_start)
`);

// Prepared statements for performance
const insertStmt = db.prepare(
  `INSERT INTO rate_limits (identifier, window_start, count) VALUES (?, ?, 1)
   ON CONFLICT(identifier, window_start) DO UPDATE SET count = count + 1`
);

const countStmt = db.prepare(
  `SELECT count FROM rate_limits WHERE identifier = ? AND window_start = ?`
);

const deleteStmt = db.prepare(
  `DELETE FROM rate_limits WHERE window_start < ?`
);

export interface RateLimitConfig {
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

// Cache for API key bonus tokens
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

export async function checkRateLimit(
  identifier: string,
  hasApiKey: boolean,
  apiKey?: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const config = await getRateLimitConfig(hasApiKey, apiKey);
  const windowStart = getWindowStart(config.windowMs);
  const resetAt = windowStart + config.windowMs;

  // Increment count (upsert)
  insertStmt.run(identifier, windowStart);

  // Get current count
  const row = countStmt.get(identifier, windowStart) as { count: number } | null;
  const count = row?.count ?? 0;

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

  const row = countStmt.get(identifier, windowStart) as { count: number } | null;
  const count = row?.count ?? 0;

  return {
    remaining: Math.max(0, config.limit - count),
    limit: config.limit,
    resetAt,
  };
}

// Cleanup old entries every 10 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000;
setInterval(() => {
  const cutoff = Date.now() - DEFAULT_CONFIG.windowMs * 2;
  deleteStmt.run(cutoff);
}, CLEANUP_INTERVAL);

// Export db for graceful shutdown
export { db };