/**
 * DOCX converter — converts Word documents to Markdown using mammoth.
 */

import mammoth from "mammoth";
import TurndownService from "turndown";
import type { ConversionResult } from "./url.js";

const turndown = new TurndownService();

export async function convertDocx(buffer: Buffer): Promise<ConversionResult> {
  const result = await mammoth.convertToHtml({ buffer });
  const markdown = turndown.turndown(result.value);

  const messages = result.messages
    .filter((m) => m.type === "warning")
    .map((m) => m.message);

  return {
    markdown,
    metadata: {
      format: "docx",
      warnings: messages.length > 0 ? messages : undefined,
    },
  };
}
