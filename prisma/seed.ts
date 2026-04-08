import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: `file:${path.resolve(__dirname, "..", "dev.db")}`,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data (order matters for foreign keys)
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  console.log("Cleared existing data");

  // Create warehouses
  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: "East Coast Fulfillment Center",
      address: "1234 Logistics Blvd",
      city: "Newark",
      state: "NJ",
      zipCode: "07102",
      country: "US",
    },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: "West Coast Distribution Hub",
      address: "5678 Shipping Lane",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "US",
    },
  });

  const warehouse3 = await prisma.warehouse.create({
    data: {
      name: "Central Warehouse",
      address: "910 Freight Ave",
      city: "Dallas",
      state: "TX",
      zipCode: "75201",
      country: "US",
    },
  });

  console.log(`Created ${3} warehouses`);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: "WIDGET-001",
        name: "Standard Widget",
        description: "A reliable all-purpose widget",
        weight: 0.5,
        weightUnit: "lb",
      },
    }),
    prisma.product.create({
      data: {
        sku: "WIDGET-002",
        name: "Premium Widget",
        description: "Enhanced widget with extra durability",
        weight: 0.75,
        weightUnit: "lb",
      },
    }),
    prisma.product.create({
      data: {
        sku: "GADGET-001",
        name: "Smart Gadget",
        description: "IoT-enabled gadget for modern workflows",
        weight: 1.2,
        weightUnit: "lb",
      },
    }),
    prisma.product.create({
      data: {
        sku: "GADGET-002",
        name: "Portable Gadget",
        description: "Compact gadget for on-the-go use",
        weight: 0.3,
        weightUnit: "lb",
      },
    }),
    prisma.product.create({
      data: {
        sku: "PACK-001",
        name: "Shipping Box (Small)",
        description: "Small corrugated shipping box",
        weight: 0.1,
        weightUnit: "lb",
      },
    }),
  ]);

  console.log(`Created ${products.length} products`);

  // Create inventory items
  const inventoryItems = await Promise.all([
    // East Coast warehouse
    prisma.inventoryItem.create({
      data: { productId: products[0].id, warehouseId: warehouse1.id, quantity: 500, reorderPoint: 100 },
    }),
    prisma.inventoryItem.create({
      data: { productId: products[1].id, warehouseId: warehouse1.id, quantity: 200, reorderPoint: 50 },
    }),
    prisma.inventoryItem.create({
      data: { productId: products[2].id, warehouseId: warehouse1.id, quantity: 150, reorderPoint: 30 },
    }),
    // West Coast warehouse
    prisma.inventoryItem.create({
      data: { productId: products[0].id, warehouseId: warehouse2.id, quantity: 300, reorderPoint: 75 },
    }),
    prisma.inventoryItem.create({
      data: { productId: products[3].id, warehouseId: warehouse2.id, quantity: 400, reorderPoint: 80 },
    }),
    // Central warehouse
    prisma.inventoryItem.create({
      data: { productId: products[0].id, warehouseId: warehouse3.id, quantity: 1000, reorderPoint: 200 },
    }),
    prisma.inventoryItem.create({
      data: { productId: products[1].id, warehouseId: warehouse3.id, quantity: 600, reorderPoint: 100 },
    }),
    prisma.inventoryItem.create({
      data: { productId: products[4].id, warehouseId: warehouse3.id, quantity: 2000, reorderPoint: 500 },
    }),
  ]);

  console.log(`Created ${inventoryItems.length} inventory items`);

  // Create orders
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-0001",
      status: "CONFIRMED",
      customerName: "Alice Johnson",
      customerEmail: "alice@example.com",
      shippingAddress: "100 Main St",
      city: "Boston",
      state: "MA",
      zipCode: "02101",
      items: {
        create: [
          { productId: products[0].id, quantity: 10, unitPrice: 9.99 },
          { productId: products[1].id, quantity: 5, unitPrice: 14.99 },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-0002",
      status: "PROCESSING",
      customerName: "Bob Smith",
      customerEmail: "bob@example.com",
      shippingAddress: "200 Oak Ave",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      items: {
        create: [
          { productId: products[2].id, quantity: 2, unitPrice: 29.99 },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-0003",
      status: "PENDING",
      customerName: "Carol Davis",
      customerEmail: "carol@example.com",
      shippingAddress: "300 Elm St",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      items: {
        create: [
          { productId: products[0].id, quantity: 20, unitPrice: 9.99 },
          { productId: products[3].id, quantity: 10, unitPrice: 19.99 },
          { productId: products[4].id, quantity: 30, unitPrice: 2.49 },
        ],
      },
    },
  });

  console.log(`Created 3 orders`);

  // Create shipments
  await prisma.shipment.create({
    data: {
      orderId: order1.id,
      warehouseId: warehouse1.id,
      status: "SHIPPED",
      carrier: "FedEx",
      trackingNumber: "FX123456789",
      estimatedDelivery: new Date("2026-04-12"),
      shippedAt: new Date("2026-04-08"),
    },
  });

  await prisma.shipment.create({
    data: {
      orderId: order2.id,
      warehouseId: warehouse2.id,
      status: "PACKED",
      carrier: "UPS",
      trackingNumber: "1Z999AA10123456784",
    },
  });

  console.log(`Created 2 shipments`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
