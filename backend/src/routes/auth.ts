import { Elysia } from "elysia";
import { auth } from "../auth";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .all("/*", async ({ request, set }) => {
    try {
      const response = await auth.handler(request);
      return response;
    } catch (err: any) {
      console.error("[Auth] Error:", err.message, err.stack);
      set.status = 500;
      return { error: "Auth handler error", message: err.message };
    }
  });
