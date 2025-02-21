import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, provider } = await request.json();

    if (!email || !provider) {
      return NextResponse.json(
        { error: "Missing email or provider" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) }, // Convert string to number
      include: { emails: true, accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalMethods = user.emails.length + user.accounts.length;
    if (totalMethods <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last linked account" },
        { status: 400 }
      );
    }

    if (provider === "credentials") {
      await prisma.email.delete({
        where: { email },
      });
    } else {
      await prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId: user.accounts.find(
              (acc) => acc.provider === provider
            )?.providerAccountId!,
          },
        },
      });
      await prisma.email.delete({
        where: { email },
      });
    }

    return NextResponse.json(
      { message: "Account unlinked successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
