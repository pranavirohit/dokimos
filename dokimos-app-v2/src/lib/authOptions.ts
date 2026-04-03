import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const isProd = process.env.NODE_ENV === "production";

/**
 * Google OAuth: in production, set real credentials via env.
 * In development, placeholders allow `next dev` without a .env (sign-in will fail until keys are set).
 */
const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  (isProd ? "" : "dev-placeholder-not-a-real-client-id.apps.googleusercontent.com");
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET || (isProd ? "" : "dev-placeholder-not-a-real-secret");

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user }) {
      try {
        const response = await fetch(
          `${process.env.TEE_ENDPOINT || "http://localhost:8082"}/api/auth/user/signup`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name || "User",
              email: user.email,
              password: "google-oauth",
            }),
          }
        );

        if (!response.ok && response.status !== 400) {
          console.error("Failed to register user in backend");
        }
      } catch (error) {
        console.error("Backend registration error:", error instanceof Error ? error.message : "unknown");
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
      }
      return session;
    },
  },
};
