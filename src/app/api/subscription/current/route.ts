import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's current active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "success_payment", // Only active subscriptions
      },
      orderBy: {
        createdAt: "desc", // Get the most recent one
      },
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
        message: "No active subscription found",
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        packageId: subscription.packageId,
        packageName: subscription.packageName,
        status: subscription.status,
        totalAmount: subscription.totalAmount,
        subsType: subscription.subsType,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}