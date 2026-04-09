import { apiFetch } from "@/lib/fetch";
import { PageHeader, Table, StatusBadge, formatCurrency, EmptyState } from "@/components/ui";
import Link from "next/link";

interface ItemListEntry {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  category: { name: string } | null;
  allocatedPurchaseCost: number;
  allocatedFees: number;
  totalCost: number;
  daysHeld: number;
  financingInterest: number;
  saleLineItem: { salePrice: number } | null;
  margin: number | null;
  createdAt: string;
}

export default async function ItemsPage() {
  const items = await apiFetch<ItemListEntry[]>("/api/items", []);

  return (
    <div>
      <PageHeader
        title="Items"
        description={`${items.length} items tracked`}
        action={{ label: "Add Item", href: "/dashboard/items/new" }}
      />

      {items.length === 0 ? (
        <EmptyState
          title="No items yet"
          description="Items are created when you record a purchase deal."
          action={{ label: "Record a Purchase", href: "/dashboard/purchases/new" }}
        />
      ) : (
        <Table headers={["Item", "Status", "Category", "Cost Basis", "Days Held", "Interest", "Total Cost", "Margin"]}>
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/dashboard/items/${item.id}`} className="text-sm font-medium text-slate-900 hover:text-slate-700">
                  {item.name}
                </Link>
                {item.sku && <p className="text-xs text-slate-400 mt-0.5">{item.sku}</p>}
              </td>
              <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
              <td className="px-4 py-3 text-sm text-slate-600">{item.category?.name || "--"}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(item.allocatedPurchaseCost + item.allocatedFees)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{item.daysHeld}d</td>
              <td className="px-4 py-3 text-sm text-amber-600">{formatCurrency(item.financingInterest)}</td>
              <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrency(item.totalCost)}</td>
              <td className="px-4 py-3">
                {item.margin !== null ? (
                  <span className={`text-sm font-medium ${item.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {item.margin >= 0 ? "+" : ""}{formatCurrency(item.margin)}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">--</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
