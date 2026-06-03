import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing existing product catalog to avoid duplicates...');
  // Delete all existing products so we have a clean slate with Indian pricing
  await prisma.product.deleteMany({});

  console.log('Starting to seed product catalog with localized pricing & detailed descriptions...');

  const products = [
    {
      name: "Premium Wireless Headphones (ANC)",
      price: 14999.00, // Replaced $299.99 with ₹14,999
      category: "Electronics",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=60",
      description: "Experience world-class hybrid active noise cancellation (ANC). Features 40-hour wireless playback, ultra-soft memory protein earcups, and signature deep bass tuning customized for Indian audiophiles."
    },
    {
      name: "Minimalist Classic Smartwatch v2",
      price: 8499.00, // Replaced $199.50 with ₹8,499
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=60",
      description: "A gorgeous premium smart wearable featuring an Always-on AMOLED display, SPO2 tracking, 24/7 heart rate sleep logging, and customized multi-sport modes with a luxurious premium metal strap."
    },
    {
      name: "Ergonomic High-Back Office Chair",
      price: 11999.00, // Replaced $149.00 with ₹11,999
      category: "Furniture",
      imageUrl: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=500&q=60",
      description: "Professional high-back office executive chair with multi-way adjustable lumbar support, breathable premium mesh, heavy-duty synchronized tilt mechanism, and silent rolling dual caster wheels."
    },
    {
      name: "Keychron Mechanical Tactile Keyboard",
      price: 6999.00, // Replaced $89.99 with ₹6,999
      category: "Electronics",
      imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=500&q=60",
      description: "The ultimate hot-swappable tactile keyboard. Features Gateron switches, localized keys, customizable dual-level RGB backlighting, and dual compatibility for macOS and Windows systems."
    },
    {
      name: "Handcrafted Ceramic Artisan Coffee Mug",
      price: 699.00, // Replaced $24.00 with ₹699
      category: "Home",
      imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=500&q=60",
      description: "Begin your mornings with luxury. Handcrafted by local clay artisans, this ceramic mug retains heat longer and features an elegantly ergonomic handle with a beautiful volcanic glaze finish."
    },
    {
      name: "Water-Resistant Daily Canvas Backpack",
      price: 2499.00, // Replaced $55.00 with ₹2,499
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=60",
      description: "Tough, water-resistant canvas laptop daypack containing dedicated padded compartments up to 16 inches, anti-theft back zippers, and padded shoulder relief loops designed for daily Indian metro commutes."
    }
  ];

  for (const product of products) {
    const createdProduct = await prisma.product.create({
      data: product
    });
    console.log(`Successfully migrated database entry: ${createdProduct.name}`);
  }

  console.log('✅ Database migrated and seeded with Indian locale pricing!');
}

main()
  .catch((e) => {
    console.error('Error during catalog migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });