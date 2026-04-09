"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface NewItem {
  name: string;
  sku: string;
  allocatedCost: string;
  allocatedFees: string;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalPrice, setTotalPrice] = useState("");
  const [fees, setFees] = useState("");
  const [taxes, setTaxes] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<NewItem[]>([{ name: "", sku: "", allocatedCost: "", allocatedFees: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addItem() {
    setItems([...items, { name: "", sku: "", allocatedCost: "", allocatedFees: "" }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof NewItem, value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  const allocatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.allocatedCost) || 0), 0);
  const priceNum = parseFloat(totalPrice) || 0;
  const unallocated = priceNum - allocatedTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          date,
          totalPrice: parseFloat(totalPrice) || 0,
          fees: parseFloat(fees) || 0,
          taxes: parseFloat(taxes) || 0,
          notes: notes || null,
          items: items.filter((i) => i.name).map((i) => ({
            name: i.name,
            sku: i.sku || null,
            allocatedPurchaseCost: parseFloat(i.allocatedCost) || 0,
            allocatedFees: parseFloat(i.allocatedFees) || 0,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to create purchase deal");
      const deal = await res.json();
      router.push(`/dashboard/purchases/${deal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link href="/dashboard/purchases" className="text-sm text-slate-500 hover:text-slate-700">&larr; Purchase Deals</Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Purchase Deal</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Deal Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Deal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
              <input type="text" value={vendorId} onChange={(e) => setVendorId(e.target.value)}
                placeholder="Select or enter vendor ID"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Price</label>
              <input type="number" step="0.01" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fees</label>
              <input type="number" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Taxes</label>
              <input type="number" step="0.01" value={taxes} onChange={(e) => setTaxes(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Items</h2>
            {priceNum > 0 && (
              <p className={`text-xs font-medium ${Math.abs(unallocated) < 0.01 ? "text-green-600" : "text-amber-600"}`}>
                {Math.abs(unallocated) < 0.01 ? "Fully allocated" : `$${unallocated.toFixed(2)} unallocated`}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4">
                  {i === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>}
                  <input type="text" value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)}
                    placeholder="Item name"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">SKU</label>}
                  <input type="text" value={item.sku} onChange={(e) => updateItem(i, "sku", e.target.value)}
                    placeholder="Optional"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Cost</label>}
                  <input type="number" step="0.01" value={item.allocatedCost} onChange={(e) => updateItem(i, "allocatedCost", e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Fees</label>}
                  <input type="number" step="0.01" value={item.allocatedFees} onChange={(e) => updateItem(i, "allocatedFees", e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">&nbsp;</label>}
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)}
                      className="text-sm text-red-500 hover:text-red-700 px-3 py-2">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add another item
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/purchases"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors">
            {submitting ? "Creating..." : "Create Purchase Deal"}
          </button>
        </div>
      </form>
    </div>
  );
}
