# API Reference

Base URL: `https://mekdara-api.vercel.app`

## Authentication

Mekdara supports two authentication methods:

### API Key (recommended)

Include your API key in the `Authorization` header:

```
Authorization: Bearer mk_live_xxxxxxxxxxxxxxxx
```

API keys increase your rate limit from 20 to 200 requests per hour.

### Session Authentication

For browser-based apps, use Better Auth sessions:

```
POST /api/auth/sign-up/email
POST /api/auth/sign-in/email
GET  /api/auth/get-session
```

## Rate Limiting

All conversion endpoints are rate limited. Responses include headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Requests remaining |
| `X-RateLimit-Reset` | UTC epoch seconds when window resets |
| `Retry-After` | Seconds until next request (only on 429) |

### Limits

| Tier | Requests/hour |
|------|---------------|
| Anonymous | 20 |
| API Key | 200 |

## Endpoints

### Health Check

```
GET /health
```

```json
{
  "status": "ok",
  "timestamp": "2026-09-15T00:00:00.000Z",
  "uptime": 12345.678
}
```

---

### Convert URL to Markdown

```
POST /api/convert/url
Content-Type: application/json
```

**Request body:**

```json
{
  "url": "https://example.com/article"
}
```

**Response:**

```json
{
  "markdown": "# Article Title\n\nContent here...",
  "title": "Article Title",
  "metadata": {
    "wordCount": 1500,
    "format": "url",
    "url": "https://example.com/article",
    "extractionMethod": "readability",
    "author": "John Doe",
    "excerpt": "An article about...",
    "siteName": "Example.com"
  },
  "markdown_tokens": 2000,
  "raw_tokens": 6000
}
```

**Error codes:**
- `400` — Invalid URL format
- `429` — Rate limit exceeded
- `500` — Failed to fetch or convert URL

---

### Convert File to Markdown

```
POST /api/convert/file
Content-Type: multipart/form-data
```

**Supported formats:**

| Extension | MIME Type | Notes |
|-----------|-----------|-------|
| `.pdf` | `application/pdf` | PDF text extraction |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Word documents |
| `.html` | `text/html` | Raw HTML |
| `.htm` | `text/html` | Raw HTML |
| `.csv` | `text/csv` | Parsed as table |
| `.tsv` | `text/tab-separated-values` | Parsed as table |
| `.txt` | `text/plain` | Plain text passthrough |
| `.json` | `application/json` | Formatted JSON |
| `.xml` | `application/xml` | Text extraction |
| `.yaml` | `application/x-yaml` | Formatted YAML |
| `.yml` | `application/x-yaml` | Formatted YAML |

**Request body (multipart):**

```
file: <binary>
```

**Response:**

```json
{
  "markdown": "# Document Content\n\n...",
  "title": "Document Title",
  "metadata": {
    "wordCount": 2500,
    "format": "pdf",
    "pages": 10
  },
  "markdown_tokens": 3000,
  "raw_tokens": 9000
}
```

**Error codes:**
- `413` — File too large (max 10 MB)
- `422` — Unsupported format or conversion error
- `429` — Rate limit exceeded

---

### Convert PDF to Markdown

```
POST /api/convert/pdf
Content-Type: multipart/form-data
```

Same as `/api/convert/file` but specifically for PDFs.

---

### Convert HTML to Markdown

```
POST /api/convert/html
Content-Type: application/json
```

**Request body:**

```json
{
  "content": "<h1>Hello</h1><p>This is <strong>HTML</strong> content.</p>"
}
```

**Response:**

```json
{
  "markdown": "# Hello\n\nThis is **HTML** content.",
  "metadata": {
    "wordCount": 8,
    "format": "html"
  },
  "markdown_tokens": 15,
  "raw_tokens": 45
}
```

---

### Convert Text to Markdown

```
POST /api/convert/text
Content-Type: application/json
```

**Request body:**

```json
{
  "content": "Plain text, JSON, YAML, or any content..."
}
```

**Response:**

```json
{
  "markdown": "Plain text, JSON, YAML, or any content...",
  "metadata": {
    "wordCount": 8,
    "format": "text"
  },
  "markdown_tokens": 10,
  "raw_tokens": 30
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Error message"
}
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request (invalid input) |
| `413` | File too large |
| `422` | Conversion error |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

## Token Counting

Every response includes token estimates:

| Field | Description |
|-------|-------------|
| `markdown_tokens` | Estimated tokens in the output Markdown |
| `raw_tokens` | Estimated tokens in the original input (`markdown_tokens × 3`) |

Token estimation uses a simple heuristic (~4 characters per token). For exact counts, use a tokenizer library like `tiktoken`.

## Example: cURL

```bash
# Convert a URL
curl -X POST https://mekdara-api.vercel.app/api/convert/url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mk_live_xxxxxxxxxxxxxxxx" \
  -d '{"url": "https://example.com"}'

# Upload a PDF
curl -X POST https://mekdara-api.vercel.app/api/convert/file \
  -H "Authorization: Bearer mk_live_xxxxxxxxxxxxxxxx" \
  -F "file=@document.pdf"

# Convert raw HTML
curl -X POST https://mekdara-api.vercel.app/api/convert/html \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mk_live_xxxxxxxxxxxxxxxx" \
  -d '{"content": "<h1>Hello World</h1>"}'
```
