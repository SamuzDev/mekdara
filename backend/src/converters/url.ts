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
const MAX_CONTENT_LENGTH = parseInt(process.env.MAX_URL_FETCH_SIZE ?? "5242880", 10);

/**
 * Resolve DNS hostname to IP and check if it's private/internal.
 * Uses fetch with a custom resolver to check the resolved IP.
 */
async function isPrivateUrl(urlString: string): Promise<boolean> {
  try {
    const url = new URL(urlString);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return true;
    }

    const hostname = url.hostname.toLowerCase();

    // Block localhost variants
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname === "0.0.0.0"
    ) {
      return true;
    }

    // Block IPv4 private/reserved ranges
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Pattern);
    if (match) {
      const [, a, b, c, d] = match.map(Number);
      if (a === undefined || b === undefined || c === undefined || d === undefined) return true;
      // 0.0.0.0/8, 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8,
      // 169.254.0.0/16, 172.16.0.0/12, 192.0.0.0/24, 192.0.2.0/24,
      // 192.168.0.0/16, 198.18.0.0/15, 198.51.100.0/24, 203.0.113.0/24,
      // 224.0.0.0/4 (multicast), 240.0.0.0/4 (reserved), 255.255.255.255
      if (
        a === 0 ||
        a === 10 ||
        (a === 100 && b >= 64 && b <= 127) ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 0 && c === 0) ||
        (a === 192 && b === 0 && c === 2) ||
        (a === 192 && b === 168) ||
        (a === 198 && (b === 18 || b === 19)) ||
        (a === 198 && b === 51 && c === 100) ||
        (a === 203 && b === 0 && c === 113) ||
        a >= 224 ||
        (a === 255 && b === 255 && c === 255 && d === 255)
      ) {
        return true;
      }
    }

    // Block IPv6 private/reserved ranges
    const ipv6Clean = hostname.replace(/[\[\]]/g, "");
    if (ipv6Clean.includes(":")) {
      const lower = ipv6Clean.toLowerCase();
      if (
        lower === "::1" ||
        lower === "::" ||
        lower.startsWith("::ffff:127.") ||
        lower.startsWith("::ffff:0:") ||
        lower.startsWith("fc") ||
        lower.startsWith("fd") ||
        lower.startsWith("fe80") ||
        lower.startsWith("ff")
      ) {
        return true;
      }
    }

    // Block known internal hostnames
    const blockedHostnames = [
      "metadata.google.internal",
      "169.254.169.254",
      "instance-data",
      "kubernetes",
      "localhost.localdomain",
      "ip6-localhost",
      "ip6-loopback",
      "broadcasthost",
      "0.0.0.0",
    ];
    if (blockedHostnames.some((h) => hostname === h || hostname.endsWith("." + h))) {
      return true;
    }

    // DNS rebinding protection: resolve and verify the IP
    try {
      const { lookup } = await import("dns/promises");
      const { address } = await lookup(hostname, { family: 4 });
      if (isPrivateIp(address)) {
        return true;
      }
    } catch {
      // DNS resolution failed — block by default
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

function isPrivateIp(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;
  const a = parts[0] ?? 0;
  const b = parts[1] ?? 0;
  return (
    a === 0 ||
    a === 10 ||
    (a === 100 && b !== undefined && b >= 64 && b <= 127) ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b !== undefined && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

/**
 * Fetch a URL with redirect validation (no automatic redirect following).
 */
async function safeFetch(url: string, signal: AbortSignal): Promise<Response> {
  let currentUrl = url;
  const maxRedirects = 5;

  for (let i = 0; i <= maxRedirects; i++) {
    const res = await fetch(currentUrl, {
      signal,
      redirect: "manual",
      headers: { "User-Agent": "Mekdara/1.0" },
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location) break;

      const redirectUrl = new URL(location, currentUrl).toString();
      if (await isPrivateUrl(redirectUrl)) {
        throw new Error("Redirect to private/internal URL is not allowed (SSRF protection)");
      }
      currentUrl = redirectUrl;
      continue;
    }

    return res;
  }

  throw new Error("Too many redirects");
}

export interface ConversionResult {
  markdown: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export async function convertUrl(url: string): Promise<ConversionResult> {
  if (await isPrivateUrl(url)) {
    throw new Error("URL scheme or host is not allowed (SSRF protection)");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await safeFetch(url, controller.signal);

    if (!res.ok) {
      throw new Error("Failed to download the URL");
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
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
