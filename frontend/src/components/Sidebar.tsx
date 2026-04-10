import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/dashboard/items", label: "Items", icon: "box" },
  { href: "/dashboard/purchases", label: "Purchase Deals", icon: "shopping-cart" },
  { href: "/dashboard/sales", label: "Sales", icon: "trending-up" },
  { href: "/dashboard/vendors", label: "Vendors", icon: "truck" },
  { href: "/dashboard/customers", label: "Customers", icon: "users" },
  { href: "/dashboard/categories", label: "Categories", icon: "tag" },
];

const iconPaths: Record<string, React.ReactNode> = {
  grid: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  ),
  box: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  ),
  "shopping-cart": (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  ),
  "trending-up": (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  ),
  truck: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  ),
  users: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  ),
  tag: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z" />
  ),
};

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col">
      <div className="p-5 border-b border-slate-700/50">
        <h1 className="text-lg font-semibold tracking-tight text-white">TradeRoute</h1>
        <p className="text-xs text-slate-400 mt-0.5">Inventory & Profit Tracking</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-slate-700/70 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                {iconPaths[item.icon]}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-700/50">
        {user && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-300">Logout</button>
          </div>
        )}
        {!user && <p className="text-xs text-slate-500">TradeRoute Resellers</p>}
      </div>
    </aside>
  );
}
