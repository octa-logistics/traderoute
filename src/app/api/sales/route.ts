import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error, DEFAULT_ORG_ID } from "@/lib/api";

export async function GET() {
  const sales = await prisma.sale.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    include: {
      customer: true,
      lineItems: { include: { item: true } },
    },
    orderBy: { date: "desc" },
  });
  return json(sales);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.customerId) return error("customerId is required");
  if (!body.lineItems?.length) return error("at least one lineItem is required");

  const sale = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        customerId: body.customerId,
        organizationId: DEFAULT_ORG_ID,
        date: body.date ? new Date(body.date) : new Date(),
        notes: body.notes ?? null,
        lineItems: {
          create: body.lineItems.map((li: { itemId: string; salePrice: number }) => ({
            itemId: li.itemId,
            salePrice: li.salePrice,
          })),
        },
      },
      include: {
        customer: true,
        lineItems: { include: { item: true } },
      },
    });

    // Mark items as SOLD
    await tx.item.updateMany({
      where: { id: { in: body.lineItems.map((li: { itemId: string }) => li.itemId) } },
      data: { status: "SOLD" },
    });

    return sale;
  });

  return json(sale, 201);
}
