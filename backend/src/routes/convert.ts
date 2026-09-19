import { Elysia, t } from "elysia";
import { urlRequestSchema } from "../schemas/convert";
import { convertUrl, convertBuffer } from "../converters";
import { estimateTokens } from "../utils/tokens";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? "10485760", 10);
const MAX_CONTENT_LENGTH = MAX_FILE_SIZE;

function buildResponse(markdown: string, format?: string, title?: string, metadata?: Record<string, unknown>) {
  const markdown_tokens = estimateTokens(markdown);
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  return {
    markdown,
    title: title ?? metadata?.title ?? undefined,
    metadata: {
      wordCount,
      format: format ?? "url",
      ...metadata,
    },
    markdown_tokens,
    raw_tokens: markdown_tokens * 3,
  };
}

function getErrorMessage(err: unknown): string {
  const msg = (err as Error).message ?? "Unknown error";
  if (msg.includes("SSRF protection")) return "URL scheme or host is not allowed";
  if (msg.includes("Response too large")) return "Response too large";
  if (msg.includes("Failed to download")) return "Failed to fetch the URL";
  if (msg.includes("Too many redirects")) return "Too many redirects";
  return "Conversion failed";
}

export const convertRoutes = new Elysia({ prefix: "/api/convert" })
  .post(
    "/url",
    async ({ body, set }) => {
      try {
        const result = await convertUrl(body.url);
        return buildResponse(result.markdown, "url", result.title, result.metadata);
      } catch (err) {
        set.status = 400;
        return { error: getErrorMessage(err), _stack: err instanceof Error ? err.stack : String(err) };
      }
    },
    { body: urlRequestSchema }
  )
  .post(
    "/pdf",
    async ({ body, set }) => {
      try {
        const buffer = Buffer.from(await body.file.arrayBuffer());

        if (buffer.byteLength > MAX_FILE_SIZE) {
          set.status = 413;
          return { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` };
        }

        const result = await convertBuffer(buffer, body.file.name);
        return buildResponse(result.markdown, result.format, result.title, result.metadata);
      } catch (err) {
        set.status = 422;
        return { error: "Failed to process the file" };
      }
    },
    { body: t.Object({ file: t.File() }) }
  )
  .post(
    "/file",
    async ({ body, set }) => {
      try {
        const buffer = Buffer.from(await body.file.arrayBuffer());

        if (buffer.byteLength > MAX_FILE_SIZE) {
          set.status = 413;
          return { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` };
        }

        const result = await convertBuffer(buffer, body.file.name);
        return buildResponse(result.markdown, result.format, result.title, result.metadata);
      } catch (err) {
        set.status = 422;
        return { error: "Failed to process the file" };
      }
    },
    { body: t.Object({ file: t.File() }) }
  )
  .post(
    "/html",
    async ({ body, set }) => {
      try {
        if (body.content.length > MAX_CONTENT_LENGTH) {
          set.status = 413;
          return { error: `Content too large. Maximum size: ${MAX_CONTENT_LENGTH / 1024 / 1024}MB` };
        }
        const buffer = Buffer.from(body.content, "utf-8");
        const result = await convertBuffer(buffer, "input.html");
        return buildResponse(result.markdown, "html", result.title, result.metadata);
      } catch (err) {
        set.status = 422;
        return { error: "Failed to process the HTML content", _stack: err instanceof Error ? err.stack : String(err) };
      }
    },
    { body: t.Object({ content: t.String({ minLength: 1, maxLength: MAX_CONTENT_LENGTH }) }) }
  )
  .post(
    "/text",
    async ({ body, set }) => {
      try {
        if (body.content.length > MAX_CONTENT_LENGTH) {
          set.status = 413;
          return { error: `Content too large. Maximum size: ${MAX_CONTENT_LENGTH / 1024 / 1024}MB` };
        }
        const buffer = Buffer.from(body.content, "utf-8");
        const result = await convertBuffer(buffer, "input.txt");
        return buildResponse(result.markdown, "text", result.title, result.metadata);
      } catch (err) {
        set.status = 422;
        return { error: "Failed to process the text content" };
      }
    },
    { body: t.Object({ content: t.String({ minLength: 1, maxLength: MAX_CONTENT_LENGTH }) }) }
  );
