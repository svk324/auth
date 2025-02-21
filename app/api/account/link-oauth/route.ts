import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") as string | null;
    const code = searchParams.get("code") as string | null;

    console.log({ provider, code });

    if (!provider || !code) {
      throw new Error("Missing provider or code");
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      include: { emails: true, accounts: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const totalMethods =
      user.emails.filter((e) => e.provider === "credentials").length +
      user.accounts.length;
    if (totalMethods >= 2) {
      throw new Error("Maximum of 2 authentication methods reached");
    }

    if (user.accounts.some((acc) => acc.provider === provider)) {
      throw new Error(`Only one ${provider} account can be linked`);
    }

    const hasCredentials = user.emails.some(
      (e) => e.provider === "credentials"
    );
    if (hasCredentials && user.accounts.length >= 1) {
      throw new Error("Only one OAuth method can be linked with credentials");
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/account/link-oauth`;
    let oauthResponse;

    if (provider === "google") {
      oauthResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          code,
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
    } else if (provider === "github") {
      oauthResponse = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          code,
          client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          redirect_uri: redirectUri,
        },
        { headers: { Accept: "application/json" } }
      );
    } else {
      throw new Error("Unsupported provider");
    }

    const { access_token, refresh_token, expires_in } = oauthResponse.data;

    // Fetch user info to get providerAccountId and email
    let email: string;
    let providerAccountId: string;

    if (provider === "google") {
      const userInfo = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      email = userInfo.data.email;
      providerAccountId = userInfo.data.sub; // Google's unique user ID
    } else if (provider === "github") {
      const userInfo = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${access_token}` },
      });
      email =
        userInfo.data.email ||
        (
          await axios.get("https://api.github.com/user/emails", {
            headers: { Authorization: `token ${access_token}` },
          })
        ).data.find((e: any) => e.primary && e.verified)?.email;
      providerAccountId = userInfo.data.id.toString(); // GitHub's unique user ID
    } else {
      throw new Error("Unsupported provider");
    }

    if (!email || !providerAccountId) {
      throw new Error(
        "Failed to retrieve email or providerAccountId from provider"
      );
    }

    const emailInUse = await prisma.email.findFirst({
      where: { email, userId: { not: user.id } },
    });
    if (emailInUse) {
      throw new Error("This email is already linked to another account");
    }

    const emailExists = user.emails.some((e) => e.email === email);
    if (!emailExists) {
      await prisma.email.create({
        data: {
          email,
          userId: user.id,
          provider,
        },
      });
    }

    await prisma.account.create({
      data: {
        userId: user.id,
        provider,
        providerAccountId, // Use the fetched providerAccountId
        accessToken: access_token,
        refreshToken: refresh_token || null,
        expiresAt: expires_in
          ? Math.floor(Date.now() / 1000) + expires_in
          : null,
      },
    });

    return NextResponse.redirect(new URL("/account", request.url));
  } catch (error: any) {
    console.error("Linking error:", error.message);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 400 }
    );
  }
}
