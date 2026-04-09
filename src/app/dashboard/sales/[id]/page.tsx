import { apiFetch } from "@/lib/fetch";
import { formatCurrency, formatDate } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

interface SaleDetail {
  id: string;
  customer: { id: string; name: string };
  date: string;
  notes: string | null;
  lineItems: Array<{
    id: string;
    salePrice: number;
    item: {
      id: string;
      name: string;
      sku: string | null;
      status: string;
      totalCost: number;
    };
    margin: number;
  }>;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPercent: number;
  createdAt: string;
}

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await apiFetch<SaleDetail | null>(`/api/sales/${id}`, null);

  if (!sale) return notFound();

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link href="/dashboard/sales" className="text-sm text-slate-500 hover:text-slate-700">&larr; Sales</Link>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sale to {sale.customer.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{formatDate(sale.date)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(sale.totalRevenue)}</p>
          <p className={`text-sm font-medium ${sale.totalMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
            {sale.totalMargin >= 0 ? "+" : ""}{formatCurrency(sale.totalMargin)} ({sale.marginPercent.toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(sale.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total Cost</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(sale.totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Net Margin</p>
          <p className={`text-xl font-bold mt-1 ${sale.totalMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
            {sale.totalMargin >= 0 ? "+" : ""}{formatCurrency(sale.totalMargin)}
          </p>
        </div>
      </div>

      {sale.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Notes</h2>
          <p className="text-sm text-slate-600">{sale.notes}</p>
        </div>
      )}

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Items Sold ({sale.lineItems.length})</h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Sale Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sale.lineItems.map((li) => (
              <tr key={li.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/items/${li.item.id}`} className="text-sm font-medium text-slate-900 hover:text-slate-700">
                    {li.item.name}
                  </Link>
                  {li.item.sku && <p className="text-xs text-slate-400">{li.item.sku}</p>}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">{formatCurrency(li.item.totalCost)}</td>
                <td className="px-4 py-3 text-right text-sm text-slate-900">{formatCurrency(li.salePrice)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-medium ${li.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {li.margin >= 0 ? "+" : ""}{formatCurrency(li.margin)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
