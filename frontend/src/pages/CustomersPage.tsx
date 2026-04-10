import { useState, useEffect } from "react";
import { Table, EmptyState, formatDate } from "@/components/ui";
import { apiFetch, apiPost } from "@/lib/api";

interface Customer {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  _count: { sales: number };
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Customer[]>("/customers", []).then(setCustomers);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const customer = await apiPost<Customer>("/customers", {
        name,
        contactEmail: email || null,
        contactPhone: phone || null,
        notes: notes || null,
      });
      setCustomers([customer, ...customers]);
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
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">{customers.length} customers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add Customer
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">New Customer</h2>
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
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50">{submitting ? "Adding..." : "Add Customer"}</button>
          </div>
        </form>
      )}

      {customers.length === 0 && !showForm ? (
        <EmptyState title="No customers yet" description="Add customers to start recording sales." />
      ) : customers.length > 0 && (
        <Table headers={["Name", "Contact", "Sales", "Added"]}>
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.name}</td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {c.contactEmail || c.contactPhone || "--"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{c._count?.sales ?? 0}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatDate(c.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
