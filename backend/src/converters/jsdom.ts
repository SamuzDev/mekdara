/**
 * Dynamic JSDOM wrapper for environments where JSDOM may not be available
 * (e.g., Vercel build with Node.js). Only loads at runtime.
 */

let JSDOMConstructor: typeof import("jsdom").JSDOM | null = null;

export async function getJSDOM(): Promise<typeof import("jsdom").JSDOM> {
  if (JSDOMConstructor) {
    return JSDOMConstructor;
  }

  try {
    const jsdomModule = await import("jsdom");
    JSDOMConstructor = jsdomModule.JSDOM;
    return JSDOMConstructor;
  } catch (error) {
    throw new Error(
      "JSDOM is not available in this environment. HTML/URL conversion requires JSDOM."
    );
  }
}

export async function createDOM(
  html: string,
  options?: ConstructorParameters<typeof import("jsdom").JSDOM>[1]
): Promise<InstanceType<typeof import("jsdom").JSDOM>> {
  const JSDOM = await getJSDOM();
  return new JSDOM(html, options);
}