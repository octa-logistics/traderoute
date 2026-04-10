import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiPost } from "@/lib/api";

interface SaleItem {
  itemId: string;
  itemName: string;
  salePrice: string;
  costBasis: number;
}

export default function NewSalePage() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItem[]>([{ itemId: "", itemName: "", salePrice: "", costBasis: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addItem() {
    setItems([...items, { itemId: "", itemName: "", salePrice: "", costBasis: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof SaleItem, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  const totalRevenue = items.reduce((sum, item) => sum + (parseFloat(item.salePrice) || 0), 0);
  const totalCost = items.reduce((sum, item) => sum + item.costBasis, 0);
  const estimatedMargin = totalRevenue - totalCost;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const sale = await apiPost<{ id: string }>("/sales", {
        customerId,
        date,
        notes: notes || null,
        lineItems: items.filter((i) => i.itemId).map((i) => ({
          itemId: i.itemId,
          salePrice: parseFloat(i.salePrice) || 0,
        })),
      });
      navigate(`/dashboard/sales/${sale.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link to="/dashboard/sales" className="text-sm text-slate-500 hover:text-slate-700">&larr; Sales</Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Record Sale</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Sale Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
              <input type="text" value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Select or enter customer ID"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Items to Sell</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">Revenue: <span className="font-medium text-slate-900">${totalRevenue.toFixed(2)}</span></span>
              <span className={`font-medium ${estimatedMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                Margin: {estimatedMargin >= 0 ? "+" : ""}${estimatedMargin.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  {i === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Item ID</label>}
                  <input type="text" value={item.itemId} onChange={(e) => updateItem(i, "itemId", e.target.value)}
                    placeholder="Enter item ID from inventory"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
                </div>
                <div className="col-span-3">
                  {i === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Sale Price</label>}
                  <input type="number" step="0.01" value={item.salePrice} onChange={(e) => updateItem(i, "salePrice", e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Margin</label>}
                  <p className={`py-2 text-sm font-medium ${(parseFloat(item.salePrice) || 0) - item.costBasis >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {item.costBasis > 0 ? `$${((parseFloat(item.salePrice) || 0) - item.costBasis).toFixed(2)}` : "--"}
                  </p>
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
          <Link to="/dashboard/sales"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors">
            {submitting ? "Recording..." : "Record Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}
