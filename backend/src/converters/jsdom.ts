/**
 * JSDOM wrapper with static import for Vercel nft compatibility.
 * Static imports allow Vercel's file tracer to resolve and include jsdom.
 */

import { JSDOM } from "jsdom";

export async function createDOM(
  html: string,
  options?: ConstructorParameters<typeof JSDOM>[1]
): Promise<InstanceType<typeof JSDOM>> {
  return new JSDOM(html, options);
}
