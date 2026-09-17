import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { createAuthMiddleware } from "better-auth/api";
import { sendPasswordResetEmail, sendVerificationEmail } from "./lib/email";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("[Neon] Unexpected pool error:", err.message);
});

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    process.env.CORS_ORIGIN ?? "http://localhost:5173",
    "https://mekdara.vercel.app",
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    },
  },
  account: {
    storeStateStrategy: "database",
    skipStateCookieCheck: true,
  },
  user: {
    additionalFields: {
      apiKey: {
        type: "string",
        required: false,
      },
      welcomeBonusClaimed: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      bonusTokens: {
        type: "number",
        required: false,
        defaultValue: 0,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      const sent = await sendVerificationEmail({
        to: user.email,
        username: user.name,
        verificationUrl: url,
      });
      if (!sent) throw new Error("Failed to send verification email");
    },
    sendResetPassword: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      const sent = await sendPasswordResetEmail({
        to: user.email,
        username: user.name,
        resetUrl: url,
      });
      if (!sent) throw new Error("Failed to send password reset email");
    },
  },
  advanced: {
    database: {
      validateSchema: false,
    },
    ipAddress: {
      ipAddressHeaders: [
        "x-forwarded-for",
        "x-real-ip",
        "x-vercel-forwarded-for",
      ],
      disableIpTracking: false,
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
  },
  telemetry: {
    enabled: false,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up")) {
        const userId = ctx.body?.user?.id;
        if (userId) {
          try {
            await pool.query(
              `UPDATE "user" SET "welcomeBonusClaimed" = true, "bonusTokens" = 5000 WHERE id = $1`,
              [userId]
            );
            console.log(`[Auth] Welcome bonus granted to user ${userId}`);
          } catch (err) {
            console.error("[Auth] Failed to grant welcome bonus:", err);
          }
        }
      }
    }),
  },
});
