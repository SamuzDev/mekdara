/**
 * DOM parser using linkedom (lightweight, zero native deps).
 * Drop-in replacement for jsdom that works in serverless environments.
 */

import { parseHTML } from "linkedom";

export function createDOM(html: string): { document: any; window: any } {
  return parseHTML(html);
}
