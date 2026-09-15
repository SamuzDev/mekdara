/**
 * PDF converter — extracts text from PDF buffers using pdf-parse.
 * Polyfills Canvas APIs before pdf-parse import to avoid @napi-rs/canvas binary on Vercel.
 */

globalThis.DOMMatrix = globalThis.DOMMatrix ?? class DOMMatrix { constructor() {} };
globalThis.ImageData = globalThis.ImageData ?? class ImageData { constructor() {} };
globalThis.Path2D = globalThis.Path2D ?? class Path2D { constructor() {} };

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
