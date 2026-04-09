import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error } from "@/lib/api";
import { calculateItemCosts } from "@/lib/costs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      storageLocation: true,
      purchaseDeal: { include: { vendor: true } },
      processingLogs: true,
      saleLineItem: true,
      organization: true,
    },
  });
  if (!item) return error("Item not found", 404);

  const costs = calculateItemCosts(item);
  return json({ ...item, costs });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const item = await prisma.item.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.sku !== undefined && { sku: body.sku }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
      ...(body.storageLocationId !== undefined && { storageLocationId: body.storageLocationId }),
      ...(body.purchaseDealId !== undefined && { purchaseDealId: body.purchaseDealId }),
      ...(body.allocatedPurchaseCost !== undefined && { allocatedPurchaseCost: body.allocatedPurchaseCost }),
      ...(body.allocatedFees !== undefined && { allocatedFees: body.allocatedFees }),
    },
    include: {
      category: true,
      storageLocation: true,
      purchaseDeal: true,
      processingLogs: true,
      saleLineItem: true,
    },
  });
  return json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.item.delete({ where: { id } });
  return json({ deleted: true });
}
