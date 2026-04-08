import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { order: true, warehouse: true },
  });

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  return NextResponse.json(shipment);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const shipment = await prisma.shipment.update({
    where: { id },
    data: body,
    include: { order: true, warehouse: true },
  });
  return NextResponse.json(shipment);
}
