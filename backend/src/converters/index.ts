/**
 * Converter registry — central hub for all format converters.
 * Uses priority-based detection to find the right converter.
 */

import { detectFormat, type SupportedFormat } from "./detect.js";
import { convertUrl, type ConversionResult } from "./url.js";
import { convertPdf } from "./pdf.js";
import { convertDocx } from "./docx.js";
import { convertHtml } from "./html.js";
import { convertCsv } from "./csv.js";
import { convertText } from "./text.js";

export type { ConversionResult };

/**
 * Convert a buffer to Markdown using smart format detection.
 */
export async function convertBuffer(
  buffer: Buffer,
  filename?: string
): Promise<ConversionResult & { format: SupportedFormat }> {
  const { format } = detectFormat(buffer, filename);

  let result: ConversionResult;

  switch (format) {
    case "pdf":
      result = await convertPdf(buffer);
      break;
    case "docx":
      result = await convertDocx(buffer);
      break;
    case "html":
      result = await convertHtml(buffer);
      break;
    case "csv":
      result = await convertCsv(buffer);
      break;
    case "text":
    default:
      result = await convertText(buffer);
      break;
  }

  return { ...result, format };
}

export { convertUrl };
export { detectFormat };
