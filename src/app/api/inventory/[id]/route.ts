import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { product: true, warehouse: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const item = await prisma.inventoryItem.update({
    where: { id },
    data: body,
    include: { product: true, warehouse: true },
  });
  return NextResponse.json(item);
}
