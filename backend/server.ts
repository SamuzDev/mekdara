import "./src/polyfills";
import "@better-auth/telemetry";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { convertRoutes } from "./src/routes/convert";
import { authRoutes } from "./src/routes/auth";
import { rateLimitPluginVercel } from "./src/middleware/rateLimitPluginVercel";
import { healthRoutes } from "./src/routes/health";
import { logger } from "./src/middleware/logger";

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

const app = new Elysia()
  .use(logger())
  .use(
    cors({
      origin: CORS_ORIGIN.split(",").map((o) => o.trim()),
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(rateLimitPluginVercel)
  .use(healthRoutes)
  .use(authRoutes)
  .use(convertRoutes);

export default app;