import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getGender } from "@/src/lib/gender";
import { getUserRole } from "@/src/lib/user-role";
import {
  getUserByEmail,
  upsertOAuthUser,
  verifyCredentials,
} from "@/src/lib/users-store";
import { consumeVerificationCode } from "@/src/lib/verification-codes";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 60 * 60 * 24,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        twoFactorCode: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        const twoFactorCode =
          typeof credentials?.twoFactorCode === "string"
            ? credentials.twoFactorCode
            : "";

        if (!email || !password || !twoFactorCode) return null;

        const user = await verifyCredentials(email, password);
        if (!user) return null;

        const codeOk = await consumeVerificationCode({
          email: user.email,
          userId: user.id,
          purpose: "two_factor",
          code: twoFactorCode,
        });

        if (!codeOk) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return true;
      const stored = await getUserByEmail(user.email);
      return stored?.accountStatus !== "blocked";
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "google" && user.email) {
        const [cookieGender, cookieRole] = await Promise.all([
          getGender(),
          getUserRole(),
        ]);
        const role = cookieRole === "client" ? "client" : "professional";
        const stored = await upsertOAuthUser({
          name: user.name ?? "Utilisateur",
          email: user.email,
          image: user.image ?? undefined,
          provider: "google",
          gender: role === "client" ? undefined : cookieGender ?? undefined,
          role,
        });
        token.id = stored.id;
        token.picture = stored.image ?? null;
        token.role = stored.role;
      } else if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "professional";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role =
          (token.role as string | undefined) ?? "professional";
      }
      return session;
    },
  },
});
