import "./polyfills";
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
  .onAfterHandle(({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    set.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
  })
  .use(rateLimitPlugin)
  .use(healthRoutes)
  .use(authRoutes)
  .use(convertRoutes)
  .listen({ port: PORT, hostname: HOST });

console.log(
  `🦊 Elysia running at http://${app.server?.hostname}:${app.server?.port}`
);

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

export default app;
