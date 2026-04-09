import { apiFetch } from "@/lib/fetch";
import { PageHeader, Table, formatCurrency, formatDate, EmptyState } from "@/components/ui";
import Link from "next/link";

interface SaleListEntry {
  id: string;
  customer: { name: string };
  date: string;
  totalRevenue: number;
  totalCost: number;
  margin: number;
  marginPercent: number;
  _count: { lineItems: number };
}

export default async function SalesPage() {
  const sales = await apiFetch<SaleListEntry[]>("/api/sales", []);

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
        <Table headers={["Customer", "Date", "Items", "Revenue", "Cost", "Margin", "Margin %"]}>
          {sales.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/dashboard/sales/${s.id}`} className="text-sm font-medium text-slate-900 hover:text-slate-700">
                  {s.customer.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{formatDate(s.date)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{s._count.lineItems}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(s.totalRevenue)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(s.totalCost)}</td>
              <td className="px-4 py-3">
                <span className={`text-sm font-medium ${s.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {s.margin >= 0 ? "+" : ""}{formatCurrency(s.margin)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-sm font-medium ${s.marginPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {s.marginPercent.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
