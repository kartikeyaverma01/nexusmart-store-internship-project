import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export async function POST(req: Request) {
  try {
    // 1. Verify User Session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      console.warn("🚨 ORDER REJECTED: User session is unauthenticated.");
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Fetch current user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.warn(`🚨 ORDER REJECTED: User with email ${session.user.email} not found in database.`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Destructure checkout details
    const body = await req.json();
    const { customerName, shippingAddress, phone, postalCode, paymentMethod, totalAmount, items } = body;

    console.log(`\n======================================================`);
    console.log(`📦 PROCESSING ORDER: Customer ID: ${user.id}`);
    console.log(`👤 Name: ${customerName} | Pin Code: ${postalCode}`);
    console.log(`💵 Grand Total: INR ${totalAmount}`);
    console.log(`🛒 Cart Items Payload:`, JSON.stringify(items, null, 2));
    console.log(`======================================================\n`);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 4. Generate a unique Tracking Reference ID
    const randomSuffix1 = Math.floor(1000 + Math.random() * 9000); 
    const randomSuffix2 = Math.floor(1000 + Math.random() * 9000); 
    const trackingId = `NM-TRACK-${randomSuffix1}-${randomSuffix2}`;

    // 5. Build order inside a secure transaction block
    const order = await prisma.$transaction(async (tx) => {
      // Create primary order record
      console.log("⚡ [1/2] Committing Order master record...");
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          customerName,
          shippingAddress,
          phone,
          postalCode,
          paymentMethod,
          totalAmount: parseFloat(totalAmount),
          trackingId
        }
      });

      console.log(`✅ Order master record committed! ID: ${newOrder.id}`);

      // Create individual items mapping
      console.log("⚡ [2/2] Mapping individual order items...");
      for (const item of items) {
        // Safe conversion of the ID to avoid NaN issues
        const numericProductId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
        
        if (isNaN(numericProductId)) {
          throw new Error(`Invalid Product ID formatting detected: "${item.id}". Please clear your browser cache and refresh your cart.`);
        }

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: numericProductId,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price)
          }
        });
        console.log(`   - Connected item: Product ID ${numericProductId} x ${item.quantity}`);
      }

      return newOrder;
    });

    console.log(`🎉 SUCCESS: Order ${order.trackingId} successfully written to local PostgreSQL database!\n`);

    return NextResponse.json({
      success: true,
      trackingId: order.trackingId,
      customerId: user.id,
      orderStatus: order.orderStatus
    }, { status: 201 });

  } catch (error: any) {
    console.error("\n❌ DATABASE EXCEPTION IN ROUTE.TS:");
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);
    console.error("======================================================\n");

    return NextResponse.json({ 
      error: `Our checkout node failed to commit this transaction to the PostgreSQL tables. Details: ${error.message}` 
    }, { status: 500 });
  }
}
