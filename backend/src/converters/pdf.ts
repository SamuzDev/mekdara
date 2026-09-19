/**
 * PDF converter — extracts text from PDF buffers using pdf-parse.
 *
 * pdfjs-dist's fake worker needs './pdf.worker.mjs' which doesn't exist after
 * bundling. The build script copies it to dist/ and we reference it here.
 */

import { PDFParse } from "pdf-parse";
import type { ConversionResult } from "./url.js";

const workerPath = new URL("./pdf.worker.mjs", import.meta.url).href;
PDFParse.setWorker(workerPath);

export async function convertPdf(buffer: Buffer): Promise<ConversionResult> {
  const parser = new PDFParse({
    data: buffer,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: false,
    verbosity: 0,
  });
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
