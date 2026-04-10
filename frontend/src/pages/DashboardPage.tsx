import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StatCard, formatCurrency } from "@/components/ui";
import { apiFetch } from "@/lib/api";

interface DashboardData {
  totalItems: number;
  totalInventoryItems: number;
  totalSoldItems: number;
  totalInventoryValue: number;
  totalSoldRevenue: number;
  totalSoldCost: number;
  overallMarginPct: number;
  topCategoriesByMargin: Array<{
    categoryId: string;
    name: string;
    revenue: number;
    cost: number;
    margin: number;
    marginPct: number;
  }>;
}

const defaultStats: DashboardData = {
  totalItems: 0,
  totalInventoryItems: 0,
  totalSoldItems: 0,
  totalInventoryValue: 0,
  totalSoldRevenue: 0,
  totalSoldCost: 0,
  overallMarginPct: 0,
  topCategoriesByMargin: [],
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData>(defaultStats);

  useEffect(() => {
    apiFetch<DashboardData>("/dashboard/stats", defaultStats).then(setStats);
  }, []);

  const totalMargin = stats.totalSoldRevenue - stats.totalSoldCost;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your inventory and profit tracking</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Inventory Value"
          value={formatCurrency(stats.totalInventoryValue)}
          subtext={`${stats.totalInventoryItems} items in stock`}
          href="/dashboard/items"
        />
        <StatCard
          label="Items Tracked"
          value={stats.totalItems}
          subtext={`${stats.totalSoldItems} sold`}
          href="/dashboard/items"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalSoldRevenue)}
          subtext="From completed sales"
          href="/dashboard/sales"
        />
        <StatCard
          label="Overall Margin"
          value={`${stats.overallMarginPct.toFixed(1)}%`}
          subtext={`${formatCurrency(totalMargin)} net profit`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Margin by Category</h2>
            <Link to="/dashboard/categories" className="text-xs text-slate-500 hover:text-slate-700">View all</Link>
          </div>
          {stats.topCategoriesByMargin.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topCategoriesByMargin.map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                    <p className="text-xs text-slate-500">Revenue: {formatCurrency(cat.revenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${cat.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {cat.margin >= 0 ? "+" : ""}{formatCurrency(cat.margin)}
                    </p>
                    <p className={`text-xs ${cat.marginPct >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {cat.marginPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/dashboard/purchases/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-600">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Record Purchase</p>
                <p className="text-xs text-slate-500">Add items from a new deal</p>
              </div>
            </Link>
            <Link to="/dashboard/sales/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-600">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Record Sale</p>
                <p className="text-xs text-slate-500">Sell items from inventory</p>
              </div>
            </Link>
            <Link to="/dashboard/items"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-600">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Browse Inventory</p>
                <p className="text-xs text-slate-500">View all items and costs</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
