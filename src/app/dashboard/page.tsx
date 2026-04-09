import { apiFetch } from "@/lib/fetch";
import { StatCard, formatCurrency, formatDate, StatusBadge } from "@/components/ui";
import Link from "next/link";

interface DashboardData {
  totalItems: number;
  itemsInStock: number;
  totalRevenue: number;
  overallMarginPercent: number;
  totalInventoryValue: number;
  recentPurchases: Array<{
    id: string;
    vendor: { name: string };
    date: string;
    totalPrice: number;
    _count: { items: number };
  }>;
  recentSales: Array<{
    id: string;
    customer: { name: string };
    date: string;
    lineItems: Array<{ salePrice: number }>;
  }>;
  itemsNeedingAttention: Array<{
    id: string;
    name: string;
    status: string;
    daysHeld: number;
    financingInterest: number;
    totalCost: number;
  }>;
}

const defaultStats: DashboardData = {
  totalItems: 0,
  itemsInStock: 0,
  totalRevenue: 0,
  overallMarginPercent: 0,
  totalInventoryValue: 0,
  recentPurchases: [],
  recentSales: [],
  itemsNeedingAttention: [],
};

export default async function DashboardPage() {
  const stats = await apiFetch<DashboardData>("/api/dashboard/stats", defaultStats);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your inventory and profit tracking</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Inventory Value"
          value={formatCurrency(stats.totalInventoryValue)}
          subtext={`${stats.itemsInStock} items in stock`}
          href="/dashboard/items"
        />
        <StatCard
          label="Items Tracked"
          value={stats.totalItems}
          subtext="All time"
          href="/dashboard/items"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtext="From completed sales"
          href="/dashboard/sales"
        />
        <StatCard
          label="Overall Margin"
          value={`${stats.overallMarginPercent.toFixed(1)}%`}
          subtext={stats.overallMarginPercent >= 0 ? "Profitable" : "Loss"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Purchases */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent Purchases</h2>
            <Link href="/dashboard/purchases" className="text-xs text-slate-500 hover:text-slate-700">View all</Link>
          </div>
          {stats.recentPurchases.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No purchases yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentPurchases.map((p) => (
                <Link key={p.id} href={`/dashboard/purchases/${p.id}`}
                  className="flex items-center justify-between py-2 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.vendor.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(p.date)} &middot; {p._count.items} items</p>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{formatCurrency(p.totalPrice)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent Sales</h2>
            <Link href="/dashboard/sales" className="text-xs text-slate-500 hover:text-slate-700">View all</Link>
          </div>
          {stats.recentSales.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No sales yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSales.map((s) => {
                const totalRevenue = s.lineItems.reduce((sum, li) => sum + li.salePrice, 0);
                return (
                  <Link key={s.id} href={`/dashboard/sales/${s.id}`}
                    className="flex items-center justify-between py-2 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.customer.name}</p>
                      <p className="text-xs text-slate-500">{formatDate(s.date)} &middot; {s.lineItems.length} items</p>
                    </div>
                    <p className="text-sm font-medium text-green-600">+{formatCurrency(totalRevenue)}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Items Needing Attention */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Items Needing Attention</h2>
        {stats.itemsNeedingAttention.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No items need attention right now</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 pb-2">Item</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-2">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 pb-2">Days Held</th>
                  <th className="text-right text-xs font-medium text-slate-500 pb-2">Interest Accrued</th>
                  <th className="text-right text-xs font-medium text-slate-500 pb-2">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.itemsNeedingAttention.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="py-2">
                      <Link href={`/dashboard/items/${item.id}`} className="text-sm font-medium text-slate-900 hover:text-slate-700">
                        {item.name}
                      </Link>
                    </td>
                    <td className="py-2"><StatusBadge status={item.status} /></td>
                    <td className="py-2 text-right text-sm text-slate-600">{item.daysHeld}d</td>
                    <td className="py-2 text-right text-sm text-amber-600">{formatCurrency(item.financingInterest)}</td>
                    <td className="py-2 text-right text-sm font-medium text-slate-900">{formatCurrency(item.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
