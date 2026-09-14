/**
 * HTML converter — converts raw HTML content to Markdown.
 */

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import type { ConversionResult } from "./url.js";

const turndown = new TurndownService();

export async function convertHtml(buffer: Buffer): Promise<ConversionResult> {
  const htmlContent = new TextDecoder().decode(buffer);
  const dom = new JSDOM(htmlContent);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article?.content) {
    // Fallback: convert entire HTML to markdown
    return {
      markdown: turndown.turndown(htmlContent),
      title: article?.title ?? undefined,
    };
  }

  return {
    markdown: turndown.turndown(article.content),
    title: article.title ?? undefined,
  };
}
