import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      include: { emails: true, accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalMethods =
      user.emails.filter((e) => e.provider === "credentials").length +
      user.accounts.length;
    if (totalMethods >= 2) {
      return NextResponse.json(
        { error: "Maximum of 2 authentication methods reached" },
        { status: 400 }
      );
    }

    if (user.emails.some((e) => e.provider === "credentials")) {
      return NextResponse.json(
        { error: "Only one Email/Password method can be linked" },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.email.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "This email is already linked to an account" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.email.create({
      data: {
        email,
        userId: user.id,
        provider: "credentials",
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "Credentials linked successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Linking error:", error.message);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") as string | null;
    const providerAccountId = searchParams.get("providerAccountId") as
      | string
      | null;
    const email = searchParams.get("email") as string | null;
    const accessToken = searchParams.get("accessToken") as string | null;
    const refreshToken = searchParams.get("refreshToken") as string | null;
    const expiresAt = searchParams.get("expiresAt")
      ? parseInt(searchParams.get("expiresAt")!)
      : null;

    console.log({
      provider,
      providerAccountId,
      email,
      accessToken,
      refreshToken,
      expiresAt,
    });

    if (!provider || !providerAccountId || !email) {
      throw new Error("Missing required fields");
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
        providerAccountId,
        accessToken,
        refreshToken,
        expiresAt,
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
