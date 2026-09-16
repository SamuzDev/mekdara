import { Elysia } from "elysia";
import { auth } from "../auth";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .all("/*", async ({ request, set }) => {
    try {
      const response = await auth.handler(request);
      return response;
    } catch (err: any) {
      console.error("[Auth] Error:", err.message);
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
