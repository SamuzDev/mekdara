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
      const result = await client.query("SELECT NOW() as time, current_database() as db");
      client.release();
      return {
        status: "ok",
        database: result.rows[0].db,
        serverTime: result.rows[0].time,
      };
    } catch (err: any) {
      return {
        status: "error",
        message: err.message,
        code: err.code,
      };
    }
  });
