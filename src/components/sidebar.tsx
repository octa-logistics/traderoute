"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/warehouses", label: "Warehouses" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/inventory", label: "Inventory" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/shipments", label: "Shipments" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-gray-100 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">OctaShip</h1>
        <p className="text-xs text-gray-400 mt-1">Logistics Dashboard</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded text-sm ${
                isActive
                  ? "bg-gray-700 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
