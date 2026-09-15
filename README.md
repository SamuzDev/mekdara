# Mekdara

**Convert any web page or document to clean Markdown for LLMs.**

Built by **SamuzDev**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bun/bun-original.svg" width="20" height="20" alt="Bun" />&nbsp;
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" width="20" height="20" alt="React" />&nbsp;
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" width="20" height="20" alt="Tailwind" />&nbsp;
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/elysia/elysia-original.svg" width="20" height="20" alt="Elysia" />&nbsp;
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" width="20" height="20" alt="TypeScript" />&nbsp;
[![Neon](https://img.shields.io/badge/Neon-00D4AA?style=flat-square&logo=neon&logoColor=white)](https://neon.tech)

[Quick Start](#quick-start) | [API](#api-reference) | [Self-Host](#self-hosted-deployment)

---

## About the Project

**Mekdara** converts web pages and documents to clean Markdown optimized for LLMs. Convert URLs, PDFs, DOCX, HTML, and text into clean Markdown with token counting, perfect for preparing context for ChatGPT, Claude, Gemini, and others.

⚡ **Key Features:**
- Convert URLs, PDFs, DOCX, HTML, and text
- Token counting for LLM context
- Direct `.md` file download
- Authentication via Better Auth (email + GitHub OAuth)
- Rate limiting by IP/API key
- Deploy on Vercel (monorepo: frontend + backend)

🛠 **Tech Stack:** Bun · Elysia · React 19 · Tailwind CSS 4 · shadcn/ui · Neon Postgres

---

## Features

- **URL to Markdown** - Paste any URL, get clean content (Readability + Turndown)
- **File to Markdown** - Upload PDF, DOCX, CSV, TXT, and more (smart format detection)
- **HTML to Markdown** - Paste raw HTML content
- **Plain Text** - Pass through text, JSON, YAML, and more
- **Token Counting** - See exactly how many tokens you are passing to your LLM
- **Download .md** - One-click download as Markdown file
- **API Access** - REST API with rate limiting and API keys
- **Dark Mode** - Beautiful glassmorphism UI with mesh gradients
- **Authentication** - Email/password + GitHub OAuth via Better Auth

## Quick Start

### Option 1: Clone and Run

```bash
git clone https://github.com/youruser/mekdara.git
cd mekdara
bun install

# Backend (port 8080)
cd backend && bun run dev

# Frontend (port 5173)
cd frontend && bun run dev
```

### Option 2: Docker

```bash
docker compose up -d
# Open http://localhost:5173
```

## Supported Formats

| Format | Endpoint | Library |
| --- | --- | --- |
| URL | `POST /api/convert/url` | Readability + Turndown |
| PDF | `POST /api/convert/file` | pdf-parse |
| DOCX | `POST /api/convert/file` | mammoth |
| HTML | `POST /api/convert/html` | Readability + Turndown |
| CSV | `POST /api/convert/file` | papaparse |
| Plain Text | `POST /api/convert/text` | Native |

## API Reference

### POST `/api/convert/url`

Convert a web page to Markdown.

```json
{ "url": "https://example.com/article" }
```

Response:

```json
{
  "markdown": "# Article Title\n\nContent...",
  "title": "Article Title",
  "metadata": {
    "wordCount": 1234,
    "format": "url",
    "url": "https://example.com/article",
    "author": "John Doe"
  },
  "markdown_tokens": 1234,
  "raw_tokens": 3702
}
```

### POST `/api/convert/file`

Upload any supported file (PDF, DOCX, CSV, TXT, etc.). Smart detection by magic bytes.

Multipart form data with field `file`.

Response: Same structure with `metadata.format` indicating detected type.

### POST `/api/convert/html`

Convert raw HTML content.

```json
{ "content": "<html><body><h1>Hello</h1></body></html>" }
```

### POST `/api/convert/text`

Convert plain text or structured text (JSON, YAML, etc.).

```json
{ "content": "Your text content here" }
```

### Rate Limiting

| Client | Limit | Window |
| --- | --- | --- |
| Anonymous | 20 requests | 1 hour |
| API Key | 200 requests | 1 hour |
| Authenticated | 500 requests | 1 hour |

Rate limit headers are included in every response:

```http
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1699900000
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | [Bun](https://bun.sh) |
| Backend | [Elysia](https://elysiajs.com) + TypeScript |
| Database | SQLite (bun:sqlite) |
| Auth | [Better Auth](https://better-auth.com) |
| Frontend | [React 19](https://react.dev) + [Vite 8](https://vite.dev) |
| UI | [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Conversion | [Readability](https://github.com/mozilla/readability) + [Turndown](https://mixmark-io.github.io/turndown/) + [mammoth](https://github.com/mwilliamson/mammoth.js) + [papaparse](https://www.papaparse.com) |

## Architecture

```mermaid
graph TB
    Client[React Frontend] -->|HTTP| Server[Elysia Backend]
    Server --> Auth[Better Auth]
    Server --> RateLimit[Rate Limiter]
    Server --> Converters[Converter Registry]
    Converters --> URL[url.ts - Readability + Turndown]
    Converters --> PDF[pdf.ts - pdf-parse]
    Converters --> DOCX[docx.ts - mammoth]
    Converters --> HTML[html.ts - JSDOM + Readability]
    Converters --> CSV[csv.ts - papaparse]
    Converters --> TEXT[text.ts - passthrough]
    RateLimit --> SQLite[(SQLite)]
    Auth --> SQLite
```

## Environment Variables

### Backend

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origins (comma-separated) |
| `DB_PATH` | `./data/mekdara.db` | SQLite database path |
| `DATABASE_URL` | - | PostgreSQL connection string (Neon) |
| `BETTER_AUTH_SECRET` | - | Auth secret (32+ chars, required) |
| `BETTER_AUTH_URL` | `http://localhost:8080` | Auth base URL |
| `GITHUB_CLIENT_ID` | - | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | - | GitHub OAuth client secret |
| `MAX_URL_FETCH_SIZE` | `5242880` | Max URL response size (bytes) |
| `URL_FETCH_TIMEOUT` | `15000` | URL fetch timeout (ms) |
| `MAX_FILE_SIZE` | `10485760` | Max upload file size (bytes) |
| `RATE_LIMIT_ANONYMOUS` | `20` | Requests/hour for anonymous |
| `RATE_LIMIT_API_KEY` | `200` | Requests/hour with API key |
| `RATE_LIMIT_AUTHENTICATED` | `500` | Requests/hour for authenticated |

### Frontend

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Backend URL (empty for same-origin) |

## Self-Hosted Deployment

### PM2

```bash
# Backend
cd backend
pm2 start bun --name mekdara-api -- run start

# Frontend (build + serve)
cd frontend
bun run build
pm2 serve dist 5173 --name mekdara-web --spa
```

### Nginx

```nginx
server {
    listen 80;
    server_name mekdara.dev;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Compose

```yaml
services:
  api:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - BETTER_AUTH_SECRET=your-secret-here
      - BETTER_AUTH_URL=https://mekdara.dev
      - CORS_ORIGIN=https://mekdara.dev
      - DB_PATH=/app/data/mekdara.db
      - DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/mekdara?sslmode=require
    volumes:
      - ./data:/app/data

  web:
    build: ./frontend
    ports:
      - "5173:80"
    environment:
      - VITE_API_BASE_URL=https://mekdara.dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built by **SamuzDev**
