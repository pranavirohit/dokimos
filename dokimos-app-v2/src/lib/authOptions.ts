import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      id: "demo-credentials",
      name: "Demo account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const teeEndpoint = getTeeEndpoint();
        try {
          const loginUrl = `${teeEndpoint}/api/auth/user/login`;
          const res = await fetch(loginUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const data = (await res.json()) as {
            userId: string;
            name: string;
            email: string;
          };
          return {
            id: data.userId,
            email: data.email,
            name: data.name,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.provider = account?.provider ?? "credentials";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || "";
        session.user.email = token.email as string | null;
        session.user.name = token.name as string | null;
      }
      return session;
    },
  },
};
