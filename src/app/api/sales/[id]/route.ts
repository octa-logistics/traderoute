import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      lineItems: { include: { item: true } },
    },
  });
  if (!sale) return error("Sale not found", 404);
  return json(sale);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const sale = await prisma.sale.update({
    where: { id },
    data: {
      ...(body.customerId !== undefined && { customerId: body.customerId }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: {
      customer: true,
      lineItems: { include: { item: true } },
    },
  });
  return json(sale);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  // Unmark items as SOLD before deleting the sale
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { lineItems: true },
  });
  if (!sale) return error("Sale not found", 404);

  await prisma.$transaction(async (tx) => {
    const itemIds = sale.lineItems.map((li) => li.itemId);
    await tx.item.updateMany({
      where: { id: { in: itemIds } },
      data: { status: "LISTED" },
    });
    await tx.sale.delete({ where: { id } });
  });

  return json({ deleted: true });
}
