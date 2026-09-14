import { Elysia } from "elysia";

/**
 * Simple structured request logger middleware.
 */
export function logger() {
  return new Elysia({ name: "logger" }).onBeforeHandle(({ request, set }) => {
    const start = Date.now();
    const method = request.method;
    const url = request.url;

    return () => {
      const duration = Date.now() - start;
      const status = set.status ?? 200;
      const timestamp = new Date().toISOString();
      console.log(
        JSON.stringify({
          timestamp,
          method,
          url,
          status,
          duration: `${duration}ms`,
        })
      );
    };
  });
}
