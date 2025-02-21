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

    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) }, // Convert string to number
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
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
