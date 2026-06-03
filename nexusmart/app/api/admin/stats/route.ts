import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export async function GET() {
  try {
    // Verify Admin Session
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 1. Calculate Total Earnings
    const orders = await prisma.order.findMany();
    const totalEarnings = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // 2. Count Total Orders
    const totalOrders = orders.length;

    // 3. Count Total Products
    const totalProducts = await prisma.product.count();

    // 4. Count Registered Customers
    const totalUsers = await prisma.user.count({
      where: { role: "USER" }
    });

    return NextResponse.json({
      totalEarnings,
      totalOrders,
      totalProducts,
      totalUsers
    });

  } catch (error) {
    console.error("Failed to compile admin metrics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}