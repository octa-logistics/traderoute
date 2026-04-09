import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data (order matters for foreign keys)
  await prisma.saleLineItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.itemProcessingLog.deleteMany();
  await prisma.item.deleteMany();
  await prisma.purchaseDeal.deleteMany();
  await prisma.storageLocation.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  console.log("Cleared existing data");

  // Create organization
  const org = await prisma.organization.create({
    data: {
      id: "default-org",
      name: "TradeRoute Resellers",
      financingRate: 0.12, // 12% annual
    },
  });
  console.log("Created organization");

  // Create users
  await prisma.user.createMany({
    data: [
      { name: "Alex Rivera", email: "alex@traderoute.com", role: "OWNER", organizationId: org.id },
      { name: "Jordan Lee", email: "jordan@traderoute.com", role: "ADMIN", organizationId: org.id },
      { name: "Sam Chen", email: "sam@traderoute.com", role: "MEMBER", organizationId: org.id },
    ],
  });
  console.log("Created 3 users");

  // Create vendors
  const [vendor1, vendor2, vendor3] = await Promise.all([
    prisma.vendor.create({
      data: {
        name: "Estate Liquidators Inc",
        contactEmail: "deals@estateliquidators.com",
        contactPhone: "555-0101",
        notes: "Weekly estate sale alerts. Good for furniture and electronics.",
        organizationId: org.id,
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Wholesale Overstock Co",
        contactEmail: "orders@wholesaleoverstock.com",
        contactPhone: "555-0202",
        notes: "Bulk pallets of returned merchandise. Mixed condition.",
        organizationId: org.id,
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Vintage Finds Market",
        contactEmail: "info@vintagefinds.com",
        contactPhone: "555-0303",
        notes: "Specialty vintage and collectible items. Higher margins.",
        organizationId: org.id,
      },
    }),
  ]);
  console.log("Created 3 vendors");

  // Create customers
  const [cust1, cust2, cust3, cust4, cust5] = await Promise.all([
    prisma.customer.create({ data: { name: "Maria Santos", contactEmail: "maria@email.com", organizationId: org.id } }),
    prisma.customer.create({ data: { name: "David Park", contactEmail: "david.park@email.com", contactPhone: "555-1001", organizationId: org.id } }),
    prisma.customer.create({ data: { name: "Lisa Thompson", contactEmail: "lisa.t@email.com", organizationId: org.id } }),
    prisma.customer.create({ data: { name: "Mike Johnson", contactPhone: "555-1004", notes: "Prefers pickup", organizationId: org.id } }),
    prisma.customer.create({ data: { name: "Sarah Williams", contactEmail: "sarah.w@email.com", contactPhone: "555-1005", organizationId: org.id } }),
  ]);
  console.log("Created 5 customers");

  // Create categories
  const [catElectronics, catFurniture, catCollectibles, catClothing] = await Promise.all([
    prisma.category.create({ data: { name: "Electronics", description: "Consumer electronics, gadgets, accessories", organizationId: org.id } }),
    prisma.category.create({ data: { name: "Furniture", description: "Home and office furniture", organizationId: org.id } }),
    prisma.category.create({ data: { name: "Collectibles", description: "Vintage items, antiques, collectible goods", organizationId: org.id } }),
    prisma.category.create({ data: { name: "Clothing & Accessories", description: "Apparel, shoes, bags, jewelry", organizationId: org.id } }),
  ]);
  console.log("Created 4 categories");

  // Create storage locations
  const [locMain, locOverflow, locShowroom] = await Promise.all([
    prisma.storageLocation.create({ data: { name: "Main Warehouse - Rack A", description: "Primary storage, climate controlled", organizationId: org.id } }),
    prisma.storageLocation.create({ data: { name: "Overflow Storage Unit B", description: "Secondary unit for bulk items", organizationId: org.id } }),
    prisma.storageLocation.create({ data: { name: "Showroom Display", description: "Items on display for local buyers", organizationId: org.id } }),
  ]);
  console.log("Created 3 storage locations");

  // Create purchase deals
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  const deal1 = await prisma.purchaseDeal.create({
    data: {
      vendorId: vendor1.id,
      organizationId: org.id,
      date: thirtyDaysAgo,
      totalPrice: 1200,
      fees: 150,
      taxes: 96,
      notes: "Estate sale lot - mixed electronics and furniture",
    },
  });

  const deal2 = await prisma.purchaseDeal.create({
    data: {
      vendorId: vendor2.id,
      organizationId: org.id,
      date: twentyDaysAgo,
      totalPrice: 800,
      fees: 50,
      taxes: 64,
      notes: "Overstock pallet - clothing and accessories",
    },
  });

  const deal3 = await prisma.purchaseDeal.create({
    data: {
      vendorId: vendor3.id,
      organizationId: org.id,
      date: tenDaysAgo,
      totalPrice: 2500,
      fees: 200,
      taxes: 200,
      notes: "Vintage collectibles lot from antique dealer",
    },
  });

  const deal4 = await prisma.purchaseDeal.create({
    data: {
      vendorId: vendor1.id,
      organizationId: org.id,
      date: fiveDaysAgo,
      totalPrice: 600,
      fees: 75,
      taxes: 48,
      notes: "Follow-up estate sale - electronics only",
    },
  });

  console.log("Created 4 purchase deals");

  // Create items
  // Deal 1 items (estate sale - electronics + furniture)
  const item1 = await prisma.item.create({
    data: {
      name: "Samsung 55\" 4K TV",
      description: "2024 model, minor scratch on bezel, fully functional",
      sku: "TR-ELEC-001",
      status: "SOLD",
      categoryId: catElectronics.id,
      storageLocationId: locMain.id,
      purchaseDealId: deal1.id,
      organizationId: org.id,
      allocatedPurchaseCost: 300,
      allocatedFees: 37.5,
      createdAt: thirtyDaysAgo,
    },
  });

  const item2 = await prisma.item.create({
    data: {
      name: "Sony Bluetooth Speaker",
      description: "Like new condition, original box",
      sku: "TR-ELEC-002",
      status: "SOLD",
      categoryId: catElectronics.id,
      storageLocationId: locMain.id,
      purchaseDealId: deal1.id,
      organizationId: org.id,
      allocatedPurchaseCost: 80,
      allocatedFees: 10,
      createdAt: thirtyDaysAgo,
    },
  });

  const item3 = await prisma.item.create({
    data: {
      name: "Mid-Century Desk",
      description: "Solid walnut, needs refinishing",
      sku: "TR-FURN-001",
      status: "LISTED",
      categoryId: catFurniture.id,
      storageLocationId: locShowroom.id,
      purchaseDealId: deal1.id,
      organizationId: org.id,
      allocatedPurchaseCost: 400,
      allocatedFees: 50,
      createdAt: thirtyDaysAgo,
    },
  });

  const item4 = await prisma.item.create({
    data: {
      name: "Leather Office Chair",
      description: "Herman Miller Aeron, Grade B condition",
      sku: "TR-FURN-002",
      status: "PROCESSING",
      categoryId: catFurniture.id,
      storageLocationId: locMain.id,
      purchaseDealId: deal1.id,
      organizationId: org.id,
      allocatedPurchaseCost: 250,
      allocatedFees: 31.25,
      createdAt: thirtyDaysAgo,
    },
  });

  const item5 = await prisma.item.create({
    data: {
      name: "Apple iPad Pro 11\"",
      description: "2023 model, cracked screen - needs repair",
      sku: "TR-ELEC-003",
      status: "PROCESSING",
      categoryId: catElectronics.id,
      storageLocationId: locMain.id,
      purchaseDealId: deal1.id,
      organizationId: org.id,
      allocatedPurchaseCost: 170,
      allocatedFees: 21.25,
      createdAt: thirtyDaysAgo,
    },
  });

  // Deal 2 items (overstock - clothing)
  const item6 = await prisma.item.create({
    data: {
      name: "Designer Handbag - Coach",
      description: "New with tags, overstock return",
      sku: "TR-CLTH-001",
      status: "SOLD",
      categoryId: catClothing.id,
      storageLocationId: locShowroom.id,
      purchaseDealId: deal2.id,
      organizationId: org.id,
      allocatedPurchaseCost: 120,
      allocatedFees: 7.5,
      createdAt: twentyDaysAgo,
    },
  });

  const item7 = await prisma.item.create({
    data: {
      name: "Nike Air Max Bundle (5 pairs)",
      description: "Mixed sizes, all new in box",
      sku: "TR-CLTH-002",
      status: "LISTED",
      categoryId: catClothing.id,
      storageLocationId: locOverflow.id,
      purchaseDealId: deal2.id,
      organizationId: org.id,
      allocatedPurchaseCost: 350,
      allocatedFees: 21.875,
      createdAt: twentyDaysAgo,
    },
  });

  const item8 = await prisma.item.create({
    data: {
      name: "Leather Jacket - Wilson's",
      description: "Vintage style, excellent condition",
      sku: "TR-CLTH-003",
      status: "SOLD",
      categoryId: catClothing.id,
      storageLocationId: locShowroom.id,
      purchaseDealId: deal2.id,
      organizationId: org.id,
      allocatedPurchaseCost: 80,
      allocatedFees: 5,
      createdAt: twentyDaysAgo,
    },
  });

  const item9 = await prisma.item.create({
    data: {
      name: "Ray-Ban Aviators",
      description: "Classic gold frame, new with case",
      sku: "TR-CLTH-004",
      status: "LISTED",
      categoryId: catClothing.id,
      storageLocationId: locShowroom.id,
      purchaseDealId: deal2.id,
      organizationId: org.id,
      allocatedPurchaseCost: 60,
      allocatedFees: 3.75,
      createdAt: twentyDaysAgo,
    },
  });

  const item10 = await prisma.item.create({
    data: {
      name: "Assorted Scarves (10 pack)",
      description: "Silk and wool mix, various patterns",
      sku: "TR-CLTH-005",
      status: "ACQUIRED",
      categoryId: catClothing.id,
      storageLocationId: locOverflow.id,
      purchaseDealId: deal2.id,
      organizationId: org.id,
      allocatedPurchaseCost: 190,
      allocatedFees: 11.875,
      createdAt: twentyDaysAgo,
    },
  });

  // Deal 3 items (vintage collectibles)
  const item11 = await prisma.item.create({
    data: {
      name: "1960s Rolex Submariner",
      description: "Ref 5513, running, original dial, needs service",
      sku: "TR-COLL-001",
      status: "PROCESSING",
      categoryId: catCollectibles.id,
      storageLocationId: locMain.id,
      purchaseDealId: deal3.id,
      organizationId: org.id,
      allocatedPurchaseCost: 1500,
      allocatedFees: 120,
      createdAt: tenDaysAgo,
    },
  });

  const item12 = await prisma.item.create({
    data: {
      name: "First Edition Hemingway - The Old Man and the Sea",
      description: "1952 Scribner edition, dust jacket present, VG condition",
      sku: "TR-COLL-002",
      status: "LISTED",
      categoryId: catCollectibles.id,
      storageLocationId: locMain.id,
      purchaseDealId: deal3.id,
      organizationId: org.id,
      allocatedPurchaseCost: 500,
      allocatedFees: 40,
      createdAt: tenDaysAgo,
    },
  });

  const item13 = await prisma.item.create({
    data: {
      name: "Vintage Polaroid SX-70",
      description: "Tested and working, includes case",
      sku: "TR-COLL-003",
      status: "SOLD",
      categoryId: catCollectibles.id,
      storageLocationId: locShowroom.id,
      purchaseDealId: deal3.id,
      organizationId: org.id,
      allocatedPurchaseCost: 300,
      allocatedFees: 24,
      createdAt: tenDaysAgo,
    },
  });

  const item14 = await prisma.item.create({
    data: {
      name: "Art Deco Bronze Bookends (pair)",
      description: "1930s, patinated, minor wear",
      sku: "TR-COLL-004",
      status: "LISTED",
      categoryId: catCollectibles.id,
      storageLocationId: locShowroom.id,
      purchaseDealId: deal3.id,
      organizationId: org.id,
      allocatedPurchaseCost: 200,
      allocatedFees: 16,
      createdAt: tenDaysAgo,
    },
  });

  // Deal 4 items (electronics follow-up)
  const item15 = await prisma.item.create({
    data: {
      name: "MacBook Air M2",
      description: "2023, 256GB, light cosmetic wear, fully functional",
      sku: "TR-ELEC-004",
      status: "ACQUIRED",
      categoryId: catElectronics.id,
      storageLocationId: locMain.id,
      purchaseDealId: deal4.id,
      organizationId: org.id,
      allocatedPurchaseCost: 400,
      allocatedFees: 50,
      createdAt: fiveDaysAgo,
    },
  });

  const item16 = await prisma.item.create({
    data: {
      name: "AirPods Pro (2nd gen)",
      description: "Sealed, new in box",
      sku: "TR-ELEC-005",
      status: "LISTED",
      categoryId: catElectronics.id,
      storageLocationId: locShowroom.id,
      purchaseDealId: deal4.id,
      organizationId: org.id,
      allocatedPurchaseCost: 120,
      allocatedFees: 15,
      createdAt: fiveDaysAgo,
    },
  });

  const item17 = await prisma.item.create({
    data: {
      name: "Nintendo Switch OLED",
      description: "Complete with dock and Joy-Cons, excellent condition",
      sku: "TR-ELEC-006",
      status: "ACQUIRED",
      categoryId: catElectronics.id,
      storageLocationId: locMain.id,
      purchaseDealId: deal4.id,
      organizationId: org.id,
      allocatedPurchaseCost: 80,
      allocatedFees: 10,
      createdAt: fiveDaysAgo,
    },
  });

  console.log("Created 17 items");

  // Processing logs
  await prisma.itemProcessingLog.createMany({
    data: [
      // Desk refinishing
      { itemId: item3.id, description: "Sanding and prep work", cost: 25, date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
      { itemId: item3.id, description: "Staining and polyurethane finish", cost: 45, date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) },
      // Chair cleaning
      { itemId: item4.id, description: "Deep leather cleaning and conditioning", cost: 35, date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
      { itemId: item4.id, description: "Replaced gas cylinder", cost: 20, date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000) },
      // iPad repair
      { itemId: item5.id, description: "Screen replacement parts", cost: 85, date: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000) },
      { itemId: item5.id, description: "Screen replacement labor", cost: 50, date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000) },
      // Rolex service
      { itemId: item11.id, description: "Initial assessment and photography", cost: 50, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { itemId: item11.id, description: "Movement service deposit", cost: 200, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      // Polaroid restoration
      { itemId: item13.id, description: "Cleaned optics and replaced battery contacts", cost: 15, date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    ],
  });
  console.log("Created 9 processing logs");

  // Sales
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const twelveDaysAgo = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  await prisma.sale.create({
    data: {
      customerId: cust1.id,
      organizationId: org.id,
      date: fifteenDaysAgo,
      notes: "Repeat buyer - gave 5% discount",
      lineItems: {
        create: [
          { itemId: item1.id, salePrice: 450 },
          { itemId: item2.id, salePrice: 120 },
        ],
      },
    },
  });

  await prisma.sale.create({
    data: {
      customerId: cust2.id,
      organizationId: org.id,
      date: twelveDaysAgo,
      lineItems: {
        create: [
          { itemId: item6.id, salePrice: 220 },
        ],
      },
    },
  });

  await prisma.sale.create({
    data: {
      customerId: cust3.id,
      organizationId: org.id,
      date: eightDaysAgo,
      lineItems: {
        create: [
          { itemId: item8.id, salePrice: 175 },
        ],
      },
    },
  });

  await prisma.sale.create({
    data: {
      customerId: cust4.id,
      organizationId: org.id,
      date: threeDaysAgo,
      notes: "Local pickup, cash payment",
      lineItems: {
        create: [
          { itemId: item13.id, salePrice: 550 },
        ],
      },
    },
  });

  // Mark item9 as SOLD for this sale
  await prisma.item.update({ where: { id: item9.id }, data: { status: "SOLD" } });
  await prisma.sale.create({
    data: {
      customerId: cust5.id,
      organizationId: org.id,
      date: oneDayAgo,
      lineItems: {
        create: [
          { itemId: item9.id, salePrice: 95 },
        ],
      },
    },
  });

  console.log("Created 5 sales");
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
