import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { formatCurrency, formatDate } from "@/components/ui";
import { apiFetch } from "@/lib/api";

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
      allocatedPurchaseCost: number;
      allocatedFees: number;
    };
  }>;
  createdAt: string;
}

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<SaleDetail | null>(`/sales/${id}`, null).then((data) => {
      setSale(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (!sale) return <p className="text-slate-500">Sale not found.</p>;

  const totalRevenue = sale.lineItems.reduce((sum, li) => sum + li.salePrice, 0);
  const totalCost = sale.lineItems.reduce((sum, li) => sum + li.item.allocatedPurchaseCost + li.item.allocatedFees, 0);
  const totalMargin = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link to="/dashboard/sales" className="text-sm text-slate-500 hover:text-slate-700">&larr; Sales</Link>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sale to {sale.customer.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{formatDate(sale.date)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
          <p className={`text-sm font-medium ${totalMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalMargin >= 0 ? "+" : ""}{formatCurrency(totalMargin)} ({marginPercent.toFixed(1)}%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Est. Cost</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Est. Margin</p>
          <p className={`text-xl font-bold mt-1 ${totalMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalMargin >= 0 ? "+" : ""}{formatCurrency(totalMargin)}
          </p>
        </div>
      </div>

      {sale.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Notes</h2>
          <p className="text-sm text-slate-600">{sale.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Items Sold ({sale.lineItems.length})</h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Cost Basis</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Sale Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sale.lineItems.map((li) => {
              const itemCost = li.item.allocatedPurchaseCost + li.item.allocatedFees;
              const margin = li.salePrice - itemCost;
              return (
                <tr key={li.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/dashboard/items/${li.item.id}`} className="text-sm font-medium text-slate-900 hover:text-slate-700">
                      {li.item.name}
                    </Link>
                    {li.item.sku && <p className="text-xs text-slate-400">{li.item.sku}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{formatCurrency(itemCost)}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-900">{formatCurrency(li.salePrice)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {margin >= 0 ? "+" : ""}{formatCurrency(margin)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
