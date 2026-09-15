# Architecture

Mekdara is an open-source web monorepo that converts URLs, PDFs, documents, and text to clean Markdown optimized for LLMs.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  Frontend (React)    │    │  Backend (Elysia/Bun)    │   │
│  │  mekdara.vercel.app  │───▶│  mekdara-api.vercel.app  │   │
│  │                      │    │                          │   │
│  │  - Vite + React 19   │    │  - Bun runtime           │   │
│  │  - Tailwind CSS 4    │    │  - Elysia framework      │   │
│  │  - shadcn/ui         │    │  - Better Auth           │   │
│  │  - Speed Insights    │    │  - Rate limiting (SQLite)│   │
│  │  - Analytics         │    │  - Converters (URL/PDF)  │   │
│  └──────────────────────┘    └──────────┬───────────────┘   │
│                                         │                    │
│                                         ▼                    │
│                              ┌──────────────────────┐       │
│                              │    Neon Postgres      │       │
│                              │  (auth + sessions)    │       │
│                              └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
mekdara/
├── frontend/                  # Vercel project: "mekdara-frontend"
│   ├── src/
│   │   ├── components/        # React UI components
│   │   │   ├── Header.tsx
│   │   │   ├── TabBar.tsx
│   │   │   ├── UrlInput.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── TextAreaInput.tsx
│   │   │   ├── ResultView.tsx
│   │   │   ├── LoginModal.tsx
│   │   │   ├── ApiKeyModal.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── lib/
│   │   │   └── auth-client.ts # Better Auth React client
│   │   ├── App.tsx            # Main app component
│   │   └── index.css          # Design tokens + animations
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # Vercel project: "mekdara-api"
│   ├── src/
│   │   ├── converters/        # Format converters
│   │   │   ├── url.ts         # URL → Markdown (Readability + Turndown)
│   │   │   ├── html.ts        # HTML → Markdown
│   │   │   ├── pdf.ts         # PDF → Markdown (pdf-parse)
│   │   │   ├── docx.ts        # DOCX → Markdown (mammoth)
│   │   │   ├── csv.ts         # CSV → Markdown (papaparse)
│   │   │   ├── text.ts        # Plain text passthrough
│   │   │   └── jsdom.ts       # Dynamic JSDOM wrapper
│   │   ├── middleware/
│   │   │   ├── rateLimit.ts           # SQLite rate limiter (local)
│   │   │   ├── rateLimitVercel.ts     # In-memory rate limiter (Vercel)
│   │   │   ├── rateLimitPlugin.ts     # Elysia plugin (local)
│   │   │   ├── rateLimitPluginVercel.ts # Elysia plugin (Vercel)
│   │   │   └── logger.ts             # Request logging
│   │   ├── routes/
│   │   │   ├── convert.ts     # POST /api/convert/*
│   │   │   ├── auth.ts        # ALL /api/auth/*
│   │   │   └── health.ts      # GET /health
│   │   ├── auth.ts            # Better Auth config (Neon)
│   │   └── index.ts           # Local dev entry point
│   ├── server.ts              # Vercel entry point (export default app)
│   ├── package.json
│   └── vercel.json            # Bun runtime config
│
├── docs/                      # Documentation
│   ├── API.md
│   ├── DEPLOY.md
│   ├── CONTRIBUTING.md
│   └── ARCHITECTURE.md
│
├── package.json               # Root workspace config
└── bun.lock                   # Lockfile
```

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite 8** | Build tool + dev server |
| **TypeScript 7** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Component library (base-nova) |
| **Better Auth React** | Session management |
| **Vercel Speed Insights** | Performance monitoring |
| **Vercel Analytics** | Page view tracking |
| **Sonner** | Toast notifications |
| **Lucide React** | Icons |

### Backend

| Technology | Purpose |
|------------|---------|
| **Bun 1.4** | Runtime + package manager |
| **Elysia** | HTTP framework |
| **Better Auth** | Authentication (email + GitHub OAuth) |
| **Neon Postgres** | Auth database (sessions, users) |
| **bun:sqlite** | Rate limiting (local) |
| **pg** | PostgreSQL driver (Neon) |
| **@mozilla/readability** | Content extraction |
| **Turndown** | HTML → Markdown |
| **pdf-parse** | PDF text extraction |
| **mammoth** | DOCX → HTML conversion |
| **papaparse** | CSV/TSV parsing |
| **jsdom** | DOM implementation for Readability |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Vercel** | Hosting (frontend + backend) |
| **Bun Workspaces** | Monorepo management |
| **Neon** | Serverless PostgreSQL |

## Conversion Pipeline

```
Input → Parser → Content Extraction → Markdown → Token Counting → Response

URL  → fetch() → Readability → Turndown → estimateTokens() → JSON
PDF  → pdf-parse → getText()  → (raw)    → estimateTokens() → JSON
HTML → jsdom    → Readability → Turndown → estimateTokens() → JSON
DOCX → mammoth  → convertToHtml → Turndown → estimateTokens() → JSON
CSV  → papaparse → toMarkdown  → (raw)    → estimateTokens() → JSON
Text → (passthrough)           → (raw)    → estimateTokens() → JSON
```

## Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │────▶│ Backend  │────▶│  Neon    │
│          │     │          │     │ Postgres │
└──────────┘     └──────────┘     └──────────┘

Email Sign-up:
1. POST /api/auth/sign-up/email { email, password, name }
2. Backend creates user in Neon
3. Returns session cookie

Email Sign-in:
1. POST /api/auth/sign-in/email { email, password }
2. Backend validates credentials against Neon
3. Returns session cookie

GitHub OAuth:
1. Redirect to /api/auth/sign-in/social?provider=github
2. Backend redirects to GitHub
3. GitHub redirects back to /api/auth/callback/github
4. Backend creates/finds user in Neon
5. Returns session cookie
```

## Rate Limiting

| Environment | Implementation | Persistence |
|-------------|---------------|-------------|
| **Local** | SQLite (`bun:sqlite`) | Persists across restarts |
| **Vercel** | In-memory `Map` | Resets on cold starts |

Rate limits are applied per IP or per API key:

| Tier | Limit | Window |
|------|-------|--------|
| Anonymous | 20 req/hr | 1 hour |
| API Key | 200 req/hr | 1 hour |

## Design System

The frontend uses a professional minimalist dark theme:

- **Glassmorphism**: `backdrop-blur` + semi-transparent backgrounds
- **Animated gradients**: CSS `@keyframes` for ambient orbs
- **Noise texture**: SVG filter overlay
- **Skeleton shimmer**: Loading state animations
- **Reduced motion**: Respects `prefers-reduced-motion`

Design tokens are defined in `frontend/src/index.css` using CSS custom properties.

## Deployment Architecture

```
GitHub Repository
       │
       ▼
┌──────────────────────────────────────────┐
│              Vercel                       │
│                                           │
│  ┌────────────────┐  ┌────────────────┐  │
│  │   Frontend     │  │   Backend      │  │
│  │   (Vite)       │  │   (Bun 1.4)   │  │
│  │                │  │                │  │
│  │  static build  │  │  bundled .js   │  │
│  │  → CDN         │  │  → Serverless  │  │
│  └────────────────┘  └────────────────┘  │
│                                           │
│  Route: /api/* → Backend                  │
│  Route: /*     → Frontend (SPA)           │
└──────────────────────────────────────────┘
```

### Key Decisions

1. **Separate Vercel projects**: Frontend and backend deploy independently. This avoids the `services` config which doesn't support Bun runtime.

2. **Bundled backend**: `bun build --target bund` resolves all imports at build time, avoiding symlink issues with `@better-auth/telemetry` and other peer dependencies.

3. **Dual rate limiters**: SQLite for local (persistent), in-memory for Vercel (ephemeral). Same API, different implementations.

4. **Dynamic JSDOM**: Imported at runtime via `await import("jsdom")` to avoid Node.js compilation errors on Vercel.

5. **Auth via Neon**: Better Auth uses PostgreSQL (Neon) instead of SQLite for session persistence across serverless cold starts.
