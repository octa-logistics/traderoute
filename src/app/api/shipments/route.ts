import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ShipmentStatus } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") as ShipmentStatus | null;
  const orderId = searchParams.get("orderId");
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(orderId && { orderId }),
  };

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      skip,
      take: limit,
      include: { order: true, warehouse: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shipment.count({ where }),
  ]);

  return NextResponse.json({ data: shipments, total, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const shipment = await prisma.shipment.create({
    data: body,
    include: { order: true, warehouse: true },
  });
  return NextResponse.json(shipment, { status: 201 });
}
