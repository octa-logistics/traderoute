import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error, DEFAULT_ORG_ID } from "@/lib/api";

export async function GET() {
  const vendors = await prisma.vendor.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    orderBy: { name: "asc" },
  });
  return json(vendors);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) return error("name is required");

  const vendor = await prisma.vendor.create({
    data: {
      name: body.name,
      contactEmail: body.contactEmail ?? null,
      contactPhone: body.contactPhone ?? null,
      notes: body.notes ?? null,
      organizationId: DEFAULT_ORG_ID,
    },
  });
  return json(vendor, 201);
}
