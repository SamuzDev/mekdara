import { Elysia } from "elysia";
import { Pool } from "pg";

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
  });
