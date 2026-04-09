import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error, DEFAULT_ORG_ID } from "@/lib/api";

export async function GET() {
  const deals = await prisma.purchaseDeal.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    include: { vendor: true, items: true },
    orderBy: { date: "desc" },
  });
  return json(deals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.vendorId) return error("vendorId is required");
  if (body.totalPrice === undefined) return error("totalPrice is required");

  const deal = await prisma.purchaseDeal.create({
    data: {
      vendorId: body.vendorId,
      organizationId: DEFAULT_ORG_ID,
      date: body.date ? new Date(body.date) : new Date(),
      totalPrice: body.totalPrice,
      fees: body.fees ?? 0,
      taxes: body.taxes ?? 0,
      notes: body.notes ?? null,
    },
    include: { vendor: true },
  });
  return json(deal, 201);
}
