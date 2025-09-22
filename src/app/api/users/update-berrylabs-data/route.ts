import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received update request body:", body);

    const { clerkId, userId, clientKey } = body;

    // Validate required fields
    if (!clerkId || !userId || !clientKey) {
      console.error("Missing required fields:", { clerkId, userId, clientKey });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Updating user with clerkId:", clerkId);

    // Update user with BerryLabs data
    const user = await prisma.user.update({
      where: { clerkId },
      data: {
        berryLabsUserId: userId,
        clientKey,
      },
    });

    console.log("User updated successfully:", user);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Error updating user with BerryLabs data:", error);

    // Handle user not found
    if (error.code === "P2025") {
      console.error("User not found with clerkId:", error);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}