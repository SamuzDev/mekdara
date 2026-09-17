import { Elysia } from "elysia";
import { Pool } from "pg";
import { checkRateLimit, getRateLimitInfo } from "../middleware/rateLimitVercel";
import { getClientIp } from "../middleware/rateLimitPluginVercel";

let dbPool: Pool | null = null;

function getPool(): Pool {
  if (!dbPool) {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return dbPool;
}

export const healthRoutes = new Elysia()
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }))
  .get("/health/db", async () => {
    try {
      const client = await getPool().connect();
      await client.query("SELECT 1");
      client.release();
      return { status: "ok" };
    } catch {
      return { status: "error" };
    }
  })
  .get("/health/rate-limit", async ({ headers }) => {
    const ip = getClientIp(headers);
    const apiKey = headers["authorization"]?.replace("Bearer ", "") ?? "";
    const hasApiKey = apiKey.length > 0;
    const identifier = hasApiKey ? `key:${apiKey}` : `ip:${ip}`;

    const info = await getRateLimitInfo(identifier, hasApiKey, hasApiKey ? apiKey : undefined);

    return {
      limit: info.limit,
      remaining: info.remaining,
      resetAt: info.resetAt,
    };
  });