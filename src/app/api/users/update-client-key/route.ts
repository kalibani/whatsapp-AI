import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerkId, clientKey, berryLabsUserId } = body;

    console.log("Updating client key for user:", { clerkId, clientKey });

    if (!clerkId || !clientKey) {
      console.error("Missing required fields:", { clerkId, clientKey });
      return NextResponse.json(
        { error: "clerkId and clientKey are required" },
        { status: 400 }
      );
    }

    // Find user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      console.error("User not found for clerkId:", clerkId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user with client key
    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: { clientKey, berryLabsUserId },
    });

    console.log("User client key updated successfully:", updatedUser.id);

    return NextResponse.json({
      success: true,
      message: "Client key updated successfully",
      userId: updatedUser.id,
    });
  } catch (error) {
    console.error("Error updating client key:", error);
    return NextResponse.json(
      { error: "Failed to update client key" },
      { status: 500 }
    );
  }
}
