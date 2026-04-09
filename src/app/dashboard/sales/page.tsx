"use client";

import { useState, useEffect } from "react";
import { PageHeader, Table, formatCurrency, formatDate, EmptyState } from "@/components/ui";
import Link from "next/link";

interface SaleEntry {
  id: string;
  customer: { name: string };
  date: string;
  lineItems: Array<{
    salePrice: number;
    item: {
      allocatedPurchaseCost: number;
      allocatedFees: number;
    };
  }>;
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleEntry[]>([]);

  useEffect(() => {
    fetch("/api/sales").then((r) => r.ok ? r.json() : []).then(setSales).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader
        title="Sales"
        description={`${sales.length} sales recorded`}
        action={{ label: "Record Sale", href: "/dashboard/sales/new" }}
      />

      {sales.length === 0 ? (
        <EmptyState
          title="No sales yet"
          description="Record a sale when you sell items from your inventory."
          action={{ label: "Record a Sale", href: "/dashboard/sales/new" }}
        />
      ) : (
        <Table headers={["Customer", "Date", "Items", "Revenue", "Est. Cost", "Est. Margin"]}>
          {sales.map((s) => {
            const totalRevenue = s.lineItems.reduce((sum, li) => sum + li.salePrice, 0);
            const totalCost = s.lineItems.reduce((sum, li) => sum + li.item.allocatedPurchaseCost + li.item.allocatedFees, 0);
            const margin = totalRevenue - totalCost;
            return (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/sales/${s.id}`} className="text-sm font-medium text-slate-900 hover:text-slate-700">
                    {s.customer.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(s.date)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.lineItems.length}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(totalRevenue)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(totalCost)}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {margin >= 0 ? "+" : ""}{formatCurrency(margin)}
                  </span>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
