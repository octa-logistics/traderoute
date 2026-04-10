import { useState, useEffect } from "react";
import { Table, EmptyState, formatDate } from "@/components/ui";
import { apiFetch, apiPost } from "@/lib/api";

interface Vendor {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  _count: { purchaseDeals: number };
  createdAt: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Vendor[]>("/vendors", []).then(setVendors);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const vendor = await apiPost<Vendor>("/vendors", {
        name,
        contactEmail: email || null,
        contactPhone: phone || null,
        notes: notes || null,
      });
      setVendors([vendor, ...vendors]);
      setShowForm(false);
      setName(""); setEmail(""); setPhone(""); setNotes("");
    } catch {
      // handled silently
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="text-sm text-slate-500 mt-1">{vendors.length} vendors</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add Vendor
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">New Vendor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50">{submitting ? "Adding..." : "Add Vendor"}</button>
          </div>
        </form>
      )}

      {vendors.length === 0 && !showForm ? (
        <EmptyState title="No vendors yet" description="Add vendors to start recording purchase deals." />
      ) : vendors.length > 0 && (
        <Table headers={["Name", "Contact", "Deals", "Added"]}>
          {vendors.map((v) => (
            <tr key={v.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-slate-900">{v.name}</td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {v.contactEmail || v.contactPhone || "--"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{v._count?.purchaseDeals ?? 0}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatDate(v.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
