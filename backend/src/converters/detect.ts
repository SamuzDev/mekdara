/**
 * Smart content type detection based on magic bytes and file extension.
 */

export type SupportedFormat = "url" | "pdf" | "docx" | "html" | "csv" | "text";

interface DetectionResult {
  format: SupportedFormat;
  confidence: number;
}

const MAGIC_BYTES: [Uint8Array, SupportedFormat][] = [
  [new Uint8Array([0x25, 0x50, 0x44, 0x46]), "pdf"], // %PDF
  [new Uint8Array([0x50, 0x4b, 0x03, 0x04]), "docx"], // PK.. (ZIP/DOCX/XLSX)
];

const EXTENSION_MAP: Record<string, SupportedFormat> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".doc": "docx",
  ".html": "html",
  ".htm": "html",
  ".csv": "csv",
  ".tsv": "csv",
  ".txt": "text",
  ".md": "text",
  ".json": "text",
  ".xml": "text",
  ".yaml": "text",
  ".yml": "text",
};

/**
 * Detect format from buffer content and optional filename.
 */
export function detectFormat(
  buffer: Buffer,
  filename?: string
): DetectionResult {
  // Check magic bytes first (highest confidence)
  const header = buffer.subarray(0, 4);
  for (const [magic, format] of MAGIC_BYTES) {
    if (header.length >= magic.length) {
      let match = true;
      for (let i = 0; i < magic.length; i++) {
        if (header[i] !== magic[i]) {
          match = false;
          break;
        }
      }
      if (match) return { format, confidence: 0.95 };
    }
  }

  // Check file extension
  if (filename) {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (ext && EXTENSION_MAP[ext]) {
      return { format: EXTENSION_MAP[ext], confidence: 0.8 };
    }
  }

  // Heuristic: check if content looks like HTML
  const textStart = buffer.toString("utf-8", 0, Math.min(500, buffer.length)).toLowerCase();
  if (textStart.includes("<!doctype") || textStart.includes("<html")) {
    return { format: "html", confidence: 0.7 };
  }

  // Heuristic: check for CSV delimiters
  const firstLine = textStart.split("\n")[0] ?? "";
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const tabCount = (firstLine.match(/\t/g) ?? []).length;
  if (commaCount >= 2 || tabCount >= 2) {
    return { format: "csv", confidence: 0.6 };
  }

  // Default: plain text
  return { format: "text", confidence: 0.5 };
}
