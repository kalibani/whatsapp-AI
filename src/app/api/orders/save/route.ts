import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Received order data:", body);

    const {
      order_id,
      package_id,
      subscription_id,
      order_no,
      name,
      order_date,
      status,
      total_amount,
      organization_id,
      sub_organization_id,
      subs_type,
    } = body;

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

    // Create or update subscription if subscription_id exists
    let subscription = null;
    if (subscription_id) {
      subscription = await prisma.subscription.upsert({
        where: { subscriptionId: subscription_id },
        update: {
          status,
          totalAmount: total_amount,
          subsType: subs_type,
          organizationId: organization_id,
          subOrganizationId: sub_organization_id,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          packageId: package_id,
          subscriptionId: subscription_id,
          packageName: name,
          status,
          totalAmount: total_amount,
          subsType: subs_type,
          organizationId: organization_id,
          subOrganizationId: sub_organization_id,
        },
      });
    }

    // Create or update order
    const order = await prisma.order.upsert({
      where: { orderId: order_id },
      update: {
        status,
        totalAmount: total_amount,
        organizationId: organization_id,
        subOrganizationId: sub_organization_id,
        subsType: subs_type,
        updatedAt: new Date(),
        ...(subscription && { subscriptionId: subscription.id }),
      },
      create: {
        userId: user.id,
        orderId: order_id,
        packageId: package_id,
        orderNo: order_no,
        packageName: name,
        orderDate: new Date(order_date),
        status,
        totalAmount: total_amount,
        organizationId: organization_id,
        subOrganizationId: sub_organization_id,
        subsType: subs_type,
        ...(subscription && { subscriptionId: subscription.id }),
      },
    });

    return NextResponse.json({
      success: true,
      order,
      subscription,
    });
  } catch (error: any) {
    console.error("Error saving order:", error);
    return NextResponse.json(
      { error: "Failed to save order" },
      { status: 500 }
    );
  }
}