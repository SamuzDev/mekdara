/**
 * CSV converter — converts CSV/TSV data to Markdown tables.
 */

import Papa from "papaparse";
import type { ConversionResult } from "./url.js";

export async function convertCsv(buffer: Buffer): Promise<ConversionResult> {
  const text = new TextDecoder().decode(buffer);

  // Auto-detect delimiter
  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
  });

  if (result.data.length === 0) {
    return { markdown: "*Empty CSV file*" };
  }

  const rows = result.data;
  const header = rows[0]!;
  const dataRows = rows.slice(1);

  // Build markdown table
  const headerLine = `| ${header.map((cell: string) => escapeCell(cell)).join(" | ")} |`;
  const separator = `| ${header.map(() => "---").join(" | ")} |`;
  const dataLines = dataRows
    .map((row: any[]) => `| ${row.map((cell: string) => escapeCell(cell)).join(" | ")}`)
    .join("\n");

  const markdown = [headerLine, separator, dataLines].join("\n");

  return {
    markdown,
    metadata: {
      format: "csv",
      rows: dataRows.length,
      columns: header.length,
    },
  };
}

function escapeCell(cell: string): string {
  return cell.replace(/\|/g, "\\|").trim();
}
