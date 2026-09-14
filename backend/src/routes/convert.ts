import { Elysia, t } from "elysia";
import { urlRequestSchema } from "../schemas/convert";
import { convertUrl, convertBuffer } from "../converters";
import { estimateTokens } from "../utils/tokens";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? "10485760", 10);

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

export const convertRoutes = new Elysia({ prefix: "/api/convert" })
  .post(
    "/url",
    async ({ body, set }) => {
      try {
        const result = await convertUrl(body.url);
        return buildResponse(result.markdown, "url", result.title, result.metadata);
      } catch (err) {
        set.status = 400;
        return { error: (err as Error).message };
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
          return {
            error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          };
        }

        const result = await convertBuffer(buffer, body.file.name);
        return buildResponse(result.markdown, result.format, result.title, result.metadata);
      } catch (err) {
        set.status = 422;
        return { error: (err as Error).message };
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
          return {
            error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          };
        }

        const result = await convertBuffer(buffer, body.file.name);
        return buildResponse(result.markdown, result.format, result.title, result.metadata);
      } catch (err) {
        set.status = 422;
        return { error: (err as Error).message };
      }
    },
    { body: t.Object({ file: t.File() }) }
  )
  .post(
    "/html",
    async ({ body, set }) => {
      try {
        const buffer = Buffer.from(body.content, "utf-8");
        const result = await convertBuffer(buffer, "input.html");
        return buildResponse(result.markdown, "html", result.title, result.metadata);
      } catch (err) {
        set.status = 422;
        return { error: (err as Error).message };
      }
    },
    { body: t.Object({ content: t.String({ minLength: 1 }) }) }
  )
  .post(
    "/text",
    async ({ body, set }) => {
      try {
        const buffer = Buffer.from(body.content, "utf-8");
        const result = await convertBuffer(buffer, "input.txt");
        return buildResponse(result.markdown, "text", result.title, result.metadata);
      } catch (err) {
        set.status = 422;
        return { error: (err as Error).message };
      }
    },
    { body: t.Object({ content: t.String({ minLength: 1 }) }) }
  );
