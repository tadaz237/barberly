import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getGender } from "@/src/lib/gender";
import { upsertOAuthUser, verifyCredentials } from "@/src/lib/users-store";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const user = await verifyCredentials(email, password);
        if (!user) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account?.provider === "google" && user.email) {
        const cookieGender = await getGender();
        const stored = await upsertOAuthUser({
          name: user.name ?? "Utilisateur",
          email: user.email,
          image: user.image ?? undefined,
          provider: "google",
          gender: cookieGender ?? undefined,
        });
        token.id = stored.id;
        token.picture = stored.image ?? null;
      } else if (user) {
        token.id = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
});
