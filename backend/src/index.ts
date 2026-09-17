import "./polyfills";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { convertRoutes } from "./routes/convert";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { logger } from "./middleware/logger";
import { checkRateLimit, getRateLimitInfo } from "./middleware/rateLimit";
import { getClientIp } from "./middleware/rateLimitPlugin";

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
  .onBeforeHandle(async ({ headers, set, request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/health") || url.pathname.startsWith("/api/auth")) return;

    const ip = getClientIp(headers);
    const apiKey = headers["authorization"]?.replace("Bearer ", "") ?? "";
    const hasApiKey = apiKey.length > 0;
    const identifier = hasApiKey ? `key:${apiKey}` : `ip:${ip}`;

    const result = await checkRateLimit(identifier, hasApiKey, hasApiKey ? apiKey : undefined);

    if (!result.allowed) {
      set.status = 429;
      set.headers["Retry-After"] = String(
        Math.ceil((result.resetAt - Date.now()) / 1000)
      );
      return {
        error: "Rate limit exceeded. Try again later.",
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      };
    }
  })
  .onAfterHandle(async ({ headers, set, request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/health") || url.pathname.startsWith("/api/auth")) return;

    const ip = getClientIp(headers);
    const apiKey = headers["authorization"]?.replace("Bearer ", "") ?? "";
    const hasApiKey = apiKey.length > 0;
    const identifier = hasApiKey ? `key:${apiKey}` : `ip:${ip}`;
    const info = await getRateLimitInfo(identifier, hasApiKey, hasApiKey ? apiKey : undefined);

    set.headers["X-RateLimit-Limit"] = String(info.limit);
    set.headers["X-RateLimit-Remaining"] = String(info.remaining);
    set.headers["X-RateLimit-Reset"] = String(Math.ceil(info.resetAt / 1000));
  })
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