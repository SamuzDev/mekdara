import "./src/polyfills";
import "@better-auth/telemetry";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { convertRoutes } from "./src/routes/convert";
import { authRoutes } from "./src/routes/auth";
import { rateLimitPluginVercel } from "./src/middleware/rateLimitPluginVercel";
import { healthRoutes } from "./src/routes/health";
import { logger } from "./src/middleware/logger";

const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) {
  console.warn("[Security] CORS_ORIGIN not set — denying all cross-origin requests");
}

const ALLOWED_ORIGINS = CORS_ORIGIN
  ? CORS_ORIGIN.split(",").map((o) => o.trim())
  : [];

const app = new Elysia()
  .use(logger())
  .use(
    cors({
      origin: (origin) => {
        if (!origin || ALLOWED_ORIGINS.length === 0) return false;
        return ALLOWED_ORIGINS.includes(origin);
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      maxAge: 86400,
    })
  )
  .onAfterHandle(({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    set.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    set.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
    set.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;";
  })
  .use(rateLimitPluginVercel)
  .use(healthRoutes)
  .use(authRoutes)
  .use(convertRoutes);

export default app;
