// types/next-auth.d.ts
import { DefaultSession, JWT } from "next-auth";
import { AdapterUser } from "next-auth/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name?: string | null;
      email?: string | null;
      accounts: { provider: string; providerAccountId: string }[];
      emails: { email: string; provider: string | null }[];
    } & DefaultSession["user"];
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }

  interface User {
    id: string;
    username: string;
    email: string;
    name?: string | null;
  }

  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    provider?: string;
    iat?: number;
    exp?: number;
  }
}
