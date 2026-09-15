/**
 * URL converter — fetches a web page, extracts readable content via
 * Mozilla Readability, and converts to Markdown via Turndown.
 */

import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { createDOM } from "./jsdom.js";

const turndown = new TurndownService();

const FETCH_TIMEOUT = parseInt(process.env.URL_FETCH_TIMEOUT ?? "15000", 10);
const MAX_RESPONSE_SIZE = parseInt(process.env.MAX_URL_FETCH_SIZE ?? "5242880", 10);

/**
 * Check if a URL points to a private/internal resource (SSRF protection).
 */
function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return true;
    }

    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]"
    ) {
      return true;
    }

    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Pattern);
    if (match) {
      const [, a, b] = match.map(Number);
      if (a === undefined || b === undefined) return true;
      if (
        a === 10 ||
        (a === 172 && b >= 16 && b <= 31) ||
        a === 192 ||
        (a === 169 && b === 254)
      ) {
        return true;
      }
    }

    const blockedHostnames = [
      "metadata.google.internal",
      "169.254.169.254",
      "instance-data",
      "kubernetes",
    ];
    if (blockedHostnames.some((h) => hostname.includes(h))) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

export interface ConversionResult {
  markdown: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export async function convertUrl(url: string): Promise<ConversionResult> {
  if (isPrivateUrl(url)) {
    throw new Error("URL scheme or host is not allowed (SSRF protection)");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mekdara/1.0" },
    });

    if (!res.ok) {
      throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      throw new Error("Response too large");
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
      throw new Error("Response too large");
    }

    const htmlContent = new TextDecoder().decode(arrayBuffer);
    const dom = await createDOM(htmlContent, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    let markdown: string;
    let extractionMethod: "readability" | "full-html";

    if (article?.content && article.content.length > 200) {
      markdown = turndown.turndown(article.content);
      extractionMethod = "readability";
    } else {
      const body = dom.window.document.body;
      markdown = turndown.turndown(body?.innerHTML ?? htmlContent);
      extractionMethod = "full-html";
    }

    return {
      markdown,
      title: article?.title ?? dom.window.document.title ?? undefined,
      metadata: {
        url,
        extractionMethod,
        author: article?.byline ?? undefined,
        excerpt: article?.excerpt ?? undefined,
        siteName: article?.siteName ?? undefined,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
