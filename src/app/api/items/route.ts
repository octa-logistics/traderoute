import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error, DEFAULT_ORG_ID } from "@/lib/api";
import { ItemStatus } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") as ItemStatus | null;
  const categoryId = url.searchParams.get("categoryId");
  const purchaseDealId = url.searchParams.get("purchaseDealId");

  const items = await prisma.item.findMany({
    where: {
      organizationId: DEFAULT_ORG_ID,
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(purchaseDealId && { purchaseDealId }),
    },
    include: {
      category: true,
      storageLocation: true,
      purchaseDeal: { include: { vendor: true } },
      processingLogs: true,
      saleLineItem: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) return error("name is required");

  const item = await prisma.item.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      sku: body.sku ?? null,
      status: body.status ?? "ACQUIRED",
      categoryId: body.categoryId ?? null,
      storageLocationId: body.storageLocationId ?? null,
      purchaseDealId: body.purchaseDealId ?? null,
      organizationId: DEFAULT_ORG_ID,
      allocatedPurchaseCost: body.allocatedPurchaseCost ?? 0,
      allocatedFees: body.allocatedFees ?? 0,
    },
    include: {
      category: true,
      storageLocation: true,
      purchaseDeal: true,
    },
  });
  return json(item, 201);
}
