import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: { inventory: { include: { product: true } } },
  });

  if (!warehouse) {
    return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
  }

  return NextResponse.json(warehouse);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const warehouse = await prisma.warehouse.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(warehouse);
}
