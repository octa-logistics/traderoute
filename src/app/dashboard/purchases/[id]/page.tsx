import { apiFetch } from "@/lib/fetch";
import { StatusBadge, formatCurrency, formatDate } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PurchaseDetail {
  id: string;
  vendor: { id: string; name: string };
  date: string;
  totalPrice: number;
  fees: number;
  taxes: number;
  notes: string | null;
  items: Array<{
    id: string;
    name: string;
    sku: string | null;
    status: string;
    allocatedPurchaseCost: number;
    allocatedFees: number;
  }>;
  createdAt: string;
}

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await apiFetch<PurchaseDetail | null>(`/api/purchase-deals/${id}`, null);

  if (!deal) return notFound();

  const grandTotal = deal.totalPrice + deal.fees + deal.taxes;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link href="/dashboard/purchases" className="text-sm text-slate-500 hover:text-slate-700">&larr; Purchase Deals</Link>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase from {deal.vendor.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{formatDate(deal.date)}</p>
        </div>
        <p className="text-2xl font-bold text-slate-900">{formatCurrency(grandTotal)}</p>
      </div>

      {/* Deal Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Purchase Price</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(deal.totalPrice)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Fees & Taxes</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(deal.fees + deal.taxes)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Items in Deal</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{deal.items.length}</p>
        </div>
      </div>

      {deal.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Notes</h2>
          <p className="text-sm text-slate-600">{deal.notes}</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Items ({deal.items.length})</h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Allocated Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Allocated Fees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deal.items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/items/${item.id}`} className="text-sm font-medium text-slate-900 hover:text-slate-700">
                    {item.name}
                  </Link>
                  {item.sku && <p className="text-xs text-slate-400">{item.sku}</p>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-right text-sm text-slate-900">{formatCurrency(item.allocatedPurchaseCost)}</td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">{formatCurrency(item.allocatedFees)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
