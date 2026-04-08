async function getStats() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const res = await fetch(`${backendUrl}/api/stats`, { cache: "no-store" });
  return res.json();
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Warehouses", value: stats.warehouses, href: "/dashboard/warehouses" },
    { label: "Products", value: stats.products, href: "/dashboard/products" },
    { label: "Orders", value: stats.orders, href: "/dashboard/orders" },
    { label: "Shipments", value: stats.shipments, href: "/dashboard/shipments" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
