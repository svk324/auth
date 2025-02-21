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
    const { name, username, email, currentPassword } = await request.json();

    if (!username || !email) {
      return NextResponse.json(
        { error: "Username and email are required" },
        { status: 400 }
      );
    }

    const userId = Number(session.user.id);
    const isOAuthUser = session.user.emails.some(
      (e) => e.provider !== "credentials"
    );

    // Verify current password only for credentials users
    if (!isOAuthUser) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required for credentials users" },
          { status: 400 }
        );
      }

      const emailRecord = await prisma.email.findFirst({
        where: { userId, provider: "credentials" },
      });

      if (!emailRecord || !emailRecord.password) {
        return NextResponse.json(
          { error: "No password set for this account" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(
        currentPassword,
        emailRecord.password
      );
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    // Check for username uniqueness (excluding current user)
    const existingUsername = await prisma.user.findFirst({
      where: { username, id: { not: userId } },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Check for email uniqueness (excluding current user's email)
    const existingEmail = await prisma.email.findFirst({
      where: { email, userId: { not: userId } },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 400 }
      );
    }

    // Update user profile
    await prisma.user.update({
      where: { id: userId },
      data: { name, username },
    });

    // Update email
    await prisma.email.updateMany({
      where: { userId, provider: "credentials" },
      data: { email },
    });

    return NextResponse.json(
      { message: "Profile updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update profile error:", error.message);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
