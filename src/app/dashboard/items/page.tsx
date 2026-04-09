"use client";

import { useState, useEffect } from "react";
import { PageHeader, Table, StatusBadge, formatCurrency, EmptyState } from "@/components/ui";
import Link from "next/link";

interface ItemEntry {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  category: { name: string } | null;
  allocatedPurchaseCost: number;
  allocatedFees: number;
  processingLogs: Array<{ cost: number }>;
  saleLineItem: { salePrice: number } | null;
  createdAt: string;
}

function computeCostBasis(item: ItemEntry) {
  const processingCost = item.processingLogs.reduce((sum, l) => sum + l.cost, 0);
  return item.allocatedPurchaseCost + item.allocatedFees + processingCost;
}

function computeDaysHeld(createdAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)));
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    fetch(`/api/items${params}`).then((r) => r.ok ? r.json() : []).then(setItems).catch(() => {});
  }, [statusFilter]);

  const statuses = ["all", "ACQUIRED", "PROCESSING", "LISTED", "SOLD"];

  return (
    <div>
      <PageHeader
        title="Items"
        description={`${items.length} items`}
        action={{ label: "Add Item", href: "/dashboard/items/new" }}
      />

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              statusFilter === s
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}>
            {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No items yet"
          description="Items are created when you record a purchase deal."
          action={{ label: "Record a Purchase", href: "/dashboard/purchases/new" }}
        />
      ) : (
        <Table headers={["Item", "Status", "Category", "Cost Basis", "Days Held", "Sale Price", "Margin"]}>
          {items.map((item) => {
            const costBasis = computeCostBasis(item);
            const daysHeld = computeDaysHeld(item.createdAt);
            const salePrice = item.saleLineItem?.salePrice ?? null;
            const margin = salePrice !== null ? salePrice - costBasis : null;
            return (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/items/${item.id}`} className="text-sm font-medium text-slate-900 hover:text-slate-700">
                    {item.name}
                  </Link>
                  {item.sku && <p className="text-xs text-slate-400 mt-0.5">{item.sku}</p>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-sm text-slate-600">{item.category?.name || "--"}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(costBasis)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{daysHeld}d</td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  {salePrice !== null ? formatCurrency(salePrice) : "--"}
                </td>
                <td className="px-4 py-3">
                  {margin !== null ? (
                    <span className={`text-sm font-medium ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {margin >= 0 ? "+" : ""}{formatCurrency(margin)}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">--</span>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
