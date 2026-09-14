/**
 * Plain text converter — passes text through as-is.
 */

import type { ConversionResult } from "./url.js";

export async function convertText(buffer: Buffer): Promise<ConversionResult> {
  const text = new TextDecoder().decode(buffer);
  return {
    markdown: text,
    metadata: {
      format: "text",
      wordCount: text.split(/\s+/).filter(Boolean).length,
    },
  };
}
