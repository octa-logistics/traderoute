import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Table, formatCurrency, formatDate, EmptyState } from "@/components/ui";
import { apiFetch } from "@/lib/api";

interface PurchaseDeal {
  id: string;
  vendor: { name: string };
  date: string;
  totalPrice: number;
  fees: number;
  taxes: number;
  items: Array<{ id: string }>;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseDeal[]>([]);

  useEffect(() => {
    apiFetch<PurchaseDeal[]>("/purchase-deals", []).then(setPurchases);
  }, []);

  return (
    <div>
      <PageHeader
        title="Purchase Deals"
        description={`${purchases.length} deals recorded`}
        action={{ label: "New Purchase", href: "/dashboard/purchases/new" }}
      />

      {purchases.length === 0 ? (
        <EmptyState
          title="No purchase deals yet"
          description="Record your first purchase to start tracking inventory costs."
          action={{ label: "Record a Purchase", href: "/dashboard/purchases/new" }}
        />
      ) : (
        <Table headers={["Vendor", "Date", "Items", "Price", "Fees", "Taxes", "Total"]}>
          {purchases.map((p) => {
            const total = p.totalPrice + p.fees + p.taxes;
            return (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/dashboard/purchases/${p.id}`} className="text-sm font-medium text-slate-900 hover:text-slate-700">
                    {p.vendor.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatDate(p.date)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{p.items.length}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(p.totalPrice)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(p.fees)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(p.taxes)}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrency(total)}</td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
