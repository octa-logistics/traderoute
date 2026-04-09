import type { Item, ItemProcessingLog, Organization, SaleLineItem } from "../generated/prisma/client";

type ItemWithRelations = Item & {
  processingLogs: ItemProcessingLog[];
  saleLineItem: SaleLineItem | null;
  organization: Organization;
};

export function calculateItemCosts(item: ItemWithRelations) {
  const processingCost = item.processingLogs.reduce((sum, log) => sum + log.cost, 0);
  const costBeforeInterest = item.allocatedPurchaseCost + item.allocatedFees + processingCost;

  // Financing interest: daily accrual on unsold items
  const dailyRate = item.organization.financingRate / 365;
  const now = new Date();
  const acquiredDate = item.createdAt;
  const endDate = item.status === "SOLD" && item.saleLineItem
    ? item.updatedAt // use the date status changed to SOLD
    : now;
  const daysHeld = Math.max(0, Math.floor((endDate.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24)));
  const financingInterest = costBeforeInterest * dailyRate * daysHeld;

  const totalCost = costBeforeInterest + financingInterest;
  const salePrice = item.saleLineItem?.salePrice ?? null;
  const margin = salePrice !== null ? salePrice - totalCost : null;

  return {
    allocatedPurchaseCost: item.allocatedPurchaseCost,
    allocatedFees: item.allocatedFees,
    processingCost,
    costBeforeInterest,
    daysHeld,
    financingInterest,
    totalCost,
    salePrice,
    margin,
  };
}
