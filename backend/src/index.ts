import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { convertRoutes } from "./routes/convert";
import { authRoutes } from "./routes/auth";
import { rateLimitPlugin } from "./middleware/rateLimitPlugin";
import { healthRoutes } from "./routes/health";
import { logger } from "./middleware/logger";

const PORT = parseInt(process.env.PORT ?? "8080", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const app = new Elysia()
  .use(logger())
  .use(
    cors({
      origin: CORS_ORIGIN.split(",").map((o) => o.trim()),
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(rateLimitPlugin)
  .use(healthRoutes)
  .use(authRoutes)
  .use(convertRoutes)
  .listen({ port: PORT, hostname: HOST });

console.log(
  `🦊 Elysia running at http://${app.server?.hostname}:${app.server?.port}`
);

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  try {
    await app.stop();
    process.exit(0);
  } catch {
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
