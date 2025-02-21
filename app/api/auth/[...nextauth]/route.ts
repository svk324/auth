import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const emailRecord = await prisma.email.findUnique({
          where: { email: credentials.email },
          include: { user: true },
        });

        if (
          !emailRecord ||
          !emailRecord.password ||
          emailRecord.provider !== "credentials"
        ) {
          throw new Error("Invalid credentials");
        }

        const user = emailRecord.user;

        // Check lockout
        if (user.lockoutUntil && new Date() < user.lockoutUntil) {
          const minutesLeft = Math.ceil(
            (user.lockoutUntil.getTime() - Date.now()) / 60000
          );
          throw new Error(
            `Account is locked. Try again in ${minutesLeft} minutes`
          );
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          emailRecord.password
        );
        if (!isValid) {
          const now = new Date();
          const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

          // Increment failed attempts if within 15 minutes
          if (
            user.lastFailedLogin &&
            user.lastFailedLogin > fifteenMinutesAgo
          ) {
            user.failedLoginAttempts += 1;
          } else {
            user.failedLoginAttempts = 1; // Reset if outside window
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: user.failedLoginAttempts,
              lastFailedLogin: now,
              lockoutUntil:
                user.failedLoginAttempts >= 5
                  ? new Date(now.getTime() + 30 * 60 * 1000)
                  : null,
            },
          });

          if (user.failedLoginAttempts >= 5) {
            throw new Error(
              "Account locked due to too many failed attempts. Try again in 30 minutes"
            );
          }

          throw new Error("Invalid credentials");
        }

        // Reset lockout fields on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockoutUntil: null,
            lastFailedLogin: null,
            lastLoginAt: new Date(),
            deletionScheduledAt: null,
          },
        });

        return {
          id: user.id.toString(),
          name: user.name,
          email: emailRecord.email,
          username: user.username,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      let dbUser = await prisma.user.findFirst({
        where: { emails: { some: { email: user.email! } } },
        include: { emails: true, accounts: true },
      });

      if (!dbUser) {
        const baseUsername =
          user.name?.toLowerCase().replace(/\s+/g, "") ||
          user.email!.split("@")[0];
        let username = baseUsername;
        let counter = 1;
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter++}`;
        }

        dbUser = await prisma.user.create({
          data: {
            username,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            emails: {
              create: {
                email: user.email!,
                provider: account?.provider || "credentials",
              },
            },
          },
          include: { emails: true, accounts: true },
        });

        if (account && account.provider !== "credentials") {
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at,
            },
          });
        }
      } else if (account && account.provider !== "credentials") {
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at,
            },
          });
        }
      }

      // Update lastLoginAt and clear deletion schedule for OAuth
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date(), deletionScheduledAt: null },
      });

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      const user = await prisma.user.findFirst({
        where: { emails: { some: { email: session.user.email! } } },
        include: { emails: true, accounts: true },
      });

      if (user) {
        session.user.id = user.id.toString();
        session.user.username = user.username;
        session.user.accounts = user.accounts.map((acc) => ({
          provider: acc.provider,
          providerAccountId: acc.providerAccountId,
        }));
        session.user.emails = user.emails.map((e) => ({
          email: e.email,
          provider: e.provider,
        }));
        session.accessToken = token.accessToken as string | undefined;
        session.refreshToken = token.refreshToken as string | undefined;
        session.expiresAt = token.expiresAt as number | undefined;
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
