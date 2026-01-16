import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Простая имитация базы пользователей
const users = [
  {
    id: "1",
    email: "leon@gmail.com",
    password: "password123", // В реальном приложении используйте хеширование!
    name: "Leon",
    balance: 10000
  }
];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = users.find(u =>
          u.email === credentials.email &&
          u.password === credentials.password
        );

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            balance: user.balance
          };
        }

        return null;
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Разрешаем вход для всех провайдеров
      console.log('[NextAuth] Sign in:', { user, account: account?.provider });
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.balance = (user as any).balance || 0;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).balance = token.balance || 0;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Всегда редиректим на главную страницу после успешного входа
      console.log('[NextAuth] Redirect:', { url, baseUrl });
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    }
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  debug: true, // Включаем debug режим
};

export default NextAuth(authOptions);
