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
    const userId = Number(session.user.id);
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);

    await prisma.user.update({
      where: { id: userId },
      data: { deletionScheduledAt: fifteenDaysFromNow },
    });

    console.log(
      `Account deletion scheduled for user ${userId} on ${fifteenDaysFromNow}`
    );
    return NextResponse.json(
      { message: "Account deletion scheduled in 15 days." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete account error:", error.message);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Simulate a background job (in a real app, use a cron job or task queue)
async function checkScheduledDeletions() {
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const usersToDelete = await prisma.user.findMany({
    where: {
      deletionScheduledAt: { lte: fifteenDaysAgo },
      lastLoginAt: { lte: fifteenDaysAgo }, // Ensure no login since scheduling
    },
  });

  for (const user of usersToDelete) {
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log(`Deleted user ${user.id} as scheduled`);
  }
}

// Run this periodically (e.g., via a cron job in production)
setInterval(checkScheduledDeletions, 24 * 60 * 60 * 1000); // Run daily
