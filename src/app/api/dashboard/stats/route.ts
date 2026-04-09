export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { json, DEFAULT_ORG_ID } from "@/lib/api";
import { calculateItemCosts } from "@/lib/costs";

export async function GET() {
  const org = await prisma.organization.findUnique({
    where: { id: DEFAULT_ORG_ID },
  });
  if (!org) return json({ error: "Organization not found" }, 404);

  const items = await prisma.item.findMany({
    where: { organizationId: DEFAULT_ORG_ID },
    include: {
      processingLogs: true,
      saleLineItem: true,
      organization: true,
      category: true,
    },
  });

  let totalInventoryValue = 0;
  let totalSoldRevenue = 0;
  let totalSoldCost = 0;
  const categoryMargins: Record<string, { revenue: number; cost: number; name: string }> = {};

  for (const item of items) {
    const costs = calculateItemCosts(item);

    if (item.status !== "SOLD") {
      totalInventoryValue += costs.totalCost;
    } else if (costs.salePrice !== null) {
      totalSoldRevenue += costs.salePrice;
      totalSoldCost += costs.totalCost;

      const catName = item.category?.name ?? "Uncategorized";
      const catId = item.categoryId ?? "uncategorized";
      if (!categoryMargins[catId]) {
        categoryMargins[catId] = { revenue: 0, cost: 0, name: catName };
      }
      categoryMargins[catId].revenue += costs.salePrice;
      categoryMargins[catId].cost += costs.totalCost;
    }
  }

  const overallMarginPct = totalSoldRevenue > 0
    ? ((totalSoldRevenue - totalSoldCost) / totalSoldRevenue) * 100
    : 0;

  const topCategoriesByMargin = Object.entries(categoryMargins)
    .map(([id, data]) => ({
      categoryId: id,
      name: data.name,
      revenue: data.revenue,
      cost: data.cost,
      margin: data.revenue - data.cost,
      marginPct: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.margin - a.margin);

  return json({
    totalItems: items.length,
    totalInventoryItems: items.filter((i) => i.status !== "SOLD").length,
    totalSoldItems: items.filter((i) => i.status === "SOLD").length,
    totalInventoryValue,
    totalSoldRevenue,
    totalSoldCost,
    overallMarginPct,
    topCategoriesByMargin,
  });
}
