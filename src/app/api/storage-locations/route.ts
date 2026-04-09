import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error, DEFAULT_ORG_ID } from "@/lib/api";

export async function GET() {
  const locations = await prisma.storageLocation.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    orderBy: { name: "asc" },
  });
  return json(locations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) return error("name is required");

  const location = await prisma.storageLocation.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      organizationId: DEFAULT_ORG_ID,
    },
  });
  return json(location, 201);
}
