import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const warehouseId = searchParams.get("warehouseId");
  const productId = searchParams.get("productId");
  const skip = (page - 1) * limit;

  const where = {
    ...(warehouseId && { warehouseId }),
    ...(productId && { productId }),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      skip,
      take: limit,
      include: { product: true, warehouse: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return NextResponse.json({ data: items, total, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const item = await prisma.inventoryItem.create({
    data: body,
    include: { product: true, warehouse: true },
  });
  return NextResponse.json(item, { status: 201 });
}
