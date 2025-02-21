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
    const { currentPassword, newPassword, confirmPassword } =
      await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Current, new, and confirm passwords are required" },
        { status: 400 }
      );
    }

    // Validate new and confirm passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New and confirm passwords must match" },
        { status: 400 }
      );
    }

    // Password strength validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        {
          error:
            "New password must be at least 8 characters with an uppercase, lowercase, number, and special character",
        },
        { status: 400 }
      );
    }

    const userId = Number(session.user.id);
    const emailRecord = await prisma.email.findFirst({
      where: { userId, provider: "credentials" },
    });

    // Check if user has a credentials-based password
    if (!emailRecord || !emailRecord.password) {
      return NextResponse.json(
        { error: "No password set for this account" },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, emailRecord.password);
    if (!isValid) {
      // Implement lockout logic from previous step
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
      }

      if (user.lockoutUntil && now < user.lockoutUntil) {
        const minutesLeft = Math.ceil(
          (user.lockoutUntil.getTime() - now.getTime()) / 60000
        );
        return NextResponse.json(
          { error: `Account is locked. Try again in ${minutesLeft} minutes` },
          { status: 400 }
        );
      }

      const failedAttempts =
        user.lastFailedLogin && user.lastFailedLogin > fifteenMinutesAgo
          ? user.failedLoginAttempts + 1
          : 1;

      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: failedAttempts,
          lastFailedLogin: now,
          lockoutUntil:
            failedAttempts >= 5
              ? new Date(now.getTime() + 30 * 60 * 1000)
              : null,
        },
      });

      if (failedAttempts >= 5) {
        return NextResponse.json(
          {
            error:
              "Account locked due to too many failed attempts. Try again in 30 minutes",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Check if new password differs from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must differ from the current password" },
        { status: 400 }
      );
    }

    // Reset failed attempts on successful verification
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastFailedLogin: null,
      },
    });

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.email.update({
      where: { id: emailRecord.id },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Reset password server error:", error.message);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
