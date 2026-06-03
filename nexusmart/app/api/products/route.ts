import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

// GET: Fetch every live product (For public browsing)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST: Add a new product to PostgreSQL (Secure, Admin-only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { name, price, category, imageUrl, description } = await req.json();

    if (!name || !price || !category || !imageUrl || !description) {
      return NextResponse.json({ error: "Missing catalog specifications" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        category,
        imageUrl,
        description
      }
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("Product creation crash:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}