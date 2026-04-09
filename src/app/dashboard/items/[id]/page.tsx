import { apiFetch } from "@/lib/fetch";
import { StatusBadge, formatCurrency, formatDate } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ItemDetail {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  status: string;
  category: { id: string; name: string } | null;
  storageLocation: { id: string; name: string } | null;
  purchaseDeal: { id: string; vendor: { name: string }; date: string } | null;
  allocatedPurchaseCost: number;
  allocatedFees: number;
  processingCost: number;
  financingInterest: number;
  daysHeld: number;
  totalCost: number;
  saleLineItem: { salePrice: number; sale: { id: string; customer: { name: string }; date: string } } | null;
  margin: number | null;
  processingLogs: Array<{
    id: string;
    description: string;
    cost: number;
    date: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await apiFetch<ItemDetail | null>(`/api/items/${id}`, null);

  if (!item) return notFound();

  const costBreakdown = [
    { label: "Purchase Cost", value: item.allocatedPurchaseCost },
    { label: "Allocated Fees", value: item.allocatedFees },
    { label: "Processing Costs", value: item.processingCost },
    { label: "Financing Interest", value: item.financingInterest, highlight: true },
    { label: "Total Cost", value: item.totalCost, bold: true },
  ];

  const statusSteps = ["ACQUIRED", "PROCESSING", "LISTED", "SOLD"];
  const currentStep = statusSteps.indexOf(item.status);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/items" className="text-sm text-slate-500 hover:text-slate-700">&larr; Items</Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{item.name}</h1>
          {item.sku && <p className="text-sm text-slate-500 mt-0.5">SKU: {item.sku}</p>}
          {item.description && <p className="text-sm text-slate-600 mt-2">{item.description}</p>}
        </div>
        <StatusBadge status={item.status} />
      </div>

      {/* Status Lifecycle */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Lifecycle</h2>
        <div className="flex items-center gap-0">
          {statusSteps.map((step, i) => {
            const isActive = i <= currentStep;
            const isCurrent = step === item.status;
            return (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
                  ${isCurrent ? "bg-slate-900 text-white" : isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                  {isActive && !isCurrent ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (i + 1)}
                </div>
                <p className={`text-xs ml-2 ${isCurrent ? "font-medium text-slate-900" : isActive ? "text-green-700" : "text-slate-400"}`}>
                  {step.charAt(0) + step.slice(1).toLowerCase()}
                </p>
                {i < statusSteps.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${i < currentStep ? "bg-green-300" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cost Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Cost Breakdown</h2>
          <div className="space-y-3">
            {costBreakdown.map((row) => (
              <div key={row.label} className={`flex justify-between items-center ${row.bold ? "pt-3 border-t border-slate-200" : ""}`}>
                <span className={`text-sm ${row.bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>{row.label}</span>
                <span className={`text-sm ${row.bold ? "font-bold text-slate-900" : row.highlight ? "text-amber-600 font-medium" : "text-slate-900"}`}>
                  {formatCurrency(row.value)}
                </span>
              </div>
            ))}
            {item.saleLineItem && (
              <>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-sm text-slate-600">Sale Price</span>
                  <span className="text-sm text-slate-900">{formatCurrency(item.saleLineItem.salePrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-900">Margin</span>
                  <span className={`text-sm font-bold ${(item.margin ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {(item.margin ?? 0) >= 0 ? "+" : ""}{formatCurrency(item.margin ?? 0)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Category</dt>
              <dd className="text-sm text-slate-900">{item.category?.name || "--"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Storage Location</dt>
              <dd className="text-sm text-slate-900">{item.storageLocation?.name || "--"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Days Held</dt>
              <dd className="text-sm text-slate-900">{item.daysHeld} days</dd>
            </div>
            {item.purchaseDeal && (
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Purchase Deal</dt>
                <dd className="text-sm">
                  <Link href={`/dashboard/purchases/${item.purchaseDeal.id}`} className="text-slate-900 hover:text-slate-700 underline">
                    {item.purchaseDeal.vendor.name} ({formatDate(item.purchaseDeal.date)})
                  </Link>
                </dd>
              </div>
            )}
            {item.saleLineItem && (
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Sold To</dt>
                <dd className="text-sm">
                  <Link href={`/dashboard/sales/${item.saleLineItem.sale.id}`} className="text-slate-900 hover:text-slate-700 underline">
                    {item.saleLineItem.sale.customer.name} ({formatDate(item.saleLineItem.sale.date)})
                  </Link>
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Added</dt>
              <dd className="text-sm text-slate-900">{formatDate(item.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Processing Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Processing Log</h2>
        {item.processingLogs.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No processing entries</p>
        ) : (
          <div className="space-y-2">
            {item.processingLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm text-slate-900">{log.description}</p>
                  <p className="text-xs text-slate-500">{formatDate(log.date)}</p>
                </div>
                <p className="text-sm font-medium text-slate-900">{formatCurrency(log.cost)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
