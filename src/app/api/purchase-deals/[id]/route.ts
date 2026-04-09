import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const deal = await prisma.purchaseDeal.findUnique({
    where: { id },
    include: { vendor: true, items: true },
  });
  if (!deal) return error("Purchase deal not found", 404);
  return json(deal);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const deal = await prisma.purchaseDeal.update({
    where: { id },
    data: {
      ...(body.vendorId !== undefined && { vendorId: body.vendorId }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.totalPrice !== undefined && { totalPrice: body.totalPrice }),
      ...(body.fees !== undefined && { fees: body.fees }),
      ...(body.taxes !== undefined && { taxes: body.taxes }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: { vendor: true, items: true },
  });
  return json(deal);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.purchaseDeal.delete({ where: { id } });
  return json({ deleted: true });
}
