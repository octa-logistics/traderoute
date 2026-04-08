import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") as OrderStatus | null;
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: { items: { include: { product: true } }, shipments: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ data: orders, total, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { items, ...orderData } = body;

  const order = await prisma.order.create({
    data: {
      ...orderData,
      items: items ? { create: items } : undefined,
    },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json(order, { status: 201 });
}
