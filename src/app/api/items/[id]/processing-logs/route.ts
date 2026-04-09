import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const logs = await prisma.itemProcessingLog.findMany({
    where: { itemId: id },
    orderBy: { date: "desc" },
  });
  return json(logs);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  if (!body.description) return error("description is required");
  if (body.cost === undefined) return error("cost is required");

  const log = await prisma.itemProcessingLog.create({
    data: {
      itemId: id,
      description: body.description,
      cost: body.cost,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });
  return json(log, 201);
}
