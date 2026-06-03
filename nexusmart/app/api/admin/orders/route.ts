import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

// GET: Fetch every order in the store (including custom items bought)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Admin order query failure:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Let Admins change the shipping status of any order (e.g. Processing -> Delivered)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { orderId, newStatus } = await req.json();

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: "Missing required arguments" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: newStatus }
    });

    return NextResponse.json({ success: true, updatedOrder });
  } catch (error) {
    console.error("Failed to update order status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
