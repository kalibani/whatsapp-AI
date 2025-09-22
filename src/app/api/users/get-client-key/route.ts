import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerkId } = body;

    if (!clerkId) {
      return NextResponse.json(
        { error: "Missing clerkId" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { clientKey: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ clientKey: user.clientKey });
  } catch (error: any) {
    console.error("Error getting client key:", error);
    return NextResponse.json(
      { error: "Failed to get client key" },
      { status: 500 }
    );
  }
}