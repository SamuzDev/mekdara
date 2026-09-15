# Contributing to Mekdara

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) v1.4.x
- [Git](https://git-scm.com)

### Clone and Install

```bash
git clone https://github.com/SamuzDev/mekdara.git
cd mekdara
bun install
```

### Run Development Servers

```bash
bun run dev
```

This starts both frontend (port 5173) and backend (port 8080) in parallel.

## Project Structure

```
mekdara/
├── frontend/              # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── lib/           # Utilities (auth-client, etc.)
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── vite.config.ts
├── backend/               # Elysia + Bun
│   ├── src/
│   │   ├── converters/    # Format converters (URL, PDF, HTML, text)
│   │   ├── middleware/     # Auth, rate limiting, logging
│   │   ├── routes/        # API routes (convert, auth, health)
│   │   ├── auth.ts        # Better Auth config
│   │   └── index.ts       # Server entry point
│   ├── server.ts          # Vercel entry point
│   ├── package.json
│   └── vercel.json
└── docs/                  # Documentation
```

## Code Style

- **Language**: All code, comments, and UI text in English
- **Runtime**: Bun (not Node.js)
- **Formatting**: `bun format` (Prettier via Bun)
- **Linting**: `bun lint` (ESLint)

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new conversion format
fix: resolve rate limiting issue
docs: update API documentation
refactor: simplify converter logic
```

## Adding a New Converter

1. Create `backend/src/converters/yourformat.ts`:

```ts
import type { ConversionResult } from "./url.js";

export async function convertYourFormat(buffer: Buffer): Promise<ConversionResult> {
  // Your conversion logic
  return {
    markdown: "converted content",
    metadata: { wordCount: 100, format: "yourformat" },
  };
}
```

2. Register it in `backend/src/routes/convert.ts`:

```ts
import { convertYourFormat } from "../converters/yourformat.js";

// Add to the converter registry
const converters: Record<string, (buffer: Buffer) => Promise<ConversionResult>> = {
  // ...existing converters
  yourformat: convertYourFormat,
};
```

3. Add MIME type detection if needed.

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test backend/src/converters/pdf.test.ts
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `bun test`
5. Run linter: `bun lint`
6. Commit with conventional commit message
7. Push and create a Pull Request

## Environment Variables

See `docs/DEPLOY.md` for the full list of environment variables.

For local development, you need:

**Backend** (`backend/.env`):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Random secret
- `GITHUB_CLIENT_ID` — GitHub OAuth Client ID
- `GITHUB_CLIENT_SECRET` — GitHub OAuth Client Secret

**Frontend** (`frontend/.env.local`):
- `VITE_API_BASE_URL` — Backend URL (default: `http://localhost:8080`)

## Questions?

Open an issue on [GitHub](https://github.com/SamuzDev/mekdara/issues).
