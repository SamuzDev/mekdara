import "./src/polyfills";
import "@better-auth/telemetry";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { convertRoutes } from "./src/routes/convert";
import { authRoutes } from "./src/routes/auth";
import { healthRoutes } from "./src/routes/health";
import { logger } from "./src/middleware/logger";
import { checkRateLimit, getRateLimitInfo } from "./src/middleware/rateLimitVercel";
import { getClientIp } from "./src/middleware/rateLimitPluginVercel";

const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) {
  console.warn("[Security] CORS_ORIGIN not set — denying all cross-origin requests");
}

const ALLOWED_ORIGINS = CORS_ORIGIN
  ? CORS_ORIGIN.split(",").map((o) => o.trim())
  : [];

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Mekdara API",
    version: "1.0.0",
    description: "Convert URLs/PDFs to Markdown for LLM context",
    contact: { name: "SamuzDev", email: "deyverabanto@gmail.com" },
    license: { name: "GPL-3.0", url: "https://www.gnu.org/licenses/gpl-3.0.html" },
  },
  servers: [
    { url: "https://mekdara-api.vercel.app", description: "Production" },
    { url: "http://localhost:8080", description: "Development" },
  ],
  tags: [
    { name: "convert", description: "Conversion endpoints" },
    { name: "auth", description: "Authentication" },
    { name: "health", description: "Health checks" },
  ],
  paths: {
    "/api/convert/url": {
      post: {
        tags: ["convert"],
        summary: "Convert URL to Markdown",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UrlRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully converted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConvertResponse" },
              },
            },
          },
          400: { description: "Invalid URL or SSRF protection triggered" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/convert/file": {
      post: {
        tags: ["convert"],
        summary: "Convert uploaded file to Markdown (auto-detect type)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/FileRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully converted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConvertResponse" },
              },
            },
          },
          413: { description: "File too large" },
          422: { description: "Unsupported file type" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/convert/pdf": {
      post: {
        tags: ["convert"],
        summary: "Convert PDF to Markdown",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/FileRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully converted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConvertResponse" },
              },
            },
          },
          413: { description: "File too large" },
          422: { description: "Invalid PDF" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/convert/html": {
      post: {
        tags: ["convert"],
        summary: "Convert HTML to Markdown",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HtmlRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully converted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConvertResponse" },
              },
            },
          },
          413: { description: "Content too large" },
          422: { description: "Invalid HTML" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/convert/text": {
      post: {
        tags: ["convert"],
        summary: "Convert plain text to Markdown",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TextRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully converted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConvertResponse" },
              },
            },
          },
          413: { description: "Content too large" },
          422: { description: "Invalid text" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/health": {
      get: {
        tags: ["health"],
        summary: "Basic health check",
        responses: {
          200: {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                    uptime: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health/db": {
      get: {
        tags: ["health"],
        summary: "Database connectivity check",
        responses: {
          200: {
            description: "Database is reachable",
            content: {
              "application/json": {
                schema: { type: "object", properties: { status: { type: "string" } } },
              },
            },
          },
          500: { description: "Database unreachable" },
        },
      },
    },
    "/health/rate-limit": {
      get: {
        tags: ["health"],
        summary: "Get current rate limit status",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Rate limit info",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    limit: { type: "integer" },
                    remaining: { type: "integer" },
                    resetAt: { type: "integer", format: "int64" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/{*path}": {
      get: {
        tags: ["auth"],
        summary: "Better Auth endpoints",
        parameters: [{ name: "path", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Auth response" } },
      },
      post: {
        tags: ["auth"],
        summary: "Better Auth endpoints",
        parameters: [{ name: "path", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Auth response" } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API Key",
        description: "Optional. Your API key for higher rate limits (5000/day).",
      },
    },
    schemas: {
      UrlRequest: {
        type: "object",
        required: ["url"],
        properties: {
          url: { type: "string", format: "uri", example: "https://example.com" },
        },
      },
      FileRequest: {
        type: "object",
        required: ["file"],
        properties: {
          file: { type: "string", format: "binary" },
        },
      },
      HtmlRequest: {
        type: "object",
        required: ["content"],
        properties: {
          content: { type: "string", example: "<h1>Hello</h1>" },
        },
      },
      TextRequest: {
        type: "object",
        required: ["content"],
        properties: {
          content: { type: "string", example: "Hello world" },
        },
      },
      ConvertResponse: {
        type: "object",
        properties: {
          markdown: { type: "string" },
          title: { type: "string" },
          metadata: {
            type: "object",
            properties: {
              wordCount: { type: "integer" },
              format: { type: "string" },
              extractionMethod: { type: "string" },
              author: { type: "string" },
              excerpt: { type: "string" },
              siteName: { type: "string" },
            },
          },
          markdown_tokens: { type: "integer" },
          raw_tokens: { type: "integer" },
        },
      },
    },
  },
};

const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mekdara API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.1/swagger-ui.css">
  <style>
    body { margin: 0; background: #0a0a0a; }
    .swagger-ui { min-height: 100vh; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.1/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/api/openapi.json",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
    });
  </script>
</body>
</html>`;

const app = new Elysia()
  .use(logger())
  .use(
    cors({
      origin: (request: Request) => {
        const origin = request.headers.get("origin");
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
  .get("/api/openapi.json", () => openApiSpec)
  .get("/swagger", () => new Response(swaggerHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } }))
  .use(healthRoutes)
  .use(authRoutes)
  .use(convertRoutes);

const port = Number(process.env.PORT) || 8080;
app.listen(port);

console.log(`[Mekdara] Server running on http://localhost:${port}`);
console.log(`[Mekdara] Swagger UI: http://localhost:${port}/swagger`);
console.log(`[Mekdara] OpenAPI spec: http://localhost:${port}/api/openapi.json`);

export default app;
