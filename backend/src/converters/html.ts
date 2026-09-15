/**
 * HTML converter — converts raw HTML content to Markdown.
 */

import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { createDOM } from "./jsdom.js";
import type { ConversionResult } from "./url.js";

const turndown = new TurndownService();

export async function convertHtml(buffer: Buffer): Promise<ConversionResult> {
  const htmlContent = new TextDecoder().decode(buffer);
  const dom = await createDOM(htmlContent);
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
