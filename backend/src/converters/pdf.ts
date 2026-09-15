/**
 * PDF converter — extracts text from PDF buffers using pdf-parse.
 */

import { PDFParse } from "pdf-parse";
import type { ConversionResult } from "./url.js";

export async function convertPdf(buffer: Buffer): Promise<ConversionResult> {
  const parser = new PDFParse({ data: buffer });
  try {
    const data = await parser.getText();
    return {
      markdown: data.text,
      metadata: {
        pages: data.total ?? undefined,
      },
    };
  } finally {
    await parser.destroy();
  }
}
