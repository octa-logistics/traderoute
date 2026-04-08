import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [warehouses, total] = await Promise.all([
    prisma.warehouse.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.warehouse.count(),
  ]);

  return NextResponse.json({ data: warehouses, total, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const warehouse = await prisma.warehouse.create({ data: body });
  return NextResponse.json(warehouse, { status: 201 });
}
